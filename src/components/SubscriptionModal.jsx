import React from "react";

export default function SubscriptionModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="p-8 text-center border-b border-gray-100">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Activate Your Account</h2>
          <p className="text-gray-500 mt-2">Landlord Subscription Plan</p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-4">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-gray-700">Monthly Subscription</span>
              <span className="text-xl font-bold text-blue-600">KES 50</span>
            </div>
            <ul className="text-sm text-gray-500 space-y-1 mt-3">
              <li className="flex items-center"><svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>Post Unlimited Properties</li>
              <li className="flex items-center"><svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>Priority Listing Support</li>
              <li className="flex items-center"><svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>Direct Tenant Leads</li>
            </ul>
          </div>
          
          <p className="text-xs text-gray-400 text-center">
            By subscribing, you agree to our terms of service. You can cancel anytime.
          </p>
        </div>

        {/* Actions */}
        <div className="p-6 bg-gray-50 flex flex-col space-y-3">
          <button
            onClick={onConfirm}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            Proceed to Payment
          </button>
          <button
            onClick={onClose}
            className="w-full text-gray-500 hover:text-gray-700 font-medium py-2 transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes scale-in {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in { animation: scale-in 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
}