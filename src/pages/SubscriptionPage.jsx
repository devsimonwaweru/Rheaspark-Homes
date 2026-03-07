import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import PaymentModal from '../components/PaymentModal';

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login'); // Redirect to login if no session
      } else {
        setUser(session.user);
        
        // Optional: Check if already subscribed
        const { data: landlord } = await supabase
          .from('landlords')
          .select('subscription_status')
          .eq('id', session.user.id)
          .single();
          
        if (landlord?.subscription_status === 'active') {
          navigate('/landlord'); // Already paid, go to dashboard
        }
      }
      setLoading(false);
    };

    checkUser();
  }, [navigate]);

  const handlePaymentSuccess = async () => {
    try {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      const { error } = await supabase
        .from('landlords')
        .update({
          subscription_status: 'active',
          subscription_expires_at: expiresAt.toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      navigate('/landlord');
    } catch (err) {
      console.error("Activation error:", err);
      alert("Payment succeeded but activation failed. Contact support.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Activate Your Account</h1>
          <p className="text-gray-500 mt-2">Complete your subscription to start listing</p>
        </div>

        {/* Pricing Card */}
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
              <li className="flex items-center text-gray-700">
                <svg className="w-5 h-5 mr-3 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                Priority listing support
              </li>
              <li className="flex items-center text-gray-700">
                <svg className="w-5 h-5 mr-3 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                Direct tenant contacts
              </li>
            </ul>

            <button
              onClick={() => setShowPayment(true)}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all"
            >
              Proceed to Payment
            </button>
          </div>
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">
          By subscribing, you agree to our terms of service.
        </p>
      </div>

      {/* Payment Modal (Triggered from this page) */}
      <PaymentModal 
        isOpen={showPayment}
        onClose={(success) => {
          setShowPayment(false);
          if (success) handlePaymentSuccess();
        }}
        amount={50}
        type="subscription"
        propertyId={null}
      />
    </div>
  );
}