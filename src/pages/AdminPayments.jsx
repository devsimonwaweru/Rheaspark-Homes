/* eslint-disable no-unused-vars */
// src/pages/AdminPayments.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AdminPayments = () => {
  const [groupedPayments, setGroupedPayments] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 50;
  const totalPages = Math.ceil(total / perPage);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [statusFilter, setStatusFilter] = useState('paid');
  const [typeFilter, setTypeFilter] = useState('all'); // all, unlock, airbnb_booking

  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalPaid: 0,
    totalUnlocks: 0,
    totalAirbnbBookings: 0,
    airbnbRevenue: 0,
    unlockRevenue: 0,
  });

  // IntaSend verification state
  const [verifying, setVerifying] = useState(null);
  const [verifyResults, setVerifyResults] = useState({});

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(searchQuery);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { fetchPayments(); }, [page, searchDebounce, statusFilter, typeFilter]);

  const fetchStats = async () => {
    try {
      const { data } = await supabase.from('payments').select('amount, type, property_id').eq('status', 'paid');
      const totalRevenue = data?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;
      const uniqueProperties = [...new Set(data?.filter(p => p.type !== 'airbnb_booking').map(p => p.property_id).filter(Boolean))];

      const unlockPayments = data?.filter(p => p.type !== 'airbnb_booking') || [];
      const airbnbPayments = data?.filter(p => p.type === 'airbnb_booking') || [];

      const unlockRevenue = unlockPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      const airbnbRevenue = airbnbPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

      setStats({
        totalRevenue,
        totalPaid: data?.length || 0,
        totalUnlocks: unlockPayments.length,
        totalAirbnbBookings: airbnbPayments.length,
        unlockRevenue,
        airbnbRevenue,
        totalProperties: uniqueProperties.length,
      });
    } catch (e) { console.error("Stats error:", e); }
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      let data = [];
      let count = 0;

      if (searchDebounce.trim()) {
        const searchTerm = `%${searchDebounce.trim()}%`;

        const { data: users } = await supabase.from('users').select('id').or(`full_name.ilike.${searchTerm},phone.ilike.${searchTerm}`);
        const { data: props } = await supabase.from('properties').select('id').ilike('title', searchTerm);

        const uIds = users?.map(u => u.id) || [];
        const pIds = props?.map(p => p.id) || [];

        if (uIds.length > 0) {
          let q = supabase.from('payments').select('*').in('user_id', uIds).order('created_at', { ascending: false });
          if (statusFilter !== 'all') q = q.eq('status', statusFilter);
          if (typeFilter !== 'all') q = q.eq('type', typeFilter);
          const res = await q;
          if (res.data) data = [...data, ...res.data];
        }

        if (pIds.length > 0) {
          let q = supabase.from('payments').select('*').in('property_id', pIds).order('created_at', { ascending: false });
          if (statusFilter !== 'all') q = q.eq('status', statusFilter);
          if (typeFilter !== 'all') q = q.eq('type', typeFilter);
          const res = await q;
          if (res.data) {
            const existingIds = new Set(data.map(d => d.id));
            const uniqueNew = res.data.filter(d => !existingIds.has(d.id));
            data = [...data, ...uniqueNew];
          }
        }

        data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        count = data.length;
      } else {
        let query = supabase.from('payments').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range((page - 1) * perPage, (page - 1) * perPage + perPage - 1);

        if (statusFilter !== 'all') query = query.eq('status', statusFilter);
        if (typeFilter !== 'all') query = query.eq('type', typeFilter);

        const { data: resData, error: fetchError, count: resCount } = await query;
        if (fetchError) throw fetchError;

        data = resData || [];
        count = resCount || 0;
      }

      if (!data || data.length === 0) {
        setGroupedPayments({});
        setTotal(count);
        return;
      }

      // --- PARSE NOTES JSON FOR AIRBNB BOOKINGS ---
      data = data.map(p => {
        let parsedNotes = null;
        if (p.notes) {
          try {
            parsedNotes = typeof p.notes === 'string' ? JSON.parse(p.notes) : p.notes;
          } catch (e) {
            // notes might be a plain string, not JSON
            parsedNotes = null;
          }
        }
        return { ...p, parsed_notes: parsedNotes };
      });

      // --- ENRICHMENT ---
      const userIds = [...new Set(data.map(p => p.user_id).filter(Boolean))];
      const propertyIds = [...new Set(data.filter(p => p.type !== 'airbnb_booking').map(p => p.property_id).filter(Boolean))];

      let userMap = {};
      if (userIds.length > 0) {
        const { data: users } = await supabase.from('users').select('id, full_name, phone').in('id', userIds);
        if (users) users.forEach(u => { userMap[u.id] = u; });
      }

      let propMap = {};
      let landlordIds = [];
      if (propertyIds.length > 0) {
        const { data: properties } = await supabase.from('properties').select('id, title, landlord_id, landlord_phone').in('id', propertyIds);
        if (properties) {
          properties.forEach(p => {
            propMap[p.id] = p;
            if (p.landlord_id) landlordIds.push(p.landlord_id);
          });
        }
      }

      let landlordMap = {};
      landlordIds = [...new Set(landlordIds)];
      if (landlordIds.length > 0) {
        const { data: landlords } = await supabase.from('landlords').select('id, phone').in('id', landlordIds);
        if (landlords) landlords.forEach(l => { landlordMap[l.id] = l; });
      }

      // --- BUILD ENRICHED DATA ---
      const enrichedData = data.map(p => {
        const isAirbnb = p.type === 'airbnb_booking';
        const notes = p.parsed_notes || {};

        if (isAirbnb) {
          // Airbnb booking — get details from notes JSON
          return {
            ...p,
            user_data: userMap[p.user_id] || null,
            group_title: notes.airbnb_name || 'Airbnb Listing',
            group_key: notes.airbnb_id || p.id,
            display_phone: p.phone || userMap[p.user_id]?.phone || 'N/A',
            listing_type: 'airbnb',
            intasend_invoice: p.invoice_id || 'N/A',
            airbnb_fee_type: notes.fee_type || null,
            airbnb_fee_value: notes.fee_value || null,
            airbnb_price_per_night: notes.price_per_night || null,
          };
        } else {
          // Property unlock
          const propData = propMap[p.property_id];
          let displayPhone = 'N/A';
          let secondaryPhone = null;

          if (propData) {
            const propPhone = propData.landlord_phone?.trim();
            const mainLandlordPhone = landlordMap[propData.landlord_id]?.phone?.trim();

            if (propPhone) {
              displayPhone = propPhone;
              if (mainLandlordPhone && mainLandlordPhone !== propPhone) {
                secondaryPhone = mainLandlordPhone;
              }
            } else if (mainLandlordPhone) {
              displayPhone = mainLandlordPhone;
            }
          }

          return {
            ...p,
            user_data: userMap[p.user_id] || null,
            group_title: propData?.title || 'Unknown Property',
            group_key: p.property_id || 'unknown',
            display_phone: displayPhone,
            secondary_phone: secondaryPhone,
            listing_type: 'property',
            intasend_invoice: p.invoice_id || 'N/A',
          };
        }
      });

      // --- GROUP BY listing (property or airbnb) ---
      const groups = {};
      enrichedData.forEach(p => {
        const key = p.group_key;
        if (!groups[key]) {
          groups[key] = {
            group_title: p.group_title,
            listing_type: p.listing_type,
            landlord_phone: p.display_phone,
            secondary_phone: p.secondary_phone || null,
            intasend_invoice: p.intasend_invoice,
            payments: []
          };
        }
        groups[key].payments.push(p);
      });

      setGroupedPayments(groups);
      setTotal(count);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- VERIFY WITH INTASEND ---
  const verifyWithIntaSend = async (paymentId) => {
    setVerifying(paymentId);
    try {
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-payment`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ paymentId }),
        }
      );

      const data = await response.json();

      setVerifyResults(prev => ({
        ...prev,
        [paymentId]: {
          status: data.status,
          source: data.source,
          intasend_status: data.intasend_status || 'N/A',
          checked_at: new Date().toISOString(),
        }
      }));

      // Refresh the list after verification
      if (data.status && data.status !== 'pending') {
        setTimeout(() => fetchPayments(), 1000);
      }
    } catch (err) {
      console.error('Verify error:', err);
      setVerifyResults(prev => ({
        ...prev,
        [paymentId]: { error: err.message, checked_at: new Date().toISOString() }
      }));
    } finally {
      setVerifying(null);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount || 0);
  };

  const goToPage = (p) => {
    if (p >= 1 && p <= totalPages) setPage(p);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSearchDebounce('');
    setStatusFilter('paid');
    setTypeFilter('all');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Payments</h1>
        <p className="text-gray-500 mt-1">All successful payments including property unlocks and Airbnb bookings</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 border-l-4 border-l-green-500">
          <p className="text-xs text-gray-500 uppercase font-semibold">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(stats.totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 border-l-4 border-l-blue-500">
          <p className="text-xs text-gray-500 uppercase font-semibold">Total Paid</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalPaid}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 border-l-4 border-l-teal-500">
          <p className="text-xs text-gray-500 uppercase font-semibold">Airbnb Bookings</p>
          <p className="text-lg font-bold text-gray-800 mt-1">{stats.totalAirbnbBookings}</p>
          <p className="text-xs text-teal-600">{formatCurrency(stats.airbnbRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 border-l-4 border-l-purple-500">
          <p className="text-xs text-gray-500 uppercase font-semibold">Property Unlocks</p>
          <p className="text-lg font-bold text-gray-800 mt-1">{stats.totalUnlocks}</p>
          <p className="text-xs text-purple-600">{formatCurrency(stats.unlockRevenue)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className="fas fa-search text-gray-400 text-xs"></i>
          </div>
          <input
            type="text"
            placeholder="Search by customer name, phone, or property title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
              <i className="fas fa-times text-xs"></i>
            </button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="all">All Types</option>
            <option value="airbnb_booking">Airbnb Bookings</option>
            <option value="unlock">Property Unlocks</option>
          </select>

          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="paid">Paid Only</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="all">All Status</option>
          </select>

          {(searchDebounce || statusFilter !== 'paid' || typeFilter !== 'all') && (
            <button onClick={clearFilters} className="px-3 py-2.5 text-sm text-red-500 hover:text-red-700 font-medium whitespace-nowrap border border-red-200 rounded-lg hover:bg-red-50">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border p-16 flex justify-center">
          <div className="w-10 h-10 border-4 border-t-blue-600 border-gray-200 rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl shadow-sm border p-16 text-center text-red-500">
          <i className="fas fa-exclamation-triangle text-4xl mb-3 block"></i>
          <p className="font-medium">Failed to load</p>
          <p className="text-sm text-gray-400 mt-1">{error}</p>
          <button onClick={fetchPayments} className="text-sm text-blue-600 hover:underline mt-2">Retry</button>
        </div>
      ) : Object.keys(groupedPayments).length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border p-16 text-center text-gray-400">
          <i className="fas fa-inbox text-4xl mb-3 block"></i>
          <p className="font-medium">No payments found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.values(groupedPayments).map((group) => (
            <div key={group.group_title + group.listing_type} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

              {/* Group Header */}
              <div className="border-b border-gray-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                style={{ background: group.listing_type === 'airbnb' ? '#f0fdfa' : '#f9fafb' }}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${group.listing_type === 'airbnb' ? 'bg-teal-100' : 'bg-blue-100'}`}>
                    <i className={`fas ${group.listing_type === 'airbnb' ? 'fa-bed' : 'fa-building'} ${group.listing_type === 'airbnb' ? 'text-teal-600' : 'text-blue-600'}`}></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{group.group_title}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${group.listing_type === 'airbnb' ? 'bg-teal-200 text-teal-800' : 'bg-blue-200 text-blue-800'}`}>
                        {group.listing_type === 'airbnb' ? 'AIRBNB BOOKING' : 'PROPERTY UNLOCK'}
                      </span>
                      <p className="text-xs text-gray-500">{group.payments.length} payment{group.payments.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Contact phone */}
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                    <i className={`fas fa-phone text-sm ${group.listing_type === 'airbnb' ? 'text-teal-500' : 'text-purple-500'}`}></i>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-semibold leading-tight">Contact</p>
                      <p className={`text-sm font-bold ${group.listing_type === 'airbnb' ? 'text-teal-700' : 'text-purple-700'}`}>{group.landlord_phone}</p>
                      {group.secondary_phone && (
                        <p className="text-[10px] text-gray-500 leading-tight mt-0.5">Alt: {group.secondary_phone}</p>
                      )}
                    </div>
                  </div>

                  {/* IntaSend invoice ID */}
                  {group.intasend_invoice !== 'N/A' && (
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                      <i className="fas fa-receipt text-gray-400 text-sm"></i>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-semibold leading-tight">IntaSend</p>
                        <p className="text-xs font-mono text-gray-600">{String(group.intasend_invoice).substring(0, 20)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer List Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Reference</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">IntaSend Invoice</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Verify</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {group.payments.map((p) => {
                      const verifyResult = verifyResults[p.id];
                      const isVerifying = verifying === p.id;

                      return (
                        <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 flex-shrink-0">
                                <span className="text-gray-600 font-semibold text-xs">
                                  {(p.user_data?.full_name || 'U').charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="font-medium text-gray-900 text-sm">
                                {p.user_data?.full_name || 'Guest User'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {p.user_data?.phone || p.phone || 'N/A'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-green-700">
                            {formatCurrency(p.amount)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {p.reference ? String(p.reference).substring(0, 25) : 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-xs font-mono bg-indigo-50 text-indigo-600 px-2 py-1 rounded">
                              {p.invoice_id ? String(p.invoice_id).substring(0, 20) : 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              p.status === 'paid' ? 'bg-green-100 text-green-700' :
                              p.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                              p.status === 'failed' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {p.status}
                            </span>
                            {/* Show verify result if checked */}
                            {verifyResult && (
                              <div className="mt-1 text-[10px] text-gray-400">
                                {verifyResult.error ? (
                                  <span className="text-red-500">Error: {verifyResult.error}</span>
                                ) : (
                                  <span>
                                    IntaSend: {verifyResult.intasend_status || verifyResult.status}
                                    {verifyResult.source && ` (${verifyResult.source})`}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(p.created_at).toLocaleDateString('en-KE', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button
                              onClick={() => verifyWithIntaSend(p.id)}
                              disabled={isVerifying}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                isVerifying
                                  ? 'bg-gray-100 text-gray-400'
                                  : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200'
                              }`}
                              title="Query IntaSend for the latest payment status"
                            >
                              {isVerifying ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                                  Checking...
                                </>
                              ) : (
                                <>
                                  <i className="fas fa-sync-alt text-[10px]"></i>
                                  Verify
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm disabled:opacity-40 bg-white hover:bg-gray-50"
          >
            Prev
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm disabled:opacity-40 bg-white hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminPayments;