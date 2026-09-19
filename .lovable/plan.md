# Fix Google sign-in for unregistered accounts

## What will change
- After Google returns to the sign-in page, check the user's stored profile instead of relying on account timestamps.
- Treat a missing or incomplete unpaid profile as unregistered: sign the temporary Google session out, show “No profile exists for this ID. Register to continue.”, and send the user to `/trial`.
- Keep existing registered customers signing in to the dashboard normally.
- Remove the remaining `/card-details` fallback from the signed-in page guard and send anyone without completed registration to `/trial` instead.

## Verification
- Confirm no active sign-in or paywall path references the deleted `/card-details` page.
- Run the focused checks and verify the sign-in and trial pages load correctly.

## Technical details
Google OAuth creates an authentication identity automatically, and the profile trigger can also create a basic row. Therefore, a profile row alone does not prove registration was completed; the existing `card_captured` registration flag will be checked with the profile record.
