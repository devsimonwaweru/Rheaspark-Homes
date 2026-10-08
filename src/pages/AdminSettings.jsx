/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const AdminSettings = () => {
  const { user } = useAuth() || {};
  const [activeTab, setActiveTab] = useState('houses');

  // House settings state
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newType, setNewType] = useState('');
  const [newViewFee, setNewViewFee] = useState(100);
  const [newAgentFee, setNewAgentFee] = useState(500);
  const [isPersisted, setIsPersisted] = useState(false);

  // Airbnb settings state
  const [airbnbSettings, setAirbnbSettings] = useState({ commission_percentage: 15, default_min_nights: 1 });
  const [loadingAirbnb, setLoadingAirbnb] = useState(true);

  // Booking fee settings state
  const [bookingFee, setBookingFee] = useState({ fee_type: 'fixed', fee_value: 0 });
  const [loadingBookingFee, setLoadingBookingFee] = useState(true);

  useEffect(() => {
    if (activeTab === 'houses') fetchSettings();
    if (activeTab === 'airbnb') fetchAirbnbSettings();
    if (activeTab === 'booking') fetchBookingFee();
  }, [activeTab]);

  // ==================== HOUSE SETTINGS ====================
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('viewing_fees').select('*').order('id');
      if (error) throw error;
      if (data && data.length > 0) { setSettings(data); setIsPersisted(true); }
      else {
        setSettings([
          { id: null, property_type: 'Bedsitter/Studio', view_fee: 30, agent_fee: 200 },
          { id: null, property_type: 'Single Room', view_fee: 20, agent_fee: 150 },
          { id: null, property_type: '1 Bedroom', view_fee: 50, agent_fee: 300 },
          { id: null, property_type: '2 Bedroom', view_fee: 80, agent_fee: 400 },
          { id: null, property_type: '3 Bedroom', view_fee: 100, agent_fee: 500 },
          { id: null, property_type: 'Apartment/Flat', view_fee: 100, agent_fee: 600 },
          { id: null, property_type: 'Commercial', view_fee: 150, agent_fee: 800 },
        ]);
        setIsPersisted(false);
      }
    } catch (error) { setMessage({ type: 'error', text: 'Failed to load settings.' }); setSettings([]); }
    setLoading(false);
  };

  const handleFeeChange = (index, field, value) => {
    setSettings(prev => { const u = [...prev]; u[index] = { ...u[index], [field]: parseInt(value) || 0 }; return u; });
  };

  const handleSave = async () => {
    setSaving(true); setMessage(null);
    try {
      if (!isPersisted) {
        const rows = settings.map(({ id, ...rest }) => ({ ...rest, updated_at: new Date().toISOString(), updated_by: user?.id }));
        const { data, error } = await supabase.from('viewing_fees').insert(rows).select();
        if (error) throw error;
        if (data) { setSettings(data); setIsPersisted(true); }
      } else {
        for (const row of settings) {
          const { error } = await supabase.from('viewing_fees').update({ property_type: row.property_type, view_fee: row.view_fee, agent_fee: row.agent_fee, updated_at: new Date().toISOString(), updated_by: user?.id }).eq('id', row.id);
          if (error) throw error;
        }
      }
      setMessage({ type: 'success', text: 'House viewing fees saved successfully!' });
    } catch (error) { setMessage({ type: 'error', text: `Failed to save: ${error.message}` }); }
    setSaving(false);
  };

  const handleAddType = async () => {
    if (!newType.trim()) return;
    setSaving(true); setMessage(null);
    try {
      if (!isPersisted) await handleSave();
      const { data, error } = await supabase.from('viewing_fees').insert({ property_type: newType.trim(), view_fee: newViewFee, agent_fee: newAgentFee, updated_at: new Date().toISOString(), updated_by: user?.id }).select().single();
      if (error) throw error;
      setSettings(prev => [...prev, data]);
      setAddModalOpen(false); setNewType(''); setNewViewFee(100); setNewAgentFee(500);
      setMessage({ type: 'success', text: `"${newType.trim()}" added successfully!` });
    } catch (error) { setMessage({ type: 'error', text: `Failed to add: ${error.message}` }); }
    setSaving(false);
  };

  const handleDelete = async (index) => {
    const item = settings[index];
    if (!confirm(`Delete "${item.property_type}"?`)) return;
    try {
      if (item.id !== null) { const { error } = await supabase.from('viewing_fees').delete().eq('id', item.id); if (error) throw error; }
      setSettings(prev => prev.filter((_, i) => i !== index));
      setMessage({ type: 'success', text: 'Deleted.' });
    } catch (error) { setMessage({ type: 'error', text: `Failed to delete: ${error.message}` }); }
  };

  // ==================== AIRBNB SETTINGS ====================
  const fetchAirbnbSettings = async () => {
    setLoadingAirbnb(true);
    try {
      const { data, error } = await supabase.from('airbnb_platform_settings').select('*').eq('id', 1).single();
      if (error) throw error;
      if (data) setAirbnbSettings(data);
    } catch (error) { setMessage({ type: 'error', text: 'Failed to load Airbnb settings.' }); }
    setLoadingAirbnb(false);
  };

  const handleSaveAirbnbSettings = async () => {
    setSaving(true); setMessage(null);
    try {
      const { error } = await supabase.from('airbnb_platform_settings').update({
        commission_percentage: airbnbSettings.commission_percentage,
        default_min_nights: airbnbSettings.default_min_nights,
        updated_at: new Date().toISOString(),
        updated_by: user?.id
      }).eq('id', 1);
      if (error) throw error;
      setMessage({ type: 'success', text: 'Airbnb platform settings saved successfully!' });
    } catch (error) { setMessage({ type: 'error', text: `Failed to save: ${error.message}` }); }
    setSaving(false);
  };

  // ==================== BOOKING FEE SETTINGS ====================
  const fetchBookingFee = async () => {
    setLoadingBookingFee(true);
    try {
      // Just READ — don't auto-create the row
      // The save function uses upsert which will create it if needed
      const { data, error } = await supabase
        .from('short_stay_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Row exists — use the actual DB values
        setBookingFee({
          fee_type: data.fee_type || 'fixed',
          fee_value: Number(data.fee_value) || 0
        });
      } else {
        // Row doesn't exist yet — show 0, save will create it
        setBookingFee({ fee_type: 'fixed', fee_value: 0 });
      }
    } catch (error) {
      console.error('Error fetching booking fee:', error);
      setMessage({ type: 'error', text: 'Failed to load booking fee settings.' });
    }
    setLoadingBookingFee(false);
  };

  const handleSaveBookingFee = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // Use UPSERT — works whether the row exists or not
      // onConflict: 'id' means: if id=1 already exists, UPDATE it; otherwise INSERT
      const { data, error } = await supabase
        .from('short_stay_settings')
        .upsert({
          id: 1,
          fee_type: bookingFee.fee_type,
          fee_value: parseFloat(bookingFee.fee_value) || 0,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.error('Upsert error:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Save returned no data. Check RLS policies on short_stay_settings table.');
      }

      // Update local state with the CONFIRMED value from the database
      setBookingFee({
        fee_type: data.fee_type,
        fee_value: Number(data.fee_value)
      });

      setMessage({
        type: 'success',
        text: `Booking fee saved: ${data.fee_type === 'percentage' ? data.fee_value + '%' : 'KES ' + Number(data.fee_value).toLocaleString()}`
      });
    } catch (error) {
      console.error('Save booking fee error:', error);
      setMessage({ type: 'error', text: `Failed to save: ${error.message}` });
    }
    setSaving(false);
  };

  if (loading && activeTab === 'houses') {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Platform Settings</h1>
        <p className="text-gray-500 mt-1">Configure fees and commissions for Rheaspark</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button onClick={() => { setActiveTab('houses'); setMessage(null); }} className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'houses' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}>
          🏠 House Viewing Fees
        </button>
        <button onClick={() => { setActiveTab('airbnb'); setMessage(null); }} className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'airbnb' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}>
          🏨 Airbnb Commissions
        </button>
        <button onClick={() => { setActiveTab('booking'); setMessage(null); }} className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'booking' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}>
          💳 Booking Fees
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
          <button onClick={() => setMessage(null)} className="ml-auto"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
      )}

      {/* ==================== HOUSE TAB ==================== */}
      {activeTab === 'houses' && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4 mb-6">
            <div className="flex items-center gap-3">
              {!isPersisted && (<span className="text-xs font-semibold px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full animate-pulse">Not yet saved</span>)}
              <button onClick={() => setAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> Add Type
              </button>
            </div>
          </div>

          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 font-semibold text-sm text-gray-600">
              <div className="col-span-4">Property Type</div><div className="col-span-3">View Fee</div><div className="col-span-3">Agent Fee</div><div className="col-span-1 text-center">Total</div><div className="col-span-1 text-center">Actions</div>
            </div>
            {settings.map((setting, index) => (
              <div key={index} className={`grid grid-cols-12 gap-4 p-4 border-b border-gray-100 items-center hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                <div className="col-span-4 font-medium text-gray-800 flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg></div>
                  {setting.property_type}
                </div>
                <div className="col-span-3"><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">KES</span><input type="number" value={setting.view_fee} onChange={(e) => handleFeeChange(index, 'view_fee', e.target.value)} className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" min="0" /></div></div>
                <div className="col-span-3"><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">KES</span><input type="number" value={setting.agent_fee} onChange={(e) => handleFeeChange(index, 'agent_fee', e.target.value)} className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" min="0" /></div></div>
                <div className="col-span-1 text-center"><span className="text-sm font-semibold text-gray-700">KES {(setting.view_fee + setting.agent_fee).toLocaleString()}</span></div>
                <div className="col-span-1 text-center"><button onClick={() => handleDelete(index)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button></div>
              </div>
            ))}
            {settings.length === 0 && <div className="p-8 text-center text-gray-400">No fee configurations yet.</div>}
          </div>

          <div className="md:hidden space-y-3">
            {settings.map((setting, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-semibold text-gray-800">{setting.property_type}</span>
                  <button onClick={() => handleDelete(index)} className="p-2 text-gray-400 hover:text-red-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs text-gray-500 mb-1">View Fee</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">KES</span><input type="number" value={setting.view_fee} onChange={(e) => handleFeeChange(index, 'view_fee', e.target.value)} className="w-full pl-11 pr-2 py-2 border border-gray-300 rounded-lg text-sm" min="0" /></div></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Agent Fee</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">KES</span><input type="number" value={setting.agent_fee} onChange={(e) => handleFeeChange(index, 'agent_fee', e.target.value)} className="w-full pl-11 pr-2 py-2 border border-gray-300 rounded-lg text-sm" min="0" /></div></div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 text-center"><span className="text-sm text-gray-500">Combined: </span><span className="text-sm font-bold text-gray-800">KES {(setting.view_fee + setting.agent_fee).toLocaleString()}</span></div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row sm:justify-end sm:items-center gap-3">
            <button onClick={handleSave} disabled={saving || settings.length === 0} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm">
              {saving && <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>}
              Save All Changes
            </button>
          </div>
        </>
      )}

      {/* ==================== AIRBNB TAB ==================== */}
      {activeTab === 'airbnb' && (
        <>
          {loadingAirbnb ? (
            <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h3 className="text-lg font-bold text-gray-800">Booking Commission</h3>
                <p className="text-sm text-gray-500 mt-1">This is the percentage Rheaspark takes from every completed Airbnb booking before paying out the host.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Platform Commission (%)</label>
                  <div className="relative">
                    <input type="number" step="0.1" value={airbnbSettings.commission_percentage} onChange={(e) => setAirbnbSettings(prev => ({ ...prev, commission_percentage: parseFloat(e.target.value) || 0 }))} className="w-full pl-4 pr-8 py-3 border-2 border-gray-200 rounded-xl text-gray-800 focus:border-blue-500 outline-none transition-colors text-lg font-semibold" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Example: 15% means Rheaspark keeps KES 1,500 on a KES 10,000 booking.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Default Minimum Nights</label>
                  <input type="number" value={airbnbSettings.default_min_nights} onChange={(e) => setAirbnbSettings(prev => ({ ...prev, default_min_nights: parseInt(e.target.value) || 1 }))} className="w-full pl-4 pr-4 py-3 border-2 border-gray-200 rounded-xl text-gray-800 focus:border-blue-500 outline-none transition-colors text-lg font-semibold" min="1" />
                  <p className="text-xs text-gray-400 mt-2">The default minimum stay required for new Airbnb listings.</p>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700 flex items-start gap-3">
                <svg className="w-5 h-5 flex-shrink-0 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>Availability requests from tenants will come to Rheaspark first. Upon confirmation, this commission is calculated and held by the platform before host payout.</span>
              </div>
              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button onClick={handleSaveAirbnbSettings} disabled={saving} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm">
                  {saving && <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>}
                  Save Airbnb Settings
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ==================== BOOKING FEE TAB ==================== */}
      {activeTab === 'booking' && (
        <>
          {loadingBookingFee ? (
            <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h3 className="text-lg font-bold text-gray-800">Airbnb Booking Fee</h3>
                <p className="text-sm text-gray-500 mt-1">Guests pay this small fee via M-Pesa before they can contact the host on WhatsApp. This is paid to Rheaspark, not the host.</p>
              </div>

              {/* Current value indicator */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
                <span className="text-sm text-blue-700 font-medium">Current saved value in database:</span>
                <span className="text-lg font-bold text-blue-700">
                  {bookingFee.fee_type === 'percentage'
                    ? `${bookingFee.fee_value}%`
                    : `KES ${Number(bookingFee.fee_value).toLocaleString()}`}
                </span>
              </div>

              {/* Fee Type Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Fee Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setBookingFee(prev => ({ ...prev, fee_type: 'fixed' }))}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${bookingFee.fee_type === 'fixed' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${bookingFee.fee_type === 'fixed' ? 'border-blue-500' : 'border-gray-300'}`}>
                        {bookingFee.fee_type === 'fixed' && <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>}
                      </div>
                      <span className="font-semibold text-gray-800">Fixed Amount</span>
                    </div>
                    <p className="text-xs text-gray-500 ml-7">Same fee for every listing regardless of price</p>
                  </button>

                  <button
                    onClick={() => setBookingFee(prev => ({ ...prev, fee_type: 'percentage' }))}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${bookingFee.fee_type === 'percentage' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${bookingFee.fee_type === 'percentage' ? 'border-blue-500' : 'border-gray-300'}`}>
                        {bookingFee.fee_type === 'percentage' && <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>}
                      </div>
                      <span className="font-semibold text-gray-800">Percentage</span>
                    </div>
                    <p className="text-xs text-gray-500 ml-7">Fee scales with the listing's nightly price</p>
                  </button>
                </div>
              </div>

              {/* Fee Value Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {bookingFee.fee_type === 'fixed' ? 'Fee Amount (KES)' : 'Fee Percentage (%)'}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                    {bookingFee.fee_type === 'fixed' ? 'KES' : '%'}
                  </span>
                  <input
                    type="number"
                    step={bookingFee.fee_type === 'percentage' ? '0.5' : '1'}
                    value={bookingFee.fee_value}
                    onChange={(e) => setBookingFee(prev => ({ ...prev, fee_value: parseFloat(e.target.value) || 0 }))}
                    className="w-full pl-20 pr-4 py-3 border-2 border-gray-200 rounded-xl text-gray-800 focus:border-blue-500 outline-none transition-colors text-lg font-semibold"
                    min="0"
                  />
                </div>
                {bookingFee.fee_value === 0 && (
                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    Fee is currently set to 0 — guests won't be charged to book. Set a value above 0 to enable the booking fee.
                  </p>
                )}
              </div>

              {/* Live Preview */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-blue-700 mb-3">Preview — what guests will pay</p>
                <div className="space-y-2">
                  {[
                    { label: 'Budget listing (KES 1,500/night)', price: 1500 },
                    { label: 'Mid-range listing (KES 3,500/night)', price: 3500 },
                    { label: 'Luxury listing (KES 10,000/night)', price: 10000 },
                  ].map((example) => {
                    const fee = bookingFee.fee_type === 'percentage'
                      ? Math.round((bookingFee.fee_value / 100) * example.price)
                      : Math.round(bookingFee.fee_value);
                    return (
                      <div key={example.price} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{example.label}</span>
                        <span className="font-bold text-blue-700">KES {fee.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700 flex items-start gap-3">
                <svg className="w-5 h-5 flex-shrink-0 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div>
                  <p className="font-semibold">How it works</p>
                  <p className="mt-1 text-green-600">When a guest clicks "Book Now" on an Airbnb, they pay this fee via M-Pesa STK push. Once payment is confirmed, the WhatsApp chat link with the host is unlocked. The fee goes to Rheaspark's account.</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  onClick={handleSaveBookingFee}
                  disabled={saving}
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                >
                  {saving && <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>}
                  Save Booking Fee
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ==================== ADD HOUSE TYPE MODAL ==================== */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setAddModalOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Add Property Type</h3>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Property Type Name</label><input type="text" value={newType} onChange={(e) => setNewType(e.target.value)} placeholder="e.g., 4 Bedroom, Duplex" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">View Fee (KES)</label><input type="number" value={newViewFee} onChange={(e) => setNewViewFee(parseInt(e.target.value) || 0)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" min="0" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Agent Fee (KES)</label><input type="number" value={newAgentFee} onChange={(e) => setNewAgentFee(parseInt(e.target.value) || 0)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" min="0" /></div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setAddModalOpen(false)} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleAddType} disabled={saving || !newType.trim()} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />} Add Type
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;