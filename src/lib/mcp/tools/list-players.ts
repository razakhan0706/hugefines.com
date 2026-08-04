import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, notAuthenticated, errorResult, jsonResult } from "../supabase";

export default defineTool({
  name: "list_players",
  title: "List players",
  description: "List the players on a team. Pass the team id from list_teams.",
  inputSchema: { team_id: z.string().describe("Team id from list_teams.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ team_id }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("players")
      .select("id, name, nickname, active")
      .eq("team_id", team_id)
      .order("name");
    if (error) return errorResult(error.message);
    return jsonResult(data ?? []);
  },
});