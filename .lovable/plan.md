Remove scorecard link from recap generation

## What to change

The scorecard URL field is being removed because it does not reliably help the recap (PlayHQ pages are JS-rendered and would need a paid Firecrawl connector). The recap will rely on fines and votes data only.

## Changes

1. **Remove the UI input in `src/components/admin/RecapPanel.tsx`**
   - Delete the "Scorecard link" label and `Input` field.
   - Stop setting `scorecardUrl` state and remove it from the `generateRecap` call.

2. **Remove scorecard support in `src/lib/recap.functions.ts`**
   - Delete the `scorecardUrl` field from the `inputValidator` shape.
   - Delete the entire HTML fetch / strip-tags / truncate block.
   - Remove the scorecard extract from the user message.
   - Update the system prompt so it no longer says it may use a scorecard extract.

3. **Verify the build compiles** and the Recap panel still works without the scorecard field.
