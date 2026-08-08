// src/pages/FindHouses.jsx

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import { Link } from "react-router-dom";
import PropertyCard from "../components/PropertyCard";
import PropertyDetailsModal from "../components/PropertyDetailsModal";

const FAVORITES_KEY = 'rheaspark_favorites';

// Haversine formula to calculate distance between two coordinates in KM
const getDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export default function FindHouses() {
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Auth State
  const [authStatus, setAuthStatus] = useState('checking');
  const [session, setSession] = useState(null);

  // Location State
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle'); // idle, fetching, active, denied

  // Favorites State - Initialize from localStorage to prevent disappearing on refresh
  const [favorites, setFavorites] = useState(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      return new Set();
    }
  });

  const [filters, setFilters] = useState({
    searchQuery: "", minPrice: "", maxPrice: "", type: "All",
    bedrooms: "Any", bathrooms: "Any", county: "All", constituency: "All"
  });

  const [constituencyOptions, setConstituencyOptions] = useState([]);

  // Dynamically generate counties that only have houses
  const availableCounties = useMemo(() => {
    return [...new Set(properties.map(p => p.county).filter(Boolean))].sort();
  }, [properties]);

  useEffect(() => {
    const initializeData = async () => {
      await fetchProperties();
      
      // Check Auth & Sync Favorites
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      
      if (currentSession) {
        const { data: profile } = await supabase
          .from('landlords')
          .select('subscription_status')
          .eq('id', currentSession.user.id)
          .single();

        if (profile?.subscription_status === 'active') setAuthStatus('pro');
        else if (profile) setAuthStatus('user');
        else setAuthStatus('guest');

        // Fetch real favorites from DB for logged-in users
        const { data: favData } = await supabase
          .from('favorites')
          .select('property_id')
          .eq('user_id', currentSession.user.id);
        
        if (favData && favData.length > 0) {
          const dbFavs = new Set(favData.map(f => f.property_id));
          setFavorites(dbFavs);
          localStorage.setItem(FAVORITES_KEY, JSON.stringify([...dbFavs]));
        } else {
          // If DB is empty, clear local storage to stay in sync
          setFavorites(new Set());
          localStorage.setItem(FAVORITES_KEY, JSON.stringify([]));
        }
      } else {
        setAuthStatus('guest');
      }
    };

    initializeData();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      // Fetch ALL properties - no status or auto_hidden filtering
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .order('created_at', { ascending: false });

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
      if (value && value !== 'All') {
        // Dynamically get constituencies that actually have houses in this county
        const uniqueConstituencies = [...new Set(properties.filter(p => p.county === value && p.constituency).map(p => p.constituency))].sort();
        setConstituencyOptions(uniqueConstituencies);
      } else {
        setConstituencyOptions([]);
      }
      setFilters(prev => ({ ...prev, county: value, constituency: "All" }));
    } else {
      setFilters(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    
    setLocationStatus('fetching');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ 
          lat: position.coords.latitude, 
          lng: position.coords.longitude 
        });
        setLocationStatus('active');
      },
      (error) => {
        console.error("Location error:", error);
        setLocationStatus('denied');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleToggleFavorite = async (propertyId) => {
    const isCurrentlyFav = favorites.has(propertyId);
    const newFavorites = new Set(favorites);
    
    if (isCurrentlyFav) {
      newFavorites.delete(propertyId);
    } else {
      newFavorites.add(propertyId);
    }

    // 1. Optimistic UI Update
    setFavorites(newFavorites);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...newFavorites]));

    // 2. Database Sync for Logged-in Users
    if (session) {
      try {
        if (isCurrentlyFav) {
          await supabase.from('favorites').delete().match({ user_id: session.user.id, property_id: propertyId });
        } else {
          await supabase.from('favorites').insert({ user_id: session.user.id, property_id: propertyId });
        }
      } catch (error) {
        console.error("Error syncing favorite to database:", error);
      }
    }
  };

  const filteredProperties = properties.filter((p) => {
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      if (!p.title?.toLowerCase().includes(query) && !p.location?.toLowerCase().includes(query)) return false;
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

  // Sort: Favorites first, then by distance if location is active
  const sortedProperties = [...filteredProperties].sort((a, b) => {
    const aFav = favorites.has(a.id) ? 1 : 0;
    const bFav = favorites.has(b.id) ? 1 : 0;
    if (aFav !== bFav) return bFav - aFav;

    if (userLocation) {
      const distA = getDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude);
      const distB = getDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude);
      return distA - distB;
    }

    return 0;
  });

  const handleViewDetails = (property) => { setSelectedProperty(property); setIsModalOpen(true); };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800">
            Find Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">Perfect Home</span>
          </h1>
          <p className="text-gray-500 text-lg">Browse all available listings.</p>
        </div>

        {/* Filter UI */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 space-y-4">
          <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
               <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             </div>
             <input type="text" name="searchQuery" value={filters.searchQuery} onChange={handleFilterChange} placeholder="Search by name or location" className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl text-gray-800 focus:border-blue-500 outline-none transition-colors" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div>
               <label className="block text-xs font-semibold text-gray-500 mb-1">County</label>
               <select name="county" value={filters.county} onChange={handleFilterChange} className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none bg-white">
                 <option>All</option>
                 {availableCounties.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
             </div>
             
             <div>
               <label className="block text-xs font-semibold text-gray-500 mb-1">Constituency</label>
               <select name="constituency" value={filters.constituency} onChange={handleFilterChange} disabled={filters.county === 'All' || constituencyOptions.length === 0} className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none bg-white disabled:bg-gray-50">
                 <option>All</option>
                 {constituencyOptions.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
             </div>
             
             <div>
               <label className="block text-xs font-semibold text-gray-500 mb-1">Property Type</label>
               <select name="type" value={filters.type} onChange={handleFilterChange} className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none bg-white">
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
               <select name="bedrooms" value={filters.bedrooms} onChange={handleFilterChange} className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none bg-white">
                 <option>Any</option>
                 <option value="0">Studio / 0</option>
                 <option value="1">1+</option>
                 <option value="2">2+</option>
                 <option value="3">3+</option>
               </select>
             </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Min Price (KES)</label>
                <input type="number" name="minPrice" value={filters.minPrice} onChange={handleFilterChange} placeholder="Any" className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Max Price (KES)</label>
                <input type="number" name="maxPrice" value={filters.maxPrice} onChange={handleFilterChange} placeholder="Any" className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none" />
              </div>
              
              {/* Near Me Button */}
              <div className="flex items-end">
                <button 
                  onClick={handleLocateMe} 
                  className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-200 border-2 ${
                    locationStatus === 'active' 
                      ? 'bg-blue-50 border-blue-500 text-blue-700' 
                      : 'bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600'
                  }`}
                >
                  {locationStatus === 'fetching' ? (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  )}
                  {locationStatus === 'active' ? 'Location On' : 'Near Me'}
                </button>
              </div>
          </div>

          {/* Location Denied Prompt */}
          {locationStatus === 'denied' && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                Location access denied. Enable it in your browser settings to sort by nearest houses.
              </span>
              <button onClick={handleLocateMe} className="font-bold underline hover:no-underline flex-shrink-0 ml-4">Try Again</button>
            </div>
          )}
        </div>

        {/* --- SMART BANNER --- */}
        {authStatus !== 'pro' && (
          <div className="mb-8 bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between">
              <div className="mb-4 md:mb-0 flex items-center">
                  <div className="bg-white/20 p-3 rounded-xl mr-4 hidden sm:block">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  </div>
                  <div>
                      <h3 className="text-lg md:text-xl font-bold">Are you a Landlord?</h3>
                      <p className="text-sm text-indigo-100">Automate your rent collection & tenant management.</p>
                  </div>
              </div>
              <Link 
                  to={authStatus === 'guest' ? '/register' : '/subscribe'}
                  className="flex-shrink-0 bg-white text-indigo-700 font-bold py-2.5 px-6 rounded-xl shadow-md hover:bg-indigo-50 transition-colors text-sm"
              >
                  {authStatus === 'guest' ? 'Get Started' : 'Subscribe Now'}
              </Link>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-800"><span className="text-blue-600">{sortedProperties.length}</span> Properties Found</h2>
            {locationStatus === 'active' && (
              <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">Sorted by nearest</span>
            )}
          </div>
          {favorites.size > 0 && (
            <span className="text-sm text-gray-500">
              <span className="text-red-500 font-semibold">{favorites.size}</span> favorited
            </span>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>Loading properties...</div>
        ) : sortedProperties.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100"><h3 className="text-lg font-semibold text-gray-700">No properties found</h3><p className="text-gray-400 text-sm">Try adjusting your search or filters.</p></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {sortedProperties.map((property) => (
              <PropertyCard 
                key={property.id} 
                property={property} 
                onViewDetails={handleViewDetails}
                isFavorite={favorites.has(property.id)}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        )}

        {selectedProperty && ( <PropertyDetailsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} property={selectedProperty} /> )}
      </div>
    </div>
  );
}