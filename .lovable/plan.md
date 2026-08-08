# Add vote-streak stat and simplify Player of the Season detail

## What to build

1. Add a **"Most Consecutive Weeks"** vote award in the Stats > Votes tab. The award detail should read like "Votes in 5 consecutive weeks".
2. Simplify the existing **Player of the Season** award detail so it shows only vote points, e.g. "33 votes", removing the "across X rounds" wording.

## Why

The user wants fun vote-based stats that celebrate consistency (longest voting streak), and the current MVP detail is too verbose.

## Technical plan

1. **`src/lib/fines.ts`**
   - Add `voteStreak: number` to the `PlayerStat` interface.
   - In `buildPlayerStats`, compute each player's longest consecutive run of rounds in which they received any votes. Use rounds ordered by `round_number`, treating a round as a "week" for voting purposes.
   - In `seasonAwards`, add a new award titled **"Most Consecutive Weeks"** (or similar). Give it to the player with the highest `voteStreak` when `voteStreak > 0`. Detail format: `"Votes in ${voteStreak} consecutive weeks"`.
   - Change the existing Player of the Season detail from `"${points} votes across ${rounds} rounds"` to `"${points} votes"`.

2. **`src/components/StatsView.tsx`**
   - In `FinesTab`, filter out both `"Player of the Season"` and the new `"Most Consecutive Weeks"` award so vote awards stay in the Votes tab only.
   - In `VotesTab`, display the new consecutive-weeks award alongside the Player of the Season award (e.g., both rendered as award cards above the leaderboard).

3. **Verification**
   - Run a type-check / build to ensure the new `voteStreak` field is used consistently.
   - Check the preview Stats > Votes tab to confirm the new award appears and the MVP detail reads only the vote count.

## Out of scope

- No database migrations are needed; the calculation derives from existing `votes` and `rounds` data.
- No UI styling changes beyond adding the award card.
