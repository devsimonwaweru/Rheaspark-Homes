import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function JoinPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState(null);
  const [unitOptions, setUnitOptions] = useState([]);
  const [isDynamic, setIsDynamic] = useState(false);
  const [error, setError] = useState(null);
  
  // Form State
  const [step, setStep] = useState(1); 
  const [selectedUnit, setSelectedUnit] = useState('');
  
  const [adultCount, setAdultCount] = useState(1);
  const [adults, setAdults] = useState([{ name: '', phone: '' }]);
  const [primaryIndex, setPrimaryIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    verifyLink();
  }, [code]);

  const verifyLink = async () => {
    try {
      // 1. Get Property by Code
      const { data: prop, error: propError } = await supabase
        .from('properties')
        .select('id, title, location, total_units, landlords ( full_name )')
        .eq('join_code', code)
        .single();

      if (propError || !prop) throw new Error("Invalid or expired invite link.");

      setProperty(prop);

      // 2. Try to get actual vacant units from the database
      // Using select('*') for maximum compatibility
      let dbUnits = [];
      const { data, error: unitsError } = await supabase
        .from('units')
        .select('*')
        .eq('property_id', prop.id)
        .eq('status', 'vacant');

      if (unitsError) {
        console.error("Supabase units error:", unitsError);
      } else if (data && data.length > 0) {
        // Scenario A: Landlord created physical profiles. Use them.
        dbUnits = data.map(u => ({ id: u.id, unit_name: u.unit_name }));
        setUnitOptions(dbUnits);
        setIsDynamic(false);
      } else {
        // Scenario B: No physical rows created yet. Generate ALL total units for tenant to pick from!
        if (prop.total_units > 0) {
          const dynamicUnits = [];
          for (let i = 1; i <= prop.total_units; i++) {
            dynamicUnits.push({ 
              id: `dynamic_${i}`, 
              unit_name: `Unit ${i}` 
            });
          }
          setUnitOptions(dynamicUnits);
          setIsDynamic(true);
        } else {
          throw new Error("This property currently has no units configured.");
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdultCountChange = (e) => {
    const count = parseInt(e.target.value) || 1;
    setAdultCount(count);
    const newAdults = [];
    for (let i = 0; i < count; i++) {
      newAdults.push(adults[i] || { name: '', phone: '' });
    }
    setAdults(newAdults);
  };

  const handleAdultChange = (index, field, value) => {
    const newAdults = [...adults];
    newAdults[index][field] = value;
    setAdults(newAdults);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      let actualUnitId = selectedUnit;

      // If the units were generated dynamically, create the DB row NOW
      if (isDynamic) {
        const selectedOption = unitOptions.find(u => u.id === selectedUnit);
        
        const { data: newUnit, error: unitError } = await supabase
          .from('units')
          .insert([{
            property_id: property.id,
            unit_name: selectedOption.unit_name,
            status: 'occupied'
          }])
          .select('*')
          .single();

        if (unitError) throw unitError;
        actualUnitId = newUnit.id;
      } else {
        // If it was a real DB unit, just update its status to occupied
        const { error: updateError } = await supabase
          .from('units')
          .update({ status: 'occupied' })
          .eq('id', selectedUnit);

        if (updateError) throw updateError;
      }

      // Insert Tenants using the actual Unit ID
      const tenantsToInsert = adults.map((adult, index) => ({
        unit_id: actualUnitId,
        full_name: adult.name,
        phone: adult.phone,
        is_primary: index === primaryIndex
      }));

      const { error: tenantError } = await supabase
        .from('tenants')
        .insert(tenantsToInsert);

      if (tenantError) throw tenantError;

      // Success!
      setStep(4); 
    } catch (err) {
      console.error(err);
      setError("Submission failed: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500 font-medium">Verifying invite link...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md border border-red-100">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Could Not Proceed</h2>
        <p className="text-gray-500">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow p-6 mb-6 text-center border border-gray-100">
          <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">You are invited to join</p>
          <h1 className="text-2xl font-bold text-gray-800 mt-1">{property?.title}</h1>
          <p className="text-sm text-gray-400">{property?.location}</p>
          <p className="text-xs text-gray-300 mt-2">Managed by {property?.landlords?.full_name}</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
          
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-800">Step 1: Select Your Unit</h2>
              <p className="text-xs text-gray-400">Choose from the available units for this property.</p>
              
              <select 
                value={selectedUnit} 
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl p-3 font-medium focus:border-blue-500 outline-none bg-white"
              >
                <option value="">-- Select Unit --</option>
                {unitOptions.map(u => <option key={u.id} value={u.id}>{u.unit_name}</option>)}
              </select>

              <button 
                onClick={() => selectedUnit ? setStep(2) : setError("Please select a unit to continue.")}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-800">Step 2: Tenant Details</h2>
              <p className="text-xs text-gray-400">Enter details for all adults moving in.</p>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Number of Adults</label>
                <select value={adultCount} onChange={handleAdultCountChange} className="w-full border-2 border-gray-200 rounded-lg p-2 outline-none">
                  {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              {adults.map((adult, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg space-y-2 border border-gray-100">
                  <p className="text-xs font-bold text-gray-400">Adult {index + 1}</p>
                  <input type="text" placeholder="Full Name" required className="w-full border p-2.5 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500" value={adult.name} onChange={(e) => handleAdultChange(index, 'name', e.target.value)} />
                  <input type="tel" placeholder="Phone Number (e.g., 0712345678)" required className="w-full border p-2.5 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500" value={adult.phone} onChange={(e) => handleAdultChange(index, 'phone', e.target.value)} />
                  
                  <div className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="primary" 
                      checked={primaryIndex === index} 
                      onChange={() => setPrimaryIndex(index)} 
                      className="text-blue-600"
                    />
                    <label className="text-xs text-gray-500">Primary Contact (Receives SMS updates)</label>
                  </div>
                </div>
              ))}

              <div className="flex gap-2 pt-2">
                <button onClick={() => { setStep(1); setError(null); }} className="px-4 py-2.5 text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 font-medium">Back</button>
                <button onClick={() => {
                  const isValid = adults.every(a => a.name.trim() && a.phone.trim());
                  if (!isValid) { setError("Please fill in all names and phone numbers."); return; }
                  setError(null);
                  setStep(3);
                }} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700">Continue</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 text-center">
               <h2 className="text-lg font-bold text-gray-800">Confirm & Join</h2>
               
               <div className="bg-gray-50 p-4 rounded-lg text-sm text-left text-gray-600 space-y-2 border">
                  <div className="flex justify-between">
                    <span>Property:</span> 
                    <strong className="text-gray-800">{property?.title}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Unit:</span> 
                    <strong className="text-gray-800">{unitOptions.find(u => u.id === selectedUnit)?.unit_name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Primary Contact:</span> 
                    <strong className="text-gray-800">{adults[primaryIndex]?.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Phone:</span> 
                    <strong className="text-gray-800">{adults[primaryIndex]?.phone}</strong>
                  </div>
               </div>

               <p className="text-xs text-gray-400 px-4">
                 By clicking confirm, you agree that your data is securely stored and will be deleted when you vacate.
               </p>

               {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

               <button 
                 onClick={handleSubmit} 
                 disabled={submitting}
                 className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
               >
                 {submitting ? (
                   <>
                     <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                     Submitting...
                   </>
                 ) : "Confirm & Join Property"}
               </button>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-8 space-y-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Welcome Home!</h2>
              <p className="text-gray-500 text-sm">You have successfully been added to <strong>{unitOptions.find(u => u.id === selectedUnit)?.unit_name}</strong> at {property?.title}.</p>
              <p className="text-xs text-gray-400">Your landlord has been notified.</p>
              <button onClick={() => navigate('/')} className="mt-4 text-blue-600 font-semibold text-sm hover:underline">Back to Home</button>
            </div>
          )}

          {/* Global Error Display */}
          {error && step !== 3 && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100 text-center">
              {error}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}