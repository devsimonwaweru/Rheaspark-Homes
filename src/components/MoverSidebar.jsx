import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import PaymentModal from './PaymentModal';

export default function MoverSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth(); // Get profile and signOut function
  const [showPayment, setShowPayment] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/'); // Redirect to home after logout
  };

  const linkClass = (path) => 
    `flex items-center px-4 py-3 rounded-xl transition-all duration-200 mb-2 ${
      location.pathname === path 
        ? 'bg-gradient-to-r from-primary-green to-teal-500 text-white shadow-md' 
        : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <>
      <aside className="w-64 min-h-screen bg-white border-r border-gray-100 fixed left-0 top-0 z-30 hidden md:block">
        <div className="p-6 border-b border-gray-100">
          <Link to="/" className="flex items-center space-x-3">
            <img src={logo} alt="Logo" className="w-10 h-10 rounded-lg object-cover" />
            <span className="text-xl font-bold font-brand brand-gradient">Mover Panel</span>
          </Link>
        </div>

        <div className="p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase mb-4 px-4">Menu</p>
          
          <Link to="/mover" className={linkClass('/mover')}>
            <i className="fas fa-truck mr-3"></i> Dashboard
          </Link>
          
          <Link to="/mover/jobs" className={linkClass('/mover/jobs')}>
            <i className="fas fa-clipboard-list mr-3"></i> Job Requests
          </Link>

          <Link to="/mover/profile" className={linkClass('/mover/profile')}>
            <i className="fas fa-user-cog mr-3"></i> My Profile
          </Link>

          {/* Subscription Card */}
          <div className="mt-8 px-4">
            <div className={`p-4 rounded-xl border ${profile?.is_subscribed ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-gray-800 text-sm">Subscription</h4>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${profile?.is_subscribed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {profile?.is_subscribed ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-xs text-gray-600 mb-3">
                {profile?.is_subscribed ? 'You are visible to tenants.' : 'Pay to appear in search results.'}
              </p>
              <button 
                onClick={() => setShowPayment(true)}
                className="w-full py-2 bg-gradient-to-r from-primary-green to-teal-500 text-white text-xs font-semibold rounded-lg hover:shadow-md transition-all"
              >
                {profile?.is_subscribed ? 'Renew' : 'Activate Now'}
              </button>
            </div>
          </div>

          {/* Logout Button */}
          <div className="mt-8 px-4">
             <button 
               onClick={handleLogout}
               className="w-full flex items-center px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium"
             >
               <i className="fas fa-sign-out-alt mr-3"></i> Log Out
             </button>
          </div>
        </div>
      </aside>

      {/* Payment Modal triggered from Sidebar */}
      <PaymentModal 
        isOpen={showPayment} 
        onClose={() => setShowPayment(false)} 
        onSuccess={() => {
            // In a real app, you'd refresh the profile here
            alert("Payment Successful! Your profile is now active.");
            window.location.reload(); 
        }}
        type="mover" 
      />
    </>
  );
}