import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  type StripeEnv,
  createStripeClient,
  getStripeErrorMessage,
} from "@/lib/stripe.server";

type BillingPortalResult = { url: string } | { error: string };

export const createBillingPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: StripeEnv; returnUrl: string }) => data)
  .handler(async ({ data, context }): Promise<BillingPortalResult> => {
    try {
      const { data: userData, error: userError } = await context.supabase.auth.getUser();
      const email = userData.user?.email;
      if (userError || !email) return { error: "Please sign in to manage billing." };

      const stripe = createStripeClient(data.environment);
      const customersByUser = await stripe.customers.search({
        query: `metadata['userId']:'${context.userId}'`,
        limit: 10,
      });
      const customers = customersByUser.data.length
        ? customersByUser.data
        : (await stripe.customers.list({ email, limit: 10 })).data;
      const customer = customers[0];
      if (!customer) return { error: "No subscription was found for this account." };

      const portal = await stripe.billingPortal.sessions.create({
        customer: customer.id,
        return_url: data.returnUrl,
      });
      return { url: portal.url };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });