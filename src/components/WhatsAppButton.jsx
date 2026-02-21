import React from 'react';

export default function WhatsAppButton() {
  return (
    <div className="fixed bottom-8 right-8 z-50 animate-bounce-slow">
      <a 
        href="https://wa.me/254769525570?text=Hello%20Rheaspark,%20I%20need%20help%20with..." 
        target="_blank" 
        rel="noopener noreferrer"
        className="group flex items-center"
      >
        {/* Tooltip (Left side) */}
        <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg">
          Chat with us
        </span>

        {/* Button */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#25D366] to-green-500 shadow-2xl flex items-center justify-center hover:scale-110 hover:rotate-12 transition-all duration-300">
          <i className="fab fa-whatsapp text-3xl text-white"></i>
        </div>
      </a>
    </div>
  );
}