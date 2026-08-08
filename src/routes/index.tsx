import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PhotoAvatar } from "@/components/PhotoAvatar";
import { BarChart3, ClipboardList, Share2, Sparkles, Vote, Users } from "lucide-react";
import player1 from "@/assets/player-1.jpg.asset.json";
import player2 from "@/assets/player-2.jpg.asset.json";
import player3 from "@/assets/player-3.jpg.asset.json";
import player4 from "@/assets/player-4.jpg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Huge Fines — Club Fines, Votes & Season Stats" },
      {
        name: "description",
        content:
          "Replace the fines spreadsheet. Log fines in seconds, run 5-4-3-2-1 voting, share a live team link and get AI season recaps.",
      },
      { property: "og:title", content: "Huge Fines — Club Fines, Votes & Season Stats" },
      {
        property: "og:description",
        content:
          "Replace the fines spreadsheet. Log fines in seconds, run 5-4-3-2-1 voting and share a live team link.",
      },
    ],
  }),
  component: Index,
});

const FEATURES = [
  {
    icon: ClipboardList,
    title: "Fines in a few taps",
    body: "Reusable categories and one-off fines, logged against a player and a round.",
  },
  {
    icon: BarChart3,
    title: "Stats worth paying for",
    body: "Leaderboards, season awards, category breakdowns, and filters so that your team can break their fines down to the core.",
  },
  {
    icon: Vote,
    title: "Votes, done properly",
    body: "Run your team's voting, as if you're at the Brownlow or the Dally M. Admin-only entry keeps it honest; reveal the leaderboard when you're ready.",
  },
  {
    icon: Sparkles,
    title: "AI season commentary",
    body: "Weekly and season recaps that turn your fines and votes into a proper storyline.",
  },
  {
    icon: Share2,
    title: "Live public link",
    body: "Share one read-only link with the whole team. It updates the moment you save a fine.",
  },
  {
    icon: Users,
    title: "Shared admin access",
    body: "Invite a co-admin the way you'd share a doc.",
  },
];

function Index() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-[1.1fr_0.9fr] md:items-center md:gap-10 md:py-16">
          <div className="order-2 md:order-1">
            <span className="inline-flex items-center rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent-strong">
              BUILT FOR LOCAL SPORT
            </span>
            <h1 className="mt-3 text-4xl font-extrabold leading-[1.05] md:mt-5 md:text-6xl">
              Your team's fines book,
              <span className="text-accent"> finally worth reading.</span>
            </h1>
            <p className="mt-3 max-w-xl text-base text-muted-foreground md:mt-5 md:text-lg">
              Kill the spreadsheet. Log fines for bad haircuts and worse parking. Run
              player-of-the-season voting, and let the whole team follow a live leaderboard all
              season.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button asChild size="lg" className="w-full text-xs sm:text-sm">
                <Link to="/auth">Create your team</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full text-xs sm:text-sm">
                <Link to="/auth">Start 7 day free trial</Link>
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground sm:text-sm">
              Standard team — 20 player profiles, 12 months of usage. No cut of your fines money. All for $19.99
            </p>
            <Button asChild size="sm" variant="outline" className="mt-2 w-full text-xs sm:w-auto">
              <a href="#how">See how it works</a>
            </Button>
          </div>

          <Card className="order-1 self-center border-2 md:order-2">
            <CardContent className="p-4 md:p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Live fines leaderboard
              </p>
              <ul className="mt-4 space-y-3">
                {[
                  ["Dev Patel", "$94", "Late to warm-up ×6", player1.url],
                  ["Josh Reid", "$88", "Pink shorts", player2.url],
                  ["Sam Okafor", "$71", "Shocking parking", player3.url],
                  ["Tom Lacey", "$62", "Dropped a sitter", player4.url],
                ].map(([name, amount, reason, photo], i) => (
                  <li key={name} className="flex items-center gap-3 border-b border-border pb-3 last:border-0">
                    <span className="stat-num w-6 text-muted-foreground">{i + 1}</span>
                    <PhotoAvatar url={photo} name={name} className="size-10" />
                    <div className="flex-1">
                      <p className="font-semibold">{name}</p>
                      <p className="text-sm text-muted-foreground">{reason}</p>
                    </div>
                    <span className="stat-num text-xl font-bold text-accent">{amount}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl font-bold">Everything the fines book can't do</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title}>
              <CardContent className="p-6">
                <span className="flex size-10 items-center justify-center rounded-lg bg-accent-soft text-accent-strong">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-secondary">
        <div className="mx-auto max-w-6xl px-4 py-14 text-center">
          <h2 className="text-3xl font-bold">Set your team up in a few minutes</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Create a season, add up to 20 players, and start fining. The end-of-season party funds
            itself.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Create your team</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">Start 7 day free trial</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Standard team — 20 player profiles, 12 months of usage. No cut of your fines money. All for $19.99
          </p>
          <a href="#how" className="mt-2 inline-block text-sm font-medium text-accent hover:underline">
            See how it works
          </a>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        Huge Fines — fines, votes and stats for sports teams.
      </footer>
    </div>
  );
}
