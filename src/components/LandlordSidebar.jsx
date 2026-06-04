// src/components/LandlordSidebar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function LandlordSidebar({ onAddProperty }) {
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('landlords')
          .select('full_name, business_name')
          .eq('id', user.id)
          .single();
        setProfile(data);
      }
    };
    getProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleAddClick = () => {
    setIsOpen(false); 
    onAddProperty(); 
  };

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between bg-white shadow-sm p-4 sticky top-0 z-40 border-b border-gray-100">
        <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
          Rheaspark
        </span>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none"
        >
          {isOpen ? (
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          )}
        </button>
      </div>

      {/* Sidebar Container */}
      <div
        className={`
          bg-white fixed md:static top-0 left-0 h-full shadow-xl md:shadow-none z-50 
          transform transition-transform duration-300 w-72 border-r border-gray-100
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        <div className="p-6 flex flex-col h-full">
          
          {/* Logo Area (Desktop) */}
          <div className="mb-8 hidden md:block">
            <h2 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              Rheaspark
            </h2>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Landlord Panel</p>
          </div>

          {/* Profile Section (Desktop) */}
          <div className="hidden md:flex flex-col items-center mb-8 pb-6 border-b border-gray-100">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 flex items-center justify-center text-white text-2xl font-bold shadow-md mb-3">
              {profile?.full_name?.charAt(0) || 'L'}
            </div>
            <h3 className="font-bold text-gray-800">{profile?.full_name || 'Landlord'}</h3>
            <p className="text-xs text-gray-500">{profile?.business_name || 'Property Manager'}</p>
            
            <span className="mt-2 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center">
               <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              Verified
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-2 flex-grow">
            
            {/* 1. Home Link */}
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center space-x-3 py-3 px-4 rounded-xl transition-all duration-200 font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600 group"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Home</span>
            </Link>

            {/* 2. Dashboard Link */}
            <Link
              to="/landlord"
              onClick={() => setIsOpen(false)}
              className={`flex items-center space-x-3 py-3 px-4 rounded-xl transition-all duration-200 font-medium group ${
                location.pathname === '/landlord'
                  ? 'bg-blue-50 text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 14a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              <span>Dashboard</span>
              
              {location.pathname === '/landlord' && (
                <div className="ml-auto w-1.5 h-8 bg-blue-600 rounded-full"></div>
              )}
            </Link>

            {/* 3. Add Property Button */}
            <button
              onClick={handleAddClick}
              className="flex items-center space-x-3 py-3 px-4 rounded-xl transition-all duration-200 font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600 text-left w-full group"
            >
              <div className="w-5 h-5 flex items-center justify-center rounded-full border-2 border-dashed border-gray-300 group-hover:border-blue-500 transition-colors">
                 <svg className="w-3 h-3 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
              </div>
              <span>Add Property</span>
            </button>

            {/* --- RENTAL MANAGEMENT ADVERT --- */}
            <div className="mt-6 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 shadow-sm">
              <div className="flex items-center space-x-2 mb-2">
                <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </span>
                <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Pro Feature</span>
              </div>
              <h4 className="font-bold text-gray-800 text-sm mb-1">Rental Manager</h4>
              <p className="text-xs text-gray-500 mb-2">Automate rent collection & tenants.</p>
              <p className="text-xs font-bold text-indigo-600 mb-3">KES 1,199/mo per property</p>
              
              <a 
                href="https://keja-zetu-rentals.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block w-full text-center bg-indigo-600 text-white text-xs font-bold py-2 px-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Subscribe Now
              </a>
            </div>

          </nav>
          
          {/* Bottom Section - Logout */}
          <div className="border-t border-gray-100 pt-4 mt-4">
             <button 
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 py-3 px-4 rounded-xl text-red-500 hover:bg-red-50 transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black opacity-40 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}