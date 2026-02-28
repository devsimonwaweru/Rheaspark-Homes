import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AdminDashboard() {
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    const fetchProps = async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) console.error(error);
      else setProperties(data);
    };
    fetchProps();
  }, []);

  const handleStatusChange = async (id, status) => {
    const { error } = await supabase
      .from('properties')
      .update({ status })
      .eq('id', id);
    if (error) console.error(error);
    else setProperties(props => props.map(p => p.id === id ? { ...p, status } : p));
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Admin - Manage Properties</h1>
      <table className="min-w-full bg-white border rounded-xl overflow-hidden">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-3">Title</th>
            <th className="p-3">Location</th>
            <th className="p-3">Price</th>
            <th className="p-3">Status</th>
            <th className="p-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {properties.map(p => (
            <tr key={p.id} className="border-t">
              <td className="p-3">{p.title}</td>
              <td className="p-3">{p.location}</td>
              <td className="p-3">KES {p.price?.toLocaleString()}</td>
              <td className="p-3">{p.status}</td>
              <td className="p-3 space-x-2">
                <button onClick={() => handleStatusChange(p.id, p.status === 'active' ? 'inactive' : 'active')}
                  className="px-3 py-1 bg-blue-500 text-white rounded">
                  Toggle Status
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}