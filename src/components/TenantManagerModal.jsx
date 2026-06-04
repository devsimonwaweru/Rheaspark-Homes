/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function TenantManagerModal({ isOpen, onClose, property }) {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('list'); // 'list' or 'add'

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [rent, setRent] = useState('');
  const [unit, setUnit] = useState('');

  useEffect(() => {
    if (isOpen && property) fetchTenants();
  }, [isOpen, property]);

  const fetchTenants = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('tenants')
      .select('*')
      .eq('property_id', property.id)
      .eq('is_active', true);
    
    if (data) setTenants(data);
    setLoading(false);
  };

  const handleAddTenant = async (e) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('tenants').insert({
      property_id: property.id,
      full_name: name,
      phone: phone,
      monthly_rent: parseFloat(rent),
      unit_number: unit,
      landlord_id: user.id // Needed if your RLS checks this directly
    });

    if (!error) {
      setName(''); setPhone(''); setRent(''); setUnit('');
      setView('list');
      fetchTenants();
    } else {
      alert("Error adding tenant: " + error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{property.title}</h2>
            <p className="text-sm text-gray-500">Tenant & Rent Manager</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">&times;</button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          
          {loading ? (
            <div className="text-center py-10 text-gray-400">Loading...</div>
          ) : (
            <>
              {/* View Toggle */}
              <div className="flex gap-2 mb-6">
                <button 
                  onClick={() => setView('list')}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${view === 'list' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Tenants ({tenants.length})
                </button>
                <button 
                  onClick={() => setView('add')}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${view === 'add' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  + Add New Tenant
                </button>
              </div>

              {/* List View */}
              {view === 'list' && (
                <div className="space-y-3">
                  {tenants.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                      No tenants added yet.
                    </div>
                  ) : (
                    tenants.map((t) => (
                      <div key={t.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-gray-800">{t.full_name}</h4>
                          <p className="text-xs text-gray-500">Unit: {t.unit_number || 'N/A'} | Phone: {t.phone || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">KES {t.monthly_rent?.toLocaleString()}</p>
                          <button className="text-xs text-blue-600 font-semibold hover:underline">Record Payment</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Add View */}
              {view === 'add' && (
                <form onSubmit={handleAddTenant} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Tenant Full Name</label>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      required
                      className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-blue-500 outline-none" 
                      placeholder="John Doe" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Phone Number</label>
                      <input 
                        type="text" 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)} 
                        className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-blue-500 outline-none" 
                        placeholder="0712..." 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Unit / House No.</label>
                      <input 
                        type="text" 
                        value={unit} 
                        onChange={(e) => setUnit(e.target.value)} 
                        className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-blue-500 outline-none" 
                        placeholder="A1" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Monthly Rent (KES)</label>
                    <input 
                      type="number" 
                      value={rent} 
                      onChange={(e) => setRent(e.target.value)} 
                      required
                      className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-blue-500 outline-none" 
                      placeholder="15000" 
                    />
                  </div>
                  
                  <button type="submit" className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors">
                    Save Tenant
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}