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

    // Build an invite/sign-in link and send it from our verified domain
    const siteUrl = process.env.SITE_URL ?? "https://hugefines.com";
    const redirectTo = `${siteUrl}/invite-welcome`;

    let inviteUrl = `${siteUrl}/auth`;
    let alreadyRegistered = false;

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "invite",
      email: normalizedEmail,
      options: { redirectTo, data: { invited_to_team: team.name } },
    });

    if (linkData?.properties?.action_link) {
      inviteUrl = linkData.properties.action_link;
    } else if (
      linkError &&
      /already (been )?registered|already exists|email_exists/i.test(linkError.message)
    ) {
      alreadyRegistered = true;
      const { data: magic } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: normalizedEmail,
        options: { redirectTo: `${siteUrl}/dashboard` },
      });
      if (magic?.properties?.action_link) inviteUrl = magic.properties.action_link;
    }

    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    try {
      await sendTemplateEmail("team-invite", normalizedEmail, {
        templateData: { teamName: team.name, inviteUrl },
      });
    } catch (e) {
      throw new Error(
        `Access granted, but the email couldn't be sent: ${
          e instanceof Error ? e.message : "unknown error"
        }`
      );
    }

    return { success: true, alreadyRegistered };
  });
