## Goal

When logging a fine under the **Rubbish chat** category, show an extra field to record the exact quote the player said.

## Behaviour

- In the Fines tab's "Add fine" card, selecting **Rubbish chat** reveals an extra input: `Exact quote — what did they actually say?`.
- Selecting any other category hides the field and clears whatever was typed.
- The quote is saved with the fine and shows in the fines list (and anywhere fines are listed, including the public board) as: `Rubbish chat — "I could bowl faster than that"`.
- The quote is optional; leaving it blank behaves exactly as today.

## Technical notes

- No database change needed. The quote is written into the existing `description` field on the fine, formatted as `"…"` so it reads naturally in every list that already renders `description`.
- Match the category by label (case-insensitive `"rubbish chat"`) in `src/components/admin/FinesPanel.tsx`, so it keeps working even if the category row is deleted and re-added.
- Add local `quote` state; clear it on category change and after a successful save.
