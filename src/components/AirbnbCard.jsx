import React, { useState } from 'react';
import BookAirbnbModal from './BookAirbnbModal';

export default function AirbnbCard({ airbnb, onViewDetails, isFavorite, onToggleFavorite, feeSettings }) {
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  if (!airbnb) return null;

  const name = airbnb.name || 'Unnamed Listing';
  const location = airbnb.location || 'Unknown Location';
  const image = airbnb.image_url || 'https://via.placeholder.com/400x300';
  const price = airbnb.price_per_night || 0;
  const guests = airbnb.max_guests || 0;
  const bedrooms = airbnb.bedrooms || 0;
  const bathrooms = airbnb.bathrooms || 0;

  // Calculate booking fee for display from admin-configured settings
  const bookingFee = feeSettings
    ? feeSettings.fee_type === 'percentage'
      ? Math.round((Number(feeSettings.fee_value) / 100) * Number(price))
      : Math.round(Number(feeSettings.fee_value))
    : 0;

  return (
    <>
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

          <div className="mt-auto">
            <div className="flex items-end justify-between gap-2 mb-3">
              <div className="flex flex-col">
                <span className="text-xl font-extrabold text-gray-800">KES {price?.toLocaleString()}</span>
                <span className="text-xs text-gray-500"> / night</span>
              </div>
              {bookingFee > 0 && (
                <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                  Booking fee: KES {bookingFee.toLocaleString()}
                </span>
              )}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setIsBookModalOpen(true); }}
              className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-md transition-all duration-200 hover:shadow-lg"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.149-.197.297-.767.967-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
              Book Now
            </button>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <BookAirbnbModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        airbnb={airbnb}
        feeSettings={feeSettings}
      />
    </>
  );
}