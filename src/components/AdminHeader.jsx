/* eslint-disable no-unused-vars */
// src/components/AdminHeader.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Assuming you have auth context

const AdminHeader = ({ toggleSidebar }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  
  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Mobile Menu Button */}
        <button 
          onClick={toggleSidebar}
          className="md:hidden text-gray-600 hover:text-[#2FA4E7] transition-colors duration-300 mr-4"
        >
          <i className="fas fa-bars text-xl"></i>
        </button>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search users, properties, requests..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#2FA4E7] focus:ring-2 focus:ring-blue-100 transition-all duration-300"
            />
            <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-6 ml-4">
          {/* Notifications */}
          <div className="relative">
            <button className="relative text-gray-600 hover:text-[#2FA4E7] transition-colors duration-300">
              <i className="fas fa-bell text-xl"></i>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>
          </div>

          {/* Date & Time */}
          <div className="text-right hidden md:block">
            <div className="text-sm text-gray-600">{formattedDate}</div>
            <div className="text-lg font-semibold text-gray-800">{formattedTime}</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;