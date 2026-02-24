import React from 'react';

export default function MoverHome() {
  // Temporary static profile
  const profile = {
    full_name: "Mover",
    business_name: "Mover Business"
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Welcome, {profile.business_name || profile.full_name || 'Mover'}
        </h1>
        <p className="text-gray-500 mt-1">Here is your business overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completed Jobs</p>
              <h3 className="text-2xl font-bold text-gray-800">0</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <i className="fas fa-briefcase text-primary-green"></i>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Rating</p>
              <h3 className="text-2xl font-bold text-gray-800">
                0.0 <i className="fas fa-star text-yellow-400 text-lg"></i>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <i className="fas fa-star text-yellow-500"></i>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <h3 className="text-2xl font-bold text-green-600">Active</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <i className="fas fa-check-circle text-green-500"></i>
            </div>
          </div>
        </div>

      </div>

      {/* Recent Jobs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Recent Job Requests</h3>
          <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">
            New
          </span>
        </div>
        
        <div className="p-10 text-center text-gray-400">
          <i className="fas fa-inbox text-4xl mb-3 text-gray-200"></i>
          <p>No new job requests yet.</p>
          <p className="text-sm mt-1">
            Ensure your profile is complete to attract clients.
          </p>
        </div>
      </div>
    </div>
  );
}