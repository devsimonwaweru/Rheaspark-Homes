import React, { useState } from 'react';
import Modal from './Modal';
import GradientButton from './GradientButton';

export default function PropertyDetailsModal({ isOpen, onClose, property }) {
  // State
  const [isCheckedAvailable, setIsCheckedAvailable] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState(null); // null, 'checking', 'available', 'unavailable'
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // ------------------------------------------
  // DYNAMIC PRICING LOGIC
  // ------------------------------------------
  const calculatePrice = () => {
    if (!property) return 0;
    const type = property.type?.toLowerCase();
    const beds = property.beds;

    // Logic based on your requirements
    if (type === 'studio' || type === 'single room') return 20;
    if (type === 'bedsitter') return 30;
    if (beds === 1 || beds === 2) return 100;
    
    // Default for 3+ bedrooms or houses
    return 150; 
  };

  const accessFee = calculatePrice();

  // ------------------------------------------
  // HANDLERS
  // ------------------------------------------

  // 1. Check Availability
  const handleCheckAvailability = () => {
    setAvailabilityStatus('checking');
    // Simulate API call
    setTimeout(() => {
      // 90% chance it's available for demo
      const isAvailable = Math.random() > 0.1;
      setAvailabilityStatus(isAvailable ? 'available' : 'unavailable');
      setIsCheckedAvailable(true);
    }, 1500);
  };

  // 2. Handle Payment
  const handlePayment = (e) => {
    e.preventDefault();
    if (!agreedTerms || !paymentMethod || !phoneNumber) return;

    setIsProcessing(true);
    
    // Simulate Payment Processing
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
    }, 3000);
  };

  // Reset state on close
  const handleClose = () => {
    setIsCheckedAvailable(false);
    setAvailabilityStatus(null);
    setAgreedTerms(false);
    setPaymentMethod(null);
    setPhoneNumber('');
    setIsProcessing(false);
    setIsSuccess(false);
    onClose();
  };

  if (!property) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={property.title} size="lg">
      
      {/* Success State */}
      {isSuccess ? (
        <div className="text-center py-10">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <i className="fas fa-check text-4xl text-green-600"></i>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h3>
          <p className="text-gray-600 mb-6">You now have access to the landlord contacts.</p>
          
          <div className="bg-gray-50 p-4 rounded-xl text-left mb-6">
            <h4 className="font-bold text-gray-800 mb-2">Landlord Contact</h4>
            <p className="text-primary-blue font-semibold">+254 712 345 678</p>
            <p className="text-gray-600 text-sm">valid@email.com</p>
          </div>

          <button onClick={handleClose} className="px-8 py-3 bg-gray-200 text-gray-800 font-semibold rounded-xl hover:bg-gray-300">
            Close
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* LEFT: Property Info & Availability */}
          <div>
            <img src={property.image} alt={property.title} className="w-full h-48 object-cover rounded-xl mb-4" />
            
            <div className="flex justify-between items-center mb-4">
              <span className="text-2xl font-bold text-gray-800">KES {property.price?.toLocaleString()}/mo</span>
              {property.verified && (
                <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                  <i className="fas fa-shield-alt mr-1"></i> Verified
                </span>
              )}
            </div>

            <div className="text-sm text-gray-600 mb-4">
              <p><i className="fas fa-map-marker-alt text-primary-green mr-2"></i>{property.location}</p>
              <p className="mt-1"><i className="fas fa-bed text-primary-blue mr-2"></i>{property.beds} Beds • {property.baths} Baths</p>
            </div>

            {/* Availability Section */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <h4 className="font-bold text-gray-800 mb-2">1. Check Availability</h4>
              {!isCheckedAvailable ? (
                <button 
                  onClick={handleCheckAvailability}
                  className="w-full py-2 bg-white border border-primary-blue text-primary-blue font-semibold rounded-lg hover:bg-blue-50"
                >
                  Check Now
                </button>
              ) : (
                <div className={`flex items-center p-2 rounded-lg ${availabilityStatus === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  <i className={`fas ${availabilityStatus === 'available' ? 'fa-check-circle' : 'fa-times-circle'} mr-2`}></i>
                  <span className="font-semibold">
                    {availabilityStatus === 'checking' ? 'Checking...' : availabilityStatus === 'available' ? 'Unit is Available!' : 'Currently Unavailable'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Payment Flow */}
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
            
            {/* Dynamic Price Display */}
            <div className="text-center mb-6 bg-white p-4 rounded-xl shadow-sm border">
              <p className="text-sm text-gray-500">Access Fee (One-time)</p>
              <p className="text-3xl font-bold text-primary-blue">KES {accessFee}</p>
              <p className="text-xs text-gray-400 mt-1">Determined by house size</p>
            </div>

            {/* Step 2: Payment Form (Enabled only if Available) */}
            <form onSubmit={handlePayment}>
              <h4 className="font-bold text-gray-800 mb-3">2. Make Payment</h4>
              
              {/* Payment Method Selection */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div 
                  onClick={() => setPaymentMethod('mpesa')}
                  className={`cursor-pointer p-3 border rounded-lg text-center transition-all ${paymentMethod === 'mpesa' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
                >
                  <i className="fas fa-mobile-alt text-green-600 text-xl mb-1"></i>
                  <p className="text-xs font-semibold">M-Pesa</p>
                </div>
                <div 
                  className="p-3 border border-gray-100 rounded-lg text-center bg-gray-50 opacity-50 cursor-not-allowed"
                >
                  <i className="fas fa-credit-card text-gray-400 text-xl mb-1"></i>
                  <p className="text-xs text-gray-400">Card (Soon)</p>
                </div>
              </div>

              {/* Phone Number Input */}
              {paymentMethod === 'mpesa' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">M-Pesa Number</label>
                  <input 
                    type="tel" 
                    placeholder="0712 345 678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    required
                  />
                </div>
              )}

              {/* Easy to Spot Terms */}
              <div className="bg-white border border-yellow-200 p-3 rounded-lg mb-4">
                <label className="flex items-start cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="mt-1 mr-2 h-5 w-5 text-primary-blue rounded" 
                  />
                  <span className="text-xs text-gray-600">
                    I agree to the <span className="font-bold text-primary-blue">Terms</span>. I understand this is a one-time fee to view landlord contacts.
                  </span>
                </label>
              </div>

              <GradientButton 
                type="submit"
                disabled={!isCheckedAvailable || availabilityStatus !== 'available' || !agreedTerms || !phoneNumber}
                className="w-full"
              >
                {isProcessing ? (
                  <span><i className="fas fa-spinner fa-spin mr-2"></i> Processing...</span>
                ) : (
                  <span><i className="fas fa-unlock mr-2"></i> Pay KES {accessFee}</span>
                )}
              </GradientButton>
            </form>
          </div>

        </div>
      )}
    </Modal>
  );
}