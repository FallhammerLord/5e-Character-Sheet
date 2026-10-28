# Status

The current state: what the next session does, what waits on the user, what's verified. Short, one entry per thing; history lives in commits, how things work in `docs/BUILT.md`, rules in `CLAUDE.md`.

## Next session

1. **Phase 6.5, Polish** (ROADMAP; SCOPE §4.10, §6.7): built, offline checks pass, not yet seen in Foundry. Waits on the user: Quench core and chat cards (new or changed: the class card's level ring, resource panels, section folding, damage types, the applied record) and a play check (an effect applied from a card leaves a line; the hit line holds when targets change). Then the BUILT entry.
2. **Themes** (Phase 6.6; SCOPE §4.11): the four themes are drawn and pass the layout check in light and dark; waits on the user's review of the mockup page (`node tools/theme-mockup.mjs`, then `tools/out/theme-mockup.html`). After it: slice 2, choosing a theme (world default, per character, Motion switch).
3. **One Quench test to rerun:** "switches an effect off and on, favorites it…" failed once after favoriting (2026-10-28); the user's hand test passed, so likely the test. Its messages now report what the row holds; if it fails again, read them before changing anything.

Don't rerun Quench or rework Track R or Phases 0–6 unless the user reports a problem.

## Waiting on the user

Play checks, when convenient (not work for a session to pick up):

- **Header:** the milestone track with dnd5e's leveling set to no XP, from the combat panel's Level button.
- **Phase 5, not yet tried in play:** Level up and New class from the level tray into dnd5e's wizard; removing and choosing a class, species or background in edit mode; the biography editor's writing area when open; exhaustion lowered with a right-click.
- **Chat log scrolling** (2026-10-24, third try): a new card shouldn't stop short of its Apply section.
- **Special Traits tab:** checkboxes 20px (Foundry's `--checkbox-size`); whether Foundry's own tick follows it.

## Verified

In Foundry, by the user:

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
