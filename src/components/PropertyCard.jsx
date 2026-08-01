// src/components/PropertyCard.jsx

import React, { useState, useMemo } from "react";

export default function PropertyCard({ property, onViewDetails, isFavorite, onToggleFavorite }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imgError, setImgError] = useState(false);

  const getCloudinaryUrl = (url, width) => {
    if (!url) return url;
    return `https://res.cloudinary.com/deqowfv7y/image/fetch/f_auto,q_auto,w_${width}/${url}`;
  };

  const imageList = useMemo(() => {
    let sources = [];
    const rawData = property.images;

    if (rawData) {
      try {
        if (typeof rawData === 'string' && (rawData.startsWith('[') || rawData.startsWith('{'))) {
          const parsed = JSON.parse(rawData);
          if (Array.isArray(parsed)) sources = parsed;
        } else if (typeof rawData === 'string' && rawData.startsWith('{') && rawData.endsWith('}')) {
           const matches = rawData.match(/https?:\/\/[^,}]+/g);
           if (matches) sources = matches;
        }
      // eslint-disable-next-line no-unused-vars
      } catch (e) {
        if (typeof rawData === 'string') sources = rawData.split(',').map(s => s.trim());
      }
    }

    if (sources.length === 0 && property.image_url) {
      sources.push(property.image_url);
    }
    
    return sources.filter(Boolean);
  }, [property]);

  const hasImage = imageList.length > 0 && !imgError;

  const getVerificationBadge = () => {
    if (!property.last_verified_at) return null;
    const daysSince = Math.floor((Date.now() - new Date(property.last_verified_at).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince <= 7) return { bg: 'bg-emerald-500', text: daysSince === 0 ? '🟢 Verified Today' : `🟢 ${daysSince}d ago` };
    if (daysSince <= 30) return { bg: 'bg-yellow-500', text: `🟡 ${daysSince}d ago` };
    return { bg: 'bg-red-500', text: `🔴 ${daysSince}d ago` };
  };

  const badge = getVerificationBadge();
  const available = property.available_units || 0;
  const total = property.total_units || 1;

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % imageList.length);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    onToggleFavorite(property.id);
  };

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col group">
      {/* Image Area */}
      <div className="relative w-full h-56 bg-gray-100 overflow-hidden">
        {hasImage ? (
          <>
            <img
              src={getCloudinaryUrl(imageList[currentIndex], 400)}
              alt={`${property.title} - ${currentIndex + 1}`}
              onError={() => setImgError(true)}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            
            {imageList.length > 1 && (
              <>
                <button onClick={handlePrev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-gray-700 p-1.5 rounded-full shadow-md transition-opacity opacity-0 group-hover:opacity-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button onClick={handleNext} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-gray-700 p-1.5 rounded-full shadow-md transition-opacity opacity-0 group-hover:opacity-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {imageList.map((_, idx) => (
                    <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentIndex ? 'bg-white' : 'bg-white/50'}`} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 text-gray-400">
            <svg className="w-16 h-16 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            <span className="text-xs font-medium uppercase tracking-wider">No Image Available</span>
          </div>
        )}

        {/* OVERLAY TRUST INDICATORS */}
        <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
          <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-blue-700 shadow-sm">
            {property.type}
          </div>
          {badge && (
            <div className={`${badge.bg} text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm`}>
              {badge.text}
            </div>
          )}
        </div>

        {/* FAVORITE HEART BUTTON */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full shadow-md transition-all duration-200 hover:scale-110 z-10"
          style={{ backgroundColor: isFavorite ? 'rgba(239, 68, 68, 0.9)' : 'rgba(255, 255, 255, 0.85)' }}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <svg
            className="w-5 h-5 transition-colors duration-200"
            viewBox="0 0 24 24"
            fill={isFavorite ? "white" : "none"}
            stroke={isFavorite ? "white" : "#9ca3af"}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {available > 0 && (
          <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
            {available}/{total} Units Left
          </div>
        )}
      </div>

      {/* Content - Cleaned Up */}
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-gray-800 truncate mb-1">{property.title}</h3>

        <p className="text-gray-500 text-sm mb-4 flex items-center gap-1 truncate">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          {property.location}
        </p>

        <div className="mt-auto pt-3 border-t border-gray-50 flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-400">Price</p>
            <p className="text-xl font-extrabold text-gray-800">KES <span className="text-blue-600">{property.price?.toLocaleString()}</span></p>
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