import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

// --- Sanity Configuration ---
const SANITY_PROJECT_ID = import.meta.env.VITE_SANITY_PROJECT_ID;
const SANITY_DATASET = import.meta.env.VITE_SANITY_DATASET || "production";
const SANITY_TOKEN = import.meta.env.VITE_SANITY_TOKEN || "";

export default function AddAirbnbModal({ isOpen, onClose, onSuccess }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);

  const [form, setForm] = useState({
    name: '', location: '', county: '', constituency: '',
    description: '', house_rules: '',
    max_guests: 1, bedrooms: 1, beds: 1, bathrooms: 1,
    amenities: '',
    price_per_night: '', cleaning_fee: 0, min_nights: 1,
    check_in_time: '2:00 PM', check_out_time: '10:00 AM',
    contact_whatsapp: '', contact_phone: ''
  });

  useEffect(() => {
    return () => {
      imageFiles.forEach(img => {
        if (img?.preview) URL.revokeObjectURL(img.preview);
      });
    };
  }, [imageFiles]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const currentCount = imageFiles.length;
    const availableSlots = 10 - currentCount;

    if (files.length > availableSlots) {
      alert(`Limit 10 images. You can add ${availableSlots} more.`);
    }

    const filesToAdd = files.slice(0, availableSlots);
    const newFilesWithPreview = filesToAdd.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    setImageFiles(prev => [...prev, ...newFilesWithPreview]);
    e.target.value = null;
  };

  const removeImage = (index) => {
    setImageFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index]?.preview) URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

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
    if (!response.ok) throw new Error("Image upload failed");
    const result = await response.json();
    return (result.document || result).url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (imageFiles.length === 0) {
      return alert("Please upload at least one image");
    }

    if (!form.contact_whatsapp) {
      return alert("Please enter your WhatsApp number so guests can book.");
    }

    setSaving(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in.');

      // 1. Upload Images to Sanity
      const uploadPromises = imageFiles.map((imgObj) => uploadToSanity(imgObj.file));
      const imageUrls = await Promise.all(uploadPromises);

      // 2. Format arrays from comma-separated strings
      const amenitiesArray = form.amenities ? form.amenities.split(',').map(item => item.trim()).filter(Boolean) : [];

      // 3. Clean phone numbers (digits only)
      const cleanWhatsapp = form.contact_whatsapp.replace(/\D/g, '');
      const cleanPhone = form.contact_phone ? form.contact_phone.replace(/\D/g, '') : '';

      // 4. Prepare Database Payload
      const payload = {
        host_id: user.id,
        name: form.name,
        location: form.location,
        county: form.county,
        constituency: form.constituency,
        description: form.description,
        house_rules: form.house_rules,
        max_guests: parseInt(form.max_guests) || 1,
        bedrooms: parseInt(form.bedrooms) || 1,
        beds: parseInt(form.beds) || 1,
        bathrooms: parseInt(form.bathrooms) || 1,
        amenities: amenitiesArray,
        price_per_night: parseFloat(form.price_per_night) || 0,
        cleaning_fee: parseFloat(form.cleaning_fee) || 0,
        min_nights: parseInt(form.min_nights) || 1,
        check_in_time: form.check_in_time,
        check_out_time: form.check_out_time,
        image_url: imageUrls[0] || '',
        photos: imageUrls,
        status: 'active',
        contact_info: {
          whatsapp: cleanWhatsapp,
          phone: cleanPhone || cleanWhatsapp
        }
      };

      // 5. Insert into Supabase
      const { error: insertError } = await supabase.from('airbnb_listings').insert(payload);
      if (insertError) throw insertError;

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-800">List a New Airbnb</h2>
          <p className="text-sm text-gray-500 mt-1">Fill out the details for your short-stay property.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200">{error}</div>}

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700 border-b pb-2">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Listing Name*</label>
                <input type="text" name="name" value={form.name} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Modern 2BR Apartment near CBD" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location/Address*</label>
                <input type="text" name="location" value={form.location} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Quiet Street, Meru" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">County</label>
                <input type="text" name="county" value={form.county} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Constituency</label>
                <input type="text" name="constituency" value={form.constituency} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.149-.197.297-.767.967-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
              </svg>
              Contact Information
            </h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
              <p className="text-xs text-green-700">
                Guests will use the <strong>Book Now</strong> button to contact you directly on WhatsApp. 
                Enter your number in international format without <code>+</code> (e.g. <code>254712345678</code>).
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number*</label>
                <input 
                  type="tel" 
                  name="contact_whatsapp" 
                  value={form.contact_whatsapp} 
                  onChange={handleChange} 
                  required 
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 outline-none" 
                  placeholder="254712345678" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alt Phone (optional)</label>
                <input 
                  type="tel" 
                  name="contact_phone" 
                  value={form.contact_phone} 
                  onChange={handleChange} 
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 outline-none" 
                  placeholder="254712345678" 
                />
              </div>
            </div>
          </div>

          {/* Specs */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700 border-b pb-2">Property Specs</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Guests</label>
                <input type="number" name="max_guests" value={form.max_guests} onChange={handleChange} min="1" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                <input type="number" name="bedrooms" value={form.bedrooms} onChange={handleChange} min="0" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beds</label>
                <input type="number" name="beds" value={form.beds} onChange={handleChange} min="0" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
                <input type="number" name="bathrooms" value={form.bathrooms} onChange={handleChange} min="0" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amenities <span className="text-gray-400 font-normal">(comma separated)</span></label>
              <input type="text" name="amenities" value={form.amenities} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. WiFi, Free Parking, Kitchen, Pool" />
            </div>
          </div>

          {/* Pricing & Timing */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700 border-b pb-2">Pricing & Timing</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price Per Night (KES)*</label>
                <input type="number" name="price_per_night" value={form.price_per_night} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cleaning Fee (KES)</label>
                <input type="number" name="cleaning_fee" value={form.cleaning_fee} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Nights</label>
                <input type="number" name="min_nights" value={form.min_nights} onChange={handleChange} min="1" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Time</label>
                <input type="text" name="check_in_time" value={form.check_in_time} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check-out Time</label>
                <input type="text" name="check_out_time" value={form.check_out_time} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
          </div>

          {/* Media & Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700 border-b pb-2">Media & Details</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Property Images (Max 10)</label>
              <div className="grid grid-cols-3 gap-3">
                {imageFiles.map((img, index) => (
                  <div key={index} className="relative aspect-square group">
                    <div className="w-full h-full border-2 border-blue-300 rounded-xl p-1 bg-blue-50/50 flex items-center justify-center overflow-hidden relative">
                      <img src={img.preview} alt={`Preview ${index}`} className="w-full h-full object-cover rounded-lg" />
                      <button 
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-20"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                ))}

                {imageFiles.length < 10 && (
                  <div className="relative aspect-square group">
                    <div className="w-full h-full border-2 border-dashed border-blue-300 rounded-xl p-1 hover:border-blue-500 transition-colors bg-blue-50/50 flex items-center justify-center overflow-hidden relative cursor-pointer">
                      <div className="text-center text-blue-400 pointer-events-none">
                        <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        <p className="text-xs font-medium">Add Photos</p>
                        <p className="text-[10px] text-gray-400">{10 - imageFiles.length} left</p>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple
                        onChange={handleImageChange} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea name="description" rows="3" value={form.description} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Describe the space, neighborhood, and unique features..."></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">House Rules</label>
              <textarea name="house_rules" rows="2" value={form.house_rules} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="No smoking, No pets, Quiet hours after 10 PM..."></textarea>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2">
              {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {saving ? 'Uploading & Saving...' : 'Publish Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}