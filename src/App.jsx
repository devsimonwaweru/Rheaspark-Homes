import React from 'react'
// Using HashRouter for GitHub Pages compatibility (prevents 404 on refresh)
import { HashRouter as Router, Routes, Route } from 'react-router-dom'

// Components
import Header from './components/Header'
import Footer from './components/Footer'
import WhatsAppButton from './components/WhatsAppButton'
import ProtectedRoute from './components/ProtectedRoute'

// Context
import { AuthProvider } from './context/AuthContext'

// Public Pages
import Home from './pages/Home'
import FindHouses from './pages/FindHouses'
import Payment from './pages/Payment'
import MoversPage from './pages/MoversPage'

// Auth Pages
import LandlordAuth from './pages/LandlordAuth'
import MoverAuth from './pages/MoverAuth'

// Activation Page (Payment)
import MoverActivation from './pages/MoverActivation'

// Landlord Dashboard
import LandlordDashboard from './pages/LandlordDashboard'
import LandlordHome from './pages/LandlordHome'
import AddProperty from './pages/AddProperty'

// Mover Dashboard
import MoverDashboard from './pages/MoverDashboard'
import MoverHome from './pages/MoverHome'
import MoverJobs from './pages/MoverJobs'

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          <Routes>
            
            {/* ========================================== */}
            {/* AUTH ROUTES (No Header/Footer) */}
            {/* ========================================== */}
            <Route path="/landlord-login" element={<LandlordAuth />} />
            <Route path="/mover-login" element={<MoverAuth />} />

            {/* ========================================== */}
            {/* ACTIVATION ROUTE (Payment Gateway) */}
            {/* ========================================== */}
            {/* Users are sent here if they are logged in but haven't paid */}
            <Route path="/activate-mover" element={<MoverActivation />} />

            {/* ========================================== */}
            {/* LANDLORD PROTECTED ROUTES */}
            {/* ========================================== */}
            <Route path="/landlord/*" element={
              <ProtectedRoute allowedRoles={['landlord']}>
                <LandlordDashboard />
              </ProtectedRoute>
            }>
              <Route index element={<LandlordHome />} />
              <Route path="add-property" element={<AddProperty />} />
            </Route>

            {/* ========================================== */}
            {/* MOVER PROTECTED ROUTES */}
            {/* ========================================== */}
            <Route path="/mover/*" element={
              <ProtectedRoute allowedRoles={['mover']}>
                <MoverDashboard />
              </ProtectedRoute>
            }>
              <Route index element={<MoverHome />} />
              <Route path="jobs" element={<MoverJobs />} />
              <Route path="profile" element={<MoverHome />} />
            </Route>

            {/* ========================================== */}
            {/* PUBLIC ROUTES (With Header/Footer) */}
            {/* ========================================== */}
            <Route path="*" element={
              <>
                <Header />
                <main className="flex-grow">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/find-houses" element={<FindHouses />} />
                    <Route path="/payment" element={<Payment />} />
                    <Route path="/movers" element={<MoversPage />} />
                    
                    {/* Fallback for unknown routes */}
                    <Route path="*" element={<Home />} />
                  </Routes>
                </main>
                <Footer />
                <WhatsAppButton />
              </>
            } />

          </Routes>
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App