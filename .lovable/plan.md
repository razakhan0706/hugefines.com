# Make the scorecard link actually work

## What I found

Your instinct is right — the scorecard link is currently doing nothing.

I tested your PlayHQ game-centre link two ways:

- The way the app fetches it today: the page comes back as a 2,290-character empty shell (just fonts, icons and a "Please enable JavaScript" notice). No scores, no players, no wickets. The recap gets nothing.
- With a proper rendering fetch (waiting for the page to load its data): the full scorecard comes through — both teams, 14/33 and 110/179, Two Day+, both match dates, the venue, the toss, and the full batting/bowling cards with dismissals.

So the field isn't broken conceptually — the fetch method just can't read a JavaScript-rendered site like PlayHQ. It also fails silently, so you never got told.

## What to build

1. Replace the raw page fetch in the recap server function with a rendering fetch (Firecrawl scrape, `formats: ["markdown"]`, `waitFor` ~8s, `onlyMainContent`). This is the method proven above to return the real scorecard.
2. Trim the result for the AI: strip image/link markup and marketing junk (app banners, "Skip to main content"), keep the scores, toss, dates, venue and the batting/bowling tables, cap at ~8,000 characters.
3. Report failures instead of hiding them. If nothing usable comes back, the recap still generates from fines and votes, but the panel shows a clear note: "Couldn't read that scorecard — recap written from fines and votes only."
4. Small UI touch in the recap panel: while generating, show "Reading scorecard…" so it's obvious the link is being used.
5. Keep the AI guardrails as they are — it may use concrete facts from the scorecard, never invent beyond it, and still must not mention a result on Day 1 of a two-dayer.

## Technical notes

- Requires linking the Firecrawl connector (a connect card will appear in chat) so the app can do rendered fetches at runtime; today's plain `fetch` in `src/lib/recap.functions.ts` is what fails.
- `generateRecap` returns an extra flag, e.g. `{ text, scorecardUsed: boolean }`, so `RecapPanel.tsx` can show the success/failure note.
- No database or schema changes.

If you'd rather not add a connector, the fallback is to swap the URL box for a "paste the scorecard text" box, which always works but is manual.
