
// src/pages/LandlordHome.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useOutletContext } from 'react-router-dom';

export default function LandlordHome() {
  // Get the modal trigger function from LandlordDashboard context
  const { openAddPropertyModal } = useOutletContext();

  const [properties, setProperties] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      // 1. Get User
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 2. Get Profile
      const { data: landlordProfile } = await supabase
        .from('landlords')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProfile(landlordProfile);

      // 3. Get Properties for this Landlord
      const { data: propsData } = await supabase
        .from('properties')
        .select('*')
        .eq('landlord_id', user.id)
        .order('created_at', { ascending: false });

      if (propsData) setProperties(propsData);
      
      setLoading(false);
    };

    loadData();
  }, []);

  // Stats calculation
  const totalListed = properties.length;
  const activeListings = properties.filter(p => p.status === 'active').length;
  const pendingListings = totalListed - activeListings;

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-2xl p-8 text-white shadow-xl mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {profile?.full_name?.split(' ')[0] || 'Landlord'}!
        </h1>
        <p className="text-blue-100">
          Manage your properties and track performance from your dashboard.
        </p>
      </div>

      {/* Top Actions */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold text-gray-800">Overview</h2>
        {/* Updated Button to trigger modal */}
        <button 
          onClick={openAddPropertyModal} 
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-emerald-500 text-white px-6 py-2.5 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          <span>Add New Property</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Card 1: Total */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <span className="text-green-500 text-xs font-medium bg-green-50 px-2 py-1 rounded">Live</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-800 mb-1">{totalListed}</h3>
          <p className="text-gray-500 text-sm">Total Listed Properties</p>
        </div>

        {/* Card 2: Active */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 rounded-lg">
               <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <h3 className="text-3xl font-bold text-emerald-600 mb-1">{activeListings}</h3>
          <p className="text-gray-500 text-sm">Active Listings</p>
        </div>

        {/* Card 3: Pending/Inactive */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-yellow-50 rounded-lg">
               <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-800 mb-1">{pendingListings}</h3>
          <p className="text-gray-500 text-sm">Pending / Inactive</p>
        </div>
      </div>

      {/* Properties List Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Your Properties</h3>
        
        {properties.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            <p className="text-gray-500 mb-4">You haven't listed any properties yet.</p>
            <button onClick={openAddPropertyModal} className="text-blue-600 font-semibold hover:underline text-sm">
              Post your first property →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((p) => (
              <div key={p.id} className="group bg-gray-50 rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all hover:border-blue-200">
                {p.image_url ? (
                  <div className="relative h-40 overflow-hidden">
                    <img src={p.image_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute top-2 right-2 px-2 py-1 text-xs font-bold bg-white bg-opacity-90 rounded text-blue-600 uppercase shadow-sm">{p.type || 'Property'}</div>
                  </div>
                ) : (
                  <div className="w-full h-40 bg-gray-200 flex items-center justify-center text-gray-400">
                     <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-bold text-gray-800 truncate">{p.title}</h3>
                  <p className="text-blue-600 font-semibold text-sm mt-1">KES {p.price?.toLocaleString()}</p>
                  <p className="text-gray-400 text-xs mt-1 truncate">{p.location || 'Location not set'}</p>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                     <span className={`text-xs font-medium px-2 py-1 rounded-full ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                       {p.status || 'inactive'}
                     </span>
                     <button className="text-xs font-semibold text-blue-600 hover:underline">View Details</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}