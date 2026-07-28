export type VoteFormat = "5-4-3-2-1" | "3-2-1" | "1";

export const VOTE_FORMATS: Record<VoteFormat, number[]> = {
  "5-4-3-2-1": [5, 4, 3, 2, 1],
  "3-2-1": [3, 2, 1],
  "1": [1],
};

export interface Player {
  id: string;
  team_id: string;
  name: string;
  nickname: string | null;
  jersey_number: number | null;
  active: boolean;
}

export interface Round {
  id: string;
  team_id: string;
  round_number: number;
  label: string | null;
  opponent: string | null;
  played_on: string | null;
  venue: string | null;
  result: string | null;
  fines_master?: string | null;
}

export interface FineCategory {
  id: string;
  team_id: string;
  label: string;
  default_amount: number;
}

export interface Fine {
  id: string;
  team_id: string;
  player_id: string;
  round_id: string | null;
  category_id: string | null;
  description: string;
  amount: number;
  paid: boolean;
  created_at: string;
}

export interface Vote {
  id: string;
  team_id: string;
  player_id: string;
  round_id: string;
  points: number;
}

export interface Team {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  sport: string;
  season_name: string;
  accent_color: string;
  vote_format: VoteFormat;
  votes_public: boolean;
  is_public: boolean;
  player_limit: number;
  currency: string;
}

export function money(amount: number, currency = "$") {
  return `${currency}${amount.toFixed(2).replace(/\.00$/, "")}`;
}

export const FINE_CATEGORY_GROUPS: { group: string; labels: string[] }[] = [
  {
    group: "General",
    labels: [
      "Dummy spit",
      "Rubbish chat",
      "Getting into a fight",
      "Late arrival",
      "Lost/forgetting equipment",
    ],
  },
  {
    group: "Batting",
    labels: ["Filthy hack", "BBQ", "Getting clean bowled", "Missing a straight one"],
  },
  {
    group: "Bowling",
    labels: ["Half tracker", "Getting whacked out of the ground", "No ball", "Wide"],
  },
  {
    group: "Fielding",
    labels: ["Dropped a sitter", "Misfield", "Asleep in the field", "Custard arm"],
  },
];

export const DEFAULT_FINE_CATEGORIES = FINE_CATEGORY_GROUPS.flatMap((g) => g.labels);

export function groupForCategory(label: string) {
  const found = FINE_CATEGORY_GROUPS.find((g) =>
    g.labels.some((l) => l.toLowerCase() === label.trim().toLowerCase()),
  );
  return found?.group ?? "Other";
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export interface PlayerStat {
  player: Player;
  total: number;
  count: number;
  unpaid: number;
  rounds: number;
  avgPerRound: number;
  topCategory: string | null;
  biggest: number;
  streak: number;
  votePoints: number;
  voteRounds: number;
}

export function buildPlayerStats(
  players: Player[],
  fines: Fine[],
  rounds: Round[],
  categories: FineCategory[],
  votes: Vote[],
): PlayerStat[] {
  const catLabel = new Map(categories.map((c) => [c.id, c.label]));
  const orderedRounds = [...rounds].sort((a, b) => a.round_number - b.round_number);

  return players
    .map((player) => {
      const mine = fines.filter((f) => f.player_id === player.id);
      const total = mine.reduce((s, f) => s + Number(f.amount), 0);
      const unpaid = mine.filter((f) => !f.paid).reduce((s, f) => s + Number(f.amount), 0);
      const roundIds = new Set(mine.map((f) => f.round_id).filter(Boolean));

      const byCat = new Map<string, number>();
      for (const f of mine) {
        const key = f.category_id ? (catLabel.get(f.category_id) ?? "Custom") : "Custom";
        byCat.set(key, (byCat.get(key) ?? 0) + 1);
      }
      const topCategory =
        [...byCat.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

      let streak = 0;
      let best = 0;
      for (const r of orderedRounds) {
        if (mine.some((f) => f.round_id === r.id)) {
          streak += 1;
          best = Math.max(best, streak);
        } else {
          streak = 0;
        }
      }

      const myVotes = votes.filter((v) => v.player_id === player.id);

      return {
        player,
        total,
        count: mine.length,
        unpaid,
        rounds: roundIds.size,
        avgPerRound: roundIds.size ? total / roundIds.size : 0,
        topCategory,
        biggest: mine.reduce((m, f) => Math.max(m, Number(f.amount)), 0),
        streak: best,
        votePoints: myVotes.reduce((s, v) => s + v.points, 0),
        voteRounds: myVotes.length,
      };
    })
    .sort((a, b) => b.total - a.total);
}

export function categoryBreakdown(fines: Fine[], categories: FineCategory[]) {
  const catLabel = new Map(categories.map((c) => [c.id, c.label]));
  const map = new Map<string, { label: string; total: number; count: number }>();
  for (const f of fines) {
    const label = f.category_id ? (catLabel.get(f.category_id) ?? "Custom") : "Custom";
    const row = map.get(label) ?? { label, total: 0, count: 0 };
    row.total += Number(f.amount);
    row.count += 1;
    map.set(label, row);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

export function roundTotals(fines: Fine[], rounds: Round[]) {
  return [...rounds]
    .sort((a, b) => a.round_number - b.round_number)
    .map((r) => ({
      name: r.label || `R${r.round_number}`,
      total: fines
        .filter((f) => f.round_id === r.id)
        .reduce((s, f) => s + Number(f.amount), 0),
      count: fines.filter((f) => f.round_id === r.id).length,
    }));
}

export interface Award {
  title: string;
  winner: string;
  detail: string;
}

export function seasonAwards(stats: PlayerStat[], currency: string): Award[] {
  if (!stats.length) return [];
  const fined = stats.filter((s) => s.count > 0);
  const awards: Award[] = [];

  const mvp = [...stats].sort((a, b) => b.votePoints - a.votePoints)[0];
  if (mvp && mvp.votePoints > 0) {
    awards.push({
      title: "Player of the Season",
      winner: mvp.player.name,
      detail: `${mvp.votePoints} votes across ${mvp.voteRounds} rounds`,
    });
  }

  const most = fined[0];
  if (most) {
    awards.push({
      title: "Most Fined",
      winner: most.player.name,
      detail: `${money(most.total, currency)} from ${most.count} fines`,
    });
  }

  const cleanest = [...stats].sort((a, b) => a.total - b.total)[0];
  if (cleanest) {
    awards.push({
      title: "Best Behaviour",
      winner: cleanest.player.name,
      detail: `Only ${money(cleanest.total, currency)} all season`,
    });
  }

  const streaky = [...stats].sort((a, b) => b.streak - a.streak)[0];
  if (streaky && streaky.streak > 1) {
    awards.push({
      title: "Repeat Offender",
      winner: streaky.player.name,
      detail: `Fined in ${streaky.streak} rounds in a row`,
    });
  }

  const bigOne = [...stats].sort((a, b) => b.biggest - a.biggest)[0];
  if (bigOne && bigOne.biggest > 0) {
    awards.push({
      title: "Biggest Single Fine",
      winner: bigOne.player.name,
      detail: money(bigOne.biggest, currency),
    });
  }

  return awards;
}