# Status

What's verified, what's waiting. Read when picking up work; CLAUDE.md holds only the rules.

## Verified in Foundry by the user

- The module registers: "Fallhammer Character Sheet" appears in a character's Sheet configuration (2026-10-23).

## Verified offline

- Hooks fire (2026-10-23): session start runs `npm ci`; editing a JS file lints it and returns errors; `git push` is blocked when `npm run check` fails and passes on a clean tree.

## Waiting on the user

- **Slice 1, card frame:** pull, relaunch the world. Use a weapon, a save spell (Fireball) and a healing spell. Each card: portrait, title, Description folded, one full-width band per roll; clicking a band does what dnd5e's button did (rolls still post as their own cards until slice 2). Quench "chat cards" (3 tests). Screenshots, and F12 errors if anything breaks. Game Settings → "One card per action" off brings back dnd5e's cards.
- **Slice 2, d20 band:** attack with a weapon. The attack's own card should not appear; the item card's Attack band shows the total, the d20 (gold ring on a natural 20), "Natural 20 · Critical hit" and hits or misses against your target; click it to see the dice math, the spare d20 and Roll again. Try a weapon with advantage (Alt) and, if anyone has it, Elven Accuracy: the extra dice sit right of the primary. Quench "chat cards" now has 4 tests. Game Settings → "Always roll two d20s" (world).
- **Slice 3, damage band:** roll damage from a card. Its own card should not appear; the Damage band shows the total and the total per damage type, "Critical: dice doubled" after a crit, and "On a save: Half Damage" for save spells. Open it: each roll's dice math, Roll again, and "Roll as critical" (or "Roll as normal" after a crit). Quench "chat cards" now has 5 tests. Until slice 5, dnd5e's apply-damage tray is hidden with the damage card; apply from the chat context menu (right-click the card) meanwhile.
- With Quench installed, run "Fallhammer Character Sheet: core" as GM. All six should pass. It makes and deletes a character named "FHCS test (safe to delete)".

## In code, not yet verified

- **Track R slice 1, card frame.** `src/chat/card.js` subclasses dnd5e's usage-message model (`compat.extendChatModel`) and swaps in `templates/chat/usage-card.hbs`: portrait, title, folded description (with flavor, materials and tags), dnd5e's roll buttons as full-width bands (`data-action` + `data-index`), other actions as centered buttons; targets, summaries and effect tray as dnd5e has them. Client setting `fhcs.cards` (reload on change). The outcome line is gone; `describeRoll` and `compat.rollFacts` stay for the d20 band. Offline: unit (8 outcome + 4 card cases), layout (4 card cases at 240–380, new overlap self-test).
- **Track R slice 3, damage band.** Damage and healing messages fold into the card (`FOLDED_TYPES`); `compat.damageFacts` and `card.js` `damageBand` draw the total, totals by type, critical and on-save words, each roll's math; `compat.rollDamageAgain` re-rolls as a critical or not without the dialog (our `data-fhcs-action` buttons, author or GM only). Unit: 4 damage cases; layout: 2 damage cases.
- **Track R slice 2, d20 band.** `src/chat/rolls.js` hides attack cards whose `system.origin` is a usage card (`dnd5e.renderChatMessage`) and adds a spare d20 to every d20 roll (`dnd5e.postRollConfiguration`, `roll.options.fhcs.spare`; world setting `fhcs.twoD20s`). `src/chat/card.js` `d20Band` and `src/chat/d20.js` `d20Row` draw the latest attack: total, d20 row (primary center, disadvantage left, advantage right; `roll.options.fhcs.sides` reserved for late adds), outcome words, dice math, earlier totals, Roll again. Offline: unit 6 d20-row cases; layout 3 rolled cases.

## Next session

1. Track R: card frame, d20 band and damage band in code; next the save band (ROADMAP Track R, in order). Facts: `docs/research/dnd5e-6.0-chat.md`, `docs/research/ready-set-roll.md`. Then Phase 1, header: SCOPE §4.1 and `docs/reference/tidy-classic-attributes.png`. Replace dnd5e's `header` part with ours (same part ID, so `_prepareHeaderContext` still feeds it), add a layout case, and extend Quench with the header's rolls and pips.
