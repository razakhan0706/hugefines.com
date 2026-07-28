import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { money } from "@/lib/fines";
import type { TeamBundle } from "@/lib/useTeamData";

export function RoundsPanel({ data, refresh }: { data: TeamBundle; refresh: () => void }) {
  const nextNumber = (data.rounds.at(-1)?.round_number ?? 0) + 1;
  const [opponent, setOpponent] = useState("");
  const [playedOn, setPlayedOn] = useState("");
  const [venue, setVenue] = useState("");
  const [result, setResult] = useState("");

  async function addRound() {
    const { error } = await supabase.from("rounds").insert({
      team_id: data.team.id,
      round_number: nextNumber,
      label: `Round ${nextNumber}`,
      opponent: opponent || null,
      played_on: playedOn || null,
      venue: venue || null,
      result: result || null,
    });
    if (error) return toast.error(error.message);
    setOpponent("");
    setPlayedOn("");
    setVenue("");
    setResult("");
    refresh();
  }

  async function removeRound(id: string) {
    const { error } = await supabase.from("rounds").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="text-sm font-medium">Opponent</label>
            <Input value={opponent} onChange={(e) => setOpponent(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Date</label>
            <Input type="date" value={playedOn} onChange={(e) => setPlayedOn(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Venue</label>
            <Input value={venue} onChange={(e) => setVenue(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Result</label>
            <Input value={result} onChange={(e) => setResult(e.target.value)} placeholder="Won by 4 wkts" />
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={addRound}>
              Add round {nextNumber}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {data.rounds.length === 0 && (
          <p className="text-muted-foreground">No rounds yet — add your first match above.</p>
        )}
        {[...data.rounds].reverse().map((r) => {
          const roundFines = data.fines.filter((f) => f.round_id === r.id);
          const total = roundFines.reduce((s, f) => s + Number(f.amount), 0);
          return (
            <Card key={r.id}>
              <CardContent className="flex flex-wrap items-center gap-4 p-4">
                <span className="stat-num flex size-11 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
                  {r.round_number}
                </span>
                <div className="flex-1 min-w-40">
                  <p className="font-semibold">{r.opponent ? `vs ${r.opponent}` : r.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {[r.played_on, r.venue, r.result].filter(Boolean).join(" · ") || "No details"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="stat-num text-lg font-bold text-accent">
                    {money(total, data.team.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">{roundFines.length} fines</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeRound(r.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}