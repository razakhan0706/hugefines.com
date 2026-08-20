# Add result filter to Fines Master stats card

## Changes
- Add a result filter dropdown in the top-right corner of the **Fines master** breakdown card on the Stats → Fines tab.
- Default to **All results**; options include the actual round results used by the team (e.g., Won, Lost, Drawn, In progress), sourced from the existing `resultBucket` / `resultBadge` logic.
- When a result is selected, recompute the Fines Master breakdown using only rounds whose `result` matches that bucket. Update each row's total, discounted, weeks, and average.
- Keep the card layout consistent with the other breakdown cards: title on the left, filter on the right.

## Verification
- Open the Stats tab → Fines and confirm the Fines master card shows a filter on the top right.
- Select a result filter and verify the totals change to reflect only rounds matching that result.
- Verify "All results" restores the unfiltered view.

## Technical details
- Update `src/components/StatsView.tsx` only.
- Extend `FinesTabInner` to derive unique result-bucket options from `data.rounds`.
- Pass a `resultFilter` state into a refactored `FinesMasterCard` that filters `rounds` before computing `finesMasterBreakdown`.
- Reuse `resultBucket` from `src/lib/fines.ts` to map each round's `result` text into the bucket keys.
