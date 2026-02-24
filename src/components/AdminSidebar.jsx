/* eslint-disable no-undef */
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';


export default function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  // eslint-disable-next-line no-undef


  const linkClass = (path) => 
    `flex items-center px-4 py-3 rounded-xl mb-2 transition-all ${
      location.pathname === path ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
    }`;

  return (
    <aside className="w-64 min-h-screen bg-gray-800 fixed left-0 top-0 z-30 hidden md:block">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-xl font-bold text-white">Admin Panel</h1>
      </div>

      <div className="p-4">
        <Link to="/admin" className={linkClass('/admin')}>
          <i className="fas fa-tachometer-alt mr-3"></i> Dashboard
        </Link>
        <Link to="/admin/movers" className={linkClass('/admin/movers')}>
          <i className="fas fa-truck mr-3"></i> Movers
        </Link>
        <Link to="/admin/landlords" className={linkClass('/admin/landlords')}>
          <i className="fas fa-home mr-3"></i> Landlords
        </Link>
        
        <div className="mt-10 border-t border-gray-700 pt-4">
          <button 
            onClick={async () => { await signOut(); navigate('/'); }}
            className="w-full flex items-center px-4 py-3 text-red-400 hover:bg-gray-700 rounded-xl"
          >
            <i className="fas fa-sign-out-alt mr-3"></i> Logout
          </button>
        </div>
      </div>
    </aside>
  );
}