import React, { useState } from 'react';
import Modal from './Modal';

export default function PaymentModal({ isOpen, onClose, onSuccess, type = 'landlord' }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Configuration based on user type
  const config = {
    landlord: { amount: 50, title: 'Landlord Subscription', description: 'Activate account to list properties.' },
    mover: { amount: 100, title: 'Mover Registration', description: 'Activate account to receive job requests.' } // Example amount
  };

  const { amount, title, description } = config[type];

  const handlePayment = (e) => {
    e.preventDefault();
    if (!phoneNumber) return;

    setIsProcessing(true);

    // Simulate M-Pesa STK Push
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess(); 
      onClose();   
    }, 3000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="text-center py-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
          <i className="fas fa-crown text-2xl text-green-600"></i>
        </div>
        
        <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-500 text-sm mb-6">{description}</p>

        <form onSubmit={handlePayment}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">M-Pesa Number</label>
            <input 
              type="tel" 
              placeholder="0712 345 678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={isProcessing}
            className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
          >
            {isProcessing ? (
              <span><i className="fas fa-spinner fa-spin mr-2"></i> Processing...</span>
            ) : (
              <span>Pay KES {amount}</span>
            )}
          </button>
        </form>
      </div>
    </Modal>
  );
}