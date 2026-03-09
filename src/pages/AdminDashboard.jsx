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
    try {
      // Get counts
      const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
      const { count: landlordCount } = await supabase.from('landlords').select('*', { count: 'exact', head: true });
      const { count: propertyCount } = await supabase.from('properties').select('*', { count: 'exact', head: true });
      const { count: moverCount } = await supabase.from('movers').select('*', { count: 'exact', head: true });

      setStats([
        { title: 'Users', value: userCount || 0, icon: 'fa-users', color: 'border-[#2FA4E7]', bgColor: 'bg-blue-100', iconColor: 'text-[#2FA4E7]' },
        { title: 'Landlords', value: landlordCount || 0, icon: 'fa-user-tie', color: 'border-[#3CB371]', bgColor: 'bg-green-100', iconColor: 'text-[#3CB371]' },
        { title: 'Properties', value: propertyCount || 0, icon: 'fa-home', color: 'border-[#FF9800]', bgColor: 'bg-orange-100', iconColor: 'text-[#FF9800]' },
        { title: 'Movers', value: moverCount || 0, icon: 'fa-truck', color: 'border-[#9C27B0]', bgColor: 'bg-purple-100', iconColor: 'text-[#9C27B0]' },
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

  if (loading) return <div className="p-6">Loading Dashboard...</div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome back, Admin!</h1>
        <p className="text-gray-600">Here's what's happening with your platform today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div 
            key={index}
            className={`bg-white rounded-2xl shadow p-6 border-l-4 ${stat.color} transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-full ${stat.bgColor} flex items-center justify-center`}>
                <i className={`fas ${stat.icon} ${stat.iconColor} text-xl`}></i>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-green-600 font-medium">
                <i className="fas fa-arrow-up mr-1"></i> Updated just now
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Chart & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Platform Activity</h3>
          </div>
          <div className="h-80">
            <Line data={data} options={options} />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Links</h3>
          <div className="space-y-3">
             <a href="/admin/users" className="flex items-center p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <i className="fas fa-users text-blue-500 mr-3"></i>
                <span className="font-medium text-gray-700">Manage Users</span>
             </a>
             <a href="/admin/properties" className="flex items-center p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <i className="fas fa-home text-green-500 mr-3"></i>
                <span className="font-medium text-gray-700">View Properties</span>
             </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;