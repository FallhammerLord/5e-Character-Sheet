# Status

What's verified, what's waiting. Read when picking up work; CLAUDE.md holds only the rules.

## Verified in Foundry by the user

- Track R complete: the play checks for saves, Apply, sheet rolls, GM requests and settings are closed (2026-10-24, user, reported in a parallel chat).
- Tabs switch by hand, pips work, and both Quench batches pass, 26 of 26 (2026-10-24, user, after the second round's fixes). Quench covers: header rolls and chips, tab row and lock, skill roll, passive toggle and folds, death saves at 0 HP, rest, item use; usage cards, attack and damage bands, roll on use, no dialogs, late adds, standalone skill card, GM request, save band for selected tokens.
- Unbuilt tabs (Inventory, Spellbook, Features, Effects, Biography) show Foundry's bare defaults: bulleted controls, no rows, loose numbers (2026-10-24, user's screenshots: "everything tossed into the tab"). Expected until each phase replaces them; Phase 3 starts with the shared list controls.
- Our header and frame render in the user's v14 world, dark theme, with none of dnd5e's sheet look (2026-10-24, user's screenshot): portrait chips, HP, XP and level, origin line, AC, Init and the ability row. Fixes from that round: death save pips were oval (Foundry's button min-height; now reset, and the layout check imitates it and fails on a round control that isn't square), three successes cleared the pips (dnd5e's reset; now kept until HP rises above 0, which clears both rows: `src/sheet/death.js`), skill rows too tall (now 24px), death saves made the header much taller (now drawn over the greyed portrait), the title bar looked separate (now a slim strip in the sheet's colors, title hidden), and an `Item5e` "type: may not be undefined" error, most likely dnd5e's add button, unstyled once dnd5e's look was gone and creating an item with no type on the Attributes tab (now shown only on Inventory, Features, Spells and Effects, as dnd5e does).

- Track R basic tests pass after updating the installed copy to this branch (2026-10-24, user: "works on basic tests as expected").
- Track R in play (2026-10-24, user's screenshots and reports): attack and damage bands with every die shown; late advantage and disadvantage by click order, the newest die in the slot; Roll again and the Critical switch keep their state and their places; earlier rolls scroll in their own box; open panels stay open on re-render; dark mode with a white default die; delayed tooltips cleared by a click; three text styles and compact panels ("very professional now").
- The module registers: "Fallhammer Character Sheet" appears in a character's Sheet configuration (2026-10-23).

## Verified offline

- Hooks fire (2026-10-23): session start runs `npm ci`; editing a JS file lints it and returns errors; `git push` is blocked when `npm run check` fails and passes on a clean tree.

## Play checks (when convenient; not blocking)

They wait only for a game where the user tries them; not work for a session to pick up.

1. **Header:** art fits (round, square, tall), both ability emphasis settings, the milestone track with dnd5e's leveling set to no XP.

## In code, not yet verified

- **Phase 3a, item lists (2026-10-24).** dnd5e still draws Inventory, Features and Spellbook lists (`dnd5e-inventory`, `item-list-controls`); our CSS now styles its markup (`styles/fhcs.css`, "dnd5e's item lists"): search bar in one row with 28px buttons; sections with a label row; item rows with icon, name over subtitle, columns at dnd5e's widths (quantity 84 and controls 108 for 24px targets), even rows filled; equip, prepare and attune filled when on, not-attuned dashed; expanded description with pills. Offline: layout cases `inventory` and `inventory-editing` from a hand-written snapshot of dnd5e's markup (`tools/dnd5e-markup/inventory.mjs`), and three new layout rules (24px targets, row cells side by side, no list markers; each seen failing on the unstyled list). Quench: one more core test (equip from a row). Waiting on the user: Inventory, Features and Spellbook lists in Foundry, both themes; currency, encumbrance and containers still unstyled (next).
- **Chat log scrolling, third try (2026-10-24).** The user saw new cards stop short by exactly the Apply section: dnd5e builds its tray lists after the card is placed. Apply now starts folded, and while following a new card a `ResizeObserver` on it scrolls again on every size change.
- **Chat log scrolling (2026-10-24, second try).** First try (blocking `scrollBottom`, following only if `isAtBottom`) made no difference in the user's world. Now from Foundry 14's types (`@league-of-foundry-developers/foundry-vtt-types` 14.366 beta: `postOne(message, { notify, scroll })`): folded rolls post with `scroll: false`, no notification; the player's own new card posts with `scroll: true` and redraws of it scroll to the bottom for 8 s unless the player scrolls, clicks or types in the log. Load check covers it. Waiting on the user.

## Next session

Track R and Phases 0–2 are done and verified; don't rerun Quench or rework them unless the user reports a problem.

1. **Phase 3b, Inventory's own parts:** currency as a row (dnd5e's `i.currency` icons need our styling), encumbrance as a bar (`.meter.progress`, `--bar-percentage`, breakpoints), containers. Facts in the research note, "Item lists". Then the user's report on 3a.
2. **Exhaustion display mismatch** (user's screenshot, 2026-10-24): at exhaustion 6 the header shows Init and saves with −12, the Attributes tab shows skills without it. Check how dnd5e 6.0 applies the 2024 penalty (roll bonus or prepared total) and make both show the same thing.
3. Then Spellbook (Phase 4), reusing the Inventory rows.
