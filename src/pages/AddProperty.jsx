// src/pages/AddProperty.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, useSearchParams } from 'react-router-dom';

const POST_FEE = 50; // KES for landlord posting

export default function AddProperty() {
  const [formData, setFormData] = useState({
    title: '', price: '', location: '', type: 'Single Room',
    landlord_name: '', landlord_phone: ''
  });
  const [amenities, setAmenities] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const amenityOptions = [
    'Water', 'Electricity', 'WiFi', 'Parking', 'Security', 
    'Garbage Collection', 'Backup Generator', 'Furnished'
  ];

  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const storedData = localStorage.getItem('pending_property_data');

    if (paymentStatus === 'success' && storedData) {
      setIsPaid(true);
      const parsedData = JSON.parse(storedData);
      setFormData(parsedData.formData);
      setAmenities(parsedData.amenities || []);
      localStorage.removeItem('pending_property_data');

      // Auto-publish property after payment
      if (parsedData.imageFile) {
        setImageFile(parsedData.imageFile);
      }
      if (parsedData.autoPublish) {
        handleSubmitAuto(parsedData.formData, parsedData.amenities, parsedData.imageFile);
      }
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleAmenity = (amenity) => {
    if (amenities.includes(amenity)) {
      setAmenities(amenities.filter(a => a !== amenity));
    } else {
      setAmenities([...amenities, amenity]);
    }
  };

  // AUTO-PUBLISH after payment
  const handleSubmitAuto = async (formData, amenities, imageFile) => {
    if (!imageFile) return;
    setLoading(true);
    try {
      const fileName = `prop-${Date.now()}-${imageFile.name.replace(/\s/g, '-')}`;
      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('property-images')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase.from('properties').insert({
        title: formData.title,
        price: parseFloat(formData.price),
        location: formData.location,
        type: formData.type,
        landlord_name: formData.landlord_name,
        landlord_phone: formData.landlord_phone,
        image_url: urlData.publicUrl,
        images: [urlData.publicUrl],
        amenities: amenities,
        status: 'active'
      });

      if (insertError) throw insertError;

      alert('✅ Property Posted Successfully!');
      navigate('/find-houses');

    } catch (err) {
      console.error('Publish Error:', err);
      alert('Failed to post property: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isPaid) {
      // Save property data for post-payment publishing
      localStorage.setItem('pending_property_data', JSON.stringify({
        formData, amenities, imageFile, autoPublish: true
      }));

      // Redirect to payment page
      navigate(`/payment?type=post_property&amount=${POST_FEE}`);
      return;
    }

    // If already paid, manually publish
    handleSubmitAuto(formData, amenities, imageFile);
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Add New Property</h1>
      <p className="text-gray-500 mb-6">Fee: KES {POST_FEE} per post.</p>

      {isPaid && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl mb-6">
          <p className="font-bold">✅ Payment Successful!</p>
          <p className="text-sm">Your details are restored. Select image and click "Publish Now".</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg border space-y-6">
        {/* Form fields same as before */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold mb-2">Property Title</label>
            <input name="title" value={formData.title} onChange={handleChange} className="w-full border p-3 rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Price (KES)</label>
            <input name="price" type="number" value={formData.price} onChange={handleChange} className="w-full border p-3 rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Property Type</label>
            <select name="type" value={formData.type} onChange={handleChange} className="w-full border p-3 rounded-lg bg-white">
              <option>Single Room</option>
              <option>Bedsitter</option>
              <option>1 Bedroom</option>
              <option>2 Bedroom</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Location</label>
          <input name="location" value={formData.location} onChange={handleChange} className="w-full border p-3 rounded-lg" required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold mb-2">Landlord Name</label>
            <input name="landlord_name" value={formData.landlord_name} onChange={handleChange} className="w-full border p-3 rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Landlord Phone</label>
            <input name="landlord_phone" value={formData.landlord_phone} onChange={handleChange} className="w-full border p-3 rounded-lg" required />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Amenities</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {amenityOptions.map((amenity) => (
              <button
                key={amenity}
                type="button"
                onClick={() => toggleAmenity(amenity)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  amenities.includes(amenity)
                    ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {amenity}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Property Image</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={(e) => setImageFile(e.target.files[0])} 
            className="w-full text-gray-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full font-bold py-3 px-6 rounded-xl transition shadow-lg ${
            isPaid 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {loading 
            ? 'Processing...' 
            : isPaid 
              ? 'Publish Property Now' 
              : `Pay KES ${POST_FEE} to Post`
          }
        </button>
      </form>
    </div>
  );
}