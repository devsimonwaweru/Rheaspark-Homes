import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      }
    });
  }

  try {
    const { amount, phone, type, property_id } = await req.json();

    // IntaSend API call
    const response = await fetch(
      "https://payment.intasend.com/api/v1/payment/mpesa-stk-push/",
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer ISSecretKey_live_f67c7615-2eba-43c6-92e3-dbc83b5d5107",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: Number(amount),
          phone_number: phone,
          api_ref: `ref-${Date.now()}`, // Unique reference
          comment: type,
          callback_url: "https://rheaspark-homes.vercel.app/payment-success", // 🔑 Important
          metadata: {
            type,
            property_id: property_id || null
          }
        })
      }
    );

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  }
});