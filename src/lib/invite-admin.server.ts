// src/lib/invite-admin.server.ts
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const inviteAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { teamId: string; email: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { teamId, email } = data;
    const normalizedEmail = email.trim().toLowerCase();

    // Verify caller is the team owner
    const { data: team, error: teamError } = await supabaseAdmin
      .from("teams")
      .select("id, owner_id, name")
      .eq("id", teamId)
      .single();

    if (teamError || !team || team.owner_id !== context.userId) {
      throw new Error("Only the team owner can invite admins.");
    }

    // Insert the pending access row
    const { error: insertError } = await supabaseAdmin.from("team_access").insert({
      team_id: teamId,
      invited_email: normalizedEmail,
      email: normalizedEmail,
      created_by: context.userId,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        throw new Error("That email already has access.");
      }
      throw new Error(insertError.message);
    }

    // Send the actual invite email
    const siteUrl = process.env.SITE_URL ?? "https://hugefines.lovable.app";
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(normalizedEmail, {
      redirectTo: `${siteUrl}/auth`,
      data: { invited_to_team: team.name },
    });

    if (inviteError && !inviteError.message.toLowerCase().includes("already registered")) {
      throw new Error(`Access granted, but the email couldn't be sent: ${inviteError.message}`);
    }

    return { success: true };
  });