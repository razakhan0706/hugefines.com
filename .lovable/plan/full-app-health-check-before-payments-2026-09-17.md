# Full app health check before payments

Goal: verify every part of Huge Fines works correctly before enabling any payment flow. No payment code yet.

## What I'll test (in the live preview)

1. **Auth** — sign-in page loads, signed-in session reaches the dashboard, sign-out works.
2. **Rounds** — add a round (opponent, logo upload, venue, result, 2-dayer with day 1/day 2, fines master), inline edit a round, result badges (W/L/D/In progress), day-2 result syncing day 1, day 2 sorting above day 1.
3. **Players** — add player with photo, change/remove photo, remove player, player limit enforcement.
4. **Fines** — add a fine (round, week, player, category, custom fine, amount), inline edit, delete, cap toggle, per-player daily cap with "Disc." amounts, category deletion absorbing fines into custom fines.
5. **Voting** — 3-2-1 votes per round, duplicate votes, edit/delete vote cards, all-weeks filter, anonymous votes, leaderboard above cards.
6. **Stats** — Fines and Votes sub-tabs, all award cards, Master/Opponent/Venue/Result/Date filters, Top Offence filters fitting on mobile, charts with both y-axes and 1-indexed labels, discounted amounts correct.
7. **Recap** — AI recap generation, include/exclude votes toggle, dd/mm/yyyy date display.
8. **Settings** — team name, currency, player limit, Yes/No toggles, Team Admins (invite a co-admin, confirm they can edit).
9. **Public link** — public leaderboard page loads and shows correct totals for a signed-out visitor.
10. **Landing page** — carousel arrows, pricing copy, email enquiries section.
11. **Backend health** — check Lovable Cloud is healthy and no database errors appear during all of the above.

## Fixing

Any bugs found get fixed in the same pass (or, if large, listed for your sign-off first). At the end you get a plain-English checklist of what passed and what was fixed.

## Not in scope

Payments stay off until this check is done and you've picked Paddle (needs a paid Lovable plan) or direct Stripe.

## Technical details

- Driven with automated browser checks against the preview plus Lovable Cloud status/log inspection.
- Test data created during checks will be clearly named and removed afterwards.
