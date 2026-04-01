import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

export default function UserDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserData = async () => {
      try {
        setLoading(true);
        
        // 1. Get Auth User
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          navigate('/login');
          return;
        }
        setUser(authUser);

        // 2. Get Profile from 'users' table (only if needed for name/avatar)
        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();
        
        setProfile(profileData);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    getUserData();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Display name logic
  const displayName = profile?.full_name || user?.email?.split('@')[0] || "User";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans relative">
      
      {/* Top Navigation Bar */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold text-blue-900">Rheaspark</Link>
          
          <div className="flex items-center space-x-4">
            <span className="hidden sm:block text-sm text-gray-600">Hi, {displayName}</span>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
            >
              <span className="hidden sm:block">Logout</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Centered Content */}
      <div className="flex flex-col items-center justify-center px-4 py-20">
        <div className="text-center max-w-md mx-auto">
          {/* Avatar */}
          <div className="mb-6">
             <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600 text-3xl font-bold border-4 border-white shadow-md">
               {displayName.charAt(0).toUpperCase()}
             </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            Welcome back, {displayName}!
          </h1>
          <p className="text-gray-500 mb-8">
            Ready to find your next home? Explore our listings today.
          </p>

          {/* Main Action Button */}
          <Link
            to="/find-houses"
            className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white text-lg font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all transform hover:-translate-y-1"
          >
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Find Houses
          </Link>
        </div>
      </div>

      {/* Floating Action Button (Mobile Friendly) */}
      <Link 
        to="/find-houses" 
        className="fixed bottom-8 right-8 bg-blue-600 text-white p-5 rounded-full shadow-2xl hover:bg-blue-700 transition-all transform hover:scale-110 z-50 group"
        title="Find Houses"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {/* Tooltip on hover for desktop */}
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-sm px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden sm:block">
          Search Homes
        </span>
      </Link>

    </div>
  );
}