// src/App.jsx
import React, { useEffect, useState } from "react";
// CHANGE: Import HashRouter instead of BrowserRouter
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./lib/supabaseClient";

// Components
import Header from "./components/Header";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";

// Public Pages
import Home from "./pages/Home";
import FindHouses from "./pages/FindHouses";
import MoversPage from "./pages/MoversPage";
import Login from "./pages/Login";
import Register from "./pages/Register";

// User Dashboard
import UserDashboard from "./pages/UserDashboard";
import SubscriptionPage from "./pages/SubscriptionPage";

// Landlord Dashboard
import LandlordDashboard from "./pages/LandlordDashboard";
import LandlordHome from "./pages/LandlordHome";

// Mover Dashboard
import MoverDashboard from "./pages/MoverDashboard";
import MoverHome from "./pages/MoverHome";
import MoverJobs from "./pages/MoverJobs";

// Admin Pages
import AdminLogin from "./pages/AdminLogin";
import AdminLayout from "./pages/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminLandlords from "./pages/AdminLandlords";
import AdminProperties from "./pages/AdminProperties";
import AdminMovers from "./pages/AdminMovers";

// ---------------- PUBLIC LAYOUT ----------------
const PublicLayout = ({ children }) => (
  <>
    <Header />
    <main className="flex-grow">{children}</main>
    <Footer />
    <WhatsAppButton />
  </>
);

// ---------------- APP ----------------
function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-t-4 border-[#2FA4E7] rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-medium">Loading Application...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        
        {/* ==================== AUTH ==================== */}
        <Route
          path="/login"
          element={
            session ? <Navigate to="/" replace /> : <PublicLayout><Login /></PublicLayout>
          }
        />
        <Route
          path="/register"
          element={
            session ? <Navigate to="/" replace /> : <PublicLayout><Register /></PublicLayout>
          }
        />

        {/* ==================== ADMIN LOGIN (Standalone) ==================== */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* ==================== ADMIN PROTECTED ROUTES ==================== */}
        <Route 
          path="/admin/*" 
          element={session ? <AdminLayout /> : <Navigate to="/admin/login" replace />} 
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="landlords" element={<AdminLandlords />} />
          <Route path="properties" element={<AdminProperties />} />
          <Route path="movers" element={<AdminMovers />} />
        </Route>

        {/* ==================== USER / SEEKER ==================== */}
        <Route
          path="/user/dashboard"
          element={session ? <UserDashboard /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/subscription"
          element={session ? <SubscriptionPage /> : <Navigate to="/login" replace />}
        />

        {/* ==================== LANDLORD ==================== */}
        <Route
          path="/landlord/*"
          element={session ? <LandlordDashboard /> : <Navigate to="/login" replace />}
        >
          <Route index element={<LandlordHome />} />
        </Route>

        {/* ==================== MOVER ==================== */}
        <Route
          path="/mover/*"
          element={session ? <MoverDashboard /> : <Navigate to="/login" replace />}
        >
          <Route index element={<MoverHome />} />
          <Route path="jobs" element={<MoverJobs />} />
          <Route path="profile" element={<MoverHome />} />
        </Route>

        {/* ==================== PUBLIC ==================== */}
        <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
        <Route path="/find-houses" element={<PublicLayout><FindHouses /></PublicLayout>} />
        <Route path="/movers" element={<PublicLayout><MoversPage /></PublicLayout>} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  );
}

export default App;