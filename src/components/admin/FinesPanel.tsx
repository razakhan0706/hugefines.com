import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, Plus, Pencil, Check, X } from "lucide-react";
import {
  DEFAULT_FINE_CATEGORIES,
  FINE_CATEGORY_GROUPS,
  groupForCategory,
  money,
  roundDayLabel,
} from "@/lib/fines";
import type { TeamBundle } from "@/lib/useTeamData";
import { PhotoAvatar } from "@/components/PhotoAvatar";

export function FinesPanel({ data, refresh }: { data: TeamBundle; refresh: () => void }) {
  const latestRound = data.rounds.at(-1)?.id ?? "";
  const [playerId, setPlayerId] = useState("");
  const [roundId, setRoundId] = useState(latestRound);
  const [categoryId, setCategoryId] = useState("");
  const [week, setWeek] = useState("1");
  const [description, setDescription] = useState("");
  const [quote, setQuote] = useState("");
  const [amount, setAmount] = useState("1");
  const [filterPlayer, setFilterPlayer] = useState("all");
  const [newCategory, setNewCategory] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [edit, setEdit] = useState({
    player_id: "",
    round_id: "",
    category_id: "",
    week: "1",
    description: "",
    amount: "0",
  });

  function startEdit(f: TeamBundle["fines"][number]) {
    setEditId(f.id);
    setEdit({
      player_id: f.player_id,
      round_id: f.round_id ?? "",
      category_id: f.category_id ?? "",
      week: String(f.week ?? 1),
      description: f.description,
      amount: String(f.amount),
    });
  }

  async function saveEdit() {
    if (!editId) return;
    const { error } = await supabase
      .from("fines")
      .update({
        player_id: edit.player_id,
        round_id: edit.round_id || null,
        category_id: edit.category_id || null,
        week: data.rounds.find((r) => r.id === edit.round_id)?.two_day
          ? Number(edit.week) || 1
          : null,
        description: edit.description.trim() || "Fine",
        amount: Number(edit.amount) || 0,
      })
      .eq("id", editId);
    if (error) return toast.error(error.message);
    setEditId(null);
    refresh();
    toast.success("Fine updated");
  }

  const playerName = useMemo(
    () => new Map(data.players.map((p) => [p.id, p.name])),
    [data.players],
  );
  const playerPhoto = useMemo(
    () => new Map(data.players.map((p) => [p.id, p.photo_url])),
    [data.players],
  );
  const roundLabel = useMemo(
    () => new Map(data.rounds.map((r) => [r.id, roundDayLabel(r)])),
    [data.rounds],
  );
  const categoryLabel = useMemo(
    () => new Map(data.categories.map((c) => [c.id, c.label])),
    [data.categories],
  );

  const groupedCategories = useMemo(() => {
    const order = [...FINE_CATEGORY_GROUPS.map((g) => g.group), "Other"];
    const map = new Map<string, typeof data.categories>();
    for (const c of data.categories) {
      const g = groupForCategory(c.label);
      map.set(g, [...(map.get(g) ?? []), c]);
    }
    return order
      .filter((g) => map.get(g)?.length)
      .map((g) => ({ group: g, items: map.get(g)! }));
  }, [data.categories]);

  const missingDefaults = DEFAULT_FINE_CATEGORIES.filter(
    (label) =>
      !data.categories.some((c) => c.label.trim().toLowerCase() === label.toLowerCase()),
  );

  const selectedRound = data.rounds.find((r) => r.id === roundId);
  const isTwoDay = Boolean(selectedRound?.two_day);

  const isQuoteCategory =
    data.categories.find((c) => c.id === categoryId)?.label.trim().toLowerCase() ===
    "rubbish chat";

  const visible = data.fines.filter((f) => filterPlayer === "all" || f.player_id === filterPlayer);
  const total = visible.reduce((s, f) => s + Number(f.amount), 0);

  async function addFine() {
    if (!playerId) return toast.error("Pick a player");
    const cat = data.categories.find((c) => c.id === categoryId);
    const custom = description.trim();
    const base = custom || cat?.label || "Fine";
    const q = quote.trim();
    const finalAmount = Number(amount) || 0;
    const { error } = await supabase.from("fines").insert({
      team_id: data.team.id,
      player_id: playerId,
      round_id: roundId || null,
      category_id: custom ? null : categoryId || null,
      week: isTwoDay ? Number(week) || 1 : null,
      description: !custom && isQuoteCategory && q ? `${base} — "${q}"` : base,
      amount: finalAmount,
    });
    if (error) return toast.error(error.message);
    setDescription("");
    setQuote("");
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

  async function addDefaultCategories() {
    const { error } = await supabase.from("fine_categories").insert(
      missingDefaults.map((label) => ({
        team_id: data.team.id,
        label,
        default_amount: 1,
      })),
    );
    if (error) return toast.error(error.message);
    refresh();
    toast.success("Default fine categories added");
  }

  async function removeCategory(id: string) {
    const { error } = await supabase.from("fine_categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    if (categoryId === id) setCategoryId("");
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
            <label className="text-sm font-medium">Round</label>
            <Select value={roundId} onValueChange={setRoundId}>
              <SelectTrigger>
                <SelectValue placeholder="Round" />
              </SelectTrigger>
              <SelectContent>
                {data.rounds.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {roundDayLabel(r)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isTwoDay && (
            <div>
              <label className="text-sm font-medium">Week</label>
              <Select value={week} onValueChange={setWeek}>
                <SelectTrigger>
                  <SelectValue placeholder="Week" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Day 1</SelectItem>
                  <SelectItem value="2">Day 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
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
            <label className="text-sm font-medium">Category</label>
            <Select
              value={categoryId}
              onValueChange={(v) => {
                setCategoryId(v);
                setQuote("");
                const c = data.categories.find((x) => x.id === v);
                if (c) setAmount(String(c.default_amount));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {groupedCategories.map((g) => (
                  <SelectGroup key={g.group}>
                    <SelectLabel>{g.group}</SelectLabel>
                    {g.items.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isQuoteCategory && (
            <div className="lg:col-span-6">
              <label className="text-sm font-medium">Exact quote</label>
              <Input
                placeholder='What did they actually say? e.g. "I could bowl faster than that"'
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
              />
            </div>
          )}
          <div className="lg:col-span-6">
            <label className="text-sm font-medium">Custom</label>
            <Input
              placeholder="Custom (optional — defaults to the category)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
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
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">Fine categories</span>
            {missingDefaults.length > 0 && (
              <Button size="sm" variant="outline" onClick={addDefaultCategories}>
                Add default categories
              </Button>
            )}
            <div className="ml-auto flex gap-2">
              <Input
                className="h-8 w-44"
                placeholder="New category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={addCategory}
                disabled={!newCategory.trim()}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
          {groupedCategories.map((g) => (
            <div key={g.group} className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {g.group}
              </p>
              <div className="flex flex-wrap gap-2">
                {g.items.map((c) => (
                  <Badge
                    key={c.id}
                    variant="secondary"
                    className="cursor-pointer gap-1"
                    onClick={() => removeCategory(c.id)}
                    title="Remove category"
                  >
                    {c.label}
                    <Trash2 className="size-3 opacity-60" />
                  </Badge>
                ))}
              </div>
            </div>
          ))}
          {groupedCategories.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No categories yet — add the defaults to get started.
            </p>
          )}
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
            {editId === f.id ? (
              <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="text-sm font-medium">Player</label>
                  <Select
                    value={edit.player_id}
                    onValueChange={(v) => setEdit((s) => ({ ...s, player_id: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Player" />
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
                  <Select
                    value={edit.round_id}
                    onValueChange={(v) => setEdit((s) => ({ ...s, round_id: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Round" />
                    </SelectTrigger>
                    <SelectContent>
                      {data.rounds.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {roundDayLabel(r)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {data.rounds.find((r) => r.id === edit.round_id)?.two_day && (
                  <div>
                    <label className="text-sm font-medium">Week</label>
                    <Select
                      value={edit.week}
                      onValueChange={(v) => setEdit((s) => ({ ...s, week: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Day 1</SelectItem>
                        <SelectItem value="2">Day 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={edit.category_id}
                    onValueChange={(v) => setEdit((s) => ({ ...s, category_id: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {groupedCategories.map((g) => (
                        <SelectGroup key={g.group}>
                          <SelectLabel>{g.group}</SelectLabel>
                          {g.items.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={edit.description}
                    onChange={(e) => setEdit((s) => ({ ...s, description: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Amount</label>
                  <Input
                    value={edit.amount}
                    inputMode="decimal"
                    onChange={(e) => setEdit((s) => ({ ...s, amount: e.target.value }))}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button className="flex-1" onClick={saveEdit}>
                    <Check className="size-4" /> Save
                  </Button>
                  <Button variant="outline" onClick={() => setEditId(null)}>
                    <X className="size-4" />
                  </Button>
                </div>
              </CardContent>
            ) : (
            <CardContent className="flex flex-wrap items-center gap-3 p-4">
              <PhotoAvatar
                url={playerPhoto.get(f.player_id)}
                name={playerName.get(f.player_id)}
              />
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
              <Button variant="ghost" size="icon" onClick={() => startEdit(f)} title="Edit fine">
                <Pencil className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => removeFine(f.id)}>
                <Trash2 className="size-4" />
              </Button>
            </CardContent>
            )}
          </Card>
        ))}
        {visible.length === 0 && (
          <p className="text-muted-foreground">No fines logged yet.</p>
        )}
      </div>
    </div>
  );
}
