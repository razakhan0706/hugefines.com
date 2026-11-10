import { describe, expect, test } from "bun:test";
import { buildPlayerStats, type Fine, type Player, type Round } from "./fines";

const players: Player[] = ["Noah", "Rishe", "Will"].map((name) => ({
  id: name, team_id: "team", name, nickname: null, jersey_number: null,
  photo_url: null, active: true,
}));
const rounds: Round[] = ["Master A", "Master B"].map((master) => ({
  id: master, team_id: "team", round_number: 1, label: null,
  opponent: null, played_on: null, venue: null, result: null,
  fines_master: master, cap: 24,
}));
const fines: Fine[] = rounds.flatMap((round) =>
  [["Noah", 24], ["Rishe", 25], ["Will", 23]].map(([player, amount]) => ({
    id: `${round.id}-${player}`, team_id: "team", player_id: String(player),
    round_id: round.id, category_id: null, description: "Fine",
    amount: Number(amount), paid: false, created_at: "2026-11-10T00:00:00Z",
  })),
);

describe("player fines leaderboard", () => {
  test("all masters: equal totals rank higher discounted fines first", () => {
    const stats = buildPlayerStats(players, fines, rounds, [], []);
    expect(stats.map((s) => [s.player.name, s.total, s.discounted])).toEqual([
      ["Rishe", 48, 2], ["Noah", 48, 0], ["Will", 46, 0],
    ]);
  });

  for (const master of ["Master A", "Master B"]) {
    test(`${master}: equal $24 totals rank $1 discounted before $0`, () => {
      const filtered = fines.filter((fine) => fine.round_id === master);
      const stats = buildPlayerStats(players, filtered, rounds, [], []);
      expect(stats.map((s) => [s.player.name, s.total, s.discounted])).toEqual([
        ["Rishe", 24, 1], ["Noah", 24, 0], ["Will", 23, 0],
      ]);
    });
  }
});