/* eslint-disable no-unused-vars */
// src/components/PaymentModal.jsx
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

export default function PaymentModal({ isOpen, onClose, amount, type, propertyId }) {
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("idle"); 
  const [paymentId, setPaymentId] = useState(null);
  const [message, setMessage] = useState("");
  const pollingRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setPhone("");
      setStatus("idle");
      setPaymentId(null);
      setMessage("");
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handleInitiate = async (e) => {
    e.preventDefault();
    if (!phone) return setMessage("Please enter phone number");

    setStatus("loading");
    setMessage("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Session expired. Please log in again.");

      const { data, error: funcError } = await supabase.functions.invoke('initiate-payment', {
        body: { 
          phone, 
          type, 
          property_id: propertyId,
          amount: amount, 
          userId: session.user.id 
        }
      });

      if (funcError) {
        let errorMessage = "Server error. Please try again.";
        if (funcError.context) {
          try {
            const errorData = await funcError.context.clone().json();
            errorMessage = errorData.error || errorMessage;
          } catch (parseError) {
            console.error("Server error");
          }
        }
        throw new Error(errorMessage);
      }

      if (data?.error) throw new Error(data.error);

      setPaymentId(data.payment_id);
      setStatus("pending");
      setMessage("STK Push sent! Please check your phone...");
      
      if (data.payment_id) {
        startPolling(data.payment_id);
      }

    } catch (err) {
      console.error("Payment Initiation Failed:", err);
      setStatus("failed");
      setMessage(err.message || "Failed to initiate payment");
    }
  };

  // ✅ THE FIX: Call your verify-payment backend function instead of the database
  const startPolling = (id) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      try {
        // Actively ask Intasend for the status via your backend
        const { data, error } = await supabase.functions.invoke('verify-payment', {
          body: { paymentId: id }
        });

        if (error) throw error;

        if (data?.status === "paid") {
          clearInterval(pollingRef.current);
          setStatus("success");
          setMessage("Payment Successful!");
          
          setTimeout(() => {
            onClose(true); 
          }, 2000);
        } else if (data?.status === "failed") {
          clearInterval(pollingRef.current);
          setStatus("failed");
          setMessage("Payment failed or cancelled.");
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
        
        <div className="p-6 bg-gradient-to-r from-blue-600 to-emerald-500 text-white">
          <h2 className="text-xl font-bold">Secure Payment</h2>
          <p className="text-sm opacity-90">Powered by Intasend</p>
        </div>

        <div className="p-8">
          {status === "idle" || status === "loading" ? (
            <form onSubmit={handleInitiate} className="space-y-6">
              <div className="text-center">
                <p className="text-gray-500 text-sm">Amount to Pay</p>
                <h3 className="text-4xl font-bold text-gray-800 my-2">KES {amount}</h3>
                <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium uppercase">
                  {type === 'view_property' ? 'Unlock Details' : type === 'agent_escort' ? 'Agent Escort' : 'Subscription Fee'}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">M-Pesa Phone Number</label>
                <input
                  type="tel"
                  placeholder="07XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none text-lg font-mono tracking-wider"
                  required
                  disabled={status === 'loading'}
                />
              </div>

              {message && <p className="text-red-500 text-sm text-center">{message}</p>}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center"
              >
                {status === 'loading' ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : "Pay Now"}
              </button>
            </form>
          ) : null}

          {status === "pending" && (
            <div className="text-center py-10 space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-blue-50 flex items-center justify-center animate-pulse">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800">Check Your Phone</h3>
              <p className="text-gray-500 text-sm">{message}</p>
              <div className="pt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse w-3/4"></div>
                </div>
                <p className="text-xs text-gray-400 mt-2">Waiting for M-Pesa confirmation...</p>
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="text-center py-10 space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-green-600">Payment Successful!</h3>
              <p className="text-gray-500 text-sm">{message}</p>
            </div>
          )}

          {status === "failed" && (
            <div className="text-center py-10 space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-red-600">Payment Failed</h3>
              <p className="text-gray-500 text-sm">{message}</p>
              <button onClick={() => setStatus('idle')} className="text-blue-600 font-medium hover:underline">
                Try Again
              </button>
            </div>
          )}
        </div>

        {status !== "pending" && (
          <div className="p-4 border-t text-center">
            <button onClick={() => onClose(false)} className="text-gray-500 hover:text-gray-800 text-sm font-medium">
              Cancel
            </button>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes scale-in {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in { animation: scale-in 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
}