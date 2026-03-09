// src/components/PropertyCard.jsx
import React, { useState, useMemo } from "react";

export default function PropertyCard({ property, onViewDetails }) {
  const [imgError, setImgError] = useState(false);

  // Determine if we have a valid image URL
  const hasImage = property.image && !imgError;

  // Amenities parsing (robust)
  const amenitiesList = useMemo(() => {
    let data = property.amenities;

    if (!data) return [];
    if (Array.isArray(data)) return data.filter((item) => item?.trim() !== "");
    if (typeof data === "string") {
      let clean = data.startsWith("{") && data.endsWith("}") ? data.slice(1, -1) : data;
      return clean.split(",").map((item) => item.trim()).filter(Boolean);
    }
    return [];
  }, [property.amenities]);

  const visibleAmenities = amenitiesList.slice(0, 3);

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col group">
      {/* Image Area */}
      <div className="relative w-full h-56 bg-gray-100 overflow-hidden">
        {hasImage ? (
          <img
            src={property.image}
            alt={property.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          // Visual Fallback when no image is available
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 text-gray-400">
            <svg className="w-16 h-16 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs font-medium uppercase tracking-wider">No Image Available</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-gray-800 truncate flex-1 pr-2">
            {property.title}
          </h3>
          <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap">
            {property.status || "Available"}
          </span>
        </div>

        <p className="text-gray-500 text-sm mb-2 flex items-center gap-1 truncate">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {property.location}
        </p>

        {/* Amenities */}
        {visibleAmenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {visibleAmenities.map((amenity, index) => (
              <span
                key={index}
                className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-full"
              >
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