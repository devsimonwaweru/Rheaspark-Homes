import React, { useState } from "react";
import { useLocation } from "react-router-dom";

export default function PaymentPage() {
  const location = useLocation();
  const { amount = 0, type = "room", property_id = null } = location.state || {};

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handlePayment = async (e) => {
    e.preventDefault();

    if (!phone) {
      setMessage("Please enter your phone number.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/initiate-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            amount: Number(amount),
            phone,
            type,
            property_id,
          }),
        }
      );

      const data = await res.json();
      console.log("Payment Response:", data);

      if (!res.ok) {
        throw new Error(data.error || "Payment failed");
      }

      setMessage("STK Push sent! Check your phone to complete payment.");
    } catch (error) {
      console.error("Payment error:", error);
      setMessage(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white shadow-lg rounded-xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">
          Complete Payment
        </h2>

        <p className="mb-4 text-gray-600 text-center">
          Amount: <span className="font-semibold">KES {amount}</span>
        </p>

        <form onSubmit={handlePayment} className="space-y-4">
          <input
            type="tel"
            placeholder="07XXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white py-3 rounded-lg transition ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Processing..." : "Pay Now"}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-sm text-red-600">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}