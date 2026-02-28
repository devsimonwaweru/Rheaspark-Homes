// src/components/LandlordSidebar.jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function LandlordSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    { label: 'Dashboard', to: '/landlord' },
    { label: 'Add Property', to: '/landlord/add-property' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-white shadow-sm p-4 sticky top-0 z-40">
        <span className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
          Rheaspark
        </span>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-gray-700 text-2xl p-2 hover:bg-gray-100 rounded"
        >
          ☰
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`bg-white fixed md:static top-0 left-0 h-full shadow-xl md:shadow-none z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 w-64 border-r border-gray-100`}
      >
        <div className="p-6 flex flex-col h-full">
          {/* Logo Area */}
          <div className="mb-10 hidden md:block">
            <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Rheaspark
            </h2>
            <p className="text-xs text-gray-400 mt-1">Landlord Panel</p>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-2 flex-grow">
            {menuItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setIsOpen(false)}
                className={`py-3 px-4 rounded-lg transition duration-200 font-medium ${
                  isActive(item.to)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          
          {/* Bottom Section */}
          <div className="border-t border-gray-100 pt-4 mt-4">
             <p className="text-xs text-gray-400 text-center">© 2023 Rheaspark</p>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black opacity-25 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}