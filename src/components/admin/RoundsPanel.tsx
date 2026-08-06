import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, Pencil, Check, X } from "lucide-react";
import { money } from "@/lib/fines";
import type { TeamBundle } from "@/lib/useTeamData";
import { uploadPhoto } from "@/lib/photos";
import { PhotoAvatar } from "@/components/PhotoAvatar";
import { AutocompleteInput } from "@/components/ui/autocomplete-input";
import {
  roundDayLabel,
  roundBaseLabel,
  newestRoundsFirst,
  applyCaps,
  distinctValues,
} from "@/lib/fines";

export function RoundsPanel({ data, refresh }: { data: TeamBundle; refresh: () => void }) {
  const RESULT_OPTIONS = ["Won", "Lost", "Drawn"];

  function resultBadge(result: string | null | undefined) {
    const r = (result ?? "").toLowerCase();
    if (r.startsWith("won") || r.startsWith("win"))
      return { letter: "W", className: "bg-accent text-accent-foreground" };
    if (r.startsWith("lost") || r.startsWith("los"))
      return { letter: "L", className: "bg-destructive text-destructive-foreground" };
    if (r) return { letter: "D", className: "bg-primary text-primary-foreground" };
    return null;
  }

  const capSplits = applyCaps(data.fines, data.rounds);
  const opponentOptions = distinctValues(data.rounds, (r) => r.opponent);
  const venueOptions = distinctValues(data.rounds, (r) => r.venue);
  const finesMasterOptions = distinctValues(data.rounds, (r) => r.fines_master);
  const nextNumber = (data.rounds.at(-1)?.round_number ?? 0) + 1;
  const [opponent, setOpponent] = useState("");
  const [roundName, setRoundName] = useState(String(nextNumber));
  const [twoDay, setTwoDay] = useState(false);
  const [day, setDay] = useState<number>(1);
  const [cap, setCap] = useState("");
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
    cap: "",
    venue: "",
    result: "",
    fines_master: "",
    played_on: "",
  });

  function startEdit(r: TeamBundle["rounds"][number]) {
    setEditId(r.id);
    setEdit({
      opponent: r.opponent ?? "",
      label: roundBaseLabel(r),
      two_day: Boolean(r.two_day),
      day: r.day ?? 1,
      cap: r.cap != null ? String(r.cap) : "",
      venue: r.venue ?? "",
      result: r.result ?? "",
      fines_master: r.fines_master ?? "",
      played_on: r.played_on ?? "",
    });
  }

  async function saveEdit() {
    if (!editId) return;
    const base = edit.label.trim() || "Round";
    const num = Number(base.match(/\d+/)?.[0] ?? NaN);
    const capNum = Number(edit.cap);
    const { error } = await supabase
      .from("rounds")
      .update({
        opponent: edit.opponent.trim() || null,
        label: edit.two_day ? `${base} - Day ${edit.day}` : base,
        two_day: edit.two_day,
        day: edit.two_day ? edit.day : null,
        cap: edit.cap.trim() && Number.isFinite(capNum) ? capNum : null,
        venue: edit.venue.trim() || null,
        result: edit.result.trim() || null,
        fines_master: edit.fines_master.trim() || null,
        played_on: edit.played_on || null,
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
    const capNum = Number(cap);
    const { error } = await supabase.from("rounds").insert({
      team_id: data.team.id,
      round_number: num,
      label: twoDay ? `${base} - Day ${day}` : base,
      two_day: twoDay,
      day: twoDay ? day : null,
      cap: cap.trim() && Number.isFinite(capNum) ? capNum : null,
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
    setCap("");
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
            <AutocompleteInput
              value={opponent}
              onValueChange={setOpponent}
              suggestions={opponentOptions}
            />
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
              <div className="mt-2 grid grid-cols-2 gap-2">
                {[1, 2].map((d) => (
                  <Button
                    key={d}
                    type="button"
                    size="sm"
                    variant={day === d ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setDay(d)}
                  >
                    Day {d}
                  </Button>
                ))}
                <Input
                  type="date"
                  value={playedOn}
                  onChange={(e) => setPlayedOn(e.target.value)}
                  className={day === 2 ? "col-start-2" : "col-start-1"}
                />
              </div>
            )}
            {!twoDay && (
              <Input
                type="date"
                className="mt-2 w-full"
                value={playedOn}
                onChange={(e) => setPlayedOn(e.target.value)}
              />
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Cap (per player)</label>
            <Input
              value={cap}
              onChange={(e) => setCap(e.target.value)}
              inputMode="decimal"
              placeholder="e.g. 5"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Max a player can be fined this round
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">Venue</label>
            <AutocompleteInput
              value={venue}
              onValueChange={setVenue}
              suggestions={venueOptions}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Result</label>
            <Select value={result} onValueChange={setResult}>
              <SelectTrigger>
                <SelectValue placeholder="Select result" />
              </SelectTrigger>
              <SelectContent>
                {RESULT_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Fines master</label>
            <AutocompleteInput
              value={finesMaster}
              onValueChange={setFinesMaster}
              suggestions={finesMasterOptions}
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
        {newestRoundsFirst(data.rounds).map((r) => {
          const roundFines = data.fines.filter((f) => f.round_id === r.id);
          const total = roundFines.reduce((s, f) => s + Number(f.amount), 0);
          const discounted = roundFines.reduce(
            (s, f) => s + (capSplits.get(f.id)?.discounted ?? 0),
            0,
          );
          return (
            <Card key={r.id}>
              {editId === r.id ? (
                <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="text-sm font-medium">Opponent</label>
                    <AutocompleteInput
                      value={edit.opponent}
                      onValueChange={(v) => setEdit((s) => ({ ...s, opponent: v }))}
                      suggestions={opponentOptions}
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
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {[1, 2].map((d) => (
                          <Button
                            key={d}
                            type="button"
                            size="sm"
                            variant={edit.day === d ? "default" : "outline"}
                            className="w-full"
                            onClick={() => setEdit((s) => ({ ...s, day: d }))}
                          >
                            Day {d}
                          </Button>
                        ))}
                        <Input
                          type="date"
                          value={edit.played_on}
                          onChange={(e) => setEdit((s) => ({ ...s, played_on: e.target.value }))}
                          className={edit.day === 2 ? "col-start-2" : "col-start-1"}
                        />
                      </div>
                    )}
                    {!edit.two_day && (
                      <Input
                        type="date"
                        className="mt-2 w-full"
                        value={edit.played_on}
                        onChange={(e) => setEdit((s) => ({ ...s, played_on: e.target.value }))}
                      />
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium">Cap (per player)</label>
                    <Input
                      value={edit.cap}
                      onChange={(e) => setEdit((s) => ({ ...s, cap: e.target.value }))}
                      inputMode="decimal"
                      placeholder="e.g. 5"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Venue</label>
                    <AutocompleteInput
                      value={edit.venue}
                      onValueChange={(v) => setEdit((s) => ({ ...s, venue: v }))}
                      suggestions={venueOptions}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Result</label>
                    <Select
                      value={edit.result}
                      onValueChange={(v) => setEdit((s) => ({ ...s, result: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select result" />
                      </SelectTrigger>
                      <SelectContent>
                        {RESULT_OPTIONS.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Fines master</label>
                    <AutocompleteInput
                      value={edit.fines_master}
                      onValueChange={(v) => setEdit((s) => ({ ...s, fines_master: v }))}
                      suggestions={finesMasterOptions}
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
              <CardContent className="grid grid-cols-[auto_1fr] items-start gap-3 p-4">
                <div className="flex w-16 flex-col items-center justify-start gap-1">
                  <span
                    className={`stat-num flex size-11 shrink-0 items-center justify-center rounded-md font-bold ${
                      resultBadge(r.result)?.className ?? "bg-muted text-muted-foreground"
                    }`}
                    title={r.result ?? "No result"}
                  >
                    {resultBadge(r.result)?.letter ?? r.round_number}
                  </span>
                  <span className="text-[11px] leading-tight text-black">
                    {r.played_on
                      ? (() => {
                          const d = new Date(r.played_on);
                          const m = d.toLocaleDateString("en-AU", { month: "short" });
                          const y = d.getFullYear().toString().slice(-2);
                          return `${d.getDate()} ${m} '${y}`;
                        })()
                      : "\u00A0"}
                  </span>
                </div>

                <div className="flex min-w-0 flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-1 items-start gap-2">
                      <PhotoAvatar
                        url={r.opponent_logo_url}
                        name={r.opponent}
                        busy={busy === r.id + "opponent_logo_url"}
                        title="Opposition logo"
                        label="Add logo"
                        onPick={(f) => updateRoundPhoto(r.id, "opponent_logo_url", f)}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold uppercase leading-tight">
                          {r.opponent ? `vs ${r.opponent}` : roundDayLabel(r)}
                        </p>
                        {r.opponent && (
                          <p className="text-sm text-muted-foreground leading-tight">
                            {roundDayLabel(r)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="w-24 shrink-0 text-right">
                      <p className="stat-num text-lg font-bold text-accent">
                        {money(total, data.team.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">{roundFines.length} fines</p>
                      <p className="text-[10px] font-semibold leading-tight text-destructive">
                        Disc. {money(discounted, data.team.currency)}
                      </p>
                    </div>
                  </div>

                  {r.venue && (
                    <p className="text-sm text-muted-foreground leading-tight">
                      {r.venue}
                    </p>
                  )}

                  <div className="h-px bg-border" />

                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <PhotoAvatar
                        url={r.fines_master_photo_url}
                        name={r.fines_master}
                        className="size-8"
                        busy={busy === r.id + "fines_master_photo_url"}
                        title="Fines master photo"
                        label="Add photo"
                        onPick={(f) => updateRoundPhoto(r.id, "fines_master_photo_url", f)}
                      />
                      <p className="text-sm whitespace-nowrap">
                        <span className="text-muted-foreground">Fines master: </span>
                        <span className="font-medium">{r.fines_master || "—"}</span>
                      </p>
                    </div>
                    <div className="flex items-center">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(r)} title="Edit round">
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => removeRound(r.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
