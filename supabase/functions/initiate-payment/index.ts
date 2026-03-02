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
    const { amount, phone, type, property_id } = await req.json();

    if (!amount || !phone || !type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format phone: 07XXXXXXXX or 7XXXXXXXX → 2547XXXXXXXX
    const formatPhone = (phone: string) => {
      let cleaned = phone.replace(/\D/g, "");
      if (cleaned.startsWith("0")) cleaned = "254" + cleaned.substring(1);
      else if (cleaned.startsWith("7")) cleaned = "254" + cleaned;
      return cleaned;
    };

    const formattedPhone = formatPhone(phone);

    // Secret key from Supabase env
    const SECRET_KEY = Deno.env.get("INTASEND_SECRET_KEY");
    if (!SECRET_KEY) throw new Error("INTASEND_SECRET_KEY missing");

    // Call IntaSend STK Push API
    const paymentResponse = await fetch(
      "https://payment.intasend.com/api/v1/payment/mpesa-stk-push/",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number(amount),
          phone_number: formattedPhone,
          api_ref: `rheaspark-${Date.now()}`,
          comment: `${type}-${property_id || "general"}`,
        }),
      }
    );

    let data;
    try {
      data = await paymentResponse.json();
    } catch {
      const text = await paymentResponse.text();
      return new Response(
        JSON.stringify({ error: "Payment gateway failed", details: text }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});