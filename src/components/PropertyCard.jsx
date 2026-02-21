import React, { useState } from 'react';

export default function PropertyCard({ property, onViewDetails }) {
  const [isFavorite, setIsFavorite] = useState(false);

  const { image, title, location, price, beds, baths, size, verified = false, isNew = false } = property;

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden group cursor-pointer transform hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      
      {/* Image Section */}
      <div className="relative overflow-hidden h-64">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
        />
        
        <div className="absolute top-4 left-4 flex gap-2">
          {verified && (
            <span className="bg-gradient-to-r from-primary-blue to-primary-green text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center shadow-md">
              <i className="fas fa-shield-alt mr-1"></i> Verified
            </span>
          )}
          {isNew && (
            <span className="bg-gradient-to-r from-[#FF9800] to-[#FF5722] text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
              New Listing
            </span>
          )}
        </div>

        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-2 rounded-xl shadow-sm">
          <span className="font-bold text-lg">KES {price.toLocaleString()}</span>
          <span className="text-xs text-gray-600 block">/month</span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2 truncate">{title}</h3>
        <div className="flex items-center text-gray-600 mb-4">
          <i className="fas fa-map-marker-alt text-primary-green mr-2"></i>
          <span className="text-sm truncate">{location}</span>
        </div>

        <div className="flex flex-wrap gap-3 mb-4 text-sm text-gray-700">
          <div className="flex items-center">
            <i className="fas fa-bed text-primary-blue mr-1"></i> {beds} Beds
          </div>
          <div className="flex items-center">
            <i className="fas fa-bath text-primary-blue mr-1"></i> {baths} Baths
          </div>
          <div className="flex items-center">
            <i className="fas fa-ruler-combined text-primary-blue mr-1"></i> {size} sqft
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-2">
          {/* Changed to button to trigger modal */}
          <button 
            onClick={() => onViewDetails(property)}
            className="flex-1 text-center bg-gradient-to-r from-primary-blue to-primary-green text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
          >
            View Details
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering card click
              setIsFavorite(!isFavorite);
            }}
            className={`w-12 h-12 flex items-center justify-center border rounded-lg transition-colors duration-300 ${isFavorite ? 'border-red-200 bg-red-50 text-red-500' : 'border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200'}`}
          >
            <i className={`${isFavorite ? 'fas' : 'far'} fa-heart text-xl`}></i>
          </button>
        </div>
      </div>

    </div>
  );
}