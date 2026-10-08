/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import { Link } from "react-router-dom";
import AirbnbCard from "../components/AirbnbCard";

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

export default function FindAirbnb() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState('checking');
  const [session, setSession] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [dismissedHouseHint, setDismissedHouseHint] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [feeSettings, setFeeSettings] = useState(null);

  const [filters, setFilters] = useState({
    searchQuery: "", minPrice: "", maxPrice: "", type: "All",
    bedrooms: "Any", bathrooms: "Any", county: "All", constituency: "All"
  });

  const [constituencyOptions, setConstituencyOptions] = useState([]);

  const availableCounties = useMemo(() => {
    return [...new Set(properties.map(p => p.county).filter(Boolean))].sort();
  }, [properties]);

  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([fetchAirbnbs(), fetchFeeSettings()]);

      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);

      if (currentSession) {
        const { data: profile } = await supabase
          .from('airbnb_hosts')
          .select('subscription_status')
          .eq('id', currentSession.user.id)
          .maybeSingle();
        if (profile?.subscription_status === 'active') setAuthStatus('host');
        else if (profile) setAuthStatus('user');
        else setAuthStatus('guest');
      } else {
        setAuthStatus('guest');
      }
    };
    initializeData();
  }, []);

  const fetchAirbnbs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("airbnb_listings")
        .select("*")
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error("Error fetching airbnbs:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeeSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('short_stay_settings')
        .select('fee_type, fee_value')
        .eq('id', 1)
        .maybeSingle();

      if (error) throw error;
      // Use whatever admin configured, or null if not configured
      setFeeSettings(data || null);
    } catch (error) {
      console.error("Error fetching fee settings:", error.message);
      setFeeSettings(null);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === 'county') {
      if (value && value !== 'All') {
        const uniqueConstituencies = [...new Set(properties.filter(p => p.county === value && p.constituency).map(p => p.constituency))].sort();
        setConstituencyOptions(uniqueConstituencies);
      } else { setConstituencyOptions([]); }
      setFilters(prev => ({ ...prev, county: value, constituency: "All" }));
    } else { setFilters(prev => ({ ...prev, [name]: value })); }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) { alert("Geolocation is not supported."); return; }
    setLocationStatus('fetching');
    navigator.geolocation.getCurrentPosition(
      (position) => { setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }); setLocationStatus('active'); },
      () => setLocationStatus('denied'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleToggleFavorite = (propertyId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(propertyId)) newFavorites.delete(propertyId);
    else newFavorites.add(propertyId);
    setFavorites(newFavorites);
  };

  const filteredProperties = properties.filter((p) => {
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      if (!p.name?.toLowerCase().includes(query) && !p.location?.toLowerCase().includes(query)) return false;
    }
    const price = parseFloat(p.price_per_night);
    if (filters.minPrice && price < parseFloat(filters.minPrice)) return false;
    if (filters.maxPrice && price > parseFloat(filters.maxPrice)) return false;
    if (filters.type !== "All" && p.type !== filters.type) return false;
    if (filters.bedrooms !== "Any" && p.bedrooms < parseInt(filters.bedrooms)) return false;
    if (filters.bathrooms !== "Any" && p.bathrooms < parseInt(filters.bathrooms)) return false;
    if (filters.county !== "All" && p.county !== filters.county) return false;
    if (filters.constituency !== "All" && p.constituency !== filters.constituency) return false;
    return true;
  });

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800">
            Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-500">Perfect Airbnb</span>
          </h1>
          <p className="text-gray-500 text-lg">Short-stays and holiday accommodations.</p>
        </div>

        {!dismissedHouseHint && (
          <div className="mb-8 bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-center justify-between text-sm">
            <div className="flex items-center text-teal-800">
              <svg className="w-5 h-5 mr-2 flex-shrink-0 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>Looking for a long-term house instead? <Link to="/find-houses" className="font-bold underline hover:no-underline text-teal-600">Find long-term accommodation →</Link></span>
            </div>
            <button onClick={() => setDismissedHouseHint(true)} className="text-teal-400 hover:text-teal-600 ml-4 flex-shrink-0"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
        )}

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 space-y-4">
          <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div>
             <input type="text" name="searchQuery" value={filters.searchQuery} onChange={handleFilterChange} placeholder="Search by name or location" className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl text-gray-800 focus:border-teal-500 outline-none transition-colors" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div><label className="block text-xs font-semibold text-gray-500 mb-1">County</label><select name="county" value={filters.county} onChange={handleFilterChange} className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:border-teal-500 outline-none bg-white"><option>All</option>{availableCounties.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
             <div><label className="block text-xs font-semibold text-gray-500 mb-1">Constituency</label><select name="constituency" value={filters.constituency} onChange={handleFilterChange} disabled={filters.county === 'All' || constituencyOptions.length === 0} className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:border-teal-500 outline-none bg-white disabled:bg-gray-50"><option>All</option>{constituencyOptions.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
             <div><label className="block text-xs font-semibold text-gray-500 mb-1">Property Type</label><select name="type" value={filters.type} onChange={handleFilterChange} className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:border-teal-500 outline-none bg-white"><option>All</option><option>Entire Apartment</option><option>Private Room</option><option>Shared Room</option><option>Villa</option></select></div>
             <div><label className="block text-xs font-semibold text-gray-500 mb-1">Bedrooms</label><select name="bedrooms" value={filters.bedrooms} onChange={handleFilterChange} className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:border-teal-500 outline-none bg-white"><option>Any</option><option value="1">1+</option><option value="2">2+</option><option value="3">3+</option></select></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><label className="block text-xs font-semibold text-gray-500 mb-1">Min Price/Night (KES)</label><input type="number" name="minPrice" value={filters.minPrice} onChange={handleFilterChange} placeholder="Any" className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:border-teal-500 outline-none" /></div>
              <div><label className="block text-xs font-semibold text-gray-500 mb-1">Max Price/Night (KES)</label><input type="number" name="maxPrice" value={filters.maxPrice} onChange={handleFilterChange} placeholder="Any" className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:border-teal-500 outline-none" /></div>
              <div className="flex items-end">
                <button onClick={handleLocateMe} className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-200 border-2 ${locationStatus === 'active' ? 'bg-teal-50 border-teal-500 text-teal-700' : 'bg-white border-gray-200 text-gray-600 hover:border-teal-400 hover:text-teal-600'}`}>
                  {locationStatus === 'fetching' ? <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                  {locationStatus === 'active' ? 'Location On' : 'Near Me'}
                </button>
              </div>
          </div>
        </div>

        {authStatus !== 'host' && (
          <div className="mb-8 bg-gradient-to-r from-teal-600 to-emerald-700 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between">
              <div className="mb-4 md:mb-0 flex items-center">
                  <div className="bg-white/20 p-3 rounded-xl mr-4 hidden sm:block"><svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                  <div><h3 className="text-lg md:text-xl font-bold">Are you a Host?</h3><p className="text-sm text-teal-100">List your Airbnb or short-stay property today.</p></div>
              </div>
              <Link to={authStatus === 'guest' ? '/register' : '/host'} className="flex-shrink-0 bg-white text-teal-700 font-bold py-2.5 px-6 rounded-xl shadow-md hover:bg-teal-50 transition-colors text-sm">{authStatus === 'guest' ? 'Get Started' : 'Go to Host Dashboard'}</Link>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-800"><span className="text-teal-600">{sortedProperties.length}</span> Airbnbs Found</h2>
            {locationStatus === 'active' && <span className="text-xs font-semibold bg-teal-100 text-teal-700 px-2.5 py-1 rounded-full">Sorted by nearest</span>}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-600 mx-auto mb-4"></div>Loading Airbnbs...</div>
        ) : sortedProperties.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100"><h3 className="text-lg font-semibold text-gray-700">No Airbnbs found</h3><p className="text-gray-400 text-sm">Try adjusting your search or filters.</p></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {sortedProperties.map((property) => (
              <AirbnbCard
                key={property.id}
                airbnb={property}
                onViewDetails={() => {}}
                isFavorite={favorites.has(property.id)}
                onToggleFavorite={handleToggleFavorite}
                feeSettings={feeSettings}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}