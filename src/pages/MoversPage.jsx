import React, { useState } from 'react';

export default function MoversPage() {
  const [movers] = useState([
    { id: 1, name: "QuickMove Kenya", rating: 4.8, jobs: 120, image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80", location: "Westlands" },
    { id: 2, name: "SafeRelocate Ltd", rating: 4.5, jobs: 85, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80", location: "Kilimani" },
    { id: 3, name: "City Haulers", rating: 4.9, jobs: 200, image: "https://images.unsplash.com/photo-1549395156-e0c1fe6fc7a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80", location: "Nairobi CBD" },
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 font-brand">
          Find <span className="brand-gradient">Registered Movers</span>
        </h1>
        <p className="text-gray-600 text-lg">Verified and trusted moving partners for your relocation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {movers.map(mover => (
          <div key={mover.id} className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="relative h-40 bg-gradient-to-r from-primary-green to-teal-500">
              <img src={mover.image} alt={mover.name} className="w-full h-full object-cover mix-blend-overlay opacity-50" />
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-xl font-bold">{mover.name}</h3>
                <p className="text-sm opacity-90"><i className="fas fa-map-marker-alt mr-1"></i> {mover.location}</p>
              </div>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <i className="fas fa-star text-yellow-400 mr-1"></i>
                  <span className="font-bold text-gray-800">{mover.rating}</span>
                  <span className="text-gray-500 text-sm ml-1">({mover.jobs} jobs)</span>
                </div>
                <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">Verified</span>
              </div>
              <button className="w-full py-3 bg-gradient-to-r from-primary-green to-teal-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all">
                Request Quote
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}