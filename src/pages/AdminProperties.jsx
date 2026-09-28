/* eslint-disable no-undef */
// src/pages/AdminProperties.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import EditPropertyModal from '../components/EditPropertyModal';

const AdminProperties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);

  useEffect(() => { 
    fetchProperties(); 
  }, []);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error("Error fetching properties:", error.message);
      alert("Failed to fetch properties: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeatured = async (property) => {
    if (!property.id) return;
    const newStatus = property.featured === 'true' ? 'false' : 'true';

    try {
      const { data, error } = await supabase
        .from('properties')
        .update({ featured: newStatus })
        .eq('id', property.id)
        .select();

      if (error) {
        alert("Database Error: " + error.message);
        return;
      }

      if (!data || data.length === 0) {
        alert("Update failed: Check if RLS is blocking the write.");
        return;
      }

      setProperties(prev => prev.map(p => p.id === property.id ? { ...p, featured: newStatus } : p));

    } catch (err) {
      alert("Network Error: " + err.message);
    }
  };

  const handleDelete = async (property) => {
    if (!window.confirm(`Delete "${property.title}"?`)) return;

    const confirmUnlocks = window.confirm(
      "Delete associated unlock records too?\n\nOK = Delete Everything.\nCancel = Stop."
    );

    if (confirmUnlocks) {
      try {
        await supabase.from('unlocks').delete().eq('property_id', property.id);
        const { error } = await supabase.from('properties').delete().eq('id', property.id);
        if (error) throw error;
        setProperties(prev => prev.filter(p => p.id !== property.id));
        alert("Property deleted.");
      } catch (err) {
        alert("Delete failed: " + err.message);
      }
    }
  };

  const openEditModal = (property) => {
    setSelectedProperty(property);
    setIsEditModalOpen(true);
  };

  const handleSave = (updatedData) => {
    setProperties(prev => prev.map(p => p.id === selectedProperty.id ? { ...p, ...updatedData } : p));
  };

  // ── NEW: CONVERT PROPERTY TO AIRBNB ──
  const handleConvertToAirbnb = async (prop) => {
    if (!window.confirm(`Convert "${prop.title}" to an Airbnb listing? \n\nThis will MOVE it from Houses to the Airbnb dashboard. The landlord will be assigned as the host.`)) return;

    try {
      // 1. Ensure the landlord has a host profile
      if (prop.landlord_id) {
        const { error: hostErr } = await supabase.from('airbnb_hosts').upsert({ 
          id: prop.landlord_id, 
          subscription_status: 'active' 
        }, { onConflict: 'id' });
        if (hostErr) console.error("Host upsert warning:", hostErr);
      }

      // 2. Map Property fields to Airbnb fields
      const airbnbPayload = {
        host_id: prop.landlord_id, 
        name: prop.title,
        location: prop.location,
        county: prop.county,
        constituency: prop.constituency,
        latitude: prop.latitude,
        longitude: prop.longitude,
        image_url: prop.image_url,
        photos: prop.images ? [prop.images] : [],
        description: prop.description,
        max_guests: (prop.bedrooms || 1) * 2, // rough estimate
        bedrooms: prop.bedrooms || 1,
        bathrooms: prop.bathrooms || 1,
        price_per_night: prop.price || 0, 
        status: 'active',
        featured: prop.featured === 'true'
      };

      // 3. Insert into airbnb_listings
      const { error: insertError } = await supabase.from('airbnb_listings').insert(airbnbPayload);
      if (insertError) throw insertError;

      // 4. Delete from properties
      const { error: deleteError } = await supabase.from('properties').delete().eq('id', prop.id);
      if (deleteError) throw deleteError;

      // 5. Update UI
      setProperties(prev => prev.filter(p => p.id !== prop.id));
      alert("Success! Property converted to an Airbnb listing.");

    } catch (err) {
      console.error("Conversion Error:", err);
      alert("Conversion failed: " + err.message);
    }
  };

  if (loading) return <div className="p-6">Loading properties...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Properties Management</h1>
        <p className="text-gray-600">Manage long-term house listings or convert them to Airbnb short-stays.</p>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Featured</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {properties.map((prop) => (
                <tr key={prop.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded bg-gray-100 mr-3 overflow-hidden flex-shrink-0">
                         {prop.image_url ? <img src={prop.image_url} className="w-full h-full object-cover" alt="" /> : <span className="text-gray-400 text-xs flex items-center justify-center h-full">Img</span>}
                      </div>
                      <div>
                         <div className="font-medium text-gray-900">{prop.title}</div>
                         <div className="text-xs text-gray-500">{prop.type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{prop.location}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-blue-600">KES {prop.price?.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${prop.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {prop.status}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => toggleFeatured(prop)}
                      className={`px-3 py-1 text-xs rounded-full font-semibold border transition-all duration-200 ${
                        prop.featured === 'true'
                          ? 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200' 
                          : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {prop.featured === 'true' ? '★ Featured' : '☆ Feature'}
                    </button>
                  </td>

                  <td className="px-6 py-4 text-sm text-right space-x-2">
                    <button 
                      onClick={() => handleConvertToAirbnb(prop)} 
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                      Convert to Airbnb
                    </button>
                    <button onClick={() => openEditModal(prop)} className="text-blue-600 hover:underline font-medium">Edit</button>
                    <button onClick={() => handleDelete(prop)} className="text-red-600 hover:underline font-medium">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <EditPropertyModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        property={selectedProperty}
        onSave={handleSave}
      />
    </div>
  );
};

export default AdminProperties;