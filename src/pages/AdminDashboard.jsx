// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AdminDashboard = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch all counts in parallel for speed
      const [
        usersRes, 
        landlordsRes, 
        propertiesRes, 
        activePropsRes, 
        moversRes
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }).maybeSingle(), // maybeSingle prevents error if table empty
        supabase.from('landlords').select('*', { count: 'exact', head: true }),
        supabase.from('properties').select('*', { count: 'exact', head: true }),
        // Specifically count Active properties (visible on FindHouses)
        supabase.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('movers').select('*', { count: 'exact', head: true }),
      ]);

      setStats([
        { 
          title: 'Total Users', 
          value: usersRes.count || 0, 
          icon: 'fa-users', 
          color: 'border-[#2FA4E7]', 
          bgColor: 'bg-blue-50', 
          iconColor: 'text-[#2FA4E7]' 
        },
        { 
          title: 'Landlords', 
          value: landlordsRes.count || 0, 
          icon: 'fa-user-tie', 
          color: 'border-[#3CB371]', 
          bgColor: 'bg-green-50', 
          iconColor: 'text-[#3CB371]' 
        },
        { 
          title: 'Total Properties', 
          value: propertiesRes.count || 0, 
          icon: 'fa-home', 
          color: 'border-[#FF9800]', 
          bgColor: 'bg-orange-50', 
          iconColor: 'text-[#FF9800]' 
        },
        { 
          // New Stat: Active Properties
          title: 'Active Listings', 
          value: activePropsRes.count || 0, 
          icon: 'fa-check-circle', 
          color: 'border-[#10B981]', 
          bgColor: 'bg-emerald-50', 
          iconColor: 'text-[#10B981]',
          subtitle: 'Visible on site'
        },
        { 
          title: 'Movers', 
          value: moversRes.count || 0, 
          icon: 'fa-truck', 
          color: 'border-[#9C27B0]', 
          bgColor: 'bg-purple-50', 
          iconColor: 'text-[#9C27B0]' 
        },
      ]);
    } catch (error) {
      console.error("Error fetching stats", error);
    } finally {
      setLoading(false);
    }
  };

  const data = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Property Views',
        data: [120, 190, 300, 500, 200, 300, 450],
        borderColor: '#2FA4E7',
        backgroundColor: 'rgba(47, 164, 231, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'User Signups',
        data: [50, 80, 120, 180, 90, 120, 160],
        borderColor: '#3CB371',
        backgroundColor: 'rgba(60, 179, 113, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { usePointStyle: true } },
      title: { display: false },
    },
    scales: {
      y: { beginAtZero: true, grid: { drawBorder: false, color: 'rgba(0, 0, 0, 0.05)' } },
      x: { grid: { display: false } },
    },
  };

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome back, Admin!</h1>
        <p className="text-gray-600">Here's what's happening with your platform today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
        {stats.map((stat, index) => (
          <div 
            key={index}
            className={`bg-white rounded-xl shadow-sm p-5 border-l-4 ${stat.color} transition-all duration-300 hover:shadow-md cursor-pointer`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                {stat.subtitle && <p className="text-[10px] text-gray-400 mt-1">{stat.subtitle}</p>}
              </div>
              <div className={`w-10 h-10 rounded-full ${stat.bgColor} flex items-center justify-center`}>
                <i className={`fas ${stat.icon} ${stat.iconColor} text-lg`}></i>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Platform Activity</h3>
            <select className="text-sm border-0 bg-gray-50 rounded-lg px-3 py-1.5 text-gray-600 focus:ring-2 focus:ring-blue-500">
              <option>This Week</option>
              <option>Last Week</option>
              <option>This Month</option>
            </select>
          </div>
          <div className="h-80">
            <Line data={data} options={options} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="space-y-3">
             <a href="/admin/properties" className="flex items-center p-3 rounded-lg bg-gray-50 hover:bg-blue-50 hover:text-blue-600 transition-colors group">
                <div className="w-8 h-8 rounded bg-white shadow-sm flex items-center justify-center mr-3">
                   <i className="fas fa-home text-gray-400 group-hover:text-blue-600"></i>
                </div>
                <span className="font-medium text-gray-700 group-hover:text-blue-600">Manage Properties</span>
             </a>
             <a href="/admin/users" className="flex items-center p-3 rounded-lg bg-gray-50 hover:bg-blue-50 hover:text-blue-600 transition-colors group">
                <div className="w-8 h-8 rounded bg-white shadow-sm flex items-center justify-center mr-3">
                   <i className="fas fa-users text-gray-400 group-hover:text-blue-600"></i>
                </div>
                <span className="font-medium text-gray-700 group-hover:text-blue-600">Manage Users</span>
             </a>
             <button onClick={() => alert('Feature coming soon')} className="w-full flex items-center p-3 rounded-lg bg-gray-50 hover:bg-blue-50 hover:text-blue-600 transition-colors group">
                <div className="w-8 h-8 rounded bg-white shadow-sm flex items-center justify-center mr-3">
                   <i className="fas fa-cog text-gray-400 group-hover:text-blue-600"></i>
                </div>
                <span className="font-medium text-gray-700 group-hover:text-blue-600">Settings</span>
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;