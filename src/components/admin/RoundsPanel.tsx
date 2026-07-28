import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { money } from "@/lib/fines";
import type { TeamBundle } from "@/lib/useTeamData";
import { uploadPhoto } from "@/lib/photos";
import { PhotoAvatar } from "@/components/PhotoAvatar";

export function RoundsPanel({ data, refresh }: { data: TeamBundle; refresh: () => void }) {
  const nextNumber = (data.rounds.at(-1)?.round_number ?? 0) + 1;
  const [opponent, setOpponent] = useState("");
  const [playedOn, setPlayedOn] = useState("");
  const [venue, setVenue] = useState("");
  const [result, setResult] = useState("");
  const [finesMaster, setFinesMaster] = useState("");
  const [finesMasterPhoto, setFinesMasterPhoto] = useState<string | null>(null);
  const [opponentLogo, setOpponentLogo] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function pickPhoto(key: string, file: File, set: (url: string) => void) {
    setBusy(key);
    try {
      set(await uploadPhoto(data.team.id, file));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(null);
    }
  }

  async function updateRoundPhoto(
    id: string,
    field: "fines_master_photo_url" | "opponent_logo_url",
    file: File,
  ) {
    setBusy(id + field);
    try {
      const url = await uploadPhoto(data.team.id, file);
      const patch =
        field === "fines_master_photo_url"
          ? { fines_master_photo_url: url }
          : { opponent_logo_url: url };
      const { error } = await supabase.from("rounds").update(patch).eq("id", id);
      if (error) throw error;
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(null);
    }
  }

  async function addRound() {
    const { error } = await supabase.from("rounds").insert({
      team_id: data.team.id,
      round_number: nextNumber,
      label: `Round ${nextNumber}`,
      opponent: opponent || null,
      played_on: playedOn || null,
      venue: venue || null,
      result: result || null,
      fines_master: finesMaster || null,
      fines_master_photo_url: finesMasterPhoto,
      opponent_logo_url: opponentLogo,
    });
    if (error) return toast.error(error.message);
    setOpponent("");
    setPlayedOn("");
    setVenue("");
    setResult("");
    setFinesMaster("");
    setFinesMasterPhoto(null);
    setOpponentLogo(null);
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
        <CardContent className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-6">
          <div>
            <label className="text-sm font-medium">Opponent</label>
            <div className="flex items-center gap-2">
              <PhotoAvatar
                url={opponentLogo}
                name={opponent}
                busy={busy === "opp"}
                title="Opposition photo"
                onPick={(f) => pickPhoto("opp", f, setOpponentLogo)}
              />
              <Input value={opponent} onChange={(e) => setOpponent(e.target.value)} />
            </div>
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
          <div>
            <label className="text-sm font-medium">Fines master</label>
            <div className="flex items-center gap-2">
              <PhotoAvatar
                url={finesMasterPhoto}
                name={finesMaster}
                busy={busy === "fm"}
                title="Fines master photo"
                onPick={(f) => pickPhoto("fm", f, setFinesMasterPhoto)}
              />
              <Input
                value={finesMaster}
                onChange={(e) => setFinesMaster(e.target.value)}
                placeholder="Who ran the fines"
              />
            </div>
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
                <span className="stat-num flex size-11 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
                  {r.round_number}
                </span>
                <PhotoAvatar
                  url={r.opponent_logo_url}
                  name={r.opponent}
                  busy={busy === r.id + "opponent_logo_url"}
                  title="Opposition photo"
                  onPick={(f) => updateRoundPhoto(r.id, "opponent_logo_url", f)}
                />
                <div className="flex-1 min-w-40">
                  <p className="font-semibold">{r.opponent ? `vs ${r.opponent}` : r.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {[r.played_on, r.venue, r.result].filter(Boolean).join(" · ") || "No details"}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <PhotoAvatar
                      url={r.fines_master_photo_url}
                      name={r.fines_master}
                      className="size-7"
                      busy={busy === r.id + "fines_master_photo_url"}
                      title="Fines master photo"
                      onPick={(f) => updateRoundPhoto(r.id, "fines_master_photo_url", f)}
                    />
                    <p className="text-sm">
                      <span className="text-muted-foreground">Fines master: </span>
                      <span className="font-medium">{r.fines_master || "—"}</span>
                    </p>
                  </div>
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