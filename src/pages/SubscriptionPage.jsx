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
  const [paymentId, setPaymentId] = useState(null); // Store current payment ID

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
      } else {
        setUser(session.user);
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
      setError("Please enter your phone number.");
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
            type: 'subscription',
            userId: user.id 
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Payment failed to initialize");
      }

      alert("STK Push sent! Please check your phone.");
      setPaymentId(data.payment_id); // Save ID for manual check
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
          setError("Payment failed.");
          setProcessing(false);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setError("Automatic check timed out. Use button below if you paid.");
          // Don't stop processing entirely, let them click manual button
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
            alert("Not confirmed yet. If you paid, wait 10 seconds and try again.");
        }
    } catch (e) {
        console.error(e);
        alert("Error checking payment.");
    }
  };

  const handleSuccess = () => {
    alert("Success! Account Activated.");
    setProcessing(false);
    navigate('/landlord'); 
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
           <h1 className="text-3xl font-bold text-gray-800">Activate Your Account</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-blue-600 to-emerald-500 text-white text-center">
            <p className="text-sm uppercase tracking-wider opacity-80">Landlord Plan</p>
            <h2 className="text-4xl font-bold my-2">KES 50<span className="text-lg font-normal">/mo</span></h2>
          </div>

          <div className="p-6 space-y-4">
             <ul className="space-y-3">
              <li className="flex items-center text-gray-700">
                <svg className="w-5 h-5 mr-3 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                Post unlimited properties
              </li>
            </ul>

            <div className="pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">M-Pesa Phone Number</label>
              <input 
                type="tel" 
                placeholder="e.g 0712345678"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={processing}
              />
            </div>

            {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">{error}</p>}

            <button
              onClick={handlePayment}
              disabled={processing}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center"
            >
              {processing ? "Processing..." : "Pay & Activate"}
            </button>

            {/* MANUAL CHECK BUTTON - ONLY SHOWS WHEN PROCESSING */}
            {processing && (
              <button
                onClick={handleManualCheck}
                className="w-full mt-2 text-blue-600 border border-blue-200 hover:bg-blue-50 font-medium py-3 rounded-xl transition-all text-sm"
              >
                I have paid, verify now
              </button>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}