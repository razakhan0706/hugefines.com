import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, notAuthenticated, errorResult, jsonResult } from "../supabase";

export default defineTool({
  name: "list_fines",
  title: "List fines",
  description:
    "List fines logged for a team, newest first. Optionally filter by player or round, and limit the number returned.",
  inputSchema: {
    team_id: z.string().describe("Team id from list_teams."),
    player_id: z.string().nullable().optional().describe("Optional player id filter."),
    round_id: z.string().nullable().optional().describe("Optional round id filter."),
    limit: z.number().int().nullable().optional().describe("Max rows to return, default 50."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ team_id, player_id, round_id, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("fines")
      .select("id, amount, description, week, created_at, player_id, round_id, category_id")
      .eq("team_id", team_id)
      .order("created_at", { ascending: false })
      .limit(Math.min(Math.max(limit ?? 50, 1), 200));
    if (player_id) query = query.eq("player_id", player_id);
    if (round_id) query = query.eq("round_id", round_id);
    const { data, error } = await query;
    if (error) return errorResult(error.message);
    return jsonResult(data ?? []);
  },
});