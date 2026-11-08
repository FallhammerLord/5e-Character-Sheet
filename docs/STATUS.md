# Status

The current state: what the next session does, what waits on the user, what's verified. Short, one entry per thing; history lives in commits, how things work in `docs/BUILT.md`, rules in `CLAUDE.md`.

## Next session

1. **Play round 2026-11-08, asks 3 and 4** (ROADMAP, "Play round, 2026-11-08"): smooth folds and trays (open and close, every theme), then Night brighter (SCOPE §4.12's banked glows reaching Night's moons; no new rule needed). The rest of the round is verified.
2. **Mechanical parity** (ROADMAP, "Mechanical parity checklist"; Phase 1's three open items): the next phase after the play round (user, 2026-11-08). Recommended: a Quench batch that exercises each parity item, so one run verifies most of the list.
3. **Favorites trap** (on `main`): the core batch logs every write to the test character's favorites with its caller; the effect test's failures report them. It failed three runs out of several, at moving steps, then passed (user, 2026-11-08); not yet known which writer. Look at it only if it fails again, from the failure text and the console's `fhcs | test favorites write` warnings. Our code never writes `system.favorites`.

Don't rerun Quench or rework Track R or Phases 0–6 unless the user reports a problem.

## Waiting on the user

- **Chat cards in play** (from a player's client): another player's attack and damage show once rolled; an effect applied from a card leaves a line; the hit line holds when targets change; each damage type its own total; a new card scrolls fully into view, down to Apply.
- **Player sheet lock-up** (ROADMAP "Player-side bugs" 2): the F12 console output the next time it happens, and what "locked" looks like.
- **Not yet tried:** choosing a class, species or background in edit mode; Special Traits checkboxes at 20px.

## Verified

In Foundry, by the user:

- **Play round 2026-11-08, asks 1, 2 and 5–10** (2026-11-08, Quench and play: "quench passes. the rest plays very nicely"): toggles easing, Temp's bar and its moments, Max ± on HP's bar, exhaustion's face at 0, the Traits gear at its bar's right over the row gears, Special Traits closing from its own gear, edit-mode HP on one line. Quench passing also covers Phases 6.5–6.7's tests.
- **Play round 2026-11-08** (play by the user; Quench pending): Day and Night's toggle moments, hit and heal at the HP line, the tab line's slide, the portrait's light catch, Day's particles, dnd5e's item menu on favorites; Forge and the "Sheet motion" setting; the item sheet saving its Category and icon, and the Cleric, Dwarf and Criminal in it; the milestone track; Level up and New class into dnd5e's wizard; level down; the biography editor; exhaustion lowered with a right-click. The Phase 6.5 polish (class card ring, resource panels, folding, arrows) seen, no issues reported. What to change is the "Play round, 2026-11-08" list in ROADMAP.
- **Phase 6 edit mode, lifecycle and styling** (2026-10-28, play by the user; Quench core all but one test, which passed by hand): the portrait card, HP tray, edit-mode header, framing, Attributes in edit mode, level down and spellcasting ability, then the styling pass: title bar, status group, combat and abilities panels, traits and resources, one chip look, concentration's mark, spacing 4 or 8. How it works: BUILT.
- **Phase 5 Features, Effects, Biography and header cards** (2026-10-27, Quench core and play): features by source or active and passive; effects by kind with the switch and conditions; biography fields edited in place; class, species and background cards under the abilities with Level up in the level tray; ledger rows on every list.
- **Phase 4 Spellbook** (2026-10-26, Quench core 35 of 35 and play): sections with slot pips (Pact Magic, item, ritual), the book, Can cast with slots spent, favorites and their glow, the concentration bar, filters and Columns menu, context menu and drag, Attributes favorites (innate and at will).
- **Phase 3 Inventory** (2026-10-26, Quench 30 of 30 and play): sections, equip and attune toggles, uses and quantity, expand, Columns menu, footer, search, filter and sort, pinned filters, containers (drop in, fold, nest, search inside).
- **Phase 2 Attributes, frame and tab row** (2026-10-24, Quench 26 of 26 and play): skills, passives, traits, favorites, slot pips, death saves in the header, tabs and lock.
- **Phase 1 header** (2026-10-24, screenshot and Quench): portrait chips, HP, XP and level, origin line, AC, Init and the ability row, in the dark theme with none of dnd5e's look.
- **Exhaustion penalty** (2026-10-26): skills, saves and Init show the same total at every level; nothing to fix.
- **Track R, rolls and chat cards** (2026-10-24, Quench and play): bands, late adds, saves for selected tokens, Apply, standalone rolls, GM requests, settings.

Offline:

- **Hooks** (2026-10-23): session start installs, editing a JS file lints it, `git push` is blocked until `npm run check` passes.
