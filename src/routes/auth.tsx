import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import logoAsset from "@/assets/Website_Logo.png.asset.json";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { next?: string } => ({
    next: typeof s.next === "string" && s.next.startsWith("/") && !s.next.startsWith("//")
      ? s.next
      : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Huge Fines" },
      { name: "description", content: "Sign in or create an account to run your team's fines, votes and season stats." },
      { property: "og:title", content: "Sign in — Huge Fines" },
      { property: "og:description", content: "Run your team's fines, votes and season stats." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      if (user) {
        // A Google sign-in for an email that has no account silently creates one.
        // Detect that (account created at the same moment as this sign-in) and
        // send brand-new users to the trial page instead of the dashboard.
        const isNewGoogleUser =
          user.app_metadata?.provider === "google" &&
          !!user.last_sign_in_at &&
          Math.abs(new Date(user.last_sign_in_at).getTime() - new Date(user.created_at).getTime()) < 60_000;
        if (isNewGoogleUser) {
          navigate({ to: "/trial", replace: true });
          return;
        }
        if (next) window.location.replace(next);
        else navigate({ to: "/dashboard", replace: true });
      }
    });
  }, [navigate, next]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${next ?? "/dashboard"}`,
            data: { display_name: name },
          },
        });
        if (error) throw error;
        const { data: session } = await supabase.auth.getSession();
        if (session.session) {
          if (next) window.location.assign(next);
          else navigate({ to: "/dashboard" });
        } else {
          toast.success("Check your email to confirm your account.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (next) window.location.assign(next);
        else navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    // Return to /auth after Google so we can tell a brand-new account
    // (which must start a trial) apart from an existing user signing in.
    const redirect_uri = next
      ? `${window.location.origin}/auth?next=${encodeURIComponent(next)}`
      : `${window.location.origin}/auth`;
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri });
    if (result.error) {
      toast.error("Google sign-in failed. Try email instead.");
      return;
    }
    if (result.redirected) return;
    if (next) window.location.assign(next);
    else navigate({ to: "/dashboard" });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary px-4 py-12">
      <Link to="/" className="mb-8 flex items-center justify-center">
        <img src={logoAsset.url} alt="Huge Fines" className="h-32 w-auto md:h-40" />
      </Link>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" onClick={google} type="button">
            Continue with Google
          </Button>
          <div className="my-4 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name">Your name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
            {mode === "signin" && (
              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            )}
          </form>
          {mode === "signin" ? (
            <Link
              to="/trial"
              className="mt-4 block w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              No account yet? Start your free trial
            </Link>
          ) : (
            <button
              type="button"
              className="mt-4 w-full text-sm text-muted-foreground underline-offset-4 hover:underline"
              onClick={() => setMode("signin")}
            >
              Already have an account? Sign in
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}