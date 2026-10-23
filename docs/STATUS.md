# Status

What's verified, what's waiting. Read when picking up work; CLAUDE.md holds only the rules.

## Verified in Foundry by the user

- Track R basic tests pass after updating the installed copy to this branch (2026-10-24, user: "works on basic tests as expected").
- The module registers: "Fallhammer Character Sheet" appears in a character's Sheet configuration (2026-10-23).

## Verified offline

- Hooks fire (2026-10-23): session start runs `npm ci`; editing a JS file lints it and returns errors; `git push` is blocked when `npm run check` fails and passes on a clean tree.

## Waiting on the user

**Track R test round** (all eight slices, none run in Foundry yet). Pull the branch, Return to Setup, relaunch the world. Send screenshots, and F12 console errors for anything that breaks.

1. **Quench:** run "Fallhammer Character Sheet: core" (6 tests) and "…: chat cards" (11 tests) as GM. The chat batch turns "Roll damage on use" off while it runs and restores it.
2. **Weapon attack:** one card with portrait, title, Description folded. Attack and damage land in it with no windows; their own cards don't appear. Attack band: total, the d20 (gold ring on a natural 20), words ("Natural 20 · Critical hit", hits or misses against your target). Damage band: total and type, "Critical: dice doubled" after a crit.
3. **Open the bands:** dice math, Roll again; on damage, "Roll as critical" or "Roll as normal".
4. **Late adds:** dashed d20 slots, − left (red) and + right (blue), the same size as the black primary die. Each click adds a die on that side and compares it with the die counting now (advantage keeps higher, disadvantage lower; nothing cancels). Up to five a side, then the slot goes. In an opened band or row, type 1d4, -1d4 or 2 and press Enter. Only the roll's author and the GM see these.
5. **Fireball:** slot window still asks, damage rolls at once. As GM select three tokens, click the Save band: a row per token with Success or Failure. Apply section: dnd5e's damage tray, unfolded, halving for tokens that saved; effects tray if the spell has effects. A monster with Legendary Resistance shows the button on its failed row.
6. **Sheet rolls:** a skill, a save, a death save, initiative: each is our card with one d20 band and late adds. A death save keeps its result line; a concentration save its Break Concentration button.
7. **GM request:** request a save from the party. One card, a row per member, a Roll button on each player's own row; results fill in.
8. **Settings:** "One card per action" (client) off brings dnd5e's cards back. World: "Always roll two d20s", "Roll the attack on use", "Roll damage on use", "No roll dialogs". Hold Shift on a roll to get its dialog.

## In code, not yet verified

- **Chat log scrolling (2026-10-24, second try).** First try (blocking `scrollBottom`, following only if `isAtBottom`) made no difference in the user's world. Now from Foundry 14's types (`@league-of-foundry-developers/foundry-vtt-types` 14.366 beta: `postOne(message, { notify, scroll })`): folded rolls post with `scroll: false`, no notification; the player's own new card posts with `scroll: true` and redraws of it scroll to the bottom for 8 s unless the player scrolls, clicks or types in the log. Load check covers it. Waiting on the user.

