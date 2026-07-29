import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, Pencil, Check, X } from "lucide-react";
import { money } from "@/lib/fines";
import type { TeamBundle } from "@/lib/useTeamData";
import { uploadPhoto } from "@/lib/photos";
import { PhotoAvatar } from "@/components/PhotoAvatar";
import { roundDayLabel, roundBaseLabel } from "@/lib/fines";

export function RoundsPanel({ data, refresh }: { data: TeamBundle; refresh: () => void }) {
  const nextNumber = (data.rounds.at(-1)?.round_number ?? 0) + 1;
  const [opponent, setOpponent] = useState("");
  const [roundName, setRoundName] = useState(String(nextNumber));
  const [twoDay, setTwoDay] = useState(false);
  const [day, setDay] = useState<number>(1);
  const [playedOn, setPlayedOn] = useState("");
  const [venue, setVenue] = useState("");
  const [result, setResult] = useState("");
  const [finesMaster, setFinesMaster] = useState("");
  const [finesMasterPhoto, setFinesMasterPhoto] = useState<string | null>(null);
  const [opponentLogo, setOpponentLogo] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [edit, setEdit] = useState({
    opponent: "",
    label: "",
    two_day: false,
    day: 1,
    venue: "",
    result: "",
    fines_master: "",
  });

  function startEdit(r: TeamBundle["rounds"][number]) {
    setEditId(r.id);
    setEdit({
      opponent: r.opponent ?? "",
      label: roundBaseLabel(r),
      two_day: Boolean(r.two_day),
      day: r.day ?? 1,
      venue: r.venue ?? "",
      result: r.result ?? "",
      fines_master: r.fines_master ?? "",
    });
  }

  async function saveEdit() {
    if (!editId) return;
    const base = edit.label.trim() || "Round";
    const num = Number(base.match(/\d+/)?.[0] ?? NaN);
    const { error } = await supabase
      .from("rounds")
      .update({
        opponent: edit.opponent.trim() || null,
        label: edit.two_day ? `${base} - Day ${edit.day}` : base,
        two_day: edit.two_day,
        day: edit.two_day ? edit.day : null,
        venue: edit.venue.trim() || null,
        result: edit.result.trim() || null,
        fines_master: edit.fines_master.trim() || null,
        ...(Number.isFinite(num) ? { round_number: num } : {}),
      })
      .eq("id", editId);
    if (error) return toast.error(error.message);
    setEditId(null);
    refresh();
    toast.success("Round updated");
  }

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
    const typed = roundName.trim();
    const num = Number(typed.match(/\d+/)?.[0] ?? NaN) || nextNumber;
    const base = typed || `Round ${num}`;
    const { error } = await supabase.from("rounds").insert({
      team_id: data.team.id,
      round_number: num,
      label: twoDay ? `${base} - Day ${day}` : base,
      two_day: twoDay,
      day: twoDay ? day : null,
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
    setRoundName(String(num + 1));
    setTwoDay(false);
    setDay(1);
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
            <Input value={opponent} onChange={(e) => setOpponent(e.target.value)} />
            <div className="mt-2">
              <PhotoAvatar
                url={opponentLogo}
                name={opponent}
                busy={busy === "opp"}
                title="Opposition logo"
                label="Opposition logo"
                onPick={(f) => pickPhoto("opp", f, setOpponentLogo)}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Round</label>
            <Input
              value={roundName}
              onChange={(e) => setRoundName(e.target.value)}
              placeholder={`e.g. ${nextNumber} or Trial Match 1`}
            />
          </div>
          <div>
            <label className="text-sm font-medium">2 dayer</label>
            <div className="mt-1 flex gap-2">
              <Button
                type="button"
                variant={twoDay ? "default" : "outline"}
                className="flex-1"
                onClick={() => setTwoDay(true)}
              >
                Yes
              </Button>
              <Button
                type="button"
                variant={!twoDay ? "default" : "outline"}
                className="flex-1"
                onClick={() => setTwoDay(false)}
              >
                No
              </Button>
            </div>
            {twoDay && (
              <div className="mt-2 flex gap-2">
                {[1, 2].map((d) => (
                  <Button
                    key={d}
                    type="button"
                    size="sm"
                    variant={day === d ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setDay(d)}
                  >
                    Day {d}
                  </Button>
                ))}
              </div>
            )}
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
            <Input
              value={finesMaster}
              onChange={(e) => setFinesMaster(e.target.value)}
              placeholder="Who ran the fines"
            />
            <div className="mt-2">
              <PhotoAvatar
                url={finesMasterPhoto}
                name={finesMaster}
                busy={busy === "fm"}
                title="Fines master photo"
                label="Fines master photo"
                onPick={(f) => pickPhoto("fm", f, setFinesMasterPhoto)}
              />
            </div>
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={addRound}>
              Save
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
              {editId === r.id ? (
                <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="text-sm font-medium">Opponent</label>
                    <Input
                      value={edit.opponent}
                      onChange={(e) => setEdit((s) => ({ ...s, opponent: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Round</label>
                    <Input
                      value={edit.label}
                      onChange={(e) => setEdit((s) => ({ ...s, label: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">2 dayer</label>
                    <div className="mt-1 flex gap-2">
                      <Button
                        type="button"
                        variant={edit.two_day ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setEdit((s) => ({ ...s, two_day: true }))}
                      >
                        Yes
                      </Button>
                      <Button
                        type="button"
                        variant={!edit.two_day ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setEdit((s) => ({ ...s, two_day: false }))}
                      >
                        No
                      </Button>
                    </div>
                    {edit.two_day && (
                      <div className="mt-2 flex gap-2">
                        {[1, 2].map((d) => (
                          <Button
                            key={d}
                            type="button"
                            size="sm"
                            variant={edit.day === d ? "default" : "outline"}
                            className="flex-1"
                            onClick={() => setEdit((s) => ({ ...s, day: d }))}
                          >
                            Day {d}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium">Venue</label>
                    <Input
                      value={edit.venue}
                      onChange={(e) => setEdit((s) => ({ ...s, venue: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Result</label>
                    <Input
                      value={edit.result}
                      onChange={(e) => setEdit((s) => ({ ...s, result: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Fines master</label>
                    <Input
                      value={edit.fines_master}
                      onChange={(e) => setEdit((s) => ({ ...s, fines_master: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
                    <Button onClick={saveEdit}>
                      <Check className="size-4" /> Save changes
                    </Button>
                    <Button variant="outline" onClick={() => setEditId(null)}>
                      <X className="size-4" /> Cancel
                    </Button>
                  </div>
                </CardContent>
              ) : (
              <CardContent className="flex flex-wrap items-center gap-4 p-4">
                <span className="stat-num flex size-11 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
                  {r.round_number}
                </span>
                <PhotoAvatar
                  url={r.opponent_logo_url}
                  name={r.opponent}
                  busy={busy === r.id + "opponent_logo_url"}
                  title="Opposition logo"
                  label="Add logo"
                  onPick={(f) => updateRoundPhoto(r.id, "opponent_logo_url", f)}
                />
                <div className="flex-1 min-w-40">
                  <p className="font-semibold uppercase">
                    {r.opponent ? `vs ${r.opponent}` : roundDayLabel(r)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {[roundDayLabel(r), r.venue, r.result].filter(Boolean).join(" · ")}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <PhotoAvatar
                      url={r.fines_master_photo_url}
                      name={r.fines_master}
                      className="size-8"
                      busy={busy === r.id + "fines_master_photo_url"}
                      title="Fines master photo"
                      label="Add photo"
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
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}