// src/components/AdminSidebar.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminSidebar = ({ closeSidebar }) => {
  const { user, logout } = useAuth() || {}; 
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      if (logout) await logout();
      navigate('/login');
    } catch (error) {
      console.error("Logout failed:", error);
      navigate('/login');
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: 'fa-tachometer-alt' },
    { name: 'Users', path: '/admin/users', icon: 'fa-users' },
    { name: 'Landlords', path: '/admin/landlords', icon: 'fa-user-tie' },
    { name: 'Properties', path: '/admin/properties', icon: 'fa-home' },
    { name: 'Movers', path: '/admin/movers', icon: 'fa-truck' },
  ];

  return (
    <div className="h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col w-64">
      
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#2FA4E7] to-[#3CB371] flex items-center justify-center mr-3">
            <i className="fas fa-shield-alt text-white"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold">Rheaspark</h1>
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Admin Profile */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#2FA4E7] to-[#3CB371] flex items-center justify-center border-2 border-[#3CB371]">
              <i className="fas fa-user text-white text-lg"></i>
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
          </div>
          <div className="ml-4">
            <h3 className="font-semibold">{user?.email || 'Admin User'}</h3>
            <p className="text-sm text-gray-400">Administrator</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={() => closeSidebar && closeSidebar()}
            className={({ isActive }) =>
              `sidebar-link flex items-center p-3 rounded-lg hover:bg-gray-700 transition-all duration-300 ${
                isActive ? 'active bg-gray-700 text-white' : 'text-gray-300 hover:text-white'
              }`
            }
          >
            <i className={`fas ${item.icon} w-6 mr-3`}></i>
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-700">
        <button 
          onClick={handleLogout}
          className="flex items-center p-3 rounded-lg hover:bg-gray-700 w-full text-left text-gray-300 hover:text-white transition-colors duration-300"
        >
          <i className="fas fa-sign-out-alt w-6 mr-3"></i>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;