# Status

What's verified, what's waiting. Read when picking up work; CLAUDE.md holds only the rules.

## Verified in Foundry by the user

- The module registers: "Fallhammer Character Sheet" appears in a character's Sheet configuration (2026-10-23).

## Verified offline

- Hooks fire (2026-10-23): session start runs `npm ci`; editing a JS file lints it and returns errors; `git push` is blocked when `npm run check` fails and passes on a clean tree.

## Waiting on the user

- With Quench installed, run "Fallhammer Character Sheet: core" as GM. All six should pass. It makes and deletes a character named "FHCS test (safe to delete)".
- **Review the one-card mockup** (SCOPE §6.5, link in the session). No need to test the outcome line in Foundry: the one-card design replaces it.

## In code, not yet verified

- Track R outcome line (superseded by SCOPE §6.5; its `describeRoll` wording feeds the new bands): `src/chat/outcome.js` (`describeRoll` pure, `decorateMessage` on `dnd5e.renderChatMessage`), `templates/chat/outcome.hbs`, client setting `fhcs.clearCards`, facts read in `compat.rollFacts`. Offline: `npm run unit` (8 cases), layout cases at chat widths 240–380.

## Next session

1. Track R: once the mockup is approved, build the card frame on usage cards (ROADMAP Track R, in order). Facts: `docs/research/dnd5e-6.0-chat.md`, `docs/research/ready-set-roll.md`. Then Phase 1, header: SCOPE §4.1 and `docs/reference/tidy-classic-attributes.png`. Replace dnd5e's `header` part with ours (same part ID, so `_prepareHeaderContext` still feeds it), add a layout case, and extend Quench with the header's rolls and pips.
