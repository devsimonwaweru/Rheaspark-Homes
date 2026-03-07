import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import PaymentModal from "./PaymentModal";

export default function PropertyDetailsModal({ isOpen, onClose, property }) {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (!property) return;
      
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Check if unlocked
        const { data } = await supabase
          .from("unlocks")
          .select("id")
          .eq("user_id", user.id)
          .eq("property_id", property.id)
          .single();
        
        if (data) setHasAccess(true);
      }
      
      // Check if user is the landlord (owner)
      const { data: landlord } = await supabase.auth.getUser();
      if (landlord?.user?.id === property.landlord_id) {
        setHasAccess(true);
      }

      setLoading(false);
    };

    if (isOpen) {
      checkAccess();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasAccess(false); // Reset on open
    }
  }, [isOpen, property]);

  if (!isOpen || !property) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 flex items-end sm:items-center justify-center">
        <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
          
          {/* Image Header */}
          <div className="relative h-56 bg-gray-200">
            {property.image ? (
              <img src={property.image} className="w-full h-full object-cover" alt={property.title} />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <span className="text-gray-400">No Image</span>
              </div>
            )}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            {/* Badge */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-blue-700">
              {property.type}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-start">
              <h2 className="text-2xl font-bold text-gray-800">{property.title}</h2>
              <p className="text-xl font-bold text-blue-600">KES {property.price?.toLocaleString()}</p>
            </div>
            
            <div className="flex items-center text-gray-500 text-sm">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {property.location}
            </div>

            <div className="border-t pt-4 space-y-3">
              <p className="text-gray-600 text-sm">{property.description}</p>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                 <div className="bg-gray-50 p-2 rounded-lg"><span className="text-gray-400 block">Bedrooms</span> <span className="font-semibold">{property.bedrooms || 0}</span></div>
                 <div className="bg-gray-50 p-2 rounded-lg"><span className="text-gray-400 block">Bathrooms</span> <span className="font-semibold">{property.bathrooms || 0}</span></div>
              </div>
            </div>

            {/* Contact Section - Logic Gate */}
            <div className="border-t pt-4 mt-4">
              {loading ? (
                <div className="h-24 bg-gray-100 animate-pulse rounded-xl"></div>
              ) : hasAccess ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
                  <h3 className="font-semibold text-green-800">Contact Landlord</h3>
                  <div className="flex items-center space-x-2 text-green-900">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    <a href={`tel:${property.landlord_phone}`} className="font-bold hover:underline">{property.landlord_phone}</a>
                  </div>
                  <p className="text-xs text-green-700 mt-1">You have unlocked this property.</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Blurred Content */}
                  <div className="bg-gray-50 p-4 rounded-xl filter blur-sm select-none">
                    <p className="font-mono text-gray-800">+254 7XX XXX XXX</p>
                    <p className="text-sm text-gray-500">Hidden Location Address</p>
                  </div>
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl border border-dashed border-blue-300">
                    <svg className="w-8 h-8 text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    <p className="text-sm font-semibold text-gray-800 mb-1">Unlock Contact Details</p>
                    <p className="text-xs text-gray-500 mb-3">One-time fee of KES 50</p>
                    <button 
                      onClick={() => setShowPayment(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg text-sm shadow-md transition-colors"
                    >
                      Unlock for KES 50
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-4 border-t">
              <a 
                href={`https://wa.me/${property.landlord_phone}?text=Hi, I'm interested in your property on Rheaspark: ${property.title}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal 
        isOpen={showPayment}
        onClose={(success) => {
          setShowPayment(false);
          if (success) {
            setHasAccess(true);
            // Optionally refresh property data here
          }
        }}
        amount={50} 
        type="view_property" 
        propertyId={property.id} 
      />
    </>
  );
}