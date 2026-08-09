import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { slugify, type Team } from "@/lib/fines";
import { Plus } from "lucide-react";
import { uploadPhoto } from "@/lib/photos";
import { PhotoAvatar } from "@/components/PhotoAvatar";
import logoAsset from "@/assets/Website_Logo.png.asset.json";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "My teams — Huge Fines" },
      { name: "description", content: "Manage your teams, seasons, fines and voting." },
      { property: "og:title", content: "My teams — Huge Fines" },
      { property: "og:description", content: "Manage your teams, seasons, fines and voting." },
    ],
  }),
  component: Dashboard,
});

const DEFAULT_CATEGORIES = [
  "Late to game",
  "Bad haircut",
  "Shocking parking",
  "Wrong kit",
  "Dropped catch",
  "Golden duck",
];

function Dashboard() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [season, setSeason] = useState("Season 2026");
  const [sport, setSport] = useState("Cricket");
  const [format, setFormat] = useState("3-2-1");
  const [busy, setBusy] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function pickLogo(file: File) {
    setUploading(true);
    try {
      setLogoUrl(await uploadPhoto("teams", file));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const teams = useQuery({
    queryKey: ["my-teams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Team[];
    },
  });

  async function createTeam() {
    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not signed in");

      const base = slugify(name) || "team";
      const slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;

      const { data, error } = await supabase
        .from("teams")
        .insert({
          owner_id: uid,
          name,
          slug,
          season_name: season,
          logo_url: logoUrl,
          sport,
          vote_format: format,
        })
        .select()
        .single();
      if (error) throw error;

      await supabase.from("fine_categories").insert(
        DEFAULT_CATEGORIES.map((label) => ({
          team_id: data.id,
          label,
          default_amount: 1,
        })),
      );

      toast.success("Team created");
      setOpen(false);
      setLogoUrl(null);
      navigate({ to: "/team/$teamId", params: { teamId: data.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create team");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">My teams</h1>
            <p className="mt-1 text-muted-foreground">
              Each team gets its own season, players, fines, voting and AI summary.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" /> New team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a team</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <PhotoAvatar
                    url={logoUrl}
                    name={name}
                    className="size-14"
                    busy={uploading}
                    title="Team photo"
                    onPick={pickLogo}
                  />
                  <p className="text-sm text-muted-foreground">
                    Add a team photo or badge (optional)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tname">Team name</Label>
                  <Input
                    id="tname"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Northside CC 2nd XI"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tseason">Season</Label>
                  <Input id="tseason" value={season} onChange={(e) => setSeason(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="tsport">Sport</Label>
                    <Input id="tsport" value={sport} onChange={(e) => setSport(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Voting format</Label>
                    <Select value={format} onValueChange={setFormat}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5-4-3-2-1">5-4-3-2-1</SelectItem>
                        <SelectItem value="3-2-1">3-2-1</SelectItem>
                        <SelectItem value="1">Single vote</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={createTeam} disabled={busy || !name.trim()}>
                  {busy ? "Creating…" : "Create team"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {teams.isLoading && <p className="text-muted-foreground">Loading teams…</p>}
          {teams.data?.length === 0 && (
            <Card className="sm:col-span-2 border-dashed">
              <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
                <img
                  src={logoAsset.url}
                  alt=""
                  aria-hidden="true"
                  className="h-40 w-auto opacity-25 md:h-48"
                />
                <p className="font-semibold">No teams yet</p>
                <p className="text-sm text-muted-foreground">
                  Create your first team to start logging fines.
                </p>
              </CardContent>
            </Card>
          )}
          {teams.data?.map((t) => (
            <Link key={t.id} to="/team/$teamId" params={{ teamId: t.id }}>
              <Card className="h-full transition-colors hover:border-accent">
                <CardContent className="flex gap-4 p-6">
                  <PhotoAvatar url={t.logo_url} name={t.name} className="size-12" />
                  <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-accent-strong">
                    {t.sport}
                  </p>
                  <h2 className="mt-1 text-xl font-bold">{t.name}</h2>
                  <p className="text-sm text-muted-foreground">{t.season_name}</p>
                  <p className="mt-4 text-xs text-muted-foreground">/t/{t.slug}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}