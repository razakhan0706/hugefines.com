import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

type AccessRow = {
  id: string;
  user_id: string | null;
  invited_email: string | null;
  email: string | null;
};

export function TeamAdminsCard({ teamId, ownerId }: { teamId: string; ownerId: string }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const me = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
  });

  const admins = useQuery({
    queryKey: ["team-access", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_access")
        .select("id, user_id, invited_email, email")
        .eq("team_id", teamId)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as AccessRow[];
    },
  });

  const isOwner = me.data?.id === ownerId;

  async function invite() {
    const value = email.trim().toLowerCase();
    if (!value.includes("@")) return toast.error("Enter a valid email address");
    setBusy(true);
    try {
      const { error } = await supabase.from("team_access").insert({
        team_id: teamId,
        invited_email: value,
        email: value,
        created_by: me.data?.id ?? null,
      });
      if (error) {
        throw new Error(
          error.code === "23505" ? "That email already has access" : error.message,
        );
      }
      setEmail("");
      admins.refetch();
      toast.success("Co-admin invited");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not invite");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    const { error } = await supabase.from("team_access").delete().eq("id", id);
    if (error) return toast.error(error.message);
    admins.refetch();
  }

  if (!isOwner) return null;

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div>
          <h3 className="text-lg font-bold">Team admins</h3>
          <p className="text-sm text-muted-foreground">
            Invite someone by email so they can log fines, rounds and votes for this team. They
            get access as soon as they sign in with that email.
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="mate@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") invite();
            }}
          />
          <Button onClick={invite} disabled={busy || !email.trim()}>
            {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
            Invite
          </Button>
        </div>

        <ul className="space-y-2">
          {admins.data?.length === 0 && (
            <li className="text-sm text-muted-foreground">No co-admins yet.</li>
          )}
          {admins.data?.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
            >
              <span className="truncate text-sm font-medium">
                {a.invited_email ?? a.email ?? "Unknown"}
              </span>
              <span className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    a.user_id
                      ? "bg-accent/15 text-accent-strong"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {a.user_id ? "Active" : "Pending"}
                </span>
                <Button variant="ghost" size="icon" onClick={() => remove(a.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}