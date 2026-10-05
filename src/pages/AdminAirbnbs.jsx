/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import EditAirbnbModal from '../components/EditAirbnbModal';

const AdminAirbnbs = () => {
  const [airbnbs, setAirbnbs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAirbnb, setSelectedAirbnb] = useState(null);

  useEffect(() => { 
    fetchAirbnbs(); 
  }, []);

  const fetchAirbnbs = async () => {
    try {
      const { data, error } = await supabase
        .from('airbnb_listings')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setAirbnbs(data || []);
    } catch (error) {
      console.error("Error fetching airbnbs:", error.message);
      alert("Failed to fetch Airbnbs: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeatured = async (airbnb) => {
    if (!airbnb.id) return;
    const newStatus = !airbnb.featured;

    try {
      const { data, error } = await supabase
        .from('airbnb_listings')
        .update({ featured: newStatus })
        .eq('id', airbnb.id)
        .select();

      if (error) {
        alert("Database Error: " + error.message);
        return;
      }

      if (!data || data.length === 0) {
        alert("Update failed: Check RLS policies.");
        return;
      }

      setAirbnbs(prev => prev.map(a => a.id === airbnb.id ? { ...a, featured: newStatus } : a));

    } catch (err) {
      alert("Network Error: " + err.message);
    }
  };

  const handleDelete = async (airbnb) => {
    if (!window.confirm(`Delete Airbnb "${airbnb.name}"? This cannot be undone.`)) return;

    try {
      const { error } = await supabase.from('airbnb_listings').delete().eq('id', airbnb.id);
      if (error) throw error;
      setAirbnbs(prev => prev.filter(a => a.id !== airbnb.id));
      alert("Airbnb deleted.");
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  const openEditModal = (airbnb) => {
    setSelectedAirbnb(airbnb);
    setIsEditModalOpen(true);
  };

  const handleSave = (updatedData) => {
    setAirbnbs(prev => prev.map(a => a.id === selectedAirbnb.id ? { ...a, ...updatedData } : a));
  };

  // Quick inline update for WhatsApp number only (admin convenience)
  const handleQuickContactUpdate = async (airbnb, newWhatsapp) => {
    if (!newWhatsapp) return;
    const cleanNumber = newWhatsapp.replace(/\D/g, '');
    
    try {
      const { data, error } = await supabase
        .from('airbnb_listings')
        .update({ 
          contact_info: { 
            whatsapp: cleanNumber, 
            phone: cleanNumber 
          } 
        })
        .eq('id', airbnb.id)
        .select();

      if (error) throw error;

      setAirbnbs(prev => prev.map(a => 
        a.id === airbnb.id 
          ? { ...a, contact_info: { whatsapp: cleanNumber, phone: cleanNumber } }
          : a
      ));
      
      alert("WhatsApp number saved successfully.");
    } catch (err) {
      alert("Failed to save: " + err.message);
    }
  };

  // Count listings missing contact info for the summary banner
  const missingContactCount = airbnbs.filter(a => {
    const info = a.contact_info || {};
    return !info.whatsapp && !info.phone;
  }).length;

  if (loading) return <div className="p-6">Loading Airbnbs...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Airbnb Management</h1>
        <p className="text-gray-600">Manage short-stay listings, pricing, and availability.</p>
      </div>

      {/* Warning banner for missing contacts */}
      {missingContactCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-red-700">
                {missingContactCount} listing{missingContactCount > 1 ? 's' : ''} missing a WhatsApp number
              </p>
              <p className="text-xs text-red-500">
                Guests won't be able to book these. Click "Set Number" to add one.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Listing</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price/Night</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guests</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">WhatsApp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Featured</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {airbnbs.map((airbnb) => {
                const contactInfo = airbnb.contact_info || {};
                const whatsapp = contactInfo.whatsapp || contactInfo.phone || '';
                
                return (
                  <tr key={airbnb.id} className={`hover:bg-gray-50 ${!whatsapp ? 'bg-red-50/30' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded bg-gray-100 mr-3 overflow-hidden flex-shrink-0">
                           {airbnb.image_url ? <img src={airbnb.image_url} className="w-full h-full object-cover" alt="" /> : <span className="text-gray-400 text-xs flex items-center justify-center h-full">Img</span>}
                        </div>
                        <div>
                           <div className="font-medium text-gray-900">{airbnb.name}</div>
                           <div className="text-xs text-gray-500">{airbnb.bedrooms} Bed / {airbnb.bathrooms} Bath</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{airbnb.location}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-teal-600">KES {airbnb.price_per_night?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{airbnb.max_guests || 'N/A'}</td>
                    
                    {/* WhatsApp column */}
                    <td className="px-6 py-4">
                      {whatsapp ? (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.149-.197.297-.767.967-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
                          </svg>
                          <span className="text-sm text-gray-700 font-medium">{whatsapp}</span>
                        </div>
                      ) : (
                        <button 
                          onClick={() => {
                            const num = window.prompt(`Enter WhatsApp number for "${airbnb.name}":\n\nUse international format without + (e.g. 254712345678)`);
                            if (num) handleQuickContactUpdate(airbnb, num);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 text-xs font-semibold rounded-lg border border-red-300 hover:bg-red-200 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Set Number
                        </button>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${airbnb.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {airbnb.status}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => toggleFeatured(airbnb)}
                        className={`px-3 py-1 text-xs rounded-full font-semibold border transition-all duration-200 ${
                          airbnb.featured
                            ? 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200' 
                            : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {airbnb.featured ? '★ Featured' : '☆ Feature'}
                      </button>
                    </td>

                    <td className="px-6 py-4 text-sm text-right space-x-2">
                      <button onClick={() => openEditModal(airbnb)} className="text-blue-600 hover:underline font-medium">Edit</button>
                      <button onClick={() => handleDelete(airbnb)} className="text-red-600 hover:underline font-medium">Delete</button>
                    </td>
                  </tr>
                );
              })}
              
              {airbnbs.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500">No Airbnb listings found. Convert a property or have a host list one!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EditAirbnbModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        airbnb={selectedAirbnb}
        onSave={handleSave}
      />
    </div>
  );
};

export default AdminAirbnbs;