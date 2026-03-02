// src/pages/PaymentSuccess.jsx
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

    const handleSuccess = async () => {
      try {
        // 🏠 LANDLORD POSTING PROPERTY
        if (type === "post_property" && property_id) {
          const { error } = await supabase
            .from("properties")
            .update({
              is_paid: true,
              status: "active",
            })
            .eq("id", property_id);

          if (error) throw error;

          alert("✅ Property successfully posted!");

          navigate("/find-houses");
        }

        // 👀 TENANT VIEWING PROPERTY
        if (type === "view_property" && property_id) {
          alert("✅ Payment successful! You can now view landlord details.");

          navigate(`/property-details/${property_id}`);
        }
      } catch (err) {
        console.error("Payment Success Error:", err);
        alert("Something went wrong: " + err.message);
      } finally {
        setProcessing(false);
      }
    };

    handleSuccess();
  }, [navigate, searchParams]);

  return (
    <div className="max-w-md mx-auto p-6 bg-green-100 shadow-xl rounded-xl mt-12 text-center">
      <h1 className="text-2xl font-bold mb-4">
        ✅ Payment Successful!
      </h1>

      <p className="text-gray-700">
        {processing
          ? "Finalizing your request..."
          : "Redirecting..."}
      </p>
    </div>
  );
}