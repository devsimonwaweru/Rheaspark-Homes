import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import GradientButton from '../components/GradientButton';

export default function AdminMovers() {
  const [movers, setMovers] = useState([]);
  const [, setLoading] = useState(true);
  
  // Form State
  const [formData, setFormData] = useState({ 
    email: '', password: '', business_name: '', phone: '', full_name: '' 
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMovers();
  }, []);

  const fetchMovers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, phone, is_subscribed, movers(business_name)')
        .eq('role', 'mover');
      
      if (error) throw error;
      setMovers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleAddMover = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // 1. Create Auth User (Admin creating user)
      // Note: This signs the admin OUT and signs the new user IN if not handled carefully.
      // Workaround: We will assume "Email Confirmation" is OFF for this flow.
      
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role: 'mover',
            full_name: formData.full_name,
            phone: formData.phone
          }
        }
      });

      if (signUpError) throw signUpError;

      // 2. Update Profile to Active immediately
      if (user) {
        await supabase.from('profiles').update({ 
          is_subscribed: true 
        }).eq('id', user.id);

        // 3. Add to Movers table
        await supabase.from('movers').insert({
          id: user.id,
          business_name: formData.business_name,
          is_verified: true // Admin adds are auto-verified
        });
      }

      alert("Mover Added Successfully!");
      setFormData({ email: '', password: '', business_name: '', phone: '', full_name: '' });
      fetchMovers();
      
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleSubscription = async (userId, currentState) => {
    const newState = !currentState;
    await supabase.from('profiles').update({ is_subscribed: newState }).eq('id', userId);
    fetchMovers();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Manage Movers</h1>

      {/* Add New Mover Form */}
      <div className="bg-white p-6 rounded-xl shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Add New Mover</h2>
        <form onSubmit={handleAddMover} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="full_name" placeholder="Contact Name" value={formData.full_name} onChange={handleChange} className="p-3 border rounded-lg" required />
          <input name="business_name" placeholder="Business Name" value={formData.business_name} onChange={handleChange} className="p-3 border rounded-lg" required />
          <input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} className="p-3 border rounded-lg" required />
          <input name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} className="p-3 border rounded-lg" required />
          <input name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} className="p-3 border rounded-lg" required />
          <div className="flex items-end">
            <GradientButton type="submit" className="w-full py-3" disabled={saving}>
              {saving ? 'Adding...' : 'Add Mover'}
            </GradientButton>
          </div>
        </form>
      </div>

      {/* Movers List */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4">Business</th>
              <th className="text-left p-4">Contact</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {movers.map(mover => (
              <tr key={mover.id} className="border-t">
                <td className="p-4 font-medium">{mover.movers?.business_name || 'N/A'}</td>
                <td className="p-4">
                  <div>{mover.full_name}</div>
                  <div className="text-sm text-gray-500">{mover.email}</div>
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${mover.is_subscribed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {mover.is_subscribed ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-4">
                  <button 
                    onClick={() => toggleSubscription(mover.id, mover.is_subscribed)}
                    className={`px-3 py-1 rounded text-white text-sm ${mover.is_subscribed ? 'bg-red-500' : 'bg-green-500'}`}
                  >
                    {mover.is_subscribed ? 'Deactivate' : 'Activate'}
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