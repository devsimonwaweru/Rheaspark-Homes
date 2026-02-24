import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';


export default function AdminLayout() {
  return (
    
      <div className="bg-gray-100 min-h-screen">
        <AdminSidebar />
        <div className="md:ml-64 p-8">
          <Outlet />
        </div>
      </div>
    
  );
}