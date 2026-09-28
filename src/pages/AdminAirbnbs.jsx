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
    const newStatus = !airbnb.featured; // It's a boolean in this table

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

  if (loading) return <div className="p-6">Loading Airbnbs...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Airbnb Management</h1>
        <p className="text-gray-600">Manage short-stay listings, pricing, and availability.</p>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Listing</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price/Night</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guests</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Featured</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {airbnbs.map((airbnb) => (
                <tr key={airbnb.id} className="hover:bg-gray-50">
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
              ))}
              
              {airbnbs.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500">No Airbnb listings found. Convert a property or have a host list one!</td>
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