import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const AdminSettings = () => {
  const { user } = useAuth() || {};
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newType, setNewType] = useState('');
  const [newViewFee, setNewViewFee] = useState(100);
  const [newAgentFee, setNewAgentFee] = useState(500);

  const defaultPropertyTypes = [
    { id: 1, property_type: 'Bedsitter/Studio', view_fee: 30, agent_fee: 200 },
    { id: 2, property_type: 'Single Room', view_fee: 20, agent_fee: 150 },
    { id: 3, property_type: '1 Bedroom', view_fee: 50, agent_fee: 300 },
    { id: 4, property_type: '2 Bedroom', view_fee: 80, agent_fee: 400 },
    { id: 5, property_type: '3 Bedroom', view_fee: 100, agent_fee: 500 },
    { id: 6, property_type: 'Apartment/Flat', view_fee: 100, agent_fee: 600 },
    { id: 7, property_type: 'Commercial', view_fee: 150, agent_fee: 800 },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('viewing_fees')
      .select('*')
      .order('id');

    if (error) {
      console.error('Error fetching settings:', error);
      setSettings(defaultPropertyTypes);
    } else if (data && data.length > 0) {
      setSettings(data);
    } else {
      setSettings(defaultPropertyTypes);
    }
    setLoading(false);
  };

  const handleFeeChange = (id, field, value) => {
    setSettings(prev => prev.map(s => 
      s.id === id ? { ...s, [field]: parseInt(value) || 0 } : s
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('viewing_fees')
        .upsert(settings.map(s => ({
          id: s.id,
          property_type: s.property_type,
          view_fee: s.view_fee,
          agent_fee: s.agent_fee,
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        })), { onConflict: 'id' });

      if (error) throw error;
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    }
    setSaving(false);
  };

  const handleAddType = async () => {
    if (!newType.trim()) return;
    
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('viewing_fees')
        .insert({
          property_type: newType.trim(),
          view_fee: newViewFee,
          agent_fee: newAgentFee,
          updated_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;
      
      setSettings(prev => [...prev, data]);
      setAddModalOpen(false);
      setNewType('');
      setNewViewFee(100);
      setNewAgentFee(500);
      setMessage({ type: 'success', text: 'Property type added successfully!' });
    } catch (error) {
      console.error('Error adding type:', error);
      setMessage({ type: 'error', text: 'Failed to add property type.' });
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this fee configuration?')) return;
    
    try {
      const { error } = await supabase
        .from('viewing_fees')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSettings(prev => prev.filter(s => s.id !== id));
      setMessage({ type: 'success', text: 'Fee configuration deleted.' });
    } catch (error) {
      console.error('Error deleting:', error);
      setMessage({ type: 'error', text: 'Failed to delete.' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Viewing Fee Settings</h1>
          <p className="text-gray-500 mt-1">Configure fees charged when users unlock property details</p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Type
        </button>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          <svg className={`w-5 h-5 flex-shrink-0 ${message.type === 'success' ? 'text-green-500' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 20 20">
            {message.type === 'success' 
              ? <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              : <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            }
          </svg>
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 font-semibold text-sm text-gray-600">
          <div className="col-span-4">Property Type</div>
          <div className="col-span-3">View Details Fee</div>
          <div className="col-span-3">Agent Escort Fee</div>
          <div className="col-span-1 text-center">Total</div>
          <div className="col-span-1 text-center">Actions</div>
        </div>

        {settings.map((setting, index) => (
          <div key={setting.id} className={`grid grid-cols-12 gap-4 p-4 border-b border-gray-100 items-center hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
            <div className="col-span-4 font-medium text-gray-800 flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              {setting.property_type}
            </div>
            <div className="col-span-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">KES</span>
                <input
                  type="number"
                  value={setting.view_fee}
                  onChange={(e) => handleFeeChange(setting.id, 'view_fee', e.target.value)}
                  className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  min="0"
                />
              </div>
            </div>
            <div className="col-span-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">KES</span>
                <input
                  type="number"
                  value={setting.agent_fee}
                  onChange={(e) => handleFeeChange(setting.id, 'agent_fee', e.target.value)}
                  className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  min="0"
                />
              </div>
            </div>
            <div className="col-span-1 text-center">
              <span className="text-sm font-semibold text-gray-700">KES {(setting.view_fee + setting.agent_fee).toLocaleString()}</span>
            </div>
            <div className="col-span-1 text-center">
              <button
                onClick={() => handleDelete(setting.id)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {settings.map((setting) => (
          <div key={setting.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span className="font-semibold text-gray-800">{setting.property_type}</span>
              </div>
              <button
                onClick={() => handleDelete(setting.id)}
                className="p-2 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">View Fee</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">KES</span>
                  <input
                    type="number"
                    value={setting.view_fee}
                    onChange={(e) => handleFeeChange(setting.id, 'view_fee', e.target.value)}
                    className="w-full pl-11 pr-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    min="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Agent Fee</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">KES</span>
                  <input
                    type="number"
                    value={setting.agent_fee}
                    onChange={(e) => handleFeeChange(setting.id, 'agent_fee', e.target.value)}
                    className="w-full pl-11 pr-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                    min="0"
                  />
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 text-center">
              <span className="text-sm text-gray-500">Combined: </span>
              <span className="text-sm font-bold text-gray-800">KES {(setting.view_fee + setting.agent_fee).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
        >
          {saving && (
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          Save All Changes
        </button>
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Fee Structure Explanation
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white/60 rounded-lg p-4 border border-blue-100">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-800 text-sm mb-1">View Details Fee</h4>
            <p className="text-xs text-gray-600">Charged when user unlocks phone number, exact location, and property details.</p>
          </div>
          <div className="bg-white/60 rounded-lg p-4 border border-purple-100">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-800 text-sm mb-1">Agent Escort Fee</h4>
            <p className="text-xs text-gray-600">Charged when user requests to be physically taken to view the property by an agent.</p>
          </div>
          <div className="bg-white/60 rounded-lg p-4 border border-green-100">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-800 text-sm mb-1">Full Access (Both)</h4>
            <p className="text-xs text-gray-600">Users can choose to pay for both options at once with a combined fee.</p>
          </div>
        </div>
      </div>

      {/* Add New Type Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setAddModalOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Add Property Type</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Type Name</label>
                <input
                  type="text"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  placeholder="e.g., 4 Bedroom"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">View Fee (KES)</label>
                  <input
                    type="number"
                    value={newViewFee}
                    onChange={(e) => setNewViewFee(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agent Fee (KES)</label>
                  <input
                    type="number"
                    value={newAgentFee}
                    onChange={(e) => setNewAgentFee(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    min="0"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setAddModalOpen(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddType}
                disabled={saving || !newType.trim()}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Add Type
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;