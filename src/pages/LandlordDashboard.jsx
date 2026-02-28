import React from 'react';
import { Outlet } from 'react-router-dom';
import LandlordSidebar from '../components/LandlordSidebar';

export default function LandlordDashboard() {
  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      {/* Sidebar - Hidden on mobile, visible on md+ */}
      <div className="hidden md:block w-64 bg-white border-r border-gray-100 flex-shrink-0">
        <LandlordSidebar />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* This is where LandlordHome or AddProperty will be rendered */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}