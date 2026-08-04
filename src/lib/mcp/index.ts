import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listTeamsTool from "./tools/list-teams";
import listPlayersTool from "./tools/list-players";
import listRoundsTool from "./tools/list-rounds";
import listFinesTool from "./tools/list-fines";
import logFineTool from "./tools/log-fine";
import teamSummaryTool from "./tools/team-summary";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "pixel-perfect-capture",
  title: "Pixel Perfect Capture",
  version: "0.1.0",
  instructions:
    "Tools for Huge Fines, a club sport fines, voting and stats app. Start with `list_teams` to get a team id, then use `list_players`, `list_rounds`, `list_fines` and `team_summary` to read data, and `log_fine` to add a fine.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listTeamsTool,
    listPlayersTool,
    listRoundsTool,
    listFinesTool,
    logFineTool,
    teamSummaryTool,
  ],
});