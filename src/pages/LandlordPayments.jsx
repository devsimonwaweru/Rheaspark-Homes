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
    const { data } = await supabase.from('properties').select('id, title').eq('landlord_id', user.id);
    if (data) setProperties(data);
    setLoading(false);
  };

  // Calculate Balances when property selected
  const handleSelectProperty = async (prop) => {
    setActiveProperty(prop);
    setLoading(true);

    // 1. Get Units with Tenants
    const { data: unitsData } = await supabase
      .from('units')
      .select(`id, unit_name, monthly_rent, tenants ( id, full_name )`)
      .eq('property_id', prop.id);

    // 2. Get ALL Payments for these units
    const unitIds = unitsData?.map(u => u.id);
    const { data: paymentsData } = await supabase
      .from('payments')
      .select('unit_id, amount, type')
      .in('unit_id', unitIds || []);

    // 3. Calculate Balances locally (Front-end calculation for speed)
    const calculatedUnits = unitsData?.map(unit => {
      const unitPayments = paymentsData?.filter(p => p.unit_id === unit.id) || [];
      
      // Logic: Charges are positive (owed), Payments are negative (paid)? 
      // OR Standard: Charges are money owed (+), Payments are money received (-)
      // Let's use: Charge (+10000), Payment (-5000). 
      // Balance = Total Charges - Total Payments.
      
      let balance = 0;
      unitPayments.forEach(p => {
        if (p.type === 'charge') balance += p.amount;
        if (p.type === 'payment') balance -= p.amount;
      });

      // If balance is negative, it means they have overpaid (Credit). 
      // If positive, they owe money (Arrears).
      // For display: Arrears = Balance. Credit = -Balance.
      
      return {
        ...unit,
        tenant: unit.tenants?.[0] || null,
        balance: balance, // Positive = Owes Money
        paid: balance < 0 // If negative balance, they are paid up
      };
    });

    setUnits(calculatedUnits || []);
    setLoading(false);
  };

  const handleChargeRent = async (unit) => {
    const rent = unit.monthly_rent;
    if(!rent) return alert("Set monthly rent for this unit first.");
    if(!confirm(`Charge KES ${rent} rent to ${unit.unit_name}?`)) return;

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

  const totalArrears = units.reduce((sum, u) => sum + (u.balance > 0 ? u.balance : 0), 0);

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Payments & Arrears</h1>
      <p className="text-gray-500 text-sm mb-6">Track rent and balances.</p>

      {/* Property Selection */}
      {!activeProperty ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {properties.map(p => (
            <button 
              key={p.id} 
              onClick={() => handleSelectProperty(p)}
              className="bg-white p-4 rounded-xl border hover:border-blue-500 hover:shadow-md transition-all text-left"
            >
              <h3 className="font-bold text-gray-800">{p.title}</h3>
              <p className="text-xs text-gray-400">Manage</p>
            </button>
          ))}
        </div>
      ) : (
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setActiveProperty(null)} className="text-gray-500 hover:text-gray-800 p-1">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <h2 className="text-xl font-bold">{activeProperty.title}</h2>
            </div>
            
            <div className="bg-red-50 border border-red-200 px-4 py-2 rounded-lg text-right">
              <p className="text-xs text-red-500 font-medium">Total Arrears</p>
              <p className="text-lg font-bold text-red-700">KES {totalArrears.toLocaleString()}</p>
            </div>
          </div>

          {loading ? <p>Loading...</p> : (
            <div className="space-y-3">
              {units.map(unit => (
                <div key={unit.id} className="bg-white p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-12 rounded-full ${unit.balance > 0 ? 'bg-red-400' : 'bg-green-400'}`}></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-800">{unit.unit_name}</h3>
                        {unit.balance > 0 && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold">Arrears</span>}
                        {unit.balance <= 0 && <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded font-bold">Paid</span>}
                      </div>
                      <p className="text-xs text-gray-400">
                        {unit.tenant?.full_name || 'Vacant'} • Rent: KES {unit.monthly_rent?.toLocaleString() || 0}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                     {/* Show Balance Amount */}
                     <div className="text-right mr-4">
                        <p className="text-xs text-gray-400">Balance</p>
                        <p className={`font-bold ${unit.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                           KES {Math.abs(unit.balance).toLocaleString()}
                           {unit.balance > 0 ? ' Owed' : ' Credit'}
                        </p>
                     </div>

                     {/* Actions */}
                     <button 
                       onClick={() => openPayModal(unit)}
                       className="bg-blue-600 text-white text-xs px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
                     >
                       Record Payment
                     </button>
                     <button 
                       onClick={() => handleChargeRent(unit)}
                       className="border border-gray-300 text-gray-600 text-xs px-4 py-2 rounded-lg font-semibold hover:bg-gray-50"
                     >
                       Charge Rent
                     </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Payment Modal */}
      {isPayModalOpen && (
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