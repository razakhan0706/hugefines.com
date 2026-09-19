import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();

    // Not logged in → go to auth
    if (error || !data.user) {
      throw redirect({
        to: "/auth",
        search: { next: location.pathname },
      });
    }

    // Billing must remain reachable so a customer can cancel a trial or renewal.
    if (location.pathname === "/billing") {
      return { user: data.user };
    }

    // Wait a moment for profile to be created by trigger
    await new Promise((r) => setTimeout(r, 500));

    // Check if card has been captured
    const { data: profile } = await supabase
      .from("profiles")
      .select("card_captured")
      .eq("id", data.user.id)
      .maybeSingle();

    // An incomplete registration must return to the trial signup flow.
    if (!profile || !profile.card_captured) {
      throw redirect({ to: "/trial" });
    }

    return { user: data.user };
  },
  component: () => <Outlet />,
});
