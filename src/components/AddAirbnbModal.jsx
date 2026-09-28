import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AddAirbnbModal({ isOpen, onClose, onSuccess }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    name: '', location: '', county: '', constituency: '',
    description: '', house_rules: '',
    max_guests: 1, bedrooms: 1, beds: 1, bathrooms: 1,
    amenities: '', // Comma separated for simple input
    price_per_night: '', cleaning_fee: 0, min_nights: 1,
    check_in_time: '2:00 PM', check_out_time: '10:00 AM',
    image_url: '', photos: '' // Comma separated for simple input
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in.');

      // Format arrays from comma-separated strings
      const photosArray = form.photos ? form.photos.split(',').map(url => url.trim()).filter(Boolean) : [];
      const amenitiesArray = form.amenities ? form.amenities.split(',').map(item => item.trim()).filter(Boolean) : [];

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
        image_url: form.image_url,
        photos: photosArray,
        status: 'active' // or 'draft'
      };

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
              <label className="block text-sm font-medium text-gray-700 mb-1">Main Image URL</label>
              <input type="url" name="image_url" value={form.image_url} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">More Photos <span className="text-gray-400 font-normal">(comma separated URLs)</span></label>
              <input type="text" name="photos" value={form.photos} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://...jpg, https://...jpg" />
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
              {saving ? 'Saving...' : 'Publish Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}