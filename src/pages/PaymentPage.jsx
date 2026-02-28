import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function PaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');

  const type = searchParams.get('type');
  const price = searchParams.get('price') || 0;

  const getPaymentDetails = () => {
    switch(type) {
      case 'post_property':
        return { title: 'Post Property Fee', desc: 'One-time fee to list this property permanently.', icon: '🏠' };
      case 'unlock':
        return { title: 'Unlock Contact', desc: 'Reveal landlord phone and exact location.', icon: '🔑' };
      default:
        return { title: 'Payment', desc: 'Complete payment to continue.', icon: '💳' };
    }
  };

  const details = getPaymentDetails();

  const handlePayment = async () => {
    // Validation for Unlock flow
    if (type === 'unlock' && !phone) {
      alert('Please enter your phone number to proceed.');
      return;
    }

    setLoading(true);

    // Simulate M-Pesa STK Push
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (type === 'post_property') {
      navigate('/landlord/add-property?payment=success');
    } else if (type === 'unlock') {
      // In a real app, you would verify payment via backend here
      // Then redirect back
      navigate(-1);
      alert('Payment Successful! Information unlocked.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        
        <div className="bg-blue-100 text-blue-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 text-3xl">
          {details.icon}
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-1">{details.title}</h1>
        <p className="text-gray-500 text-sm mb-6">{details.desc}</p>

        {/* Phone Number Input - Only for Unlock */}
        {type === 'unlock' && (
          <div className="mb-4 text-left">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
            <input 
              type="text" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              placeholder="0712 345 678"
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">M-Pesa prompt will be sent here.</p>
          </div>
        )}

        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Amount</span>
            <span className="font-bold text-gray-800">KES {price}</span>
          </div>
          <div className="border-t pt-2 mt-2 flex justify-between items-center">
            <span className="font-bold text-gray-700">Total</span>
            <span className="text-xl font-extrabold text-blue-600">KES {price}</span>
          </div>
        </div>

        <button 
          onClick={handlePayment}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition disabled:opacity-50 shadow-md"
        >
          {loading ? 'Processing M-Pesa...' : `Pay KES ${price}`}
        </button>

        <button 
          onClick={() => navigate(-1)} 
          className="w-full text-center text-gray-400 text-sm mt-4 hover:text-gray-600"
        >
          Cancel Payment
        </button>
      </div>
    </div>
  );
}