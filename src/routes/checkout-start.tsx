import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import logoAsset from "@/assets/Website_Logo.png.asset.json";

export const Route = createFileRoute("/checkout-start")({
  head: () => ({
    meta: [{ title: "Setting up your trial — Huge Fines" }],
  }),
  component: CheckoutStartPage,
});

function CheckoutStartPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        navigate({ to: "/trial" });
        return;
      }

      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke(
        "create-checkout",
        {
          body: {
            userId: userData.user.id,
            email: userData.user.email,
            returnUrl: `${window.location.origin}/dashboard`,
          },
        },
      );

      if (cancelled) return;

      if (checkoutError || !checkoutData?.url) {
        setError("We couldn't start the secure checkout. Please try again.");
        return;
      }

      window.location.href = checkoutData.url;
    }

    start();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-secondary">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4">
          <Link to="/">
            <img src={logoAsset.url} alt="Huge Fines" className="h-12 w-auto md:h-14" />
          </Link>
        </div>
      </header>
      <main className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        {error ? (
          <>
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <Button className="mt-6" onClick={() => window.location.reload()}>
              Try again
            </Button>
          </>
        ) : (
          <>
            <Loader2 className="size-8 animate-spin text-accent-strong" />
            <h1 className="mt-4 text-2xl font-bold">Setting up your free trial…</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Taking you to our secure checkout. You won't be charged for 7 days.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
