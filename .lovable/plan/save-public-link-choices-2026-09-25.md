# Save public-link choices

## What will change
- Store each team's preferred Fines, Votes, and AI summary choices.
- Load those saved choices whenever the Public link section opens.
- Replace the single action with **Save** on the left and **Create public link** on the right.
- Keep link creation using the currently selected choices, including when all three are off.

## Technical details
- Add three non-null boolean preference fields to each team, preserving the current defaults: Fines on, Votes off, AI summary off.
- Save through the existing team permissions so only team editors can change them.
- Update the Public link controls with saved/loading states and clear success or error messages.
- Verify the page at mobile and desktop sizes and confirm the app still builds cleanly.
