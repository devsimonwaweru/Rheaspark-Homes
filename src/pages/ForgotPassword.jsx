import React, { useState } from 'react';

import { Link } from 'react-router-dom';
import OtpInput from '../components/OtpInput';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Flow states: 'request' -> 'verify' -> 'newPassword' -> 'success'
  const [step, setStep] = useState('request'); 
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Parallax state
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setMousePos({ x, y });
  };

  // Master function to communicate with our Edge Function
  const handleOtpAction = async (action, payload = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          action: action,
          email: email,
          purpose: 'reset_password',
          ...payload
        })
      });

      const data = await response.json();
      setLoading(false);

      if (!response.ok) {
        setError(data.error || "Something went wrong");
        return false;
      }
      return true;
    } catch (err) {
      setLoading(false);
      setError("Network error: " + err.message);
      return false;
    }
  };

  // 1. User clicks "Send Reset Code"
  const handleSendOtp = async (e) => {
    e.preventDefault();
    const success = await handleOtpAction('send');
    if (success) setStep('verify');
  };

  // 2. User enters 6 digits
  const handleVerifyOtp = async (otpCode) => {
    if (otpCode === 'RESEND') {
      await handleOtpAction('send');
      return;
    }
    
    const success = await handleOtpAction('verify', { otp: otpCode });
    if (success) setStep('newPassword');
  };

  // 3. User sets new password (Calls Edge Function because user is not logged in)
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) return setError("Password must be at least 6 characters");
    if (newPassword !== confirmPassword) return setError("Passwords do not match");

    // We pass the new password to our backend securely
    const success = await handleOtpAction('update_password', { password: newPassword });
    if (success) setStep('success');
  };

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans">
      
      {/* Left Side - Branding with Parallax */}
      <div 
        className="hidden lg:flex w-1/2 bg-gradient-to-br from-cyan-900 to-blue-800 text-white p-12 flex-col justify-center relative overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setMousePos({ x: 0, y: 0 })}
      >
        <div 
          className="absolute top-20 left-20 w-72 h-72 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 transition-transform duration-300 ease-out"
          style={{ transform: `translate(${mousePos.x * 0.05}px, ${mousePos.y * 0.05}px)` }}
        ></div>
        <div 
          className="absolute bottom-20 right-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 transition-transform duration-300 ease-out"
          style={{ transform: `translate(${mousePos.x * -0.04}px, ${mousePos.y * -0.04}px)` }}
        ></div>
        <div 
          className="absolute top-1/2 left-1/3 w-80 h-80 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 transition-transform duration-300 ease-out"
          style={{ transform: `translate(${mousePos.x * 0.02}px, ${mousePos.y * 0.02}px)` }}
        ></div>

        <div 
          className="relative z-10 transition-transform duration-300 ease-out"
          style={{ transform: `translate(${mousePos.x * 0.01}px, ${mousePos.y * 0.01}px)` }}
        >
          <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8 border border-white/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Reset Your<br /> Password
          </h1>
          <p className="text-lg text-cyan-100 mb-8 max-w-md">
            Don't worry, it happens. We'll verify your identity securely via a one-time code.
          </p>

          <div className="flex items-center space-x-3 text-cyan-200/70 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Your data stays secure throughout the process</span>
          </div>
        </div>
      </div>

      {/* Right Side - Dynamic Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              {step === 'request' && 'Forgot Password?'}
              {step === 'verify' && 'Enter Verification Code'}
              {step === 'newPassword' && 'Create New Password'}
              {step === 'success' && 'Password Updated!'}
            </h2>
            <p className="text-gray-400">
              {step === 'request' && "No worries, we'll send you a code"}
              {step === 'verify' && 'Input the 6-digit code sent to your email'}
              {step === 'newPassword' && 'Enter your new password below'}
              {step === 'success' && 'Your account security has been updated'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-4 text-sm border border-red-100 flex items-center">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* STEP 1: REQUEST EMAIL */}
          {step === 'request' && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition shadow-sm hover:shadow-md"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full text-white p-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-600 to-emerald-500"
              >
                {loading ? 'Sending Code...' : 'Send Reset Code'}
              </button>
            </form>
          )}

          {/* STEP 2: VERIFY OTP */}
          {step === 'verify' && (
            <OtpInput 
              email={email} 
              purpose="reset_password" 
              onSubmitOtp={handleVerifyOtp} 
              loading={loading} 
              error={error} 
            />
          )}

          {/* STEP 3: NEW PASSWORD */}
          {step === 'newPassword' && (
            <form onSubmit={handleUpdatePassword} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition shadow-sm hover:shadow-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition shadow-sm hover:shadow-md"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full text-white p-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-600 to-emerald-500"
              >
                {loading ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 'success' && (
            <div className="space-y-6">
              <div className="bg-emerald-50 text-emerald-700 p-6 rounded-xl border border-emerald-100 text-center">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-semibold text-lg mb-2">Password Changed Successfully</h3>
                <p className="text-emerald-600 text-sm leading-relaxed">
                  You can now sign in with your new password.
                </p>
              </div>

              <Link
                to="/login"
                className="w-full flex items-center justify-center space-x-2 text-white p-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition transform hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-blue-600 to-emerald-500"
              >
                <span>Continue to Sign In</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          )}

          {/* Back Button */}
          {step !== 'success' && (
            <div className="mt-6">
              <button 
                onClick={() => {
                  setError(null);
                  if (step === 'verify') setStep('request');
                  if (step === 'newPassword') setStep('verify');
                }} 
                className="w-full text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Go Back
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}