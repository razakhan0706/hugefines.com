import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Copy } from "lucide-react";
import { toast } from "sonner";

type ShareLink = {
  id: string;
  team_id: string;
  token: string;
  show_fines: boolean;
  show_votes: boolean;
  active: boolean;
  created_at: string;
};

export function ShareLinksCard({ teamId }: { teamId: string }) {
  const [showFines, setShowFines] = useState(true);
  const [showVotes, setShowVotes] = useState(false);
  const [creating, setCreating] = useState(false);

  const queryClient = useQueryClient();

  // We use this small cast because the new Supabase table/function
  // is not yet present in the generated local TypeScript types.
  const db = supabase as any;

  const links = useQuery({
    queryKey: ["share-links", teamId],
    queryFn: async () => {
      const { data, error } = await db
        .from("share_links")
        .select(
          "id, team_id, token, show_fines, show_votes, active, created_at",
        )
        .eq("team_id", teamId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data ?? []) as ShareLink[];
    },
  });

  async function createLink() {
    if (!showFines && !showVotes) {
      toast.error("Choose Fines, Votes, or both.");
      return;
    }

    setCreating(true);

    try {
      const { data: token, error } = await db.rpc("create_share_link", {
        _team_id: teamId,
        _show_fines: showFines,
        _show_votes: showVotes,
      });

      if (error) throw error;
      if (!token) throw new Error("Share link was not created");

      await queryClient.invalidateQueries({
        queryKey: ["share-links", teamId],
      });

      const url =
        typeof window !== "undefined"
          ? `${window.location.origin}/share/${token}`
          : "";

      await navigator.clipboard.writeText(url);
      toast.success("Share link created and copied");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create share link");
    } finally {
      setCreating(false);
    }
  }

  async function disableLink(id: string) {
    try {
      const { error } = await db
        .from("share_links")
        .update({ active: false })
        .eq("id", id)
        .eq("team_id", teamId);

      if (error) throw error;

      await queryClient.invalidateQueries({
        queryKey: ["share-links", teamId],
      });

      toast.success("Share link disabled");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not disable link");
    }
  }

  function permissionLabel(link: ShareLink) {
    if (link.show_fines && link.show_votes) return "Fines + Votes";
    if (link.show_fines) return "Fines only";
    return "Votes only";
  }

  function getUrl(token: string) {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/share/${token}`;
  }

  return (
    <Card>
      <CardContent className="space-y-5 p-5">
        <div>
          <h3 className="text-lg font-bold">Permanent share links</h3>
          <p className="text-sm text-muted-foreground">
            Each link keeps its own Fines and Votes permissions even if the
            team's normal public settings change later.
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="font-medium">Show fines</p>

          <div className="flex gap-1.5">
            <Button
              type="button"
              size="sm"
              variant={showFines ? "default" : "outline"}
              className="w-14 px-2"
              onClick={() => setShowFines(true)}
            >
              Yes
            </Button>

            <Button
              type="button"
              size="sm"
              variant={!showFines ? "default" : "outline"}
              className="w-14 px-2"
              onClick={() => setShowFines(false)}
            >
              No
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="font-medium">Show votes</p>

          <div className="flex gap-1.5">
            <Button
              type="button"
              size="sm"
              variant={showVotes ? "default" : "outline"}
              className="w-14 px-2"
              onClick={() => setShowVotes(true)}
            >
              Yes
            </Button>

            <Button
              type="button"
              size="sm"
              variant={!showVotes ? "default" : "outline"}
              className="w-14 px-2"
              onClick={() => setShowVotes(false)}
            >
              No
            </Button>
          </div>
        </div>

        <Button onClick={createLink} disabled={creating}>
          {creating ? "Creating..." : "Create share link"}
        </Button>

        <div className="border-t border-border pt-4">
          <p className="mb-3 font-medium">Existing share links</p>

          {links.isLoading && (
            <p className="text-sm text-muted-foreground">Loading links…</p>
          )}

          {links.data?.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No permanent share links created yet.
            </p>
          )}

          <div className="space-y-3">
            {links.data?.map((link) => (
              <div
                key={link.id}
                className="rounded-md border border-border p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{permissionLabel(link)}</p>
                    <p className="text-xs text-muted-foreground">
                      {link.active ? "Active" : "Disabled"}
                    </p>
                  </div>

                  {link.active && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => disableLink(link.id)}
                    >
                      Disable
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  <Input readOnly value={getUrl(link.token)} />

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={async () => {
                      await navigator.clipboard.writeText(
                        getUrl(link.token),
                      );
                      toast.success("Link copied");
                    }}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}