import { createServerFn } from "@tanstack/react-start";
import Stripe from "stripe";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type StripeEnv, getStripeErrorMessage } from "@/lib/stripe.server";

type BillingPortalResult = { url: string } | { error: string };

export const createBillingPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { environment: StripeEnv; returnUrl: string }) => data)
  .handler(async ({ data, context }): Promise<BillingPortalResult> => {
    try {
      const { data: userData, error: userError } = await context.supabase.auth.getUser();
      const email = userData.user?.email;
      if (userError || !email) return { error: "Please sign in to manage billing." };

      // Use the same Stripe account as the create-checkout edge function
      // (the user's own account), not the Lovable connector gateway.
      const secretKey = process.env.STRIPE_SECRET_KEY;
      if (!secretKey) return { error: "Billing is not configured yet." };
      const stripe = new Stripe(secretKey, { apiVersion: "2024-04-10" as any });

      let customerId: string | undefined;
      try {
        const bySearch = await stripe.customers.search({
          query: `metadata['userId']:'${context.userId}'`,
          limit: 1,
        });
        customerId = bySearch.data[0]?.id;
      } catch {
        // search may need a moment to index; fall through to email lookup
      }
      if (!customerId) {
        const byEmail = await stripe.customers.list({ email, limit: 1 });
        customerId = byEmail.data[0]?.id;
      }
      if (!customerId) return { error: "No subscription was found for this account." };

      const portal = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: data.returnUrl,
      });
      return { url: portal.url };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
