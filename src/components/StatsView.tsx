import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  applyCaps,
  buildPlayerStats,
  categoryBreakdown,
  weekBreakdown,
  finesMasterBreakdown,
  money,
  opponentBreakdown,
  resultBreakdown,
  resultBadge,
  roundTotals,
  seasonAwards,
  venueBreakdown,
  type Breakdown,
  roundOpponentLabel,
  votesByOpponent,
  votesByVenue,
  votesByResult,
  type VoteBreakdown,
} from "@/lib/fines";
import { PhotoAvatar } from "@/components/PhotoAvatar";
import type { TeamBundle } from "@/lib/useTeamData";
import { Trophy } from "lucide-react";

const DISCOUNT_COLOR = "var(--color-destructive)";

export function StatsView({ data }: { data: TeamBundle }) {
  return (
    <Tabs defaultValue="fines">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="fines">Fines</TabsTrigger>
        <TabsTrigger value="votes">Votes</TabsTrigger>
      </TabsList>
      <div className="mt-6">
        <TabsContent value="fines">
          <FinesTab data={data} />
        </TabsContent>
        <TabsContent value="votes">
          <VotesTab data={data} />
        </TabsContent>
      </div>
    </Tabs>
  );
}

function FinesTab({ data }: { data: TeamBundle }) {
  const splits = applyCaps(data.fines, data.rounds);
  const stats = buildPlayerStats(
    data.players,
    data.fines,
    data.rounds,
    data.categories,
    data.votes,
  );
  const currency = data.team.currency;
  const total = data.fines.reduce((s, f) => s + (splits.get(f.id)?.counted ?? Number(f.amount)), 0);
  const totalDiscounted = data.fines.reduce((s, f) => s + (splits.get(f.id)?.discounted ?? 0), 0);
  const byRound = roundTotals(data.fines, data.rounds, splits);
  const byCat = categoryBreakdown(data.fines, data.categories);
  const awards = seasonAwards(stats, currency).filter(
    (a) => a.title !== "Player of the Season" && a.title !== "Most Consecutive Weeks",
  );
  const byMaster = finesMasterBreakdown(data.fines, data.rounds, splits);
  const byOpponent = opponentBreakdown(data.fines, data.rounds, splits);
  const byVenue = venueBreakdown(data.fines, data.rounds, splits);
  const byResult = resultBreakdown(data.fines, data.rounds, splits);
  const byWeek = weekBreakdown(data.fines, data.rounds, splits);

  const weeksPlayed = data.rounds.reduce((s, r) => s + (r.two_day ? 2 : 1), 0);
  const avgPerWeek = weeksPlayed > 0 ? total / weeksPlayed : 0;

  const summaryTiles = [
    { label: "Season pot", value: money(total, currency), discount: false },
    { label: "Fines logged", value: String(data.fines.length), discount: false },
    { label: "Average / week", value: money(avgPerWeek, currency), discount: false },
    { label: "Weeks played", value: String(weeksPlayed), discount: false },
    { label: "Discounted", value: money(totalDiscounted, currency), discount: true },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {summaryTiles.map((t) => (
          <Card key={t.label}>
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {t.label}
              </p>
              <p
                className={`stat-num mt-1 text-2xl font-bold ${t.discount ? "text-destructive" : ""}`}
              >
                {t.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {awards.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {awards.map((a) => (
            <Card key={a.title} className="border-accent/40">
              <CardContent className="flex gap-3 p-5">
                {a.photo ? (
                  <PhotoAvatar url={a.photo} name={a.winner} className="size-11" />
                ) : (
                  <Trophy className="size-5 shrink-0 text-accent" />
                )}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-accent-strong">
                    {a.title}
                  </p>
                  <p className="text-lg font-bold">{a.winner}</p>
                  <p className="text-sm text-muted-foreground">{a.detail}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="p-5">
          <h3 className="text-lg font-bold uppercase tracking-wide">Fines leaderboard</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2">#</th>
                  <th>Player</th>
                  <th className="text-right">Total</th>
                  <th className="text-right text-destructive">Discounted</th>
                  <th className="text-right">Avg/week</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s, i) => (
                  <tr key={s.player.id} className="border-t border-border">
                    <td className="stat-num py-2 text-muted-foreground">{i + 1}</td>
                    <td className="font-medium">
                      <span className="flex items-center gap-2">
                        <PhotoAvatar
                          url={s.player.photo_url}
                          name={s.player.name}
                          className="size-8"
                        />
                        {s.player.name}
                      </span>
                    </td>
                    <td className="stat-num text-right font-bold">{money(s.total, currency)}</td>
                    <td className="stat-num text-right font-bold text-destructive">
                      {s.discounted > 0 ? money(s.discounted, currency) : "—"}
                    </td>
                    <td className="stat-num text-right">{money(s.avgPerWeek, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {stats.length === 0 && (
              <p className="py-4 text-muted-foreground">Add players to see the leaderboard.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <h3 className="text-lg font-bold uppercase tracking-wide">Fines by round</h3>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={byRound}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Counted"
                    stroke="var(--color-accent)"
                    strokeWidth={3}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="discounted"
                    name="Discounted"
                    stroke={DISCOUNT_COLOR}
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    dot={{ r: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="text-lg font-bold uppercase tracking-wide">Top offence categories</h3>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCat.slice(0, 7)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="label" stroke="var(--color-muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                    {byCat.slice(0, 7).map((c) => (
                      <Cell key={c.label} fill="var(--color-accent)" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:gap-6 lg:grid-cols-2">
        <BreakdownCard
          title="Fines master"
          rows={byMaster}
          currency={currency}
          unit="Weeks"
          empty="Add a fines master to a round to see this."
        />
        <BreakdownCard
          title="Fines by opponent"
          rows={byOpponent}
          currency={currency}
          unit="Weeks"
          empty="Add opponents to your rounds to see this."
          showDiscount={false}
        />
        <BreakdownCard
          title="Fines by venue"
          rows={byVenue}
          currency={currency}
          unit="Weeks"
          empty="Add venues to your rounds to see this."
          showDiscount={false}
        />
        <BreakdownCard
          title="Fines by result"
          rows={byResult}
          currency={currency}
          unit="Weeks"
          empty="Add results to your rounds to see this."
          resultMode
        />
        <BreakdownCard
          title="Fines by week"
          rows={byWeek}
          currency={currency}
          unit="Weeks"
          empty="Add rounds to see this."
          showUnit={false}
          showAvg={false}
        />
      </div>
    </div>
  );
}

function VotesTab({ data }: { data: TeamBundle }) {
  const playerMap = new Map(data.players.map((p) => [p.id, p]));

  const votePoints = new Map<string, number>();
  const voteRounds = new Map<string, Set<string>>();

  for (const v of data.votes) {
    const player = playerMap.get(v.player_id);
    if (!player) continue;

    votePoints.set(v.player_id, (votePoints.get(v.player_id) ?? 0) + v.points);
    const rounds = voteRounds.get(v.player_id) ?? new Set<string>();
    rounds.add(v.round_id);
    voteRounds.set(v.player_id, rounds);
  }

  const leaderboard = [...votePoints.entries()]
    .map(([playerId, points]) => {
      const rounds = voteRounds.get(playerId)?.size ?? 0;
      return {
        player: playerMap.get(playerId)!,
        points,
        rounds,
        avg: rounds > 0 ? points / rounds : 0,
      };
    })
    .sort((a, b) => b.points - a.points);

  const totalVotes = data.votes.length;
  const totalPoints = data.votes.reduce((s, v) => s + v.points, 0);
  const roundsWithVotes = new Set(data.votes.map((v) => v.round_id)).size;
  const leader = leaderboard[0];

  const mvpAward = seasonAwards(
    buildPlayerStats(data.players, data.fines, data.rounds, data.categories, data.votes),
    data.team.currency,
  ).find((a) => a.title === "Player of the Season");

  const streakAward = seasonAwards(
    buildPlayerStats(data.players, data.fines, data.rounds, data.categories, data.votes),
    data.team.currency,
  ).find((a) => a.title === "Most Consecutive Weeks");

  const summaryTiles = [
    { label: "Total votes", value: String(totalVotes) },
    { label: "Total points", value: String(totalPoints) },
    { label: "Rounds with votes", value: String(roundsWithVotes) },
    { label: "Leader", value: leader ? `${leader.player.name} (${leader.points})` : "—" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {summaryTiles.map((t) => (
          <Card key={t.label}>
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {t.label}
              </p>
              <p className="stat-num mt-1 text-2xl font-bold">{t.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {(mvpAward || streakAward) && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {mvpAward && (
            <Card className="border-accent/40">
              <CardContent className="flex gap-3 p-5">
                {mvpAward.photo ? (
                  <PhotoAvatar url={mvpAward.photo} name={mvpAward.winner} className="size-11" />
                ) : (
                  <Trophy className="size-5 shrink-0 text-accent" />
                )}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-accent-strong">
                    {mvpAward.title}
                  </p>
                  <p className="text-lg font-bold">{mvpAward.winner}</p>
                  <p className="text-sm text-muted-foreground">{mvpAward.detail}</p>
                </div>
              </CardContent>
            </Card>
          )}
          {streakAward && (
            <Card className="border-accent/40">
              <CardContent className="flex gap-3 p-5">
                {streakAward.photo ? (
                  <PhotoAvatar url={streakAward.photo} name={streakAward.winner} className="size-11" />
                ) : (
                  <Trophy className="size-5 shrink-0 text-accent" />
                )}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-accent-strong">
                    {streakAward.title}
                  </p>
                  <p className="text-lg font-bold">{streakAward.winner}</p>
                  <p className="text-sm text-muted-foreground">{streakAward.detail}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Card>
        <CardContent className="p-5">
          <h3 className="text-lg font-bold uppercase tracking-wide">Voting leaderboard</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2">#</th>
                  <th>Player</th>
                  <th className="text-right">Votes</th>
                  <th className="text-right">Weeks</th>
                  <th className="text-right">Avg</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row, i) => (
                  <tr key={row.player.id} className="border-t border-border">
                    <td className="stat-num py-2 text-muted-foreground">{i + 1}</td>
                    <td className="font-medium">
                      <span className="flex items-center gap-2">
                        <PhotoAvatar
                          url={row.player.photo_url}
                          name={row.player.name}
                          className="size-8"
                        />
                        {row.player.name}
                      </span>
                    </td>
                    <td className="stat-num text-right font-bold">{row.points}</td>
                    <td className="stat-num text-right">{row.rounds}</td>
                    <td className="stat-num text-right">{row.avg.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {leaderboard.length === 0 && (
              <p className="py-4 text-muted-foreground">No votes recorded yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:gap-6 lg:grid-cols-2">
        <VoteBreakdownCard
          title="Votes by opponent"
          rows={votesByOpponent(data.votes, data.rounds)}
          empty="Add opponents to your rounds to see this."
        />
        <VoteBreakdownCard
          title="Votes by venue"
          rows={votesByVenue(data.votes, data.rounds)}
          empty="Add venues to your rounds to see this."
        />
        <VoteBreakdownCard
          title="Votes by result"
          rows={votesByResult(data.votes, data.rounds)}
          empty="Add results to your rounds to see this."
        />
      </div>
    </div>
  );
}

function VoteBreakdownCard({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: VoteBreakdown[];
  empty: string;
}) {
  return (
    <Card>
      <CardContent className="p-3 sm:p-5">
        <h3 className="text-sm font-bold uppercase tracking-wide sm:text-lg">{title}</h3>
        {rows.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{empty}</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="text-left uppercase text-muted-foreground">
                  <th className="py-1.5 pr-2">Name</th>
                  <th className="px-2 text-right">Votes</th>
                  <th className="px-2 text-right">Weeks</th>
                  <th className="pl-2 text-right">Avg</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label} className="border-t border-border">
                    <td className="py-1.5 pr-2">
                      <span className="flex items-center gap-1.5 font-medium uppercase">
                        <PhotoAvatar url={r.photo} name={r.label} className="size-6 shrink-0 sm:size-8" />
                        <span className="min-w-0 break-words leading-tight">{r.label}</span>
                      </span>
                    </td>
                    <td className="stat-num whitespace-nowrap px-2 text-right font-bold">{r.points}</td>
                    <td className="stat-num whitespace-nowrap px-2 text-right">{r.weeks}</td>
                    <td className="stat-num whitespace-nowrap pl-2 text-right">{r.avg.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


function BreakdownCard({
  title,
  rows,
  currency,
  unit,
  empty,
  showUnit = true,
  showAvg = true,
  showDiscount = true,
  resultMode = false,
}: {
  title: string;
  rows: Breakdown[];
  currency: string;
  unit: string;
  empty: string;
  showUnit?: boolean;
  showAvg?: boolean;
  showDiscount?: boolean;
  resultMode?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-3 sm:p-5">
        <h3 className="text-sm font-bold uppercase tracking-wide sm:text-lg">{title}</h3>
        {rows.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{empty}</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="text-left uppercase text-muted-foreground">
                  <th className="py-1.5 pr-2">Name</th>
                  <th className="px-2 text-right">Total</th>
                  {showDiscount && (
                    <th className="whitespace-nowrap px-2 text-right text-destructive">Disc.</th>
                  )}
                  {showUnit && <th className="px-2 text-right">{unit}</th>}
                  {showAvg && <th className="pl-2 text-right">Avg</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label} className="border-t border-border">
                    <td className="py-1.5 pr-2">
                      <span className="flex items-center gap-1.5 font-medium uppercase">
                        {resultMode ? (
                          <span
                            className={`inline-flex size-6 shrink-0 items-center justify-center rounded-sm text-[10px] font-bold sm:size-8 sm:text-xs ${
                              resultBadge(r.label)?.className ?? "bg-muted text-muted-foreground"
                            }`}
                          >
                            {resultBadge(r.label)?.letter ?? r.label[0]}
                          </span>
                        ) : (
                          <PhotoAvatar url={r.photo} name={r.label} className="size-6 shrink-0 sm:size-8" />
                        )}
                        <span className="min-w-0 break-words leading-tight">{r.label}</span>
                      </span>
                    </td>
                    <td className="stat-num whitespace-nowrap px-2 text-right font-bold">{money(r.total, currency)}</td>
                    {showDiscount && (
                      <td className="stat-num whitespace-nowrap px-2 text-right font-bold text-destructive">
                        {r.discounted > 0 ? money(r.discounted, currency) : "—"}
                      </td>
                    )}
                    {showUnit && <td className="stat-num whitespace-nowrap px-2 text-right">{r.rounds}</td>}
                    {showAvg && (
                      <td className="stat-num whitespace-nowrap pl-2 text-right">{money(r.avg, currency)}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
