import { useState } from "react";
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
import { buildPlayerStats, money } from "@/lib/fines";
import type { TeamBundle } from "@/lib/useTeamData";

export function RecapPanel({ data, refresh }: { data: TeamBundle; refresh: () => void }) {
  const run = useServerFn(generateRecap);
  const [scope, setScope] = useState<string>(data.rounds.at(-1)?.id ?? "season");
  const [tone, setTone] = useState("Cheeky clubhouse banter");
  const [busy, setBusy] = useState(false);

  function buildSummary() {
    const isRound = scope !== "season";
    const fines = isRound ? data.fines.filter((f) => f.round_id === scope) : data.fines;
    const names = new Map(data.players.map((p) => [p.id, p.name]));
    const cats = new Map(data.categories.map((c) => [c.id, c.label]));
    const round = data.rounds.find((r) => r.id === scope);
    const stats = buildPlayerStats(data.players, fines, data.rounds, data.categories, data.votes);

    const lines = [
      `Team: ${data.team.name} (${data.team.sport}), season ${data.team.season_name}.`,
      isRound
        ? `Round: ${round ? roundDayLabel(round) : ""} vs ${round?.opponent ?? "unknown"} — ${round?.result ?? "result unrecorded"}.`
        : `Whole season across ${data.rounds.length} rounds.`,
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
                <SelectItem value="Cheeky clubhouse banter">Cheeky clubhouse banter</SelectItem>
                <SelectItem value="Dramatic sports commentator">Dramatic commentator</SelectItem>
                <SelectItem value="Dry deadpan newsreader">Dry deadpan newsreader</SelectItem>
                <SelectItem value="Wholesome and encouraging">Wholesome and encouraging</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
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
        {data.recaps.map((r) => (
          <Card key={r.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-accent-strong">
                  {r.scope === "season" ? "Season wrap" : "Round recap"} ·{" "}
                  {new Date(r.created_at).toLocaleDateString()}
                </p>
                <Button variant="ghost" size="icon" onClick={() => remove(r.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <p className="mt-2 whitespace-pre-wrap leading-relaxed">{r.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}