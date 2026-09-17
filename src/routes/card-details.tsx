import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock, CreditCard } from "lucide-react";
import logoAsset from "@/assets/Website_Logo.png.asset.json";

export const Route = createFileRoute("/card-details")({
  head: () => ({
    meta: [{ title: "Card details — Huge Fines" }],
  }),
  component: CardDetailsPage,
});

function CardDetailsPage() {
  const navigate = useNavigate();
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  function formatCard(val: string) {
    return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  }

  function formatExpiry(val: string) {
    const v = val.replace(/\D/g, "").slice(0, 4);
    if (v.length >= 2) return v.slice(0, 2) + "/" + v.slice(2);
    return v;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);

    // TODO: STRIPE — replace this with real Stripe checkout call
    // const { data, error } = await supabase.functions.invoke("create-checkout", {
    //   body: { userId, email, returnUrl: window.location.origin + "/dashboard" },
    // });
    // window.location.href = data.url;

    // Simulate for now
    await new Promise((r) => setTimeout(r, 1000));
    toast.success("Trial started! You won't be charged for 7 days.");
    navigate({ to: "/dashboard" });
    setBusy(false);
  }

  return (
    <div className="min-h-screen bg-secondary">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/">
            <img src={logoAsset.url} alt="Huge Fines" className="h-12 w-auto md:h-14" />
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="size-4" />
            Secured by Stripe
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-12">
        {/* Steps */}
        <div className="mb-8 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-widest">
          <span className="text-muted-foreground">1. Account</span>
          <span className="text-muted-foreground">→</span>
          <span className="text-accent-strong">2. Card details</span>
          <span className="text-muted-foreground">→</span>
          <span className="text-muted-foreground">3. Done</span>
        </div>

        <Card>
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex size-10 items-center justify-center rounded-lg bg-accent-soft">
                <CreditCard className="size-5 text-accent-strong" />
              </span>
              <div>
                <h2 className="text-xl font-bold">Card details</h2>
                <p className="text-sm text-muted-foreground">You won't be charged for 7 days</p>
              </div>
            </div>

            {/* Trial summary */}
            <div className="mb-6 rounded-xl border border-border bg-secondary px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Huge Fines — Standard team</p>
                  <p className="text-xs text-muted-foreground">7-day free trial, then $19.99/year</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-extrabold">$0.00</p>
                  <p className="text-xs text-muted-foreground">due today</p>
                </div>
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cardname">Name on card</Label>
                <Input
                  id="cardname"
                  placeholder="e.g. Jake Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardnumber">Card number</Label>
                <Input
                  id="cardnumber"
                  placeholder="1234 5678 9012 3456"
                  value={card}
                  onChange={(e) => setCard(formatCard(e.target.value))}
                  maxLength={19}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry date</Label>
                  <Input
                    id="expiry"
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    maxLength={5}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    maxLength={4}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={busy}>
                {busy ? "Starting your trial…" : "Start 7-day free trial →"}
              </Button>
            </form>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Lock className="size-3" />
              256-bit SSL encryption · Secured by Stripe
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Cancel any time before day 7 and you won't be charged.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
