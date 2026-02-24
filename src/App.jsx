import React from 'react';
// Using HashRouter for GitHub Pages compatibility
import { HashRouter as Router, Routes, Route } from 'react-router-dom';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';

// Public Pages
import Home from './pages/Home';
import FindHouses from './pages/FindHouses';
import Payment from './pages/Payment';
import MoversPage from './pages/MoversPage';

// Landlord Dashboard
import LandlordDashboard from './pages/LandlordDashboard';
import LandlordHome from './pages/LandlordHome';
import AddProperty from './pages/AddProperty';

// Mover Dashboard
import MoverDashboard from './pages/MoverDashboard';
import MoverHome from './pages/MoverHome';
import MoverJobs from './pages/MoverJobs';

// Admin Dashboard
import AdminLayout from './pages/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import AdminMovers from './pages/AdminMovers';
import AdminLandlords from './pages/AdminLandlords';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Routes>
          {/* ========================================== */}
          {/* ADMIN ROUTES */}
          {/* ========================================== */}
          <Route path="/admin/*" element={<AdminLayout />}>
            {/* Dashboard */}
            <Route index element={<AdminDashboard />} />
            {/* Users Management */}
            <Route path="movers" element={<AdminMovers />} />
            <Route path="landlords" element={<AdminLandlords />} />
          </Route>

          {/* ========================================== */}
          {/* LANDLORD PROTECTED ROUTES */}
          {/* ========================================== */}
          <Route path="/landlord/*" element={<LandlordDashboard />}>
            <Route index element={<LandlordHome />} />
            <Route path="add-property" element={<AddProperty />} />
          </Route>

          {/* ========================================== */}
          {/* MOVER PROTECTED ROUTES */}
          {/* ========================================== */}
          <Route path="/mover/*" element={<MoverDashboard />}>
            <Route index element={<MoverHome />} />
            <Route path="jobs" element={<MoverJobs />} />
            <Route path="profile" element={<MoverHome />} />
          </Route>

          {/* ========================================== */}
          {/* PUBLIC ROUTES (With Header/Footer) */}
          {/* ========================================== */}
          <Route
            path="*"
            element={
              <>
                <Header />
                <main className="flex-grow">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/find-houses" element={<FindHouses />} />
                    <Route path="/payment" element={<Payment />} />
                    <Route path="/movers" element={<MoversPage />} />
                    {/* Fallback */}
                    <Route path="*" element={<Home />} />
                  </Routes>
                </main>
                <Footer />
                <WhatsAppButton />
              </>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;