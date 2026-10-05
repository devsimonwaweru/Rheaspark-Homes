import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function EditAirbnbModal({ isOpen, onClose, airbnb, onSave }) {
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (airbnb) {
      const contactInfo = airbnb.contact_info || {};
      setFormData({
        name: airbnb.name || '',
        location: airbnb.location || '',
        price_per_night: airbnb.price_per_night || 0,
        cleaning_fee: airbnb.cleaning_fee || 0,
        max_guests: airbnb.max_guests || 1,
        bedrooms: airbnb.bedrooms || 1,
        bathrooms: airbnb.bathrooms || 1,
        status: airbnb.status || 'active',
        description: airbnb.description || '',
        house_rules: airbnb.house_rules || '',
        contact_whatsapp: contactInfo.whatsapp || '',
        contact_phone: contactInfo.phone || ''
      });
    }
  }, [airbnb]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.contact_whatsapp) {
      setError('Please enter your WhatsApp number so guests can book.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const cleanWhatsapp = formData.contact_whatsapp.replace(/\D/g, '');
      const cleanPhone = formData.contact_phone ? formData.contact_phone.replace(/\D/g, '') : cleanWhatsapp;

      const { data, error: updateError } = await supabase
        .from('airbnb_listings')
        .update({
          name: formData.name,
          location: formData.location,
          price_per_night: parseFloat(formData.price_per_night) || 0,
          cleaning_fee: parseFloat(formData.cleaning_fee) || 0,
          max_guests: parseInt(formData.max_guests) || 1,
          bedrooms: parseInt(formData.bedrooms) || 1,
          bathrooms: parseInt(formData.bathrooms) || 1,
          status: formData.status,
          description: formData.description,
          house_rules: formData.house_rules,
          contact_info: {
            whatsapp: cleanWhatsapp,
            phone: cleanPhone
          }
        })
        .eq('id', airbnb.id)
        .select();

      if (updateError) throw updateError;

      if (onSave && data) onSave(data[0]);
      onClose();
      
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Edit Airbnb Listing</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm border border-red-200">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Listing Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input type="text" name="location" value={formData.location} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
          </div>

          {/* Contact Information */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.149-.197.297-.767.967-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
              </svg>
              <p className="text-sm font-semibold text-green-700">Booking Contact (WhatsApp)</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">WhatsApp Number*</label>
                <input 
                  type="tel" 
                  name="contact_whatsapp" 
                  value={formData.contact_whatsapp} 
                  onChange={handleChange} 
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none" 
                  placeholder="254712345678" 
                  required 
                />
                <p className="text-[10px] text-gray-400 mt-1">International format, no + (e.g. 254712345678)</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Alt Phone (optional)</label>
                <input 
                  type="tel" 
                  name="contact_phone" 
                  value={formData.contact_phone} 
                  onChange={handleChange} 
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none" 
                  placeholder="254712345678" 
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price / Night (KES)</label>
              <input type="number" name="price_per_night" value={formData.price_per_night} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cleaning Fee (KES)</label>
              <input type="number" name="cleaning_fee" value={formData.cleaning_fee} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" min="0" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Guests</label>
              <input type="number" name="max_guests" value={formData.max_guests} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" min="1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
              <input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
              <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" min="0" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select name="status" value={formData.status} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" rows="3" value={formData.description} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Describe the space, neighborhood, and unique features..."></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">House Rules</label>
            <textarea name="house_rules" rows="2" value={formData.house_rules} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-medium text-sm disabled:opacity-50 shadow-sm">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}