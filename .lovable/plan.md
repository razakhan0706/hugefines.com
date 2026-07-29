## What's happening

The "Round" box only accepts a number. When you type `Trial Match 1`, the form converts it to a number, fails, and silently falls back to the next round number. It then builds the name itself as `Round 1` — your text is never stored.

Confirmed in the code: the round form runs `Number(roundNumber) || nextNumber`, saves `label: "Round N"`, and every display helper rebuilds the name from the number instead of reading the saved label.

## What I'll change

**1. Let the Round box accept anything you type**
- Type `Trial Match 1`, `Grand Final`, or just `4` — whatever you write is saved as the round's name.
- A number is still pulled out of the text where one exists (so `Trial Match 1` sorts as round 1); if there's no number, it takes the next slot automatically for ordering only.

**2. Show your text everywhere the round appears**
- Round cards, the round dropdown in Fines, Voting, AI recaps, and the Stats "FINES BY WEEK" table all show your typed name instead of `Round N`.
- Two-dayers still append the day: `TRIAL MATCH 1 - DAY 2`.
- The square number badge on the round card stays as the sort number.

**3. Existing rounds** keep working — anything already saved as `Round 1` still reads `Round 1`.

## Technical notes

- `src/lib/fines.ts`: `roundDayLabel()` uses `round.label` as the base when present, falling back to `Round ${round_number}`; `weekBreakdown`/`roundTotals` inherit this automatically.
- `src/components/admin/RoundsPanel.tsx`: free-text round input; parse trailing/leading digits for `round_number`, store raw text in `label`, append `- Day N` for two-dayers.
- No database change — the `label` column already exists.
