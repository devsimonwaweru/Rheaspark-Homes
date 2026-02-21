import React, { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';

export default function LandlordHome() {
  const { isSubscriptionActive } = useOutletContext(); // Get state from Layout
    
  const [properties] = useState([
    { id: 1, title: "Apartment in Westlands", status: "Active", price: "85,000", views: 24 },
    { id: 2, title: "Bedsitter in South B", status: "Pending", price: "25,000", views: 5 },
  ]);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500">Welcome back, Landlord!</p>
        </div>
        <Link 
          to="/landlord/add-property"
          className="px-6 py-3 bg-gradient-to-r from-primary-blue to-primary-green text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
        >
          <i className="fas fa-plus mr-2"></i> Add New Property
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* ... Properties and Views cards (same as before) ... */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Properties</p>
              <h3 className="text-2xl font-bold text-gray-800">{properties.length}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <i className="fas fa-home text-primary-blue"></i>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="text-gray-400">Views Card...</div>
          </div>
        </div>

        {/* Subscription Status Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Subscription</p>
              <h3 className={`text-2xl font-bold ${isSubscriptionActive ? 'text-green-600' : 'text-red-500'}`}>
                {isSubscriptionActive ? 'Active' : 'Expired'}
              </h3>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isSubscriptionActive ? 'bg-green-100' : 'bg-red-100'}`}>
              <i className={`fas ${isSubscriptionActive ? 'fa-check-circle text-green-600' : 'fa-exclamation-triangle text-red-500'}`}></i>
            </div>
          </div>
        </div>
      </div>

      {/* Properties Table (Same as before) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* ... Table code ... */}
      </div>
    </div>
  );
}