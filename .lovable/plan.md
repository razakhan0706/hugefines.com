# Reorder & mobile-fit the team workspace tabs

## Goal
Reorder the team workspace tab toggle to 7 categories in this exact order:
**Rounds → Players → Fines → Voting → Stats → AI recaps → Settings**, and make them cleanly presentable on mobile (393px viewport).

## Current state (verified)
- `src/routes/_authenticated/team.$teamId.tsx` (lines 48-57): `TabsList className="flex flex-wrap"` with order Fines, Players, Rounds, Voting, Stats, AI recaps, Settings.
- `flex flex-wrap` makes 7 labeled tabs wrap into 2-3 uneven rows on a 393px screen — messy and not "properly presentable."
- The `TabsList` base style (`src/components/ui/tabs.tsx`) is `inline-flex h-9 ... rounded-lg bg-muted p-1`; no scroll behavior.

## Changes

### 1. `src/routes/_authenticated/team.$teamId.tsx`
- Reorder both the `TabsTrigger` list (lines 50-56) and the `TabsContent` blocks (lines 59-79) to: rounds, players, fines, voting, stats, recaps, settings.
- Change the default open tab from `defaultValue="fines"` to `defaultValue="rounds"` so the new first tab is shown initially.
- Change `TabsList` className from `flex flex-wrap` to a mobile-friendly horizontally scrollable single row:
  - `flex w-full overflow-x-auto gap-1` so it stays one row and scrolls horizontally on narrow screens, full-width so it spans the container.
  - Remove the default `justify-center`/`h-9` constraints only as needed; keep the muted background pill.
  - Add `-mx-1 px-1` padding so the scroll gutter aligns with content and the active focus rings aren't clipped.
- Add `shrink-0` to each `TabsTrigger` (or pass via className) so tabs keep their natural width and don't compress — enabling clean horizontal scroll without text truncation.
- Optionally hide the scrollbar visually for a cleaner look with a utility class (e.g. `[&::-webkit-scrollbar]:hidden`), while keeping scroll functionality.

### 2. Optional: scrollbar-hide utility
If not already present, add a small `.scrollbar-none` utility (or inline arbitrary variant) to `src/styles.css` so the horizontal tab scroll has no visible scrollbar on mobile. Only if a clean look is desired; horizontal scroll still works without it.

## Not changing
- No changes to any panel component logic (RoundsPanel, PlayersPanel, FinesPanel, etc.) — purely the tab ordering and layout presentation.
- No changes to the `Tabs`/`TabsTrigger` base component unless needed; preferring route-level className overrides to keep the shared component generic.

## Verification
- Run typecheck (`tsgo --noEmit`).
- Drive Playwright at 393px mobile width: confirm the tab bar is a single scrollable row, all 7 tabs reachable by horizontal scroll, "Rounds" is the default-open/active tab, and each tab's content matches its label after reordering.
