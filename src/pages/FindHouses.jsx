import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import PropertyCard from '../components/PropertyCard';
import PropertyDetailsModal from '../components/PropertyDetailsModal';
import FilterPanel from '../components/FilterPanel';

export default function FindHouses() {
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Robust mapping logic to handle Postgres array strings
  const mapProperties = (data) => {
    return data.map(p => {
      let amenities = p.amenities || [];
      
      // Fix for Postgres string array format (e.g. "{Water,Electricity}")
      if (typeof p.amenities === 'string') {
        let cleanString = p.amenities;
        if (cleanString.startsWith('{') && cleanString.endsWith('}')) {
            cleanString = cleanString.slice(1, -1);
        }
        amenities = cleanString.split(',').filter(Boolean);
      }

      return {
        ...p,
        image: p.images?.length ? p.images[0] : p.image_url || 'https://via.placeholder.com/400x300?text=No+Image',
        amenities: amenities
      };
    });
  };

  useEffect(() => {
    // Initial Fetch
    const fetchProperties = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (!error && data) setProperties(mapProperties(data));
      setLoading(false);
    };

    fetchProperties();

    // Realtime Subscription
    const channel = supabase
      .channel('public:properties')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'properties' },
        (payload) => {
          // Only add if active
          if (payload.new.status === 'active') {
            const newProperty = mapProperties([payload.new])[0];
            setProperties((prev) => [newProperty, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleViewDetails = (property) => {
    setSelectedProperty(property);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800">
            Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Perfect Home</span>
          </h1>
          <p className="text-gray-500 text-lg">Browse verified listings.</p>
        </div>

        <FilterPanel onSearch={() => {}} onFilter={() => {}} />

        {/* Stats */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            <span className="text-blue-600">{properties.length}</span> Properties Available
          </h2>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading properties...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map(property => (
              <PropertyCard 
                key={property.id} 
                property={property} 
                onViewDetails={handleViewDetails} 
              />
            ))}
          </div>
        )}

        {selectedProperty && (
          <PropertyDetailsModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            property={selectedProperty} 
          />
        )}
      </div>
    </div>
  );
}