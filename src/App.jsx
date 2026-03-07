// src/App.jsx

import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./lib/supabaseClient";

// Components
import Header from "./components/Header";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";
import ProtectedRoute from "./components/ProtectedRoute";
import PaymentModal from "./components/PaymentModal";

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

// Admin Dashboard
import AdminLayout from "./pages/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminMovers from "./pages/AdminMovers";
import AdminLandlords from "./pages/AdminLandlords";


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
    // eslint-disable-next-line react-hooks/immutability
    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function checkSession() {
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg font-semibold">Loading...</p>
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
            session
              ? <Navigate to="/" replace />
              : <PublicLayout><Login /></PublicLayout>
          }
        />

        <Route
          path="/register"
          element={
            session
              ? <Navigate to="/" replace />
              : <PublicLayout><Register /></PublicLayout>
          }
        />


        {/* ==================== ADMIN ==================== */}

        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="movers" element={<AdminMovers />} />
          <Route path="landlords" element={<AdminLandlords />} />
        </Route>


        {/* ==================== USER / SEEKER ==================== */}
        
        <Route
          path="/user/dashboard"
          element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        {/* ==================== SUBSCRIPTION ==================== */}
        <Route 
          path="/subscription" 
          element={
            <ProtectedRoute>
              <SubscriptionPage />
            </ProtectedRoute>
          } 
        />


        {/* ==================== LANDLORD ==================== */}

        <Route
          path="/landlord/*"
          element={
            <ProtectedRoute>
              <LandlordDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<LandlordHome />} />
        </Route>


        {/* ==================== MOVER ==================== */}

        <Route
          path="/mover/*"
          element={
            <ProtectedRoute>
              <MoverDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<MoverHome />} />
          <Route path="jobs" element={<MoverJobs />} />
          <Route path="profile" element={<MoverHome />} />
        </Route>


        {/* ==================== PUBLIC ==================== */}

        <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
        <Route path="/find-houses" element={<PublicLayout><FindHouses /></PublicLayout>} />
        <Route path="/movers" element={<PublicLayout><MoversPage /></PublicLayout>} />


        {/* ==================== FALLBACK ==================== */}

        <Route path="*" element={<PublicLayout><Home /></PublicLayout>} />

      </Routes>
    </Router>
  );
}

export default App;