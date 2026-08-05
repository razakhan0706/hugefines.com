import { useEffect, useMemo, useState } from "react";
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
import { Trash2 } from "lucide-react";
import { VOTE_FORMATS, roundDayLabel } from "@/lib/fines";
import type { TeamBundle } from "@/lib/useTeamData";
import { PhotoAvatar } from "@/components/PhotoAvatar";

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

  const playerById = useMemo(
    () => new Map(data.players.map((p) => [p.id, p])),
    [data.players],
  );
  const votedRounds = data.rounds.filter((r) => data.votes.some((v) => v.round_id === r.id));

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

  async function clearRound(id: string) {
    const { error } = await supabase.from("votes").delete().eq("round_id", id);
    if (error) return toast.error(error.message);
    refresh();
    toast.success("Votes removed");
  }

  const tally = [...data.players]
    .map((p) => ({
      name: p.name,
      photo: p.photo_url,
      total: data.votes.filter((v) => v.player_id === p.id).reduce((s, v) => s + v.points, 0),
    }))
    .filter((p) => p.total > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardContent className="grid gap-3 p-5 lg:grid-cols-5">
          <div className="lg:col-span-5">
            <label className="text-sm font-medium">Round</label>
            <Select value={roundId} onValueChange={setRoundId}>
              <SelectTrigger>
                <SelectValue placeholder="Round" />
              </SelectTrigger>
              <SelectContent>
                {[...data.rounds].reverse().map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {roundDayLabel(r)}
                    {r.opponent ? ` vs ${r.opponent}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {points.map((p) => (
            <div key={p}>
              <label className="text-sm font-medium">
                {p} vote{p > 1 ? "s" : ""}
              </label>
              <Select
                value={picks[p] ?? ""}
                onValueChange={(v) => setPicks((s) => ({ ...s, [p]: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Player" />
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

          <div className="flex items-end lg:col-span-2">
            <Button className="w-full" onClick={saveVotes} disabled={busy}>
              {roundVotes.length ? "Update votes" : "Save votes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-5">
          <h3 className="text-lg font-bold">Votes by round</h3>
          {votedRounds.length === 0 && (
            <p className="text-sm text-muted-foreground">No votes saved yet.</p>
          )}
          {votedRounds.map((r) => {
            const rv = data.votes
              .filter((v) => v.round_id === r.id)
              .sort((a, b) => b.points - a.points);
            return (
              <div key={r.id} className="rounded-md border border-border p-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {roundDayLabel(r)}
                    {r.opponent ? ` vs ${r.opponent}` : ""}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="ml-auto size-8"
                    onClick={() => clearRound(r.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {rv.map((v) => {
                    const pl = playerById.get(v.player_id);
                    return (
                      <span
                        key={v.id}
                        className="flex items-center gap-2 rounded-full bg-accent px-2 py-1 text-accent-foreground"
                      >
                        <span className="stat-num flex size-6 items-center justify-center rounded-full bg-accent-foreground/15 text-xs font-bold">
                          {v.points}
                        </span>
                        <PhotoAvatar url={pl?.photo_url} name={pl?.name ?? ""} className="size-6" />
                        <span className="text-sm font-semibold">{pl?.name ?? "Unknown"}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
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
                <PhotoAvatar url={row.photo} name={row.name} className="size-8" />
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