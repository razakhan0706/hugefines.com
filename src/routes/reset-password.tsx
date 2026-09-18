import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { PasswordStrength, isPasswordStrong } from "@/components/PasswordStrength";
import logoAsset from "@/assets/Website_Logo.png.asset.json";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [{ title: "Set new password — Huge Fines" }],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  // Check if we have a valid session from the reset link
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!isPasswordStrong(password)) {
      setError("Please meet all password requirements below");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated! Signing you in…");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  // No session = they came here directly without clicking email link
  if (hasSession === false) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-secondary px-4 py-12">
        <Link to="/" className="mb-8">
          <img src={logoAsset.url} alt="Huge Fines" className="h-32 w-auto md:h-40" />
        </Link>
        <Card className="w-full max-w-sm">
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-2xl">⚠️</p>
            <p className="font-semibold">This link has expired or is invalid</p>
            <p className="text-sm text-muted-foreground">
              Password reset links expire after 1 hour. Please request a new one.
            </p>
            <Button asChild className="w-full">
              <Link to="/forgot-password">Request new reset link</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary px-4 py-12">
      <Link to="/" className="mb-8">
        <img src={logoAsset.url} alt="Huge Fines" className="h-32 w-auto md:h-40" />
      </Link>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Set new password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                required
              />
              <PasswordStrength password={password} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="Repeat your password"
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                required
              />
              {confirm && password !== confirm && (
                <p className="text-xs text-destructive">Passwords don't match</p>
              )}
              {confirm && password === confirm && confirm.length > 0 && (
                <p className="text-xs text-green-600">✓ Passwords match</p>
              )}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              type="submit"
              className="w-full"
              disabled={busy || !isPasswordStrong(password) || password !== confirm}
            >
              {busy ? "Updating…" : "Set new password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
