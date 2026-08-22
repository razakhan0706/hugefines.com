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
  photo_url: string | null;
  active: boolean;
}

export interface Round {
  id: string;
  team_id: string;
  created_at?: string | null;
  round_number: number;
  label: string | null;
  opponent: string | null;
  played_on: string | null;
  venue: string | null;
  result: string | null;
  fines_master?: string | null;
  fines_master_photo_url?: string | null;
  opponent_logo_url?: string | null;
  two_day?: boolean | null;
  day?: number | null;
  cap?: number | null;
}

/** Rounds ordered by when they were added, with the newest week first and Day 2 before Day 1. */
export function newestRoundsFirst(rounds: Round[]) {
  return [...rounds].sort((a, b) => {
    const createdDifference = Date.parse(b.created_at ?? "") - Date.parse(a.created_at ?? "");
    if (Number.isFinite(createdDifference) && createdDifference !== 0) return createdDifference;
    if (a.round_number !== b.round_number) return b.round_number - a.round_number;
    return (b.day ?? 0) - (a.day ?? 0);
  });
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
  week?: number | null;
}

/** The name the admin typed (e.g. "Trial Match 1"), falling back to "Round 4". */
export function roundBaseLabel(round: Round) {
  const typed = (round.label ?? "").replace(/\s*-\s*day\s*\d+\s*$/i, "").trim();
  return typed || `Round ${round.round_number}`;
}

/** "TRIAL MATCH 1" or "TRIAL MATCH 1 - DAY 2" for a round (optionally a specific day). */
export function roundDayLabel(round: Round, day?: number | null) {
  const base = roundBaseLabel(round);
  const d = day ?? round.day ?? null;
  return round.two_day && d ? `${base} - Day ${d}` : base;
}

/** "TRIAL MATCH 1 vs BEROWRA" — round label plus opponent when known. */
export function roundOpponentLabel(round: Round, day?: number | null) {
  const base = roundDayLabel(round, day);
  const opp = (round.opponent ?? "").trim();
  return opp ? `${base} vs ${opp}` : base;
}

export interface Vote {
  id: string;
  team_id: string;
  player_id: string;
  round_id: string;
  points: number;
  created_at: string;
}

