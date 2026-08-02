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

  const [stats, setStats] = useState({ totalRevenue: 0, totalPaid: 0, totalProperties: 0 });

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(searchQuery);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { fetchPayments(); }, [page, searchDebounce, statusFilter]);

  const fetchStats = async () => {
    try {
      const { data } = await supabase.from('payments').select('amount, property_id').eq('status', 'paid');
      const totalRevenue = data?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;
      const uniqueProperties = [...new Set(data?.map(p => p.property_id).filter(Boolean))];
      setStats({ totalRevenue, totalPaid: data?.length || 0, totalProperties: uniqueProperties.length });
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
          const res = await q;
          if (res.data) data = [...data, ...res.data];
        }

        if (pIds.length > 0) {
          let q = supabase.from('payments').select('*').in('property_id', pIds).order('created_at', { ascending: false });
          if (statusFilter !== 'all') q = q.eq('status', statusFilter);
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
        
        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }

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

      // --- ENRICHMENT ---
      const userIds = [...new Set(data.map(p => p.user_id).filter(Boolean))];
      const propertyIds = [...new Set(data.map(p => p.property_id).filter(Boolean))];

      let userMap = {};
      if (userIds.length > 0) {
        const { data: users } = await supabase.from('users').select('id, full_name, phone').in('id', userIds);
        if (users) users.forEach(u => { userMap[u.id] = u; });
      }

      let propMap = {};
      let landlordIds = [];
      if (propertyIds.length > 0) {
        // ✅ FIX: Fetch landlord_phone directly from the properties table too
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

      // Map data together with smart phone logic
      const enrichedData = data.map(p => {
        const propData = propMap[p.property_id];
        let displayPhone = 'N/A';
        let secondaryPhone = null;

        if (propData) {
          const propPhone = propData.landlord_phone?.trim();
          const mainLandlordPhone = landlordMap[propData.landlord_id]?.phone?.trim();

          // Prioritize the phone attached directly to the property listing
          if (propPhone) {
            displayPhone = propPhone;
            // If the landlord has a different main number, save it as a backup
            if (mainLandlordPhone && mainLandlordPhone !== propPhone) {
              secondaryPhone = mainLandlordPhone;
            }
          } else if (mainLandlordPhone) {
            // Fallback to the landlord's main profile phone
            displayPhone = mainLandlordPhone;
          }
        }

        return {
          ...p,
          user_data: userMap[p.user_id] || null,
          property_data: propData ? {
            title: propData.title,
            landlord_phone: displayPhone,
            secondary_phone: secondaryPhone
          } : null
        };
      });

      // Group by Property ID
      const groups = {};
      enrichedData.forEach(p => {
        const key = p.property_id || 'unknown-property';
        if (!groups[key]) {
          groups[key] = {
            property_title: p.property_data?.title || 'Unknown Property',
            landlord_phone: p.property_data?.landlord_phone || 'N/A',
            secondary_phone: p.property_data?.secondary_phone || null,
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
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Paid Property Unlocks</h1>
        <p className="text-gray-500 mt-1">Grouped by property showing customers and landlord contacts</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 border-l-4 border-l-green-500">
          <p className="text-xs text-gray-500 uppercase font-semibold">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(stats.totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 border-l-4 border-l-blue-500">
          <p className="text-xs text-gray-500 uppercase font-semibold">Total Paid Transactions</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalPaid}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 border-l-4 border-l-purple-500">
          <p className="text-xs text-gray-500 uppercase font-semibold">Properties Unlocked</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalProperties}</p>
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
        
        <div className="flex gap-2">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="paid">Paid Only</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="all">All Status</option>
          </select>
          
          {(searchDebounce || statusFilter !== 'paid') && (
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
          <p className="font-medium">No paid unlocks found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.values(groupedPayments).map((group) => (
            <div key={group.property_title} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              
              {/* Property Header */}
              <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-building text-blue-600"></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{group.property_title}</h3>
                    <p className="text-xs text-gray-500">{group.payments.length} unlock{group.payments.length > 1 ? 's' : ''} purchased</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                  <i className="fas fa-user-tie text-purple-500 text-sm"></i>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-semibold leading-tight">Listing Contact</p>
                    <p className="text-sm font-bold text-purple-700">{group.landlord_phone}</p>
                    {group.secondary_phone && (
                      <p className="text-[10px] text-gray-500 leading-tight mt-0.5">Alt/Main: {group.secondary_phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Customer List Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Phone Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount Paid</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">M-Pesa Ref</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {group.payments.map((p) => (
                      <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {p.user_data?.phone || p.phone || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-700">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {p.reference || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(p.created_at).toLocaleDateString('en-KE', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </td>
                      </tr>
                    ))}
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