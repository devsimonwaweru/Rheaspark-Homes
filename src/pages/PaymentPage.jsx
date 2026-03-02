import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";

export default function PaymentPage() {
  const [searchParams] = useSearchParams();

  const amount = Number(searchParams.get("price")) || 0;
  const type = searchParams.get("type") || "general";
  const propertyId = searchParams.get("property_id") || "";

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!phone) {
      setMessage("Please enter your phone number");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
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
            amount,
            phone,
            type,
            property_id: propertyId,
          }),
        }
      );

      const data = await res.json();
      console.log("Payment Response:", data);

      if (!res.ok) throw new Error(data.error || "Payment failed");

      setMessage("✅ STK Push sent! Check your phone to complete payment.");

    } catch (err) {
      console.error(err);
      setMessage(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100 p-4">
      <form
        onSubmit={handlePayment}
        className="bg-white p-6 rounded-xl shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">
          Complete Payment
        </h2>

        <p className="mb-4 text-center">
          Amount: <b>KES {amount}</b>
        </p>

        <input
          type="tel"
          placeholder="07XXXXXXXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="border w-full p-3 rounded mb-4"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded text-white ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Processing..." : "Pay Now"}
        </button>

        {message && (
          <p
            className={`mt-4 text-center ${
              message.startsWith("✅") ? "text-green-600" : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}
      </form>
    </div>
  );
}