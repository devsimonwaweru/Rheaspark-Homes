/* eslint-disable react-hooks/immutability */
/* eslint-disable no-unused-vars */
// src/pages/LandlordPayments.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function LandlordPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    // Fetch rent transactions
    const { data } = await supabase
      .from('rent_transactions')
      .select('*, tenants(full_name)')
      .eq('landlord_id', user.id)
      .order('payment_date', { ascending: false });

    if (data) setPayments(data);
    setLoading(false);
  };

  const totalEarnings = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Payments & Earnings</h1>
          <p className="text-gray-500 text-sm">Track rental income and history</p>
        </div>
        <div className="bg-green-50 border border-green-200 px-4 py-2 rounded-lg">
          <p className="text-xs text-green-600 font-medium">Total Earnings</p>
          <h3 className="text-xl font-bold text-green-700">KES {totalEarnings.toLocaleString()}</h3>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Tenant</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6 text-sm text-gray-600">{p.payment_date || p.created_at?.split('T')[0]}</td>
                  <td className="py-4 px-6 text-sm font-medium text-gray-800">{p.tenants?.full_name || 'Unknown'}</td>
                  <td className="py-4 px-6 text-sm text-gray-500 capitalize">{p.type}</td>
                  <td className="py-4 px-6">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right font-bold text-gray-800">KES {p.amount?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}