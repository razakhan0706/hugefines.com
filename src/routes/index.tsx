import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, ClipboardList, Share2, Sparkles, Vote, Users } from "lucide-react";

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
    title: "Fines in two taps",
    body: "Reusable categories and one-off fines, logged against a player and a round on the sideline.",
  },
  {
    icon: BarChart3,
    title: "Stats worth paying for",
    body: "Category breakdowns, round trends, repeat-offender streaks and per-round averages your pivot table can't do.",
  },
  {
    icon: Vote,
    title: "Votes, done properly",
    body: "5-4-3-2-1, 3-2-1 or single vote. Admin-only entry keeps it honest; reveal the leaderboard when you're ready.",
  },
  {
    icon: Sparkles,
    title: "AI season commentary",
    body: "Automatic weekly and season recaps that turn your fines and votes into a proper storyline.",
  },
  {
    icon: Share2,
    title: "Live public link",
    body: "Share one read-only link with the whole club. It updates the moment you save a fine.",
  },
  {
    icon: Users,
    title: "Shared admin access",
    body: "Invite a co-admin the way you'd share a doc. Everyone else just watches.",
  },
];

function Index() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-24">
          <div>
            <span className="inline-flex items-center rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent-strong">
              Built for club sport
            </span>
            <h1 className="mt-5 text-5xl font-extrabold leading-[1.05] md:text-6xl">
              Your team's fines book,
              <span className="text-accent"> finally worth reading.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Kill the spreadsheet. Log $1 fines for bad haircuts and worse parking, run
              player-of-the-season voting, and let the whole club follow a live leaderboard all
              season.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/auth">Start your team</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#how">See how it works</a>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Standard team — 20 player profiles, full season. No cut of your fines money.
            </p>
          </div>

          <Card className="self-center border-2">
            <CardContent className="p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Live fines leaderboard
              </p>
              <ul className="mt-4 space-y-3">
                {[
                  ["Dev Patel", "$34", "Late to warm-up ×6"],
                  ["Josh Reid", "$28", "Pink shorts"],
                  ["Sam Okafor", "$21", "Shocking parking"],
                  ["Tom Lacey", "$12", "Dropped a sitter"],
                ].map(([name, amount, reason], i) => (
                  <li key={name} className="flex items-center gap-3 border-b border-border pb-3 last:border-0">
                    <span className="stat-num w-6 text-muted-foreground">{i + 1}</span>
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
          <h2 className="text-3xl font-bold">Set your team up in five minutes</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Create a season, add up to 20 players, and start fining. The end-of-season party fund
            counts itself.
          </p>
          <Button asChild size="lg" className="mt-7">
            <Link to="/auth">Create free account</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        Huge Fines — fines, votes and stats for sports teams.
      </footer>
    </div>
  );
}
