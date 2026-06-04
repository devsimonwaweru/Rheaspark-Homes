/* eslint-disable react-hooks/immutability */
// src/pages/LandlordMaintenance.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function LandlordMaintenance() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data } = await supabase
      .from('maintenance_requests')
      .select('*, properties(title)')
      .eq('landlord_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setIssues(data);
    setLoading(false);
  };

  const updateStatus = async (id, status) => {
    await supabase.from('maintenance_requests').update({ status }).eq('id', id);
    fetchIssues();
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    in_progress: 'bg-blue-100 text-blue-700',
    resolved: 'bg-green-100 text-green-700'
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Maintenance</h1>
        <p className="text-gray-500 text-sm">Track and resolve property issues</p>
      </div>

      <div className="space-y-4">
        {loading ? <p>Loading...</p> : issues.map((issue) => (
          <div key={issue.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-4">
              <div className={`w-2 h-full min-h-[40px] rounded-full ${issue.priority === 'high' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-gray-800">{issue.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[issue.status]}`}>
                    {issue.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{issue.description}</p>
                <p className="text-xs text-gray-400 mt-2">Property: {issue.properties?.title}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 pl-6 md:pl-0">
              {issue.status !== 'resolved' && (
                <button 
                  onClick={() => updateStatus(issue.id, issue.status === 'pending' ? 'in_progress' : 'resolved')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  {issue.status === 'pending' ? 'Start Work' : 'Mark Resolved'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}