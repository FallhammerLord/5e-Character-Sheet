# Status

What's verified, what's waiting. Read when picking up work; CLAUDE.md holds only the rules.

## Verified in Foundry by the user

- The module registers: "Fallhammer Character Sheet" appears in a character's Sheet configuration (2026-10-23).

## Verified offline

- Hooks fire (2026-10-23): session start runs `npm ci`; editing a JS file lints it and returns errors; `git push` is blocked when `npm run check` fails and passes on a clean tree.

## Waiting on the user

- With Quench installed, run "Fallhammer Character Sheet: core" as GM. All six should pass. It makes and deletes a character named "FHCS test (safe to delete)".
- **Clear chat cards (Track R, first slice).** Pull the branch and relaunch the world (a new template and setting). Then:
  - Quench: run "Fallhammer Character Sheet: chat cards" (two tests; nothing is posted to chat).
  - Roll an ability check, a save against a DC (a spell's save button, or a GM request), a death save, and an attack with a target. Each card should open with "Name · Roll type · total" and, under it, "Success vs DC 13" or "Failure vs DC 13", "Natural 20" or "Natural 1", and for attacks "Hits …" / "Misses …". Saves summarized on a spell's card get the same line.
  - As a player, check the DC and hit list appear only when dnd5e would show them to you.
  - Game Settings → Fallhammer Character Sheet → "Clear chat cards" turns it off for you alone.
  - Screenshot a few cards; F12 console errors if anything breaks.

## In code, not yet verified

- Track R outcome line: `src/chat/outcome.js` (`describeRoll` pure, `decorateMessage` on `dnd5e.renderChatMessage`), `templates/chat/outcome.hbs`, client setting `fhcs.clearCards`, facts read in `compat.rollFacts`. Offline: `npm run unit` (8 cases), layout cases at chat widths 240–380.

## Next session

1. Track R: adjust the outcome line from the user's screenshots; then late advantage on d20 cards (`docs/research/dnd5e-6.0-chat.md`, D20 rolls). Then Phase 1, header: SCOPE §4.1 and `docs/reference/tidy-classic-attributes.png`. Replace dnd5e's `header` part with ours (same part ID, so `_prepareHeaderContext` still feeds it), add a layout case, and extend Quench with the header's rolls and pips.
