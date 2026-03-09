// src/components/AdminRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-t-4 border-[#2FA4E7] rounded-full animate-spin"></div>
      </div>
    );
  }

  // If no session, redirect to admin login page
  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }

  // If session exists, show the admin layout
  return <Outlet />;
};

export default AdminRoute;