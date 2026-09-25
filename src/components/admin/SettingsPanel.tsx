import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Copy, CreditCard } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { TeamBundle } from "@/lib/useTeamData";
import { PhotoAvatar } from "@/components/PhotoAvatar";
import { uploadPhoto } from "@/lib/photos";
import { TeamAdminsCard } from "@/components/admin/TeamAdminsCard";
import { ShareLinksCard } from "@/components/admin/ShareLinksCard";

export function SettingsPanel({ data, refresh }: { data: TeamBundle; refresh: () => void }) {
  const [name, setName] = useState(data.team.name);
  const [season, setSeason] = useState(data.team.season_name);
  const [currency, setCurrency] = useState(data.team.currency);
  const [isPublic, setIsPublic] = useState(data.team.is_public);
  const [votesPublic, setVotesPublic] = useState(data.team.votes_public);
  const [uploading, setUploading] = useState(false);

  async function pickLogo(file: File) {
    setUploading(true);
    try {
      const url = await uploadPhoto(data.team.id, file);
      const { error } = await supabase.from("teams").update({ logo_url: url }).eq("id", data.team.id);
      if (error) throw error;
      refresh();
      toast.success("Team photo updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    const { error } = await supabase
      .from("teams")
      .update({
        name,
        season_name: season,
        currency,
        is_public: isPublic,
        votes_public: votesPublic,
      })
      .eq("id", data.team.id);
    if (error) return toast.error(error.message);
    refresh();
    toast.success("Settings saved");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardContent className="space-y-4 p-5">
          <h3 className="text-lg font-bold">Team details</h3>
          <div className="flex items-center gap-3">
            <PhotoAvatar
              url={data.team.logo_url}
              name={data.team.name}
              className="size-14"
              busy={uploading}
              title="Team photo"
              label="Add team photo"
              onPick={pickLogo}
            />
            {data.team.logo_url && (
              <p className="text-sm text-muted-foreground">Tap the photo to change it</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Team name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Season</label>
            <Input value={season} onChange={(e) => setSeason(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Currency symbol</label>
            <Input
              className="w-24"
              value={currency}
              onChange={(e) => setCurrency(e.target.value.slice(0, 3))}
            />
          </div>
          <Button onClick={save}>Save changes</Button>
        </CardContent>
      </Card>

      <ShareLinksCard
        teamId={data.team.id}
        initialShowFines={data.team.share_show_fines}
        initialShowVotes={data.team.share_show_votes}
        initialShowRecaps={data.team.share_show_recaps}
      />
      <TeamAdminsCard teamId={data.team.id} ownerId={data.team.owner_id ?? ""} />

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start gap-3">
            <CreditCard className="mt-0.5 size-5 text-accent-strong" />
            <div>
              <h3 className="text-lg font-bold">Billing</h3>
              <p className="text-sm text-muted-foreground">
                Update payment details, view invoices or cancel renewal.
              </p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link to="/billing">Manage subscription</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
