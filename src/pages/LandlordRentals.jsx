import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function LandlordRentals() {
  // --- State ---
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Active Management State
  const [activeProperty, setActiveProperty] = useState(null);
  const [units, setUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  
  // UI State
  const [expandedUnit, setExpandedUnit] = useState(null);
  
  // Add Unit State
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitRent, setNewUnitRent] = useState('');
  const [addingUnit, setAddingUnit] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  // --- Data Fetching ---

  const fetchProperties = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('properties')
      .select('id, title, location, join_code, total_units, available_units')
      .eq('landlord_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) setProperties(data);
    setLoading(false);
  };

  const handleSelectProperty = async (prop) => {
    setActiveProperty(prop);
    setLoadingUnits(true);
    setExpandedUnit(null);
    setShowAddUnit(false);
    
    const { data: unitsData, error } = await supabase
      .from('units')
      .select(`
        id, 
        unit_name, 
        monthly_rent,
        status, 
        created_at,
        tenants ( id, full_name, phone, is_primary, created_at )
      `)
      .eq('property_id', prop.id)
      .order('unit_name', { ascending: true });

    if (!error && unitsData) setUnits(unitsData);
    else console.error("Error fetching units:", error);
    
    setLoadingUnits(false);
  };

  const handleBack = () => {
    setActiveProperty(null);
    setUnits([]);
    setExpandedUnit(null);
    setShowAddUnit(false);
  };

  // --- Actions ---

  const shareOnWhatsApp = (code, title) => {
    const link = `${window.location.origin}/#/join/${code}`;
    const message = `Hello! Welcome to ${title}. \n\nPlease use this secure link to complete your tenant onboarding and select your unit: ${link}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleAddUnit = async () => {
    if (!newUnitName.trim()) {
      alert("Please enter a unit name (e.g., Unit 1A)");
      return;
    }

    setAddingUnit(true);
    const { data, error } = await supabase
      .from('units')
      .insert([{
        property_id: activeProperty.id,
        unit_name: newUnitName.trim(),
        monthly_rent: parseInt(newUnitRent) || 0,
        status: 'vacant'
      }])
      .select();

    if (!error && data) {
      setUnits(prev => [...prev, data[0]].sort((a, b) => a.unit_name.localeCompare(b.unit_name)));
      setNewUnitName('');
      setNewUnitRent('');
      setShowAddUnit(false);
      fetchProperties(); 
    } else {
      alert("Failed to add unit: " + error.message);
    }
    setAddingUnit(false);
  };

  const handleVacate = async (unit) => {
    const confirm = window.confirm(`Mark ${unit.unit_name} as vacated? This will permanently remove the tenant data for this unit.`);
    if (!confirm) return;

    try {
      const { error: deleteError } = await supabase
        .from('tenants')
        .delete()
        .eq('unit_id', unit.id);

      if (deleteError) throw deleteError;

      const { error: updateError } = await supabase
        .from('units')
        .update({ status: 'vacant', tenant_id: null })
        .eq('id', unit.id);

      if (updateError) throw updateError;

      setUnits(prev => 
        prev.map(u => u.id === unit.id ? { ...u, status: 'vacant', tenants: [] } : u)
      );
      
      setExpandedUnit(null);
      fetchProperties(); 

    } catch (err) {
      console.error(err);
      alert("Failed to update: " + err.message);
    }
  };

  // --- Render ---

  if (loading) return <div className="p-8 text-center text-gray-400 animate-pulse">Loading properties...</div>;

  // VIEW 1: Property List
  if (!activeProperty) {
    return (
      <div className="p-4 md:p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Rental Management</h1>
        <p className="text-gray-500 text-sm mb-6">Select a property to manage units, onboard tenants, and share invite links.</p>

        {properties.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400">
              <p className="text-5xl mb-4">🏢</p>
              <p className="text-lg font-medium text-gray-500">No properties found.</p>
              <p className="text-sm">Add a property from the sidebar to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map(prop => (
              <div 
                key={prop.id} 
                onClick={() => handleSelectProperty(prop)}
                className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{prop.title}</h3>
                    <p className="text-xs text-gray-400 mt-1 truncate max-w-[200px]">{prop.location}</p>
                  </div>
                  <div className="bg-gray-100 text-gray-500 p-2 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-gray-50 flex items-center gap-3">
                  <div className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-lg font-extrabold text-gray-700">{prop.total_units || 0}</p>
                    <p className="text-[10px] text-gray-400 font-medium uppercase">Units</p>
                  </div>
                  <div className="flex-1 bg-emerald-50 rounded-lg p-2 text-center">
                    <p className="text-lg font-extrabold text-emerald-600">{prop.available_units || 0}</p>
                    <p className="text-[10px] text-emerald-500 font-medium uppercase">Vacant</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // VIEW 2: Unit Management 
  // FIX: Pulling stats directly from the activeProperty (properties table) instead of the units array
  const stats = {
    total: activeProperty.total_units || 0,
    vacant: activeProperty.available_units || 0,
    occupied: (activeProperty.total_units || 0) - (activeProperty.available_units || 0)
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{activeProperty.title}</h1>
            <p className="text-xs text-gray-400">{activeProperty.location}</p>
          </div>
        </div>

        <button 
          onClick={() => shareOnWhatsApp(activeProperty.join_code, activeProperty.title)} 
          className="flex items-center justify-center gap-2 text-sm bg-green-500 text-white px-5 py-2.5 rounded-xl hover:bg-green-600 transition-colors shadow-sm shadow-green-500/30 font-semibold"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Share Invite Link
        </button>
      </div>

      {/* Stats Bar - Now uses properties table data */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-3 rounded-xl text-center">
          <p className="text-2xl font-extrabold text-blue-700">{stats.total}</p>
          <p className="text-xs text-blue-500 font-medium">Total Units</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-xl text-center border border-gray-100">
          <p className="text-2xl font-extrabold text-gray-700">{stats.occupied}</p>
          <p className="text-xs text-gray-500 font-medium">Occupied</p>
        </div>
        <div className="bg-emerald-50 p-3 rounded-xl text-center">
          <p className="text-2xl font-extrabold text-emerald-600">{stats.vacant}</p>
          <p className="text-xs text-emerald-500 font-medium">Vacant / Ready</p>
        </div>
      </div>

      {loadingUnits ? (
        <div className="text-center py-12 text-gray-400">Loading units...</div>
      ) : (
        <>
          {/* Add Unit Button / Form */}
          <div className="mb-6">
            {!showAddUnit ? (
              <button 
                onClick={() => setShowAddUnit(true)}
                className="w-full py-3 border-2 border-dashed border-gray-200 text-gray-500 rounded-xl hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2 text-sm font-semibold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Create Physical Unit Profile
              </button>
            ) : (
              <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm space-y-3">
                <h4 className="font-bold text-gray-700 text-sm">Add a New Unit</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input 
                    type="text" 
                    placeholder="Unit Name (e.g. House 1A)" 
                    value={newUnitName}
                    onChange={(e) => setNewUnitName(e.target.value)}
                    className="col-span-2 border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <input 
                    type="number" 
                    placeholder="Monthly Rent (KES)" 
                    value={newUnitRent}
                    onChange={(e) => setNewUnitRent(e.target.value)}
                    className="border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowAddUnit(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">Cancel</button>
                  <button onClick={handleAddUnit} disabled={addingUnit} className="bg-blue-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-semibold">
                    {addingUnit ? 'Saving...' : 'Save Unit'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Units Grid */}
          {units.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border text-gray-400">
              <p className="text-4xl mb-3">📦</p>
              <p className="font-medium text-gray-500">No physical unit profiles created yet.</p>
              <p className="text-xs mt-1 max-w-md mx-auto">
                You have configured <span className="font-bold text-gray-600">{stats.total} units</span> on your listing above, 
                but tenants need individual profiles to select when they click your invite link. Create them below.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {units.map(unit => (
                <div key={unit.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                  
                  {/* Unit Header */}
                  <div 
                    onClick={() => setExpandedUnit(expandedUnit === unit.id ? null : unit.id)}
                    className={`p-4 flex justify-between items-center cursor-pointer ${expandedUnit === unit.id ? 'bg-gray-50 border-b border-gray-100' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${unit.status === 'vacant' ? 'bg-emerald-400' : 'bg-blue-500'}`}></div>
                      <div>
                        <h3 className="font-bold text-gray-800">{unit.unit_name}</h3>
                        <span className={`text-[10px] font-bold uppercase ${unit.status === 'vacant' ? 'text-emerald-600' : 'text-blue-600'}`}>
                          {unit.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {unit.monthly_rent > 0 && (
                        <p className="text-xs font-extrabold text-gray-700">KES {unit.monthly_rent.toLocaleString()}</p>
                      )}
                      <svg 
                        className={`w-4 h-4 text-gray-400 transform transition-transform duration-300 ${expandedUnit === unit.id ? 'rotate-180' : ''}`} 
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded Details (Tenant List) */}
                  {expandedUnit === unit.id && (
                    <div className="p-4 bg-gray-50 animate-fade-in">
                      {unit.tenants && unit.tenants.length > 0 ? (
                        <div className="space-y-3">
                          {unit.tenants.map(tenant => (
                            <div key={tenant.id} className="bg-white p-3 rounded-lg border border-gray-100 shadow-xs">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                                    {tenant.full_name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-800 text-sm">
                                      {tenant.full_name}
                                      {tenant.is_primary && <span className="ml-2 text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-bold">PRIMARY</span>}
                                    </p>
                                    <p className="text-xs text-gray-400">{tenant.phone}</p>
                                  </div>
                                </div>
                                
                                <div className="text-right">
                                  <p className="text-[10px] text-gray-400 uppercase">Moved In</p>
                                  <p className="text-xs font-bold text-gray-600">{new Date(tenant.created_at).toLocaleDateString()}</p>
                                </div>
                              </div>
                            </div>
                          ))}

                          <button 
                            onClick={(e) => { e.stopPropagation(); handleVacate(unit); }}
                            className="w-full mt-2 text-center text-red-500 text-xs font-bold py-2.5 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            Mark Unit as Vacated
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-gray-400 text-sm mb-1">No tenants assigned.</p>
                          <p className="text-xs text-gray-300">Share the WhatsApp invite link to onboard a tenant.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
      
      <style>{`
        @keyframes fade-in { 0% { opacity: 0; transform: translateY(-5px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
}