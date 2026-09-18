import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import logoAsset from "@/assets/Website_Logo.png.asset.json";

export const Route = createFileRoute("/invite-welcome")({
  head: () => ({
    meta: [{ title: "Accept your invite — Huge Fines" }],
  }),
  component: InviteWelcomePage,
});

function InviteWelcomePage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.email) {
        setEmail(data.session.user.email);
      }
      setChecking(false);
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password,
        data: { display_name: name },
      });
      if (error) throw error;
      toast.success("You're all set!");
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary px-4 py-12">
      <Link to="/" className="mb-8 flex items-center justify-center">
        <img src={logoAsset.url} alt="Huge Fines" className="h-32 w-auto md:h-40" />
      </Link>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">You've been invited</CardTitle>
        </CardHeader>
        <CardContent>
          {checking && <p className="text-sm text-muted-foreground">Checking your invite…</p>}

          {!checking && !email && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This invite link looks invalid or has expired.
              </p>
              <Link to="/auth" className="text-sm underline underline-offset-4">
                Go to sign in
              </Link>
            </div>
          )}

          {!checking && email && (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
                Finish setting up your account to start managing fines.
              </p>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Your name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jake Smith"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Set a password</Label>
                  <Input
                    id="password"
                    type="password"
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Setting up…" : "Finish setup"}
                </Button>
              </form>

              <p className="mt-4 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/auth" className="underline underline-offset-4">
                  Sign in here
                </Link>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}