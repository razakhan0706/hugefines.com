import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { VOTE_FORMATS } from "@/lib/fines";
import type { TeamBundle } from "@/lib/useTeamData";

export function VotingPanel({ data, refresh }: { data: TeamBundle; refresh: () => void }) {
  const points = VOTE_FORMATS[data.team.vote_format] ?? VOTE_FORMATS["3-2-1"];
  const [roundId, setRoundId] = useState(data.rounds.at(-1)?.id ?? "");
  const [picks, setPicks] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);

  // When the selected round changes (or votes refresh), load any existing
  // votes for that round into the picks so the editor reflects saved state.
  useEffect(() => {
    if (!roundId) {
      setPicks({});
      return;
    }
    const existing: Record<number, string> = {};
    for (const v of data.votes) {
      if (v.round_id === roundId) existing[v.points] = v.player_id;
    }
    setPicks(existing);
  }, [roundId, data.votes]);

  const roundVotes = data.votes.filter((v) => v.round_id === roundId);

  async function saveVotes() {
    if (!roundId) return toast.error("Pick a round first");
    const rows = points
      .map((p) => ({ points: p, player_id: picks[p] }))
      .filter((r) => r.player_id)
      .map((r) => ({
        team_id: data.team.id,
        round_id: roundId,
        player_id: r.player_id,
        points: r.points,
      }));
    if (!rows.length) return toast.error("Select at least one player");

    setBusy(true);
    const { error: delError } = await supabase.from("votes").delete().eq("round_id", roundId);
    if (delError) {
      setBusy(false);
      return toast.error(delError.message);
    }
    const { error } = await supabase.from("votes").insert(rows);
    setBusy(false);
    if (error) return toast.error(error.message);
    refresh();
    toast.success("Votes saved");
  }

  const tally = [...data.players]
    .map((p) => ({
      name: p.name,
      total: data.votes.filter((v) => v.player_id === p.id).reduce((s, v) => s + v.points, 0),
    }))
    .filter((p) => p.total > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardContent className="space-y-4 p-5">
          <div>
            <h3 className="text-lg font-bold">Cast round votes</h3>
            <p className="text-sm text-muted-foreground">
              Format: {data.team.vote_format}
            </p>
          </div>
          <Select value={roundId} onValueChange={setRoundId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a round" />
            </SelectTrigger>
            <SelectContent>
              {data.rounds.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.label || `Round ${r.round_number}`}
                  {r.opponent ? ` vs ${r.opponent}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {points.map((p) => (
            <div key={p} className="flex items-center gap-3">
              <span className="stat-num flex size-9 shrink-0 items-center justify-center rounded-full bg-accent font-bold text-accent-foreground">
                {p}
              </span>
              <Select
                value={picks[p] ?? ""}
                onValueChange={(v) => setPicks((s) => ({ ...s, [p]: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`${p} vote${p > 1 ? "s" : ""} to…`} />
                </SelectTrigger>
                <SelectContent>
                  {data.players.map((pl) => (
                    <SelectItem key={pl.id} value={pl.id}>
                      {pl.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}

          <Button className="w-full" onClick={saveVotes} disabled={busy}>
            {roundVotes.length ? "Replace votes for this round" : "Save votes"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h3 className="text-lg font-bold">Player of the Season standings</h3>
          <div className="mt-4 space-y-2">
            {tally.length === 0 && (
              <p className="text-sm text-muted-foreground">No votes recorded yet.</p>
            )}
            {tally.map((row, i) => (
              <div
                key={row.name}
                className="flex items-center gap-3 rounded-md border border-border px-3 py-2"
              >
                <span className="stat-num w-6 text-muted-foreground">{i + 1}</span>
                <span className="flex-1 font-medium">{row.name}</span>
                <span className="stat-num font-bold text-accent">{row.total}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}