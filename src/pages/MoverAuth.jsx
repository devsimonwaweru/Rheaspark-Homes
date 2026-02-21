import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import GradientButton from '../components/GradientButton';

export default function MoverAuth() {
  const navigate = useNavigate();
  const { signUp, signIn, user, profile, loading } = useAuth();
  
  const [view, setView] = useState('login');
  const [formData, setFormData] = useState({ name: '', email: '', businessName: '', phone: '', password: '' });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [mpesaNumber, setMpesaNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // ------------------------------------------
  // REDIRECT & PAYMENT ENFORCEMENT LOGIC
  // ------------------------------------------
  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) return;

    if (user && profile) {
      if (profile.role === 'mover') {
        if (profile.is_subscribed) {
          // User is logged in AND paid -> Go to Dashboard
          navigate('/mover');
        } else {
          // User is logged in BUT NOT paid -> Force Payment Modal
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setShowPaymentModal(true);
        }
      }
    }
  }, [user, profile, loading, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    const { error } = await signIn({ 
      email: formData.email, 
      password: formData.password 
    });

    if (error) {
      setError(error.message);
    }
    // No need to navigate here, the useEffect above will handle it
  };

  // Handle Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    const { data, error } = await signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.name,
          role: 'mover',
          phone: formData.phone
        }
      }
    });

    if (error) {
      setError(error.message);
    } else if (data.user) {
      // The useEffect will detect the new user and open the modal
      // But we can open it manually for speed
      setShowPaymentModal(true);
    }
  };

  // Simulate Payment
  const handlePayment = async () => {
    if(!mpesaNumber) return;
    setIsProcessing(true);
    
    // TODO: In future, call Supabase Edge Function to update 'is_subscribed'
    // For now, we simulate success and manually update local state for demo
    
    setTimeout(() => {
      setIsProcessing(false);
      setShowPaymentModal(false);
      alert("Account Activated! (Simulated)");
      
      // Force redirect to dashboard
      window.location.href = '/mover'; 
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl font-bold font-brand brand-gradient">Rheaspark</h1>
            <p className="text-gray-500 text-sm mt-1">Service Provider Portal</p>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
          
          {/* Tabs */}
          <div className="flex mb-8 bg-gray-100 p-1 rounded-xl">
            <button onClick={() => setView('login')} className={`flex-1 py-2 rounded-lg font-semibold transition-all duration-300 ${view === 'login' ? 'bg-white text-primary-green shadow-sm' : 'text-gray-500'}`}>Sign In</button>
            <button onClick={() => setView('register')} className={`flex-1 py-2 rounded-lg font-semibold transition-all duration-300 ${view === 'register' ? 'bg-white text-primary-green shadow-sm' : 'text-gray-500'}`}>Register</button>
          </div>

          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input type="email" name="email" required onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-green" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" name="password" required onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-green" />
              </div>
              <GradientButton type="submit" className="w-full py-3">Sign In</GradientButton>
            </form>
          )}

          {view === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <input type="text" name="businessName" required onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-green" placeholder="e.g. QuickMove Ltd" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                <input type="text" name="name" required onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-green" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input type="tel" name="phone" required onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-green" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input type="email" name="email" required onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-green" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" name="password" required onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-green" />
              </div>
              <GradientButton type="submit" className="w-full py-3">Register Business</GradientButton>
            </form>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <Modal isOpen={showPaymentModal} onClose={() => {}} title="Activate Mover Account" size="sm">
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <i className="fas fa-truck text-2xl text-green-600"></i>
          </div>
          
          <h3 className="text-xl font-bold text-gray-800 mb-2">Registration Fee</h3>
          <p className="text-gray-500 text-sm mb-6">Pay KES 100 to activate your business profile.</p>

          <form onSubmit={(e) => { e.preventDefault(); handlePayment(); }}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1 text-left">M-Pesa Number</label>
              <input 
                type="tel" 
                placeholder="0712 345 678"
                value={mpesaNumber}
                onChange={(e) => setMpesaNumber(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
                required
              />
            </div>

            <button 
              type="submit"
              disabled={isProcessing}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                <span><i className="fas fa-spinner fa-spin mr-2"></i> Processing...</span>
              ) : (
                <span>Pay KES 100</span>
              )}
            </button>
          </form>
        </div>
      </Modal>

    </div>
  );
}