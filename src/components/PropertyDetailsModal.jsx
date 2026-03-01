/* eslint-disable react-hooks/set-state-in-effect */
// src/components/PropertyDetailsModal.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PropertyDetailsModal({ isOpen, onClose, property }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!property || !isOpen) return;

    // Check if tenant has already paid for this property
    const unlockedProperties = JSON.parse(localStorage.getItem('unlocked_properties') || '[]');
    if (unlockedProperties.includes(property.id)) {
      setIsUnlocked(true);
    }
    setLoading(false);
  }, [property, isOpen]);

  if (!isOpen || !property) return null;

  // Determine unlock price based on type
  const getUnlockPrice = (type) => {
    switch (type) {
      case 'Single Room':
        return 20;
      case 'Bedsitter':
        return 30;
      case '1 Bedroom':
      case '2 Bedroom':
        return 100;
      default:
        return 50;
    }
  };

  const unlockPrice = getUnlockPrice(property.type);
  const imageSrc = property.image_url || 'https://via.placeholder.com/400x300';

  const handleUnlockClick = () => {
    // Redirect to payment page
    navigate(`/payment?type=view_property&price=${unlockPrice}&property_id=${property.id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">{property.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        {/* Image */}
        <img src={imageSrc} alt={property.title} className="w-full h-56 object-cover" />

        <div className="p-6 space-y-4">
          {/* Price & Type */}
          <div className="flex justify-between items-center">
            <span className="text-2xl font-extrabold text-blue-600">KES {property.price?.toLocaleString()}</span>
            <span className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium text-gray-600">{property.type}</span>
          </div>

          <div className="text-gray-600">
            <span className="font-semibold">Location:</span> {property.location}
          </div>

          {/* Contact Section */}
          <div className={`mt-4 p-4 rounded-xl border ${isUnlocked ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
            {loading ? (
              <p className="text-center text-gray-400 text-sm">Checking status...</p>
            ) : isUnlocked ? (
              <div className="space-y-2">
                <h4 className="font-bold text-green-800 flex items-center gap-2">
                  Contact Info Unlocked
                </h4>
                <p className="text-gray-800"><span className="font-semibold">Name:</span> {property.landlord_name}</p>
                <p className="text-gray-800">
                  <span className="font-semibold">Phone:</span> 
                  <a href={`tel:${property.landlord_phone}`} className="text-blue-600 ml-1 hover:underline">{property.landlord_phone}</a>
                </p>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <div className="flex justify-center mb-2">
                  <div className="bg-gray-200 rounded-full p-3 text-gray-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-700 font-medium text-sm">
                  Unlock landlord contact details for <span className="font-bold text-blue-600">KES {unlockPrice}</span>
                </p>
                <button 
                  onClick={handleUnlockClick}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
                >
                  Unlock Now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}