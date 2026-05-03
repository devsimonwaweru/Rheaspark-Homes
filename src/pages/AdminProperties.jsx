/* eslint-disable no-undef */
// src/pages/AdminProperties.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

// Helper Component for Form Inputs
const Input = ({ label, name, value, onChange, type = "text", placeholder, required, color = "blue" }) => {
  const colorClasses = {
    blue: "border-blue-200 focus:border-blue-500 focus:ring-blue-100",
    green: "border-emerald-200 focus:border-emerald-500 focus:ring-emerald-100",
    gray: "border-gray-200 focus:border-gray-500 focus:ring-gray-100",
  }[color];

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        name={name}
        type={type}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full bg-white border-2 ${colorClasses} rounded-xl p-3 text-gray-800 transition-all outline-none focus:ring-2 text-sm`}
        required={required}
      />
    </div>
  );
};

const AdminProperties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({});
  const [amenities, setAmenities] = useState([]);

  const amenityOptions = [
    "Pet Friendly", "Balcony", "Swimming Pool", "Gym Access", 
    "24/7 Security", "WiFi Included", "Water 24/7", "Furnished",
    "Parking", "Backup Generator"
  ];

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

  // --- DELETE LOGIC ---
  const handleDelete = async (property) => {
    // Step 1: Initial Confirmation
    const confirmProp = window.confirm(`Are you sure you want to delete "${property.title}"?`);
    if (!confirmProp) return;

    try {
      // Step 2: Check for unlocks (Foreign Key constraint handling)
      // We ask the user specifically about unlocks as requested
      const confirmUnlockDelete = window.confirm(
        "This property might have associated unlock records (users who paid for contacts).\n\nDo you want to delete the property AND all associated unlock records?\n\n(Click 'Cancel' to stop deletion if you want to keep unlock history)."
      );

      if (confirmUnlockDelete) {
        // User agreed to delete unlocks too
        // Assuming the table name for unlocks is 'unlocks'. 
        // If it's named differently in your DB, change 'unlocks' below.
        await supabase.from('unlocks').delete().eq('property_id', property.id);
      } else {
        // User cancelled the process
        alert("Deletion cancelled.");
        return;
      }

      // Step 3: Delete the property
      const { error } = await supabase.from('properties').delete().eq('id', property.id);
      if (error) throw error;
      
      setProperties(properties.filter(p => p.id !== property.id));
    } catch (error) {
      console.error("Error deleting property:", error.message);
      alert("Failed to delete property: " + error.message);
    }
  };

  // --- EDIT LOGIC ---
  const openEditModal = (property) => {
    setEditingProperty(property);
    setActiveTab('basic');
    
    // Populate Form Data with all fields
    setFormData({
      title: property.title,
      type: property.type,
      description: property.description || '',
      status: property.status,
      location: property.location,
      latitude: property.latitude || '',
      longitude: property.longitude || '',
      size: property.size || '',
      bedrooms: property.bedrooms || 0,
      bathrooms: property.bathrooms || 0,
      parking: property.parking || 'None',
      price: property.price,
      security_deposit: property.security_deposit || 0,
      availability_date: property.availability_date || '',
      issues: property.issues || '',
      solutions: property.solutions || '',
      landlord_name: property.landlord_name || '',
      landlord_phone: property.landlord_phone || '',
      landlord_email: property.landlord_email || '',
    });

    // Handle Amenities array
    try {
      const parsedAmenities = typeof property.amenities === 'string' 
        ? JSON.parse(property.amenities) 
        : (property.amenities || []);
      setAmenities(parsedAmenities);
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      setAmenities([]);
    }

    setIsEditModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleAmenity = (amenity) => {
    if (amenities.includes(amenity)) {
      setAmenities(amenities.filter((a) => a !== amenity));
    } else {
      setAmenities([...amenities, amenity]);
    }
  };

  // GPS Location Getter
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
      },
      () => alert("Unable to retrieve location.")
    );
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        ...formData,
        amenities: amenities,
        price: parseFloat(formData.price),
        security_deposit: parseFloat(formData.security_deposit || 0),
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      };

      const { error } = await supabase
        .from('properties')
        .update(updateData)
        .eq('id', editingProperty.id);

      if (error) throw error;
      
      setProperties(properties.map(p => p.id === editingProperty.id ? { ...p, ...updateData } : p));
      setIsEditModalOpen(false);
      alert("Property updated successfully!");
    } catch (error) {
      console.error("Error updating property:", error.message);
      alert("Failed to update property: " + error.message);
    }
  };

  if (loading) return <div className="p-6">Loading properties...</div>;

  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'location', label: 'Location & GPS' },
    { id: 'features', label: 'Features' },
    { id: 'financials', label: 'Financials' },
    { id: 'landlord', label: 'Landlord' },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Properties Management</h1>
        <p className="text-gray-600">Manage all listed rental properties, edit details, and handle GPS locations.</p>
      </div>

      {/* Properties Table */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <div className="overflow-x-auto">
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
                <tr key={prop.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-gray-100 mr-3 overflow-hidden flex items-center justify-center">
                         {prop.image_url ? (
                           <img src={prop.image_url} className="w-full h-full object-cover" alt="" />
                         ) : (
                           <i className="fas fa-home text-gray-400"></i>
                         )}
                      </div>
                      <div>
                         <div className="font-medium text-gray-900">{prop.title}</div>
                         <div className="text-xs text-gray-500">{prop.type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{prop.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#2FA4E7]">
                    KES {prop.price?.toLocaleString() || '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full capitalize font-medium ${prop.status === 'active' ? 'bg-green-100 text-green-700' : prop.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                      {prop.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button 
                      onClick={() => openEditModal(prop)}
                      className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(prop)}
                      className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-lg border border-red-100"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {properties.length === 0 && <div className="text-center py-10 text-gray-500">No properties found.</div>}
        </div>
      </div>

      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden my-8">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Edit Property: {editingProperty?.title}</h2>
                <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              {/* Tabs */}
              <div className="mt-4 flex space-x-2 border-b border-gray-200 overflow-x-auto">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-blue-600 border border-b-white border-gray-200 -mb-px' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-6">
              
              {/* TAB: BASIC INFO */}
              {activeTab === 'basic' && (
                <div className="space-y-4 animate-fade-in">
                  <Input label="Property Title" name="title" value={formData.title} onChange={handleInputChange} required />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select name="type" value={formData.type} onChange={handleInputChange} className="w-full bg-white border-2 border-gray-200 rounded-xl p-3 text-sm">
                        <option>Apartment</option>
                        <option>House</option>
                        <option>Studio</option>
                        <option>Bedsitter</option>
                        <option>Single Room</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select name="status" value={formData.status} onChange={handleInputChange} className="w-full bg-white border-2 border-gray-200 rounded-xl p-3 text-sm">
                        <option value="active">Active (Visible on FindHouses)</option>
                        <option value="inactive">Inactive (Hidden)</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" className="w-full bg-white border-2 border-gray-200 rounded-xl p-3 text-sm resize-none" />
                  </div>
                </div>
              )}

              {/* TAB: LOCATION & GPS */}
              {activeTab === 'location' && (
                <div className="space-y-4 animate-fade-in">
                  <Input label="Location / Area" name="location" value={formData.location} onChange={handleInputChange} placeholder="e.g. Kilimani" />
                  
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-blue-800 text-sm">GPS Coordinates</h4>
                      <button type="button" onClick={handleGetLocation} className="flex items-center space-x-1 text-xs bg-white px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-100">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <span>Get Current Location</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Latitude" name="latitude" value={formData.latitude} onChange={handleInputChange} placeholder="e.g. -1.2921" />
                      <Input label="Longitude" name="longitude" value={formData.longitude} onChange={handleInputChange} placeholder="e.g. 36.8219" />
                    </div>
                    <p className="text-xs text-blue-600 mt-2">Manually enter coordinates or click the button to auto-fill.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Size (sqft)" name="size" value={formData.size} onChange={handleInputChange} />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Parking</label>
                      <select name="parking" value={formData.parking} onChange={handleInputChange} className="w-full bg-white border-2 border-gray-200 rounded-xl p-3 text-sm">
                        <option>None</option>
                        <option>Shared</option>
                        <option>1 Dedicated</option>
                        <option>2+</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: FEATURES */}
              {activeTab === 'features' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Bedrooms" name="bedrooms" type="number" value={formData.bedrooms} onChange={handleInputChange} />
                    <Input label="Bathrooms" name="bathrooms" type="number" value={formData.bathrooms} onChange={handleInputChange} />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
                    <div className="flex flex-wrap gap-2">
                      {amenityOptions.map((option) => (
                        <button type="button" key={option} onClick={() => toggleAmenity(option)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${amenities.includes(option) ? "bg-blue-50 border-blue-500 text-blue-700" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: FINANCIALS */}
              {activeTab === 'financials' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 space-y-3">
                    <h4 className="font-semibold text-yellow-800 text-sm flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      Honest Disclosure
                    </h4>
                    <Input label="Known Issues" name="issues" value={formData.issues} onChange={handleInputChange} placeholder="e.g. Water cuts" />
                    <Input label="Solutions/Mitigation" name="solutions" value={formData.solutions} onChange={handleInputChange} placeholder="e.g. Borehole available" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Rent (KES)" name="price" type="number" value={formData.price} onChange={handleInputChange} required />
                    <Input label="Deposit (KES)" name="security_deposit" type="number" value={formData.security_deposit} onChange={handleInputChange} />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Availability Date</label>
                    <input name="availability_date" type="date" value={formData.availability_date} onChange={handleInputChange} className="w-full bg-white border-2 border-gray-200 rounded-xl p-3 text-sm" />
                  </div>
                </div>
              )}

              {/* TAB: LANDLORD */}
              {activeTab === 'landlord' && (
                <div className="space-y-4 animate-fade-in">
                  <Input label="Landlord Name" name="landlord_name" value={formData.landlord_name} onChange={handleInputChange} />
                  <Input label="Phone Number" name="landlord_phone" type="tel" value={formData.landlord_phone} onChange={handleInputChange} />
                  <Input label="Email" name="landlord_email" type="email" value={formData.landlord_email} onChange={handleInputChange} />
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm shadow-sm">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProperties;