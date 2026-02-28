/* eslint-disable react-hooks/immutability */
// src/pages/LandlordHome.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';

export default function LandlordHome() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    // Since no login, we just fetch all properties (Admin style view)
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProperties(data);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Loading...</div>;
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Property Manager</h1>
        <Link 
          to="/landlord/add-property" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold text-sm transition"
        >
          + Add New Property
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Total Listed</p>
          <h3 className="text-2xl font-bold text-gray-800">{properties.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Active Listings</p>
          <h3 className="text-2xl font-bold text-green-600">
            {properties.filter(p => p.status === 'active').length}
          </h3>
        </div>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-400 mb-4">No properties found.</p>
          <Link to="/landlord/add-property" className="text-blue-600 font-semibold hover:underline">
            Post your first property
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((p) => (
            <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
              {p.image_url ? (
                <img src={p.image_url} alt={p.title} className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400">No Image</div>
              )}
              <div className="p-4">
                <span className="text-xs font-bold text-blue-600 uppercase">{p.type || 'Property'}</span>
                <h3 className="font-bold text-gray-800 mt-1 truncate">{p.title}</h3>
                <p className="text-gray-500 text-sm">KES {p.price?.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">By: {p.landlord_name}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}