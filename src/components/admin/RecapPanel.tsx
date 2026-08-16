import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { generateRecap } from "@/lib/recap.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Sparkles, Trash2 } from "lucide-react";
import { buildPlayerStats, money, roundDayLabel } from "@/lib/fines";
import type { TeamBundle } from "@/lib/useTeamData";
import { cn } from "@/lib/utils";

export function RecapPanel({ data, refresh }: { data: TeamBundle; refresh: () => void }) {
  const run = useServerFn(generateRecap);
  const [scope, setScope] = useState<string>(data.rounds.at(-1)?.id ?? "season");
  const [tone, setTone] = useState("Absolutely ruthless");
  const [includeVotes, setIncludeVotes] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("huge-fines-include-votes") === "yes";
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    window.localStorage.setItem("huge-fines-include-votes", includeVotes ? "yes" : "no");
  }, [includeVotes]);

  function buildSummary() {
    const isRound = scope !== "season";
    const fines = isRound ? data.fines.filter((f) => f.round_id === scope) : data.fines;
    const names = new Map(data.players.map((p) => [p.id, p.name]));
    const cats = new Map(data.categories.map((c) => [c.id, c.label]));
    const round = data.rounds.find((r) => r.id === scope);
    const stats = buildPlayerStats(data.players, fines, data.rounds, data.categories, data.votes);

    const dayOneOfTwo = Boolean(round?.two_day && (round?.day ?? 1) === 1);
    const resultText = round?.result ?? "";
    const resultPending = dayOneOfTwo || /in progress/i.test(resultText) || !resultText.trim();

    const lines = [
      `Team: ${data.team.name} (${data.team.sport}), season ${data.team.season_name}.`,
      isRound
        ? `Round: ${round ? roundDayLabel(round) : ""} vs ${round?.opponent ?? "unknown"}${
            resultPending ? "" : ` — ${resultText}`
          }.`
        : `Whole season across ${data.rounds.length} rounds.`,
      ...(isRound && resultPending
        ? [
            dayOneOfTwo
              ? "IMPORTANT: this is Day 1 of a two-day match, so the result is not decided yet. Do NOT mention, guess or imply any result, win, loss or draw."
              : "IMPORTANT: the result for this round is not recorded yet. Do NOT mention, guess or imply any result.",
          ]
        : []),
      "",
      "Fines:",
      ...fines
        .slice(0, 40)
        .map(
          (f) =>
            `- ${names.get(f.player_id) ?? "Someone"}: ${f.description}${
              f.category_id ? ` (${cats.get(f.category_id)})` : ""
            } ${money(Number(f.amount), data.team.currency)}`,
        ),
      "",
      "Top offenders:",
      ...stats
        .slice(0, 5)
        .map((s) => `- ${s.player.name}: ${money(s.total, data.team.currency)} from ${s.count} fines`),
    ];

    if (includeVotes) {
      const votes = isRound ? data.votes.filter((v) => v.round_id === scope) : data.votes;
      const tallyOf = (list: typeof data.votes) => {
        const t = new Map<string, number>();
        for (const v of list) t.set(v.player_id, (t.get(v.player_id) ?? 0) + v.points);
        return [...t.entries()].sort((a, b) => b[1] - a[1]);
      };
      const scoped = tallyOf(votes);
      const season = tallyOf(data.votes);
      const fmt = (rows: [string, number][]) =>
        rows.slice(0, 8).map(([pid, pts]) => `- ${names.get(pid) ?? "Someone"}: ${pts} votes`);
      const identical =
        JSON.stringify(scoped) === JSON.stringify(season);

      if (!votes.length) {
        lines.push("", "Player votes: none recorded for this scope.");
      } else if (isRound) {
        lines.push(
          "",
          `Player votes for THIS ROUND (${data.team.vote_format}) — celebrate the vote-getters only, never mock anyone for a low tally:`,
          ...fmt(scoped),
        );
        if (identical) {
          lines.push(
            "",
            "NOTE: this is the first round, so the cumulative season tally is exactly the same as the round tally. Mention it once only — do not repeat the numbers as if they were two different things.",
          );
        } else {
          lines.push("", "Cumulative season totals so far (keep clearly separate from the round tally above):", ...fmt(season));
        }
      } else {
        lines.push(
          "",
          `Season vote totals (${data.team.vote_format}) — celebrate the vote-getters only, never mock anyone for a low tally:`,
          ...fmt(season),
        );
      }
    } else {
      lines.push("", "IMPORTANT: Player votes are secret. Do not mention votes, voting, or best-player awards at all.");
    }

    return lines.join("\n");
  }

  async function generate() {
    setBusy(true);
    try {
      const { text } = await run({
        data: {
          summary: buildSummary(),
          tone,
          scope: scope === "season" ? "Season wrap" : "Round recap",
        },
      });
      const { error } = await supabase.from("recaps").insert({
        team_id: data.team.id,
        round_id: scope === "season" ? null : scope,
        scope: scope === "season" ? "season" : "round",
        body: text,
      });
      if (error) throw error;
      refresh();
      toast.success("Recap generated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not generate recap");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await supabase.from("recaps").delete().eq("id", id);
    refresh();
  }

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardContent className="grid gap-3 p-5 sm:grid-cols-3">
          <div>
            <label className="text-sm font-medium">What to write about</label>
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="season">Whole season</SelectItem>
                {[...data.rounds].reverse().map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {roundDayLabel(r)}
                    {r.opponent ? ` vs ${r.opponent}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Tone</label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Absolutely ruthless">Absolutely ruthless</SelectItem>
                <SelectItem value="Dramatic sports commentator">Dramatic commentator</SelectItem>
                <SelectItem value="Cheeky clubhouse banter">Cheeky clubhouse banter</SelectItem>
                <SelectItem value="Dry deadpan newsreader">Dry deadpan newsreader</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 sm:col-span-3">
            <label className="text-sm font-medium">Include votes in the recap</label>
            <div className="grid grid-cols-2 gap-0 overflow-hidden rounded-md border">
              <button
                type="button"
                onClick={() => setIncludeVotes(true)}
                className={cn(
                  "px-4 py-2 text-sm font-semibold uppercase transition-colors",
                  includeVotes
                    ? "bg-accent text-white"
                    : "bg-background text-foreground hover:bg-muted",
                )}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setIncludeVotes(false)}
                className={cn(
                  "px-4 py-2 text-sm font-semibold uppercase transition-colors",
                  !includeVotes
                    ? "bg-accent text-white"
                    : "bg-background text-foreground hover:bg-muted",
                )}
              >
                No
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {includeVotes
                ? "The AI will add vote commentary and name the leaders."
                : "Votes stay secret — the AI won't mention them."}
            </p>
          </div>
          <div className="flex items-end sm:col-span-3">
            <Button className="w-full" onClick={generate} disabled={busy || !data.fines.length}>
              <Sparkles className="size-4" />
              {busy ? "Writing…" : "Generate recap"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {data.recaps.length === 0 && (
          <p className="text-muted-foreground">
            No recaps yet. Log some fines, then let the AI roast the squad.
          </p>
        )}
        {data.recaps.map((r) => {
          const round = r.round_id
            ? data.rounds.find((round) => round.id === r.round_id)
            : null;
          const latestRound = data.rounds.at(-1);
          const dateValue = round?.played_on ?? latestRound?.played_on ?? r.created_at;
          const dateText = new Date(dateValue).toLocaleDateString("en-GB");

          return (
            <Card key={r.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-accent-strong">
                    Recap · {dateText}
                  </p>
                  <Button variant="ghost" size="icon" onClick={() => remove(r.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <p className="mt-2 whitespace-pre-wrap leading-relaxed">{r.body}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}