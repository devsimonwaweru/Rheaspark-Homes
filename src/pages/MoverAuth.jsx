import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GradientButton from '../components/GradientButton';

export default function MoverAuth() {
  const navigate = useNavigate();
  const { signUp, signIn, user, loading } = useAuth();
  
  const [view, setView] = useState('login');
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    businessName: '', 
    phone: '', 
    password: '' 
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ---------------------------------------------------
  // REDIRECTION LOGIC
  // ---------------------------------------------------
  useEffect(() => {
    // If user is detected, send them to the dashboard router.
    // The ProtectedRoute will decide if they need to pay or not.
    if (!loading && user) {
      navigate('/mover');
    }
  }, [user, loading, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ---------------------------------------------------
  // LOGIN HANDLER
  // ---------------------------------------------------
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    
    const { error } = await signIn({ 
      email: formData.email, 
      password: formData.password 
    });

    if (error) {
      setError(error.message);
      setSubmitting(false);
    }
    // If success: useEffect will detect 'user' and redirect.
  };

  // ---------------------------------------------------
  // REGISTRATION HANDLER
  // ---------------------------------------------------
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const { data, error } = await signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.name,
          role: 'mover',
          phone: formData.phone,
          business_name: formData.businessName // Passed to trigger
        }
      }
    });

    if (error) {
      setError(error.message);
      setSubmitting(false);
    } else if (data.user) {
      // Check if session exists (Email Confirmation OFF)
      if (data.session) {
        // User is logged in immediately. useEffect will redirect to /mover
      } else {
        // Email Confirmation is ON
        alert("Account created! Please check your email to verify your account, then log in.");
        setSubmitting(false);
        setView('login'); // Switch to login view
      }
    } else {
      // Safety fallback
      setSubmitting(false);
    }
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
            <button 
              onClick={() => { setView('login'); setError(''); }} 
              className={`flex-1 py-2 rounded-lg font-semibold transition-all ${view === 'login' ? 'bg-white text-primary-green shadow-sm' : 'text-gray-500'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => { setView('register'); setError(''); }} 
              className={`flex-1 py-2 rounded-lg font-semibold transition-all ${view === 'register' ? 'bg-white text-primary-green shadow-sm' : 'text-gray-500'}`}
            >
              Register
            </button>
          </div>

          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

          {/* Login Form */}
          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  name="email" 
                  required 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-green outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input 
                  type="password" 
                  name="password" 
                  required 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-green outline-none" 
                />
              </div>
              <GradientButton type="submit" className="w-full py-3" disabled={submitting}>
                {submitting ? 'Signing In...' : 'Sign In'}
              </GradientButton>
            </form>
          )}

          {/* Register Form */}
          {view === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <input 
                  type="text" 
                  name="businessName" 
                  required 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-green outline-none" 
                  placeholder="e.g. QuickMove Ltd" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-green outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  name="phone" 
                  required 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-green outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  name="email" 
                  required 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-green outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input 
                  type="password" 
                  name="password" 
                  required 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-green outline-none" 
                />
              </div>
              <GradientButton type="submit" className="w-full py-3" disabled={submitting}>
                 {submitting ? 'Creating Account...' : 'Register Business'}
              </GradientButton>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}