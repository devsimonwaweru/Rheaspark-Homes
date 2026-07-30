/* eslint-disable no-undef */
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import PaymentModal from "./PaymentModal";

export default function PropertyDetailsModal({ isOpen, onClose, property, isFavorited, onToggleFavorite }) {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  
  // --- IMAGE GALLERY STATE ---
  const [mainImage, setMainImage] = useState(null);

  const imageList = useMemo(() => {
    if (!property) return [];
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

    if (sources.length === 0 && property.image_url) sources.push(property.image_url);
    if (sources.length === 0 && property.image) sources.push(property.image);

    return sources.filter(Boolean);
  }, [property]);

  useEffect(() => {
    if (imageList.length > 0) setMainImage(imageList[0]);
    else setMainImage(null);
  }, [imageList]);

  const getUnlockPrice = (propertyType) => {
    if (!propertyType) return 100;
    const type = propertyType.toLowerCase();
    if (type.includes("single")) return 20;
    if (type.includes("bedsitter") || type.includes("studio")) return 30;
    return 100;
  };

  const unlockPrice = getUnlockPrice(property?.type);

  useEffect(() => {
    const checkAccess = async () => {
      if (!property) return;
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("unlocks")
          .select("id")
          .eq("user_id", user.id)
          .eq("property_id", property.id)
          .maybeSingle();
        
        if (data) setHasAccess(true);
      }
      
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser?.id === property.landlord_id) setHasAccess(true);
      setLoading(false);
    };

    if (isOpen) {
      checkAccess();
      setHasAccess(false);
    }
  }, [isOpen, property]);

  if (!isOpen || !property) return null;

  const hasCoordinates = property.latitude && property.longitude;
  const mapsUrl = hasCoordinates 
    ? `https://www.google.com/maps/dir/?api=1&destination=${property.latitude},${property.longitude}` 
    : '#';

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center">
        <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
          
          {/* --- SMART GALLERY HEADER --- */}
          <div className="relative bg-gray-100">
            <button onClick={onClose} className="absolute top-3 right-3 z-50 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="w-full h-64 sm:h-80 bg-gray-200 overflow-hidden">
              {mainImage ? (
                <img src={mainImage} alt={property.title} className="w-full h-full object-cover transition-opacity duration-300" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                    <span className="text-sm">No Image Available</span>
                </div>
              )}
            </div>

            {imageList.length > 1 && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 pt-8">
                <div className="flex space-x-2 overflow-x-auto pb-1 px-2 scrollbar-hide">
                  {imageList.map((img, index) => (
                    <button 
                        key={index}
                        onClick={() => setMainImage(img)}
                        className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                            mainImage === img ? 'border-white shadow-lg scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                    >
                        <img src={img} alt={`Thumb ${index}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-blue-700 shadow-sm">{property.type}</div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-start gap-4">
              <h2 className="text-2xl font-bold text-gray-800">{property.title}</h2>
              <p className="text-xl font-bold text-blue-600 whitespace-nowrap">KES {property.price?.toLocaleString()}</p>
            </div>
            
            <div className="flex items-center text-gray-500 text-sm">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {property.location}
            </div>

            {/* TRUST INDICATORS ROW */}
            <div className="flex flex-wrap items-center gap-2">
              {property.last_verified_at && (
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  Verified Recently
                </span>
              )}
              {(property.available_units > 0 || property.total_units > 0) && (
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  {property.available_units || 0}/{property.total_units || 0} Units Available
                </span>
              )}
            </div>

            <div className="border-t pt-4 space-y-3">
              <p className="text-gray-600 text-sm">{property.description}</p>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="bg-gray-50 p-3 rounded-xl text-center">
                    <span className="text-gray-400 block text-xs mb-1">Bedrooms</span> 
                    <span className="font-bold text-lg text-gray-800">{property.bedrooms || 0}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl text-center">
                    <span className="text-gray-400 block text-xs mb-1">Bathrooms</span> 
                    <span className="font-bold text-lg text-gray-800">{property.bathrooms || 0}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl text-center">
                    <span className="text-gray-400 block text-xs mb-1">Size</span> 
                    <span className="font-bold text-lg text-gray-800">{property.size || '-'}</span>
                </div>
              </div>
            </div>

            {/* Contact Section */}
            <div className="border-t pt-4 mt-4">
              {loading ? (
                <div className="h-24 bg-gray-100 animate-pulse rounded-xl"></div>
              ) : hasAccess ? (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
                    <h3 className="font-semibold text-green-800">Contact Landlord</h3>
                    <div className="flex items-center space-x-2 text-green-900">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      <a href={`tel:${property.landlord_phone}`} className="font-bold hover:underline">{property.landlord_phone}</a>
                    </div>
                  </div>

                  {hasCoordinates && (
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-sm">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                      <span>Get Directions</span>
                    </a>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <div className="bg-gray-50 p-4 rounded-xl filter blur-sm select-none">
                    <p className="font-mono text-gray-800">+254 7XX XXX XXX</p>
                    <p className="text-sm text-gray-500">Hidden Location Address</p>
                  </div>
                  
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl border border-dashed border-blue-300 p-4">
                    <svg className="w-10 h-10 text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    <p className="text-lg font-bold text-gray-800 mb-1">Unlock Premium Details</p>
                    
                    <div className="text-xs text-gray-600 mb-4 space-y-1 text-left w-full px-4">
                       <div className="flex items-center"><svg className="w-3 h-3 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>View Landlord Phone</div>
                       <div className="flex items-center"><svg className="w-3 h-3 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>Exact GPS Directions</div>
                    </div>

                    <button onClick={() => setShowPayment(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-8 rounded-lg text-sm shadow-md transition-colors">
                      Unlock for KES {unlockPrice}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t space-y-3">
              {hasAccess && (
                <div className="flex gap-3">
                  <button
                    onClick={onToggleFavorite}
                    className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                      isFavorited 
                        ? 'bg-pink-50 text-pink-600 border-2 border-pink-200 hover:bg-pink-100' 
                        : 'bg-gray-100 text-gray-700 border-2 border-gray-200 hover:bg-gray-50 hover:text-pink-600 hover:border-pink-300'
                    }`}
                  >
                    <svg className="w-5 h-5" fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364 6.364 4.5 4.5 0 00-6.364-6.364 4.5 4.5 0 001.272 0L12 15l-4.242 4.242a1 1 0 01-1.414 0L5.586 8.586a1 1 0 010-1.414l4.242-4.242a1 1 0 011.414 0L12 13.414l-4.242 4.242a1 1 0 01-1.414 0z" />
                    </svg>
                    // eslint-disable-next-line no-undef
                    {isFavored ? 'Saved to Favorites' : 'Save to Favorites'}
                  </button>

                  <a 
                    href={`https://wa.me/${property.landlord_phone}?text=Hi, I'm interested in your property: ${property.title}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                    <span>Chat on WhatsApp</span>
                  </a>
                </div>
              )}
              <button onClick={onClose} className="w-full text-center text-gray-500 hover:text-gray-800 font-medium py-2 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      <PaymentModal 
        isOpen={showPayment}
        onClose={(success) => {
          setShowPayment(false);
          if (success) setHasAccess(true);
        }}
        amount={unlockPrice} 
        type="view_property" 
        propertyId={property.id} 
      />
    </>
  );
}