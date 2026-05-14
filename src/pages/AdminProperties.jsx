/* eslint-disable no-undef */
// src/pages/AdminProperties.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import EditPropertyModal from '../components/EditPropertyModal'; // Import the new modal

const AdminProperties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);

  useEffect(() => { fetchProperties(); }, []);

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
    } finally {
      setLoading(false);
    }
  };

  // UPDATED DELETE LOGIC
  const handleDelete = async (property) => {
    // 1. Standard Confirmation
    if (!window.confirm(`Delete "${property.title}"?`)) return;

    // 2. Check for Unlocks (Double Confirmation)
    // We ask the user specifically about unlocked records
    const confirmUnlocks = window.confirm(
      "Do you want to DELETE the associated unlock records for this property as well?\n\n" +
      "Click 'OK' to DELETE UNLOCKS AND PROPERTY.\n" + 
      "Click 'Cancel' to STOP (if you need to keep unlock history)."
    );

    if (confirmUnlocks) {
      try {
        // Step A: Delete Unlocks first (assuming table is named 'unlocks')
        // Note: If your database has 'ON DELETE CASCADE' setup, this step is automatic, but we do it manually to be safe.
        await supabase.from('unlocks').delete().eq('property_id', property.id);

        // Step B: Delete Property
        const { error } = await supabase.from('properties').delete().eq('id', property.id);
        if (error) throw error;

        setProperties(properties.filter(p => p.id !== property.id));
        alert("Property deleted.");
      } catch (err) {
        alert("Delete failed: " + err.message);
      }
    } else {
      alert("Deletion cancelled.");
    }
  };

  const openEditModal = (property) => {
    setSelectedProperty(property);
    setIsEditModalOpen(true);
  };

  const handleSave = (updatedData) => {
    // Update local state after successful save
    setProperties(properties.map(p => p.id === selectedProperty.id ? { ...p, ...updatedData } : p));
  };

  if (loading) return <div className="p-6">Loading properties...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Properties Management</h1>
        <p className="text-gray-600">Manage listings, edit GPS, and handle deletions.</p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
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
                <td className="px-6 py-4 text-sm space-x-2">
                  <button onClick={() => openEditModal(prop)} className="text-blue-600 hover:underline font-medium">Edit</button>
                  <button onClick={() => handleDelete(prop)} className="text-red-600 hover:underline font-medium">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Use the Modal Component */}
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