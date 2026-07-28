import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import type { TeamBundle } from "@/lib/useTeamData";

export function PlayersPanel({ data, refresh }: { data: TeamBundle; refresh: () => void }) {
  const [name, setName] = useState("");
  const [jersey, setJersey] = useState("");
  const remaining = data.team.player_limit - data.players.length;

  async function addPlayer() {
    const { error } = await supabase.from("players").insert({
      team_id: data.team.id,
      name: name.trim(),
      jersey_number: jersey ? Number(jersey) : null,
    });
    if (error) return toast.error(error.message);
    setName("");
    setJersey("");
    refresh();
  }

  async function removePlayer(id: string) {
    const { error } = await supabase.from("players").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-5">
          <div className="flex-1 min-w-45">
            <label className="text-sm font-medium" htmlFor="pname">
              Player name
            </label>
            <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="w-24">
            <label className="text-sm font-medium" htmlFor="pnum">
              #
            </label>
            <Input id="pnum" value={jersey} onChange={(e) => setJersey(e.target.value)} />
          </div>
          <Button onClick={addPlayer} disabled={!name.trim() || remaining <= 0}>
            Add player
          </Button>
          <p className="w-full text-xs text-muted-foreground">
            {remaining > 0
              ? `${remaining} of ${data.team.player_limit} player slots left`
              : `Player limit of ${data.team.player_limit} reached`}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.players.map((p) => {
          const total = data.fines
            .filter((f) => f.player_id === p.id)
            .reduce((s, f) => s + Number(f.amount), 0);
          return (
            <Card key={p.id}>
              <CardContent className="flex items-center gap-3 p-4">
                <span className="stat-num flex size-10 items-center justify-center rounded-full bg-secondary text-sm font-bold">
                  {p.jersey_number ?? p.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="flex-1">
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {data.team.currency}
                    {total.toFixed(2).replace(/\.00$/, "")} in fines
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removePlayer(p.id)}>
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