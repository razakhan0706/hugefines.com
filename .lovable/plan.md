# Correct the two stats graphs

## Changes
- Expand both plots inside their existing cards by reducing the oversized Y-axis reservation and using balanced left/right chart margins. Both graphs will remain fully visible in one mobile frame.
- Keep all five Top Offence Category bars and labels visible at once, with compact flat labels and no horizontal scrolling.
- Make the Fines by Round Y-axis explicitly include and display `0`, rather than relying only on a zero-based domain that currently produces labels beginning at `10`.
- Preserve the Fines by Round chronology from oldest on the left to newest on the right, with no X-axis displayed.

## Verification
- Open Stats on the current mobile viewport and measure the rendered plot edges to confirm the left and right inset are visually balanced.
- Confirm all five offence categories fit in one frame, the round chart visibly labels `0`, and neither graph scrolls horizontally.

## Technical details
- Update only `src/components/StatsView.tsx`.
- Give each `YAxis` a compact explicit width and use chart-specific margins.
- Generate explicit zero-inclusive Y-axis ticks for Fines by Round from its current maximum value.