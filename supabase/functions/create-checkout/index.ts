import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_LIVE_API_KEY") ?? Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-04-10",
});

const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const PRICE_ID = "price_1UHJsdAuE7syJnwDv9Ba8k61";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, content-type, apikey, x-client-info, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
      },
    });
  }

  try {
    const { userId, email, returnUrl } = await req.json();

    if (!userId || !email || !returnUrl) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // Find or create Stripe customer
    const existing = await stripe.customers.list({ email, limit: 1 });
    let customer = existing.data[0];
    if (!customer) {
      customer = await stripe.customers.create({
        email,
        metadata: { userId },
      });
    }

    // Create checkout session with 7-day trial
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "subscription",
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
        metadata: { userId },
      },
      success_url: `${returnUrl}?payment=success`,
      cancel_url: `${returnUrl}?payment=cancelled`,
      metadata: { userId },
    });

    // Mark card as captured so user goes straight to dashboard after Stripe
    await supabaseAdmin.from("profiles").update({ card_captured: true }).eq("id", userId);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Failed to create checkout" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
