import { createFileRoute, Link } from "@tanstack/react-router";
import { useShareBundle } from "@/lib/useShareData";
import { StatsView } from "@/components/StatsView";
import { Card, CardContent } from "@/components/ui/card";
import logoAsset from "@/assets/Website_Logo.png.asset.json";

export const Route = createFileRoute("/share/$token")({
  component: ShareBoard,
});

function ShareBoard() {
  const { token } = Route.useParams();
  const query = useShareBundle(token);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center">
            <img
              src={logoAsset.url}
              alt="Huge Fines"
              className="h-12 w-auto md:h-14"
            />
          </Link>

          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Shared board
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        {query.isLoading && (
          <p className="text-muted-foreground">Loading board…</p>
        )}

        {query.error && (
          <Card>
            <CardContent className="p-10 text-center">
              <p className="text-lg font-semibold">
                This share link isn't available
              </p>

              <p className="mt-1 text-muted-foreground">
                The link may be invalid or it may have been disabled.
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

              <h1 className="text-3xl font-bold">
                {query.data.team.name}
              </h1>
            </div>

            <StatsView
              data={query.data}
              showFines={query.data.share.show_fines}
              showVotes={query.data.share.show_votes}
            />

            {query.data.share.show_recaps &&
              query.data.recaps.length > 0 && (
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
          <img
            src={logoAsset.url}
            alt="Huge Fines"
            className="h-20 w-auto md:h-24"
          />

          <p className="text-sm text-muted-foreground">
            Fines, votes and season stats for sports teams.
          </p>
        </div>
      </footer>
    </div>
  );
}