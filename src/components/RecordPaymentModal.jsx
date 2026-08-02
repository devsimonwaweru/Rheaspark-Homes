// src/components/RecordPaymentModal.jsx
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function RecordPaymentModal({ isOpen, onClose, unit, tenant, onSave }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('M-Pesa');
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return alert("Enter a valid amount.");

    setLoading(true);

    try {
      const { error } = await supabase.from('payments').insert({
        unit_id: unit.id,
        tenant_id: tenant?.id || null,
        amount: parseFloat(amount), // Positive = Payment
        type: 'payment',
        method: method,
        reference: reference,
        status: 'paid' // ✅ BUG FIX 2: Ensure manual payments are marked as paid
      });

      if (error) throw error;
      onSave(); // Refresh data
      onClose(); // Close modal
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in">
        <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
          <div>
            <h3 className="font-bold">Record Payment</h3>
            <p className="text-sm text-blue-100">{unit?.unit_name}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-600 block mb-1">Amount (KES)</label>
            <input 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              className="w-full border-2 border-gray-200 rounded-xl p-3 text-lg font-bold focus:border-blue-500 outline-none"
              placeholder="e.g 5000"
              required
            />
          </div>

          <div>
            <label className="text-sm font-bold text-gray-600 block mb-1">Method</label>
            <select 
              value={method} 
              onChange={(e) => setMethod(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl p-3 outline-none bg-white"
            >
              <option>M-Pesa</option>
              <option>Cash</option>
              <option>Bank Transfer</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-bold text-gray-600 block mb-1">Reference (Optional)</label>
            <input 
              type="text" 
              value={reference} 
              onChange={(e) => setReference(e.target.value)} 
              className="w-full border-2 border-gray-200 rounded-xl p-3 outline-none"
              placeholder="M-Pesa Code / Receipt No"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border hover:bg-gray-50 font-medium text-gray-600">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50">
              {loading ? "Saving..." : "Save Payment"}
            </button>
          </div>
        </form>
      </div>
      
      <style>{`
        @keyframes scale-in { 0% { transform: scale(0.95); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .animate-scale-in { animation: scale-in 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
}