import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import TenantManagerModal from '../components/TenantManagerModal'; // We will create this next

export default function LandlordRentals() {
  const [properties, setProperties] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Properties
      const { data: propsData } = await supabase
        .from('properties')
        .select('id, title, image_url, location')
        .eq('landlord_id', user.id)
        .order('created_at', { ascending: false });

      if (propsData) setProperties(propsData);

      // 2. Fetch Active Subscriptions for these properties
      if (propsData && propsData.length > 0) {
        const propIds = propsData.map(p => p.id);
        const { data: subsData } = await supabase
          .from('property_subscriptions')
          .select('*')
          .in('property_id', propIds);
        
        setSubscriptions(subsData || []);
      }
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setLoading(false);
    }
  };

  // Check if property subscription is valid
  const getSubscriptionStatus = (propertyId) => {
    const sub = subscriptions.find(s => s.property_id === propertyId);
    if (!sub) return { active: false };
    
    const isExpired = new Date(sub.expires_at) < new Date();
    if (sub.status === 'active' && !isExpired) {
      return { active: true, expires: sub.expires_at };
    }
    return { active: false };
  };

  // Handle Subscribe Button
  const handleSubscribe = async (property) => {
    const confirm = window.confirm(
      `Activate Rental Management for "${property.title}"?\n\n` +
      `Cost: KES 1,199/month\n` +
      `First month is FREE (Demo).`
    );
    if (!confirm) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // 1. Create Payment Record (Optional - for your records)
      await supabase.from('payments').insert({
        user_id: user.id,
        property_id: property.id,
        type: 'rental_subscription',
        amount: 0, // 0 for first month demo
        phone: 'N/A',
        status: 'COMPLETED'
      });

      // 2. Activate Subscription in property_subscriptions
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      const { error } = await supabase
        .from('property_subscriptions')
        .insert({
          property_id: property.id,
          landlord_id: user.id,
          status: 'active',
          expires_at: expiresAt.toISOString()
        });

      if (error) throw error;
      
      alert('Success! Management activated for 1 month.');
      fetchData(); // Refresh UI
    } catch (err) {
      alert("Error activating: " + err.message);
    }
  };

  // Open Manager Modal
  const openManager = (property) => {
    setSelectedProperty(property);
    setIsTenantModalOpen(true);
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Loading Rental Manager...</div>;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Rental Management</h1>
        <p className="text-gray-500 text-sm">Manage tenants and track rent payments for your properties.</p>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
          <p className="text-gray-500">You haven't listed any properties yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((prop) => {
            const subStatus = getSubscriptionStatus(prop.id);

            return (
              <div key={prop.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="h-32 bg-gray-100 relative">
                   {prop.image_url ? (
                     <img src={prop.image_url} className="w-full h-full object-cover" alt={prop.title} />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-gray-300">
                       <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                     </div>
                   )}
                   
                   {/* Status Badge */}
                   <span className={`absolute top-2 right-2 px-2 py-1 text-xs font-bold rounded-full ${subStatus.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                     {subStatus.active ? 'ACTIVE' : 'INACTIVE'}
                   </span>
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-gray-800 truncate">{prop.title}</h3>
                  <p className="text-xs text-gray-400 mb-4 truncate">{prop.location}</p>
                  
                  {subStatus.active ? (
                    <button 
                      onClick={() => openManager(prop)}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      <span>Manage Tenants</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleSubscribe(prop)}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      Subscribe KES 1,199/mo
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tenant Management Modal */}
      {selectedProperty && (
        <TenantManagerModal 
          isOpen={isTenantModalOpen}
          onClose={() => setIsTenantModalOpen(false)}
          property={selectedProperty}
        />
      )}
    </div>
  );
}