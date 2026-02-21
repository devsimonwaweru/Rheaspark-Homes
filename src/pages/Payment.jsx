import React, { useState } from 'react';
import PaymentStepper from '../components/PaymentStepper';
import GradientButton from '../components/GradientButton';
import Modal from '../components/Modal';

export default function Payment() {
  // ------------------------------------------
  // STATE
  // ------------------------------------------
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [agreedTerms, setAgreedTerms] = useState(false);
  
  // Modal States
  const [showMpesaModal, setShowMpesaModal] = useState(false);
  const [showProcessing, setShowProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Mock Property Data
  const property = {
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    title: "Spacious 3-Bedroom Apartment",
    location: "Westlands",
    rent: "85,000",
    beds: "3",
    baths: "2"
  };

  // ------------------------------------------
  // HANDLERS
  // ------------------------------------------

  const handlePayment = () => {
    if (!selectedMethod || !agreedTerms) return;
    
    // Move to step 2
    setCurrentStep(2);
    
    if (selectedMethod === 'mpesa') {
      setShowMpesaModal(true);
    } else {
      // Handle Card logic or show "Coming Soon"
      alert("Card payments coming soon!");
    }
  };

  const simulatePaymentSuccess = () => {
    setShowMpesaModal(false);
    setShowProcessing(true);
    setCurrentStep(3);

    // Simulate processing delay
    setTimeout(() => {
      setShowProcessing(false);
      setShowSuccess(true);
      setCurrentStep(4);
    }, 3000);
  };

  // ------------------------------------------
  // RENDER
  // ------------------------------------------
  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-green-50 min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Progress Stepper */}
        <div className="mb-12">
          <PaymentStepper currentStep={currentStep} />
        </div>

        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 font-brand">
            Access <span className="brand-gradient">Property Details</span>
          </h1>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            Pay a one-time fee to unlock verified contact details and exact location mapping.
          </p>
        </div>

        {/* Property Summary Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 flex flex-col md:flex-row items-center border border-gray-100">
          <div className="md:w-1/4 mb-4 md:mb-0">
            <img src={property.image} alt={property.title} className="w-full h-40 object-cover rounded-xl" />
          </div>
          <div className="md:w-3/4 md:pl-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">{property.title}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-blue-50 p-2 rounded-lg text-center">
                <span className="block text-gray-500">Location</span>
                <span className="font-bold">{property.location}</span>
              </div>
              <div className="bg-green-50 p-2 rounded-lg text-center">
                <span className="block text-gray-500">Rent</span>
                <span className="font-bold">KES {property.rent}</span>
              </div>
              <div className="bg-blue-50 p-2 rounded-lg text-center">
                <span className="block text-gray-500">Beds</span>
                <span className="font-bold">{property.beds}</span>
              </div>
              <div className="bg-green-50 p-2 rounded-lg text-center">
                <span className="block text-gray-500">Baths</span>
                <span className="font-bold">{property.baths}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Details & Payment */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* What you get */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <i className="fas fa-unlock-alt text-primary-blue mr-3"></i>
                What You Get for KES 200
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4 mt-1">
                    <i className="fas fa-phone-alt text-primary-blue"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">Landlord Contacts</h4>
                    <p className="text-gray-600 text-sm">Direct phone and email.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-4 mt-1">
                    <i className="fas fa-map-marked-alt text-primary-green"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">Exact Location</h4>
                    <p className="text-gray-600 text-sm">GPS coordinates provided.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4 mt-1">
                    <i className="fas fa-file-contract text-primary-blue"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">Full Disclosure</h4>
                    <p className="text-gray-600 text-sm">Honest property issues.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-4 mt-1">
                    <i className="fas fa-calendar-check text-primary-green"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">Viewing Arrangement</h4>
                    <p className="text-gray-600 text-sm">Direct scheduling.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <i className="fas fa-credit-card text-primary-green mr-3"></i>
                Choose Payment Method
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* M-Pesa Option */}
                <div 
                  onClick={() => setSelectedMethod('mpesa')}
                  className={`border-2 rounded-2xl p-6 cursor-pointer transition-all duration-300 ${selectedMethod === 'mpesa' ? 'border-primary-green bg-green-50' : 'border-gray-200 hover:border-green-200'}`}
                >
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center mr-4">
                      <i className="fas fa-mobile-alt text-white text-xl"></i>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-xl">M-Pesa</h3>
                      <p className="text-gray-500 text-sm">Mobile Money</p>
                    </div>
                  </div>
                  <div className="flex items-center text-green-600 font-semibold text-sm">
                    <i className="fas fa-bolt mr-2"></i> Instant Payment
                  </div>
                </div>

                {/* Card Option */}
                <div 
                  onClick={() => setSelectedMethod('card')}
                  className={`border-2 rounded-2xl p-6 cursor-pointer transition-all duration-300 relative ${selectedMethod === 'card' ? 'border-primary-blue bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}
                >
                  <span className="absolute top-2 right-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold">Coming Soon</span>
                  <div className="flex items-center mb-4 opacity-50">
                    <div className="w-12 h-12 rounded-xl bg-primary-blue flex items-center justify-center mr-4">
                      <i className="fas fa-credit-card text-white text-xl"></i>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-xl">Card Payment</h3>
                      <p className="text-gray-500 text-sm">Visa, Mastercard</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms & Button */}
              <div className="border-t border-gray-100 pt-6">
                <label className="flex items-start mb-6 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="mt-1 mr-3 h-5 w-5 text-primary-blue rounded border-gray-300 focus:ring-primary-blue" 
                  />
                  <span className="text-sm text-gray-600">
                    I agree to the <a href="#" className="text-primary-blue font-semibold">Terms & Conditions</a> and understand this is a one-time payment.
                  </span>
                </label>

                <button 
                  onClick={handlePayment}
                  disabled={!selectedMethod || !agreedTerms}
                  className="w-full py-4 bg-gradient-to-r from-primary-blue to-primary-green text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fas fa-lock mr-2"></i> Pay KES 200 to Unlock
                </button>
              </div>
            </div>

          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Payment Summary</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Access Fee</span>
                  <span className="font-semibold">KES 200</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Platform Fee</span>
                  <span className="font-semibold text-green-600">FREE</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="text-lg font-bold text-gray-800">Total</span>
                  <span className="text-2xl font-bold text-primary-blue">KES 200</span>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl text-sm text-gray-700">
                <div className="flex items-start">
                  <i className="fas fa-shield-alt text-primary-blue mr-3 mt-1"></i>
                  <p><strong>100% Guarantee:</strong> If details are inaccurate, you receive a full refund.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ------------------------------------------ */}
      {/* MODALS */}
      {/* ------------------------------------------ */}

      {/* M-Pesa Prompt Modal */}
      <Modal isOpen={showMpesaModal} onClose={() => setShowMpesaModal(false)} title="M-Pesa Payment" size="md">
        <div className="text-center py-4">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <i className="fas fa-mobile-alt text-4xl text-green-600"></i>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Check Your Phone</h3>
          <p className="text-gray-600 mb-6">Enter your M-Pesa PIN to confirm payment of <strong>KES 200</strong>.</p>
          
          <div className="flex gap-4">
            <button 
              onClick={() => setShowMpesaModal(false)}
              className="w-full py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              onClick={simulatePaymentSuccess}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:shadow-lg"
            >
              I've Paid
            </button>
          </div>
        </div>
      </Modal>

      {/* Processing Modal */}
      <Modal isOpen={showProcessing} onClose={() => {}} title="Processing Payment" size="sm">
        <div className="text-center py-8">
          <div className="w-16 h-16 border-4 border-blue-100 border-t-primary-blue rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-600">Please wait while we verify your payment...</p>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal isOpen={showSuccess} onClose={() => setShowSuccess(false)} title="Payment Successful" size="md">
        <div className="text-center py-4">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <i className="fas fa-check text-4xl text-green-600"></i>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Access Granted!</h3>
          <p className="text-gray-600 mb-6">You can now view the full details for <strong>{property.title}</strong>.</p>
          
          <button 
            onClick={() => setShowSuccess(false)}
            className="w-full py-3 bg-gradient-to-r from-primary-blue to-primary-green text-white font-semibold rounded-xl hover:shadow-lg"
          >
            View Property Details
          </button>
        </div>
      </Modal>

    </div>
  );
}