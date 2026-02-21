import React from 'react';
import { Outlet } from 'react-router-dom';
import MoverSidebar from '../components/MoverSidebar';

export default function MoverDashboard() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <MoverSidebar />
      
      {/* Main Content Area - pushes to the right of sidebar */}
      <div className="md:ml-64 p-8">
        <Outlet /> 
      </div>
    </div>
  );
}