import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {

  const allowedOrigins = [
    "https://rheasparkhomesnetwork.com",
    "https://www.rheasparkhomesnetwork.com",
    "http://localhost:5173"
  ];

  const origin = req.headers.get("origin") || "";

  const corsHeaders = {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin)
      ? origin
      : "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // ✅ CORS PREFLIGHT
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {

    console.log("✅ Payment request received");

    const body = await req.json();

    const { amount, phone, type, property_id } = body;

    if (!amount || !phone || !type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ✅ FORMAT PHONE FOR MPESA
    const formatPhone = (phone: string) => {
      let cleaned = phone.replace(/\D/g, "");

      if (cleaned.startsWith("0")) {
        cleaned = "254" + cleaned.substring(1);
      }

      if (cleaned.startsWith("7")) {
        cleaned = "254" + cleaned;
      }

      return cleaned;
    };

    const formattedPhone = formatPhone(phone);

    console.log("📱 Formatted Phone:", formattedPhone);

    // ✅ GET INTASEND SECRET
    const INTASEND_SECRET_KEY =
      Deno.env.get("INTASEND_SECRET_KEY");

    if (!INTASEND_SECRET_KEY) {
      throw new Error("INTASEND_SECRET_KEY missing");
    }

    // ✅ SEND STK PUSH
    const response = await fetch(
      "https://payment.intasend.com/api/v1/payment/mpesa-stk-push/",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${INTASEND_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number(amount),
          phone_number: formattedPhone,
          api_ref: `rheaspark-${Date.now()}`,
          comment: `${type}-${property_id || "general"}`
        }),
      }
    );

    let data;

    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error("❌ IntaSend Error:", text);

      return new Response(
        JSON.stringify({
          error: "Payment gateway error",
          details: text,
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log("✅ IntaSend Response:", data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });

  } catch (error) {

    console.error("🔥 SERVER ERROR:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "Server error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});