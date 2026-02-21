import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import GradientButton from '../components/GradientButton';

export default function LandlordAuth() {
  const navigate = useNavigate();
  const { signUp, signIn, user, profile } = useAuth();
  
  const [view, setView] = useState('login');
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [mpesaNumber, setMpesaNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  if (user && profile?.role === 'landlord') {
    navigate('/landlord');
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    const { error } = await signIn({ 
      email: formData.email, 
      password: formData.password 
    });

    if (error) {
      setError(error.message);
    } else {
      // AuthContext will handle the redirect automatically via useEffect in a real app
      // But we can force navigation here
      navigate('/landlord');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    const { data, error } = await signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.name,
          role: 'landlord', // Important: Define role for the trigger
          phone: formData.phone
        }
      }
    });

    if (error) {
      setError(error.message);
    } else if (data.user) {
      // Show payment modal immediately
      setShowPaymentModal(true);
    }
  };

  const handlePayment = () => {
    if(!mpesaNumber) return;
    setIsProcessing(true);
    
    setTimeout(() => {
      setIsProcessing(false);
      setShowPaymentModal(false);
      alert("Account Activated!");
      // In real app, you'd verify payment via webhook before redirect
      navigate('/landlord');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl font-bold font-brand brand-gradient">Rheaspark</h1>
            <p className="text-gray-500 text-sm mt-1">Landlord Portal</p>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
          <div className="flex mb-8 bg-gray-100 p-1 rounded-xl">
            <button onClick={() => setView('login')} className={`flex-1 py-2 rounded-lg font-semibold transition-all duration-300 ${view === 'login' ? 'bg-white text-primary-blue shadow-sm' : 'text-gray-500'}`}>Sign In</button>
            <button onClick={() => setView('register')} className={`flex-1 py-2 rounded-lg font-semibold transition-all duration-300 ${view === 'register' ? 'bg-white text-primary-blue shadow-sm' : 'text-gray-500'}`}>Sign Up</button>
          </div>

          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input type="email" name="email" required onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-blue" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" name="password" required onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-blue" />
              </div>
              <GradientButton type="submit" className="w-full py-3">Sign In</GradientButton>
            </form>
          )}

          {view === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" name="name" required onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-blue" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input type="email" name="email" required onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-blue" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input type="tel" name="phone" required onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-blue" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" name="password" required onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-blue" />
              </div>
              <GradientButton type="submit" className="w-full py-3">Create Account</GradientButton>
            </form>
          )}
        </div>
      </div>

      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Activate Account" size="md">
        <div className="text-center py-4">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <i className="fas fa-shield-alt text-4xl text-green-600"></i>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Pay Activation Fee</h3>
          <p className="text-gray-600 mb-4">Complete the one-time payment to access your dashboard.</p>
          
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-500">Total Amount</p>
            <p className="text-3xl font-bold text-primary-blue">KES 50</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handlePayment(); }}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">M-Pesa Number</label>
              <input type="tel" required placeholder="0712 345 678" value={mpesaNumber} onChange={(e) => setMpesaNumber(e.target.value)} className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green" />
            </div>
            <button type="submit" disabled={isProcessing} className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50">
              {isProcessing ? 'Processing...' : 'Pay & Activate'}
            </button>
          </form>
        </div>
      </Modal>
    </div>
  );
}