import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, notAuthenticated, errorResult, jsonResult } from "../supabase";

export default defineTool({
  name: "log_fine",
  title: "Log a fine",
  description:
    "Log a new fine for a player on a team. Provide either a category_id or a custom description.",
  inputSchema: {
    team_id: z.string().describe("Team id from list_teams."),
    player_id: z.string().describe("Player id from list_players."),
    amount: z.number().describe("Fine amount in the team's currency."),
    description: z.string().describe("What the fine was for (custom text or the category label)."),
    category_id: z.string().nullable().optional().describe("Optional fine category id."),
    round_id: z.string().nullable().optional().describe("Optional round id from list_rounds."),
    week: z.number().int().nullable().optional().describe("Day 1 or 2 for a two-day round."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("fines")
      .insert({
        team_id: input.team_id,
        player_id: input.player_id,
        amount: input.amount,
        description: input.description,
        category_id: input.category_id ?? null,
        round_id: input.round_id ?? null,
        week: input.week ?? null,
      })
      .select()
      .single();
    if (error) return errorResult(error.message);
    return jsonResult(data);
  },
});