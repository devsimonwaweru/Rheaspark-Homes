/* eslint-disable no-unused-vars */
// src/components/PropertyCard.jsx
import React, { useState, useMemo } from "react";

export default function PropertyCard({ property, onViewDetails }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imgError, setImgError] = useState(false);

  // Parse images from DB schema (images text null)
  // Can be JSON string, Postgres array string, or fallback to image_url
  const imageList = useMemo(() => {
    let sources = [];
    const rawData = property.images;

    if (rawData) {
      try {
        // 1. Try parsing as JSON (preferred for new uploads)
        if (typeof rawData === 'string' && (rawData.startsWith('[') || rawData.startsWith('{'))) {
          const parsed = JSON.parse(rawData);
          if (Array.isArray(parsed)) sources = parsed;
        } 
        // 2. Handle Postgres array string format '{url1,url2}'
        else if (typeof rawData === 'string' && rawData.startsWith('{') && rawData.endsWith('}')) {
           // Simple regex to extract URLs inside curly braces
           const matches = rawData.match(/https?:\/\/[^,}]+/g);
           if (matches) sources = matches;
        }
      } catch (e) {
        // Fallback if JSON parse fails but data exists
        if (typeof rawData === 'string') sources = rawData.split(',').map(s => s.trim());
      }
    }

    // Fallback to single image_url if no array found
    if (sources.length === 0 && property.image_url) {
      sources.push(property.image_url);
    }
    
    // Legacy fallback
    if (sources.length === 0 && property.image) {
      sources.push(property.image);
    }

    return sources.filter(Boolean);
  }, [property]);

  const hasImage = imageList.length > 0 && !imgError;

  const handleNext = (e) => {
    e.stopPropagation(); // Prevent opening modal
    setCurrentIndex((prev) => (prev + 1) % imageList.length);
  };

  const handlePrev = (e) => {
    e.stopPropagation(); // Prevent opening modal
    setCurrentIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
  };

  // Amenities parsing
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
      {/* Image Area / Carousel */}
      <div className="relative w-full h-56 bg-gray-100 overflow-hidden">
        {hasImage ? (
          <>
            <img
              src={imageList[currentIndex]}
              alt={`${property.title} - ${currentIndex + 1}`}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            
            {/* Carousel Controls (Only show if > 1 image) */}
            {imageList.length > 1 && (
              <>
                {/* Previous Button */}
                <button 
                  onClick={handlePrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-gray-700 p-1.5 rounded-full shadow-md transition-opacity opacity-0 group-hover:opacity-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Next Button */}
                <button 
                  onClick={handleNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-gray-700 p-1.5 rounded-full shadow-md transition-opacity opacity-0 group-hover:opacity-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Dots Indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {imageList.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentIndex ? 'bg-white' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          // Visual Fallback
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