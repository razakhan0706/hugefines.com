## Weekly fine cap with discounted tracking

### How the cap works
A **cap** is set per round (in the Rounds panel). It applies to **each player's cumulative fines within that round** — or per day for 2-day rounds (each day = separate week, each gets the same cap). If a player's total exceeds the cap, the **excess is discounted**: it does NOT count toward the individual or team tallies, but is tracked and shown **in red** across every stats section.

Example: cap is $5, player has $4 in fines, gets a $2 fine → $1 counts, $1 is discounted (shown in red).

### 1. Database migration
Add a nullable `cap` numeric column to `rounds`.

### 2. Move cap from Fine form → Round form
- **RoundsPanel.tsx**: Add a "Cap" input to both the add-round and edit-round forms. Shows "Max per player this round".
- **FinesPanel.tsx**: Remove the per-fine "Cap (max)" toggle and "Max amount" input — the cap is now round-level.

### 3. fines.ts — cap calculation logic
- Add `cap` to the `Round` interface.
- Add `applyCaps(fines, rounds)` → returns a `Map<fineId, { counted, discounted }>`. Groups fines by player + round + week, sorts by `created_at` (oldest first), walks the running total against the round's cap, and splits each fine into counted vs discounted portions.
- Add `discounted` field to `Breakdown` and `PlayerStat` interfaces.
- Update `buildPlayerStats` to use counted amounts for `total` and populate `discounted`.
- Update all breakdown functions (`roundTotals`, `categoryBreakdown`, `finesMasterBreakdown`, `opponentBreakdown`, `venueBreakdown`, `resultBreakdown`, `weekBreakdown`) to also sum discounted amounts using the cap map.

### 4. StatsView.tsx — show discounts in red, remove Outstanding

**Summary tiles** (top row): remove "Outstanding". Keep Season pot (counted total), Fines logged (count), Rounds played. Add a red "Discounted" tile showing total discounted across the season.

**Fines leaderboard**: add a red "Discounted" column showing each player's season discounted total (with their photo already present).

**Fines by round** (line chart): add a second red line for discounted amounts alongside the green counted line.

**All breakdown cards** (Fines master, Fines by opponent, Fines by venue, Fines by result, Fines by week): add a red "Discounted" column to each table, showing the discounted total for that category.

**Styling**: all discounted values use `text-red-600` (or destructive color) with the same `stat-num` font, clearly distinguishing them from counted amounts.

### 5. Public board (t.$slug.tsx)
No code change needed — it renders `<StatsView>`, so the discounts and removed Outstanding tile apply automatically.

### Files changed
- `supabase migration` (add `rounds.cap`)
- `src/lib/fines.ts` (cap logic + interface updates)
- `src/components/admin/RoundsPanel.tsx` (cap input)
- `src/components/admin/FinesPanel.tsx` (remove per-fine cap)
- `src/components/StatsView.tsx` (red discounts everywhere, remove Outstanding)