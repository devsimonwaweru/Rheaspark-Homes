/* eslint-disable no-unused-vars */
// src/pages/AddProperty.jsx
import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

const POST_FEE = 50;

export default function AddProperty() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    price: "",
    location: "",
    type: "Single Room",
    landlord_name: "",
    landlord_phone: "",
  });

  const [amenities, setAmenities] = useState([]);
  const [imageFile, setImageFile] = useState(null);

  const amenityOptions = [
    "Water",
    "Electricity",
    "WiFi",
    "Parking",
    "Security",
    "Garbage Collection",
    "Backup Generator",
    "Furnished",
  ];

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!imageFile) {
      alert("Please upload a property image");
      return;
    }

    setLoading(true);

    try {
      // 1️⃣ Upload image to Supabase Storage
      const fileName = `prop-${Date.now()}-${imageFile.name.replace(
        /\s/g,
        "-"
      )}`;

      const { error: uploadError } = await supabase.storage
        .from("property-images")
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("property-images")
        .getPublicUrl(fileName);

      // 2️⃣ Insert property with is_paid = false
      const { data: propertyData, error: insertError } = await supabase
        .from("properties")
        .insert({
          title: formData.title,
          price: parseFloat(formData.price),
          location: formData.location,
          type: formData.type,
          landlord_name: formData.landlord_name,
          landlord_phone: formData.landlord_phone,
          image_url: urlData.publicUrl,
          images: [urlData.publicUrl],
          amenities: amenities,
          status: "pending",
          is_paid: false,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // 3️⃣ Redirect to payment page with property_id
      navigate(
        `/payment?type=post_property&amount=${POST_FEE}&property_id=${propertyData.id}`
      );
    } catch (err) {
      console.error("Error:", err);
      alert("Failed to create property: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Add New Property</h1>
      <p className="text-gray-500 mb-6">
        Fee: KES {POST_FEE} per post.
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-lg border space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold mb-2">
              Property Title
            </label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Price (KES)
            </label>
            <input
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Property Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg bg-white"
            >
              <option>Single Room</option>
              <option>Bedsitter</option>
              <option>1 Bedroom</option>
              <option>2 Bedroom</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            Location
          </label>
          <input
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full border p-3 rounded-lg"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            Property Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files[0])}
            className="w-full"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl"
        >
          {loading ? "Processing..." : `Pay KES ${POST_FEE} to Post`}
        </button>
      </form>
    </div>
  );
}