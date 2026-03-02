import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { amount, phone, type, property_id } = body;

    if (!amount || !phone || !type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format phone: 07XXXXXXXX or 7XXXXXXXX → 2547XXXXXXXX
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("0")) cleaned = "254" + cleaned.slice(1);
    else if (cleaned.startsWith("7")) cleaned = "254" + cleaned;

    const SECRET_KEY = Deno.env.get("INTASEND_SECRET_KEY");
    if (!SECRET_KEY) throw new Error("INTASEND_SECRET_KEY missing");

    // IntaSend STK Push
    const response = await fetch(
      "https://payment.intasend.com/api/v1/payment/mpesa-stk-push/",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number(amount),
          phone_number: cleaned,
          api_ref: `rheaspark-${Date.now()}`,
          comment: `${type}-${property_id || "general"}`,
        }),
      }
    );

    let data;
    try {
      data = await response.json();
    } catch {
      const text = await response.text();
      return new Response(
        JSON.stringify({ error: "Payment gateway failed", details: text }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Always return status + response
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});