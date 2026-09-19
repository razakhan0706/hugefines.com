import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Copy } from "lucide-react";
import { toast } from "sonner";

export function ShareLinksCard({ teamId }: { teamId: string }) {
  const [showFines, setShowFines] = useState(true);
  const [showVotes, setShowVotes] = useState(false);
  const [creating, setCreating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");

  async function createLink() {
    if (!showFines && !showVotes) {
      toast.error("Choose Fines, Votes, or both.");
      return;
    }

    setCreating(true);

    try {
      const rpc = supabase.rpc.bind(supabase) as unknown as (
        functionName: string,
        args: Record<string, unknown>,
      ) => Promise<{
        data: unknown;
        error: { message: string } | null;
      }>;

      const { data: token, error } = await rpc("create_share_link", {
        _team_id: teamId,
        _show_fines: showFines,
        _show_votes: showVotes,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!token || typeof token !== "string") {
        throw new Error("Share link was not created");
      }

      const url = `${window.location.origin}/share/${token}`;

      setGeneratedLink(url);

      try {
        await navigator.clipboard.writeText(url);
        toast.success("Share link created and copied");
      } catch {
        toast.success("Share link created");
      }
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not create share link",
      );
    } finally {
      setCreating(false);
    }
  }

  async function copyLink() {
    if (!generatedLink) return;

    try {
      await navigator.clipboard.writeText(generatedLink);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  }

  return (
    <Card>
      <CardContent className="space-y-5 p-5">
        <div>
          <h3 className="text-lg font-bold">Permanent share link</h3>
          <p className="text-sm text-muted-foreground">
            Create a link with its own Fines and Votes permissions. The link
            keeps these permissions even if the team's normal public settings
            change later.
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

        {generatedLink && (
          <div className="border-t border-border pt-4">
            <p className="mb-2 font-medium">Generated link</p>

            <div className="flex gap-2">
              <Input readOnly value={generatedLink} />

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={copyLink}
              >
                <Copy className="size-4" />
              </Button>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              Save or copy this link before creating another one.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}