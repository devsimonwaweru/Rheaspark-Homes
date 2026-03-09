/* eslint-disable no-unused-vars */
// src/pages/LandlordHome.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useOutletContext } from 'react-router-dom';

export default function LandlordHome() {
  const { openAddPropertyModal } = useOutletContext();

  const [properties, setProperties] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    loadData();
    
    // Listen for updates when a new property is added via the modal
    const channel = supabase.channel('realtime-properties')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'properties' }, () => loadData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: landlordProfile } = await supabase.from('landlords').select('*').eq('id', user.id).single();
    setProfile(landlordProfile);

    const { data: propsData } = await supabase
      .from('properties')
      .select('*')
      .eq('landlord_id', user.id)
      .order('created_at', { ascending: false });

    if (propsData) setProperties(propsData);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this property permanently?")) return;
    
    await supabase.from('properties').delete().eq('id', id);
    setProperties(properties.filter(p => p.id !== id));
  };

  const openEdit = (property) => {
    setEditData({ ...property });
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const { id, created_at, landlord_id, ...updateData } = editData; // Exclude non-updatable fields
    
    const { error } = await supabase
      .from('properties')
      .update(updateData)
      .eq('id', id);

    if (!error) {
      setProperties(properties.map(p => p.id === id ? editData : p));
      setIsEditModalOpen(false);
    } else {
      alert("Error updating property: " + error.message);
    }
  };

  const toggleStatus = async (property) => {
    const newStatus = property.status === 'active' ? 'inactive' : 'active';
    const { error } = await supabase
      .from('properties')
      .update({ status: newStatus })
      .eq('id', property.id);
    
    if (!error) {
      setProperties(properties.map(p => p.id === property.id ? { ...p, status: newStatus } : p));
    }
  };

  const totalListed = properties.length;
  const activeListings = properties.filter(p => p.status === 'active').length;

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 relative">
      
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-2xl p-8 text-white shadow-xl mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {profile?.full_name?.split(' ')[0] || 'Landlord'}!
        </h1>
        <p className="text-blue-100">Manage your properties and track performance.</p>
      </div>

      {/* Top Actions */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold text-gray-800">Overview</h2>
        <button 
          onClick={openAddPropertyModal} 
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-emerald-500 text-white px-6 py-2.5 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          <span>Add New Property</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-3xl font-bold text-gray-800 mb-1">{totalListed}</h3>
          <p className="text-gray-500 text-sm">Total Listed Properties</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-3xl font-bold text-emerald-600 mb-1">{activeListings}</h3>
          <p className="text-gray-500 text-sm">Active Listings</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-3xl font-bold text-gray-800 mb-1">{totalListed - activeListings}</h3>
          <p className="text-gray-500 text-sm">Pending / Inactive</p>
        </div>
      </div>

      {/* Properties List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Your Properties</h3>
        
        {properties.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-500 mb-4">You haven't listed any properties yet.</p>
            <button onClick={openAddPropertyModal} className="text-blue-600 font-semibold hover:underline">Post your first property →</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((p) => (
              <div key={p.id} className="group bg-gray-50 rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all">
                {p.image_url ? (
                  <div className="relative h-40 overflow-hidden">
                    <img src={p.image_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                ) : (
                  <div className="w-full h-40 bg-gray-200 flex items-center justify-center text-gray-400">
                     <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-bold text-gray-800 truncate">{p.title}</h3>
                  <p className="text-blue-600 font-semibold text-sm mt-1">KES {p.price?.toLocaleString()}</p>
                  <p className="text-gray-400 text-xs mt-1 truncate">{p.location || 'Location not set'}</p>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                     <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                       {p.status}
                     </span>
                     <div className="flex space-x-2">
                       <button onClick={() => openEdit(p)} className="text-xs font-semibold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded">Edit</button>
                       <button onClick={() => toggleStatus(p)} className={`text-xs font-semibold px-2 py-1 rounded ${p.status === 'active' ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}>
                         {p.status === 'active' ? 'Deactivate' : 'Republish'}
                       </button>
                       <button onClick={() => handleDelete(p.id)} className="text-xs font-semibold text-red-600 hover:bg-red-50 px-2 py-1 rounded">Delete</button>
                     </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-800">Edit Property</h2>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input name="title" value={editData.title || ''} onChange={handleEditChange} className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input name="location" value={editData.location || ''} onChange={handleEditChange} className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <input type="number" name="price" value={editData.price || ''} onChange={handleEditChange} className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select name="type" value={editData.type || ''} onChange={handleEditChange} className="w-full px-4 py-2 border rounded-lg">
                    <option>Apartment</option>
                    <option>House</option>
                    <option>Studio</option>
                    <option>Bedsitter</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" value={editData.description || ''} onChange={handleEditChange} rows="3" className="w-full px-4 py-2 border rounded-lg" />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Update Property</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}