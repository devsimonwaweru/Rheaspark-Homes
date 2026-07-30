import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import LandlordSidebar from '../components/LandlordSidebar';
import AddPropertyModal from '../components/AddPropertyModal';
import NotificationBell from '../components/NotificationBell';

export default function LandlordDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // ---------------------------------------------------------
  // SMART ALERTS: Checks for stale properties on load
  // Sends Email if not on website, In-App if they are
  // ---------------------------------------------------------
  const generateStaleAlerts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Find properties that are hidden or expired
    const { data: staleProperties } = await supabase
      .from('properties')
      .select('id, title, auto_hidden')
      .eq('landlord_id', user.id)
      .or('auto_hidden.eq.true,verification_due_at.lt.' + new Date().toISOString());

    if (!staleProperties || staleProperties.length === 0) return;

    for (const prop of staleProperties) {
      // 1. Prevent spamming: Only notify if we haven't already for this property
      const { data: existingNotif } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', 'verification')
        .eq('message', prop.title)
        .maybeSingle();

      if (!existingNotif) {
        // 2. Create In-App Notification (shows up in the Bell)
        await supabase.from('notifications').insert({
          user_id: user.id,
          title: 'Listing requires verification',
          message: prop.title,
          type: 'verification',
          link: '/landlord/properties'
        });

        // 3. Send Email Alert (Shows up on their phone even if offline)
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            action: 'send_alert',
            email: user.email,
            purpose: 'system', // Just to satisfy the payload requirement
            subject: 'Action Required: Property Hidden',
            message: `Your listing "<strong>${prop.title}</strong>" is no longer visible to tenants because it hasn't been verified in over 7 days. Log in to RheaSpark to update its availability and make it visible again.`
          })
        });
      }
    }
  };

  useEffect(() => {
    generateStaleAlerts();
  }, []);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 font-sans">
      
      <LandlordSidebar onAddProperty={openModal} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Navigation Bar for Notifications */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            <p className="text-sm font-medium text-gray-600 hidden md:block">Landlord Dashboard</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet context={{ openAddPropertyModal: openModal }} />
        </main>
      </div>

      <AddPropertyModal isOpen={isModalOpen} onClose={closeModal} />
    </div>
  );
}