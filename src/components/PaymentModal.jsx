/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

export default function PaymentModal({ isOpen, onClose, amount, type, propertyId }) {
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("idle"); // idle | pending | success | failed
  const [paymentId, setPaymentId] = useState(null);
  const [message, setMessage] = useState("");
  const pollingRef = useRef(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPhone("");
      setStatus("idle");
      setPaymentId(null);
      setMessage("");
    }
  }, [isOpen]);

  // Cleanup polling on unmount or close
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // 1. Initiate Payment
  const handleInitiate = async (e) => {
    e.preventDefault();
    if (!phone) return setMessage("Please enter phone number");

    setStatus("loading");
    setMessage("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) 
        throw new Error("User not found");

      // Call Supabase Edge Function
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/initiate-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY
        },
          body: JSON.stringify({ 
            amount, 
            phone, 
            type, 
            property_id: propertyId,
            user_id: user?.id 
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to initiate payment");

      // Move to Pending State
      setPaymentId(data.payment_id);
      setStatus("pending");
      setMessage("STK Push sent! Check your phone to complete payment...");
      
      // Start Polling
      startPolling(data.payment_id);

    } catch (err) {
      console.error(err);
      setStatus("failed");
      setMessage(err.message || "Failed to send STK Push");
    } finally {
      // eslint-disable-next-line no-undef
      setLoading(false);
    }
  }

  // 2. Polling Logic
  const startPolling = (Id) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      try {
        // Query payments table directly from frontend
        const { data, error } = await supabase
          .from('payments')
          .select('status')
          // eslint-disable-next-line no-undef
          .eq('id', id)
          .single();

        if (error) throw error;

        if (data.status === "completed") {
          clearInterval(pollingRef.current);
          setStatus("success");
          setMessage("Payment Successful!")
          
          // Auto-close after 2 seconds
          setTimeout(() => {
            onClose(true); // Pass true to indicate success
          }, 2000);
        } else if (data.status === "failed") {
          clearInterval(pollingRef.current);
          setStatus("failed");
          setMessage("Payment failed or cancelled.");
        }
      } catch (err) {
        console.error("Polling error:", err)
      }
    }, 3000); // Poll every 3 seconds
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-blue-600 to-emerald-500 text-white">
        <h2 className="text-xl font-bold">Secure Payment</h2>
      <p className="text-sm opacity-90">Powered by Intasend</p>
    </div>

      <div className="p-8">
        {/* State: Idle / Input */}
        {(status === "idle" || status === "loading") && (
          <form onSubmit={handleInitiate} className="space-y-6">
            <div className="text-center">
              <p className="text-gray-500 text-sm">Amount to Pay</p>
              <h3 className="text-4xl font-bold text-gray-800 my-2">
                KES {amount}</h3>
              <p className="text-xs bg-blue-100 text-blue-700 uppercase tracking-wider">
                {type === 'view_property' ? 'Unlock Details' : 'Listing Fee'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">M-Pesa Phone Number</label>
              <input
                type="tel"
                placeholder="07XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none text-lg font-mono tracking-wider"
                required
              />
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? "Processing..." : "Pay Now"}
            </button>
          </form>
        )}

        {/* State: Pending (Processing) */}
        {(status === "pending" || status === "success") && (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full flex items-center justify-center animate-bounce-slow">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 0c-2.647z"></path>
              </svg>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-700">Processing Payment</h3>
              <p className="text-sm text-gray-400 mb-2">{message}</p>
            </div>
          </div>
        )}

        {/* State: Failed */}
        {status === "failed" && (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="mt-4">
              <h3 className="text-xl font-semibold text-red-700">Payment Failed</h3>
              <p className="text-sm text-gray-500 mt-2">{message}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}