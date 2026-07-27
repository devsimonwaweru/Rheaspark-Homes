import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import OtpInput from '../components/OtpInput';

export default function Register() {
  const navigate = useNavigate();
  
  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('user');
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState('form'); // 'form' | 'verify'
  
  // Temp storage between steps
  const [, setTempUserId] = useState(null);
  
  // Parallax state
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setMousePos({ x, y });
  };

  // Helper to call Edge Function
  const callEdgeFunction = async (action, payload = {}) => {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        action: action,
        email: email,
        purpose: 'verify_email',
        ...payload
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Something went wrong");
    return data;
  };

  // STEP 1: Create Account & Send OTP
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Create Auth User
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
      });

      if (authError) throw authError;
      const userId = authData.user.id;
      setTempUserId(userId); // Save for later

      const baseData = { 
        id: userId, 
        full_name: fullName, 
        phone: phone 
      };

      // 2. Insert into Role Table
      if (role === "landlord") {
        const { error: landlordError } = await supabase
          .from("landlords")
          .insert([{ ...baseData, business_name: fullName, email: email }]);
        if (landlordError) throw landlordError;
      } else if (role === "mover") {
        const { error: moverError } = await supabase
          .from("movers")
          .insert([{ ...baseData, business_name: fullName }]);
        if (moverError) throw moverError;
      } else {
        const { error: userError } = await supabase
          .from("users")
          .insert([{ ...baseData, email: email }]);
        if (userError) throw userError;
      }

      // 3. Trigger OTP Email
      await callEdgeFunction('send');
      
      // 4. Move to OTP step
      setStep('verify');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP, Confirm Account, Send Welcome Email, Login
  const handleVerifyOtp = async (otpCode) => {
    if (otpCode === 'RESEND') {
      setLoading(true);
      setError(null);
      try {
        await callEdgeFunction('send');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // This single backend call: Verifies OTP, Confirms Email in Supabase, Sends Welcome Email
      await callEdgeFunction('finalize_verification', { otp: otpCode });

      // Log the user in automatically
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (loginError) throw loginError;

      // Redirect based on role
      if (role === "landlord") navigate("/subscription");
      else if (role === "mover") navigate("/mover/dashboard");
      else navigate("/user/dashboard");

    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans">
      
      {/* Left Side - Branding */}
      <div 
        className="hidden lg:flex w-1/2 bg-gradient-to-br from-emerald-800 to-blue-900 text-white p-12 flex-col justify-center relative overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setMousePos({ x: 0, y: 0 })}
      >
        <div 
          className="absolute top-20 right-20 w-72 h-72 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 transition-transform duration-300 ease-out"
          style={{ transform: `translate(${mousePos.x * -0.05}px, ${mousePos.y * -0.05}px)` }}
        ></div>
        <div 
          className="absolute bottom-20 left-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 transition-transform duration-300 ease-out"
          style={{ transform: `translate(${mousePos.x * 0.04}px, ${mousePos.y * 0.04}px)` }}
        ></div>

        <div className="relative z-10 transition-transform duration-300 ease-out"
             style={{ transform: `translate(${mousePos.x * 0.01}px, ${mousePos.y * 0.01}px)` }}>
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Join Rheaspark<br /> Today
          </h1>
          <p className="text-lg text-emerald-100 mb-8 max-w-md">
            Create an account to list your properties, offer moving services, or find your perfect home.
          </p>
        </div>
      </div>

      {/* Right Side - Dynamic Steps */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              {step === 'form' ? 'Create Account' : 'Verify Your Email'}
            </h2>
            <p className="text-gray-400">
              {step === 'form' ? 'Fill in your details to get started' : 'We sent a code to your email address'}
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

          {/* STEP 1: REGISTRATION FORM */}
          {step === 'form' && (
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input type="text" placeholder="Enter your full name" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition shadow-sm" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Active Phone Number</label>
                <input type="tel" placeholder="e.g. +2547XXXXXXXX" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition shadow-sm" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input type="email" placeholder="Enter your email" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition shadow-sm" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} placeholder="Create a password" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition shadow-sm pr-12" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Register as</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition shadow-sm bg-white">
                  <option value="user">User (Tenant)</option>
                  <option value="landlord">Landlord</option>
                  <option value="mover">Mover</option>
                </select>
              </div>

              <button type="submit" className="w-full text-white p-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 bg-gradient-to-r from-blue-600 to-emerald-500" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>
          )}

          {/* STEP 2: OTP VERIFICATION */}
          {step === 'verify' && (
            <OtpInput 
              email={email} 
              purpose="verify_email" 
              onSubmitOtp={handleVerifyOtp} 
              loading={loading} 
              error={error} 
            />
          )}

          {/* Back Button */}
          {step === 'verify' && (
            <div className="mt-6">
              <button 
                onClick={() => { setStep('form'); setError(null); }} 
                className="w-full text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Go Back to Edit Details
              </button>
            </div>
          )}

          <p className="text-center text-gray-400 text-sm mt-8">
            Already have an account? {' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}