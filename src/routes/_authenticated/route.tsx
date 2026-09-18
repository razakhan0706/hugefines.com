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

    // Check if card has been captured
    const { data: profile } = await supabase
      .from("profiles")
      .select("card_captured")
      .eq("id", data.user.id)
      .maybeSingle();

    // Not on card-details already and card not captured → redirect there
    if (!profile?.card_captured && location.pathname !== "/card-details") {
      throw redirect({ to: "/card-details" });
    }

    return { user: data.user };
  },
  component: () => <Outlet />,
});
