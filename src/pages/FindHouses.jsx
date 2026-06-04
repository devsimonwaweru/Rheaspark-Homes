import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { counties, constituencies } from "../data/locations";
import PropertyCard from "../components/PropertyCard";
import PropertyDetailsModal from "../components/PropertyDetailsModal";

export default function FindHouses() {
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    searchQuery: "",
    minPrice: "",
    maxPrice: "",
    type: "All",
    bedrooms: "Any",
    bathrooms: "Any",
    county: "All",
    constituency: "All"
  });

  const [constituencyOptions, setConstituencyOptions] = useState([]);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error("Error fetching properties:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'county') {
      const constits = value && value !== 'All' ? constituencies[value] : [];
      setConstituencyOptions(constits);
      setFilters(prev => ({ 
        ...prev, 
        county: value, 
        constituency: "All"
      }));
    } else {
      setFilters(prev => ({ ...prev, [name]: value }));
    }
  };

  const filteredProperties = properties.filter((p) => {
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const titleMatch = p.title?.toLowerCase().includes(query);
      const locationMatch = p.location?.toLowerCase().includes(query);
      if (!titleMatch && !locationMatch) return false;
    }

    const price = parseFloat(p.price);
    if (filters.minPrice && price < parseFloat(filters.minPrice)) return false;
    if (filters.maxPrice && price > parseFloat(filters.maxPrice)) return false;

    if (filters.type !== "All" && p.type !== filters.type) return false;
    if (filters.bedrooms !== "Any" && p.bedrooms < parseInt(filters.bedrooms)) return false;
    if (filters.bathrooms !== "Any" && p.bathrooms < parseInt(filters.bathrooms)) return false;
    if (filters.county !== "All" && p.county !== filters.county) return false;
    if (filters.constituency !== "All" && p.constituency !== filters.constituency) return false;

    return true;
  });

  const handleViewDetails = (property) => {
    setSelectedProperty(property);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800">
            Find Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">
              Perfect Home
            </span>
          </h1>
          <p className="text-gray-500 text-lg">Browse verified listings.</p>
        </div>

        {/* --- Filter UI --- */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 space-y-4">
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input
              type="text"
              name="searchQuery"
              value={filters.searchQuery}
              onChange={handleFilterChange}
              placeholder="Search by name or location"
              className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl text-gray-800 focus:border-blue-500 outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">County</label>
              <select
                name="county"
                value={filters.county}
                onChange={handleFilterChange}
                className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none bg-white"
              >
                <option>All</option>
                {counties.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Constituency</label>
              <select
                name="constituency"
                value={filters.constituency}
                onChange={handleFilterChange}
                disabled={filters.county === 'All'}
                className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none bg-white disabled:bg-gray-50"
              >
                <option>All</option>
                {constituencyOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Property Type</label>
              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none bg-white"
              >
                <option>All</option>
                <option>Apartment</option>
                <option>House</option>
                <option>Studio</option>
                <option>Bedsitter</option>
                <option>Single Room</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Bedrooms</label>
              <select
                name="bedrooms"
                value={filters.bedrooms}
                onChange={handleFilterChange}
                className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none bg-white"
              >
                <option>Any</option>
                <option value="0">Studio / 0</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
              </select>
            </div>
          </div>
          
           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Min Price (KES)</label>
                <input
                  type="number"
                  name="minPrice"
                  value={filters.minPrice}
                  onChange={handleFilterChange}
                  placeholder="Any"
                  className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Max Price (KES)</label>
                <input
                  type="number"
                  name="maxPrice"
                  value={filters.maxPrice}
                  onChange={handleFilterChange}
                  placeholder="Any"
                  className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none"
                />
              </div>
            </div>
        </div>

        {/* --- RENTAL MANAGEMENT BANNER --- */}
        <div className="mb-8 bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0 flex items-center">
                <div className="bg-white/20 p-3 rounded-xl mr-4 hidden sm:block">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-lg md:text-xl font-bold">Are you a Landlord?</h3>
                    <p className="text-sm text-indigo-100">Automate your rent for <span className="font-bold">KES 1,199/mo</span>. Get 1 Month Free!</p>
                </div>
            </div>
            <a 
                href="https://keja-zetu-rentals.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-shrink-0 bg-white text-indigo-700 font-bold py-2.5 px-6 rounded-xl shadow-md hover:bg-indigo-50 transition-colors text-sm"
            >
                Subscribe Now
            </a>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            <span className="text-blue-600">{filteredProperties.length}</span> Properties Found
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
            Loading properties...
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-700">No properties found</h3>
            <p className="text-gray-400 text-sm">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProperties.map((property) => (
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