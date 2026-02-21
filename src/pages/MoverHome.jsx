/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

export default function MoverHome() {
  const { user } = useAuth();
  const [moverData, setMoverData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMoverData();
  }, [fetchMoverData, user]);

  const fetchMoverData = async () => {
    if (!user) return;

    try {
      // Fetch specific mover details from 'movers' table
      const { data, error } = await supabase
        .from('movers')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setMoverData(data);
    } catch (error) {
      console.error("Error fetching mover data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-10">Loading Dashboard...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome, {moverData?.business_name || 'Mover'}
          </h1>
          <p className="text-gray-500">Here is your business overview.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Jobs</p>
              <h3 className="text-2xl font-bold text-gray-800">{moverData?.jobs_completed || 0}</h3>
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
                {moverData?.rating ? moverData.rating.toFixed(1) : '0.0'} 
                <i className="fas fa-star text-yellow-400 text-lg ml-2"></i>
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
              <p className="text-sm text-gray-500">Verification</p>
              <h3 className={`text-2xl font-bold ${moverData?.is_verified ? 'text-green-600' : 'text-orange-500'}`}>
                {moverData?.is_verified ? 'Verified' : 'Pending'}
              </h3>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${moverData?.is_verified ? 'bg-green-100' : 'bg-orange-100'}`}>
              <i className={`fas ${moverData?.is_verified ? 'fa-check-circle text-green-600' : 'fa-clock text-orange-500'}`}></i>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Job Requests (Placeholder) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Recent Job Requests</h3>
          <a href="#" className="text-sm text-primary-green font-semibold hover:underline">View All</a>
        </div>
        
        <div className="p-6 text-center text-gray-500">
          <i className="fas fa-inbox text-4xl mb-3 text-gray-300"></i>
          <p>No new job requests at the moment.</p>
          <p className="text-sm">Ensure your subscription is active to receive requests.</p>
        </div>
      </div>
    </div>
  );
}