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
  const [expandedUnit, setExpandedUnit] = useState(null); // ID of expanded unit
  const [copied, setCopied] = useState(false);

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
      .select('id, title, location, join_code')
      .eq('landlord_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) setProperties(data);
    setLoading(false);
  };

  const handleSelectProperty = async (prop) => {
    setActiveProperty(prop);
    setLoadingUnits(true);
    setExpandedUnit(null);
    
    const { data: unitsData, error } = await supabase
      .from('units')
      .select(`
        id, 
        unit_name, 
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
  };

  // --- Actions ---

  const copyLink = (code) => {
    const link = `${window.location.origin}/#/join/${code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVacate = async (unit) => {
    const confirm = window.confirm(`Mark Unit ${unit.unit_name} as vacated? This will permanently delete tenant data.`);
    if (!confirm) return;

    try {
      // A. Delete Tenants
      const { error: deleteError } = await supabase
        .from('tenants')
        .delete()
        .eq('unit_id', unit.id);

      if (deleteError) throw deleteError;

      // B. Update Unit Status
      const { error: updateError } = await supabase
        .from('units')
        .update({ status: 'vacant' })
        .eq('id', unit.id);

      if (updateError) throw updateError;

      // C. Update UI
      setUnits(prev => 
        prev.map(u => u.id === unit.id ? { ...u, status: 'vacant', tenants: [] } : u)
      );
      
      alert("Unit marked as vacant.");
      setExpandedUnit(null); // Collapse after action

    } catch (err) {
      console.error(err);
      alert("Failed to update: " + err.message);
    }
  };

  // --- Render ---

  if (loading) return <div className="p-8 text-center text-gray-400">Loading...</div>;

  // VIEW 1: Property List
  if (!activeProperty) {
    return (
      <div className="p-4 md:p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Properties</h1>
        <p className="text-gray-500 text-sm mb-6">Select a property to manage units.</p>

        {properties.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border text-gray-400">
              No properties found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map(prop => (
              <div 
                key={prop.id} 
                onClick={() => handleSelectProperty(prop)}
                className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{prop.title}</h3>
                    <p className="text-xs text-gray-400 mt-1">{prop.location}</p>
                  </div>
                  <div className="bg-gray-100 text-gray-500 p-2 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // VIEW 2: Unit Management (Inside Property)
  return (
    <div className="p-4 md:p-8">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-6">
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
          onClick={() => copyLink(activeProperty.join_code)} 
          className="flex items-center gap-2 text-xs bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
          {copied ? 'Copied!' : 'Invite Link'}
        </button>
      </div>

      {/* Units Grid (Mobile: 2 cols, Desktop: 3 cols) */}
      {loadingUnits ? (
        <div className="text-center py-12 text-gray-400">Loading units...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {units.map(unit => (
            <div key={unit.id} className={`
              ${expandedUnit === unit.id ? 'col-span-2 md:col-span-3 lg:col-span-4' : ''}
              bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300
            `}>
              
              {/* Unit Header / Card */}
              <div 
                onClick={() => setExpandedUnit(expandedUnit === unit.id ? null : unit.id)}
                className={`p-4 flex justify-between items-center cursor-pointer ${expandedUnit === unit.id ? 'bg-gray-50 border-b' : 'hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-3">
                  {/* Status Dot */}
                  <div className={`w-2 h-8 rounded-full ${unit.status === 'vacant' ? 'bg-green-400' : 'bg-blue-500'}`}></div>
                  <div>
                    <h3 className="font-bold text-gray-800">{unit.unit_name}</h3>
                    <span className={`text-[10px] font-semibold uppercase ${unit.status === 'vacant' ? 'text-green-600' : 'text-blue-600'}`}>
                      {unit.status}
                    </span>
                  </div>
                </div>
                
                {/* Expand Icon */}
                <svg 
                  className={`w-5 h-5 text-gray-400 transform transition-transform duration-300 ${expandedUnit === unit.id ? 'rotate-180' : ''}`} 
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Expanded Details (Tenant List) */}
              {expandedUnit === unit.id && (
                <div className="p-4 bg-gray-50 animate-fade-in">
                  {unit.tenants && unit.tenants.length > 0 ? (
                    <div className="space-y-3">
                      {unit.tenants.map(tenant => (
                        <div key={tenant.id} className="bg-white p-3 rounded-lg border border-gray-100 shadow-xs flex justify-between items-center">
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
                            <p className="text-[10px] text-gray-400 uppercase">Entry Date</p>
                            <p className="text-xs font-bold text-gray-600">{new Date(tenant.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}

                      {/* Vacate Button */}
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleVacate(unit); }}
                        className="w-full mt-2 text-center text-red-500 text-xs font-bold py-2 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Mark as Vacated
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-400 text-sm mb-2">No tenants yet.</p>
                      <p className="text-xs text-gray-300">Share the invite link.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <style>{`
        @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
}