import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Fine, FineCategory, Player, Round, Team, Vote } from "./fines";

export interface TeamBundle {
  team: Team;
  players: Player[];
  rounds: Round[];
  categories: FineCategory[];
  fines: Fine[];
  votes: Vote[];
  recaps: { id: string; round_id: string | null; scope: string; body: string; created_at: string }[];
}

export async function fetchTeamBundle(teamId: string): Promise<TeamBundle> {
  const [team, players, rounds, categories, fines, votes, recaps] = await Promise.all([
    supabase.from("teams").select("*").eq("id", teamId).maybeSingle(),
    supabase.from("players").select("*").eq("team_id", teamId).order("name"),
    supabase.from("rounds").select("*").eq("team_id", teamId).order("round_number"),
    supabase.from("fine_categories").select("*").eq("team_id", teamId).order("label"),
    supabase.from("fines").select("*").eq("team_id", teamId).order("created_at", { ascending: false }),
    supabase.from("votes").select("*").eq("team_id", teamId),
    supabase.from("recaps").select("*").eq("team_id", teamId).order("created_at", { ascending: false }),
  ]);

  if (!team.data) throw new Error("Team not found");

  return {
    team: team.data as unknown as Team,
    players: (players.data ?? []) as unknown as Player[],
    rounds: (rounds.data ?? []) as unknown as Round[],
    categories: (categories.data ?? []) as unknown as FineCategory[],
    fines: (fines.data ?? []) as unknown as Fine[],
    votes: (votes.data ?? []) as unknown as Vote[],
    recaps: (recaps.data ?? []) as TeamBundle["recaps"],
  };
}

// Public boards must read team info from the get_public_teams() function, which
// excludes billing columns (stripe ids, trial dates, paid status).
export interface PublicTeam {
  id: string;
  name: string;
  slug: string;
  sport: string;
  season_name: string;
  logo_url: string | null;
  accent_color: string;
  vote_format: string;
  votes_public: boolean;
  is_public: boolean;
  player_limit: number;
  currency: string;
  created_at: string;
}

export async function fetchPublicTeams(): Promise<PublicTeam[]> {
  const { data, error } = await supabase.rpc("get_public_teams" as never);
  if (error) throw error;
  return (data ?? []) as unknown as PublicTeam[];
}

export async function fetchPublicTeamBundle(teamId: string): Promise<TeamBundle> {
  const teams = await fetchPublicTeams();
  const team = teams.find((t) => t.id === teamId) ?? null;
  const [players, rounds, categories, fines, votes, recaps] = await Promise.all([
    supabase.from("players").select("*").eq("team_id", teamId).order("name"),
    supabase.from("rounds").select("*").eq("team_id", teamId).order("round_number"),
    supabase.from("fine_categories").select("*").eq("team_id", teamId).order("label"),
    supabase.from("fines").select("*").eq("team_id", teamId).order("created_at", { ascending: false }),
    supabase.from("votes").select("*").eq("team_id", teamId),
    supabase.from("recaps").select("*").eq("team_id", teamId).order("created_at", { ascending: false }),
  ]);

  if (!team) throw new Error("Team not found");

  return {
    team: team as unknown as Team,
    players: (players.data ?? []) as unknown as Player[],
    rounds: (rounds.data ?? []) as unknown as Round[],
    categories: (categories.data ?? []) as unknown as FineCategory[],
    fines: (fines.data ?? []) as unknown as Fine[],
    votes: (votes.data ?? []) as unknown as Vote[],
    recaps: (recaps.data ?? []) as TeamBundle["recaps"],
  };
}

export function useTeamBundle(teamId: string) {
  return useQuery({
    queryKey: ["team", teamId],
    queryFn: () => fetchTeamBundle(teamId),
  });
}

export function useRefreshTeam(teamId: string) {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["team", teamId] });
}