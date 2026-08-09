import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchTeamBundle } from "@/lib/useTeamData";
import { StatsView } from "@/components/StatsView";
import { Card, CardContent } from "@/components/ui/card";
import logoAsset from "@/assets/Website_Logo.png.asset.json";

const SHARE_IMAGE =
  "https://pixel-perfect-showcase-912.lovable.app/__l5e/assets-v1/47e3b408-fe2a-4307-be43-222ac817809d/huge-fines-share.png";

export const Route = createFileRoute("/t/$slug")({
  head: () => ({
    meta: [
      { title: "Live fines board — Huge Fines" },
      { name: "description", content: "Live team fines, stats and season awards." },
      { property: "og:title", content: "Live fines board — Huge Fines" },
      { property: "og:description", content: "Live team fines, stats and season awards." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SHARE_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: SHARE_IMAGE },
    ],
  }),
  component: PublicBoard,
});

function PublicBoard() {
  const { slug } = Route.useParams();

  const query = useQuery({
    queryKey: ["public-team", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("id")
        .eq("slug", slug)
        .eq("is_public", true)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("not found");
      return fetchTeamBundle(data.id);
    },
  });

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center">
            <img src={logoAsset.url} alt="Huge Fines" className="h-8 w-auto md:h-10" />
          </Link>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Live board
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10">
        {query.isLoading && <p className="text-muted-foreground">Loading board…</p>}
        {query.error && (
          <Card>
            <CardContent className="p-10 text-center">
              <p className="text-lg font-semibold">This board isn't available</p>
              <p className="mt-1 text-muted-foreground">
                The link may be wrong, or the team has made it private.
              </p>
            </CardContent>
          </Card>
        )}
        {query.data && (
          <>
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-accent-strong">
                {query.data.team.sport} · {query.data.team.season_name}
              </p>
              <h1 className="text-3xl font-bold">{query.data.team.name}</h1>
            </div>
            <StatsView data={query.data} />
            {query.data.recaps.length > 0 && (
              <Card className="mt-6">
                <CardContent className="p-5">
                  <h2 className="text-lg font-bold">Latest recap</h2>
                  <p className="mt-2 whitespace-pre-wrap leading-relaxed">
                    {query.data.recaps[0].body}
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
      <footer className="mt-10 border-t border-border py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 text-center">
          <img src={logoAsset.url} alt="Huge Fines" className="h-12 w-auto" />
          <p className="text-sm text-muted-foreground">
            Fines, votes and season stats for sports teams.
          </p>
        </div>
      </footer>
    </div>
  );
}