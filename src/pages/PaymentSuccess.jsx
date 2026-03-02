/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const type = searchParams.get("type");
    const property_id = searchParams.get("property_id");

    const finalize = async () => {
      try {
        if (type === "view_property" && property_id) {
          // You can optionally mark payment completed in Supabase here
          alert("✅ Payment successful! You can now view landlord details.");
          navigate(`/property-details/${property_id}`, { replace: true });
        }
      } catch (err) {
        console.error("Payment success error:", err);
        alert("Error finalizing payment: " + err.message);
      } finally {
        setProcessing(false);
      }
    };

    finalize();
  }, [searchParams, navigate]);

  return (
    <div className="max-w-md mx-auto p-6 bg-green-100 shadow-xl rounded-xl mt-12 text-center">
      <h1 className="text-2xl font-bold mb-4">✅ Payment Successful!</h1>
      <p className="text-gray-700">
        {processing ? "Finalizing your request..." : "Redirecting..."}
      </p>
    </div>
  );
}