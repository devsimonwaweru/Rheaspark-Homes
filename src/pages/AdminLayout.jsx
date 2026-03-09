// src/pages/AdminLayout.jsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 
        transform transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static md:inset-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <AdminSidebar closeSidebar={() => setIsSidebarOpen(false)} />
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Bar */}
        <AdminHeader toggleSidebar={toggleSidebar} />

        {/* Page Content - Renders child routes here */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
        
      </div>
    </div>
  );
};

export default AdminLayout;