import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

export default function UserDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ saved: 0, viewings: 0 });
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

        // 2. Get Profile from 'users' table
        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();
        
        setProfile(profileData);

        // 3. Get Stats (Using 'unlocks' as 'Saved/Accessed' for now)
        const { count: unlockedCount } = await supabase
          .from('unlocks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', authUser.id);

        setStats({ 
          saved: unlockedCount || 0, 
          viewings: 2 // Placeholder as 'viewings' table doesn't exist yet
        });

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
  const avatarUrl = profile?.avatar_url || `https://ui-avatars.com/api/?name=${displayName}&background=random`;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      
      {/* Top Navigation Bar (Mobile & Desktop Header) */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold text-blue-900">Rheaspark</Link>
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

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Responsive Grid: 1 Col (Mobile) -> 3 Cols (Desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* --- Left Column: Profile Sidebar --- */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24 border border-gray-100">
              {/* Profile Card */}
              <div className="flex flex-col items-center text-center">
                <img 
                  src={avatarUrl} 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg mb-4"
                />
                <h2 className="text-xl font-bold text-gray-800">{displayName}</h2>
                <p className="text-sm text-gray-500 mb-4">{user?.email}</p>
                
                {/* Badges */}
                <div className="flex space-x-2 mb-6">
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                    Seeker
                  </span>
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 border border-green-200 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    Verified
                  </span>
                </div>
              </div>

              {/* Navigation Menu */}
              <nav className="space-y-2 border-t pt-6">
                <Link to="/user/profile" className="flex items-center space-x-3 p-3 rounded-xl bg-blue-50 text-blue-700 font-medium">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  <span>My Profile</span>
                </Link>
                <Link to="/user/saved" className="flex items-center space-x-3 p-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  <span>Saved Homes</span>
                </Link>
                <Link to="/user/messages" className="flex items-center space-x-3 p-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                  <span>Messages</span>
                </Link>
                <button onClick={handleLogout} className="w-full flex items-center space-x-3 p-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors mt-4">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  <span>Logout</span>
                </button>
              </nav>
            </div>
          </div>

          {/* --- Center Column: Main Content --- */}
          <div className="lg:col-span-6 space-y-8">
            
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-2xl p-8 text-white shadow-xl">
              <h1 className="text-3xl font-bold mb-2">Welcome back, {displayName}!</h1>
              <p className="text-blue-100">
                {stats.viewings > 0 
                  ? `You have ${stats.viewings} pending viewings scheduled.`
                  : "Explore new properties today."}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Stat Card 1 */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  </div>
                  <span className="text-green-500 text-xs font-medium bg-green-50 px-2 py-1 rounded">+2 this week</span>
                </div>
                <h3 className="text-4xl font-bold text-gray-800 mb-1">{stats.saved}</h3>
                <p className="text-gray-500 text-sm">Saved Properties</p>
                <div className="mt-4 pt-4 border-t border-gray-50">
                  <Link to="/user/saved" className="text-blue-600 text-sm font-medium hover:underline">View All →</Link>
                </div>
              </div>

              {/* Stat Card 2 */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-emerald-50 rounded-lg">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <span className="text-green-500 text-xs font-medium bg-green-50 px-2 py-1 rounded">2 Confirmed</span>
                </div>
                <h3 className="text-4xl font-bold text-gray-800 mb-1">{stats.viewings}</h3>
                <p className="text-gray-500 text-sm">Scheduled Viewings</p>
                <div className="mt-4 pt-4 border-t border-gray-50">
                  <Link to="/user/viewings" className="text-blue-600 text-sm font-medium hover:underline">View Schedule →</Link>
                </div>
              </div>
            </div>

            {/* Recent Activity List (Placeholder) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-800">Recent Activity</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {/* Item 1 */}
                <div className="p-4 flex items-center space-x-4 hover:bg-gray-50 transition-colors">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0"></div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">Viewed Kilimani Apartment</h4>
                    <p className="text-sm text-gray-500">2 hours ago</p>
                  </div>
                  <button className="text-blue-600 text-sm font-medium hover:underline">View</button>
                </div>
                {/* Item 2 */}
                <div className="p-4 flex items-center space-x-4 hover:bg-gray-50 transition-colors">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0"></div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">Saved Westlands Studio</h4>
                    <p className="text-sm text-gray-500">Yesterday</p>
                  </div>
                  <button className="text-blue-600 text-sm font-medium hover:underline">View</button>
                </div>
              </div>
            </div>
          </div>

          {/* --- Right Column: Quick Actions --- */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Action Buttons Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
              
              <Link 
                to="/find-houses" 
                className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-emerald-500 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all mb-3 hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                Find Houses
              </Link>

              <Link 
                to="/movers" 
                className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                Moving Services
              </Link>
            </div>

            {/* Support Card */}
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
              <h3 className="font-bold text-blue-900 mb-2">Need Help?</h3>
              <p className="text-sm text-blue-700 mb-4">Contact our support team for assistance with your account or bookings.</p>
              <button className="text-sm font-semibold text-blue-600 hover:underline">Contact Support →</button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}