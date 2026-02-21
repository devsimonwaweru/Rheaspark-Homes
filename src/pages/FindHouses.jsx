import React, { useState } from 'react';
import FilterPanel from '../components/FilterPanel';
import PropertyCard from '../components/PropertyCard';
import PropertyDetailsModal from '../components/PropertyDetailsModal';

export default function FindHouses() {
  // State for Modal
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Dummy Data
  const allProperties = [
    { id: 1, type: "Apartment", image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1073&q=80", title: "Spacious 3-Bedroom Apartment", location: "Westlands, Nairobi", price: 85000, beds: 3, baths: 2, size: 1200, verified: true },
    { id: 2, type: "House", image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80", title: "Contemporary Family Home", location: "Kileleshwa, Nairobi", price: 120000, beds: 4, baths: 3, size: 2400, verified: true },
    { id: 3, type: "Apartment", image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80", title: "Luxury 2-Bedroom Suite", location: "Kilimani, Nairobi", price: 65000, beds: 2, baths: 2, size: 950, verified: true },
    { id: 4, type: "Studio", image: "https://images.unsplash.com/photo-1600607687644-c7171b42498b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80", title: "Cozy Studio", location: "Lavington, Nairobi", price: 35000, beds: 1, baths: 1, size: 450, isNew: true },
    { id: 5, type: "Bedsitter", image: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80", title: "Modern Bedsitter", location: "South B, Nairobi", price: 25000, beds: 1, baths: 1, size: 300, verified: true },
    { id: 6, type: "House", image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1153&q=80", title: "Executive Villa", location: "Runda, Nairobi", price: 180000, beds: 5, baths: 4, size: 4200, verified: true },
  ];

  const [displayedProperties] = useState(allProperties);

  // Handler to open modal
  const handleViewDetails = (property) => {
    setSelectedProperty(property);
    setIsModalOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      
      <div className="mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 font-brand">
          Find Your <span className="brand-gradient">Perfect Home</span>
        </h1>
        <p className="text-gray-600 text-lg max-w-3xl mx-auto">
          Browse verified rental listings with transparent information.
        </p>
      </div>

      <FilterPanel onSearch={() => {}} onFilter={() => {}} />

      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            <span className="text-primary-blue">{displayedProperties.length}</span> Properties Found
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {displayedProperties.map(property => (
          <PropertyCard 
            key={property.id} 
            property={property} 
            onViewDetails={handleViewDetails} 
          />
        ))}
      </div>

      {/* The Payment/Details Modal */}
      <PropertyDetailsModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        property={selectedProperty} 
      />

    </div>
  );
}