- **Track R slice 1, card frame.** `src/chat/card.js` subclasses dnd5e's usage-message model (`compat.extendChatModel`) and swaps in `templates/chat/usage-card.hbs`: portrait, title, folded description (with flavor, materials and tags), dnd5e's roll buttons as full-width bands (`data-action` + `data-index`), other actions as centered buttons; targets, summaries and effect tray as dnd5e has them. Client setting `fhcs.cards` (reload on change). The outcome line is gone; `describeRoll` and `compat.rollFacts` stay for the d20 band. Offline: unit (8 outcome + 4 card cases), layout (4 card cases at 240–380, new overlap self-test).
- **Track R slice 8, standalone rolls.** `src/chat/roll-card.js` subclasses dnd5e's check and save models (drawn as `templates/chat/roll-card.hbs` when not folded into a usage card or a request) and its request model (`request-card.hbs`: one row per target; `handleRequest` reads `data-uuid`, a result's row carries its message id). Request results (`flags.dnd5e.requestResult`, `compat.requestOf`) hide and refresh the request on late adds. Header, rolled band, d20 row and bonus field are shared parts (`templates/chat/parts/`), preloaded at init; the load check fails if a part is included but not preloaded.
- **Track R slice 7, late adds.** `compat.addD20` adds a die on a side (spare first, then `freshD20` with Dice So Nice), keeps every die, marks the counting one (`d20.js` `countingDie`, `modeForSides`) and saves the roll in place (`message.update({ rolls })`); `compat.addBonus` rolls a formula and appends its terms. `rollFacts` records `canEdit` (author or GM) and bonuses. `rolls.js` `refreshOnRollChange` (`updateChatMessage`, every client) re-renders the card via `compat.refreshCard`, since dnd5e refreshes only on `system` changes. Known gaps: Reliable Talent and Halfling Lucky don't apply to dice added late.
- **Track R slice 6, roll on use, no dialogs.** `src/chat/rolls.js`: `rollOnUse` (`dnd5e.preUseActivity`) switches off dnd5e's own follow-up rolls when our settings are off; `damageAfterAttack` (`dnd5e.postRollAttack`) and `damageAfterUse` (`dnd5e.postUseActivity`, save activities) roll the card's damage via `compat.rollCardDamage` (explicit `system.origin`, no dialog, critical from the attack); `skipRollDialog` (`dnd5e.preRoll`) sets `dialog.configure` unless `compat.skipKeyHeld`. World settings `rollAttackOnUse`, `rollDamageOnUse`, `noRollDialogs`. Known gap: auto damage posts in the default roll mode, not the attack's.
- **Track R slice 5, apply.** The card's Apply section wraps dnd5e's `damage-application` in an element carrying the latest damage message's id (the tray reads its damage and each token's save outcome from the nearest `data-message-id`), plus dnd5e's `effect-application`; `compat.openTrays` unfolds both after dnd5e's own collapse setting runs; `compat.canApplyDamage` follows dnd5e's player-tray setting. Secondary actions (template, consume) moved below Apply.
- **Track R slice 4, save band.** Save and check messages fold into the card; `card.js` `saveRow` draws one row per message answering the band's button (`compat.answersButton`: skill, tool or ability). Each row carries its save's `data-message-id`, so dnd5e's `resistSave` works inside it. `compat.preferSelected` sets the card's targeting mode to selected (dnd5e's default is targeted). dnd5e's own summary rows for saves and checks are dropped. Unit: 3 save rows; layout: Fireball with three saves.
- **Track R slice 3, damage band.** Damage and healing messages fold into the card (`FOLDED_TYPES`); `compat.damageFacts` and `card.js` `damageBand` draw the total, totals by type, critical and on-save words, each roll's math; `compat.rollDamageAgain` re-rolls as a critical or not without the dialog (our `data-fhcs-action` buttons, author or GM only). Unit: 4 damage cases; layout: 2 damage cases.
- **Track R slice 2, d20 band.** `src/chat/rolls.js` hides attack cards whose `system.origin` is a usage card (`dnd5e.renderChatMessage`) and adds a spare d20 to every d20 roll (`dnd5e.postRollConfiguration`, `roll.options.fhcs.spare`; world setting `fhcs.twoD20s`). `src/chat/card.js` `d20Band` and `src/chat/d20.js` `d20Row` draw the latest attack: total, d20 row (primary center, disadvantage left, advantage right; `roll.options.fhcs.sides` reserved for late adds), outcome words, dice math, earlier totals, Roll again. Offline: unit 6 d20-row cases; layout 3 rolled cases.

## Next session

1. Track R: all eight slices in code, none verified in Foundry. Next: the user's test round ("Waiting on the user"), then fixes. Then the RSReforged step-aside, then Phase 1. (ROADMAP Track R, in order). Facts: `docs/research/dnd5e-6.0-chat.md`, `docs/research/ready-set-roll.md`. Then Phase 1, header: SCOPE §4.1 and `docs/reference/tidy-classic-attributes.png`. Replace dnd5e's `header` part with ours (same part ID, so `_prepareHeaderContext` still feeds it), add a layout case, and extend Quench with the header's rolls and pips.
