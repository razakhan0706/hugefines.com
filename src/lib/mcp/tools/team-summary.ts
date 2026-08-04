import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, notAuthenticated, errorResult, jsonResult } from "../supabase";

export default defineTool({
  name: "team_summary",
  title: "Team season summary",
  description:
    "Season summary for a team: total fines pot, fines logged, rounds played and the fines leaderboard by player.",
  inputSchema: { team_id: z.string().describe("Team id from list_teams.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ team_id }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const [playersRes, finesRes, roundsRes] = await Promise.all([
      supabase.from("players").select("id, name").eq("team_id", team_id),
      supabase.from("fines").select("player_id, amount").eq("team_id", team_id),
      supabase.from("rounds").select("id, two_day").eq("team_id", team_id),
    ]);
    const error = playersRes.error ?? finesRes.error ?? roundsRes.error;
    if (error) return errorResult(error.message);

    const players = playersRes.data ?? [];
    const fines = finesRes.data ?? [];
    const rounds = roundsRes.data ?? [];
    const totals = new Map<string, number>();
    for (const fine of fines) {
      totals.set(fine.player_id, (totals.get(fine.player_id) ?? 0) + Number(fine.amount ?? 0));
    }
    const leaderboard = players
      .map((p) => ({ player: p.name, total: totals.get(p.id) ?? 0 }))
      .sort((a, b) => b.total - a.total);

    return jsonResult({
      season_pot: fines.reduce((sum, f) => sum + Number(f.amount ?? 0), 0),
      fines_logged: fines.length,
      rounds_played: rounds.length,
      weeks_played: rounds.reduce((sum, r) => sum + (r.two_day ? 2 : 1), 0),
      leaderboard,
    });
  },
});