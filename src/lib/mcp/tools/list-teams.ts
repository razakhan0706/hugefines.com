import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser, notAuthenticated, errorResult, jsonResult } from "../supabase";

export default defineTool({
  name: "list_teams",
  title: "List teams",
  description: "List the Huge Fines teams the signed-in user can access, with id, name, slug and season.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthenticated();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("teams")
      .select("id, name, slug, sport, season_name, currency, is_public")
      .order("name");
    if (error) return errorResult(error.message);
    return jsonResult(data ?? []);
  },
});