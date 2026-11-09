# Status

The current state: what the next session does, what waits on the user, what's verified. Short, one entry per thing; history lives in commits, how things work in `docs/BUILT.md`, rules in `CLAUDE.md`.

## Next session

1. **Phase 6.7, every sheet** (ROADMAP; SCOPE §4.13, §5.4): the NPC sheet first. Start with dnd5e's NPC sheet source (research note `dnd5e-6.0-other-sheets.md`), then the design questions and mockup boards. Chosen over Phase 7 so the NPC sheet gets the ADHD layer with the rest. The play round's ask 12 waits on a session of play.
2. **`#postNotification` TypeError** seen in the chat card runs: in Foundry's own code, cause not yet known; no test fails on it.

Don't rerun Quench or rework Track R or Phases 0–6 unless the user reports a problem.

## Waiting on the user

- **Chat cards in play** (from a player's client): another player's attack and damage show once rolled; an effect applied from a card leaves a line; the hit line holds when targets change; each damage type its own total; a new card scrolls fully into view, down to Apply.
- **Token sizes on Wildcard swaps** (ROADMAP play round ask 12; after a session of play, user 2026-11-08): swap a resized token's image to an untagged file (size stays), then to a tagged one like `_scale1.5` (scale applies). Not testable offline beyond the unit cases; no Quench test (it needs a scene token).
- **Player sheet lock-up** (ROADMAP "Player-side bugs" 2): the F12 console output the next time it happens, and what "locked" looks like.
- **Not yet tried:** choosing a class, species or background in edit mode; Special Traits checkboxes at 20px.

## Verified

In Foundry, by the user:

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
