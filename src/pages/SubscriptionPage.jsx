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
  
  // State to determine if we show Free Trial or Payment
  const [showTrialOption, setShowTrialOption] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
      } else {
        setUser(session.user);
        
        // Check subscription and trial status
        const { data: landlord } = await supabase
          .from('landlords')
          .select('subscription_status, trial_used')
          .eq('id', session.user.id)
          .single();

        // If already active, go to dashboard
        if (landlord?.subscription_status === 'active') {
          navigate('/landlord');
        } 
        // If trial NOT used, show the Free Trial button
        else if (!landlord?.trial_used) {
          setShowTrialOption(true);
        } 
        // Otherwise, show Payment button
        else {
          setShowTrialOption(false);
        }
      }
      setLoading(false);
    };
    checkUser();
  }, [navigate]);

  // --- HANDLER: START FREE TRIAL ---
  const handleStartTrial = async () => {
    setProcessing(true);
    setError(null);

    try {
      // Calculate expiry (30 days from now)
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      const { error: updateError } = await supabase
        .from('landlords')
        .update({
          subscription_status: 'active', // Grant access immediately
          subscription_ends_at: endDate.toISOString(),
          trial_used: true // Mark trial as used forever
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      alert("Success! Your 1-month free trial has started.");
      
      // FIX: Use HashRouter compatible hard refresh
      window.location.href = '/#/landlord'; 

    } catch (err) {
      console.error(err);
      setError("Could not start trial: " + (err.message || "Please check RLS permissions."));
    } finally {
      setProcessing(false);
    }
  };

  // --- HANDLER: PAY NOW (MPESA) ---
  const handlePayment = async () => {
    if (!phone) {
      setError("Please enter your M-Pesa phone number.");
      return;
    }
    
    setProcessing(true);
    setError(null);

    try {
      // Call your Supabase Edge Function for Payment
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
            amount: 1199, // The price per property/month
            userId: user.id 
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Payment failed to initialize");
      }

      alert("STK Push sent! Please check your phone.");
      // You would typically poll for status here or use webhooks
      
    } catch (err) {
      console.error("Payment Error:", err);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col items-center justify-center p-4 relative">
      
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500 rounded-full filter blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-lg">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">
            {showTrialOption ? "Start Free Trial" : "Activate Pro"}
          </h1>
          <p className="text-indigo-200">
            {showTrialOption 
              ? "No payment required for the first 30 days." 
              : "Your trial has ended. Subscribe to continue."}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          
          {/* Content */}
          <div className="p-8 space-y-6">
            
            {showTrialOption ? (
              /* --- FREE TRIAL VIEW --- */
              <>
                <div className="text-center text-white">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/20 rounded-full mb-4 ring-4 ring-emerald-500/30">
                    <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Full Access for 30 Days</h3>
                  <p className="text-sm text-indigo-200 opacity-80">
                    Get instant access to all Pro features. No credit card required.
                  </p>
                </div>

                <ul className="space-y-3 text-sm text-indigo-100">
                  <li className="flex items-center"><svg className="w-4 h-4 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>Automated Rent Collection</li>
                  <li className="flex items-center"><svg className="w-4 h-4 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>Tenant Management Portal</li>
                  <li className="flex items-center"><svg className="w-4 h-4 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>Financial Reports</li>
                </ul>

                {error && <div className="bg-red-500/20 border border-red-400/30 text-red-200 text-sm p-3 rounded-xl text-center">{error}</div>}

                <button
                  onClick={handleStartTrial}
                  disabled={processing}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-4 rounded-xl shadow-lg hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center text-lg"
                >
                  {processing ? "Activating..." : "Start Free Trial"}
                </button>
              </>
            ) : (
              /* --- PAYMENT VIEW (AFTER TRIAL) --- */
              <>
                <div className="text-center border-b border-white/10 pb-6">
                  <span className="text-indigo-200 text-sm">Subscription Fee</span>
                  <div className="flex items-baseline justify-center text-white mt-1">
                    <span className="text-4xl font-extrabold">KES 1,199</span>
                    <span className="text-indigo-200 ml-2 font-medium">/ month</span>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-sm font-medium text-indigo-100 mb-2">M-Pesa Phone Number</label>
                  <input 
                    type="tel" 
                    placeholder="e.g 0712345678"
                    className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-200 focus:ring-2 focus:ring-blue-400 outline-none transition-all"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={processing}
                  />
                </div>

                {error && <div className="bg-red-500/20 border border-red-400/30 text-red-200 text-sm p-3 rounded-xl text-center">{error}</div>}

                <button
                  onClick={handlePayment}
                  disabled={processing}
                  className="w-full bg-white text-indigo-700 font-bold py-4 rounded-xl shadow-lg hover:bg-indigo-50 transition-all disabled:opacity-50 flex items-center justify-center text-lg"
                >
                  {processing ? "Processing..." : "Pay Now"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}