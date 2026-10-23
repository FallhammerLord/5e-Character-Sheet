# Status

What's verified, what's waiting. Read when picking up work; CLAUDE.md holds only the rules.

## Verified in Foundry by the user

- The module registers: "Fallhammer Character Sheet" appears in a character's Sheet configuration (2026-10-23).

## Verified offline

- Hooks fire (2026-10-23): session start runs `npm ci`; editing a JS file lints it and returns errors; `git push` is blocked when `npm run check` fails and passes on a clean tree.

## Waiting on the user

- **Slice 1, card frame:** pull, relaunch the world. Use a weapon, a save spell (Fireball) and a healing spell. Each card: portrait, title, Description folded, one full-width band per roll; clicking a band does what dnd5e's button did (rolls still post as their own cards until slice 2). Quench "chat cards" (3 tests). Screenshots, and F12 errors if anything breaks. Game Settings → "One card per action" off brings back dnd5e's cards.
- With Quench installed, run "Fallhammer Character Sheet: core" as GM. All six should pass. It makes and deletes a character named "FHCS test (safe to delete)".

## In code, not yet verified

- **Track R slice 1, card frame.** `src/chat/card.js` subclasses dnd5e's usage-message model (`compat.extendChatModel`) and swaps in `templates/chat/usage-card.hbs`: portrait, title, folded description (with flavor, materials and tags), dnd5e's roll buttons as full-width bands (`data-action` + `data-index`), other actions as centered buttons; targets, summaries and effect tray as dnd5e has them. Client setting `fhcs.cards` (reload on change). The outcome line is gone; `describeRoll` and `compat.rollFacts` stay for the d20 band. Offline: unit (8 outcome + 4 card cases), layout (4 card cases at 240–380, new overlap self-test).

## Next session

1. Track R: card frame in code; next the d20 band (ROADMAP Track R, in order). Facts: `docs/research/dnd5e-6.0-chat.md`, `docs/research/ready-set-roll.md`. Then Phase 1, header: SCOPE §4.1 and `docs/reference/tidy-classic-attributes.png`. Replace dnd5e's `header` part with ours (same part ID, so `_prepareHeaderContext` still feeds it), add a layout case, and extend Quench with the header's rolls and pips.
