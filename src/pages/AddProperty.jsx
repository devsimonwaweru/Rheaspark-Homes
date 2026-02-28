import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, useSearchParams } from 'react-router-dom';

const POST_FEE = 35;

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isPaid) {
      localStorage.setItem('pending_property_data', JSON.stringify({ formData, amenities }));
      navigate(`/payment?type=post_property&price=${POST_FEE}`);
      return;
    }

    if (!imageFile) {
        alert("Please select an image to finish publishing.");
        return;
    }

    setLoading(true);
    try {
      // 1. Upload Image
      const fileName = `prop-${Date.now()}-${imageFile.name.replace(/\s/g, '-')}`;
      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(fileName, imageFile);
      
      if (uploadError) {
          console.error("Upload Error:", uploadError);
          throw new Error("Image upload failed: " + uploadError.message);
      }

      // 2. Get URL
      const { data: urlData } = supabase.storage
        .from('property-images')
        .getPublicUrl(fileName);

      // 3. Insert Property (No user ID needed)
      const { error: insertError } = await supabase.from('properties').insert({
        title: formData.title,
        price: parseFloat(formData.price),
        location: formData.location,
        type: formData.type,
        landlord_name: formData.landlord_name,
        landlord_phone: formData.landlord_phone,
        // landlord_id is omitted (anonymous)
        image_url: urlData.publicUrl,
        images: [urlData.publicUrl],
        amenities: amenities,
        status: 'active'
      });

      if (insertError) {
          console.error("Database Insert Error:", insertError);
          throw insertError;
      }

      alert('Property is now live!');
      navigate('/find-houses');

    } catch (err) {
      console.error("Caught Error:", err);
      alert('Failed to post property: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Add New Property</h1>
      <p className="text-gray-500 mb-6">Fee: KES {POST_FEE} per post.</p>

      {isPaid && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl mb-6">
          <p className="font-bold">✅ Payment Successful!</p>
          <p className="text-sm">Your details are restored. Please select image and click "Publish Now".</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg border space-y-6">
        
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

        {/* Amenities */}
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