import { supabase } from './supabaseClient';

/* ── Image helpers (images is a TEXT column — mirrors PropertyCard's parser) ── */
export function parseImages(raw, fallbackUrl) {
  let sources = [];
  if (raw) {
    try {
      if (typeof raw === 'string' && (raw.startsWith('[') || raw.startsWith('{'))) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) sources = parsed;
      } else if (typeof raw === 'string') {
        const matches = raw.match(/https?:\/\/[^,}]+/g);
        if (matches) sources = matches;
      }
    } catch {
      if (typeof raw === 'string') sources = raw.split(',').map((s) => s.trim());
    }
  }
  if (sources.length === 0 && fallbackUrl) sources.push(fallbackUrl);
  return sources.filter(Boolean);
}

export const firstImage = (p) => (p ? parseImages(p.images, p.image_url)[0] : null);

export const cloudImg = (url, width = 400) =>
  url ? `https://res.cloudinary.com/deqowfv7y/image/fetch/f_auto,q_auto,w_${width}/${url}` : url;

/* ── Date & money helpers ─────────────────────────────────────── */
export const todayISO = () => new Date().toISOString().slice(0, 10);

export const addNights = (isoDate, n) => {
  const d = new Date(isoDate + 'T00:00:00');
  d.setDate(d.getDate() + Number(n));
  return d.toISOString().slice(0, 10);
};

export const formatDate = (iso) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  });

export const formatKsh = (n) => 'KES ' + Number(n || 0).toLocaleString();

/* ── Property fetching ────────────────────────────────────────── */
export async function fetchShortStayProperties(search = '') {
  let q = supabase
    .from('properties')
    .select('*')
    .in('listing_type', ['short_stay', 'both'])
    .not('price_per_night', 'is', null)
    .eq('status', 'active');

  if (search) {
    q = q.or(`location.ilike.%${search}%,town.ilike.%${search}%,county.ilike.%${search}%`);
  }

  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

/* ── Server-side quote (never trust frontend prices) ── */
export async function quoteShortStay(propertyId, checkIn, nights) {
  const { data, error } = await supabase.rpc('quote_short_stay', {
    p_property_id: propertyId, p_check_in: checkIn, p_nights: nights,
  });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error('Could not calculate price for those dates');
  return row;
}

/* ── Booking lifecycle ────────────────────────────────────────── */
export async function createShortStayBooking(payload) {
  const { data, error } = await supabase.rpc('create_short_stay_booking', {
    p_property_id: payload.propertyId, p_check_in: payload.checkIn, p_nights: payload.nights,
    p_guest_name: payload.guestName, p_guest_phone: payload.guestPhone,
    p_guest_email: payload.guestEmail || null,
    p_favourite_drink: payload.favouriteDrink || null,
    p_favourite_book: payload.favouriteBook || null,
  });
  if (error) throw new Error(error.message);
  return Array.isArray(data) ? data[0] : data;
}

export async function confirmShortStayBooking(reference, paymentRef = null) {
  const { data, error } = await supabase.rpc('confirm_short_stay_booking', {
    p_reference: reference, p_payment_ref: paymentRef,
  });
  if (error) throw new Error(error.message);
  return Array.isArray(data) ? data[0] : data;
}

export async function cancelShortStayBooking(reference) {
  const { data, error } = await supabase.rpc('cancel_short_stay_booking', { p_reference: reference });
  if (error) throw new Error(error.message);
  return Array.isArray(data) ? data[0] : data;
}

export async function getMyShortStayBookings() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('short_stay_bookings')
    .select('*, property:properties(id, title, location, images, image_url, county, town)')
    .eq('guest_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getLandlordShortStayBookings() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('short_stay_bookings')
    .select('*, property:properties(id, title, location, images, image_url)')
    .eq('landlord_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

/* ── PAYMENT ──────────────────────────────────────────────────── */
// true  = simulate a successful payment (for testing the full flow, no charges)
// false = real Intasend STK push via your existing edge functions
const DEV_SIMULATE_PAYMENT = true;

export async function initiateShortStayPayment(booking, guestPhone) {
  if (DEV_SIMULATE_PAYMENT) {
    await new Promise((r) => setTimeout(r, 1500));
    return { success: true, reference: 'SIM-' + Date.now() };
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Session expired. Please log in again.');

  // 1) STK push via your existing edge function
  const { data, error: funcError } = await supabase.functions.invoke('initiate-payment', {
    body: {
      phone: guestPhone,
      type: 'short_stay_booking',
      amount: booking.total_amount,
      userId: session.user.id,
      property_id: booking.property_id,
    },
  });

  if (funcError) {
    let msg = 'Server error. Please try again.';
    if (funcError.context) {
      try {
        const errorData = await funcError.context.clone().json();
        msg = errorData.error || msg;
      } catch { /* keep default */ }
    }
    throw new Error(msg);
  }
  if (data?.error) throw new Error(data.error);
  if (!data?.payment_id) throw new Error('Payment could not be started. Please try again.');

  // 2) Poll verify-payment every 3s, up to 90s
  const deadline = Date.now() + 90 * 1000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 3000));
    try {
      const { data: v, error: vErr } = await supabase.functions.invoke('verify-payment', {
        body: { paymentId: data.payment_id },
      });
      if (vErr) continue;
      if (v?.status === 'paid') return { success: true, reference: String(data.payment_id) };
      if (v?.status === 'failed') return { success: false };
    } catch { /* keep polling */ }
  }
  return { success: false };
}