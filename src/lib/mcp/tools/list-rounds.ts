import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, notAuthenticated, errorResult, jsonResult } from "../supabase";

export default defineTool({
  name: "list_rounds",
  title: "List rounds",
  description: "List a team's rounds with opponent, venue, result, fines master and per-player cap.",
  inputSchema: { team_id: z.string().describe("Team id from list_teams.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ team_id }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("rounds")
      .select(
        "id, round_number, label, opponent, venue, result, played_on, two_day, day, cap, fines_master",
      )
      .eq("team_id", team_id)
      .order("round_number");
    if (error) return errorResult(error.message);
    return jsonResult(data ?? []);
  },
});