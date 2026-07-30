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
import {
  applyCaps,
  buildPlayerStats,
  categoryBreakdown,
  weekBreakdown,
  finesMasterBreakdown,
  money,
  opponentBreakdown,
  resultBreakdown,
  roundTotals,
  seasonAwards,
  venueBreakdown,
  type Breakdown,
} from "@/lib/fines";
import { PhotoAvatar } from "@/components/PhotoAvatar";
import type { TeamBundle } from "@/lib/useTeamData";
import { Trophy } from "lucide-react";

const DISCOUNT_COLOR = "var(--color-destructive)";

export function StatsView({ data }: { data: TeamBundle }) {
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
  const awards = seasonAwards(stats, currency);
  const byMaster = finesMasterBreakdown(data.fines, data.rounds, splits);
  const byOpponent = opponentBreakdown(data.fines, data.rounds, splits);
  const byVenue = venueBreakdown(data.fines, data.rounds, splits);
  const byResult = resultBreakdown(data.fines, data.rounds, splits);
  const byWeek = weekBreakdown(data.fines, data.rounds, splits);

  const summaryTiles = [
    { label: "Season pot", value: money(total, currency), discount: false },
    { label: "Fines logged", value: String(data.fines.length), discount: false },
    { label: "Rounds played", value: String(data.rounds.length), discount: false },
    { label: "Discounted", value: money(totalDiscounted, currency), discount: true },
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
                  <th className="text-right">Fines</th>
                  <th className="text-right">Avg/round</th>
                  <th className="text-right">Votes</th>
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
                    <td className="stat-num text-right">{s.count}</td>
                    <td className="stat-num text-right">{money(s.avgPerRound, currency)}</td>
                    <td className="hidden text-muted-foreground sm:table-cell">
                      {s.topCategory ?? "—"}
                    </td>
                    <td className="stat-num text-right">{s.votePoints}</td>
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

      <div className="grid gap-6 lg:grid-cols-2">
        <BreakdownCard
          title="Fines master"
          rows={byMaster}
          currency={currency}
          unit="Rounds run"
          empty="Add a fines master to a round to see this."
        />
        <BreakdownCard
          title="Fines by opponent"
          rows={byOpponent}
          currency={currency}
          unit="Matches"
          empty="Add opponents to your rounds to see this."
        />
        <BreakdownCard
          title="Fines by venue"
          rows={byVenue}
          currency={currency}
          unit="Matches"
          empty="Add venues to your rounds to see this."
        />
        <BreakdownCard
          title="Fines by result"
          rows={byResult}
          currency={currency}
          unit="Matches"
          empty="Add results to your rounds to see this."
        />
        <BreakdownCard
          title="Fines by week"
          rows={byWeek}
          currency={currency}
          unit="Matches"
          empty="Add rounds to see this."
        />
      </div>
    </div>
  );
}

function BreakdownCard({
  title,
  rows,
  currency,
  unit,
  empty,
}: {
  title: string;
  rows: Breakdown[];
  currency: string;
  unit: string;
  empty: string;
}) {
  const hasDiscounts = rows.some((r) => r.discounted > 0);
  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-lg font-bold uppercase tracking-wide">{title}</h3>
        {rows.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{empty}</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left uppercase text-muted-foreground">
                  <th className="py-2">Name</th>
                  <th className="text-right">Total</th>
                  {hasDiscounts && (
                    <th className="text-right text-destructive">Discounted</th>
                  )}
                  <th className="text-right">Fines</th>
                  <th className="text-right">{unit}</th>
                  <th className="text-right">Avg</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label} className="border-t border-border">
                    <td className="py-2">
                      <span className="flex items-center gap-2 font-medium uppercase">
                        <PhotoAvatar url={r.photo} name={r.label} className="size-8" />
                        {r.label}
                      </span>
                    </td>
                    <td className="stat-num text-right font-bold">{money(r.total, currency)}</td>
                    {hasDiscounts && (
                      <td className="stat-num text-right font-bold text-destructive">
                        {r.discounted > 0 ? money(r.discounted, currency) : "—"}
                      </td>
                    )}
                    <td className="stat-num text-right">{r.count}</td>
                    <td className="stat-num text-right">{r.rounds}</td>
                    <td className="stat-num text-right">{money(r.avg, currency)}</td>
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
