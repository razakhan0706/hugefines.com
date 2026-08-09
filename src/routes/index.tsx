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
import logoAsset from "@/assets/Website_Logo.png.asset.json";

const SHARE_IMAGE =
  "https://pixel-perfect-showcase-912.lovable.app/__l5e/assets-v1/47e3b408-fe2a-4307-be43-222ac817809d/huge-fines-share.png";

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
      { property: "og:type", content: "website" },
      { property: "og:image", content: SHARE_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: SHARE_IMAGE },
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
        <div className="mx-auto grid max-w-6xl gap-5 px-4 py-5 md:grid-cols-[1.1fr_0.9fr] md:gap-x-10 md:gap-y-5 md:py-16">
          <div className="order-1 md:col-start-1 md:row-start-1 md:self-end">
            <span className="inline-flex items-center rounded-full bg-accent-soft px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-accent-strong">
              BUILT FOR LOCAL SPORT
            </span>
            <h1 className="mt-2 text-3xl font-extrabold leading-[1.05] md:mt-5 md:text-6xl">
              Your team's fines book,
              <span className="text-accent"> finally worth reading.</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground md:mt-5 md:text-lg">
              Kill the spreadsheet. Log fines, run voting, and follow a live leaderboard all season.
            </p>
          </div>

          <Card className="order-2 self-center border-2 md:col-start-2 md:row-span-2 md:row-start-1">
            <CardContent className="p-3 md:p-6">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Live fines leaderboard
              </p>
              <ul className="mt-2 space-y-1 md:mt-4 md:space-y-3">
                {[
                  ["Dev Patel", "$94", "Late to warm-up ×6", player1.url],
                  ["Josh Reid", "$88", "Pink shorts", player2.url],
                  ["Sam Okafor", "$71", "Shocking parking", player3.url],
                  ["Tom Lacey", "$62", "Dropped a sitter", player4.url],
                ].map(([name, amount, reason, photo], i) => (
                  <li key={name} className="flex items-center gap-2 border-b border-border pb-1.5 last:border-0 md:gap-3 md:pb-3">
                    <span className="stat-num w-5 text-xs text-muted-foreground md:w-6">{i + 1}</span>
                    <PhotoAvatar url={photo} name={name} className="size-8 md:size-10" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold md:text-base">{name}</p>
                      <p className="text-xs text-muted-foreground">{reason}</p>
                    </div>
                    <span className="stat-num text-base font-bold text-accent md:text-xl">{amount}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="order-3 flex flex-col gap-3 md:col-start-1 md:row-start-2 md:self-start">
            <Button asChild size="sm" variant="outline" className="w-full text-xs sm:w-auto">
              <a href="#how">See how it works</a>
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button asChild size="default" className="w-full text-xs sm:text-sm">
                <Link to="/auth">Create your team</Link>
              </Button>
              <Button asChild size="default" variant="outline" className="w-full text-xs sm:text-sm">
                <Link to="/auth">Start 7 day free trial</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Standard team — 20 player profiles, 12 months of usage. No cut of your fines money. All for $19.99
            </p>
          </div>
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
          <div className="mx-auto mt-7 grid max-w-md grid-cols-2 gap-3">
            <Button asChild size="lg" className="w-full text-xs sm:text-sm">
              <Link to="/auth">Create your team</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full text-xs sm:text-sm">
              <Link to="/auth">Start 7 day free trial</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground sm:text-base">
            Standard team — 20 player profiles, 12 months of usage. No cut of your fines money. All for $19.99
          </p>
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 text-center">
          <img src={logoAsset.url} alt="Huge Fines" className="h-20 w-auto md:h-24" />
          <p className="text-sm text-muted-foreground">
            Fines, votes and season stats for sports teams.
          </p>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Huge Fines
          </p>
        </div>
      </footer>
    </div>
  );
}
