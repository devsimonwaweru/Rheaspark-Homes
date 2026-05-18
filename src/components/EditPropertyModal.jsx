/* eslint-disable no-unused-vars */
// src/components/EditPropertyModal.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

// --- Sanity Configuration ---
const SANITY_PROJECT_ID = import.meta.env.VITE_SANITY_PROJECT_ID;
const SANITY_DATASET = import.meta.env.VITE_SANITY_DATASET || "production";
const SANITY_TOKEN = import.meta.env.VITE_SANITY_TOKEN || "";

const Input = ({ label, name, value, onChange, type = "text", placeholder }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>

    <input
      name={name}
      type={type}
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
    />
  </div>
);

export default function EditPropertyModal({
  isOpen,
  onClose,
  property,
  onSave
}) {

  const [activeTab, setActiveTab] = useState('basic');

  const [formData, setFormData] = useState({});

  const [amenities, setAmenities] = useState([]);

  // Images
  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  const [loading, setLoading] = useState(false);

  const amenityOptions = [
    "Pet Friendly",
    "Balcony",
    "Swimming Pool",
    "Gym Access",
    "24/7 Security",
    "WiFi Included",
    "Water 24/7",
    "Furnished",
    "Parking",
    "Backup Generator"
  ];

  // --------------------------------------
  // POPULATE FORM
  // --------------------------------------
  useEffect(() => {
    if (property) {

      setFormData({
        title: property.title || '',
        type: property.type || 'Apartment',
        description: property.description || '',
        status: property.status || 'inactive',
        location: property.location || '',
        latitude: property.latitude || '',
        longitude: property.longitude || '',
        size: property.size || '',
        bedrooms: property.bedrooms || 0,
        bathrooms: property.bathrooms || 0,
        parking: property.parking || 'None',
        price: property.price || 0,
        security_deposit: property.security_deposit || 0,
        availability_date: property.availability_date || '',
        issues: property.issues || '',
        solutions: property.solutions || '',
        landlord_name: property.landlord_name || '',
        landlord_phone: property.landlord_phone || '',
        landlord_email: property.landlord_email || '',
        featured: property.featured || false,
      });

      // Amenities
      try {
        const parsed =
          typeof property.amenities === 'string'
            ? JSON.parse(property.amenities)
            : (property.amenities || []);

        setAmenities(parsed);

      } catch (e) {
        setAmenities([]);
      }

      // Images
      try {

        const imgs =
          typeof property.images === 'string'
            ? JSON.parse(property.images)
            : (property.images || []);

        if (imgs.length === 0 && property.image_url) {
          setExistingImages([property.image_url]);
        } else {
          setExistingImages(imgs);
        }

      } catch (e) {

        if (property.image_url) {
          setExistingImages([property.image_url]);
        } else {
          setExistingImages([]);
        }
      }

      setNewFiles([]);
      setPreviews([]);
    }
  }, [property]);

  // --------------------------------------
  // HANDLE CHANGE
  // --------------------------------------
  const handleChange = (e) => {

    const { name, value, type, checked } = e.target;

    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // --------------------------------------
  // TOGGLE AMENITIES
  // --------------------------------------
  const toggleAmenity = (amenity) => {

    if (amenities.includes(amenity)) {
      setAmenities(amenities.filter(a => a !== amenity));
    } else {
      setAmenities([...amenities, amenity]);
    }
  };

  // --------------------------------------
  // GET LOCATION
  // --------------------------------------
  const handleGetLocation = () => {

    if (!navigator.geolocation) {
      return alert("GPS not supported");
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {

        setFormData(prev => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        }));

        alert("Location Captured!");

      },
      () => alert("Failed to get location")
    );
  };

  // --------------------------------------
  // IMAGE HANDLING
  // --------------------------------------
  const handleNewImageChange = (e) => {

    const files = Array.from(e.target.files);

    if (!files.length) return;

    const availableSlots =
      5 - (existingImages.length + newFiles.length);

    if (availableSlots <= 0) {
      return alert("Maximum 5 images allowed.");
    }

    const filesToAdd = files.slice(0, availableSlots);

    setNewFiles(prev => [...prev, ...filesToAdd]);

    const newPreviews = filesToAdd.map(file =>
      URL.createObjectURL(file)
    );

    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeExistingImage = (index) => {
    setExistingImages(prev =>
      prev.filter((_, i) => i !== index)
    );
  };

  const removeNewFile = (index) => {

    URL.revokeObjectURL(previews[index]);

    setNewFiles(prev =>
      prev.filter((_, i) => i !== index)
    );

    setPreviews(prev =>
      prev.filter((_, i) => i !== index)
    );
  };

  // --------------------------------------
  // SANITY UPLOAD
  // --------------------------------------
  const uploadToSanity = async (file) => {

    const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2021-06-07/assets/images/${SANITY_DATASET}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${SANITY_TOKEN}`,
        'Content-Type': file.type
      },
      body: file
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    const result = await response.json();

    return result.url;
  };

  // --------------------------------------
  // SUBMIT
  // --------------------------------------
  const handleSubmit = async (e) => {

    e.preventDefault();

    setLoading(true);

    try {

      // Upload new images
      const uploadPromises =
        newFiles.map(file => uploadToSanity(file));

      const newUrls = await Promise.all(uploadPromises);

      // Final images
      const finalImages = [
        ...existingImages,
        ...newUrls
      ];

      // Update data
      const updateData = {
        ...formData,

        featured: formData.featured || false,

        amenities: amenities,

        price: parseFloat(formData.price) || 0,

        bedrooms: parseInt(formData.bedrooms) || 0,

        bathrooms: parseInt(formData.bathrooms) || 0,

        latitude: formData.latitude
          ? parseFloat(formData.latitude)
          : null,

        longitude: formData.longitude
          ? parseFloat(formData.longitude)
          : null,

        images: JSON.stringify(finalImages),

        image_url: finalImages[0] || null,
      };

      const { error } = await supabase
        .from('properties')
        .update(updateData)
        .eq('id', property.id);

      if (error) throw error;

      onSave(updateData);

      onClose();

      alert("Property Updated!");

    } catch (err) {

      alert("Error: " + err.message);

    } finally {

      setLoading(false);
    }
  };

  // --------------------------------------
  // CLOSE
  // --------------------------------------
  if (!isOpen || !property) return null;

  const tabs = [
    'basic',
    'location',
    'media',
    'features',
    'financials',
    'landlord'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">

      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col relative">

        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl z-50"
        >
          &times;
        </button>

        {/* HEADER */}
        <div className="p-4 border-b bg-gray-50 sticky top-0 z-40 rounded-t-xl">

          <h2 className="text-lg font-bold text-gray-800 mb-3">
            Editing: {property.title}
          </h2>

          <div className="flex space-x-1 overflow-x-auto border-b -mb-4">

            {tabs.map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-4 py-2 text-sm font-medium capitalize whitespace-nowrap ${
                  activeTab === t
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'location'
                  ? 'Location/GPS'
                  : t}
              </button>
            ))}

          </div>
        </div>

        {/* BODY */}
        <form
          onSubmit={handleSubmit}
          className="p-6 flex-1 overflow-y-auto space-y-4"
        >

          {/* BASIC */}
          {activeTab === 'basic' && (
            <>

              <Input
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
              />

              <div className="grid grid-cols-2 gap-4">

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>

                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full border p-2 rounded bg-white text-sm"
                  >
                    <option>Apartment</option>
                    <option>House</option>
                    <option>Studio</option>
                    <option>Bedsitter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>

                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full border p-2 rounded bg-white text-sm"
                  >
                    <option value="active">
                      Active (Visible)
                    </option>

                    <option value="inactive">
                      Inactive (Hidden)
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full border p-2 rounded text-sm"
                />
              </div>
            </>
          )}

          {/* LOCATION */}
          {activeTab === 'location' && (
            <>

              <Input
                label="Location / Area"
                name="location"
                value={formData.location}
                onChange={handleChange}
              />

              <div className="bg-blue-50 p-4 rounded border border-blue-100">

                <div className="flex justify-between items-center mb-2">

                  <span className="font-semibold text-blue-800 text-sm">
                    GPS Coordinates
                  </span>

                  <button
                    type="button"
                    onClick={handleGetLocation}
                    className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  >
                    Get Current Location
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">

                  <Input
                    label="Latitude"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                  />

                  <Input
                    label="Longitude"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <Input
                label="Size (sqft)"
                name="size"
                value={formData.size}
                onChange={handleChange}
              />
            </>
          )}

          {/* MEDIA */}
          {activeTab === 'media' && (

            <div className="space-y-4">

              <p className="text-xs text-gray-500 mb-2">
                Total images allowed: 5.
                Existing: {existingImages.length}.
                New: {newFiles.length}.
              </p>

              <div className="grid grid-cols-3 gap-3">

                {/* Existing Images */}
                {existingImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative group aspect-square"
                  >

                    <img
                      src={img}
                      className="w-full h-full object-cover rounded-lg border"
                      alt=""
                    />

                    <button
                      type="button"
                      onClick={() => removeExistingImage(idx)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                    >
                      &times;
                    </button>
                  </div>
                ))}

                {/* NEW */}
                {previews.map((src, idx) => (
                  <div
                    key={`new-${idx}`}
                    className="relative group aspect-square"
                  >

                    <img
                      src={src}
                      className="w-full h-full object-cover rounded-lg border border-blue-400"
                      alt=""
                    />

                    <button
                      type="button"
                      onClick={() => removeNewFile(idx)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 text-xs"
                    >
                      &times;
                    </button>

                    <div className="absolute bottom-1 left-1 bg-blue-600 text-white text-[8px] px-1 rounded">
                      NEW
                    </div>
                  </div>
                ))}

                {/* ADD */}
                {(existingImages.length + newFiles.length) < 5 && (
                  <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">

                    <svg
                      className="w-6 h-6 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>

                    <span className="text-xs text-gray-400 mt-1">
                      Add
                    </span>

                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleNewImageChange}
                      className="hidden"
                    />
                  </label>
                )}

              </div>
            </div>
          )}

          {/* FEATURES */}
          {activeTab === 'features' && (
            <>

              <div className="grid grid-cols-2 gap-4">

                <Input
                  label="Bedrooms"
                  name="bedrooms"
                  type="number"
                  value={formData.bedrooms}
                  onChange={handleChange}
                />

                <Input
                  label="Bathrooms"
                  name="bathrooms"
                  type="number"
                  value={formData.bathrooms}
                  onChange={handleChange}
                />
              </div>

              {/* Amenities */}
              <div>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amenities
                </label>

                <div className="flex flex-wrap gap-2">

                  {amenityOptions.map(opt => (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => toggleAmenity(opt)}
                      className={`px-3 py-1 text-xs rounded border transition-all ${
                        amenities.includes(opt)
                          ? 'bg-blue-100 border-blue-600 text-blue-700'
                          : 'bg-white text-gray-600'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}

                </div>
              </div>

              {/* FEATURED */}
              <div className="mt-6 border rounded-xl p-4 bg-yellow-50 border-yellow-200">

                <div className="flex items-center justify-between">

                  <div>
                    <h3 className="font-semibold text-yellow-800">
                      Featured Property
                    </h3>

                    <p className="text-sm text-yellow-700 mt-1">
                      Featured properties appear first
                      on listings and homepage sections.
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">

                    <input
                      type="checkbox"
                      name="featured"
                      checked={formData.featured || false}
                      onChange={handleChange}
                      className="sr-only peer"
                    />

                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:bg-yellow-500 transition-all"></div>

                    <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-all peer-checked:translate-x-5"></div>

                  </label>
                </div>
              </div>
            </>
          )}

          {/* FINANCIALS */}
          {activeTab === 'financials' && (
            <>

              <div className="grid grid-cols-2 gap-4">

                <Input
                  label="Rent (KES)"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleChange}
                />

                <Input
                  label="Deposit (KES)"
                  name="security_deposit"
                  type="number"
                  value={formData.security_deposit}
                  onChange={handleChange}
                />
              </div>

              <Input
                label="Known Issues"
                name="issues"
                value={formData.issues}
                onChange={handleChange}
              />

              <Input
                label="Solutions"
                name="solutions"
                value={formData.solutions}
                onChange={handleChange}
              />
            </>
          )}

          {/* LANDLORD */}
          {activeTab === 'landlord' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <Input
                label="Name"
                name="landlord_name"
                value={formData.landlord_name}
                onChange={handleChange}
              />

              <Input
                label="Phone"
                name="landlord_phone"
                value={formData.landlord_phone}
                onChange={handleChange}
              />

              <Input
                label="Email"
                name="landlord_email"
                type="email"
                value={formData.landlord_email}
                onChange={handleChange}
              />
            </div>
          )}

        </form>

        {/* FOOTER */}
        <div className="p-4 border-t bg-gray-50 flex justify-end space-x-3 rounded-b-xl">

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-semibold disabled:opacity-50 flex items-center space-x-2"
          >

            {loading && (
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>

                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}

            <span>
              {loading ? 'Saving...' : 'Save Changes'}
            </span>

          </button>
        </div>

      </div>
    </div>
  );
}