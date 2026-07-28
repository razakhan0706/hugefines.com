import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import { money } from "@/lib/fines";
import type { TeamBundle } from "@/lib/useTeamData";

export function FinesPanel({ data, refresh }: { data: TeamBundle; refresh: () => void }) {
  const latestRound = data.rounds.at(-1)?.id ?? "";
  const [playerId, setPlayerId] = useState("");
  const [roundId, setRoundId] = useState(latestRound);
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("1");
  const [filterPlayer, setFilterPlayer] = useState("all");
  const [newCategory, setNewCategory] = useState("");

  const playerName = useMemo(
    () => new Map(data.players.map((p) => [p.id, p.name])),
    [data.players],
  );
  const roundLabel = useMemo(
    () => new Map(data.rounds.map((r) => [r.id, r.label || `Round ${r.round_number}`])),
    [data.rounds],
  );
  const categoryLabel = useMemo(
    () => new Map(data.categories.map((c) => [c.id, c.label])),
    [data.categories],
  );

  const visible = data.fines.filter((f) => filterPlayer === "all" || f.player_id === filterPlayer);
  const total = visible.reduce((s, f) => s + Number(f.amount), 0);

  async function addFine() {
    if (!playerId) return toast.error("Pick a player");
    const cat = data.categories.find((c) => c.id === categoryId);
    const { error } = await supabase.from("fines").insert({
      team_id: data.team.id,
      player_id: playerId,
      round_id: roundId || null,
      category_id: categoryId || null,
      description: description.trim() || cat?.label || "Fine",
      amount: Number(amount) || 0,
    });
    if (error) return toast.error(error.message);
    setDescription("");
    refresh();
    toast.success("Fine added");
  }

  async function addCategory() {
    const { error } = await supabase
      .from("fine_categories")
      .insert({ team_id: data.team.id, label: newCategory.trim(), default_amount: 1 });
    if (error) return toast.error(error.message);
    setNewCategory("");
    refresh();
  }

  async function togglePaid(id: string, paid: boolean) {
    await supabase.from("fines").update({ paid: !paid }).eq("id", id);
    refresh();
  }

  async function removeFine(id: string) {
    await supabase.from("fines").delete().eq("id", id);
    refresh();
  }

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardContent className="grid gap-3 p-5 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <label className="text-sm font-medium">Player</label>
            <Select value={playerId} onValueChange={setPlayerId}>
              <SelectTrigger>
                <SelectValue placeholder="Who's paying?" />
              </SelectTrigger>
              <SelectContent>
                {data.players.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Round</label>
            <Select value={roundId} onValueChange={setRoundId}>
              <SelectTrigger>
                <SelectValue placeholder="Round" />
              </SelectTrigger>
              <SelectContent>
                {data.rounds.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.label || `Round ${r.round_number}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Category</label>
            <Select
              value={categoryId}
              onValueChange={(v) => {
                setCategoryId(v);
                const c = data.categories.find((x) => x.id === v);
                if (c) setAmount(String(c.default_amount));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {data.categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Amount</label>
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={addFine}>
              Add fine
            </Button>
          </div>
          <div className="lg:col-span-6">
            <Input
              placeholder="What did they do? (optional — defaults to the category)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 p-4">
          <span className="text-sm font-medium">Categories:</span>
          {data.categories.map((c) => (
            <Badge key={c.id} variant="secondary">
              {c.label}
            </Badge>
          ))}
          <div className="ml-auto flex gap-2">
            <Input
              className="h-8 w-44"
              placeholder="New category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <Button size="sm" variant="outline" onClick={addCategory} disabled={!newCategory.trim()}>
              <Plus className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select value={filterPlayer} onValueChange={setFilterPlayer}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All players</SelectItem>
            {data.players.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          {visible.length} fines ·{" "}
          <span className="stat-num font-bold text-accent">
            {money(total, data.team.currency)}
          </span>
        </p>
      </div>

      <div className="space-y-2">
        {visible.map((f) => (
          <Card key={f.id}>
            <CardContent className="flex flex-wrap items-center gap-3 p-4">
              <div className="flex-1 min-w-45">
                <p className="font-semibold">{playerName.get(f.player_id) ?? "Unknown"}</p>
                <p className="text-sm text-muted-foreground">
                  {f.description}
                  {f.category_id ? ` · ${categoryLabel.get(f.category_id) ?? ""}` : ""}
                  {f.round_id ? ` · ${roundLabel.get(f.round_id) ?? ""}` : ""}
                </p>
              </div>
              <span className="stat-num text-lg font-bold">
                {money(Number(f.amount), data.team.currency)}
              </span>
              <Button
                size="sm"
                variant={f.paid ? "default" : "outline"}
                onClick={() => togglePaid(f.id, f.paid)}
              >
                {f.paid ? "Paid" : "Unpaid"}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => removeFine(f.id)}>
                <Trash2 className="size-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
        {visible.length === 0 && (
          <p className="text-muted-foreground">No fines logged yet.</p>
        )}
      </div>
    </div>
  );
}