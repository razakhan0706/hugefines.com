# Co-admin access for your team

## Why it isn't working today

Adding someone as a collaborator in Lovable gives them access to *build the app* — it does not give them permission to edit your team's data. Your database only lets the team owner (and rows in a `team_access` table) edit players, rounds, fines and votes. That access table is currently empty, and the app has no screen for adding anyone to it, so nobody but you can save changes.

## What I'll build

An email-based co-admin invite in the Settings tab.

1. **Invite by email** — In Settings, a "Team admins" section where you type someone's email and press Invite. They appear in a list with their status (Pending / Active) and a remove button.
2. **They sign in** — When that person creates an account or signs in with the invited email, they automatically gain full edit rights to your team.
3. **They see the team** — Your team appears on their dashboard alongside any of their own, and every admin tab (Rounds, Players, Fines, Voting, Stats, Recaps) works for them exactly as it does for you.
4. **Owner stays in control** — Only the owner can invite or remove co-admins; a co-admin can edit data but can't delete the team or manage other admins.

## Technical notes

- Add `invited_email` (and keep `user_id` nullable) on `team_access`, with a unique constraint per team.
- A trigger on new user sign-up claims any pending `team_access` rows matching the new user's email and fills in `user_id`.
- `can_edit_team()` stays the source of truth for RLS, so all existing policies keep working unchanged.
- Tighten `team_access` RLS: owner manages all rows; a user can read their own row.
- Dashboard query changes from "teams I own" to "teams I own or have access to".
- New UI in `src/components/admin/SettingsPanel.tsx`.
