/* eslint-disable no-unused-vars */
// src/components/AddPropertyModal.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { counties, constituencies } from "../data/locations"; // Import fixed data

// --- Sanity Configuration ---
const SANITY_PROJECT_ID = import.meta.env.VITE_SANITY_PROJECT_ID;
const SANITY_DATASET = import.meta.env.VITE_SANITY_DATASET || "production";
const SANITY_TOKEN = import.meta.env.VITE_SANITY_TOKEN || "";

// --- Components ---

const Input = ({ label, name, value, onChange, type = "text", placeholder, required, color = "blue" }) => {
  const colorClasses = {
    blue: "border-blue-200 focus:border-blue-500 focus:ring-blue-100",
    green: "border-emerald-200 focus:border-emerald-500 focus:ring-emerald-100",
    gray: "border-gray-200 focus:border-gray-500 focus:ring-gray-100",
    purple: "border-purple-200 focus:border-purple-500 focus:ring-purple-100",
  }[color];

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full bg-white border-2 ${colorClasses} rounded-xl p-3.5 text-gray-800 transition-all outline-none focus:ring-2`}
        required={required}
      />
    </div>
  );
};

const Select = ({ label, name, value, onChange, options, color = "blue", disabled = false, placeholder = "Select..." }) => {
  const colorClasses = {
    blue: "border-blue-200 focus:border-blue-500 focus:ring-blue-100",
    green: "border-emerald-200 focus:border-emerald-500 focus:ring-emerald-100",
    gray: "border-gray-200 focus:border-gray-500 focus:ring-gray-100",
    purple: "border-purple-200 focus:border-purple-500 focus:ring-purple-100",
  }[color];

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full bg-white border-2 ${colorClasses} rounded-xl p-3.5 text-gray-800 transition-all outline-none focus:ring-2 appearance-none cursor-pointer ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
      >
        <option value="">{placeholder}</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
};

// --- Main Modal ---

export default function AddPropertyModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [gpsStatus, setGpsStatus] = useState("idle");
  
  const [imageFiles, setImageFiles] = useState([]);

  // New state for Smart Units
  const [enableUnits, setEnableUnits] = useState(false);
  const [unitInput, setUnitInput] = useState("");
  const [suggestion, setSuggestion] = useState(null);

  const [formData, setFormData] = useState({
    title: "", type: "Apartment", description: "",
    price: "", 
    county: "", constituency: "", town: "", landmark: "", location: "",
    bedrooms: "0", bathrooms: "0", size: "",
    parking: "None", security_deposit: "", availability_date: "",
    issues: "", solutions: "",
    landlord_name: "", landlord_phone: "", landlord_email: "",
    latitude: null, longitude: null,
  });

  // Dynamic options for constituency dropdown
  const [constituencyOptions, setConstituencyOptions] = useState([]);
  const [amenities, setAmenities] = useState([]);

  const amenityOptions = [
    "Pet Friendly", "Balcony", "Swimming Pool", "Gym Access", 
    "24/7 Security", "WiFi Included", "Water 24/7", "Furnished",
    "Parking", "Backup Generator"
  ];

  useEffect(() => {
    return () => {
      imageFiles.forEach(img => {
        if (img?.preview) URL.revokeObjectURL(img.preview);
      });
    };
  }, [imageFiles]);

  // --- Handlers ---

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handler: County Change -> Update Constituency List & Reset
  const handleCountyChange = (e) => {
    const selectedCounty = e.target.value;
    const constits = selectedCounty ? constituencies[selectedCounty] : [];
    
    setConstituencyOptions(constits);
    
    setFormData(prev => ({
      ...prev,
      county: selectedCounty,
      constituency: "", 
      town: "", 
      location: selectedCounty
    }));
  };

  // Handler: Constituency Change
  const handleConstituencyChange = (e) => {
    const selectedConstituency = e.target.value;
    
    setFormData(prev => ({
      ...prev,
      constituency: selectedConstituency,
      location: `${selectedConstituency}, ${prev.county}`
    }));
  };

  // Handler: Town/Area Input (Free Text)
  const handleTownChange = (e) => {
    const town = e.target.value;
    setFormData(prev => ({
      ...prev,
      town: town,
      location: `${town}, ${prev.constituency}, ${prev.county}`
    }));
  };

  // Handler: Landmark Input
  const handleLandmarkChange = (e) => {
    const landmark = e.target.value;
    setFormData(prev => ({
      ...prev,
      landmark: landmark,
      location: `${prev.town ? prev.town + ', ' : ''}${prev.constituency}, ${prev.county}${landmark ? ' (Near ' + landmark + ')' : ''}`
    }));
  };

  const toggleAmenity = (amenity) => {
    if (amenities.includes(amenity)) {
      setAmenities(amenities.filter((a) => a !== amenity));
    } else {
      setAmenities([...amenities, amenity]);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    setGpsStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
        setGpsStatus("success");
      },
      () => {
        setGpsStatus("error");
        alert("Unable to retrieve location.");
      }
    );
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

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  // --- SMART UNIT LOGIC ---

  const handleUnitChange = (e) => {
    const val = e.target.value;
    setUnitInput(val);
    analyzePattern(val);
  };

  const analyzePattern = (input) => {
    const lines = input.split('\n').filter(l => l.trim() !== '');
    if (lines.length < 2) {
      setSuggestion(null);
      return;
    }

    // Regex to find Prefix + Number (e.g., A1, Room 2, Block B-10)
    const regex = /^(.*?)(\d+)$/;
    const parsed = lines.map(line => {
      const match = line.trim().match(regex);
      if (match) {
        return {
          original: line.trim(),
          prefix: match[1], // "A" or "Room "
          number: parseInt(match[2]) // 1, 2, 10
        };
      }
      return null;
    }).filter(Boolean);

    // Do all lines match the pattern?
    if (parsed.length < 2) {
      setSuggestion(null);
      return;
    }

    const firstPrefix = parsed[0].prefix;
    const hasCommonPrefix = parsed.every(p => p.prefix === firstPrefix);

    if (hasCommonPrefix) {
      const maxNum = Math.max(...parsed.map(p => p.number));
      setSuggestion({
        prefix: firstPrefix,
        lastNumber: maxNum,
        message: `Pattern detected: "${firstPrefix}[Number]". Generate up to ${firstPrefix}${maxNum + 5}?`
      });
    } else {
      setSuggestion(null);
    }
  };

  const autoFillUnits = () => {
    if (!suggestion) return;
    const { prefix, lastNumber } = suggestion;
    const targetCount = lastNumber + 5; // Add 5 more
    
    let newLines = [...unitInput.split('\n')];
    for (let i = lastNumber + 1; i <= targetCount; i++) {
      newLines.push(`${prefix}${i}`);
    }
    setUnitInput(newLines.join('\n'));
    setSuggestion(null); // Hide suggestion after applying
  };

  // --- SUBMISSION ---

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
    if (!response.ok) throw new Error("Upload failed");
    const result = await response.json();
    return (result.document || result).url;
  };

  const handleSubmit = async () => {
    if (imageFiles.length === 0) return alert("Please upload at least one image");
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Upload Images
      const uploadPromises = imageFiles.map((imgObj) => uploadToSanity(imgObj.file));
      const imageUrls = await Promise.all(uploadPromises);

      // 2. Prepare Property Data
      const propertyData = {
        ...formData,
        landlord_id: user.id,
        price: parseFloat(formData.price),
        security_deposit: parseFloat(formData.security_deposit || 0),
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        image_url: imageUrls[0], 
        images: JSON.stringify(imageUrls), 
        amenities: amenities,
        status: "active",
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      };

      // 3. Insert Property
      const { data: newProperty, error: insertError } = await supabase
        .from("properties")
        .insert(propertyData)
        .select()
        .single();

      if (insertError) throw insertError;

      // 4. Insert Units (if enabled)
      if (enableUnits && unitInput.trim() !== '') {
        const lines = unitInput.split('\n').filter(l => l.trim() !== '');
        const unitsToInsert = lines.map(name => ({
          property_id: newProperty.id,
          unit_name: name.trim(),
          status: 'vacant'
        }));

        const { error: unitError } = await supabase
          .from('units')
          .insert(unitsToInsert);
        
        if (unitError) console.error("Failed to save units:", unitError.message);
      }

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
      case 1: 
        return (
          <div className="space-y-5 animate-fade-in">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Basics</h3>
            <Input label="Property Title" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Modern Studio" required />
            <Select label="Property Type" name="type" value={formData.type} onChange={handleChange} options={["Apartment", "House", "Studio", "Bedsitter", "Single Room"]} />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="w-full bg-white border-2 border-blue-200 focus:border-blue-500 focus:ring-blue-100 rounded-xl p-3.5 text-gray-800 transition-all outline-none focus:ring-2 resize-none" placeholder="Describe features..."></textarea>
            </div>
          </div>
        );
      
      case 2: 
        return (
          <div className="space-y-5 animate-fade-in">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Location Details</h3>
            
            {/* County & Constituency Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Select 
                label="County" 
                name="county" 
                value={formData.county} 
                onChange={handleCountyChange} 
                options={counties} 
                color="green" 
                placeholder="Select County"
              />
              
              <Select 
                label="Constituency" 
                name="constituency" 
                value={formData.constituency} 
                onChange={handleConstituencyChange} 
                options={constituencyOptions} 
                color="green" 
                disabled={!formData.county}
                placeholder="Select Constituency"
              />
            </div>

            {/* Town and Landmark are Free Text Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input 
                    label="Town / Area" 
                    name="town" 
                    value={formData.town} 
                    onChange={handleTownChange} 
                    placeholder="e.g. Kilimani, Runda" 
                    color="green"
                />
                <Input 
                    label="Landmark / Street" 
                    name="landmark" 
                    value={formData.landmark} 
                    onChange={handleLandmarkChange} 
                    placeholder="e.g. Near Yaya Centre" 
                    color="green" 
                />
            </div>

            {/* Location Preview */}
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-500 border border-dashed">
                <span className="font-medium text-gray-700">Full Address:</span> 
                {formData.location || 'Select location above'}
            </div>

            {/* Specs */}
            <div className="grid grid-cols-2 gap-5 pt-4 border-t">
                <Input label="Size (sqft)" name="size" value={formData.size} onChange={handleChange} placeholder="1200" color="green" />
                <Select label="Parking" name="parking" value={formData.parking} onChange={handleChange} options={["None", "Shared", "1 Dedicated", "2+"]} color="green" />
                <Input label="Bedrooms" name="bedrooms" type="number" value={formData.bedrooms} onChange={handleChange} color="green" />
                <Input label="Bathrooms" name="bathrooms" type="number" value={formData.bathrooms} onChange={handleChange} color="green" />
            </div>
            
            <div className="pt-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">GPS Location (Optional)</label>
              <button type="button" onClick={handleGetLocation} disabled={gpsStatus === "loading"} className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border-2 transition-all font-medium ${gpsStatus === "success" ? "bg-green-50 border-green-400 text-green-700" : "bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600"}`}>
                  {gpsStatus === "loading" ? (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  ) : gpsStatus === "success" ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  )}
                  <span>{gpsStatus === "loading" ? "Capturing..." : gpsStatus === "success" ? "Location Captured" : "Use Current Location"}</span>
              </button>
            </div>

            <div className="pt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Amenities</label>
              <div className="flex flex-wrap gap-2">
                {amenityOptions.map((option) => (
                  <button type="button" key={option} onClick={() => toggleAmenity(option)} className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${amenities.includes(option) ? "bg-green-50 border-green-500 text-green-700" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      // --- NEW STEP 3: SMART UNITS ---
      case 3:
        return (
          <div className="space-y-5 animate-fade-in">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-bold text-gray-800">Rental Units</h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={enableUnits} onChange={() => setEnableUnits(!enableUnits)} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-600">Multi-Unit / Rental Manager</span>
              </label>
            </div>

            {enableUnits ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">Enter unit names below. The system will auto-detect patterns.</p>
                
                <div className="relative">
                  <textarea 
                    rows={8}
                    value={unitInput}
                    onChange={handleUnitChange}
                    placeholder="Example:&#10;A1&#10;A2&#10;A3&#10;...or Room 1, Room 2"
                    className="w-full border-2 border-purple-200 focus:border-purple-500 focus:ring-purple-100 rounded-xl px-4 py-3 focus:ring-2 outline-none font-mono text-sm bg-purple-50/30"
                  />
                </div>

                {/* AI Suggestion Box */}
                {suggestion && (
                  <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl text-sm flex items-center justify-between animate-fade-in">
                    <div className="flex items-center text-indigo-700">
                      <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      <span>{suggestion.message}</span>
                    </div>
                    <button 
                      type="button"
                      onClick={autoFillUnits}
                      className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold ml-4 whitespace-nowrap hover:bg-indigo-700"
                    >
                      Auto-fill
                    </button>
                  </div>
                )}

                {unitInput.length > 0 && (
                   <div className="text-xs text-gray-400 text-right">
                     {unitInput.split('\n').filter(l => l.trim()).length} units detected
                   </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                <p className="text-gray-500 text-sm">This is a single unit property (e.g. House).</p>
                <p className="text-gray-400 text-xs mt-1">Enable toggle above if this property has multiple rental units.</p>
              </div>
            )}
          </div>
        );

      case 4: 
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
                <input name="availability_date" type="date" value={formData.availability_date} onChange={handleChange} className="w-full bg-white border-2 border-blue-200 focus:border-blue-500 focus:ring-blue-100 rounded-xl p-3.5 text-gray-800 transition-all outline-none focus:ring-2" />
              </div>
            </div>
          </div>
        );

      case 5: 
        return (
          <div className="space-y-5 animate-fade-in">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Media (Max 10 Images)</h3>
            
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-4 border-t border-gray-100 mt-6">
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
        
        <div className="p-6 bg-gradient-to-r from-blue-900 to-blue-800 rounded-t-3xl text-white">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">List Property</h2>
            <button onClick={onClose} className="text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex items-center justify-between relative px-4">
             <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/20 -translate-y-1/2"></div>
             {[1, 2, 3, 4, 5].map((s) => (
               <div key={s} className="relative z-10 flex flex-col items-center">
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${step >= s ? 'bg-emerald-500 text-white' : 'bg-white/20 text-white/50'}`}>
                   {step > s ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> : s}
                 </div>
               </div>
             ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          {renderStepContent()}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 rounded-b-3xl flex justify-between items-center">
          {step > 1 ? (
            <button type="button" onClick={prevStep} className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 font-semibold transition-colors px-4 py-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              <span>Back</span>
            </button>
          ) : <div></div>}

          {step < 5 ? (
            <button type="button" onClick={nextStep} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-md hover:shadow-lg transition-all">
              <span>Continue</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-bold py-3 px-8 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50">
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
      
      <style>{`
        @keyframes scale-in { 0% { transform: scale(0.95); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes fade-in { 0% { opacity: 0; transform: translateX(10px); } 100% { opacity: 1; transform: translateX(0); } }
        .animate-scale-in { animation: scale-in 0.2s ease-out forwards; }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}