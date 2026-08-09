# Give the logo more presence

Four placements, all tasteful, no repetition within a single view.

## 1. Footer brand
Replace the plain text footer on the homepage and the public team page with the logo mark (small, ~28px tall) above the tagline and copyright line, centred.

## 2. Sign-in splash
On the auth page, show the logo above the sign-in card at a larger size (~64px tall) instead of the current text heading, so the first impression of the brand is the mark.

## 3. Dashboard empty state
When a user has no teams yet (and on a team with no rounds/fines), show the logo as a soft, faded illustration above the "create your first team / add your first round" message instead of a generic icon.

## 4. Social share image
Generate a 1200x630 share card built from the logo plus the tagline, host it as a project asset, and wire it into the homepage and public team page head as `og:image` / `twitter:image` so links shared in WhatsApp/iMessage show the brand.

## Notes
- The header logo stays exactly as-is; nothing else changes.
- Existing layout, copy, and colours are untouched apart from the swaps described above.
- Link previews are cached by WhatsApp/iMessage/etc, so the new share image may take a while to appear on links already shared.

## Technical
- `src/routes/index.tsx`, `src/routes/t.$slug.tsx` — footer logo, `og:image`/`twitter:image` in `head()`.
- `src/routes/auth.tsx` — logo splash above the form.
- `src/routes/_authenticated/dashboard.tsx` and the team empty states — faded logo illustration.
- Share card generated to `src/assets/`, uploaded via `lovable-assets`, referenced by absolute published URL in the leaf `head()` only.
