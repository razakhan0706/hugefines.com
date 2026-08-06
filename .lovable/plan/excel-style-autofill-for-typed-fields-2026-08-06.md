# Excel-style autofill for typed fields

Add a reusable "suggest as you type" input that remembers values you've already used in this team, so the second time you type a venue, opponent or fines master you can accept the existing one with one tap instead of retyping it (and avoid creating a near-duplicate in the stats).

## How it behaves

- Start typing in a field like Venue. A small list drops down under the input with previously used matching values.
- Ghost text completes the rest of the top match inline (Excel-style). Press Tab or Enter (or tap the suggestion) to accept it exactly as previously spelt.
- Keep typing to ignore the suggestion; Esc dismisses the list. Arrow keys move through the list.
- Matching ignores case and extra spaces, so "berowra oval" will offer "Berowra Oval".
- If the typed value closely matches an existing one but isn't identical, a small hint appears: "Did you mean Berowra Oval?" with a one-tap accept.

## Where it applies

- Rounds: Opponent, Venue, Fines master (both the add form and the edit form).
- Fines: the Custom description field, and the round label field if typed.

Existing saved rounds are unchanged; their values simply become the suggestion source.

## Technical notes

- New `src/components/ui/autocomplete-input.tsx`: wraps `Input` with a filtered suggestion popover, inline ghost completion, keyboard handling (Tab/Enter/Arrow/Esc), and an `onSelect` callback.
- New helper in `src/lib/fines.ts`: `distinctValues(rounds, key)` returns trimmed, de-duplicated, frequency-sorted prior values (case-insensitive dedupe keeping the most-used spelling).
- `RoundsPanel.tsx` and `FinesPanel.tsx` pass those lists into the new input; no schema or query changes needed since rounds/fines are already loaded.
- Values are still stored as free text — the autofill is what keeps them consistent, so stats grouping stops splitting on typos.
