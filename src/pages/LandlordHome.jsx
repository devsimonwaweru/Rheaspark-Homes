/* eslint-disable no-unused-vars */
// src/pages/LandlordHome.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useOutletContext } from 'react-router-dom';
import EditPropertyModal from '../components/EditPropertyModal';

export default function LandlordHome() {
  const { openAddPropertyModal } = useOutletContext();

  const [properties, setProperties] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);

  useEffect(() => {
    loadData();
    const channel = supabase.channel('realtime-landlord-properties')
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

  // --- ROBUST DELETE LOGIC ---
  const handleDelete = async (property) => {
    const confirmProp = window.confirm(`Are you sure you want to delete "${property.title}"?`);
    if (!confirmProp) return;

    try {
      const { data: unlocks, error: unlockCheckError } = await supabase
        .from('unlocks')
        .select('id')
        .eq('property_id', property.id);

      if (unlockCheckError) throw unlockCheckError;

      if (unlocks && unlocks.length > 0) {
        const confirmUnlockDelete = window.confirm(
          `This property has ${unlocks.length} unlock record(s). Database constraints require deleting these first.\n\n` +
          `Do you want to DELETE the property AND its unlock history?\n\n` +
          `(Click 'Cancel' to keep the property)`
        );

        if (confirmUnlockDelete) {
          const { error: deleteUnlockError } = await supabase
            .from('unlocks')
            .delete()
            .eq('property_id', property.id);
          
          if (deleteUnlockError) throw deleteUnlockError;
        } else {
          alert("Deletion cancelled. Property preserved.");
          return;
        }
      }

      const { error: deletePropError } = await supabase
        .from('properties')
        .delete()
        .eq('id', property.id);

      if (deletePropError) throw deletePropError;

      setProperties(properties.filter(p => p.id !== property.id));
      alert("Property deleted successfully.");

    } catch (err) {
      console.error(err);
      alert("Failed to delete: " + err.message);
    }
  };

  const openEdit = (property) => {
    setSelectedProperty(property);
    setIsEditModalOpen(true);
  };

  const handleSave = (updatedData) => {
    setProperties(properties.map(p => p.id === selectedProperty.id ? { ...p, ...updatedData } : p));
  };

  const toggleStatus = async (property) => {
    const newStatus = property.status === 'active' ? 'inactive' : 'active';
    setProperties(properties.map(p => p.id === property.id ? { ...p, status: newStatus } : p));

    const { error } = await supabase
      .from('properties')
      .update({ status: newStatus })
      .eq('id', property.id);
    
    if (error) {
      setProperties(properties.map(p => p.id === property.id ? { ...p, status: property.status } : p));
      alert("Failed to update status: " + error.message);
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
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-2xl p-8 text-white shadow-xl mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {profile?.full_name?.split(' ')[0] || 'Landlord'}!
        </h1>
        <p className="text-blue-100">Manage your properties and track performance.</p>
      </div>

      {/* --- RENTAL MANAGEMENT ADVERT BANNER --- */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl p-6 md:p-8 text-white shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <span className="inline-block bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full uppercase mb-3 shadow-sm">
              Limited Offer
            </span>
            <h2 className="text-2xl font-bold mb-1">Automate Your Rentals</h2>
            <p className="text-indigo-100 text-sm md:text-base max-w-lg mb-2">
              Subscribe to our Rental Management System for just <span className="font-bold text-white">KES 1,199/month per property</span>.
            </p>
            <p className="text-yellow-300 text-sm font-semibold">
              🎁 Get 1 MONTH FREE on your first subscription!
            </p>
          </div>
          
          <a 
            href="https://keja-zetu-rentals.vercel.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center bg-white text-indigo-700 font-bold py-3 px-6 rounded-xl shadow-lg hover:bg-indigo-50 transition-all transform hover:scale-105 mt-4 md:mt-0"
          >
            Subscribe Now
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>
        </div>
      </div>
      {/* --- END ADVERT BANNER --- */}

      {/* Actions */}
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

      {/* Stats */}
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

      {/* Properties Grid */}
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
                       <button onClick={() => handleDelete(p)} className="text-xs font-semibold text-red-600 hover:bg-red-50 px-2 py-1 rounded">Delete</button>
                     </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <EditPropertyModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        property={selectedProperty}
        onSave={handleSave}
      />
    </div>
  );
}