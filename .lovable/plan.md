## What I checked

I inspected your live team page at 393px wide. The code from last turn is in place and running:

- Tabs render as: Rounds, Players, Fines, Voting, Stats, Recaps, Settings
- The Rounds tab currently has 4 working photo-upload inputs (team/fines-master/opposition slots)
- `PhotoAvatar` is wired into Players, Rounds, Fines list, Voting, Stats and the My teams cards
- `finesMasterBreakdown`, `opponentBreakdown`, `venueBreakdown`, `resultBreakdown`, `dateBreakdown` all exist and render as tables in the Stats tab

What the page actually renders right now: zero images, because no photo has been uploaded yet. Every slot is showing as a small grey circle with a faint camera icon and no label — on a phone that reads as "nothing changed". The round card also shows `Fines master: Ahmed` as plain text, with the upload circle easy to miss.

So the work landed, but it is invisible until you upload something. That's the real problem to fix.

## What I'll change

**1. Make every photo slot obviously tappable**
- Bigger circle with a dashed accent-coloured border when empty, instead of a flat grey dot
- A short label next to it: "Add photo", "Fines master photo", "Opposition logo", "Team logo"
- Slightly larger tap target on mobile

**2. Rounds tab layout on mobile**
- Put the Fines master name + its photo slot together as one labelled row, and the Opponent name + logo slot as another, so it's clear which photo belongs to which
- Same on the saved round cards

**3. Players / Fines / Voting**
- Empty player avatars show the player's initial again (currently a camera icon everywhere), with the camera badge in the corner so you can still tap to upload
- Fines list and voting pills inherit the same treatment

**4. Verify it end to end**
- Drive the live preview at 393px: upload a player photo, a fines master photo and an opposition logo, then confirm they appear in the Players list, the round card, the fines list, the voting pills and the Stats breakdown tables
- Screenshot each so you can see it actually working

**5. Stats tab check**
- Confirm the five new breakdown cards (fines master, opponent, venue, result, date) render with your existing round data, and show a clear "add match dates/venues to your rounds" message where a field is blank rather than an empty card

## Technical notes

- Changes are presentational only: `src/components/PhotoAvatar.tsx` (empty-state variant + label prop), plus call-site tweaks in `PlayersPanel.tsx`, `RoundsPanel.tsx`, `FinesPanel.tsx`, `VotingPanel.tsx`, `StatsView.tsx` and `dashboard.tsx`.
- No database or schema change — `photo_url`, `fines_master_photo_url`, `opponent_logo_url` and `logo_url` already exist.
- Verification uses Playwright against the running preview with a generated test image.
