// src/pages/AdminPayments.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('payments');

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 10;
  const totalPages = Math.ceil(total / perPage);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Stats
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalPayments: 0,
    activeSubs: 0,
    pendingPayments: 0,
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(searchQuery);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => { fetchStats(); }, []);
  
  useEffect(() => {
    if (activeTab === 'payments') fetchPayments();
    else fetchSubscriptions();
  }, [page, activeTab, searchDebounce, statusFilter]);

  // --- FIX: Wrapped in individual try/catch blocks instead of broken Promise.all with .catch() ---
  const fetchStats = async () => {
    let totalRevenue = 0, totalPayments = 0, pendingPayments = 0, activeSubs = 0;

    try {
      const { data: revData } = await supabase.from('payments').select('amount').eq('status', 'completed');
      totalRevenue = revData?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;
    } catch (e) { console.error("Stats Rev Error:", e); }

    try {
      const { count } = await supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'completed');
      totalPayments = count || 0;
    } catch (e) {}

    try {
      const { count } = await supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      pendingPayments = count || 0;
    } catch (e) {}

    try {
      // Using actual table name: property_subscriptions
      const { count } = await supabase.from('property_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active');
      activeSubs = count || 0;
    } catch (e) {}

    setStats({ totalRevenue, totalPayments, activeSubs, pendingPayments });
  };

  // --- Manual JS Joins to bypass PostgREST foreign key limits ---
  const enrichPayments = async (data) => {
    if (!data || data.length === 0) return data;
    const userIds = [...new Set(data.map(p => p.user_id).filter(Boolean))];
    if (userIds.length === 0) return data.map(p => ({ ...p, user_data: null }));

    const { data: users } = await supabase.from('users').select('id, full_name, phone, email').in('id', userIds);
    const usersMap = {};
    if (users) users.forEach(u => usersMap[u.id] = u);

    return data.map(p => ({ ...p, user_data: usersMap[p.user_id] || null }));
  };

  const enrichSubscriptions = async (data) => {
    if (!data || data.length === 0) return data;
    const landlordIds = [...new Set(data.map(s => s.landlord_id).filter(Boolean))];
    const propertyIds = [...new Set(data.map(s => s.property_id).filter(Boolean))];

    let landlordsMap = {}, propertiesMap = {};

    if (landlordIds.length > 0) {
      const { data: landlords } = await supabase.from('landlords').select('id, full_name, phone, email').in('id', landlordIds);
      if (landlords) landlords.forEach(l => landlordsMap[l.id] = l);
    }
    if (propertyIds.length > 0) {
      const { data: properties } = await supabase.from('properties').select('id, title').in('id', propertyIds);
      if (properties) properties.forEach(p => propertiesMap[p.id] = p);
    }

    return data.map(s => ({
      ...s,
      landlord_data: landlordsMap[s.landlord_id] || null,
      property_data: propertiesMap[s.property_id] || null
    }));
  };

  const fetchPayments = async () => {
    try {
      setLoading(true); setError(null);
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;

      let userIdsFromSearch = null;
      if (searchDebounce.trim()) {
        const searchTerm = `%${searchDebounce.trim()}%`;
        const { data: matchedUsers } = await supabase.from('users').select('id').or(`full_name.ilike.${searchTerm},phone.ilike.${searchTerm}`);
        if (matchedUsers && matchedUsers.length > 0) userIdsFromSearch = matchedUsers.map(u => u.id);
        else { setPayments([]); setTotal(0); setLoading(false); return; }
      }

      let query = supabase.from('payments').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(from, to);
      if (statusFilter !== 'all') query = query.eq('status', statusFilter);
      if (userIdsFromSearch) query = query.in('user_id', userIdsFromSearch);

      const { data, error: fetchError, count } = await query;
      if (fetchError) throw fetchError;
      
      const enrichedData = await enrichPayments(data);
      setPayments(enrichedData || []);
      setTotal(count || 0);
    } catch (err) {
      console.error("Error fetching payments:", err);
      setError(err.message);
    } finally { setLoading(false); }
  };

  const fetchSubscriptions = async () => {
    try {
      setLoading(true); setError(null);
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;

      let landlordIdsFromSearch = null;
      if (searchDebounce.trim()) {
        const searchTerm = `%${searchDebounce.trim()}%`;
        const { data: matchedLandlords } = await supabase.from('landlords').select('id').or(`full_name.ilike.${searchTerm},phone.ilike.${searchTerm}`);
        if (matchedLandlords && matchedLandlords.length > 0) landlordIdsFromSearch = matchedLandlords.map(l => l.id);
        else { setSubscriptions([]); setTotal(0); setLoading(false); return; }
      }

      // Using actual table name: property_subscriptions
      let query = supabase.from('property_subscriptions').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(from, to);
      if (statusFilter !== 'all') query = query.eq('status', statusFilter);
      if (landlordIdsFromSearch) query = query.in('landlord_id', landlordIdsFromSearch);

      const { data, error: fetchError, count } = await query;
      if (fetchError) throw fetchError;
      
      const enrichedData = await enrichSubscriptions(data);
      setSubscriptions(enrichedData || []);
      setTotal(count || 0);
    } catch (err) {
      console.error("Error fetching subscriptions:", err);
      setError(err.message);
    } finally { setLoading(false); }
  };

  const goToPage = (p) => { if (p >= 1 && p <= totalPages) setPage(p); };
  
  const handleTabChange = (tab) => {
    setActiveTab(tab); setPage(1); setStatusFilter('all'); setSearchQuery(''); setSearchDebounce('');
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-700', active: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700', failed: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-600', expired: 'bg-gray-200 text-gray-700',
      paid: 'bg-green-100 text-green-700'
    };
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-600';
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount || 0);
  
  const clearFilters = () => { setSearchQuery(''); setSearchDebounce(''); setStatusFilter('all'); setPage(1); };
  const hasActiveFilters = searchDebounce || statusFilter !== 'all';
  const isMissingTable = error?.toLowerCase().includes('does not exist') || error?.toLowerCase().includes('could not find the table');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Payments & Subscriptions</h1>
          <p className="text-gray-500 mt-1">Track revenue, M-Pesa transactions, and property subscriptions</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: 'fa-money-bill-wave', color: 'border-l-green-500', bg: 'bg-green-50', text: 'text-green-600' },
          { title: 'Completed Payments', value: stats.totalPayments, icon: 'fa-credit-card', color: 'border-l-blue-500', bg: 'bg-blue-50', text: 'text-blue-600' },
          { title: 'Active Subscriptions', value: stats.activeSubs, icon: 'fa-crown', color: 'border-l-purple-500', bg: 'bg-purple-50', text: 'text-purple-600' },
          { title: 'Pending Payments', value: stats.pendingPayments, icon: 'fa-clock', color: 'border-l-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-600' },
        ].map((stat, i) => (
          <div key={i} className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 border-l-4 ${stat.color}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-full ${stat.bg} flex items-center justify-center`}>
                <i className={`fas ${stat.icon} ${stat.text}`}></i>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Tabs & Filters */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
              <button onClick={() => handleTabChange('payments')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'payments' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <i className="fas fa-credit-card mr-2 text-xs"></i>Payments
              </button>
              <button onClick={() => handleTabChange('subscriptions')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'subscriptions' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <i className="fas fa-crown mr-2 text-xs"></i>Property Subs
              </button>
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><i className="fas fa-search text-gray-400 text-xs"></i></div>
                <input type="text" placeholder={activeTab === 'payments' ? "Search user..." : "Search landlord..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white" />
                {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"><i className="fas fa-times text-xs"></i></button>}
              </div>
              
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="all">All Status</option>
                {activeTab === 'payments' ? (
                  <><option value="completed">Completed</option><option value="pending">Pending</option><option value="failed">Failed</option></>
                ) : (
                  <><option value="active">Active</option><option value="expired">Expired</option><option value="cancelled">Cancelled</option></>
                )}
              </select>

              {hasActiveFilters && <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-medium whitespace-nowrap">Clear all</button>}
            </div>
          </div>
        </div>

        {/* Table Area */}
        <div className="overflow-x-auto">
          {activeTab === 'payments' ? (
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Reference</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan="6" className="text-center py-16"><div className="w-8 h-8 border-2 border-t-blue-600 border-gray-200 rounded-full animate-spin mx-auto"></div></td></tr>
                ) : isMissingTable ? (
                  <tr><td colSpan="6" className="text-center py-16 text-orange-500"><i className="fas fa-database text-4xl mb-3 block"></i><p className="font-medium text-gray-700">Table Not Found</p><p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">The <code className="bg-gray-100 px-1.5 py-0.5 rounded">payments</code> table is missing.</p></td></tr>
                ) : error ? (
                  <tr><td colSpan="6" className="text-center py-16 text-red-500"><i className="fas fa-exclamation-triangle text-4xl mb-3 block"></i><p className="font-medium">Failed to load</p><button onClick={fetchPayments} className="text-sm text-blue-600 hover:underline mt-2">Retry</button></td></tr>
                ) : payments.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-16 text-gray-400"><i className="fas fa-inbox text-4xl mb-3 block"></i><p className="font-medium">{hasActiveFilters ? 'No matches' : 'No payments yet'}</p></td></tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                           <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center mr-3 flex-shrink-0">
                              <span className="text-blue-600 font-semibold text-xs">{(p.user_data?.full_name || 'U').charAt(0).toUpperCase()}</span>
                           </div>
                           <div>
                              <div className="font-medium text-gray-900 text-sm">{p.user_data?.full_name || 'Unknown User'}</div>
                              <div className="text-xs text-gray-400">{p.user_data?.phone || p.phone || 'N/A'}</div>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">{p.type?.replace('_', ' ') || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">{formatCurrency(p.amount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">{p.reference || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(p.status)}`}>{p.status}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(p.created_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Landlord</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Property</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Expires</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan="5" className="text-center py-16"><div className="w-8 h-8 border-2 border-t-blue-600 border-gray-200 rounded-full animate-spin mx-auto"></div></td></tr>
                ) : isMissingTable ? (
                  <tr><td colSpan="5" className="text-center py-16 text-orange-500"><i className="fas fa-database text-4xl mb-3 block"></i><p className="font-medium text-gray-700">Table Not Found</p><p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">The <code className="bg-gray-100 px-1.5 py-0.5 rounded">property_subscriptions</code> table is missing.</p></td></tr>
                ) : error ? (
                  <tr><td colSpan="5" className="text-center py-16 text-red-500"><i className="fas fa-exclamation-triangle text-4xl mb-3 block"></i><p className="font-medium">Failed to load</p><button onClick={fetchSubscriptions} className="text-sm text-blue-600 hover:underline mt-2">Retry</button></td></tr>
                ) : subscriptions.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-16 text-gray-400"><i className="fas fa-inbox text-4xl mb-3 block"></i><p className="font-medium">{hasActiveFilters ? 'No matches' : 'No subscriptions yet'}</p></td></tr>
                ) : (
                  subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                           <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center mr-3 flex-shrink-0">
                              <span className="text-purple-600 font-semibold text-xs">{(sub.landlord_data?.full_name || 'L').charAt(0).toUpperCase()}</span>
                           </div>
                           <div>
                              <div className="font-medium text-gray-900 text-sm">{sub.landlord_data?.full_name || 'Unknown Landlord'}</div>
                              <div className="text-xs text-gray-400">{sub.landlord_data?.phone || 'N/A'}</div>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <span className="bg-gray-100 px-2 py-1 rounded-md font-medium">{sub.property_data?.title || 'Unknown Property'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(sub.status)}`}>{sub.status}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(sub.created_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/30">
            <p className="text-sm text-gray-500">Showing {((page - 1) * perPage) + 1} to {Math.min(page * perPage, total)} of {total}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 bg-white shadow-sm hover:bg-gray-50"><i className="fas fa-chevron-left text-xs"></i></button>
              <div className="hidden sm:flex items-center gap-1 mx-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                  return (<button key={pageNum} onClick={() => goToPage(pageNum)} className={`w-8 h-8 rounded-lg text-sm font-medium ${page === pageNum ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-gray-100 text-gray-600 bg-white'}`}>{pageNum}</button>);
                })}
              </div>
              <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 bg-white shadow-sm hover:bg-gray-50"><i className="fas fa-chevron-right text-xs"></i></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPayments;