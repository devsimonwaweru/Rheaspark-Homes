// src/pages/LandlordProperties.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useOutletContext } from 'react-router-dom';
import EditPropertyModal from '../components/EditPropertyModal';

export default function LandlordProperties() {
  const { openAddPropertyModal } = useOutletContext();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState({ isOpen: false, property: null });

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

  const handleToggleStatus = async (property) => {
    const newStatus = property.status === 'active' ? 'inactive' : 'active';
    await supabase.from('properties').update({ status: newStatus }).eq('id', property.id);
    fetchProperties();
  };

  const handleDelete = async (id) => {
    if(window.confirm("Delete this property?")) {
      await supabase.from('properties').delete().eq('id', id);
      fetchProperties();
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Properties</h1>
          <p className="text-gray-500 text-sm">Manage your rental listings</p>
        </div>
        <button onClick={openAddPropertyModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700">
          + Add New
        </button>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full hidden md:table">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Property</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Price</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {properties.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded bg-gray-200 overflow-hidden mr-3">
                         {p.image_url && <img src={p.image_url} className="w-full h-full object-cover" alt="" />}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{p.title}</p>
                        <p className="text-xs text-gray-500">{p.location}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">{p.type}</td>
                  <td className="py-4 px-6 text-sm font-semibold text-blue-600">KES {p.price?.toLocaleString()}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 text-xs rounded-full font-semibold ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <button onClick={() => setEditModal({ isOpen: true, property: p })} className="text-blue-600 hover:underline text-sm font-medium">Edit</button>
                    <button onClick={() => handleToggleStatus(p)} className="text-yellow-600 hover:underline text-sm font-medium">{p.status === 'active' ? 'Deactivate' : 'Activate'}</button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:underline text-sm font-medium">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Mobile Cards */}
          <div className="md:hidden space-y-4 p-4">
             {properties.map(p => (
               <div key={p.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                 <div className="flex justify-between mb-2">
                   <h3 className="font-bold text-gray-800">{p.title}</h3>
                   <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{p.status}</span>
                 </div>
                 <p className="text-sm text-gray-500 mb-3">{p.location}</p>
                 <div className="flex space-x-2 border-t pt-3 border-gray-200">
                   <button onClick={() => setEditModal({ isOpen: true, property: p })} className="flex-1 bg-white border text-xs font-semibold py-2 rounded-lg">Edit</button>
                   <button onClick={() => handleDelete(p.id)} className="flex-1 bg-red-50 text-red-600 text-xs font-semibold py-2 rounded-lg">Delete</button>
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