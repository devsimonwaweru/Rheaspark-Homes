/* eslint-disable no-unused-vars */
// src/pages/LandlordHome.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useOutletContext, Link } from 'react-router-dom';
import EditPropertyModal from '../components/EditPropertyModal';

export default function LandlordHome() {
  const { openAddPropertyModal } = useOutletContext();

  const [properties, setProperties] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);

  useEffect(() => {
    loadData();
    const channel = supabase.channel('realtime-landlord-properties')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'properties' }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Fetch Profile
    const { data: landlordProfile } = await supabase
      .from('landlords')
      .select('*')
      .eq('id', user.id)
      .single();
    
    setProfile(landlordProfile);

    // 2. Fetch Properties with Units
    const { data: propsData } = await supabase
      .from('properties')
      .select(`*, units ( id, unit_name, status, monthly_rent )`)
      .eq('landlord_id', user.id)
      .order('created_at', { ascending: false });

    if (propsData) setProperties(propsData);
    setLoading(false);
  };

  const handleDelete = async (property) => {
    const confirmProp = window.confirm(`Delete "${property.title}"?`);
    if (!confirmProp) return;
    try {
      const { error } = await supabase.from('properties').delete().eq('id', property.id);
      if (error) throw error;
      setProperties(properties.filter(p => p.id !== property.id));
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const openEdit = (property) => {
    setSelectedProperty(property);
    setIsEditModalOpen(true);
  };

  const handleSave = (updatedData) => {
    setProperties(properties.map(p => p.id === selectedProperty.id ? { ...p, ...updatedData } : p));
  };

  const toggleStatus = async (property) => {
    const newStatus = property.status === 'active' ? 'inactive' : 'active';
    setProperties(properties.map(p => p.id === property.id ? { ...p, status: newStatus } : p));
    await supabase.from('properties').update({ status: newStatus }).eq('id', property.id);
  };

  const getStats = () => {
    let totalUnits = 0, occupiedUnits = 0, monthlyRentTarget = 0;
    properties.forEach(p => {
      if(p.units) {
        totalUnits += p.units.length;
        p.units.forEach(u => {
          if(u.status === 'occupied') {
            occupiedUnits++;
            monthlyRentTarget += u.monthly_rent || 0;
          }
        });
      }
    });
    return { totalUnits, occupiedUnits, monthlyRentTarget };
  };

  const stats = getStats();
  // Check Pro Status
  const isPro = profile?.subscription_status === 'active';

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 relative bg-gray-50/50 min-h-screen">
      
      {/* Header */}
      <div className="relative overflow-hidden bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100 to-transparent rounded-full -mr-32 -mt-32 opacity-50"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
            {isPro ? 'Dashboard Overview' : `Welcome, ${profile?.full_name?.split(' ')[0] || 'Landlord'}!`}
          </h1>
          <p className="text-gray-500">
            {isPro ? "Here's what's happening with your properties today." : "Manage your listings and unlock powerful automation tools."}
          </p>
        </div>
      </div>

      {/* --- CONDITIONAL SECTIONS --- */}
      
      {!isPro ? (
        /* --- MARKETING JUMBOTRON --- */
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 p-8 md:p-12 shadow-2xl mb-8 border border-indigo-700/50">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full filter blur-3xl opacity-20 -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 rounded-full filter blur-3xl opacity-20 -ml-32 -mb-32"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left max-w-xl">
              <span className="inline-flex items-center bg-white/10 text-purple-200 text-xs font-bold px-3 py-1 rounded-full border border-white/20 mb-4 backdrop-blur-sm">
                <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                1 MONTH FREE TRIAL
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
                Automate Your Rentals.<br />Save Time & Money.
              </h2>
              <p className="text-indigo-100 mb-6 text-sm md:text-base leading-relaxed">
                Join hundreds of landlords using our Pro tools to collect rent automatically, track tenant history, and manage invoices seamlessly.
              </p>
              <Link 
                to="/subscribe"
                className="inline-flex items-center px-8 py-4 bg-white text-indigo-700 font-bold rounded-2xl shadow-lg hover:bg-indigo-50 transition-all duration-300 transform hover:scale-105"
              >
                Start Free Trial
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 gap-4 w-full lg:w-auto">
               <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10 flex items-center space-x-4">
                 <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                   <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                 </div>
                 <div>
                   <h4 className="font-bold text-white text-sm">Auto Rent Collection</h4>
                   <p className="text-xs text-indigo-200">M-Pesa integrated.</p>
                 </div>
               </div>
               <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10 flex items-center space-x-4">
                 <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                   <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                 </div>
                 <div>
                   <h4 className="font-bold text-white text-sm">Financial Reports</h4>
                   <p className="text-xs text-indigo-200">Export in one click.</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      ) : (
        /* --- PRO STATS GRID --- */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <div>
              <h3 className="text-3xl font-extrabold text-gray-900">{properties.length}</h3>
              <p className="text-sm text-gray-400 font-medium">Total Properties</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <div>
              <h3 className="text-3xl font-extrabold text-gray-900">{stats.occupiedUnits}<span className="text-lg text-gray-400 font-normal">/{stats.totalUnits}</span></h3>
              <p className="text-sm text-gray-400 font-medium">Units Occupied</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <h3 className="text-3xl font-extrabold text-gray-900">KES {stats.monthlyRentTarget.toLocaleString()}</h3>
              <p className="text-sm text-gray-400 font-medium">Projected Monthly</p>
            </div>
          </div>
        </div>
      )}

      {/* Properties List */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">My Properties</h2>
        <button onClick={openAddPropertyModal} className="flex items-center space-x-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md hover:bg-blue-700 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          <span>Add New</span>
        </button>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <p className="text-gray-500 font-medium mb-4">No properties listed yet.</p>
          <button onClick={openAddPropertyModal} className="text-blue-600 font-semibold hover:underline">Add your first property →</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((p) => {
            const unitCount = p.units?.length || 0;
            const occupiedCount = p.units?.filter(u => u.status === 'occupied').length || 0;
            const percentage = unitCount > 0 ? (occupiedCount / unitCount) * 100 : 0;
            
            return (
              <div key={p.id} className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                {p.image_url ? (
                  <div className="relative h-44 overflow-hidden">
                    <img src={p.image_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-3 left-3">
                       <h3 className="text-lg font-bold text-white drop-shadow-md">{p.title}</h3>
                       <p className="text-xs text-gray-200">{p.location}</p>
                    </div>
                    <span className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${p.status === 'active' ? 'bg-green-500 text-white' : 'bg-gray-600 text-white'}`}>
                      {p.status}
                    </span>
                  </div>
                ) : (
                  <div className="relative h-44 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center text-gray-400 group-hover:from-gray-50 group-hover:to-white transition-colors">
                     <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                     <span className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${p.status === 'active' ? 'bg-green-500 text-white' : 'bg-gray-600 text-white'}`}>
                       {p.status}
                     </span>
                  </div>
                )}
                
                <div className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                      KES {p.price?.toLocaleString()}
                    </span>
                    {isPro && unitCount > 0 && (
                       <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                         {unitCount} Units
                       </span>
                    )}
                  </div>
                  
                  {isPro && unitCount > 0 && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Occupancy</span>
                        <span className="font-semibold text-emerald-600">{occupiedCount}/{unitCount}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-gradient-to-r from-emerald-400 to-teal-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                     <div className="flex space-x-1">
                       <button onClick={() => openEdit(p)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                       </button>
                       <button onClick={() => handleDelete(p)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                       </button>
                     </div>
                     <button onClick={() => toggleStatus(p)} className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${p.status === 'active' ? 'text-orange-500 bg-orange-50 hover:bg-orange-100' : 'text-green-600 bg-green-50 hover:bg-green-100'}`}>
                       {p.status === 'active' ? 'Deactivate' : 'Activate'}
                     </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <EditPropertyModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        property={selectedProperty}
        onSave={handleSave}
      />
    </div>
  );
}