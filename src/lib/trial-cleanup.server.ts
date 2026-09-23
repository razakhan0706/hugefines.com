// When the owner cancels during the free trial we keep the team in the system
// (archived, visible only to super admins) and remove the people attached to it
// unless they belong to another live team.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function deleteTrialAccount(userId: string): Promise<{ teamsArchived: number; profilesDeleted: number }> {
  const { data: teams } = await supabaseAdmin
    .from("teams")
    .select("id")
    .eq("owner_id", userId);

  const teamIds = (teams ?? []).map((t) => t.id);

  const { data: ownerProfile } = await supabaseAdmin
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();

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

    // Archive rather than delete: super admins keep visibility of the team and
    // its history after the owner leaves.
    await supabaseAdmin
      .from("teams")
      .update({
        archived: true,
        archived_at: new Date().toISOString(),
        former_owner_email: ownerProfile?.email ?? null,
        owner_id: null,
        is_public: false,
        votes_public: false,
      })
      .in("id", teamIds);

    // Co-admins lose access to the archived team.
    await supabaseAdmin.from("team_access").delete().in("team_id", teamIds);
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

  return { teamsArchived: teamIds.length, profilesDeleted };
}
