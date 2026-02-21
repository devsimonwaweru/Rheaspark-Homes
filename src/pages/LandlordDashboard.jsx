import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PaymentModal from '../components/PaymentModal';

export default function LandlordDashboard() {
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(true);
  const [showRenewalModal, setShowRenewalModal] = useState(false);

  // Simulate checking subscription expiry on load
  useEffect(() => {
    // In a real app, you would check a 'expiry_date' from your backend
    // For demo: we randomly set it to false sometimes, or you can force it
    const checkSubscription = () => {
      // FOR TESTING: Set this to false to see the Renewal Modal immediately
      // In production, this would be a real API check
      const active = true; // Change to false to test renewal popup
      setIsSubscriptionActive(active);
      
      if (!active) {
        setShowRenewalModal(true);
      }
    };

    checkSubscription();
  }, []);

  const handleRenewalSuccess = () => {
    setIsSubscriptionActive(true);
    setShowRenewalModal(false);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="md:ml-64 p-8">
        {/* Inject "Simulate Expiry" button for demo purposes */}
        <div className="fixed bottom-4 left-4 z-50">
           <button 
             onClick={() => setShowRenewalModal(true)}
             className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded shadow hover:bg-red-200"
           >
             Simulate Expiry (Test)
           </button>
        </div>

        <Outlet context={{ isSubscriptionActive }} /> 
      </div>

      {/* RENEWAL MODAL (Blocks screen if expired) */}
      <PaymentModal 
        isOpen={showRenewalModal} 
        onClose={() => {}} // Cannot close if subscription is expired
        onSuccess={handleRenewalSuccess}
      />
    </div>
  );
}