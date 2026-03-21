import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import PropertyCard from "../components/PropertyCard";
import PropertyDetailsModal from "../components/PropertyDetailsModal";

export default function FindHouses() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);

  // --- Filter State ---
  const [filters, setFilters] = useState({
    minPrice: 1000,
    maxPrice: 10000,
    type: "All",
    bedrooms: "Any",
    bathrooms: "Any",
  });

  // Map properties and get full image URL
  const mapProperties = (data) => {
    return data.map((p) => {
      const image =
        p.images?.length > 0
          ? supabase.storage.from("property-images").getPublicUrl(p.images[0]).publicUrl
          : p.image_url || "/images/no-image.jpg";

      return {
        ...p,
        image,
        amenities: p.amenities || [],
      };
    });
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
      } else {
        setSessionChecked(true);
      }
    };

    checkAuth();

    const fetchProperties = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (!error && data) setProperties(mapProperties(data));
      setLoading(false);
    };

    if (sessionChecked) {
      fetchProperties();
    }

    const channel = supabase
      .channel("public:properties")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "properties" },
        (payload) => {
          if (payload.new.status === "active") {
            const newProperty = mapProperties([payload.new])[0];
            setProperties((prev) => [newProperty, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate, sessionChecked]);

  // --- Filtering Logic ---
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const filteredProperties = properties.filter((p) => {
    // 1. Price Filter
    const price = parseFloat(p.price);
    if (price < filters.minPrice || price > filters.maxPrice) return false;

    // 2. Type Filter
    if (filters.type !== "All" && p.type !== filters.type) return false;

    // 3. Bedrooms Filter
    if (filters.bedrooms !== "Any" && p.bedrooms < parseInt(filters.bedrooms)) return false;

    // 4. Bathrooms Filter
    if (filters.bathrooms !== "Any" && p.bathrooms < parseInt(filters.bathrooms)) return false;

    return true;
  });

  const handleViewDetails = (property) => {
    setSelectedProperty(property);
    setIsModalOpen(true);
  };

  if (!sessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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

        {/* --- Updated Filter UI --- */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            
            {/* Price Range */}
            <div className="md:col-span-2 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Min Price (KES)</label>
                <input
                  type="number"
                  name="minPrice"
                  value={filters.minPrice}
                  onChange={handleFilterChange}
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
                  className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Property Type */}
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

            {/* Bedrooms */}
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
                <option value="4">4+</option>
              </select>
            </div>

            {/* Bathrooms */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Bathrooms</label>
              <select
                name="bathrooms"
                value={filters.bathrooms}
                onChange={handleFilterChange}
                className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none bg-white"
              >
                <option>Any</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
              </select>
            </div>
          </div>
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
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <h3 className="text-lg font-semibold text-gray-700">No properties found</h3>
            <p className="text-gray-400 text-sm">Try adjusting your filters.</p>
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