export interface Team {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  sport: string;
  season_name: string;
  logo_url?: string | null;
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
      "Hungover",
      "Late arrival",
      "Wrong Uniform",
    ],
  },
  {
    group: "Batting",
    labels: ["Filthy hack", "BBQ", "Soft/ridiculous dismissal"],
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

// ---------------------------------------------------------------------------
// Cap logic — splits each fine into counted vs discounted portions
// ---------------------------------------------------------------------------

export interface FineSplit {
  counted: number;
  discounted: number;
}

/**
 * For each fine, determine how much counts toward tallies and how much is
 * "discounted" (excess over the round's per-player-per-week cap).
 *
 * Groups fines by player + round + week (day for 2-day rounds), sorts oldest
 * first, and walks the running total against the round's cap. The first fines
 * count fully; the fine that pushes the total over the cap is partially
 * counted / partially discounted; everything after is fully discounted.
 */
export function applyCaps(fines: Fine[], rounds: Round[]): Map<string, FineSplit> {
  const roundMap = new Map(rounds.map((r) => [r.id, r]));
  const result = new Map<string, FineSplit>();

  // Group by player + round + week
  const groups = new Map<string, Fine[]>();
  for (const f of fines) {
    const weekKey = f.week ?? 1;
    const key = `${f.player_id}|${f.round_id ?? ""}|${weekKey}`;
    const arr = groups.get(key) ?? [];
    arr.push(f);
    groups.set(key, arr);
  }

  for (const [, groupFines] of groups) {
    const sorted = [...groupFines].sort((a, b) =>
      a.created_at.localeCompare(b.created_at),
    );
    const round = sorted[0].round_id ? roundMap.get(sorted[0].round_id) : null;
    const capRaw = round?.cap;
    const cap = capRaw != null ? Number(capRaw) : null;

    if (cap === null || Number.isNaN(cap)) {
      for (const f of sorted) {
        result.set(f.id, { counted: Number(f.amount), discounted: 0 });
      }
      continue;
    }

    let running = 0;
    for (const f of sorted) {
      const amount = Number(f.amount);
      if (running >= cap) {
        result.set(f.id, { counted: 0, discounted: amount });
      } else if (running + amount <= cap) {
        result.set(f.id, { counted: amount, discounted: 0 });
        running += amount;
      } else {
        const counted = cap - running;
        result.set(f.id, { counted, discounted: amount - counted });
        running = cap;
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Player stats
// ---------------------------------------------------------------------------

export interface PlayerStat {
  player: Player;
  total: number;
  discounted: number;
  count: number;
  unpaid: number;
  rounds: number;
  avgPerWeek: number;
  topCategory: string | null;
  biggest: number;
  streak: number;
  votePoints: number;
  voteRounds: number;
  voteStreak: number;
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
  const splits = applyCaps(fines, rounds);

  const allWeeks = rounds.reduce(
    (s, r) => s + (r.two_day && !r.day ? 2 : 1),
    0,
  );

  return players
    .map((player) => {
      const mine = fines.filter((f) => f.player_id === player.id);
      const total = mine.reduce((s, f) => s + (splits.get(f.id)?.counted ?? Number(f.amount)), 0);
      const discounted = mine.reduce((s, f) => s + (splits.get(f.id)?.discounted ?? 0), 0);
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

      let voteStreak = 0;
      let bestVoteStreak = 0;
      const votedRoundIds = new Set(myVotes.map((v) => v.round_id));
      for (const r of orderedRounds) {
        if (votedRoundIds.has(r.id)) {
          voteStreak += 1;
          bestVoteStreak = Math.max(bestVoteStreak, voteStreak);
        } else {
          voteStreak = 0;
        }
      }

      return {
        player,
        total,
        discounted,
        count: mine.length,
        unpaid,
        rounds: roundIds.size,
        avgPerWeek: allWeeks ? total / allWeeks : 0,
        topCategory,
        biggest: mine.reduce((m, f) => Math.max(m, Number(f.amount)), 0),
        streak: best,
        votePoints: myVotes.reduce((s, v) => s + v.points, 0),
        voteRounds: myVotes.length,
        voteStreak: bestVoteStreak,
      };
    })
    .sort((a, b) => b.total - a.total);
}

// ---------------------------------------------------------------------------
// Breakdowns
// ---------------------------------------------------------------------------

export interface Breakdown {
  label: string;
  total: number;
  discounted: number;
  count: number;
  rounds: number;
  avg: number;
  photo?: string | null;
}

export function categoryBreakdown(fines: Fine[], categories: FineCategory[]) {
  const catLabel = new Map(categories.map((c) => [c.id, c.label]));
  const map = new Map<string, { label: string; total: number; count: number }>();
  for (const f of fines) {
    const label = f.category_id
      ? (catLabel.get(f.category_id) ?? f.description.trim() ?? "Custom")
      : (f.description.trim() || "Custom");
    const row = map.get(label) ?? { label, total: 0, count: 0 };
    row.total += Number(f.amount);
    row.count += 1;
    map.set(label, row);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

export function roundTotals(fines: Fine[], rounds: Round[], splits?: Map<string, FineSplit>) {
  const capSplits = splits ?? applyCaps(fines, rounds);
  return [...rounds]
    .sort((a, b) => a.round_number - b.round_number)
    .map((r, index) => {
      const mine = fines.filter((f) => f.round_id === r.id);
      return {
        name: String(index + 1),
        total: mine.reduce((s, f) => s + (capSplits.get(f.id)?.counted ?? Number(f.amount)), 0),
        discounted: mine.reduce((s, f) => s + (capSplits.get(f.id)?.discounted ?? 0), 0),
        count: mine.length,
      };
    });
}

export interface Award {
  title: string;
  winner: string;
  detail: string;
  photo?: string | null;
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
      photo: mvp.player.photo_url,
      detail: `${mvp.votePoints} votes`,
    });
  }

  const mostConsistent = [...stats].sort((a, b) => b.voteStreak - a.voteStreak)[0];
  if (mostConsistent && mostConsistent.voteStreak > 0) {
    const weeks = mostConsistent.voteStreak;
    awards.push({
      title: "Most Consecutive Weeks",
      winner: mostConsistent.player.name,
      photo: mostConsistent.player.photo_url,
      detail: `Votes in ${weeks} consecutive week${weeks === 1 ? "" : "s"}`,
    });
  }

  const most = fined[0];
  if (most) {
    awards.push({
      title: "Most Fined",
      winner: most.player.name,
      photo: most.player.photo_url,
      detail: `${money(most.total, currency)} from ${most.count} fines`,
    });
  }

  const mostDiscounted = [...stats].sort((a, b) => b.discounted - a.discounted)[0];

  if (mostDiscounted && mostDiscounted.discounted > 0) {
    awards.push({
      title: "Most Discounted Fines",
      winner: mostDiscounted.player.name,
      photo: mostDiscounted.player.photo_url,
      detail: `${money(mostDiscounted.discounted, currency)} discounted`,
    });
  }

  return awards;
}

/** Groups fines by an attribute of the round they belong to. */
export function roundAttributeBreakdown(
  fines: Fine[],
  rounds: Round[],
  pick: (r: Round) => string | null | undefined,
  photo?: (r: Round) => string | null | undefined,
  splits?: Map<string, FineSplit>,
): Breakdown[] {
  const capSplits = splits ?? applyCaps(fines, rounds);
  const map = new Map<string, { total: number; discounted: number; count: number; rounds: Set<string>; photo?: string | null }>();
  for (const r of rounds) {
    const key = (pick(r) ?? "").trim();
    if (!key) continue;
    const row = map.get(key) ?? { total: 0, discounted: 0, count: 0, rounds: new Set<string>(), photo: photo?.(r) };
    if (!row.photo && photo?.(r)) row.photo = photo(r);
    row.rounds.add(r.id);
    for (const f of fines) {
      if (f.round_id !== r.id) continue;
      const split = capSplits.get(f.id);
      row.total += split?.counted ?? Number(f.amount);
      row.discounted += split?.discounted ?? 0;
      row.count += 1;
    }
    map.set(key, row);
  }
  return [...map.entries()]
    .map(([label, v]) => ({
      label,
      total: v.total,
      discounted: v.discounted,
      count: v.count,
      rounds: v.rounds.size,
      avg: v.rounds.size ? v.total / v.rounds.size : 0,
      photo: v.photo,
    }))
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      if (b.discounted !== a.discounted) return b.discounted - a.discounted;
      if (b.avg !== a.avg) return b.avg - a.avg;
      return b.rounds - a.rounds;
    });
}

export function finesMasterBreakdown(fines: Fine[], rounds: Round[], splits?: Map<string, FineSplit>) {
  return roundAttributeBreakdown(
    fines,
    rounds,
    (r) => r.fines_master,
    (r) => r.fines_master_photo_url,
    splits,
  );
}

export function opponentBreakdown(fines: Fine[], rounds: Round[], splits?: Map<string, FineSplit>) {
  return roundAttributeBreakdown(
    fines,
    rounds,
    (r) => r.opponent,
    (r) => r.opponent_logo_url,
    splits,
  );
}

export function venueBreakdown(fines: Fine[], rounds: Round[], splits?: Map<string, FineSplit>) {
  return roundAttributeBreakdown(fines, rounds, (r) => r.venue, undefined, splits);
}

/** Buckets results into Win / Loss / Draw-ish groups using the free-text result. */
export function resultBadge(result: string | null | undefined) {
  const v = (result ?? "").toLowerCase();
  if (!v.trim()) return null;
  if (/in progress/.test(v)) return { letter: "IP", className: "bg-muted text-muted-foreground" };
  if (/\bwon|\bwin/.test(v)) return { letter: "W", className: "bg-accent text-accent-foreground" };
  if (/\blost|\bloss|\bdefeat/.test(v)) return { letter: "L", className: "bg-destructive text-destructive-foreground" };
  if (/draw|tie|abandon|wash/.test(v)) return { letter: "D", className: "bg-primary text-primary-foreground" };
  return null;
}

export function resultBucket(result: string | null | undefined) {
  const v = (result ?? "").toLowerCase();
  if (!v.trim()) return null;
  if (/in progress/.test(v)) return null;
  if (/\bwon|\bwin/.test(v)) return "Wins";
  if (/\blost|\bloss|\bdefeat/.test(v)) return "Losses";
  if (/draw|tie|abandon|wash/.test(v)) return "Draws";
  return "Other";
}

export function resultBreakdown(fines: Fine[], rounds: Round[], splits?: Map<string, FineSplit>) {
  return roundAttributeBreakdown(fines, rounds, (r) => resultBucket(r.result), undefined, splits);
}

/** Groups vote points by an attribute of the round they belong to. */
export function voteAttributeBreakdown(
  votes: { round_id: string; points: number }[],
  rounds: Round[],
  pick: (r: Round) => string | null | undefined,
  photo?: (r: Round) => string | null | undefined,
): Breakdown[] {
  const map = new Map<
    string,
    { total: number; count: number; rounds: Set<string>; photo?: string | null }
  >();
  for (const r of rounds) {
    const key = (pick(r) ?? "").trim();
    if (!key) continue;
    const row = map.get(key) ?? { total: 0, count: 0, rounds: new Set<string>(), photo: photo?.(r) };
    if (!row.photo && photo?.(r)) row.photo = photo(r);
    row.rounds.add(r.id);
    for (const v of votes) {
      if (v.round_id !== r.id) continue;
      row.total += Number(v.points);
      row.count += 1;
    }
    map.set(key, row);
  }
  return [...map.entries()]
    .map(([label, v]) => ({
      label,
      total: v.total,
      discounted: 0,
      count: v.count,
      rounds: v.rounds.size,
      avg: v.rounds.size ? v.total / v.rounds.size : 0,
      photo: v.photo,
    }))
    .filter((r) => r.total > 0)
    .sort((a, b) => (b.total !== a.total ? b.total - a.total : b.rounds - a.rounds));
}



/** Fines grouped by round, split into days for two-day rounds. */
export function weekBreakdown(fines: Fine[], rounds: Round[], splits?: Map<string, FineSplit>): Breakdown[] {
  const capSplits = splits ?? applyCaps(fines, rounds);
  const ordered = [...rounds].sort((a, b) => a.round_number - b.round_number);
  const rows: Breakdown[] = [];
  for (const r of ordered) {
    const mine = fines.filter((f) => f.round_id === r.id);
    const days = r.two_day ? (r.day ? [r.day] : [1, 2]) : [null];
    for (const d of days) {
      const subset = d === null ? mine : mine.filter((f) => (f.week ?? 1) === d);
      const total = subset.reduce((s, f) => s + (capSplits.get(f.id)?.counted ?? Number(f.amount)), 0);
      const discounted = subset.reduce((s, f) => s + (capSplits.get(f.id)?.discounted ?? 0), 0);
      rows.push({
        label: roundDayLabel(r, d),
        total,
        discounted,
        count: subset.length,
        rounds: 1,
        avg: total,
        photo: r.opponent_logo_url,
      });
    }
  }
  rows.sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    if (b.discounted !== a.discounted) return b.discounted - a.discounted;
    if (b.avg !== a.avg) return b.avg - a.avg;
    return b.rounds - a.rounds;
  });
  return rows;
}

/** Distinct previously-used text values for a field, most-used spelling first. */
export function distinctValues<T>(rows: T[], pick: (row: T) => string | null | undefined): string[] {
  return distinctValuesImpl(rows, pick);
}


function distinctValuesImpl<T>(rows: T[], pick: (row: T) => string | null | undefined): string[] {
  const counts = new Map<string, { value: string; count: number }>();
  for (const row of rows) {
    const raw = (pick(row) ?? "").trim();
    if (!raw) continue;
    const key = raw.toLowerCase().replace(/\s+/g, " ");
    const existing = counts.get(key);
    if (existing) existing.count += 1;
    else counts.set(key, { value: raw, count: 1 });
  }
  return [...counts.values()].sort((a, b) => b.count - a.count).map((c) => c.value);
}
