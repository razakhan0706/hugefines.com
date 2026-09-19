import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";

function getDaysLeft(trialEndsAt: string): number {
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function TrialBanner() {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [paid, setPaid] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data: teams } = await supabase
        .from("teams")
        .select("trial_ends_at, paid")
        .eq("owner_id", userData.user.id)
        .limit(1)
        .maybeSingle();

      if (!teams) return;
      setPaid(teams.paid);
      setDaysLeft(getDaysLeft(teams.trial_ends_at));
    }
    load();
  }, []);

  if (paid || daysLeft === null || daysLeft === 0) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
      ⏳ <strong>{daysLeft} day{daysLeft !== 1 ? "s" : ""}</strong> left in your free trial.{" "}
      <Link to="/card-details" className="font-semibold underline underline-offset-2">
        Add card details
      </Link>{" "}
      to continue after trial.
    </div>
  );
}
