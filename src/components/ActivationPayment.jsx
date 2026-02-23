import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import GradientButton from '../components/GradientButton';

export default function ActivationPayment({ 
  role = 'mover', 
  amount = 100, 
  businessName = '' 
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if user somehow lands here without being logged in
  useEffect(() => {
    if (!user) {
      navigate(`/mover-login`);
    }
  }, [user, navigate]);

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!phone) return;
    
    setLoading(true);
    setError('');

    try {
      // 1. Get fresh session (Prevents "id is null" error)
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;

      if (!currentUser) {
        throw new Error("Session expired. Please log in again.");
      }

      // ==========================================
      // TODO: IntaSend Integration Point
      // ==========================================
      // Call IntaSend API here.
      // For now, we simulate a 2-second delay.
      await new Promise(resolve => setTimeout(resolve, 2000));


      // 2. Update Profile: Set Subscription Active
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_subscribed: true })
        .eq('id', currentUser.id);

      if (profileError) throw profileError;

      // 3. If Mover, ensure row exists in 'movers' table
      if (role === 'mover') {
        await supabase
          .from('movers')
          .upsert({
            id: currentUser.id,
            business_name: businessName || 'New Business',
            is_verified: false
          });
      }

      // 4. Success - Redirect to Dashboard
      if (role === 'mover') {
        window.location.href = '/#/mover';
      } else {
        window.location.href = '/#/landlord';
      }

    } catch (err) {
      console.error(err);
      setError(err.message || "Payment failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl font-bold font-brand brand-gradient">Rheaspark</h1>
            <p className="text-gray-500 text-sm mt-1">Account Activation</p>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <i className="fas fa-shield-alt text-3xl text-green-600"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Activate Your Account</h2>
            <p className="text-gray-500 text-sm mt-2">
              Complete payment to access your dashboard
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl mb-6 text-center">
            <p className="text-sm text-gray-500">One-Time Fee</p>
            <p className="text-3xl font-bold text-primary-green">KES {amount}</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handlePayment}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">M-Pesa Number</label>
              <input 
                type="tel" 
                required
                placeholder="0712 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-green"
              />
            </div>

            <GradientButton 
              type="submit" 
              disabled={loading} 
              className="w-full py-3"
            >
              {loading ? (
                <span><i className="fas fa-spinner fa-spin mr-2"></i> Processing...</span>
              ) : (
                `Pay KES ${amount}`
              )}
            </GradientButton>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Payments secured by IntaSend (Simulated)
          </p>
        </div>
      </div>
    </div>
  );
}