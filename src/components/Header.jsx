/* eslint-disable react-hooks/immutability */

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import logo from "../assets/logo.png";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [session, setSession] = useState(null);
  // Store name, role, and the correct dashboard path
  const [userProfile, setUserProfile] = useState({ name: null, role: null, path: "/" });

  useEffect(() => {
    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (!session) setUserProfile({ name: null, role: null, path: "/" });
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (session && session.user) {
        const userId = session.user.id;

        // 1. Check Landlord
        const { data: landlordData } = await supabase
          .from('landlords')
          .select('full_name, subscription_status') // Fetch subscription_status
          .eq('id', userId)
          .single();

        if (landlordData) {
          // If not subscribed, send them to subscription page on click
          const targetPath = landlordData.subscription_status === 'active' 
            ? '/landlord' 
            : '/subscription';

          setUserProfile({ 
            name: landlordData.full_name, 
            role: 'landlord', 
            path: targetPath 
          });
          return;
        }

        // 2. Check Mover
        const { data: moverData } = await supabase
          .from('movers')
          .select('full_name')
          .eq('id', userId)
          .single();

        if (moverData) {
          setUserProfile({ 
            name: moverData.full_name, 
            role: 'mover', 
            path: '/mover' 
          });
          return;
        }

        // 3. Check User (Tenant)
        const { data: userData } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', userId)
          .single();

        if (userData) {
          setUserProfile({ 
            name: userData.full_name, 
            role: 'user', 
            path: '/user/dashboard' 
          });
          return;
        }

        // 4. Fallback (Email)
        setUserProfile({ 
          name: session.user.email.split('@')[0], 
          role: 'user', 
          path: '/user/dashboard' 
        });
      }
    };

    fetchProfile();
  }, [session]);

  const getSession = async () => {
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    document.body.style.overflow = mobileMenuOpen ? "" : "hidden";
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <>
      {/* Header Container */}
      <header className="sticky top-0 z-50 bg-blue-900 text-white shadow-lg transition-all duration-300">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            
            {/* Left Section: Branding */}
            <Link to="/" className="flex items-center space-x-4 group">
              <div className="w-[50px] h-[50px] rounded-xl overflow-hidden bg-white p-1 shadow-[0_8px_20px_rgba(47,164,231,0.2)] transition-transform duration-500 group-hover:rotate-[5deg] group-hover:scale-105">
                <img 
                  src={logo} 
                  alt="Rheaspark Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-2xl font-bold hidden sm:block bg-gradient-to-r from-[#2FA4E7] to-[#3CB371] bg-clip-text text-transparent font-['Playfair_Display']">
                Rheaspark
              </span>
            </Link>

            {/* Center Section: Main Navigation (Hidden on mobile) */}
            <nav className="hidden lg:flex items-center space-x-8">
              <Link to="/" className="relative font-medium text-white/90 hover:text-white transition-colors duration-300 py-2 group">
                Home
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-[#2FA4E7] to-[#3CB371] rounded-full transition-all duration-300 group-hover:w-full"></span>
              </Link>

              <Link to={session ? "/find-houses" : "/login"} className="relative font-medium text-white/90 hover:text-white transition-colors duration-300 py-2 group">
                Find Houses
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-[#2FA4E7] to-[#3CB371] rounded-full transition-all duration-300 group-hover:w-full"></span>
              </Link>

              <Link to="/movers" className="relative font-medium text-white/90 hover:text-white transition-colors duration-300 py-2 group">
                Moving Services
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-[#2FA4E7] to-[#3CB371] rounded-full transition-all duration-300 group-hover:w-full"></span>
              </Link>

              <Link to="/about" className="relative font-medium text-white/90 hover:text-white transition-colors duration-300 py-2 group">
                About
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-[#2FA4E7] to-[#3CB371] rounded-full transition-all duration-300 group-hover:w-full"></span>
              </Link>
            </nav>

            {/* Right Section: Actions */}
            <div className="hidden lg:flex items-center space-x-6">
              {session ? (
                /* LOGGED IN VIEW DESKTOP */
                <div 
                  className="relative"
                  onMouseEnter={() => setOpenDropdown('user')}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button className="flex items-center space-x-3 focus:outline-none group">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#2FA4E7] to-[#3CB371] flex items-center justify-center font-bold text-white shadow-md group-hover:scale-105 transition-transform">
                      {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="text-left hidden md:block">
                      <p className="text-sm font-semibold text-white">Hello, {userProfile.name || 'User'}</p>
                      <p className="text-xs text-blue-200 capitalize">{userProfile.role}</p>
                    </div>
                    <svg className={`w-4 h-4 ml-1 transition-transform duration-300 ${openDropdown === 'user' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </button>

                  {/* Dropdown Menu */}
                  <div className={`absolute top-full right-0 w-64 bg-white text-gray-800 rounded-xl shadow-2xl border border-gray-100 mt-2 overflow-hidden transition-all duration-300 origin-top ${openDropdown === 'user' ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-95 pointer-events-none'}`}>
                    <div className="p-2">
                      <Link
                        to={userProfile.path}
                        className="block px-4 py-3 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-green-50 transition-all duration-300 hover:translate-x-1 relative group"
                      >
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#3CB371] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="font-medium text-gray-800">Your Profile</div>
                        <div className="text-xs text-gray-500 mt-1">Manage your account</div>
                      </Link>

                      {/* Show specific dashboard link if role is explicit */}
                      {(userProfile.role === 'landlord' || userProfile.role === 'mover') && (
                         <Link
                         to={userProfile.path}
                         className="block px-4 py-3 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-green-50 transition-all duration-300 hover:translate-x-1 relative group"
                       >
                         <div className="font-medium text-gray-800">Dashboard</div>
                         <div className="text-xs text-gray-500 mt-1">View analytics & stats</div>
                       </Link>
                      )}

                      <div className="border-t border-gray-100 mt-2 pt-2">
                        <button
                          onClick={logout}
                          className="w-full text-left px-4 py-3 rounded-lg text-red-500 hover:bg-red-50 transition-colors duration-300 font-medium"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* LOGGED OUT VIEW DESKTOP */
                <div className="flex items-center space-x-4">
                  <Link 
                    to="/login" 
                    className="font-medium text-white/90 hover:text-white transition-colors duration-300 relative group py-2"
                  >
                    Log In
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                  </Link>

                  <Link
                    to="/register"
                    className="relative px-6 py-2.5 bg-gradient-to-r from-[#2FA4E7] to-[#3CB371] text-white font-semibold rounded-lg shadow-[0_4px_15px_rgba(47,164,231,0.3)] hover:shadow-[0_8px_25px_rgba(47,164,231,0.4)] transition-all duration-300 hover:-translate-y-0.5 overflow-hidden group"
                  >
                    <div className="absolute top-0 -left-full h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent transform group-hover:left-full transition-all duration-700 skew-x-12"></div>
                    <span className="relative z-10">Register</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 text-white focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 lg:hidden ${
          mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={toggleMobileMenu}
      ></div>

      {/* Mobile Menu Sidebar */}
      <div
        className={`fixed top-0 right-0 w-80 h-full bg-white text-gray-800 z-50 shadow-2xl transform transition-transform duration-500 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 h-full flex flex-col overflow-y-auto">
          
          {/* Sidebar Header - User Info Area */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
               <span className="text-xl font-bold bg-gradient-to-r from-[#2FA4E7] to-[#3CB371] bg-clip-text text-transparent font-['Playfair_Display']">
                Rheaspark
              </span>
              <button onClick={toggleMobileMenu} className="text-gray-500 hover:text-gray-800 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {session ? (
              <div className="bg-gray-50 p-4 rounded-xl flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#2FA4E7] to-[#3CB371] flex items-center justify-center font-bold text-white text-lg shadow-inner">
                   {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <p className="font-bold text-gray-800">{userProfile.name || 'User'}</p>
                  <p className="text-xs text-gray-500 capitalize">{userProfile.role}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 border border-dashed border-gray-200 rounded-xl">
                <p className="text-sm text-gray-500">Welcome to Rheaspark</p>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <div className="space-y-2">
            <Link to="/" onClick={toggleMobileMenu} className="block py-3 px-4 rounded-lg font-medium hover:bg-blue-50 hover:text-[#2FA4E7] transition-colors">
              Home
            </Link>
            
            <Link 
              to={session ? "/find-houses" : "/login"} 
              onClick={toggleMobileMenu} 
              className="block py-3 px-4 rounded-lg font-medium hover:bg-blue-50 hover:text-[#2FA4E7] transition-colors"
            >
              Find Houses
            </Link>

            <Link to="/movers" onClick={toggleMobileMenu} className="block py-3 px-4 rounded-lg font-medium hover:bg-blue-50 hover:text-[#2FA4E7] transition-colors">
              Moving Services
            </Link>
          </div>

          {/* Auth Section in Sidebar */}
          <div className="mt-auto pt-6 border-t border-gray-100 space-y-2">
            {session ? (
              <>
                {/* Dynamic Profile Link */}
                <Link 
                  to={userProfile.path}
                  onClick={toggleMobileMenu}
                  className="flex items-center justify-between py-3 px-4 rounded-lg font-medium hover:bg-blue-50 hover:text-[#2FA4E7] transition-colors group"
                >
                  <span>Your Profile</span>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </Link>

                <button
                  onClick={() => { logout(); toggleMobileMenu(); }}
                  className="w-full flex items-center justify-between py-3 px-4 rounded-lg text-red-500 hover:bg-red-50 transition-colors font-medium"
                >
                  <span>Logout</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <Link
                  to="/login"
                  onClick={toggleMobileMenu}
                  className="block w-full py-3 text-center border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={toggleMobileMenu}
                  className="block w-full py-3 text-center bg-gradient-to-r from-[#2FA4E7] to-[#3CB371] text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}