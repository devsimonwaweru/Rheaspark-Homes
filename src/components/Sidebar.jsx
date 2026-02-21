import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';
import PaymentModal from './PaymentModal';

export default function Sidebar() {
  const location = useLocation();
  const [showPayment, setShowPayment] = useState(false);

  const linkClass = (path) => 
    `flex items-center px-4 py-3 rounded-xl transition-all duration-200 mb-2 ${
      location.pathname === path 
        ? 'bg-gradient-to-r from-primary-blue to-primary-green text-white shadow-md' 
        : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <>
      <aside className="w-64 min-h-screen bg-white border-r border-gray-100 fixed left-0 top-0 z-30 hidden md:block">
        <div className="p-6 border-b border-gray-100">
          <Link to="/" className="flex items-center space-x-3">
            <img src={logo} alt="Logo" className="w-10 h-10 rounded-lg object-cover" />
            <span className="text-xl font-bold font-brand brand-gradient">Rheaspark</span>
          </Link>
        </div>

        <div className="p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase mb-4 px-4">Menu</p>
          
          <Link to="/landlord" className={linkClass('/landlord')}>
            <i className="fas fa-th-large mr-3"></i> Dashboard
          </Link>
          
          <Link to="/landlord/add-property" className={linkClass('/landlord/add-property')}>
            <i className="fas fa-plus-circle mr-3"></i> Add Property
          </Link>

          <Link to="/landlord/messages" className={linkClass('/landlord/messages')}>
            <i className="fas fa-envelope mr-3"></i> Messages
          </Link>

          {/* Subscription Card */}
          <div className="mt-8 px-4">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-gray-800 text-sm">Subscription</h4>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Active</span>
              </div>
              <p className="text-xs text-gray-600 mb-3">Pay KES 50/month to keep your account active.</p>
              <button 
                onClick={() => setShowPayment(true)}
                className="w-full py-2 bg-gradient-to-r from-primary-blue to-primary-green text-white text-xs font-semibold rounded-lg hover:shadow-md transition-all"
              >
                Pay Now
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Payment Modal triggered from Sidebar */}
      <PaymentModal 
        isOpen={showPayment} 
        onClose={() => setShowPayment(false)} 
        onSuccess={() => alert("Payment Successful! Your subscription is updated.")}
      />
    </>
  );
}