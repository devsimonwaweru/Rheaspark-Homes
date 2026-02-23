import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { profile, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // 1. If not logged in, go to login
  if (!profile) {
    if (allowedRoles.includes('mover')) return <Navigate to="/mover-login" />;
    if (allowedRoles.includes('landlord')) return <Navigate to="/landlord-login" />;
    return <Navigate to="/" />;
  }

  // 2. If wrong role, go to correct dashboard
  if (!allowedRoles.includes(profile.role)) {
    if (profile.role === 'landlord') return <Navigate to="/landlord" />;
    if (profile.role === 'mover') return <Navigate to="/mover" />;
    return <Navigate to="/" />;
  }

  // 3. CRITICAL FIX: If correct role but NOT subscribed -> Go to ACTIVATION
  if ((profile.role === 'landlord' || profile.role === 'mover') && !profile.is_subscribed) {
    if (profile.role === 'landlord') return <Navigate to="/activate-landlord" />;
    if (profile.role === 'mover') return <Navigate to="/activate-mover" />;
  }

  return children;
}