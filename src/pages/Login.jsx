import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // State for mouse parallax effect
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setMousePos({ x, y });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    const user = data.user;

    // 1. Check Landlord table
    const { data: landlord } = await supabase
      .from('landlords')
      .select('id')
      .eq('id', user.id)
      .single();

    if (landlord) {
      navigate('/landlord');
      setLoading(false);
      return;
    }

    // 2. Check Mover table
    const { data: mover } = await supabase
      .from('movers')
      .select('id')
      .eq('id', user.id)
      .single();

    if (mover) {
      navigate('/mover');
      setLoading(false);
      return;
    }

    // 3. Check User table (Normal Seeker)
    const { data: normalUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (normalUser) {
      navigate('/user/dashboard');
      setLoading(false);
      return;
    }

    // 4. Fallback if no profile found (should ideally not happen if registration works)
    navigate('/');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans">
      
      {/* Left Side - Branding with Parallax Hover Effect */}
      <div 
        className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-900 to-emerald-800 text-white p-12 flex-col justify-center relative overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setMousePos({ x: 0, y: 0 })}
      >
        <div 
          className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 transition-transform duration-300 ease-out"
          style={{ transform: `translate(${mousePos.x * 0.05}px, ${mousePos.y * 0.05}px)` }}
        ></div>
        <div 
          className="absolute bottom-20 right-20 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 transition-transform duration-300 ease-out"
          style={{ transform: `translate(${mousePos.x * -0.04}px, ${mousePos.y * -0.04}px)` }}
        ></div>
        <div 
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 transition-transform duration-300 ease-out"
          style={{ transform: `translate(${mousePos.x * 0.02}px, ${mousePos.y * 0.02}px)` }}
        ></div>

        <div className="relative z-10 transition-transform duration-300 ease-out" 
             style={{ transform: `translate(${mousePos.x * 0.01}px, ${mousePos.y * 0.01}px)` }}>
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Welcome Back to<br /> Rheaspark
          </h1>
          <p className="text-lg text-blue-100 mb-8 max-w-md">
            Login to access your account, manage your properties, or find your next perfect home.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Sign In</h2>
            <p className="text-gray-400">Enter your credentials to continue</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-4 text-sm border border-red-100 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition shadow-sm hover:shadow-md"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition shadow-sm hover:shadow-md pr-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button" 
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer select-none group">
                <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition" />
                <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">Remember me</span>
              </label>
              <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500 hover:underline transition-colors">
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              className="w-full text-white p-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-600 to-emerald-500"
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-8">
            Don't have an account? {' '}
            <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-500 hover:underline transition-colors">
              Sign Up
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}