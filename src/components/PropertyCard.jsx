import React, { useState, useMemo } from "react";

export default function PropertyCard({ property, onViewDetails }) {
  const [imgError, setImgError] = useState(false);

  // Display image: fallback to placeholder if error or missing
  const displayImage = imgError || !property.image
    ? "/placeholder.jpg"
    : property.image;

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
      {/* Image */}
      <div className="relative w-full h-56 bg-gray-100 overflow-hidden">
        <img
          src={displayImage}
          alt={property.title}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
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