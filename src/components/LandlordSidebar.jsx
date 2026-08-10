// src/components/LandlordSidebar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function LandlordSidebar({ onAddProperty }) {
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch Profile (Subscription check removed for testing)
  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('landlords')
          .select('full_name, business_name')
          .eq('id', user.id)
          .single();
        
        if (data) setProfile(data);
      }
    };
    getProfile();
  }, [location]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleAddClick = () => {
    setIsOpen(false);
    onAddProperty();
  };

  // Modern Nav Item Class
  const navItemClass = (isActive) => `
    flex items-center space-x-3 py-3 px-4 rounded-xl transition-all duration-200 font-medium group relative
    ${isActive 
      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30' 
      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}
  `;

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between bg-white/80 backdrop-blur-lg shadow-sm p-4 sticky top-0 z-40 border-b border-gray-100">
        <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Rheaspark
        </span>
        <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none">
          {isOpen ? (
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          )}
        </button>
      </div>

      {/* Sidebar Container */}
      <div className={`bg-white fixed md:static top-0 left-0 h-full shadow-2xl md:shadow-none z-50 transform transition-transform duration-300 w-72 border-r border-gray-50 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-6 flex flex-col h-full bg-gradient-to-b from-gray-50 to-white">
          
          {/* Logo Area */}
          <div className="mb-10 hidden md:block">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-gray-800">Rheaspark</h2>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Landlord Portal</p>
              </div>
            </div>
          </div>

          {/* Profile Card */}
          <div className="hidden md:flex flex-col items-center mb-8 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-400 to-emerald-400 flex items-center justify-center text-white text-xl font-bold shadow-md mb-3 ring-4 ring-white">
              {profile?.full_name?.charAt(0) || 'L'}
            </div>
            <h3 className="font-bold text-gray-800 text-sm">{profile?.full_name || 'Landlord'}</h3>
            <p className="text-xs text-gray-400">{profile?.business_name || 'Property Manager'}</p>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-2 flex-grow">
            
            {/* 1. Home Link */}
            <Link to="/" onClick={() => setIsOpen(false)} className={navItemClass(location.pathname === '/')}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              <span>Home</span>
            </Link>

            {/* 2. Dashboard Link */}
            <Link to="/landlord" onClick={() => setIsOpen(false)} className={navItemClass(location.pathname === '/landlord')}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 14a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              <span>Dashboard</span>
            </Link>

            {/* 3. Add Property Button */}
            <button onClick={handleAddClick} className="flex items-center space-x-3 py-3 px-4 rounded-xl transition-all duration-200 font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 text-left w-full group">
              <div className="w-5 h-5 flex items-center justify-center rounded-md border-2 border-dashed border-gray-300 group-hover:border-blue-400 transition-colors">
                 <svg className="w-3 h-3 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
              </div>
              <span>Add Property</span>
            </button>

            {/* --- UNLOCKED MANAGEMENT MENU --- */}
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-1">
              <span className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Management</span>
              
              <Link to="/landlord/rentals" onClick={() => setIsOpen(false)} className={navItemClass(location.pathname === '/landlord/rentals')}>
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                 <span>Tenants</span>
              </Link>

              <Link to="/landlord/payments" onClick={() => setIsOpen(false)} className={navItemClass(location.pathname === '/landlord/payments')}>
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                 <span>Payments</span>
              </Link>
              
              <Link to="/landlord/maintenance" onClick={() => setIsOpen(false)} className={navItemClass(location.pathname === '/landlord/maintenance')}>
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                 <span>Maintenance</span>
              </Link>
            </div>

          </nav>
          
          {/* Logout */}
          <div className="border-t border-gray-100 pt-4 mt-4">
             <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors font-medium text-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsOpen(false)} />}
    </>
  );
}