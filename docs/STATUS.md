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

- **Inventory tab (Phase 3, 2026-10-26).** Our `inventory` part on dnd5e's `dnd5e-inventory` and `item-list-controls`: sections by item type, equip and attune toggles, uses and quantity fields, expand on the name, use on the picture, edit and delete in edit mode, the Columns menu in edit mode, and the attunement, currency and carried-weight footer. Offline: lint, load, unit and layout (5 cases) pass. Two new Quench tests (equip, attune, quantity, expand; the column menu). Not yet run in Foundry: the search, filter and sort controls, context menus and drag are dnd5e's and untested with our markup. First Quench run (2026-10-26, user's screenshot): 27 of 28; the Inventory row test hit Mocha's 2 s default with no step failing (four saves and redraws in a row). It now allows 15 s, so a real failure names its step. Second run (2026-10-26): 28 of 29; equip works, then for 3 s the ring's row had no attune button, or no row (cause unknown offline: dnd5e should mark an item with `attunement: 'required'` applicable). Third run: the row had no attune toggle before any click. Cause: dnd5e keeps attunement only on magical items (research note); the test ring wasn't magical. The sheet was right; the test now makes the ring magical, and on failure lists the row's actions and fields in words (Quench draws failure text as HTML). Waiting on the user: Quench again (the failure text, and any F12 errors), then a look in play.
- **Containers on the Inventory tab (2026-10-26).** Container rows carry dnd5e's `container` class, so dnd5e's drop handler moves an item dropped on one inside. Contents fold open under their container (nested, remembered per player); we prepare their row data, which dnd5e skips for contained items. Offline: layout (contents open and shut), unit and load (row partial loaded) pass. New Quench test (contents drawn inside, the fold, a drop through dnd5e's handler). First run (2026-10-26): 29 of 30; the rope wasn't inside the pack when checked. dnd5e's data was right (the user's search found a club inside a container); each create starts its own redraw and the check met an earlier one. The test now waits for the redraw with the rope.
- **Search reaches into containers (2026-10-26, user: "should we not show the container for clicking to unfold?").** dnd5e's filter hid the container around a match, so a match inside one showed an empty section. After each filter pass, a container holding a visible match is shown and its contents open while the search lasts; the player's fold returns when it clears. Checked offline in Chromium on a fixture with dnd5e's filter imitated (a ring in a pouch in a backpack). Waiting on the user: Quench, then searching and dragging in play.
- **Trays close on a click elsewhere (2026-10-26, user).** The portrait chips' trays (exhaustion, rest, levels) and the Columns menu closed only on a second click on their chip. One page-level listener now closes any open tray of ours on a click outside it. Verified by the user, and its Quench test passes (2026-10-26).

- **Chat log scrolling, third try (2026-10-24).** The user saw new cards stop short by exactly the Apply section: dnd5e builds its tray lists after the card is placed. Apply now starts folded, and while following a new card a `ResizeObserver` on it scrolls again on every size change.
- **Chat log scrolling (2026-10-24, second try).** First try (blocking `scrollBottom`, following only if `isAtBottom`) made no difference in the user's world. Now from Foundry 14's types (`@league-of-foundry-developers/foundry-vtt-types` 14.366 beta: `postOne(message, { notify, scroll })`): folded rolls post with `scroll: false`, no notification; the player's own new card posts with `scroll: true` and redraws of it scroll to the bottom for 8 s unless the player scrolls, clicks or types in the log. Load check covers it. Waiting on the user.

## Next session

Track R and Phases 0–2 are done and verified; don't rerun Quench or rework them unless the user reports a problem.

1. **Inventory in Foundry** (in code 2026-10-26): the user runs Quench (both batches; 30 tests in core and cards) and tries the tab, containers included. Fix what they report. Then the pinned filter buttons (ROADMAP Phase 3).
2. **Exhaustion display mismatch** (user's screenshot, 2026-10-24): at exhaustion 6 the header shows Init and saves with −12, the Attributes tab shows skills without it. Read so far (dnd5e 6.0.6 source, 2026-10-26): dnd5e puts `conditionRollReduction` into skills, saves, Init and passives alike (creature.mjs:307, common.mjs:321, attributes.mjs:523), and our skills read the same prepared `skill.total`. No code cause found. Waiting on the user's console check: on the sheet's actor, `system.attributes.exhaustion`, `conditionRollReduction`, `system.skills.ath.total`, `system.attributes.init.total`, `system.abilities.str.save.value`.
3. Then Spellbook (Phase 4), reusing the Inventory rows and list controls.
