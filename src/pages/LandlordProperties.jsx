/* eslint-disable react-hooks/purity */
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useOutletContext } from 'react-router-dom';
import EditPropertyModal from '../components/EditPropertyModal';

export default function LandlordProperties() {
  const { openAddPropertyModal } = useOutletContext();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState({ isOpen: false, property: null });
  
  // Verification Engine State
  const [expandingId, setExpandingId] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);
  const [totalUnits, setTotalUnits] = useState(1);
  const [availableUnits, setAvailableUnits] = useState(1);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data } = await supabase
      .from('properties')
      .select('*')
      .eq('landlord_id', user.id)
      .order('created_at', { ascending: false });
    
    if (data) setProperties(data);
    setLoading(false);
  };

  // Trigger the inline verification form
  const handleOpenVerify = (property) => {
    setExpandingId(property.id);
    setTotalUnits(property.total_units || 1);
    setAvailableUnits(property.available_units || 1);
  };

  // The 1-Click Verify & Update Logic
  const handleVerify = async (id) => {
    setVerifyingId(id);
    
    // Determine status based on available units
    let newStatus = 'available';
    if (availableUnits === 0) newStatus = 'fully_occupied';
    else if (availableUnits < totalUnits) newStatus = 'few_units';

    const { error } = await supabase
      .from('properties')
      .update({
        total_units: totalUnits,
        available_units: availableUnits,
        availability_status: newStatus,
        last_verified_at: new Date().toISOString(),
        verification_due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        verification_status: 'verified',
        auto_hidden: false,
        views_since_last_verified: 0
      })
      .eq('id', id);

    if (!error) {
      setExpandingId(null); // Close inline form
      fetchProperties();    // Refresh data instantly
    }
    setVerifyingId(null);
  };

  const handleDelete = async (id) => {
    if(window.confirm("Delete this property? This cannot be undone.")) {
      await supabase.from('properties').delete().eq('id', id);
      fetchProperties();
    }
  };

  // Badge Logic 🟢 🟡 🔴
  const getVerificationBadge = (p) => {
    if (p.auto_hidden) return <span className="bg-red-100 text-red-700 px-2 py-1 text-xs rounded-full font-semibold">🔴 Hidden</span>;
    
    if (!p.last_verified_at) return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 text-xs rounded-full font-semibold">🟡 Action Required</span>;
    
    const daysSince = Math.floor((Date.now() - new Date(p.last_verified_at).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSince <= 7) return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 text-xs rounded-full font-semibold">🟢 Verified {daysSince === 0 ? 'Today' : `${daysSince}d ago`}</span>;
    if (daysSince <= 30) return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 text-xs rounded-full font-semibold">🟡 {daysSince}d ago</span>;
    return <span className="bg-red-100 text-red-700 px-2 py-1 text-xs rounded-full font-semibold">🔴 Expired</span>;
  };

  // Calculate properties needing attention for the banner
  const needsAttention = properties.filter(p => 
    p.auto_hidden || !p.last_verified_at || 
    (Math.floor((Date.now() - new Date(p.last_verified_at).getTime()) / (1000 * 60 * 60 * 24)) > 7)
  ).length;

  return (
    <div className="p-4 md:p-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Properties</h1>
          <p className="text-gray-500 text-sm">Manage your rental listings & availability</p>
        </div>
        <button onClick={openAddPropertyModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
          + Add New Property
        </button>
      </div>

      {/* Verification Health Banner */}
      {needsAttention > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <p className="text-sm font-medium">
              You have <span className="font-bold text-amber-900">{needsAttention} listing{needsAttention > 1 ? 's' : ''}</span> requiring verification. Unverified listings are hidden from tenants.
            </p>
          </div>
        </div>
      )}

      {loading ? <p className="text-gray-500 py-10 text-center">Loading properties...</p> : properties.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">🏠</p>
          <p className="text-lg font-medium">No properties listed yet.</p>
          <p className="text-sm">Click "+ Add New Property" to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          
          {/* Desktop Table View */}
          <table className="w-full hidden md:table">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Property</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Units</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Verification</th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {properties.map((p) => (
                <React.Fragment key={p.id}>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden mr-3 flex-shrink-0">
                           {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No img</div>}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{p.title}</p>
                          <p className="text-xs text-gray-500">{p.location} • KES {p.price?.toLocaleString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {p.available_units || 0} / {p.total_units || 1} <span className="text-xs text-gray-400">Available</span>
                    </td>
                    <td className="py-4 px-6">
                      {getVerificationBadge(p)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {expandingId === p.id ? (
                          <button onClick={() => setExpandingId(null)} className="text-gray-500 hover:text-gray-700 text-sm font-medium">
                            Cancel
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleOpenVerify(p)} 
                            className="bg-teal-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-teal-700 transition"
                          >
                            ✔ Update Status
                          </button>
                        )}
                        <button onClick={() => setEditModal({ isOpen: true, property: p })} className="text-blue-600 hover:underline text-sm font-medium">Edit</button>
                        <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Delete</button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Inline Verification Form (Desktop) */}
                  {expandingId === p.id && (
                    <tr className="bg-teal-50/50">
                      <td colSpan="4" className="px-6 py-4">
                        <div className="flex items-end gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Total Units</label>
                            <input 
                              type="number" 
                              value={totalUnits} 
                              onChange={(e) => setTotalUnits(e.target.value)} 
                              className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500 outline-none"
                              min="1"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Available Units</label>
                            <input 
                              type="number" 
                              value={availableUnits} 
                              onChange={(e) => setAvailableUnits(e.target.value)} 
                              className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500 outline-none"
                              min="0"
                              max={totalUnits}
                            />
                          </div>
                          <button 
                            onClick={() => handleVerify(p.id)} 
                            disabled={verifyingId === p.id}
                            className="bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-800 transition disabled:opacity-50"
                          >
                            {verifyingId === p.id ? 'Saving...' : 'Verify & Save'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          
          {/* Mobile Cards View */}
          <div className="md:hidden space-y-4 p-4">
             {properties.map(p => (
               <div key={p.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                 <div className="flex justify-between items-start">
                   <div className="flex-1">
                     <h3 className="font-bold text-gray-800 text-sm">{p.title}</h3>
                     <p className="text-xs text-gray-500 mt-1">{p.location} • KES {p.price?.toLocaleString()}</p>
                   </div>
                   {getVerificationBadge(p)}
                 </div>
                 
                 <div className="flex items-center justify-between text-sm">
                   <span className="text-gray-600 font-medium">Units: {p.available_units || 0}/{p.total_units || 1} Available</span>
                 </div>

                 {/* Inline Verification Form (Mobile) */}
                 {expandingId === p.id ? (
                   <div className="bg-white p-3 rounded-lg border border-teal-200 space-y-3">
                     <div className="flex gap-3">
                       <div className="flex-1">
                         <label className="block text-xs font-medium text-gray-600 mb-1">Total</label>
                         <input type="number" value={totalUnits} onChange={(e) => setTotalUnits(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" min="1" />
                       </div>
                       <div className="flex-1">
                         <label className="block text-xs font-medium text-gray-600 mb-1">Available</label>
                         <input type="number" value={availableUnits} onChange={(e) => setAvailableUnits(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" min="0" />
                       </div>
                     </div>
                     <div className="flex gap-2">
                       <button onClick={() => setExpandingId(null)} className="flex-1 border border-gray-300 text-gray-700 text-xs font-semibold py-2 rounded-lg">Cancel</button>
                       <button onClick={() => handleVerify(p.id)} disabled={verifyingId === p.id} className="flex-1 bg-teal-700 text-white text-xs font-semibold py-2 rounded-lg disabled:opacity-50">
                         {verifyingId === p.id ? 'Saving...' : 'Verify'}
                       </button>
                     </div>
                   </div>
                 ) : (
                   <button onClick={() => handleOpenVerify(p)} className="w-full bg-teal-600 text-white text-xs font-semibold py-2.5 rounded-lg hover:bg-teal-700 transition">
                     ✔ Update Availability
                   </button>
                 )}

                 <div className="flex space-x-2 border-t pt-3 border-gray-200">
                   <button onClick={() => setEditModal({ isOpen: true, property: p })} className="flex-1 bg-white border text-xs font-semibold py-2 rounded-lg hover:bg-gray-50">Edit Details</button>
                   <button onClick={() => handleDelete(p.id)} className="flex-1 bg-red-50 text-red-600 text-xs font-semibold py-2 rounded-lg hover:bg-red-100">Delete</button>
                 </div>
               </div>
             ))}
          </div>
        </div>
      )}

      {editModal.isOpen && (
        <EditPropertyModal 
          isOpen={editModal.isOpen}
          onClose={() => setEditModal({ isOpen: false, property: null })}
          property={editModal.property}
          onSave={fetchProperties}
        />
      )}
    </div>
  );
}