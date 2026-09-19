import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CreditCard, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createBillingPortalSession } from "@/utils/billing.functions";
import { getStripeEnvironment } from "@/lib/stripe";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/billing")({
  head: () => ({
    meta: [
      { title: "Billing management — Huge Fines" },
      { name: "description", content: "Manage your Huge Fines subscription and billing details." },
      { property: "og:title", content: "Billing management — Huge Fines" },
      {
        property: "og:description",
        content: "Manage your Huge Fines subscription and billing details.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BillingPage,
});

function BillingPage() {
  const [busy, setBusy] = useState(false);
  const createPortal = useServerFn(createBillingPortalSession);

  async function openBillingPortal() {
    setBusy(true);
    try {
      const result = await createPortal({
        data: {
          environment: getStripeEnvironment(),
          returnUrl: `${window.location.origin}/billing`,
        },
      });
      if ("error" in result) throw new Error(result.error);
      window.location.href = result.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open billing management.");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-secondary">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent-strong">Account</p>
          <h1 className="mt-1 text-3xl font-bold">Billing management</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your payment method, invoices and subscription securely with Stripe.
          </p>
        </div>

        <Card>
          <CardContent className="space-y-6 p-6">
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-accent-soft">
                <CreditCard className="size-5 text-accent-strong" />
              </span>
              <div>
                <h2 className="text-xl font-bold">Huge Fines yearly plan</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Cancel during your free trial to avoid the first charge. If you cancel a paid yearly
                  plan, access continues until the end of the current term and it will not renew.
                </p>
              </div>
            </div>

            <div className="border-y border-border py-4 text-sm">
              <div className="flex items-center gap-2 font-medium">
                <ShieldCheck className="size-4 text-accent-strong" />
                Cancellation takes effect at the end of your current billing period
              </div>
            </div>

            <Button onClick={openBillingPortal} disabled={busy} className="w-full sm:w-auto">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <ExternalLink className="size-4" />}
              {busy ? "Opening billing…" : "Manage subscription"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}