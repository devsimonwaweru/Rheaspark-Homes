import React, { useState, useMemo } from 'react';

export default function PropertyCard({ property, onViewDetails }) {
  const [imgError, setImgError] = useState(false);

  const displayImage = imgError || !property.image 
    ? 'https://via.placeholder.com/400x300?text=No+Image' 
    : property.image;

  // FIX: Robust parsing logic to ensure we always end up with an array
  const amenitiesList = useMemo(() => {
    let data = property.amenities;

    // 1. If null or undefined, return empty array
    if (!data) return [];

    // 2. If already an array, return it (filter out empty strings)
    if (Array.isArray(data)) {
      return data.filter(item => item && item.trim() !== '');
    }

    // 3. If string, handle PostgreSQL array format '{A,B}' or standard CSV 'A,B'
    if (typeof data === 'string') {
      // Remove curly braces if present
      let cleanString = data;
      if (cleanString.startsWith('{') && cleanString.endsWith('}')) {
        cleanString = cleanString.slice(1, -1);
      }
      
      // Split by comma
      if (cleanString === '') return [];
      return cleanString.split(',').map(item => item.trim()).filter(Boolean);
    }

    // 4. Fallback
    return [];
  }, [property.amenities]);

  // Now safe to slice
  const visibleAmenities = amenitiesList.slice(0, 3);

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col group">
      
      {/* Image Container */}
      <div className="relative w-full h-56 bg-gray-100 overflow-hidden">
        <img
          src={displayImage}
          alt={property.title}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Content Section */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-gray-800 truncate flex-1 pr-2">
            {property.title}
          </h3>
          <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap">
            {property.status || 'Available'}
          </span>
        </div>

        <p className="text-gray-500 text-sm mb-2 flex items-center gap-1 truncate">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          {property.location}
        </p>

        {/* Amenities Badges - Logic is now safe */}
        {visibleAmenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {visibleAmenities.map((amenity, index) => (
              <span key={index} className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-full">
                {amenity}
              </span>
            ))}
            {amenitiesList.length > 3 && (
              <span className="text-gray-400 text-[10px] px-2 py-0.5">
                +{amenitiesList.length - 3} more
              </span>
            )}
          </div>
        )}

        <div className="mt-auto pt-3 border-t border-gray-50 flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-400">Price</p>
            <p className="text-xl font-extrabold text-gray-800">
              KES <span className="text-blue-600">{property.price?.toLocaleString()}</span>
            </p>
          </div>

          <button
            onClick={() => onViewDetails(property)}
            className="bg-gray-100 hover:bg-blue-600 text-gray-700 hover:text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors duration-200"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}