/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

// --- 1. Move Components OUTSIDE to prevent re-creation on render ---

const Input = ({ label, name, value, onChange, type = "text", placeholder, required, color = "blue" }) => {
  const colorClasses = {
    blue: "border-blue-200 focus:border-blue-500 focus:ring-blue-100",
    green: "border-emerald-200 focus:border-emerald-500 focus:ring-emerald-100",
    gray: "border-gray-200 focus:border-gray-500 focus:ring-gray-100",
  }[color];

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <input
        name={name}
        type={type}
        value={value} // Controlled by prop
        onChange={onChange} // Controlled by prop
        placeholder={placeholder}
        className={`w-full bg-white border-2 ${colorClasses} rounded-xl p-3.5 text-gray-800 transition-all outline-none focus:ring-2`}
        required={required}
      />
    </div>
  );
};

const Select = ({ label, name, value, onChange, options, color = "blue" }) => {
  const colorClasses = {
    blue: "border-blue-200 focus:border-blue-500 focus:ring-blue-100",
    green: "border-emerald-200 focus:border-emerald-500 focus:ring-emerald-100",
    gray: "border-gray-200 focus:border-gray-500 focus:ring-gray-100",
  }[color];

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <select
        name={name}
        value={value} // Controlled by prop
        onChange={onChange} // Controlled by prop
        className={`w-full bg-white border-2 ${colorClasses} rounded-xl p-3.5 text-gray-800 transition-all outline-none focus:ring-2 appearance-none cursor-pointer`}
      >
        {options.map(opt => <option key={opt}>{opt}</option>)}
      </select>
    </div>
  );
};

// --- 2. Main Modal Component ---

