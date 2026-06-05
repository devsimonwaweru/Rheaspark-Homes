import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function JoinPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState(null);
  const [units, setUnits] = useState([]);
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
        .select('id, title, location, landlords ( full_name )')
        .eq('join_code', code)
        .single();

      if (propError || !prop) throw new Error("Invalid invite link.");

      setProperty(prop);

      // 2. Get Available Units for this property
      const { data: unitsData, error: unitsError } = await supabase
        .from('units')
        .select('id, unit_name, status')
        .eq('property_id', prop.id)
        .eq('status', 'vacant'); // Only show vacant units

      if (unitsError) throw unitsError;
      
      if (!unitsData || unitsData.length === 0) throw new Error("No units available for rent.");

      setUnits(unitsData);
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
      // 1. Insert Tenants
      const tenantsToInsert = adults.map((adult, index) => ({
        unit_id: selectedUnit,
        full_name: adult.name,
        phone: adult.phone,
        is_primary: index === primaryIndex
      }));

      const { error: tenantError } = await supabase
        .from('tenants')
        .insert(tenantsToInsert);

      if (tenantError) throw tenantError;

      // 2. Update Unit Status
      const { error: unitError } = await supabase
        .from('units')
        .update({ status: 'occupied' })
        .eq('id', selectedUnit);

      if (unitError) throw unitError;

      setStep(4); // Success
    } catch (err) {
      console.error(err);
      setError("Submission failed. Please check details.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Verifying link...</div>;
  
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
        <p className="text-gray-500">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow p-6 mb-6 text-center">
          <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">You are invited to join</p>
          <h1 className="text-2xl font-bold text-gray-800 mt-1">{property?.title}</h1>
          <p className="text-sm text-gray-400">{property?.location}</p>
          <p className="text-xs text-gray-300 mt-2">Hosted by {property?.landlords?.full_name}</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow p-6">
          
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-800">Step 1: Select Your Unit</h2>
              
              <select 
                value={selectedUnit} 
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl p-3 font-medium focus:border-blue-500 outline-none"
              >
                <option value="">-- Select Unit --</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.unit_name}</option>)}
              </select>

              <button 
                onClick={() => selectedUnit ? setStep(2) : alert("Please select a unit")}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700"
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-800">Step 2: Tenant Details</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Number of Adults</label>
                <select value={adultCount} onChange={handleAdultCountChange} className="w-full border-2 border-gray-200 rounded-lg p-2">
                  {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              {adults.map((adult, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <p className="text-xs font-bold text-gray-400">Adult {index + 1}</p>
                  <input type="text" placeholder="Full Name" required className="w-full border p-2 rounded text-sm" value={adult.name} onChange={(e) => handleAdultChange(index, 'name', e.target.value)} />
                  <input type="tel" placeholder="Phone Number" required className="w-full border p-2 rounded text-sm" value={adult.phone} onChange={(e) => handleAdultChange(index, 'phone', e.target.value)} />
                  
                  <div className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="primary" 
                      checked={primaryIndex === index} 
                      onChange={() => setPrimaryIndex(index)} 
                    />
                    <label className="text-xs text-gray-500">Primary Contact (Receives SMS)</label>
                  </div>
                </div>
              ))}

              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="px-4 py-2 text-gray-500">Back</button>
                <button onClick={() => setStep(3)} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold">Continue</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 text-center">
               <h2 className="text-lg font-bold text-gray-800">Confirm & Join</h2>
               
               <div className="bg-gray-50 p-4 rounded-lg text-sm text-left text-gray-600 space-y-1">
                  <p>Unit: <strong>{units.find(u => u.id === selectedUnit)?.unit_name}</strong></p>
                  <p>Primary Contact: <strong>{adults[primaryIndex]?.name}</strong></p>
               </div>

               <p className="text-xs text-gray-400 px-4">
                 By continuing, you agree that your data is securely stored and will be deleted when you vacate.
               </p>

               {error && <p className="text-red-500 text-sm">{error}</p>}

               <button 
                 onClick={handleSubmit} 
                 disabled={submitting}
                 className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50"
               >
                 {submitting ? "Joining..." : "Confirm & Join"}
               </button>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800">Welcome Home!</h2>
              <p className="text-gray-500 text-sm">You have successfully joined.</p>
              <button onClick={() => navigate('/')} className="text-blue-600 font-semibold text-sm">Finish</button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}