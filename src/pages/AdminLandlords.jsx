// src/pages/AdminLandlords.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AdminLandlords = () => {
  const [landlords, setLandlords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchLandlords(); }, []);

  const fetchLandlords = async () => {
    try {
      const { data, error } = await supabase
        .from('landlords')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setLandlords(data || []);
    } catch (error) {
      console.error("Error fetching landlords:", error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading landlords...</div>;

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Landlords Management</h1>
        <p className="text-gray-600">Manage all registered landlords</p>
      </div>

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subscription</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {landlords.map((ll) => (
                <tr key={ll.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{ll.full_name}</div>
                    <div className="text-sm text-gray-500">{ll.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{ll.business_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${ll.is_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {ll.is_verified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">{ll.subscription_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {landlords.length === 0 && <div className="text-center py-10 text-gray-500">No landlords found.</div>}
        </div>
      </div>
    </div>
  );
};

export default AdminLandlords;