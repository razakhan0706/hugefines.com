import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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

function formatCard(val: string) {
  return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(val: string) {
  const v = val.replace(/\D/g, "").slice(0, 4);
  if (v.length >= 2) return v.slice(0, 2) + "/" + v.slice(2);
  return v;
}

function validateCard(card: string): string | null {
  const digits = card.replace(/\s/g, "");
  if (digits.length !== 16) return "Card number must be 16 digits";
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let n = parseInt(digits[digits.length - 1 - i]);
    if (i % 2 === 1) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
  }
  if (sum % 10 !== 0) return "Invalid card number";
  return null;
}

function validateExpiry(expiry: string): string | null {
  if (!/^\d{2}\/\d{2}$/.test(expiry)) return "Enter expiry as MM/YY";
  const [mm, yy] = expiry.split("/").map(Number);
  if (mm < 1 || mm > 12) return "Month must be 01–12";
  const now = new Date();
  const cardDate = new Date(2000 + yy, mm - 1);
  if (cardDate < new Date(now.getFullYear(), now.getMonth())) return "Card has expired";
  return null;
}

function validateCVV(cvv: string): string | null {
  if (cvv.length < 3) return "CVV must be 3 or 4 digits";
  return null;
}

function validateName(name: string): string | null {
  if (name.trim().length < 2) return "Enter the name on your card";
  if (!/^[a-zA-Z\s'-]+$/.test(name.trim())) return "Name must contain letters only";
  return null;
}

function CardDetailsPage() {
  const navigate = useNavigate();
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    const nameErr = validateName(name);
    const cardErr = validateCard(card);
    const expiryErr = validateExpiry(expiry);
    const cvvErr = validateCVV(cvv);
    if (nameErr) newErrors.name = nameErr;
    if (cardErr) newErrors.card = cardErr;
    if (expiryErr) newErrors.expiry = expiryErr;
    if (cvvErr) newErrors.cvv = cvvErr;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);

    try {
      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not logged in");

      // Call Stripe checkout edge function
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke("create-checkout", {
        body: {
          userId: userData.user.id,
          email: userData.user.email,
          returnUrl: `${window.location.origin}/dashboard`,
        },
      });

      if (checkoutError) throw checkoutError;
      if (!checkoutData?.url) throw new Error("No checkout URL returned");

      // Redirect to Stripe checkout
      window.location.href = checkoutData.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
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
        <div className="mb-8 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-widest">
          <span className="text-muted-foreground">1. Account</span>
          <span className="text-muted-foreground">→</span>
          <span className="text-accent-strong">2. Card details</span>
          <span className="text-muted-foreground">→</span>
          <span className="text-muted-foreground">3. Done</span>
        </div>

        <Card>
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-accent-soft">
                  <CreditCard className="size-5 text-accent-strong" />
                </span>
                <div>
                  <h2 className="text-xl font-bold">Card details</h2>
                  <p className="text-sm text-muted-foreground">You won't be charged for 7 days</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {/* Visa */}
                <svg width="38" height="24" viewBox="0 0 38 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded border border-border">
                  <rect width="38" height="24" rx="4" fill="#1A1F71"/>
                  <text x="19" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="Arial">VISA</text>
                </svg>
                {/* Mastercard */}
                <svg width="38" height="24" viewBox="0 0 38 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded border border-border">
                  <rect width="38" height="24" rx="4" fill="#252525"/>
                  <circle cx="15" cy="12" r="7" fill="#EB001B"/>
                  <circle cx="23" cy="12" r="7" fill="#F79E1B"/>
                  <path d="M19 6.8A7 7 0 0 1 22.5 12 7 7 0 0 1 19 17.2 7 7 0 0 1 15.5 12 7 7 0 0 1 19 6.8z" fill="#FF5F00"/>
                </svg>
                {/* Amex */}
                <svg width="38" height="24" viewBox="0 0 38 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded border border-border">
                  <rect width="38" height="24" rx="4" fill="#2557D6"/>
                  <text x="19" y="16" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fontFamily="Arial">AMEX</text>
                </svg>
              </div>
            </div>

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
              <div className="space-y-1">
                <Label htmlFor="cardname">Name on card</Label>
                <Input
                  id="cardname"
                  placeholder="e.g. Jake Smith"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: "" })); }}
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="cardnumber">Card number</Label>
                <Input
                  id="cardnumber"
                  placeholder="1234 5678 9012 3456"
                  value={card}
                  onChange={(e) => { setCard(formatCard(e.target.value)); setErrors((p) => ({ ...p, card: "" })); }}
                  maxLength={19}
                  className={errors.card ? "border-destructive" : ""}
                />
                {errors.card && <p className="text-xs text-destructive">{errors.card}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="expiry">Expiry date</Label>
                  <Input
                    id="expiry"
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => { setExpiry(formatExpiry(e.target.value)); setErrors((p) => ({ ...p, expiry: "" })); }}
                    maxLength={5}
                    className={errors.expiry ? "border-destructive" : ""}
                  />
                  {errors.expiry && <p className="text-xs text-destructive">{errors.expiry}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={cvv}
                    onChange={(e) => { setCvv(e.target.value.replace(/\D/g, "").slice(0, 4)); setErrors((p) => ({ ...p, cvv: "" })); }}
                    maxLength={4}
                    className={errors.cvv ? "border-destructive" : ""}
                  />
                  {errors.cvv && <p className="text-xs text-destructive">{errors.cvv}</p>}
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
