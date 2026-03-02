import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';

// Public Pages
import Home from './pages/Home';
import FindHouses from './pages/FindHouses';
import PaymentPage from './pages/PaymentPage';
import PaymentSuccess from './pages/PaymentSuccess';
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

// Public layout wrapper
const PublicLayout = ({ children }) => (
  <>
    <Header />
    <main className="flex-grow">{children}</main>
    <Footer />
    <WhatsAppButton />
  </>
);

function App() {
  return (
    <Router>
      <Routes>

        {/* ==================== ADMIN ==================== */}
        <Route path="/admin/*" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="movers" element={<AdminMovers />} />
          <Route path="landlords" element={<AdminLandlords />} />
        </Route>

        {/* ==================== LANDLORD ==================== */}
        <Route path="/landlord/*" element={<LandlordDashboard />}>
          <Route index element={<LandlordHome />} />
          <Route path="add-property" element={<AddProperty />} />
        </Route>

        {/* ==================== MOVER ==================== */}
        <Route path="/mover/*" element={<MoverDashboard />}>
          <Route index element={<MoverHome />} />
          <Route path="jobs" element={<MoverJobs />} />
          <Route path="profile" element={<MoverHome />} />
        </Route>

        {/* ==================== PUBLIC ==================== */}
        <Route
          path="/"
          element={<PublicLayout><Home /></PublicLayout>}
        />
        <Route
          path="/find-houses"
          element={<PublicLayout><FindHouses /></PublicLayout>}
        />
        <Route
          path="/payment"
          element={<PublicLayout><PaymentPage /></PublicLayout>}
        />
        <Route
          path="/payment-success"
          element={<PublicLayout><PaymentSuccess /></PublicLayout>}
        />
        <Route
          path="/movers"
          element={<PublicLayout><MoversPage /></PublicLayout>}
        />

        {/* Fallback */}
        <Route path="*" element={<PublicLayout><Home /></PublicLayout>} />

      </Routes>
    </Router>
  );
}

export default App;