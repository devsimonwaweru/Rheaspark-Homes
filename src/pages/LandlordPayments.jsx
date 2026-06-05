// src/pages/LandlordPayments.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import RecordPaymentModal from '../components/RecordPaymentModal';

export default function LandlordPayments() {
  const [properties, setProperties] = useState([]);
  const [activeProperty, setActiveProperty] = useState(null);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('properties')
      .select('id, title, location, price, join_code') 
      .eq('landlord_id', user.id);

    if (!error && data) setProperties(data);
    setLoading(false);
  };

  const handleSelectProperty = async (prop) => {
    setActiveProperty(prop);
    setLoading(true);

    const { data: unitsData } = await supabase
      .from('units')
      .select(`id, unit_name, status, tenants ( id, full_name )`)
      .eq('property_id', prop.id);

    const unitIds = unitsData?.map(u => u.id);
    
    const { data: paymentsData } = await supabase
      .from('payments')
      .select('unit_id, amount, type')
      .in('unit_id', unitIds || []);

    // eslint-disable-next-line no-unused-vars
    const rentAmount = parseFloat(prop.price) || 0;

    const calculatedUnits = unitsData?.map(unit => {
      const unitPayments = paymentsData?.filter(p => p.unit_id === unit.id) || [];
      
      let totalCharged = 0;
      let totalPaid = 0;

      unitPayments.forEach(p => {
        if (p.type === 'charge') totalCharged += p.amount;
        if (p.type === 'payment') totalPaid += p.amount;
      });

      const balance = totalCharged - totalPaid;
      
      return {
        ...unit,
        tenant: unit.tenants?.[0] || null,
        balance: balance,
        isPaid: balance <= 0
      };
    });

    setUnits(calculatedUnits || []);
    setLoading(false);
  };

  const handleChargeRent = async (unit) => {
    const rent = parseFloat(activeProperty.price); 
    
    if(!rent || rent <= 0) return alert("Please set a valid Price in Property settings.");
    if(!confirm(`Charge KES ${rent.toLocaleString()} rent to ${unit.unit_name}?`)) return;

    try {
      await supabase.from('payments').insert({
        unit_id: unit.id,
        tenant_id: unit.tenant?.id,
        amount: rent,
        type: 'charge',
        method: 'System',
        notes: 'Monthly Rent'
      });
      handleSelectProperty(activeProperty); // Refresh
    } catch (e) { alert(e.message); }
  };

  const openPayModal = (unit) => {
    setSelectedUnit(unit);
    setIsPayModalOpen(true);
  };

  // --- CALCULATIONS FOR SUMMARY ---
  const totalArrears = units.reduce((sum, u) => sum + (u.balance > 0 ? u.balance : 0), 0);
  const totalExpectedRent = (parseFloat(activeProperty?.price) || 0) * units.length;
  const totalCollected = totalExpectedRent - totalArrears;

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Payments & Arrears</h1>
      <p className="text-gray-500 text-sm mb-6">Track rent and balances automatically.</p>

      {/* Property Selection */}
      {!activeProperty ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {properties.map(p => (
            <button 
              key={p.id} 
              onClick={() => handleSelectProperty(p)}
              className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer text-left group"
            >
              <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{p.title}</h3>
              <p className="text-xs text-gray-400 mt-1">{p.location}</p>
              <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between items-center">
                <span className="text-xs text-gray-500">Rent Set:</span>
                <span className="text-sm font-bold text-green-600">KES {p.price?.toLocaleString()}</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div>
          {/* Header Bar */}
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setActiveProperty(null)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{activeProperty.title}</h2>
              <p className="text-xs text-gray-400">Rent: KES {activeProperty.price?.toLocaleString()} / unit</p>
            </div>
          </div>

          {/* --- SUMMARY CARDS (Top Row) --- */}
          <div className="grid grid-cols-3 gap-2 md:gap-4 mb-8">
            
            {/* Total Expected */}
            <div className="bg-white p-3 md:p-5 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-1 md:mb-2">
                <p className="text-[10px] md:text-sm text-gray-500 font-medium truncate">Expected</p>
                <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 ml-1">
                  <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                </div>
              </div>
              <p className="text-base md:text-2xl font-extrabold text-gray-800 truncate">KES {totalExpectedRent.toLocaleString()}</p>
              <p className="hidden md:block text-xs text-gray-400 mt-1">{units.length} Units</p>
            </div>

            {/* Total Arrears */}
            <div className={`p-3 md:p-5 rounded-xl border shadow-sm ${totalArrears > 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
              <div className="flex items-center justify-between mb-1 md:mb-2">
                <p className={`text-[10px] md:text-sm font-medium truncate ${totalArrears > 0 ? 'text-red-600' : 'text-green-600'}`}>Arrears</p>
                <div className={`w-6 h-6 md:w-8 md:h-8 rounded-lg flex items-center justify-center flex-shrink-0 ml-1 ${totalArrears > 0 ? 'bg-red-100 text-red-500' : 'bg-green-100 text-green-500'}`}>
                   <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
              </div>
              <p className={`text-base md:text-2xl font-extrabold truncate ${totalArrears > 0 ? 'text-red-700' : 'text-green-700'}`}>KES {totalArrears.toLocaleString()}</p>
              <p className="hidden md:block text-xs text-gray-400 mt-1">{units.filter(u => u.balance > 0).length} Units Owing</p>
            </div>

            {/* Collected */}
            <div className="bg-white p-3 md:p-5 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-1 md:mb-2">
                <p className="text-[10px] md:text-sm text-gray-500 font-medium truncate">Collected</p>
                <div className="w-6 h-6 md:w-8 md:h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0 ml-1">
                   <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
              </div>
              <p className="text-base md:text-2xl font-extrabold text-gray-800 truncate">KES {totalCollected.toLocaleString()}</p>
              <p className="hidden md:block text-xs text-gray-400 mt-1">Based on charges</p>
            </div>
          </div>

          {/* --- UNITS LIST --- */}
          {loading ? <p className="text-center py-8 text-gray-400">Calculating balances...</p> : (
            <div className="space-y-3">
              {units.length === 0 && <p className="text-center text-gray-400 py-8">No units found.</p>}
              
              {units.map(unit => (
                <div key={unit.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  
                  {/* Top Row: Info & Balance */}
                  <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                       {/* Status Dot */}
                       <div className={`w-2.5 h-10 rounded-full ${unit.balance > 0 ? 'bg-red-400' : 'bg-green-400'}`}></div>
                       <div>
                          <h3 className="font-bold text-gray-800 text-sm md:text-base">{unit.unit_name}</h3>
                          {unit.tenant ? (
                             <span className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{unit.tenant.full_name}</span>
                          ) : (
                             <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Vacant</span>
                          )}
                       </div>
                    </div>

                    {/* BALANCE PER UNIT (Prominent) */}
                    <div className="text-right">
                       <p className="text-[10px] text-gray-400 uppercase tracking-wider">Balance</p>
                       <p className={`text-lg md:text-xl font-extrabold ${unit.balance > 0 ? 'text-red-600' : unit.balance < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                          KES {Math.abs(unit.balance).toLocaleString()}
                       </p>
                       <p className={`text-[10px] font-medium ${unit.balance > 0 ? 'text-red-400' : unit.balance < 0 ? 'text-green-400' : 'text-gray-400'}`}>
                          {unit.balance > 0 ? 'OWED' : unit.balance < 0 ? 'CREDIT' : 'SETTLED'}
                       </p>
                    </div>
                  </div>

                  {/* Bottom Row: Rent Info & Actions */}
                  <div className="flex justify-between items-center">
                     <p className="text-xs text-gray-400">
                        Rent: <span className="font-semibold text-gray-600">KES {activeProperty.price?.toLocaleString()}</span>
                     </p>

                     <div className="flex gap-2">
                       <button 
                         onClick={() => handleChargeRent(unit)}
                         className="border border-blue-200 text-blue-600 text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center gap-1"
                       >
                         <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                         Charge
                       </button>
                       <button 
                         onClick={() => openPayModal(unit)}
                         className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                       >
                         Record Payment
                       </button>
                     </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Payment Modal */}
      {isPayModalOpen && selectedUnit && (
        <RecordPaymentModal 
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          unit={selectedUnit}
          tenant={selectedUnit?.tenant}
          onSave={() => handleSelectProperty(activeProperty)}
        />
      )}
    </div>
  );
}