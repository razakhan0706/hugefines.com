import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import logoAsset from "@/assets/Website_Logo.png.asset.json";

function truncateEmail(email: string, max = 24): string {
  if (email.length <= max) return email;
  return email.slice(0, max) + "…";
}

export function SiteHeader() {
  const [email, setEmail] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) setEmail(data.user?.email ?? null);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center">
          <img src={logoAsset.url} alt="Huge Fines" className="h-12 w-auto md:h-14" />
        </Link>
        <nav className="flex items-center gap-2">
          {email ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/dashboard">My teams</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/billing">
                  <CreditCard className="size-4" />
                  <span className="hidden sm:inline">Billing</span>
                </Link>
              </Button>
              <span className="hidden max-w-[160px] truncate text-sm text-muted-foreground sm:inline">
                {truncateEmail(email)}
              </span>
              <Button variant="outline" size="sm" onClick={signOut}>
                Sign out
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
