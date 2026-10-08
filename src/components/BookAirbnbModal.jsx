/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';

export default function BookAirbnbModal({ isOpen, onClose, airbnb, feeSettings: propFeeSettings }) {
  const [step, setStep] = useState('idle');
  const [phone, setPhone] = useState('');
  const [paymentId, setPaymentId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [pollCount, setPollCount] = useState(0);
  const [session, setSession] = useState(null);
  const [serverFeeAmount, setServerFeeAmount] = useState(null);
  const [liveFeeSettings, setLiveFeeSettings] = useState(null);
  const [fetchingFee, setFetchingFee] = useState(false);
  const [manualChecking, setManualChecking] = useState(false);
  const pollRef = useRef(null);
  const consecutiveErrorsRef = useRef(0);
  const channelRef = useRef(null);

  // ==========================================================
  // ON OPEN: reset state, get session, fetch fee settings
  // ==========================================================
  useEffect(() => {
    if (isOpen) {
      setStep('idle');
      setPhone('');
      setPaymentId(null);
      setErrorMsg('');
      setPollCount(0);
      setServerFeeAmount(null);
      consecutiveErrorsRef.current = 0;

      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
      });

      fetchLiveFeeSettings();
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [isOpen]);

  // ==========================================================
  // REALTIME: Listen for payment status changes in the DB
  // Fires INSTANTLY when the webhook updates payment to "paid"
  // ==========================================================
  useEffect(() => {
    if (!paymentId || !isOpen) return;

    console.log('Subscribing to Realtime for payment:', paymentId);

    // Clean up any existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel('payment-status-' + paymentId)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'payments',
          filter: 'id=eq.' + paymentId,
        },
        (payload) => {
          console.log('Realtime update received:', payload.new.status);

          if (payload.new.status === 'paid') {
            if (pollRef.current) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
            setStep('success');
          } else if (payload.new.status === 'failed') {
            if (pollRef.current) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
            setErrorMsg('Payment failed or was cancelled.');
            setStep('failed');
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [paymentId, isOpen]);

  const fetchLiveFeeSettings = async () => {
    setFetchingFee(true);
    try {
      const { data, error } = await supabase
        .from('short_stay_settings')
        .select('fee_type, fee_value')
        .eq('id', 1)
        .maybeSingle();

      if (!error && data) {
        setLiveFeeSettings(data);
      } else {
        setLiveFeeSettings(null);
      }
    } catch (err) {
      console.error('Error fetching fee settings:', err);
      setLiveFeeSettings(null);
    } finally {
      setFetchingFee(false);
    }
  };

  if (!isOpen || !airbnb) return null;

  const price = Number(airbnb.price_per_night) || 0;

  const displayFee = liveFeeSettings
    ? liveFeeSettings.fee_type === 'percentage'
      ? Math.round((Number(liveFeeSettings.fee_value) / 100) * price)
      : Math.round(Number(liveFeeSettings.fee_value))
    : 0;

  const bookingFee = serverFeeAmount !== null ? serverFeeAmount : displayFee;

  const contactInfo = airbnb.contact_info || {};
  const hostPhone = contactInfo.whatsapp || contactInfo.phone || airbnb.host?.phone || '';

  const buildWhatsappUrl = () => {
    const cleanPhone = String(hostPhone).replace(/\D/g, '');
    const message = `Hello ${airbnb.name}, I have been referred by rheaspark to your bnb. I would like to book and stay for the following dates: `;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const normalizePhone = (raw) => {
    let p = String(raw).replace(/\s+/g, '').trim();
    if (p.startsWith('+')) p = p.substring(1);
    if (p.startsWith('07')) p = '254' + p.substring(1);
    else if (p.startsWith('01')) p = '254' + p.substring(1);
    return p;
  };

  const isValidPhone = (raw) => {
    const p = normalizePhone(raw);
    return /^2547\d{8}$/.test(p) || /^2541\d{8}$/.test(p);
  };

  // ==========================================================
  // CHECK PAYMENT STATUS (used by both polling and manual check)
  // ==========================================================
  const checkPaymentStatus = async (pid) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-payment`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ paymentId: pid }),
        }
      );

      if (!response.ok) {
        console.error('Verify error: HTTP', response.status);
        return false;
      }

      const data = await response.json();

      if (data?.status === 'paid') {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
        setStep('success');
        return true;
      }

      if (data?.status === 'failed') {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
        setErrorMsg('Payment failed or was cancelled. Please try again.');
        setStep('failed');
        return true;
      }

      return false;
    } catch (err) {
      console.error('Check error:', err);
      return false;
    }
  };

  // ==========================================================
  // INITIATE PAYMENT
  // ==========================================================
  const handlePay = async () => {
    if (!session) {
      setErrorMsg('Please log in to book this Airbnb.');
      setStep('error');
      return;
    }

    if (!hostPhone) {
      setErrorMsg('This listing does not have a host contact number. Please try another listing.');
      setStep('error');
      return;
    }

    if (!liveFeeSettings) {
      setErrorMsg('Booking fee is not configured. Please contact support.');
      setStep('error');
      return;
    }

    if (!isValidPhone(phone)) {
      setErrorMsg('Please enter a valid Safaricom number (e.g. 0712345678)');
      return;
    }

    setStep('initiating');
    setErrorMsg('');

    try {
      const normalizedPhone = normalizePhone(phone);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/initiate-payment`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            phone: normalizedPhone,
            userId: session.user.id,
            airbnb_id: airbnb.id,
            type: 'airbnb_booking',
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data?.success) {
        const realError = data?.error || data?.intasend_error || `Payment failed (${response.status})`;
        console.error('Payment initiation failed:', response.status, data);
        throw new Error(realError);
      }

      if (data.amount !== undefined) {
        setServerFeeAmount(data.amount);
      }

      setPaymentId(data.payment_id);
      setStep('waiting');
      setPollCount(0);
      consecutiveErrorsRef.current = 0;
      startPolling(data.payment_id);
    } catch (err) {
      console.error('Payment initiation error:', err);
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setStep('error');
    }
  };

  // ==========================================================
  // POLLING (backup to Realtime)
  // ==========================================================
  const startPolling = (pid) => {
    if (pollRef.current) clearInterval(pollRef.current);

    let attempts = 0;
    const maxAttempts = 30;

    pollRef.current = setInterval(async () => {
      attempts++;
      setPollCount(attempts);

      const resolved = await checkPaymentStatus(pid);

      if (!resolved && attempts >= maxAttempts) {
        clearInterval(pollRef.current);
        pollRef.current = null;
        setErrorMsg(
          'Payment confirmation is taking longer than expected. ' +
          'If you completed the M-Pesa payment, click "I\'ve Paid — Check Now" below. ' +
          'If money was deducted, your booking is being processed.'
        );
        setStep('failed');
      }
    }, 5000);
  };

  // ==========================================================
  // MANUAL CHECK (user clicks "I've Paid")
  // ==========================================================
  const handleManualCheck = async () => {
    if (!paymentId) return;
    setManualChecking(true);
    const resolved = await checkPaymentStatus(paymentId);
    if (!resolved) {
      setErrorMsg('Payment not confirmed yet. If you\'ve completed the M-Pesa payment, please wait a moment and try again. You can also contact support if you believe this is an error.');
    }
    setManualChecking(false);
  };

  const handleRetry = () => {
    setStep('idle');
    setErrorMsg('');
    setPaymentId(null);
    setPollCount(0);
    setServerFeeAmount(null);
    consecutiveErrorsRef.current = 0;
    fetchLiveFeeSettings();
  };

  const handleClose = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Book This Airbnb</h2>
            <p className="text-sm text-gray-500 truncate">{airbnb.name}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* ============ STEP: IDLE ============ */}
          {step === 'idle' && (
            <>
              {/* Listing summary */}
              <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  {airbnb.image_url ? (
                    <img src={airbnb.image_url} alt={airbnb.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{airbnb.name}</p>
                  <p className="text-xs text-gray-500">{airbnb.location}</p>
                  <p className="text-sm font-bold text-teal-600 mt-1">KES {price.toLocaleString()}<span className="text-xs text-gray-400 font-normal"> / night</span></p>
                </div>
              </div>

              {/* Fee box */}
              {fetchingFee ? (
                <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-center gap-2 text-sm text-gray-400">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-400 rounded-full animate-spin"></div>
                  Loading booking fee...
                </div>
              ) : liveFeeSettings ? (
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-teal-700">Booking Fee</span>
                    <span className="text-2xl font-extrabold text-teal-700">KES {displayFee.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-teal-600">
                    {liveFeeSettings.fee_type === 'percentage'
                      ? `${liveFeeSettings.fee_value}% of nightly price (KES ${price.toLocaleString()})`
                      : 'Fixed platform fee set by admin'
                    }
                  </p>
                  <p className="text-xs text-teal-500 mt-2 pt-2 border-t border-teal-200">
                    Pay this fee via M-Pesa to unlock the host's WhatsApp contact. You'll then chat directly with the host to confirm your dates.
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-sm font-semibold text-red-700">Booking fee not configured</p>
                  </div>
                  <p className="text-xs text-red-500">
                    The platform admin needs to set a booking fee before guests can book. Please check back later or contact support.
                  </p>
                </div>
              )}

              {/* Phone input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">M-Pesa Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0712345678"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-800 focus:border-teal-500 outline-none transition-colors text-lg"
                  onKeyDown={(e) => { if (e.key === 'Enter') handlePay(); }}
                />
                <p className="text-xs text-gray-400 mt-1">You'll receive an M-Pesa STK push prompt on this number.</p>
              </div>

              {/* Login prompt */}
              {!session && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700 flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <span>Please <Link to="/login" className="font-bold underline">log in</Link> to proceed with booking.</span>
                </div>
              )}

              {/* Pay button */}
              <button
                onClick={handlePay}
                disabled={!phone || !isValidPhone(phone) || fetchingFee || !liveFeeSettings}
                className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {liveFeeSettings ? `Pay KES ${displayFee.toLocaleString()} & Book` : 'Booking Unavailable'}
              </button>
            </>
          )}

          {/* ============ STEP: INITIATING ============ */}
          {step === 'initiating' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600 mx-auto mb-4"></div>
              <p className="text-gray-700 font-semibold">Sending M-Pesa prompt...</p>
              <p className="text-sm text-gray-400 mt-1">Please wait while we initiate your payment.</p>
            </div>
          )}

          {/* ============ STEP: WAITING ============ */}
          {step === 'waiting' && (
            <div className="text-center py-6 space-y-4">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-75"></div>
                <div className="relative w-20 h-20 rounded-full bg-green-500 flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.288a11.043 11.043 0 005.516 5.516l1.288-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
              </div>

              <div>
                <p className="text-gray-800 font-bold text-lg">Check your phone</p>
                <p className="text-sm text-gray-500 mt-1">
                  Enter your M-Pesa PIN to authorize the payment of <span className="font-bold text-teal-600">KES {bookingFee.toLocaleString()}</span>
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-center gap-2 text-sm text-blue-600">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Waiting for confirmation... ({pollCount}/30)</span>
              </div>

              <p className="text-xs text-gray-400">
                Don't close this page until you've entered your M-Pesa PIN.
              </p>

              {/* I've Paid button — manual check */}
              <button
                onClick={handleManualCheck}
                disabled={manualChecking}
                className="w-full flex items-center justify-center gap-2 bg-green-50 border-2 border-green-300 text-green-700 font-semibold py-2.5 px-4 rounded-xl hover:bg-green-100 transition-all disabled:opacity-50"
              >
                {manualChecking ? (
                  <>
                    <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                    Checking...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    I've Paid — Check Now
                  </>
                )}
              </button>
            </div>
          )}

          {/* ============ STEP: SUCCESS ============ */}
          {step === 'success' && (
            <div className="text-center py-6 space-y-5">
              <div className="relative w-20 h-20 mx-auto">
                <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              <div>
                <p className="text-gray-800 font-bold text-xl">Payment Confirmed!</p>
                <p className="text-sm text-gray-500 mt-1">
                  You've paid KES {bookingFee.toLocaleString()} booking fee.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.149-.197.297-.767.967-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
                  </svg>
                  <p className="font-semibold text-green-700">Host's WhatsApp is now unlocked!</p>
                </div>
                <p className="text-xs text-green-600">
                  Click below to chat with the host directly on WhatsApp. Mention your preferred dates and they'll confirm availability.
                </p>
              </div>

              <a
                href={buildWhatsappUrl()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleClose}
                className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all hover:shadow-lg"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.149-.197.297-.767.967-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                Chat with Host on WhatsApp
              </a>

              <p className="text-xs text-gray-400">
                The message will be pre-filled — just add your dates and send.
              </p>
            </div>
          )}

          {/* ============ STEP: FAILED ============ */}
          {step === 'failed' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
                <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l0 4m0-8h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-800 font-bold text-lg">Still checking...</p>
                <p className="text-sm text-gray-500 mt-1">{errorMsg}</p>
              </div>
              {/* Manual check button on failed state too */}
              {paymentId && (
                <button
                  onClick={handleManualCheck}
                  disabled={manualChecking}
                  className="w-full flex items-center justify-center gap-2 bg-green-50 border-2 border-green-300 text-green-700 font-semibold py-2.5 px-4 rounded-xl hover:bg-green-100 transition-all disabled:opacity-50"
                >
                  {manualChecking ? (
                    <>
                      <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                      Checking...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      I've Paid — Check Now
                    </>
                  )}
                </button>
              )}
              <button
                onClick={handleRetry}
                className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.582m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Try Again
              </button>
            </div>
          )}

          {/* ============ STEP: ERROR ============ */}
          {step === 'error' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <p className="text-gray-800 font-bold text-lg">Something went wrong</p>
                <p className="text-sm text-gray-500 mt-1">{errorMsg}</p>
              </div>
              {!session && (
                <Link to="/login" className="block w-full text-center bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-all">
                  Log In
                </Link>
              )}
              {session && (
                <button
                  onClick={handleRetry}
                  className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-all"
                >
                  Try Again
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer note */}
        {step === 'idle' && (
          <div className="px-5 pb-5">
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-400 flex items-start gap-2">
              <svg className="w-4 h-4 flex-shrink-0 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>The booking fee is paid to Rheaspark to facilitate the connection between you and the host. The nightly rate is paid directly to the host on arrival or as arranged with them.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}