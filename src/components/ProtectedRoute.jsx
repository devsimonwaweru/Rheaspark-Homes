import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { profile, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // 1. If no profile (not logged in), redirect to login
  if (!profile) {
    if (allowedRoles.includes('mover')) return <Navigate to="/mover-login" />;
    if (allowedRoles.includes('landlord')) return <Navigate to="/landlord-login" />;
    return <Navigate to="/" />;
  }

  // 2. If role is not allowed, redirect to their correct place
  if (!allowedRoles.includes(profile.role)) {
    if (profile.role === 'landlord') return <Navigate to="/landlord" />;
    if (profile.role === 'mover') return <Navigate to="/mover" />;
    return <Navigate to="/" />;
  }

  // 3. NEW: If role is Landlord or Mover, check Subscription Status
  // If they are not subscribed, send them back to login to pay
  if ((profile.role === 'landlord' || profile.role === 'mover') && !profile.is_subscribed) {
    if (profile.role === 'landlord') return <Navigate to="/landlord-login" />;
    if (profile.role === 'mover') return <Navigate to="/mover-login" />;
  }

  return children;
}