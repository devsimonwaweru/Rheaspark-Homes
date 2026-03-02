import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";

export default function PaymentPage() {

  const [searchParams] = useSearchParams();

  const amount = Number(searchParams.get("price"));
  const type = searchParams.get("type");
  const propertyId = searchParams.get("property_id");

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handlePayment = async (e) => {
    e.preventDefault();

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
            amount,
            phone,
            type,
            property_id: propertyId,
          }),
        }
      );

      const data = await res.json();

      console.log(data);

      if (!res.ok) {
        throw new Error(data.error || "Payment failed");
      }

      setMessage("✅ STK Push sent. Check your phone!");

    } catch (err) {
      console.error(err);
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <form
        onSubmit={handlePayment}
        className="bg-white p-6 rounded-xl shadow-md w-96"
      >
        <h2 className="text-xl font-bold mb-4 text-center">
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
          className="bg-blue-600 text-white w-full py-3 rounded"
        >
          {loading ? "Processing..." : "Pay Now"}
        </button>

        {message && (
          <p className="mt-4 text-center">{message}</p>
        )}
      </form>
    </div>
  );
}