import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRefreshTeam, useTeamBundle } from "@/lib/useTeamData";
import { PlayersPanel } from "@/components/admin/PlayersPanel";
import { RoundsPanel } from "@/components/admin/RoundsPanel";
import { FinesPanel } from "@/components/admin/FinesPanel";
import { VotingPanel } from "@/components/admin/VotingPanel";
import { RecapPanel } from "@/components/admin/RecapPanel";
import { SettingsPanel } from "@/components/admin/SettingsPanel";
import { StatsView } from "@/components/StatsView";

export const Route = createFileRoute("/_authenticated/team/$teamId")({
  head: () => ({
    meta: [
      { title: "Team workspace — Huge Fines" },
      { name: "description", content: "Log fines, run votes and generate AI recaps for your team." },
      { property: "og:title", content: "Team workspace — Huge Fines" },
      {
        property: "og:description",
        content: "Log fines, run votes and generate AI recaps for your team.",
      },
    ],
  }),
  component: TeamWorkspace,
});

function TeamWorkspace() {
  const { teamId } = Route.useParams();
  const bundle = useTeamBundle(teamId);
  const refresh = useRefreshTeam(teamId);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        {bundle.isLoading && <p className="text-muted-foreground">Loading team…</p>}
        {bundle.error && <p className="text-destructive">Could not load this team.</p>}
        {bundle.data && (
          <>
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-accent-strong">
                {bundle.data.team.sport} · {bundle.data.team.season_name}
              </p>
              <h1 className="text-3xl font-bold">{bundle.data.team.name}</h1>
            </div>

            <Tabs defaultValue="rounds">
              <TabsList className="grid h-auto w-full grid-cols-3 gap-1 p-1 sm:grid-cols-7">
                <TabsTrigger className="w-full" value="rounds">
                  Rounds
                </TabsTrigger>
                <TabsTrigger className="w-full" value="players">
                  Players
                </TabsTrigger>
                <TabsTrigger className="w-full" value="fines">
                  Fines
                </TabsTrigger>
                <TabsTrigger className="w-full" value="voting">
                  Voting
                </TabsTrigger>
                <TabsTrigger className="w-full" value="stats">
                  Stats
                </TabsTrigger>
                <TabsTrigger className="w-full" value="recaps">
                  AI recaps
                </TabsTrigger>
                <TabsTrigger className="w-full" value="settings">
                  Settings
                </TabsTrigger>
              </TabsList>
              <div className="mt-6">
                <TabsContent value="rounds">
                  <RoundsPanel data={bundle.data} refresh={refresh} />
                </TabsContent>
                <TabsContent value="players">
                  <PlayersPanel data={bundle.data} refresh={refresh} />
                </TabsContent>
                <TabsContent value="fines">
                  <FinesPanel data={bundle.data} refresh={refresh} />
                </TabsContent>
                <TabsContent value="voting">
                  <VotingPanel data={bundle.data} refresh={refresh} />
                </TabsContent>
                <TabsContent value="stats">
                  <StatsView data={bundle.data} />
                </TabsContent>
                <TabsContent value="recaps">
                  <RecapPanel data={bundle.data} refresh={refresh} />
                </TabsContent>
                <TabsContent value="settings">
                  <SettingsPanel data={bundle.data} refresh={refresh} />
                </TabsContent>
              </div>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}