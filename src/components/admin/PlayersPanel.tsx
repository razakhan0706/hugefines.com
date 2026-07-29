import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";
import type { TeamBundle } from "@/lib/useTeamData";
import { uploadPhoto } from "@/lib/photos";
import { PhotoAvatar } from "@/components/PhotoAvatar";

export function PlayersPanel({ data, refresh }: { data: TeamBundle; refresh: () => void }) {
  const [name, setName] = useState("");
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const newPhotoInput = useRef<HTMLInputElement>(null);
  const remaining = data.team.player_limit - data.players.length;

  async function addPlayer() {
    setBusy("new");
    try {
      let photo_url: string | null = null;
      if (newPhoto) photo_url = await uploadPhoto(data.team.id, newPhoto);
      const { error } = await supabase.from("players").insert({
        team_id: data.team.id,
        name: name.trim(),
        photo_url,
      });
      if (error) throw error;
      setName("");
      setNewPhoto(null);
      if (newPhotoInput.current) newPhotoInput.current.value = "";
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add player");
    } finally {
      setBusy(null);
    }
  }

  async function changePhoto(playerId: string, file: File) {
    setBusy(playerId);
    try {
      const photo_url = await uploadPhoto(data.team.id, file);
      const { error } = await supabase.from("players").update({ photo_url }).eq("id", playerId);
      if (error) throw error;
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(null);
    }
  }

  async function removePhoto(playerId: string) {
    const { error } = await supabase.from("players").update({ photo_url: null }).eq("id", playerId);
    if (error) return toast.error(error.message);
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
          <div className="flex-1 min-w-45">
            <label className="text-sm font-medium" htmlFor="pphoto">
              Photo (optional)
            </label>
            <Input
              id="pphoto"
              ref={newPhotoInput}
              type="file"
              accept="image/*"
              onChange={(e) => setNewPhoto(e.target.files?.[0] ?? null)}
            />
          </div>
          <Button onClick={addPlayer} disabled={!name.trim() || remaining <= 0 || busy === "new"}>
            {busy === "new" && <Loader2 className="mr-2 size-4 animate-spin" />}
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
                <PhotoAvatar
                  url={p.photo_url}
                  name={p.name}
                  busy={busy === p.id}
                  title="Player photo"
                  onPick={(f) => changePhoto(p.id, f)}
                />
                <div className="flex-1">
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {data.team.currency}
                    {total.toFixed(2).replace(/\.00$/, "")} in fines
                  </p>
                  {p.photo_url && (
                    <button
                      type="button"
                      className="text-xs text-muted-foreground underline"
                      onClick={() => removePhoto(p.id)}
                    >
                      Remove photo
                    </button>
                  )}
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