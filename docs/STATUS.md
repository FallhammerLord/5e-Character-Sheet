# Status

What's verified, what's waiting. Read when picking up work; CLAUDE.md holds only the rules.

## Verified in Foundry by the user

- Exhaustion penalty (2026-10-26, user: "it works as intended"): at exhaustion 6, skills, saves and Init all show the same −12. The mismatch seen on 2026-10-24 doesn't reproduce; dnd5e 6.0.6 applies `conditionRollReduction` to all three and our sheet reads those totals. Nothing to fix.
- Phase 3 Inventory (2026-10-26, user: Quench 30 of 30, "everything else seems to work as desired"): sections, equip and three-state attune toggles, uses and quantity, expand, the Columns menu in edit mode, the footer, dnd5e's search, filter and sort, containers (drop in, fold open, nested), and search showing matches inside containers. Trays close on a click elsewhere. Lessons kept in the research note: dnd5e keeps attunement only on magical items; each create starts its own redraw, so tests wait for theirs. The sort button no longer lights up all the time (dnd5e marks it active always); in code, not yet seen.
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

- **Phase 4, first Quench run (2026-10-26, user):** 33 of 34. The failure: "both level 1 spells share a section", read right after the rows appeared. Most likely a redraw in progress; the test now waits and names each spell's section if it fails again. User's screenshot: rows and colors as approved, but names centered (Foundry centers button content; now left-aligned, and the layout check imitates Foundry's centering). Asked for: a favorite toggle on the rows (now a column on both list tabs, on by default; the bookmark by the name is gone). Waiting on the next run. Second run (user): the section test still fails, and it is real: the always-prepared level 1 spell lands in `spell0` (Cantrips) while the unprepared one is in `spell1`. Nothing in dnd5e 6.0.6's `_prepareSpellbook` explains it; the test now reports each spell's stored level, method and prepared state and where dnd5e's own spellbook files it. Also from that round: Attributes favorites and group headings were centered (now left-aligned). Third run (user): the section test passed, the Prepared pin test failed instead. Both are most likely clicks on markup a pending redraw replaced, so the section mismatch was not a dnd5e quirk after all; the tests now wait for redraws to settle (`settled()`) before clicking. If either fails again, the section test's message names each spell's level, method, prepared state and dnd5e's own section. Asked for in that round: on Attributes, a favorite's name opens its details in place (no item window) and its picture uses it; favorites take their home tab's look (preparation kind tints for every kind, innate and at will said in words). Built, with a fifth new Quench test (35 in core).
- **Phase 4 Spellbook (2026-10-26).** Built to the approved mockup; offline checks pass (layout: 6 Spellbook cases at 644–900 in both themes; unit: states, kinds, Can cast, section order, pips; load: part, partials, overrides; each seen failing once). Quench has four new core tests: rows by section and the book (always prepared can't be clicked), the Prepared pin hiding an unprepared spell, the concentration bar (name, Con save reaching dnd5e's hook, End), and the Spellbook column menu. Not yet run in Foundry. Also in this round: Inventory's pinned filters (Action, Bonus, Equipped) and the book with kind colors on Attributes favorites.

- **Chat log scrolling, third try (2026-10-24).** The user saw new cards stop short by exactly the Apply section: dnd5e builds its tray lists after the card is placed. Apply now starts folded, and while following a new card a `ResizeObserver` on it scrolls again on every size change.
- **Chat log scrolling (2026-10-24, second try).** First try (blocking `scrollBottom`, following only if `isAtBottom`) made no difference in the user's world. Now from Foundry 14's types (`@league-of-foundry-developers/foundry-vtt-types` 14.366 beta: `postOne(message, { notify, scroll })`): folded rolls post with `scroll: false`, no notification; the player's own new card posts with `scroll: true` and redraws of it scroll to the bottom for 8 s unless the player scrolls, clicks or types in the log. Load check covers it. Waiting on the user.

## Next session

Track R and Phases 0–3 are done and verified (Phase 3 lacks only the optional pinned filter buttons); don't rerun Quench or rework them unless the user reports a problem.

1. **Phase 4 Spellbook: waiting on the user's test** (built 2026-10-26). Ask for a Quench run (core batch, now 34 tests) and a look at a caster's Spellbook, ideally a multiclass one with Pact Magic. Open in play: Can cast with slots spent, spells granted by items, a ritual caster.
