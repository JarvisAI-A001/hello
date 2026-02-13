import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const textEncoder = new TextEncoder();

const PLAN_FROM_PRICE_ENV: Record<string, string> = {
  STRIPE_PRICE_STARTER: "starter",
  STRIPE_PRICE_OPTIMIZER: "optimizer",
  STRIPE_PRICE_ENTERPRISE: "enterprise",
};

const hexToBytes = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
};

const timingSafeEqual = (a: Uint8Array, b: Uint8Array) => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
};

const verifyStripeSignature = async (
  payload: string,
  signatureHeader: string,
  webhookSecret: string
) => {
  const parts = signatureHeader.split(",").reduce<Record<string, string>>((acc, part) => {
    const [k, v] = part.split("=");
    if (k && v) acc[k] = v;
    return acc;
  }, {});

  const timestamp = parts.t;
  const v1 = parts.v1;
  if (!timestamp || !v1) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(webhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode(signedPayload));
  const expected = new Uint8Array(signature);
  const provided = hexToBytes(v1);
  return timingSafeEqual(expected, provided);
};

const getPlanByPriceId = (priceId?: string | null): string => {
  const starter = Deno.env.get("STRIPE_PRICE_STARTER");
  const optimizer = Deno.env.get("STRIPE_PRICE_OPTIMIZER");
  const enterprise = Deno.env.get("STRIPE_PRICE_ENTERPRISE");

  if (priceId && starter && priceId === starter) return "starter";
  if (priceId && optimizer && priceId === optimizer) return "optimizer";
  if (priceId && enterprise && priceId === enterprise) return "enterprise";
  return "free";
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!supabaseUrl || !supabaseServiceKey || !webhookSecret) {
      return new Response("Server configuration incomplete", { status: 500, headers: corsHeaders });
    }

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response("Missing stripe-signature header", { status: 400, headers: corsHeaders });
    }

    const payload = await req.text();
    const valid = await verifyStripeSignature(payload, signature, webhookSecret);
    if (!valid) {
      return new Response("Invalid signature", { status: 400, headers: corsHeaders });
    }

    const event = JSON.parse(payload);
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session?.metadata?.user_id || session?.client_reference_id;
      const plan = session?.metadata?.plan || "free";
      const customerId = session?.customer || null;
      const subscriptionId = session?.subscription || null;

      if (userId) {
        await adminClient
          .from("profiles")
          .update({
            plan,
            subscription_status: "active",
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
          })
          .eq("user_id", userId);
      } else if (customerId) {
        await adminClient
          .from("profiles")
          .update({
            plan,
            subscription_status: "active",
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
          })
          .eq("stripe_customer_id", customerId);
      }
    }

    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const customerId = subscription?.customer;
      const subscriptionId = subscription?.id;
      const status = subscription?.status || "canceled";
      const priceId = subscription?.items?.data?.[0]?.price?.id || null;
      const plan = status === "active" || status === "trialing" ? getPlanByPriceId(priceId) : "free";
      const normalizedStatus = status === "active" || status === "trialing"
        ? "active"
        : status === "past_due"
        ? "past_due"
        : "canceled";

      if (customerId) {
        await adminClient
          .from("profiles")
          .update({
            plan,
            subscription_status: normalizedStatus,
            stripe_customer_id: customerId,
            stripe_subscription_id: normalizedStatus === "canceled" ? null : subscriptionId,
          })
          .eq("stripe_customer_id", customerId);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("stripe-webhook error:", error);
    return new Response("Webhook processing failed", { status: 500, headers: corsHeaders });
  }
});

