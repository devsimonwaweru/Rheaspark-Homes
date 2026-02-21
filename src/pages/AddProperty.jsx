import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GradientButton from '../components/GradientButton';

export default function AddProperty() {
  const navigate = useNavigate();
  
  // Form State
  const [formData, setFormData] = useState({
    title: '', type: 'Apartment', location: '', price: '', description: ''
  });
  
  // State for multiple images
  const [images, setImages] = useState([]);
  const [amenities, setAmenities] = useState([]);

  // Amenities List
  const amenitiesList = [
    "24/7 Security", "Water Supply", "WiFi Included", "Parking", "Gym", 
    "Swimming Pool", "Balcony", "Pet Friendly", "CCTV", "Backup Generator"
  ];

  // Handle Input Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle Image Selection
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Create preview URLs for the selected files
    const previewUrls = files.map(file => ({
      file: file,
      preview: URL.createObjectURL(file)
    }));

    setImages([...images, ...previewUrls]);
  };

  // Remove Image
  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  // Handle Amenity Toggle
  const toggleAmenity = (amenity) => {
    if (amenities.includes(amenity)) {
      setAmenities(amenities.filter(a => a !== amenity));
    } else {
      setAmenities([...amenities, amenity]);
    }
  };

  // Handle Form Submit
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const propertyData = {
      ...formData,
      images: images.map(img => img.file), // Here you would normally upload files to server
      amenities
    };

    console.log("Property Data:", propertyData);
    
    // Simulate success
    alert("Property Submitted Successfully!");
    navigate('/landlord');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Add New Property</h1>
        <p className="text-gray-500">Fill in the details below to list a new property.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        
        {/* Section 1: Basic Info */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Title</label>
              <input 
                type="text" name="title" value={formData.title} onChange={handleChange}
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                placeholder="e.g. Spacious 2-Bedroom Apartment"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
              <select 
                name="type" value={formData.type} onChange={handleChange}
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue bg-white"
              >
                <option>Apartment</option>
                <option>House</option>
                <option>Studio</option>
                <option>Bedsitter</option>
                <option>Single Room</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input 
                type="text" name="location" value={formData.location} onChange={handleChange}
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                placeholder="e.g. Westlands, Nairobi"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent (KES)</label>
              <input 
                type="number" name="price" value={formData.price} onChange={handleChange}
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                placeholder="e.g. 50000"
                required
              />
            </div>
          </div>
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea 
              name="description" value={formData.description} onChange={handleChange}
              rows="4"
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              placeholder="Describe your property..."
            ></textarea>
          </div>
        </div>

        {/* Section 2: Image Upload */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Property Images</h3>
          
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-primary-blue transition-colors">
            <input type="file" id="images" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
            <label htmlFor="images" className="cursor-pointer">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 flex items-center justify-center text-primary-blue">
                <i className="fas fa-cloud-upload-alt text-2xl"></i>
              </div>
              <p className="text-gray-600 font-semibold">Click to upload images</p>
              <p className="text-gray-400 text-sm">PNG, JPG up to 5MB</p>
            </label>
          </div>

          {/* Image Previews */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mt-4">
              {images.map((img, index) => (
                <div key={index} className="relative group">
                  <img src={img.preview} alt="Preview" className="w-full h-20 object-cover rounded-lg border" />
                  <button 
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Amenities */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Amenities</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {amenitiesList.map((amenity) => (
              <label key={amenity} className="flex items-center p-3 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={amenities.includes(amenity)}
                  onChange={() => toggleAmenity(amenity)}
                  className="w-4 h-4 text-primary-blue rounded mr-3 focus:ring-primary-blue"
                />
                <span className="text-sm font-medium text-gray-700">{amenity}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4 pt-4 border-t">
          <button type="button" onClick={() => navigate('/landlord')} className="px-6 py-3 border border-gray-200 text-gray-600 font-semibold rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <GradientButton type="submit" size="lg">
            <i className="fas fa-save mr-2"></i> Save Property
          </GradientButton>
        </div>

      </form>
    </div>
  );
}