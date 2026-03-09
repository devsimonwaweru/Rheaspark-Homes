// src/pages/AdminProperties.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AdminProperties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchProperties(); }, []);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error("Error fetching properties:", error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading properties...</div>;

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Properties Management</h1>
        <p className="text-gray-600">Manage all listed rental properties</p>
      </div>

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Landlord</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {properties.map((prop) => (
                <tr key={prop.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-gray-100 mr-3 overflow-hidden flex items-center justify-center">
                         {prop.image_url ? (
                           <img src={prop.image_url} className="w-full h-full object-cover" alt="" />
                         ) : (
                           <i className="fas fa-home text-gray-400"></i>
                         )}
                      </div>
                      <div>
                         <div className="font-medium text-gray-900">{prop.title}</div>
                         <div className="text-xs text-gray-500">{prop.type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{prop.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#2FA4E7]">
                    KES {prop.price?.toLocaleString() || '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${prop.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {prop.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{prop.landlord_name || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {properties.length === 0 && <div className="text-center py-10 text-gray-500">No properties found.</div>}
        </div>
      </div>
    </div>
  );
};

export default AdminProperties;