// src/pages/PaymentPage.jsx
import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function PaymentPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get query params
  const type = searchParams.get("type"); // post_property / view_property
  const amount = searchParams.get("amount");
  const property_id = searchParams.get("property_id");

  const handlePayment = async () => {
    if (!phone) {
      setError("Please enter your phone number");
      return;
    }

    // Basic phone validation
    if (!phone.startsWith("254") || phone.length !== 12) {
      setError("Phone must be in format 2547XXXXXXXX");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "https://zxyvvlqbwwiakndtipbn.supabase.co/functions/v1/initiate-payment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: Number(amount),
            phone,
            type,
            property_id,
          }),
        }
      );

      const data = await response.json();
      console.log("Payment Response:", data);

      if (response.ok) {
        alert("Payment initiated! Check your phone for M-PESA prompt.");

        // Navigate to success page
        navigate(
          `/payment-success?type=${type}&amount=${amount}&property_id=${property_id || ""}`
        );
      } else {
        setError(data.error || "Payment failed. Try again.");
      }
    } catch (err) {
      console.error("Payment Error:", err);
      setError("Failed to initiate payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-xl rounded-xl mt-12">
      <h1 className="text-2xl font-bold mb-4 text-center">
        Pay KES {amount}
      </h1>

      <p className="text-gray-600 mb-4 text-center">
        Payment for:{" "}
        <span className="font-semibold">
          {type ? type.replace("_", " ") : ""}
        </span>
      </p>

      <input
        type="tel"
        placeholder="Enter phone number (2547XXXXXXXX)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="w-full border p-3 rounded-lg mb-4"
      />

      {error && (
        <p className="text-red-500 mb-4 text-center">{error}</p>
      )}

      <button
        onClick={handlePayment}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"
      >
        {loading ? "Processing..." : "Pay Now"}
      </button>
    </div>
  );
}