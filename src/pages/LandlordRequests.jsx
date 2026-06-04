/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/immutability */
// src/pages/LandlordRequests.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function LandlordRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    // Fetch requests linked to landlord's properties
    const { data, error } = await supabase
      .from('booking_requests')
      .select('*, properties(title)')
      .eq('properties.landlord_id', user.id) // This requires a join or filter logic
      .order('created_at', { ascending: false });

      // Simpler approach: Get IDs of landlord properties first, then filter
      // But ideally, a postgres view or RLS policy handles the join.
      // Here is the direct fetch assuming RLS allows reading requests for their properties:
      
    if (data) setRequests(data);
    setLoading(false);
  };

  const updateStatus = async (id, status) => {
    await supabase.from('booking_requests').update({ status }).eq('id', id);
    fetchRequests();
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Booking Requests</h1>
        <p className="text-gray-500 text-sm">Manage viewing requests from potential tenants</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {loading ? <p className="p-6 text-gray-400">Loading...</p> : requests.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            No requests found.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {requests.map((req) => (
              <div key={req.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    {req.tenant_name?.charAt(0) || 'T'}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{req.tenant_name}</h3>
                    <p className="text-sm text-gray-500">{req.tenant_phone} • {req.tenant_email}</p>
                    <p className="text-xs text-gray-400 mt-1">Property: <span className="font-medium text-gray-600">{req.properties?.title}</span></p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pl-16 md:pl-0">
                  <a href={`tel:${req.tenant_phone}`} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">
                    Call
                  </a>
                  
                  {req.status === 'pending' ? (
                    <>
                      <button onClick={() => updateStatus(req.id, 'approved')} className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-200">
                        Approve
                      </button>
                      <button onClick={() => updateStatus(req.id, 'rejected')} className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200">
                        Reject
                      </button>
                    </>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${req.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {req.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}