import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    movers: 0,
    landlords: 0,
    active: 0,
    inactive: 0
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) {
      console.error(error);
      return;
    }

    setUsers(data || []);

    // Calculate Stats
    const total = data.length;
    const movers = data.filter(u => u.role === 'mover').length;
    const landlords = data.filter(u => u.role === 'landlord').length;
    const active = data.filter(u => u.is_subscribed).length;
    const inactive = data.filter(u => !u.is_subscribed).length;

    setStats({ total, movers, landlords, active, inactive });
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        Admin Dashboard
      </h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-10">

        <StatCard title="Total Users" value={stats.total} color="blue" />
        <StatCard title="Movers" value={stats.movers} color="green" />
        <StatCard title="Landlords" value={stats.landlords} color="purple" />
        <StatCard title="Active" value={stats.active} color="emerald" />
        <StatCard title="Inactive" value={stats.inactive} color="red" />

      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">All Users</h2>
        </div>

        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Email</th>
              <th className="text-left p-4">Role</th>
              <th className="text-left p-4">Status</th>
            </tr>
          </thead>

          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-t">
                <td className="p-4 font-medium">
                  {user.full_name || 'N/A'}
                </td>

                <td className="p-4 text-gray-600">
                  {user.email}
                </td>

                <td className="p-4 capitalize">
                  {user.role}
                </td>

                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      user.is_subscribed
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {user.is_subscribed ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}

            {users.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center p-6 text-gray-400">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* Reusable Stat Card */
function StatCard({ title, value, color }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    purple: 'bg-purple-100 text-purple-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    red: 'bg-red-100 text-red-700'
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow border">
      <p className="text-sm text-gray-500">{title}</p>
      <h3 className={`text-2xl font-bold mt-2 px-3 py-1 inline-block rounded ${colors[color]}`}>
        {value}
      </h3>
    </div>
  );
}