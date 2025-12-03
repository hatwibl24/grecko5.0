import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }

  try {
    const { orderID, courseId, userId } = await req.json();

    if (!orderID || !courseId || !userId) {
      throw new Error("Missing required fields");
    }

    // Initialize Supabase Admin (service role) client for secure inserts
    // Using DATABASE_URL as per project configuration
    const supabaseAdmin = createClient(
      Deno.env.get("DATABASE_URL") ?? "",
      Deno.env.get("DATABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1️⃣ Fetch course price
    const { data: course, error: courseError } = await supabaseAdmin
      .from("courses")
      .select("price")
      .eq("id", courseId)
      .single();

    if (courseError || !course) throw new Error("Course not found");

    // 2️⃣ Get PayPal Access Token
    const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
    const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");

    if (!clientId || !clientSecret) throw new Error("PayPal credentials missing");

    const auth = btoa(`${clientId}:${clientSecret}`);
    const tokenResponse = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials"
    });

    const tokenData = await tokenResponse.json();

    // 3️⃣ Verify PayPal order
    const orderResponse = await fetch(`https://api-m.paypal.com/v2/checkout/orders/${orderID}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json"
      }
    });

    const orderData = await orderResponse.json();

    if (orderData.status !== "COMPLETED" && orderData.status !== "APPROVED") {
      throw new Error(`Payment status is ${orderData.status}`);
    }

    // 4️⃣ Verify paid amount
    const paidAmount = parseFloat(orderData.purchase_units[0].amount.value);
    if (Math.abs(paidAmount - course.price) > 0.01) {
      throw new Error(`Price mismatch. Paid: ${paidAmount}, Expected: ${course.price}`);
    }

    // 5️⃣ Insert purchase to unlock course
    // Using user_courses table as used in the frontend application
    await supabaseAdmin.from("user_courses").insert({
      user_id: userId,
      course_id: courseId
    });

    return new Response(JSON.stringify({
      success: true,
      message: "Course unlocked successfully."
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });

  } catch (error: any) {
    console.error("Payment Error:", error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
