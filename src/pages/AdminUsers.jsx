// src/pages/AdminUsers.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(null);

  // --- PAGINATION STATE ---
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const usersPerPage = 10;
  const totalPages = Math.ceil(totalUsers / usersPerPage);

  // --- SEARCH STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(searchQuery);
      setPage(1); // Reset to page 1 on new search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [page, searchDebounce]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const from = (page - 1) * usersPerPage;
      const to = from + usersPerPage - 1;

      let query = supabase
        .from('users')
        .select('id, full_name, phone, email, avatar_url, created_at, role', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      // Apply search filter if there's a query
      if (searchDebounce.trim()) {
        const searchTerm = `%${searchDebounce.trim()}%`;
        query = query.or(`full_name.ilike.${searchTerm},phone.ilike.${searchTerm}`);
      }

      const { data, error: fetchError, count } = await query;
        
      if (fetchError) throw fetchError;
      
      setUsers(data || []);
      setTotalUsers(count || 0);

    } catch (err) {
      console.error("Error fetching users:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, userName) => {
    if (!window.confirm(`Are you sure you want to delete ${userName || 'this user'}?`)) return;

    try {
      const { error: deleteError } = await supabase.from('users').delete().eq('id', id);
      if (deleteError) throw deleteError;
      
      fetchUsers(); 
    } catch (err) {
      console.error("Error deleting user:", err.message);
      alert("Failed to delete user: " + err.message);
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name || '',
      phone: user.phone || '',
      email: user.email || '', 
      role: user.role || 'user',
    });
    setIsEditModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          role: formData.role,
        })
        .eq('id', editingUser.id);

      if (updateError) throw updateError;
      
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...formData } : u));
      setIsEditModalOpen(false);
      setEditingUser(null);
      alert("User updated successfully!");
    } catch (err) {
      console.error("Error updating user:", err.message);
      alert("Failed to update user: " + err.message);
    }
  };

  const goToPage = (p) => {
    if (p >= 1 && p <= totalPages) setPage(p);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchDebounce('');
    setPage(1);
  };

  // Format phone number for display
  const formatPhone = (phone) => {
    if (!phone) return 'N/A';
    // Basic formatting for Kenyan numbers
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('254') && cleaned.length === 12) {
      return `+${cleaned.slice(0,3)} ${cleaned.slice(3,6)} ${cleaned.slice(6,9)} ${cleaned.slice(9)}`;
    }
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      return `+254 ${cleaned.slice(1,4)} ${cleaned.slice(4,7)} ${cleaned.slice(7)}`;
    }
    return phone;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Users Management</h1>
          <p className="text-gray-500 mt-1">
            {searchDebounce 
              ? `Showing results for "${searchDebounce}" (${totalUsers} found)` 
              : `${totalUsers} registered users`
            }
          </p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className="fas fa-search text-gray-400"></i>
          </div>
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <i className="fas fa-users text-blue-600"></i>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{totalUsers}</p>
              <p className="text-xs text-gray-500">Total Users</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <i className="fas fa-phone text-green-600"></i>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {users.filter(u => u.phone).length}
              </p>
              <p className="text-xs text-gray-500">With Phone</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <i className="fas fa-user-shield text-purple-600"></i>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {users.filter(u => u.role === 'admin').length}
              </p>
              <p className="text-xs text-gray-500">Admins</p>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone Number</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-t-blue-600 border-gray-200 rounded-full animate-spin"></div>
                      <p className="text-sm text-gray-500">Loading users...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="6" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                        <i className="fas fa-exclamation-triangle text-red-500"></i>
                      </div>
                      <p className="text-sm text-red-600 font-medium">Failed to load users</p>
                      <button 
                        onClick={fetchUsers}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Try again
                      </button>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <i className="fas fa-user-slash text-gray-400"></i>
                      </div>
                      <p className="text-sm text-gray-500">
                        {searchDebounce ? 'No users match your search' : 'No users registered yet'}
                      </p>
                      {searchDebounce && (
                        <button 
                          onClick={clearSearch}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-blue-50/30 transition-colors">
                    {/* User Name with Avatar */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mr-3 overflow-hidden flex-shrink-0">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-blue-600 font-semibold text-sm">
                              {(user.full_name || 'U').charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {user.full_name || <span className="text-gray-400 italic">No name provided</span>}
                          </div>
                          <div className="text-xs text-gray-400">ID: {user.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    
                    {/* Phone Number - Highlighted */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.phone ? (
                        <div className="flex items-center gap-2">
                          <i className="fas fa-phone text-green-500 text-xs"></i>
                          <span className="text-sm font-medium text-gray-700">{formatPhone(user.phone)}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Not provided</span>
                      )}
                    </td>
                    
                    {/* Email */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.email ? (
                        <span className="text-sm text-gray-600">{user.email}</span>
                      ) : (
                        <span className="text-sm text-gray-400 italic">N/A</span>
                      )}
                    </td>
                    
                    {/* Role */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {user.role === 'admin' && <i className="fas fa-shield-alt mr-1 text-[10px]"></i>}
                        {user.role || 'user'}
                      </span>
                    </td>
                    
                    {/* Joined Date */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString('en-KE', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </td>
                    
                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(user)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <i className="fas fa-pen text-[10px]"></i>
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(user.id, user.full_name)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <i className="fas fa-trash text-[10px]"></i>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-sm text-gray-500">
              Showing {((page - 1) * usersPerPage) + 1} to {Math.min(page * usersPerPage, totalUsers)} of {totalUsers} users
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => goToPage(page - 1)} 
                disabled={page === 1}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <i className="fas fa-chevron-left text-xs"></i>
              </button>
              
              <div className="hidden sm:flex items-center gap-1 mx-2">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        page === pageNum 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={() => goToPage(page + 1)} 
                disabled={page === totalPages}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <i className="fas fa-chevron-right text-xs"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsEditModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Edit User</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Update user information</p>
                </div>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <i className="fas fa-times text-gray-400"></i>
                </button>
              </div>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-5">
              {/* User Preview */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center overflow-hidden">
                  {editingUser?.avatar_url ? (
                    <img src={editingUser.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-blue-600 font-bold">
                      {(editingUser?.full_name || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{editingUser?.full_name || 'No Name'}</p>
                  <p className="text-xs text-gray-400">{editingUser?.email || 'No email'}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                <input 
                  type="text" 
                  name="full_name" 
                  value={formData.full_name || ''} 
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  placeholder="Enter full name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400 text-sm">+254</span>
                  </div>
                  <input 
                    type="tel" 
                    name="phone" 
                    value={formData.phone || ''} 
                    onChange={handleInputChange}
                    className="w-full pl-14 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    placeholder="7XX XXX XXX"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email || ''} 
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                  readOnly 
                />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                <select 
                  name="role" 
                  value={formData.role || 'user'} 
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)} 
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium text-sm transition-colors shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;