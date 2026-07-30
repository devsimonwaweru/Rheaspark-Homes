import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

export default function UserDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Favorites State
  const [favorites, setFavorites] = useState([]);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    const getUserData = async () => {
      try {
        setLoading(true);
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          navigate('/login');
          return;
        }
        setUser(authUser);

        // Fetch normal user profile
        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();
        setProfile(profileData);

        // Fetch saved favorite properties
        const { data: favData, error: favError } = await supabase
          .from('favorites')
          .select('id, created_at, properties(*)')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false });

        if (favError) {
          console.error("Favorites table might not exist yet:", favError.message);
          setFavorites([]);
        } else {
          setFavorites(favData || []);
        }

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    getUserData();
  }, [navigate]);

  const handleRemoveFavorite = async (e, favoriteId) => {
    e.preventDefault();
    e.stopPropagation();
    setRemovingId(favoriteId);
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId);

      if (!error) {
        setFavorites(prev => prev.filter(f => f.id !== favoriteId));
      }
    } catch (err) {
      console.error("Error removing favorite:", err);
    } finally {
      setRemovingId(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const getFirstImage = (property) => {
    const rawData = property.images;
    if (rawData) {
      try {
        if (typeof rawData === 'string' && rawData.startsWith('[')) {
          const parsed = JSON.parse(rawData);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
        }
        if (typeof rawData === 'string' && rawData.startsWith('{')) {
          const matches = rawData.match(/https?:\/\/[^,}]+/g);
          if (matches && matches.length > 0) return matches[0];
        }
      // eslint-disable-next-line no-unused-vars
      } catch (e) {
        if (typeof rawData === 'string' && rawData.includes(',')) {
          const parts = rawData.split(',').map(s => s.trim());
          if (parts.length > 0 && parts[0].startsWith('http')) return parts[0];
        }
      }
    }
    return property.image_url || null;
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || "User";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans relative">
      
      {/* Top Navigation Bar */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold text-blue-900">Rheaspark</Link>
          
          <div className="flex items-center space-x-4">
            <span className="hidden sm:block text-sm text-gray-600">Hi, {displayName}</span>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
            >
              <span className="hidden sm:block">Logout</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l-4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* SAVED PROPERTIES SECTION */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Saved Properties</h2>
              {favorites.length > 0 && (
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2.5 py-0.5 rounded-full">{favorites.length}</span>
              )}
            </div>
            <Link 
              to="/find-houses"
              className="text-sm font-semibold text-blue-600 hover:text-blue-500 hover:underline transition-colors flex items-center gap-1"
            >
              Browse All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5-5m5 5H6" /></svg>
            </Link>
          </div>

          {favorites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favorites.map((fav) => {
                const prop = fav.properties;
                if (!prop) return null;
                const imageUrl = getFirstImage(prop);

                return (
                  <div 
                    key={fav.id}
                    className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col relative"
                  >
                    {/* Remove Button */}
                    <button
                      onClick={(e) => handleRemoveFavorite(e, fav.id)}
                      disabled={removingId === fav.id}
                      className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-wait"
                      title="Remove from favorites"
                    >
                      {removingId === fav.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                      )}
                    </button>

                    <Link to={`/property/${prop.join_code || prop.id}`} className="flex flex-col h-full">
                      {/* Image */}
                      <div className="w-full h-40 flex-shrink-0 bg-gray-100 overflow-hidden">
                        {imageUrl ? (
                          <img src={imageUrl} alt={prop.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                            <svg className="w-10 h-10 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                            <span className="text-[10px] uppercase tracking-wider">No Image</span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4 flex-1 flex flex-col">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">{prop.type}</span>
                          {prop.bedrooms != null && (
                            <span className="text-[10px] text-gray-400 font-medium">{prop.bedrooms === 0 ? 'Studio' : `${prop.bedrooms} Bed`}</span>
                          )}
                        </div>
                        
                        <h3 className="font-bold text-gray-800 text-sm truncate mb-1">{prop.title}</h3>
                        
                        <p className="text-xs text-gray-500 flex items-center gap-1 truncate mb-3">
                          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          {prop.location}
                        </p>

                        <div className="mt-auto pt-3 border-t border-gray-50">
                          <p className="text-lg font-extrabold text-gray-800">KES <span className="text-blue-600">{prop.price?.toLocaleString()}</span></p>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-10 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-600 mb-2">No saved properties yet</h3>
              <p className="text-sm text-gray-400 mb-6 max-w-xs">Tap the heart icon on any listing to save it here for easy access.</p>
              <Link
                to="/find-houses"
                className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                Start Exploring
              </Link>
            </div>
          )}
          
          {/* Divider */}
          <div className="border-t border-gray-200 my-8"></div>
        </div>

        {/* MAIN DASHBOARD CONTENT */}
        <div className="flex flex-col items-center justify-center py-10 bg-white rounded-2xl border border-gray-100 px-6 shadow-sm">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto text-blue-600 text-2xl font-bold mb-4 border-2 border-blue-100">
               {displayName.charAt(0).toUpperCase()}
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Welcome back, {displayName}!
            </h1>
            <p className="text-gray-500 text-sm mb-8">
              Ready to find your next home? Explore our verified listings below.
            </p>

            <Link
              to="/find-houses"
              className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white text-lg font-bold rounded-xl shadow-md hover:bg-blue-700 transition-all transform hover:-translate-y-1 w-full sm:w-auto"
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Find Houses
            </Link>
          </div>
        </div>

      </div>

      {/* Floating Action Button (Mobile Friendly) */}
      <Link 
        to="/find-houses" 
        className="fixed bottom-8 right-8 bg-blue-600 text-white p-5 rounded-full shadow-2xl hover:bg-blue-700 transition-all transform hover:scale-110 z-50 group"
        title="Find Houses"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-sm px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden sm:block">
          Search Homes
        </span>
      </Link>
    </div>
  );
}