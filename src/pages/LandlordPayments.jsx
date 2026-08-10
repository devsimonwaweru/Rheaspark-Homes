import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import RecordPaymentModal from '../components/RecordPaymentModal';

export default function LandlordPayments() {
  const [properties, setProperties] = useState([]);
  const [activeProperty, setActiveProperty] = useState(null);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingInvoices, setGeneratingInvoices] = useState(false);

  // Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  // Helper to get current month string (e.g., "October 2023")
  const getCurrentMonthString = () => {
    return new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  };

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
      .select(`id, unit_name, status, tenants ( id, full_name, phone )`)
      .eq('property_id', prop.id);

    const unitIds = unitsData?.map(u => u.id) || [];
    
    const { data: paymentsData } = await supabase
      .from('payments')
      .select('unit_id, amount, type')
      .in('unit_id', unitIds);

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

  // --- NEW: BULK INVOICE GENERATOR ---
  const handleGenerateInvoices = async () => {
    const monthStr = getCurrentMonthString();
    const noteStr = `Rent: ${monthStr}`;
    
    if(!confirm(`Generate KES ${activeProperty.price?.toLocaleString()} rent charges for ALL occupied units for ${monthStr}?`)) return;
    
    setGeneratingInvoices(true);

    try {
      // 1. Find out which units were ALREADY charged this month to prevent duplicates
      const { data: existingCharges } = await supabase
        .from('payments')
        .select('unit_id')
        .eq('property_id', activeProperty.id)
        .eq('type', 'charge')
        .eq('notes', noteStr); // Exact match on our note string

      const chargedUnitIds = new Set(existingCharges?.map(c => c.unit_id) || []);

      // 2. Filter to only occupied units that haven't been charged yet
      const unitsToCharge = units.filter(u => 
        u.status === 'occupied' && !chargedUnitIds.has(u.id)
      );

      if (unitsToCharge.length === 0) {
        alert(`All occupied units have already been invoiced for ${monthStr}.`);
        setGeneratingInvoices(false);
        return;
      }

      // 3. Insert the bulk charges
      const insertData = unitsToCharge.map(u => ({
        unit_id: u.id,
        tenant_id: u.tenant?.id || null,
        property_id: activeProperty.id,
        amount: parseFloat(activeProperty.price),
        type: 'charge',
        method: 'System Invoice',
        notes: noteStr,
        status: 'pending'
      }));

      const { error } = await supabase.from('payments').insert(insertData);
      if (error) throw error;

      alert(`Successfully generated ${unitsToCharge.length} invoices!`);
      handleSelectProperty(activeProperty); // Refresh UI

    } catch (err) {
      alert("Error generating invoices: " + err.message);
    } finally {
      setGeneratingInvoices(false);
    }
  };

  // --- NEW: WHATSAPP REMINDER ---
  const handleSendReminder = (unit) => {
    if(!unit.tenant?.phone) return alert("Tenant has no phone number saved.");
    
    // TODO: Replace '123456' with your actual M-Pesa Paybill or Till Number
    const paybill = "123456"; 
    const monthStr = getCurrentMonthString();
    
    const message = `Hello ${unit.tenant.full_name}, this is a gentle reminder for your rent of KES ${activeProperty.price?.toLocaleString()} for ${unit.unit_name} (${monthStr}).\n\nPlease pay via M-Pesa:\nLipa Na M-Pesa\nPaybill/Till: ${paybill}\nAccount: ${unit.unit_name}\n\nThank you!`;
    
    // Convert 0712345678 to 25412345678
    const phone = unit.tenant.phone.replace(/^0/, '254');
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const openPayModal = (unit) => {
    setSelectedUnit(unit);
    setIsPayModalOpen(true);
  };

  // --- CALCULATIONS ---
  const totalArrears = units.reduce((sum, u) => sum + (u.balance > 0 ? u.balance : 0), 0);
  const totalExpectedRent = (parseFloat(activeProperty?.price) || 0) * units.length;
  const totalCollected = totalExpectedRent - totalArrears;

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Payments & Invoicing</h1>
      <p className="text-gray-500 text-sm mb-6">Generate invoices, track balances, and record M-Pesa payments.</p>

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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setActiveProperty(null)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{activeProperty.title}</h2>
                <p className="text-xs text-gray-400">Rent: KES {activeProperty.price?.toLocaleString()} / unit</p>
              </div>
            </div>

            {/* NEW: Generate Invoices Button */}
            <button 
              onClick={handleGenerateInvoices}
              disabled={generatingInvoices}
              className="flex items-center justify-center gap-2 text-sm bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm font-semibold disabled:opacity-60"
            >
              {generatingInvoices ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Generate {getCurrentMonthString()} Invoices
                </>
              )}
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-2 md:gap-4 mb-8">
            <div className="bg-white p-3 md:p-5 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] md:text-sm text-gray-500 font-medium">Expected</p>
                <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                </div>
              </div>
              <p className="text-base md:text-2xl font-extrabold text-gray-800">KES {totalExpectedRent.toLocaleString()}</p>
            </div>

            <div className={`p-3 md:p-5 rounded-xl border shadow-sm ${totalArrears > 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
              <div className="flex items-center justify-between mb-1">
                <p className={`text-[10px] md:text-sm font-medium ${totalArrears > 0 ? 'text-red-600' : 'text-green-600'}`}>Arrears</p>
                <div className={`w-6 h-6 md:w-8 md:h-8 rounded-lg flex items-center justify-center ${totalArrears > 0 ? 'bg-red-100 text-red-500' : 'bg-green-100 text-green-500'}`}>
                   <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
              </div>
              <p className={`text-base md:text-2xl font-extrabold ${totalArrears > 0 ? 'text-red-700' : 'text-green-700'}`}>KES {totalArrears.toLocaleString()}</p>
            </div>

            <div className="bg-white p-3 md:p-5 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] md:text-sm text-gray-500 font-medium">Collected</p>
                <div className="w-6 h-6 md:w-8 md:h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                   <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
              </div>
              <p className="text-base md:text-2xl font-extrabold text-gray-800">KES {totalCollected.toLocaleString()}</p>
            </div>
          </div>

          {/* Units List */}
          {loading ? <p className="text-center py-8 text-gray-400">Calculating...</p> : (
            <div className="space-y-3">
              {units.length === 0 && <p className="text-center text-gray-400 py-8">No units found.</p>}
              
              {units.map(unit => (
                <div key={unit.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  
                  <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-50">
                    <div className="flex items-center gap-3">
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

                    <div className="text-right">
                       <p className="text-[10px] text-gray-400 uppercase">Balance</p>
                       <p className={`text-lg md:text-xl font-extrabold ${unit.balance > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                          KES {Math.abs(unit.balance).toLocaleString()}
                       </p>
                       <p className={`text-[10px] font-medium ${unit.balance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {unit.balance > 0 ? 'OWED' : unit.balance < 0 ? 'CREDIT' : 'SETTLED'}
                       </p>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                     <p className="text-xs text-gray-400">
                        Rent: <span className="font-semibold text-gray-600">KES {activeProperty.price?.toLocaleString()}</span>
                     </p>

                     <div className="flex gap-2 w-full md:w-auto">
                       {/* NEW: WhatsApp Reminder */}
                       {unit.tenant && unit.balance > 0 && (
                         <button 
                           onClick={() => handleSendReminder(unit)}
                           className="flex-1 md:flex-none border border-green-200 text-green-600 text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-green-50 transition-colors flex items-center justify-center gap-1"
                         >
                           <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                           Remind
                         </button>
                       )}
                       
                       <button 
                         onClick={() => openPayModal(unit)}
                         className="flex-1 md:flex-none bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                       >
                         <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
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

      {/* Payment Modal - Now passing balance to auto-fill */}
      {isPayModalOpen && selectedUnit && (
        <RecordPaymentModal 
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          unit={selectedUnit}
          tenant={selectedUnit?.tenant}
          balance={selectedUnit?.balance || 0} // Pass balance here
          onSave={() => handleSelectProperty(activeProperty)}
        />
      )}
    </div>
  );
}