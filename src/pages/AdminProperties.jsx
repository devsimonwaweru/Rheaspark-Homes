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
      console.log("Fetching properties...");
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      console.log("Fetched properties:", data);
      setProperties(data || []);
    } catch (error) {
      console.error("Error fetching properties:", error.message);
      alert("Failed to fetch properties: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: Toggle Featured Status with Advanced Logging
  const toggleFeatured = async (property) => {
    // 1. Check ID
    if (!property.id) {
      alert("Error: This property is missing an ID.");
      console.error("Missing ID", property);
      return;
    }

    const newStatus = property.featured === 'true' ? 'false' : 'true';
    console.log(`Attempting update: ID ${property.id} to featured: ${newStatus}`);

    try {
      // 2. Attempt Update
      const { data, error } = await supabase
        .from('properties')
        .update({ featured: newStatus })
        .eq('id', property.id)
        .select(); // Request the updated data back

      // 3. Log Raw Response
      console.log("Supabase Response:", { data, error });

      // 4. Handle Errors
      if (error) {
        alert("Database Error: " + error.message);
        return;
      }

      // 5. Handle Empty Data (Indicates RLS or wrong ID)
      if (!data || data.length === 0) {
        alert("Update failed: Database returned no data. Check if RLS is blocking the write.");
        console.warn("No data returned. Check RLS policies or if ID exists in DB.");
        return;
      }

      // 6. Success: Update UI
      setProperties(prev => prev.map(p => 
        p.id === property.id ? { ...p, featured: newStatus } : p
      ));
      
      console.log("UI State Updated Successfully");

    } catch (err) {
      console.error("Network/Catch Error:", err);
      alert("Network Error: " + err.message);
    }
  };

  const handleDelete = async (property) => {
    if (!window.confirm(`Delete "${property.title}"?`)) return;

    const confirmUnlocks = window.confirm(
      "Delete associated unlock records too?\n\n" +
      "OK = Delete Everything.\n" + 
      "Cancel = Stop."
    );

    if (confirmUnlocks) {
      try {
        // Delete unlocks
        await supabase.from('unlocks').delete().eq('property_id', property.id);
        
        // Delete property
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

  if (loading) return <div className="p-6">Loading properties...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Properties Management</h1>
        <p className="text-gray-600">Manage listings, edit GPS, and handle deletions.</p>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Featured</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {properties.map((prop) => (
              <tr key={prop.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded bg-gray-100 mr-3 overflow-hidden">
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

                <td className="px-6 py-4 text-sm space-x-2">
                  <button onClick={() => openEditModal(prop)} className="text-blue-600 hover:underline font-medium">Edit</button>
                  <button onClick={() => handleDelete(prop)} className="text-red-600 hover:underline font-medium">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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