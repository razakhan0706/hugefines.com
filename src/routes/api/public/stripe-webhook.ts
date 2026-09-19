import { createFileRoute } from "@tanstack/react-router";
import Stripe from "stripe";

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secretKey = process.env.STRIPE_LIVE_API_KEY ?? process.env.STRIPE_SECRET_KEY;
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!secretKey || !webhookSecret) {
          return new Response("Billing is not configured", { status: 500 });
        }

        const stripe = new Stripe(secretKey, { apiVersion: "2024-04-10" as any });
        const signature = request.headers.get("stripe-signature");
        const body = await request.text();
        if (!signature) return new Response("Missing signature", { status: 401 });

        let event: Stripe.Event;
        try {
          event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            webhookSecret,
            undefined,
            Stripe.createSubtleCryptoProvider(),
          );
        } catch {
          return new Response("Invalid signature", { status: 401 });
        }

        if (
          event.type !== "customer.subscription.deleted" &&
          event.type !== "customer.subscription.updated"
        ) {
          return new Response("ok");
        }

        const subscription = event.data.object as Stripe.Subscription;
        const trialEndMs = subscription.trial_end ? subscription.trial_end * 1000 : null;
        const stillInTrial = trialEndMs !== null && trialEndMs > Date.now();

        const cancelledInTrial =
          (event.type === "customer.subscription.deleted" && stillInTrial) ||
          (event.type === "customer.subscription.updated" &&
            stillInTrial &&
            subscription.status === "trialing" &&
            subscription.cancel_at_period_end === true);

        if (!cancelledInTrial) return new Response("ok");

        // Resolve the app user behind this Stripe customer.
        let userId = (subscription.metadata?.userId as string | undefined) ?? undefined;
        let email: string | undefined;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id;

        if (customerId) {
          try {
            const customer = await stripe.customers.retrieve(customerId);
            if (!("deleted" in customer && customer.deleted)) {
              userId = userId ?? (customer.metadata?.userId as string | undefined);
              email = customer.email ?? undefined;
            }
          } catch {
            // fall through to whatever we already resolved
          }
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        if (!userId && email) {
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .eq("email", email)
            .maybeSingle();
          userId = profile?.id;
        }

        if (!userId) return new Response("ok");

        const { deleteTrialAccount } = await import("@/lib/trial-cleanup.server");
        const result = await deleteTrialAccount(userId);
        console.log("[stripe-webhook] trial cancellation cleanup", { userId, ...result });

        return new Response("ok");
      },
    },
  },
});
