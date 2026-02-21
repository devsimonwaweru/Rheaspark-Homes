import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png'; 

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    document.body.style.overflow = mobileMenuOpen ? '' : 'hidden';
  };

  const handleDropdown = (name) => {
    if (openDropdown === name) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(name);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm transition-all duration-300">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            
            {/* Logo and Brand */}
            <Link to="/" className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg transform hover:rotate-6 transition-transform duration-300">
                <img 
                  src={logo} 
                  alt="Rheaspark Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-2xl font-bold font-brand brand-gradient hidden sm:block">
                Rheaspark
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-10">
              
              <Link to="/" className="nav-link">Home</Link>

              {/* Find a House Dropdown */}
              <div className="dropdown-container relative">
                <span className="nav-link cursor-pointer">Find a House</span>
                <div className="dropdown-menu absolute top-full left-0 w-72 bg-white rounded-xl shadow-xl border border-gray-100 p-2">
                  <Link to="/find-houses" className="block px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors">
                    <div className="font-medium text-gray-800">Browse by Area</div>
                    <div className="text-sm text-gray-500">Search houses by location</div>
                  </Link>
                  <Link to="/find-houses" className="block px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors">
                    <div className="font-medium text-gray-800">Advanced Filters</div>
                    <div className="text-sm text-gray-500">Filter by price and type</div>
                  </Link>
                  <Link to="/find-houses" className="block px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors">
                    <div className="font-medium text-gray-800">Verified Listings</div>
                    <div className="text-sm text-gray-500">100% verified properties</div>
                  </Link>
                </div>
              </div>

              {/* UPDATED: Moving Services Dropdown */}
              <div className="dropdown-container relative">
                <span className="nav-link cursor-pointer">Moving Services</span>
                <div className="dropdown-menu absolute top-full left-0 w-72 bg-white rounded-xl shadow-xl border border-gray-100 p-2">
                  
                  {/* Link to Movers Listing Page */}
                  <Link to="/movers" className="block px-4 py-3 rounded-lg hover:bg-green-50 transition-colors">
                    <div className="font-medium text-gray-800">Find Registered Movers</div>
                    <div className="text-sm text-gray-500">Browse trusted partners</div>
                  </Link>

                  <Link to="/" className="block px-4 py-3 rounded-lg hover:bg-green-50 transition-colors">
                    <div className="font-medium text-gray-800">Request a Move</div>
                    <div className="text-sm text-gray-500">Get competitive quotes</div>
                  </Link>
                </div>
              </div>

              {/* About Dropdown */}
              <div className="dropdown-container relative">
                <span className="nav-link cursor-pointer">About</span>
                <div className="dropdown-menu absolute top-full left-0 w-72 bg-white rounded-xl shadow-xl border border-gray-100 p-2">
                  <Link to="/" className="block px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors">
                    <div className="font-medium text-gray-800">Our Mission</div>
                    <div className="text-sm text-gray-500">Simplifying house hunting</div>
                  </Link>
                  <Link to="/" className="block px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors">
                    <div className="font-medium text-gray-800">Contact Support</div>
                    <div className="text-sm text-gray-500">WhatsApp & Email</div>
                  </Link>
                </div>
              </div>

            </nav>

            {/* Desktop CTA Buttons */}
            <div className="hidden lg:flex items-center space-x-6">
              
              {/* Login Dropdown */}
              <div className="dropdown-container relative">
                <span className="nav-link cursor-pointer">Log In</span>
                <div className="dropdown-menu absolute top-full right-0 w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-2">
                  <Link to="/login" className="block px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors">
                    <div className="font-medium text-gray-800">Tenant / User</div>
                    <div className="text-sm text-gray-500">Access your searches</div>
                  </Link>
                  <Link to="/landlord-login" className="block px-4 py-3 rounded-lg hover:bg-green-50 transition-colors">
                    <div className="font-medium text-gray-800">Landlord</div>
                    <div className="text-sm text-gray-500">Manage your listings</div>
                  </Link>
                  <Link to="/mover-login" className="block px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors">
                    <div className="font-medium text-gray-800">Service Provider</div>
                    <div className="text-sm text-gray-500">Manage moving jobs</div>
                  </Link>
                </div>
              </div>

              <Link 
                to="/find-houses" 
                className="px-6 py-2.5 bg-gradient-to-r from-primary-blue to-primary-green text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                Find Houses
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              onClick={toggleMobileMenu}
              className="lg:hidden text-gray-800 focus:outline-none p-2"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 lg:hidden ${mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={toggleMobileMenu}
      ></div>

      {/* Mobile Menu Sidebar */}
      <div className={`mobile-menu fixed top-0 right-0 w-80 h-full bg-white z-50 shadow-2xl overflow-y-auto lg:hidden ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-8">
            <span className="text-xl font-bold font-brand brand-gradient">Rheaspark</span>
            <button onClick={toggleMobileMenu} className="text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <Link to="/" onClick={toggleMobileMenu} className="block py-3 text-gray-800 font-medium border-b border-gray-100">Home</Link>

            {/* Mobile Dropdown: Find a House */}
            <div className="border-b border-gray-100">
              <button onClick={() => handleDropdown('find')} className="w-full flex justify-between items-center py-3 text-gray-800 font-medium">
                Find a House
                <span className="text-gray-400">{openDropdown === 'find' ? '-' : '+'}</span>
              </button>
              {openDropdown === 'find' && (
                <div className="pl-4 pb-3 space-y-2">
                  <Link to="/find-houses" onClick={toggleMobileMenu} className="block py-2 text-gray-600">Browse by Area</Link>
                  <Link to="/find-houses" onClick={toggleMobileMenu} className="block py-2 text-gray-600">Verified Listings</Link>
                </div>
              )}
            </div>

            {/* UPDATED: Mobile Dropdown: Moving Services */}
            <div className="border-b border-gray-100">
              <button onClick={() => handleDropdown('moving')} className="w-full flex justify-between items-center py-3 text-gray-800 font-medium">
                Moving Services
                <span className="text-gray-400">{openDropdown === 'moving' ? '-' : '+'}</span>
              </button>
              {openDropdown === 'moving' && (
                <div className="pl-4 pb-3 space-y-2">
                  {/* Link to Movers Listing Page */}
                  <Link to="/movers" onClick={toggleMobileMenu} className="block py-2 text-gray-600">Find Registered Movers</Link>
                  <Link to="/" onClick={toggleMobileMenu} className="block py-2 text-gray-600">Request a Move</Link>
                </div>
              )}
            </div>

            {/* Mobile Dropdown: Log In */}
            <div className="border-b border-gray-100">
              <button onClick={() => handleDropdown('login')} className="w-full flex justify-between items-center py-3 text-gray-800 font-medium">
                Log In
                <span className="text-gray-400">{openDropdown === 'login' ? '-' : '+'}</span>
              </button>
              {openDropdown === 'login' && (
                <div className="pl-4 pb-3 space-y-2">
                  <Link to="/login" onClick={toggleMobileMenu} className="block py-2 text-gray-600">Tenant / User</Link>
                  <Link to="/landlord-login" onClick={toggleMobileMenu} className="block py-2 text-gray-600">Landlord Portal</Link>
                  <Link to="/mover-login" onClick={toggleMobileMenu} className="block py-2 text-gray-600">Mover Portal</Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile CTA */}
          <div className="mt-10 space-y-4">
            <Link to="/find-houses" onClick={toggleMobileMenu} className="block w-full py-3 text-center bg-gradient-to-r from-primary-blue to-primary-green text-white font-semibold rounded-lg shadow">
              Find Houses
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}