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
  buildPlayerStats,
  categoryBreakdown,
  money,
  roundTotals,
  seasonAwards,
} from "@/lib/fines";
import type { TeamBundle } from "@/lib/useTeamData";
import { Trophy } from "lucide-react";

export function StatsView({ data }: { data: TeamBundle }) {
  const stats = buildPlayerStats(
    data.players,
    data.fines,
    data.rounds,
    data.categories,
    data.votes,
  );
  const currency = data.team.currency;
  const total = data.fines.reduce((s, f) => s + Number(f.amount), 0);
  const unpaid = data.fines.filter((f) => !f.paid).reduce((s, f) => s + Number(f.amount), 0);
  const byRound = roundTotals(data.fines, data.rounds);
  const byCat = categoryBreakdown(data.fines, data.categories);
  const awards = seasonAwards(stats, currency);

  const summaryTiles = [
    { label: "Season pot", value: money(total, currency) },
    { label: "Outstanding", value: money(unpaid, currency) },
    { label: "Fines logged", value: String(data.fines.length) },
    { label: "Rounds played", value: String(data.rounds.length) },
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

      {awards.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {awards.map((a) => (
            <Card key={a.title} className="border-accent/40">
              <CardContent className="flex gap-3 p-5">
                <Trophy className="size-5 shrink-0 text-accent" />
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
          <h3 className="text-lg font-bold">Fines leaderboard</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2">#</th>
                  <th>Player</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Fines</th>
                  <th className="text-right">Avg/round</th>
                  <th className="hidden sm:table-cell">Speciality</th>
                  <th className="text-right">Votes</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s, i) => (
                  <tr key={s.player.id} className="border-t border-border">
                    <td className="stat-num py-2 text-muted-foreground">{i + 1}</td>
                    <td className="font-medium">{s.player.name}</td>
                    <td className="stat-num text-right font-bold">{money(s.total, currency)}</td>
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
            <h3 className="text-lg font-bold">Fines by round</h3>
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
                    stroke="var(--color-accent)"
                    strokeWidth={3}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="text-lg font-bold">Top offence categories</h3>
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
    </div>
  );
}