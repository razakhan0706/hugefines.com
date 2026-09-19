// Removes a team (and its data) when the owner cancels during the free trial,
// plus any profiles that are left without a team afterwards.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function deleteTrialAccount(userId: string): Promise<{ teamsDeleted: number; profilesDeleted: number }> {
  const { data: teams } = await supabaseAdmin
    .from("teams")
    .select("id")
    .eq("owner_id", userId);

  const teamIds = (teams ?? []).map((t) => t.id);

  // Everyone linked to those teams is a cleanup candidate, plus the owner.
  const candidates = new Set<string>([userId]);
  if (teamIds.length) {
    const { data: access } = await supabaseAdmin
      .from("team_access")
      .select("user_id")
      .in("team_id", teamIds);
    for (const row of access ?? []) {
      if (row.user_id) candidates.add(row.user_id);
    }

    // Team rows cascade to players, rounds, fines, votes, recaps, share links
    // and team access.
    await supabaseAdmin.from("teams").delete().in("id", teamIds);
  }

  let profilesDeleted = 0;
  for (const candidate of candidates) {
    const { count: ownedCount } = await supabaseAdmin
      .from("teams")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", candidate);
    if ((ownedCount ?? 0) > 0) continue;

    const { count: accessCount } = await supabaseAdmin
      .from("team_access")
      .select("id", { count: "exact", head: true })
      .eq("user_id", candidate);
    if ((accessCount ?? 0) > 0) continue;

    // Deleting the auth user cascades to the profile row.
    const { error } = await supabaseAdmin.auth.admin.deleteUser(candidate);
    if (error) {
      await supabaseAdmin.from("profiles").delete().eq("id", candidate);
    }
    profilesDeleted += 1;
  }

  return { teamsDeleted: teamIds.length, profilesDeleted };
}
