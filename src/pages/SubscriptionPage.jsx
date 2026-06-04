// src/pages/SubscriptionPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState(null);
  const [paymentId, setPaymentId] = useState(null); 

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
      } else {
        setUser(session.user);
        // Check if already subscribed
        const { data: landlord } = await supabase
          .from('landlords')
          .select('subscription_status')
          .eq('id', session.user.id)
          .single();
        
        if (landlord?.subscription_status === 'active') {
          navigate('/landlord');
        }
      }
      setLoading(false);
    };
    checkUser();
  }, [navigate]);

  const handlePayment = async () => {
    if (!phone) {
      setError("Please enter your M-Pesa phone number.");
      return;
    }
    
    setProcessing(true);
    setError(null);
    setPaymentId(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/initiate-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY 
          },
          body: JSON.stringify({ 
            phone: phone, 
            // Sending 'subscription' type. 
            // NOTE: Ensure your backend/Supafunction handles the amount logic. 
            // If your backend forces a specific amount, update it there to 1199.
            type: 'subscription', 
            userId: user.id 
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Payment failed to initialize");
      }

      alert("STK Push sent! Please check your phone and enter PIN.");
      setPaymentId(data.payment_id); 
      pollPaymentStatus(data.payment_id);

    } catch (err) {
      console.error("Payment Error:", err);
      setError(err.message);
      setProcessing(false);
    }
  };

  const pollPaymentStatus = async (pId) => {
    let attempts = 0;
    const maxAttempts = 60; 
    
    const interval = setInterval(async () => {
      attempts++;
      try {
        const { data: payment, error: pollError } = await supabase
          .from('payments')
          .select('status')
          .eq('id', pId)
          .single();

        if (pollError) throw pollError;

        if (payment?.status === 'paid') {
          clearInterval(interval);
          handleSuccess(); 
        } else if (payment?.status === 'failed') {
          clearInterval(interval);
          setError("Payment failed or cancelled.");
          setProcessing(false);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setError("Verification timed out. Please use the button below if you paid.");
        }
      } catch (e) { 
        console.error("Polling error:", e); 
      }
    }, 2000);
  };

  const handleManualCheck = async () => {
    if (!paymentId) return;
    
    try {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-payment`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY 
            },
            body: JSON.stringify({ paymentId })
        });
        const data = await res.json();
        
        if (data.status === 'paid') {
            handleSuccess();
        } else {
            alert("Not confirmed yet. If you paid, please wait 10 seconds and try again.");
        }
    } catch (e) {
        console.error(e);
        alert("Error checking payment status.");
    }
  };

  const handleSuccess = () => {
    alert("Success! Account Activated.");
    setProcessing(false);
    navigate('/landlord'); 
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col items-center justify-center p-4 relative">
      
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500 rounded-full filter blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-lg">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">
            Go Pro
          </h1>
          <p className="text-indigo-200">
            Unlock the full power of property management.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          
          {/* Price Header */}
          <div className="p-8 text-center border-b border-white/10 bg-gradient-to-r from-blue-600/20 to-indigo-600/20">
            <span className="inline-block bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full uppercase mb-4 shadow-sm">
              Limited Offer
            </span>
            <div className="flex items-end justify-center text-white">
              <span className="text-2xl font-medium mr-1">KES</span>
              <span className="text-6xl font-extrabold tracking-tight">1,199</span>
            </div>
            <p className="text-indigo-100 mt-2 text-sm font-medium">Per Property / Month</p>
            <p className="text-xs text-indigo-300 mt-1">1st Month FREE on subscription</p>
          </div>

          {/* Features */}
          <div className="p-8 space-y-6">
            <ul className="space-y-4">
              {[
                "Automated Rent Collection (M-Pesa)",
                "Tenant Onboarding Links",
                "Real-time Dashboard & Reports",
                "Vacancy & Occupancy Tracking",
                "Priority Support"
              ].map((feature, i) => (
                <li key={i} className="flex items-center text-white">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center mr-3 flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span className="text-sm font-medium opacity-90">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Payment Form */}
            <div className="pt-6 border-t border-white/10">
              <label className="block text-sm font-medium text-indigo-100 mb-2">M-Pesa Phone Number</label>
              <input 
                type="tel" 
                placeholder="e.g 0712345678"
                className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={processing}
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-400/30 text-red-200 text-sm p-3 rounded-xl text-center">
                {error}
              </div>
            )}

            <button
              onClick={handlePayment}
              disabled={processing}
              className="w-full bg-white text-indigo-700 font-bold py-4 rounded-xl shadow-lg hover:bg-indigo-50 transition-all disabled:opacity-50 flex items-center justify-center text-lg"
            >
              {processing ? (
                <svg className="animate-spin h-6 w-6 text-indigo-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : (
                "Pay Now"
              )}
            </button>

            {processing && (
              <button
                onClick={handleManualCheck}
                className="w-full mt-2 text-indigo-200 border border-white/20 hover:bg-white/10 font-medium py-3 rounded-xl transition-all text-sm"
              >
                I have paid, verify now
              </button>
            )}

          </div>
        </div>
        
        <p className="text-center text-indigo-300 text-xs mt-6 opacity-70">
          Secure payments powered by IntaSend.
        </p>
      </div>
    </div>
  );
}