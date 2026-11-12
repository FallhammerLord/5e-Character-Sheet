# Status

The current state: what the next session does, what waits on the user, what's verified. Short, one entry per thing; history lives in commits, how things work in `docs/BUILT.md`, rules in `CLAUDE.md`.

## Next session

1. **Sand and Sanctuary, the Argent Sands** (ROADMAP): built on the theme kit, `styles/themes/sand.css`, with particles, chat cards and every Forge layout case again in Sand; offline checks pass (lint, load, unit; the layout check, 576 Sand layouts across 368 cases, other sheets, chat cards and play and edit parity included). Waiting on the user: Quench (core and chat cards, for regressions) and play in their world (canvas row "Themes · Sand and Sanctuary" shows what to expect). Then its BUILT entry, and `main` when the user is satisfied.
2. **Phase 6.7's play round, then Phase 8** (ROADMAP): every sheet and the skin are built, pass Quench, and have BUILT entries; `main` holds them (2026-11-12). Waiting on the user: play for the container, group, encounter, vehicle and the skin (below); their notes come as one polish round (CLAUDE.md "How a polish round goes"). Phase 7 closed with nothing to build (user, 2026-11-12). Then Phase 8: themes shared with the quest log, then release (no compatibility work until a module is in use, user 2026-11-12). The play round's ask 12 waits on a session of play.
3. **`#postNotification` TypeError** seen in the chat card runs: in Foundry's own code, cause not yet known; no test fails on it.

Don't rerun Quench or rework Track R or Phases 0–6 unless the user reports a problem.

## Waiting on the user

- **The smaller windows' skin** (play; Quench core passed 2026-11-12, after a fix: the hook had stripped our sheets' themes): the new test "skins dnd5e's settings window for a character on our sheet". In play: open each kind from a sheet of ours (a gear's settings, a rest, an item's activity and its Details tab, an effect, Level up's wizard, a group's Award, the coins' window) in light, dark and Forge; the same windows from an actor on dnd5e's sheet should keep dnd5e's look.
- **Vehicle sheet** (play; Quench core passed 2026-11-12): the new test "opens a vehicle in our vehicle sheet". In play: choose "Fallhammer vehicle sheet" (⋮, Sheet); spend action pips; type HP into the Hull; in edit mode the display-options gear (show abilities, initiative, quality; actions from stations) and each trait's input; add a weapon and a draft animal; drop a creature onto a station to crew it, and take them off from their face; on Crew & Passengers drag a row between areas and step a count; Cargo's bar against the cargo capacity.
- **Encounter sheet** (play; Quench core passed 2026-11-10): the new test "opens an encounter in our encounter sheet". In play: choose "Fallhammer encounter sheet" (⋮, Sheet); add creatures (edit mode, Add creature); type a formula like 1d4 and roll it from the row in play; Roll every count; − and +; with a primary party set, the difficulty bar and its word; Award and Place members; Loot's coins.
- **Group sheet** (play; Quench core passed 2026-11-10): the new test "opens a group in our group sheet". In play: choose "Fallhammer group sheet" for a party (⋮, Sheet); step the pace; roll a member's Perception from their row; open a member from their name; remove one in edit mode; on Inventory drop an item onto a member's line, and with a primary vehicle switch to its inventory and edit its coins; write the Summary; Award and Place members.
- **Container sheet** (play; Quench core passed 2026-11-10): the new test "opens a container in our container sheet". In play: choose "Fallhammer container sheet" for a bag (its ⋮ menu, Sheet), then drop items in and out, nest a pouch, search inside it, use the Columns menu, edit the coins, and add the first effect from Effects.
- **Chat cards in play** (from a player's client): another player's attack and damage show once rolled; an effect applied from a card leaves a line; the hit line holds when targets change; each damage type its own total; a new card scrolls fully into view, down to Apply.
- **Token sizes on Wildcard swaps** (ROADMAP play round ask 12; after a session of play, user 2026-11-08): swap a resized token's image to an untagged file (size stays), then to a tagged one like `_scale1.5` (scale applies). Not testable offline beyond the unit cases; no Quench test (it needs a scene token).
- **Player sheet lock-up** (ROADMAP "Player-side bugs" 2): the F12 console output the next time it happens, and what "locked" looks like.
- **Not yet tried:** choosing a class, species or background in edit mode; Special Traits checkboxes at 20px.

## Verified

In Foundry, by the user:

- **NPC sheet** (2026-11-10, Quench and play: "quench passes and styling is fine"): header with CR and the legendary row, Abilities, Inventory, Spellbook, Effects, Biography. The first Quench run found a real bug, fixed (dnd5e's `_renderCreateInventory`). How it works: BUILT.
- **Theme kit** (2026-11-09, play: "working properly"): plates through `fhcs-plate`, the particle registry, one emblem place, the starter file and its load check. The class themes (SCOPE §7) may start. How it works: BUILT.
- **Mechanical parity** (2026-11-09, Quench core and chat, play): tools from Traits, coins and carried weight, the Limited and Observer views, favorites drag, Infuse Item's tray; the rest of the list needed no change. How it works: BUILT.
- **Effects test's moving failure** (2026-11-09, Quench passes): a test bug, the level-up test's dnd5e wizard finishing late and writing back the actor (CLAUDE.md trap).
- **Play round 2026-11-08, asks 4 and 14** (2026-11-08, play: "worked first time"): Night's brighter moons and moonbeam; inspiration's moment on the same star for every player, carried across redraws. The Quench bank test's new step not yet run.
- **Play round 2026-11-08, asks 3 and 13** (2026-11-08, portrait rest: "works properly"; play: "animations are better" after the trays' first-frame fix): folds and trays move both ways.
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
