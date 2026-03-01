// src/pages/PaymentPage.jsx
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function PaymentPage() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Query params
  const type = searchParams.get('type');      // "post_property" or "view_property"
  const amount = searchParams.get('amount');  // 20, 30, 100, 50
  const property_id = searchParams.get('property_id'); // optional

  const handlePayment = async () => {
    if (!phone) {
      setError('Please enter your phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(
        'https://zxyvvlqbwwiakndtipbn.supabase.co/functions/v1/initiate-payment',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: Number(amount),
            phone,
            type,
            property_id
          }),
        }
      );

      const data = await res.json();
      console.log('IntaSend Response:', data);

      if (res.ok && data.status !== 'failed') {
        alert('Payment initiated! Check your phone for M-PESA prompt.');

        // Save pending property info if landlord posting
        if (type === 'post_property') {
          const pendingData = localStorage.getItem('pending_property_data');
          if (!pendingData) alert('No property data saved. Please fill form first.');
        }

        navigate(`/payment-success?type=${type}&amount=${amount}&property_id=${property_id || ''}`);
      } else {
        setError(data.errors ? JSON.stringify(data.errors) : 'Payment failed');
      }
    } catch (err) {
      console.error('Payment Error:', err);
      setError(err.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-xl rounded-xl mt-12">
      <h1 className="text-2xl font-bold mb-4">Pay KES {amount}</h1>
      <p className="text-gray-600 mb-4">
        Payment for: <span className="font-semibold">{type.replace('_', ' ')}</span>
      </p>

      <input
        type="tel"
        placeholder="Enter your phone number (2547XXXXXXXX)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="w-full border p-3 rounded-lg mb-4"
      />

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <button
        onClick={handlePayment}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </div>
  );
}