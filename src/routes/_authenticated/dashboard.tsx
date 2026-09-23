import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { slugify, type Team } from "@/lib/fines";
import { Plus, Trash2 } from "lucide-react";
import { uploadPhoto } from "@/lib/photos";
import { PhotoAvatar } from "@/components/PhotoAvatar";
import logoAsset from "@/assets/Website_Logo.png.asset.json";

export const Route = createFileRoute("/_authenticated/dashboard")({
  validateSearch: (s: Record<string, unknown>): { payment?: string } => ({
    payment: typeof s.payment === "string" ? s.payment : undefined,
  }),
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
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [season, setSeason] = useState("Season 2026");
  const [sport, setSport] = useState("Cricket");
  const [format, setFormat] = useState("3-2-1");
  const [busy, setBusy] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deleteTeam, setDeleteTeam] = useState<Team | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      toast.success("🎉 Trial started! Welcome to Huge Fines.");
    } else if (params.get("payment") === "cancelled") {
      toast.error("Payment cancelled. Enter your card to start the trial.");
    }
  }, []);

  // The photo can only be stored under the team's own folder, which doesn't
  // exist until the team is created — so hold the file and upload afterwards.
  function pickLogo(file: File) {
    setLogoFile(file);
    setLogoUrl(URL.createObjectURL(file));
  }


  const isSuperAdmin = useQuery({
    queryKey: ["is-superadmin"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid)
        .eq("role", "superadmin")
        .maybeSingle();
      return !!data;
    },
  });

  const teams = useQuery({
    queryKey: ["my-teams", isSuperAdmin.data ?? false],
    enabled: isSuperAdmin.isSuccess,
    queryFn: async () => {
      await supabase.rpc("claim_team_invites");
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return [];

      if (isSuperAdmin.data) {
        // Super admins see every team, including teams whose owner has left.
        const all = await supabase.from("teams").select("*").order("created_at", { ascending: false });
        if (all.error) throw all.error;
        return (all.data ?? []) as unknown as Team[];
      }

      const owned = await supabase.from("teams").select("*").eq("owner_id", uid);
      if (owned.error) throw owned.error;

      const access = await supabase.from("team_access").select("team_id").eq("user_id", uid);
      if (access.error) throw access.error;
      const accessIds = (access.data ?? []).map((a) => a.team_id);

      let shared: Team[] = [];
      if (accessIds.length > 0) {
        const sharedRes = await supabase.from("teams").select("*").in("id", accessIds);
        if (sharedRes.error) throw sharedRes.error;
        shared = (sharedRes.data ?? []) as unknown as Team[];
      }

      const all = [...((owned.data ?? []) as unknown as Team[]), ...shared];
      const byId = new Map(all.map((t) => [t.id, t]));
      return [...byId.values()];
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
        .insert({ owner_id: uid, name, slug, season_name: season, sport, vote_format: format })
        .select()
        .single();
      if (error) throw error;

      if (logoFile) {
        setUploading(true);
        try {
          const url = await uploadPhoto(data.id, logoFile);
          await supabase.from("teams").update({ logo_url: url }).eq("id", data.id);
        } catch (e) {
          toast.error("Team created, but the photo couldn't be uploaded. Add it in Settings.");
        } finally {
          setUploading(false);
        }
      }

      await supabase
        .from("fine_categories")
        .insert(DEFAULT_CATEGORIES.map((label) => ({ team_id: data.id, label, default_amount: 1 })));

      toast.success("Team created");
      setOpen(false);
      setLogoUrl(null);
      setLogoFile(null);
      navigate({ to: "/team/$teamId", params: { teamId: data.id } });

      navigate({ to: "/team/$teamId", params: { teamId: data.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create team");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTeam) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("teams").delete().eq("id", deleteTeam.id);
      if (error) throw error;
      toast.success(`"${deleteTeam.name}" deleted`);
      setDeleteTeam(null);
      queryClient.invalidateQueries({ queryKey: ["my-teams"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete team");
    } finally {
      setDeleting(false);
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
                  <p className="text-sm text-muted-foreground">Add a team photo or badge (optional)</p>
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
                <img src={logoAsset.url} alt="" aria-hidden="true" className="h-40 w-auto opacity-25 md:h-48" />
                <p className="font-semibold">No teams yet</p>
                <p className="text-sm text-muted-foreground">Create your first team to start logging fines.</p>
              </CardContent>
            </Card>
          )}
          {teams.data?.map((t) => (
            <div key={t.id} className="relative group">
              <Link to="/team/$teamId" params={{ teamId: t.id }}>
                <Card className="h-full transition-colors hover:border-accent">
                  <CardContent className="flex gap-4 p-6">
                    <PhotoAvatar url={t.logo_url} name={t.name} className="size-12" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-accent-strong">{t.sport}</p>
                      <h2 className="mt-1 text-xl font-bold">{t.name}</h2>
                      <p className="text-sm text-muted-foreground">{t.season_name}</p>
                      <p className="mt-4 text-xs text-muted-foreground">/t/{t.slug}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              {t.owner_id === currentUserId && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setDeleteTeam(t);
                  }}
                  className="absolute top-3 right-3 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete team"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-center md:mt-24">
          <img src={logoAsset.url} alt="Huge Fines" className="h-40 w-auto md:h-56" />
        </div>
      </main>

      <Dialog
        open={!!deleteTeam}
        onOpenChange={(o) => {
          if (!o) setDeleteTeam(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete "{deleteTeam?.name}"?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete the team and all its data — players, fines, and votes. This cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTeam(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete team"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
