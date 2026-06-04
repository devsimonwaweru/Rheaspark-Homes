// src/App.jsx
import React, { useEffect, useState } from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./lib/supabaseClient";

// Layouts & Components
import Header from "./components/Header";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";

// Pages
import Home from "./pages/Home";
import FindHouses from "./pages/FindHouses";
import MoversPage from "./pages/MoversPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserDashboard from "./pages/UserDashboard";
import SubscriptionPage from "./pages/SubscriptionPage"; // Updated Import

// Landlord Pages
import LandlordDashboard from "./pages/LandlordDashboard";
import LandlordHome from "./pages/LandlordHome";
import LandlordRentals from "./pages/LandlordRentals"; 
import LandlordProperties from "./pages/LandlordProperties"; 
import LandlordRequests from "./pages/LandlordRequests"; 
import LandlordPayments from "./pages/LandlordPayments"; 
import LandlordMaintenance from "./pages/LandlordMaintenance"; 

// Mover & Admin Pages
import MoverDashboard from "./pages/MoverDashboard";
import MoverHome from "./pages/MoverHome";
import MoverJobs from "./pages/MoverJobs";
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-500">Loading...</div>;

  return (
    <Router>
      <Routes>
        
        {/* AUTH */}
        <Route path="/login" element={session ? <Navigate to="/" replace /> : <PublicLayout><Login /></PublicLayout>} />
        <Route path="/register" element={session ? <Navigate to="/" replace /> : <PublicLayout><Register /></PublicLayout>} />

        {/* ADMIN */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/*" element={session ? <AdminLayout /> : <Navigate to="/admin/login" replace />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="landlords" element={<AdminLandlords />} />
          <Route path="properties" element={<AdminProperties />} />
          <Route path="movers" element={<AdminMovers />} />
        </Route>

        {/* USER */}
        <Route path="/user/dashboard" element={session ? <UserDashboard /> : <Navigate to="/login" replace />} />
        
        {/* SUBSCRIPTION PAGE (Standalone, no header/footer) */}
        <Route 
          path="/subscribe" 
          element={session ? <SubscriptionPage /> : <Navigate to="/login" replace />} 
        />

        {/* LANDLORD MANAGEMENT SUITE */}
        <Route path="/landlord/*" element={session ? <LandlordDashboard /> : <Navigate to="/login" replace />}>
          <Route index element={<LandlordHome />} />
          <Route path="properties" element={<LandlordProperties />} />
          <Route path="requests" element={<LandlordRequests />} />
          <Route path="rentals" element={<LandlordRentals />} />
          <Route path="payments" element={<LandlordPayments />} />
          <Route path="maintenance" element={<LandlordMaintenance />} />
          <Route path="messages" element={<LandlordHome status="coming_soon" />} />
          <Route path="settings" element={<LandlordHome status="coming_soon" />} />
        </Route>

        {/* MOVER */}
        <Route path="/mover/*" element={session ? <MoverDashboard /> : <Navigate to="/login" replace />}>
          <Route index element={<MoverHome />} />
          <Route path="jobs" element={<MoverJobs />} />
        </Route>

        {/* PUBLIC */}
        <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
        <Route path="/find-houses" element={<PublicLayout><FindHouses /></PublicLayout>} />
        <Route path="/movers" element={<PublicLayout><MoversPage /></PublicLayout>} />
        
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  );
}

export default App;