export default function AddPropertyModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); 
  
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [formData, setFormData] = useState({
    title: "", type: "Apartment", description: "",
    price: "", location: "", bedrooms: "0", bathrooms: "0", size: "",
    parking: "None", security_deposit: "", availability_date: "",
    issues: "", solutions: "",
    landlord_name: "", landlord_phone: "", landlord_email: "",
  });

  const [amenities, setAmenities] = useState([]);

  const amenityOptions = [
    "Pet Friendly", "Balcony", "Swimming Pool", "Gym Access", 
    "24/7 Security", "WiFi Included", "Water 24/7", "Furnished",
    "Parking", "Backup Generator"
  ];

  useEffect(() => {
    if (!imageFile) { setPreviewUrl(null); return; }
    const objectUrl = URL.createObjectURL(imageFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  // Standard handler works fine now
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleAmenity = (amenity) => {
    if (amenities.includes(amenity)) {
      setAmenities(amenities.filter((a) => a !== amenity));
    } else {
      setAmenities([...amenities, amenity]);
    }
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    if (!imageFile) return alert("Please upload a property image");
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Upload Image
      const fileName = `prop-${Date.now()}-${imageFile.name.replace(/\s/g, "-")}`;
      const { error: uploadError } = await supabase.storage
        .from("property-images")
        .upload(fileName, imageFile);
      
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("property-images")
        .getPublicUrl(fileName);

      // 2. Insert Property
      // Changed status to 'active' since posting is free for subscribed landlords
      const { error: insertError } = await supabase
        .from("properties")
        .insert({
          ...formData,
          landlord_id: user.id,
          price: parseFloat(formData.price),
          security_deposit: parseFloat(formData.security_deposit || 0),
          bedrooms: parseInt(formData.bedrooms),
          bathrooms: parseInt(formData.bathrooms),
          image_url: urlData.publicUrl,
          images: [urlData.publicUrl],
          amenities: amenities,
          status: "active", 
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // 3. Close Modal (No Payment Redirect)
      onClose();

    } catch (err) {
      console.error("Error:", err);
      alert("Failed to create property: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const renderStepContent = () => {
    switch(step) {
      case 1: // Basic Info
        return (
          <div className="space-y-5 animate-fade-in">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Let's start with the basics</h3>
            <Input 
              label="Property Title" 
              name="title" 
              value={formData.title} 
              onChange={handleChange} 
              placeholder="e.g. Modern Studio near CBD" 
              required 
            />
            <Select 
              label="Property Type" 
              name="type" 
              value={formData.type} 
              onChange={handleChange} 
              options={["Apartment", "House", "Studio", "Bedsitter", "Single Room"]} 
            />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                rows="3" 
                className="w-full bg-white border-2 border-blue-200 focus:border-blue-500 focus:ring-blue-100 rounded-xl p-3.5 text-gray-800 transition-all outline-none focus:ring-2 resize-none"
                placeholder="Describe the unique features..."
              ></textarea>
            </div>
          </div>
        );
      
      case 2: // Location & Specs
        return (
          <div className="space-y-5 animate-fade-in">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Location & Specifications</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input label="Location / Area" name="location" value={formData.location} onChange={handleChange} placeholder="Kilimani" required color="green" />
              <Input label="Size (sqft)" name="size" value={formData.size} onChange={handleChange} placeholder="1200" color="green" />
              <Input label="Bedrooms" name="bedrooms" type="number" value={formData.bedrooms} onChange={handleChange} color="green" />
              <Input label="Bathrooms" name="bathrooms" type="number" value={formData.bathrooms} onChange={handleChange} color="green" />
              <Select label="Parking" name="parking" value={formData.parking} onChange={handleChange} options={["None", "Shared", "1 Dedicated", "2+"]} color="green" />
            </div>
            
            <div className="pt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Amenities</label>
              <div className="flex flex-wrap gap-2">
                {amenityOptions.map((option) => (
                  <button
                    type="button"
                    key={option}
                    onClick={() => toggleAmenity(option)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
                      amenities.includes(option)
                        ? "bg-green-50 border-green-500 text-green-700 shadow-sm"
                        : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 3: // Financials
        return (
          <div className="space-y-5 animate-fade-in">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Financials & Honesty</h3>
            
            <div className="bg-yellow-50 p-5 rounded-xl border-2 border-yellow-100 space-y-4">
              <h4 className="font-semibold text-yellow-800 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                Honest Disclosure
              </h4>
              <Input label="Known Issues" name="issues" value={formData.issues} onChange={handleChange} placeholder="e.g. Water cuts" color="gray" />
              <Input label="Solutions/Mitigation" name="solutions" value={formData.solutions} onChange={handleChange} placeholder="e.g. Borehole available" color="gray" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <Input label="Rent (KES)" name="price" type="number" value={formData.price} onChange={handleChange} required />
              <Input label="Deposit (KES)" name="security_deposit" type="number" value={formData.security_deposit} onChange={handleChange} />
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Availability</label>
                <input 
                  name="availability_date" 
                  type="date" 
                  value={formData.availability_date} 
                  onChange={handleChange}
                  className="w-full bg-white border-2 border-blue-200 focus:border-blue-500 focus:ring-blue-100 rounded-xl p-3.5 text-gray-800 transition-all outline-none focus:ring-2"
                />
              </div>
            </div>
          </div>
        );

      case 4: // Media & Submit
        return (
          <div className="space-y-5 animate-fade-in">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Final Touches</h3>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cover Photo *</label>
              <div className="border-2 border-dashed border-blue-300 rounded-xl p-4 hover:border-blue-500 transition-colors bg-blue-50/50 h-40 flex items-center justify-center relative overflow-hidden">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-blue-400">
                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <p className="text-sm font-medium">Click to upload image</p>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-4 border-t border-gray-100">
              <Input label="Your Name" name="landlord_name" value={formData.landlord_name} onChange={handleChange} required color="gray" />
              <Input label="Phone Number" name="landlord_phone" type="tel" value={formData.landlord_phone} onChange={handleChange} required color="gray" />
              <Input label="Email" name="landlord_email" type="email" value={formData.landlord_email} onChange={handleChange} color="gray" />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl relative flex flex-col max-h-[90vh] animate-scale-in">
        
        {/* Progress Bar Header */}
        <div className="p-6 bg-gradient-to-r from-blue-900 to-blue-800 rounded-t-3xl text-white">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">List Property</h2>
            <button onClick={onClose} className="text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          {/* Stepper Dots */}
          <div className="flex items-center justify-between relative px-4">
             <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/20 -translate-y-1/2"></div>
             {[1, 2, 3, 4].map((s) => (
               <div key={s} className="relative z-10 flex flex-col items-center">
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${step >= s ? 'bg-emerald-500 text-white' : 'bg-white/20 text-white/50'}`}>
                   {step > s ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> : s}
                 </div>
               </div>
             ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          {renderStepContent()}
        </div>

        {/* Navigation Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 rounded-b-3xl flex justify-between items-center">
          
          {step > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 font-semibold transition-colors px-4 py-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              <span>Back</span>
            </button>
          ) : <div></div>}

          {step < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              <span>Continue</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-bold py-3 px-8 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : (
                <>
                  <span>Post Property</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </>
              )}
            </button>
          )}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes scale-in {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fade-in {
          0% { opacity: 0; transform: translateX(10px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        .animate-scale-in { animation: scale-in 0.2s ease-out forwards; }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}