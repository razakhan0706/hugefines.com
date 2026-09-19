import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

interface Props {
  paid: boolean;
  trialEndsAt: string;
}

function isExpired(trialEndsAt: string): boolean {
  return new Date() > new Date(trialEndsAt);
}

export function TrialPaywall({ paid, trialEndsAt }: Props) {
  if (paid || !isExpired(trialEndsAt)) return null;

  return (
    <>
      {/* Blur overlay */}
      <div className="fixed inset-0 z-40 backdrop-blur-sm bg-background/60" />

      {/* Popup */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-8 shadow-2xl text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-accent-soft">
            <svg className="size-7 text-accent-strong" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 11V7m0 4v.01M12 21a9 9 0 100-18 9 9 0 000 18z" />
            </svg>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight">
            Your free trial has ended
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Subscribe to keep using Huge Fines — fines, votes, stats and AI recaps all season long.
          </p>

          <div className="mt-6 rounded-xl border border-border bg-secondary px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Standard team</p>
            <p className="mt-1 text-4xl font-extrabold">$19.99</p>
            <p className="text-sm text-muted-foreground">per year · cancel anytime</p>
            <ul className="mt-3 space-y-1 text-left text-sm text-muted-foreground">
              <li>✓ Up to 20 player profiles</li>
              <li>✓ Unlimited fines & rounds</li>
              <li>✓ 5-4-3-2-1 voting</li>
              <li>✓ Live public board link</li>
              <li>✓ AI season recaps</li>
            </ul>
          </div>

          <Button asChild className="mt-6 w-full" size="lg">
            <Link to="/checkout-start">Subscribe now — $19.99/yr</Link>
          </Button>

          <p className="mt-3 text-xs text-muted-foreground">
            Secure payment via Stripe. No hidden fees.
          </p>
        </div>
      </div>
    </>
  );
}
