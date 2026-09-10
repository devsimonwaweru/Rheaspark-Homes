import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  quoteShortStay, createShortStayBooking, confirmShortStayBooking,
  initiateShortStayPayment, addNights, formatDate, formatKsh, todayISO,
  firstImage, cloudImg,
} from "../lib/shortStayUtils";

const NIGHT_OPTIONS = Array.from({ length: 30 }, (_, i) => i + 1);

export default function ShortStayBookingModal({ property, initialCheckIn = "", initialNights = 1, onClose, onBooked }) {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState("details"); // details | summary | payment | success
  const [form, setForm] = useState({
    guest_name: "", guest_phone: "", guest_email: "",
    check_in: initialCheckIn, nights: initialNights,
    favourite_drink: "", favourite_book: "",
  });
  const [quote, setQuote] = useState(null);
  const [booking, setBooking] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user?.email) setForm((f) => ({ ...f, guest_email: data.user.email }));
    });
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const checkOut = form.check_in ? addNights(form.check_in, form.nights) : null;
  const img = firstImage(property);

  async function handleContinue() {
    setError("");
    if (!form.guest_name.trim()) return setError("Please enter your full name.");
    if (!form.guest_phone.trim()) return setError("Please enter your phone number.");
    if (!form.check_in) return setError("Please select a check-in date.");
    setBusy(true);
    try {
      setQuote(await quoteShortStay(property.id, form.check_in, Number(form.nights)));
      setStep("summary");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handlePay() {
    setError("");
    setBusy(true);
    try {
      const b = await createShortStayBooking({
        propertyId: property.id,
        checkIn: form.check_in,
        nights: Number(form.nights),
        guestName: form.guest_name,
        guestPhone: form.guest_phone,
        guestEmail: form.guest_email,
        favouriteDrink: form.favourite_drink,
        favouriteBook: form.favourite_book,
      });
      setBooking(b);
      setStep("payment");

      const pay = await initiateShortStayPayment(b, form.guest_phone);
      if (!pay?.success) throw new Error("Payment was not completed. Your dates are held for 30 minutes.");

      const confirmed = await confirmShortStayBooking(b.booking_reference, pay.reference);
      setBooking(confirmed);
      setStep("success");
      onBooked?.(confirmed);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto animate-scale-in">

        <div className="p-5 bg-gradient-to-r from-blue-900 to-blue-800 rounded-t-3xl text-white flex items-center gap-4">
          {img && <img src={cloudImg(img, 200)} alt={property.title} className="w-16 h-14 object-cover rounded-xl" />}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold truncate">{property.title}</h3>
            <p className="text-xs text-blue-200 truncate">📍 {property.location} • {formatKsh(property.price_per_night)} / night</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors text-xl leading-none">✕</button>
        </div>

        <div className="p-6">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4">{error}</div>}

          {!user && (
            <div className="bg-yellow-50 border-2 border-yellow-100 text-yellow-800 p-4 rounded-xl text-sm mb-2">
              Please log in or create a Rheaspark account to book this stay.
            </div>
          )}

          {step === "details" && user && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
                <input value={form.guest_name} onChange={set("guest_name")} placeholder="e.g. Jane Njeri"
                  className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-xl p-3.5 outline-none transition-colors" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number *</label>
                  <input value={form.guest_phone} onChange={set("guest_phone")} placeholder="07XX XXX XXX"
                    className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-xl p-3.5 outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email (optional)</label>
                  <input type="email" value={form.guest_email} onChange={set("guest_email")}
                    className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-xl p-3.5 outline-none transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Check-in Date *</label>
                  <input type="date" min={todayISO()} value={form.check_in} onChange={set("check_in")}
                    className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-xl p-3.5 outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Number of Nights *</label>
                  <select value={form.nights} onChange={set("nights")}
                    className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-xl p-3.5 outline-none bg-white cursor-pointer">
                    {NIGHT_OPTIONS.map((n) => <option key={n} value={n}>{n} night{n > 1 ? "s" : ""}</option>)}
                  </select>
                </div>
              </div>
              {checkOut && (
                <p className="text-sm text-gray-500">Check-out: <strong className="text-gray-700">{formatDate(checkOut)}</strong></p>
              )}

              <p className="text-xs text-gray-400 pt-1">Optional — helps your host prepare a welcome touch:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Favourite Drink</label>
                  <input value={form.favourite_drink} onChange={set("favourite_drink")} placeholder="e.g. Kenyan chai"
                    className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-xl p-3.5 outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Favourite Book</label>
                  <input value={form.favourite_book} onChange={set("favourite_book")}
                    className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-xl p-3.5 outline-none transition-colors" />
                </div>
              </div>

              <button onClick={handleContinue} disabled={busy}
                className="w-full bg-gradient-to-r from-[#2FA4E7] to-[#3CB371] text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50">
                {busy ? "Checking availability…" : "Continue"}
              </button>
            </div>
          )}

          {step === "summary" && quote && (
            <div>
              <div className="border-2 border-gray-100 rounded-2xl p-5 space-y-1">
                <Row label="Check-in" value={formatDate(form.check_in)} />
                <Row label="Check-out" value={formatDate(quote.check_out_date)} />
                <Row label="Nights" value={form.nights} />
                <Row label={`Accommodation (${formatKsh(quote.price_per_night)} × ${form.nights})`} value={formatKsh(quote.accommodation_amount)} />
                <Row label="Rheaspark service fee" value={formatKsh(quote.service_fee)} />
                <div className="border-t-2 border-gray-100 mt-3 pt-3 flex justify-between font-extrabold text-lg text-gray-800">
                  <span>Total</span>
                  <span className="text-emerald-600">{formatKsh(quote.total_amount)}</span>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setStep("details")}
                  className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors">
                  Back
                </button>
                <button onClick={handlePay} disabled={busy}
                  className="flex-[2] bg-gradient-to-r from-[#2FA4E7] to-[#3CB371] text-white font-bold py-3 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50">
                  {busy ? "Processing…" : `Pay ${formatKsh(quote.total_amount)}`}
                </button>
              </div>
            </div>
          )}

          {step === "payment" && booking && (
            <div className="text-center py-8">
              <svg className="animate-spin h-10 w-10 text-[#2FA4E7] mx-auto mb-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <h3 className="text-lg font-bold text-gray-800 mb-1">Complete your payment</h3>
              <p className="text-gray-500 text-sm">{formatKsh(booking.total_amount)} • Ref <strong>{booking.booking_reference}</strong></p>
              <p className="text-gray-400 text-sm mt-2">Check your phone and enter your PIN to approve the payment.</p>
            </div>
          )}

          {step === "success" && booking && (
            <div className="text-center">
              <div className="text-5xl mb-2">🎉</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Booking Confirmed</h2>
              <div className="inline-block bg-blue-50 text-blue-900 font-extrabold tracking-wider px-5 py-2.5 rounded-xl">{booking.booking_reference}</div>
              <div className="border-2 border-gray-100 rounded-2xl p-5 mt-5 space-y-1 text-left">
                <Row label="Property" value={property.title} />
                <Row label="Check-in" value={formatDate(booking.check_in_date)} />
                <Row label="Check-out" value={formatDate(booking.check_out_date)} />
                <Row label="Nights" value={booking.number_of_nights} />
                <div className="border-t-2 border-gray-100 mt-3 pt-3 flex justify-between font-extrabold">
                  <span className="text-gray-800">Amount Paid</span>
                  <span className="text-emerald-600">{formatKsh(booking.total_amount)}</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                🗺️ Property directions and your host's contact details are now in <strong>My Short-Stay Bookings</strong>.
              </p>
              <button onClick={onClose}
                className="w-full mt-4 bg-blue-900 text-white font-bold py-3 rounded-xl hover:bg-blue-800 transition-colors">
                Done
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes scale-in { 0% { transform: scale(0.95); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .animate-scale-in { animation: scale-in 0.2s ease-out forwards; }`}</style>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-sm py-1.5">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-800">{value}</span>
    </div>
  );
}