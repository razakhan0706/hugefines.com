import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ClipboardList, BarChart3, Vote, Sparkles, Share2, Users, Check } from "lucide-react";
import logoAsset from "@/assets/Website_Logo.png.asset.json";

export const Route = createFileRoute("/trial")({
  head: () => ({
    meta: [
      { title: "Start your free trial — Huge Fines" },
      {
        name: "description",
        content: "7 days free, then $19.99/year. Enter your details to get started.",
      },
    ],
  }),
  component: TrialPage,
});

const FEATURES = [
  { icon: ClipboardList, text: "Log fines in a few taps" },
  { icon: BarChart3,     text: "Season stats & leaderboards" },
  { icon: Vote,          text: "5-4-3-2-1 voting" },
  { icon: Sparkles,      text: "AI season recaps" },
  { icon: Share2,        text: "Live public board link" },
  { icon: Users,         text: "Shared admin access" },
];

function TrialPage() {
  const navigate = useNavigate();
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy]         = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      // First try to sign in — if it works, account already exists
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInData.session) {
        // Account exists and password matches — just log them in
        toast.success("Welcome back! Signing you in.");
        navigate({ to: "/dashboard" });
        return;
      }

      if (signInError && signInError.message.toLowerCase().includes("invalid login")) {
        // Wrong password for existing account
        toast.error("An account with this email already exists. Check your password.");
        setBusy(false);
        return;
      }

      // No account exists — sign them up
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: name },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (signUpError) throw signUpError;

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast.success("Check your email to confirm your account.");
        setBusy(false);
        return;
      }

      // ----------------------------------------------------------------
      // TODO: STRIPE — uncomment below once Stripe edge function is ready
      // const { data, error: fnError } = await supabase.functions.invoke("create-checkout", {
      //   body: { userId: sessionData.session.user.id, email, returnUrl: `${window.location.origin}/dashboard` },
      // });
      // if (fnError) throw fnError;
      // window.location.href = data.url;
      // ----------------------------------------------------------------

      toast.success("Account created! Your 7-day trial has started.");
      navigate({ to: "/card-details" });

    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function googleSignup() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/dashboard`,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Try email instead.");
    }
  }

  return (
    <div className="min-h-screen bg-secondary">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/">
            <img src={logoAsset.url} alt="Huge Fines" className="h-12 w-auto md:h-14" />
          </Link>
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/auth" className="font-semibold text-foreground underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">

          <div className="flex flex-col justify-center">
            <span className="inline-flex w-fit items-center rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent-strong">
              7-day free trial
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-5xl">
              Your team's fines book,
              <span className="text-accent"> finally worth reading.</span>
            </h1>
            <p className="mt-4 text-muted-foreground">
              Enter your details to start your free trial. Your card won't be
              charged until day 7 — cancel any time before then.
            </p>
            <ul className="mt-8 space-y-3">
              {FEATURES.map((f) => (
                <li key={f.text} className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft">
                    <f.icon className="size-4 text-accent-strong" />
                  </span>
                  <span className="text-sm font-medium">{f.text}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 inline-flex w-fit items-center gap-4 rounded-xl border border-border bg-background px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">After trial</p>
                <p className="text-3xl font-extrabold">$19.99<span className="text-base font-normal text-muted-foreground">/year</span></p>
              </div>
              <div className="h-10 w-px bg-border" />
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li className="flex items-center gap-1.5"><Check className="size-3 text-accent" /> 20 player profiles</li>
                <li className="flex items-center gap-1.5"><Check className="size-3 text-accent" /> 12 months access</li>
                <li className="flex items-center gap-1.5"><Check className="size-3 text-accent" /> Cancel any time</li>
              </ul>
            </div>
          </div>

          <div className="flex items-start justify-center lg:justify-end">
            <Card className="w-full max-w-md">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-2xl font-bold">Create your account</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Free for 7 days · card details collected via Stripe · cancel any time
                </p>
                <Button variant="outline" className="mt-6 w-full" type="button" onClick={googleSignup}>
                  <svg className="mr-2 size-4" viewBox="0 0 18 18" fill="none">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                    <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.59C4.672 4.464 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </Button>
                <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
                  <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
                </div>
                <form onSubmit={onSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your name</Label>
                    <Input id="name" placeholder="e.g. Jake Smith" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" placeholder="Min. 6 characters" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <div className="rounded-lg border border-border bg-secondary px-4 py-3 text-xs text-muted-foreground">
                    💳 After clicking below you'll enter your card details securely on Stripe. <strong>You won't be charged until day 7.</strong>
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={busy}>
                    {busy ? "Setting up your account…" : "Start free trial →"}
                  </Button>
                </form>
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  By signing up you agree to our terms. Secure payments via Stripe.
                </p>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}
