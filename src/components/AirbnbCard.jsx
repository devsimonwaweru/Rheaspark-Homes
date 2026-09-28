import React from 'react';

export default function AirbnbCard({ airbnb, onViewDetails, isFavorite, onToggleFavorite }) {
  if (!airbnb) return null;

  const name = airbnb.name || 'Unnamed Listing';
  const location = airbnb.location || 'Unknown Location';
  const image = airbnb.image_url || 'https://via.placeholder.com/400x300';
  const price = airbnb.price_per_night || 0;
  const guests = airbnb.max_guests || 0;
  const bedrooms = airbnb.bedrooms || 0;
  const bathrooms = airbnb.bathrooms || 0;

  return (
    <div 
      className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer flex flex-col h-full border border-gray-100"
      onClick={() => onViewDetails && onViewDetails(airbnb)}
    >
      {/* Image Section */}
      <div className="relative h-56 overflow-hidden">
        <img 
          src={image} 
          alt={name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-teal-500 text-white text-xs font-bold rounded-full shadow-md">
            Airbnb
          </span>
        </div>
        
        {/* Favorite Button */}
        {onToggleFavorite && (
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(airbnb.id); }}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white transition-colors"
          >
            <svg className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.684l-1.318-1.366a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5 flex-grow flex flex-col">
        <h3 className="text-lg font-bold text-gray-800 mb-1 truncate">{name}</h3>
        <p className="text-sm text-gray-500 mb-3 flex items-center">
          <svg className="w-4 h-4 mr-1 text-teal-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {location}
        </p>

        <div className="flex items-center gap-3 text-xs text-gray-500 mb-4 border-t border-b border-gray-100 py-2">
          {guests > 0 && <span className="flex items-center gap-1"><i className="fas fa-users"></i> {guests} Guests</span>}
          {bedrooms > 0 && <span className="flex items-center gap-1"><i className="fas fa-bed"></i> {bedrooms} Bed{bedrooms > 1 ? 's' : ''}</span>}
          {bathrooms > 0 && <span className="flex items-center gap-1"><i className="fas fa-bath"></i> {bathrooms} Bath{bathrooms > 1 ? 's' : ''}</span>}
        </div>

        <div className="mt-auto flex items-center justify-between">
          <div>
            <span className="text-xl font-extrabold text-gray-800">KES {price?.toLocaleString()}</span>
            <span className="text-sm text-gray-500"> / night</span>
          </div>
          <span className="text-teal-600 font-semibold text-sm hover:underline">View Details →</span>
        </div>
      </div>
    </div>
  );
}