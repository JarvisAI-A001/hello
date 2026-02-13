import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type PlanId = "starter" | "optimizer" | "enterprise";

const PLAN_PRICE_ENV: Record<PlanId, string> = {
  starter: "STRIPE_PRICE_STARTER",
  optimizer: "STRIPE_PRICE_OPTIMIZER",
  enterprise: "STRIPE_PRICE_ENTERPRISE",
};

const toForm = (payload: Record<string, string>) =>
  new URLSearchParams(payload).toString();

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey || !stripeSecretKey) {
      return new Response(JSON.stringify({ error: "Server configuration incomplete" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const plan = body?.plan as PlanId;
    if (!plan || !PLAN_PRICE_ENV[plan]) {
      return new Response(JSON.stringify({ error: "Invalid plan selected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const priceId = Deno.env.get(PLAN_PRICE_ENV[plan]);
    if (!priceId) {
      return new Response(JSON.stringify({ error: `Missing ${PLAN_PRICE_ENV[plan]} secret` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await adminClient
      .from("profiles")
      .select("stripe_customer_id,email")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    const origin = req.headers.get("origin") || Deno.env.get("APP_BASE_URL") || "http://localhost:5173";
    const successUrl = `${origin}/settings?billing=success`;
    const cancelUrl = `${origin}/settings?billing=cancelled`;

    const payload: Record<string, string> = {
      mode: "subscription",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      success_url: successUrl,
      cancel_url: cancelUrl,
      "metadata[user_id]": userData.user.id,
      "metadata[plan]": plan,
      client_reference_id: userData.user.id,
    };

    if (profile?.stripe_customer_id) {
      payload.customer = profile.stripe_customer_id;
    } else if (profile?.email || userData.user.email) {
      payload.customer_email = profile?.email || userData.user.email || "";
    }

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: toForm(payload),
    });

    const stripeJson = await stripeRes.json();
    if (!stripeRes.ok) {
      console.error("Stripe checkout error:", stripeJson);
      return new Response(JSON.stringify({ error: stripeJson?.error?.message || "Stripe checkout failed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ url: stripeJson.url, sessionId: stripeJson.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("create-checkout-session error:", error);
    return new Response(JSON.stringify({ error: "Unexpected server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

