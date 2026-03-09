// src/pages/AdminMovers.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AdminMovers = () => {
  const [movers, setMovers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchMovers(); }, []);

  const fetchMovers = async () => {
    try {
      const { data, error } = await supabase
        .from('movers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setMovers(data || []);
    } catch (error) {
      console.error("Error fetching movers:", error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading movers...</div>;

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Moving Services</h1>
        <p className="text-gray-600">Manage all registered movers</p>
      </div>

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {movers.map((mover) => (
                <tr key={mover.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{mover.full_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{mover.business_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{mover.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${mover.is_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {mover.is_verified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {movers.length === 0 && <div className="text-center py-10 text-gray-500">No movers found.</div>}
        </div>
      </div>
    </div>
  );
};

export default AdminMovers;