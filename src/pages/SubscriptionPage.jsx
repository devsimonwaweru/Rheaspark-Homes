/* eslint-disable no-unused-vars */
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

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
      } else {
        setUser(session.user);
        // Check if already active
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
    
    // Basic phone validation (optional but good)
    if (phone.length < 9) {
        setError("Please enter a valid phone number.");
        return;
    }

    setProcessing(true);
    setError(null);

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
      // Start polling for the result
      pollPaymentStatus(data.payment_id);

    } catch (err) {
      console.error("Payment Error:", err);
      setError(err.message);
      setProcessing(false);
    }
  };

  const pollPaymentStatus = async (paymentId) => {
    let attempts = 0;
    const maxAttempts = 60; // Poll for 2 minutes (60 * 2 seconds)
    
    const interval = setInterval(async () => {
      attempts++;
      try {
        const { data: payment, error: pollError } = await supabase
          .from('payments')
          .select('status')
          .eq('id', paymentId)
          .single();

        if (pollError) throw pollError;

        if (payment?.status === 'paid') {
          clearInterval(interval);
          // The DB Trigger already activated the account.
          // Just redirect the user.
          handleSuccess(); 
        } else if (payment?.status === 'failed') {
          clearInterval(interval);
          setError("Payment failed. Please try again.");
          setProcessing(false);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setError("Payment timed out. Check your M-Pesa messages.");
          setProcessing(false);
        }
      } catch (e) { 
        console.error("Polling error:", e); 
      }
    }, 2000);
  };

  const handleSuccess = () => {
    alert("Success! Account Activated.");
    setProcessing(false);
    // Navigate them to the dashboard
    navigate('/landlord'); 
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );

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
          </div>
        </div>
      </div>
    </div>
  );
}