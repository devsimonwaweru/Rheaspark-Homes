import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

export default function MoverSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Temporary static profile (since AuthContext does not exist)
  const profile = {
    full_name: "Mover",
    business_name: "Mover Business",
    email: "mover@email.com"
  };

  const handleLogout = () => {
    navigate('/');
  };

  const linkClass = (path) =>
    `flex items-center px-4 py-3 rounded-xl transition-all duration-200 mb-2 ${
      location.pathname === path
        ? 'bg-gradient-to-r from-primary-green to-teal-500 text-white shadow-md'
        : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-64 min-h-screen bg-white border-r border-gray-100 fixed left-0 top-0 z-30 hidden md:block">
        <div className="p-6 border-b border-gray-100">
          <Link to="/" className="flex items-center space-x-3">
            <img src={logo} alt="Logo" className="w-10 h-10 rounded-lg object-cover" />
            <span className="text-xl font-bold font-brand brand-gradient">Mover Panel</span>
          </Link>
        </div>

        <div className="p-4">
          <Link to="/mover" className={linkClass('/mover')}>
            <i className="fas fa-truck mr-3"></i> Dashboard
          </Link>

          <Link to="/mover/jobs" className={linkClass('/mover/jobs')}>
            <i className="fas fa-clipboard-list mr-3"></i> Job Requests
          </Link>

          <Link to="/mover/profile" className={linkClass('/mover/profile')}>
            <i className="fas fa-user-cog mr-3"></i> My Profile
          </Link>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-100">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
              <span className="font-bold text-primary-green">
                {profile.full_name.charAt(0)}
              </span>
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">
                {profile.business_name}
              </p>
              <p className="text-xs text-gray-500">
                {profile.email}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2 border border-red-100 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
          >
            <i className="fas fa-sign-out-alt mr-2"></i> Log Out
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-100 z-30">
        <div className="flex justify-between items-center p-4">
          <span className="font-bold font-brand brand-gradient">Mover Panel</span>
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="text-gray-600"
          >
            <i className={`fas ${showMobileMenu ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {showMobileMenu && (
        <div className="md:hidden fixed top-16 left-0 right-0 bg-white border-b border-gray-100 z-20 shadow-lg p-4">
          <Link
            to="/mover"
            onClick={() => setShowMobileMenu(false)}
            className="block py-3 text-gray-800 font-medium"
          >
            Dashboard
          </Link>

          <Link
            to="/mover/jobs"
            onClick={() => setShowMobileMenu(false)}
            className="block py-3 text-gray-800 font-medium"
          >
            Job Requests
          </Link>

          <button
            onClick={handleLogout}
            className="block py-3 text-red-500 font-medium w-full text-left"
          >
            Log Out
          </button>
        </div>
      )}
    </>
  );
}