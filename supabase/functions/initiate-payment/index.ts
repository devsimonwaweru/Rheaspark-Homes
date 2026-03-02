import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {

  const allowedOrigins = [
    "https://rheasparkhomesnetwork.com",
    "https://www.rheasparkhomesnetwork.com"
  ];

  const origin = req.headers.get("origin") || "";

  const corsHeaders = {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin)
      ? origin
      : "https://rheasparkhomesnetwork.com",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // ✅ Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { amount, phone, type } = await req.json();

    // ✅ Validate input
    if (!amount || !phone || !type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ✅ Get Secret Key from Supabase ENV (SAFE)
    const INTASEND_SECRET_KEY = Deno.env.get("INTASEND_SECRET_KEY");

    if (!INTASEND_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: "Secret key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ✅ Call IntaSend STK Push API
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
          phone_number: phone,
          api_ref: `rheaspark-${Date.now()}`,
          comment: type,
        }),
      }
    );

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message || "Something went wrong",
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