import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import AddAirbnbModal from '../components/AddAirbnbModal';
import EditAirbnbModal from '../components/EditAirbnbModal';

export default function HostDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Dashboard data
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAirbnb, setSelectedAirbnb] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.id) fetchMyListings(session.user.id);
    });
  }, []);

  const fetchMyListings = async (hostId) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('airbnb_listings')
        .select('*')
        .eq('host_id', hostId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setListings(data || []);
    } catch (err) {
      console.error('Error fetching listings:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (airbnb) => {
    if (!window.confirm(`Delete "${airbnb.name}"? This cannot be undone.`)) return;
    try {
      const { error } = await supabase.from('airbnb_listings').delete().eq('id', airbnb.id);
      if (error) throw error;
      setListings(prev => prev.filter(l => l.id !== airbnb.id));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleEditSave = (updatedData) => {
    setListings(prev => prev.map(l => l.id === selectedAirbnb.id ? { ...l, ...updatedData } : l));
    setSelectedAirbnb(null);
  };

  const toggleStatus = async (airbnb) => {
    const newStatus = airbnb.status === 'active' ? 'draft' : 'active';
    try {
      const { error } = await supabase
        .from('airbnb_listings')
        .update({ status: newStatus })
        .eq('id', airbnb.id);
      if (error) throw error;
      setListings(prev => prev.map(l => l.id === airbnb.id ? { ...l, status: newStatus } : l));
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  // Quick stats
  const activeCount = listings.filter(l => l.status === 'active').length;
  const featuredCount = listings.filter(l => l.featured).length;
  const missingContactCount = listings.filter(l => {
    const info = l.contact_info || {};
    return !info.whatsapp && !info.phone;
  }).length;

  const navLinks = [
    { path: '/host', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/host/listings', label: 'My Listings', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { path: '/host/bookings', label: 'Bookings', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { path: '/landlord', label: 'Landlord Dashboard', icon: 'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z' },
  ];

  const isActive = (path) => {
    if (path === '/host') return location.pathname === '/host';
    return location.pathname.startsWith(path);
  };

  // Render dashboard content when on /host, otherwise render Outlet for sub-routes
  const showDashboard = location.pathname === '/host';

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm flex-shrink-0">
        <div className="p-6 border-b border-gray-100">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-[#2FA4E7] to-[#3CB371] bg-clip-text text-transparent font-['Playfair_Display']">
            Rheaspark
          </Link>
          <p className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wider">Airbnb Host</p>
        </div>

        <div className="p-4">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#2FA4E7] to-[#3CB371] text-white font-semibold py-2.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            List New Airbnb
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200 ${
                isActive(link.path) 
                  ? 'bg-blue-50 text-blue-700 font-semibold' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
              </svg>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#2FA4E7] to-[#3CB371] flex items-center justify-center font-bold text-white shadow-inner">
              {session?.user?.email?.charAt(0).toUpperCase() || 'H'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{session?.user?.email || 'Host'}</p>
              <p className="text-xs text-gray-500">Host Account</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {showDashboard ? (
          <div className="p-6 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Host Dashboard</h1>
                <p className="text-gray-500 mt-1">Welcome back! Here are your Airbnb listings.</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-[#2FA4E7] to-[#3CB371] text-white font-semibold py-2.5 px-5 rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                List New Airbnb
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Listings</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-800">{listings.length}</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Active</span>
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                </div>
                <p className="text-2xl font-bold text-green-600">{activeCount}</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Featured</span>
                  <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                  </div>
                </div>
                <p className="text-2xl font-bold text-yellow-600">{featuredCount}</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Missing Contact</span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${missingContactCount > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                    <svg className={`w-4 h-4 ${missingContactCount > 0 ? 'text-red-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.288a11.043 11.043 0 005.516 5.516l1.288-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </div>
                </div>
                <p className={`text-2xl font-bold ${missingContactCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>{missingContactCount}</p>
              </div>
            </div>

            {/* Missing contact warning */}
            {missingContactCount > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-red-700">
                    {missingContactCount} listing{missingContactCount > 1 ? 's' : ''} missing a WhatsApp number
                  </p>
                  <p className="text-xs text-red-500">
                    Guests can't book without it. Click "Edit" on the listing to add your number.
                  </p>
                </div>
              </div>
            )}

            {/* Listings Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            ) : listings.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-1">No listings yet</h3>
                <p className="text-gray-400 text-sm mb-4">Create your first Airbnb listing to start hosting.</p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#2FA4E7] to-[#3CB371] text-white font-semibold py-2.5 px-5 rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Create Your First Listing
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {listings.map((airbnb) => {
                  const contactInfo = airbnb.contact_info || {};
                  const whatsapp = contactInfo.whatsapp || contactInfo.phone || '';
                  
                  return (
                    <div key={airbnb.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                      {/* Image */}
                      <div className="relative h-44 overflow-hidden">
                        {airbnb.image_url ? (
                          <img src={airbnb.image_url} alt={airbnb.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <span className="text-gray-400 text-sm">No image</span>
                          </div>
                        )}
                        
                        {/* Status badge */}
                        <div className="absolute top-3 left-3">
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-full shadow-md ${
                            airbnb.status === 'active' 
                              ? 'bg-green-500 text-white' 
                              : 'bg-gray-500 text-white'
                          }`}>
                            {airbnb.status === 'active' ? '● Active' : '○ Draft'}
                          </span>
                        </div>

                        {/* Featured badge */}
                        {airbnb.featured && (
                          <div className="absolute top-3 right-3">
                            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-yellow-400 text-yellow-900 shadow-md">
                              ★ Featured
                            </span>
                          </div>
                        )}

                        {/* Missing contact badge */}
                        {!whatsapp && (
                          <div className="absolute bottom-3 left-3">
                            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-500 text-white shadow-md">
                              ⚠ No WhatsApp
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4 flex-grow flex flex-col">
                        <h3 className="font-bold text-gray-800 mb-1 truncate">{airbnb.name}</h3>
                        <p className="text-sm text-gray-500 mb-3 flex items-center">
                          <svg className="w-4 h-4 mr-1 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {airbnb.location || 'No location'}
                        </p>

                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3 border-t border-b border-gray-100 py-2">
                          <span>{airbnb.bedrooms} Bed</span>
                          <span>{airbnb.bathrooms} Bath</span>
                          <span>{airbnb.max_guests} Guests</span>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <span className="text-lg font-bold text-teal-600">KES {airbnb.price_per_night?.toLocaleString()}</span>
                            <span className="text-xs text-gray-400"> / night</span>
                          </div>
                          {whatsapp && (
                            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.149-.197.297-.767.967-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
                              </svg>
                              {whatsapp}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="mt-auto flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedAirbnb(airbnb);
                              setIsEditModalOpen(true);
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-50 text-blue-700 rounded-lg font-semibold text-sm hover:bg-blue-100 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            Edit
                          </button>
                          <button
                            onClick={() => toggleStatus(airbnb)}
                            className="flex items-center justify-center py-2 px-3 bg-gray-50 text-gray-600 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors"
                            title={airbnb.status === 'active' ? 'Set to Draft' : 'Set to Active'}
                          >
                            {airbnb.status === 'active' ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-3.093-9.542-7.939a.949.949 0 010-.122A10.001 10.001 0 0112 5c1.652 0 3.213.4 4.575 1.115M19 5l-7 7m7-7v6m0-6h-6" /></svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(airbnb)}
                            className="flex items-center justify-center py-2 px-3 bg-red-50 text-red-600 rounded-lg font-semibold text-sm hover:bg-red-100 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <Outlet />
        )}
      </main>

      {/* Add Airbnb Modal */}
      <AddAirbnbModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={() => {
          setIsAddModalOpen(false);
          if (session?.user?.id) fetchMyListings(session.user.id);
          navigate('/host');
        }} 
      />

      {/* Edit Airbnb Modal */}
      <EditAirbnbModal 
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedAirbnb(null);
        }}
        airbnb={selectedAirbnb}
        onSave={handleEditSave}
      />
    </div>
  );
}