import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import GradientButton from '../components/GradientButton';

export default function AdminLandlords() {
  const [landlords, setLandlords] = useState([]);
  const [, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    company_name: ''
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLandlords();
  }, []);

  const fetchLandlords = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, phone, is_subscribed, landlords(company_name)')
        .eq('role', 'landlord');

      if (error) throw error;
      setLandlords(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleAddLandlord = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // 1️⃣ Create Auth User
      const { data: { user }, error: signUpError } =
        await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              role: 'landlord',
              full_name: formData.full_name,
              phone: formData.phone
            }
          }
        });

      if (signUpError) throw signUpError;

      // 2️⃣ Activate profile
      if (user) {
        await supabase
          .from('profiles')
          .update({ is_subscribed: true })
          .eq('id', user.id);

        // 3️⃣ Insert into landlords table
        await supabase.from('landlords').insert({
          id: user.id,
          company_name: formData.company_name,
          is_verified: true
        });
      }

      alert("Landlord Added Successfully!");
      setFormData({
        email: '',
        password: '',
        full_name: '',
        phone: '',
        company_name: ''
      });

      fetchLandlords();

    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleSubscription = async (userId, currentState) => {
    const newState = !currentState;

    await supabase
      .from('profiles')
      .update({ is_subscribed: newState })
      .eq('id', userId);

    fetchLandlords();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Manage Landlords
      </h1>

      {/* Add New Landlord Form */}
      <div className="bg-white p-6 rounded-xl shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Add New Landlord</h2>

        <form
          onSubmit={handleAddLandlord}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <input
            name="full_name"
            placeholder="Contact Name"
            value={formData.full_name}
            onChange={handleChange}
            className="p-3 border rounded-lg"
            required
          />

          <input
            name="company_name"
            placeholder="Company Name"
            value={formData.company_name}
            onChange={handleChange}
            className="p-3 border rounded-lg"
            required
          />

          <input
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="p-3 border rounded-lg"
            required
          />

          <input
            name="phone"
            placeholder="Phone"
            value={formData.phone}
            onChange={handleChange}
            className="p-3 border rounded-lg"
            required
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="p-3 border rounded-lg"
            required
          />

          <div className="flex items-end">
            <GradientButton
              type="submit"
              className="w-full py-3"
              disabled={saving}
            >
              {saving ? 'Adding...' : 'Add Landlord'}
            </GradientButton>
          </div>
        </form>
      </div>

      {/* Landlords List */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4">Company</th>
              <th className="text-left p-4">Contact</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {landlords.map((landlord) => (
              <tr key={landlord.id} className="border-t">
                <td className="p-4 font-medium">
                  {landlord.landlords?.company_name || 'N/A'}
                </td>

                <td className="p-4">
                  <div>{landlord.full_name}</div>
                  <div className="text-sm text-gray-500">
                    {landlord.email}
                  </div>
                </td>

                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      landlord.is_subscribed
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {landlord.is_subscribed ? 'Active' : 'Inactive'}
                  </span>
                </td>

                <td className="p-4">
                  <button
                    onClick={() =>
                      toggleSubscription(
                        landlord.id,
                        landlord.is_subscribed
                      )
                    }
                    className={`px-3 py-1 rounded text-white text-sm ${
                      landlord.is_subscribed
                        ? 'bg-red-500'
                        : 'bg-green-500'
                    }`}
                  >
                    {landlord.is_subscribed
                      ? 'Deactivate'
                      : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}