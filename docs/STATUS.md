# Status

The current state: what the next session does, what waits on the user, what's verified. Short, one entry per thing; history lives in commits, how things work in `docs/BUILT.md`, rules in `CLAUDE.md`.

## Next session

1. **Phase 6: the styling pass (SCOPE §5.2) waits on the user's look in Foundry**, then the play check and closing the phase (BUILT entry, ROADMAP, ask before `main`). Done offline, 2026-10-27: no title band; the header a two-row grid (band and cards aligned); edit mode keeping play mode's geometry (every element compared, rule 6); round or square portrait; concentration's C drawn; like elements alike (rules 16–19). Limited view: skipped (user, 2026-10-27).

The Actions tab is on the backburner (user, 2026-10-26; SCOPE §4.4). Don't rerun Quench or rework Track R or Phases 0–4 unless the user reports a problem.

## Waiting on the user

In code, not yet seen in Foundry:

- **Quench "core" passes for slices 1–6** (user, 2026-10-27: "all pass"); rerun it after slice 7 (the token and framing tests changed). Each slice below still waits on play.
- **Phase 6 slice 6, level down and the main spellcasting ability** (2026-10-27): edit mode; the level tray lists Level down for each class above level 1 (dnd5e asks before undoing advancements; at level 20 the tray keeps Level down); each Spellbook casting card has a radio dot for the main spellcasting ability.
- **Phase 6 slice 5, Attributes in edit mode** (2026-10-27): each skill's dot stays play mode's, with dnd5e's proficiency cycle unseen over it (click cycles it; user's screenshots 2026-10-27: dnd5e's own drawing changed size), a slim ability dropdown and a gear; the row's text sits where play mode's does (one 24px track); the Skills heading's gear opens bonuses for every skill; each trait heading has a gear. Skill names shorten at 644px in edit mode ("Animal Han…"; the name keeps its 96px).
- **Phase 6 slice 4, framing large art** (2026-10-27): edit mode, non-token art: the Frame chip (top centre, beside the token switch); drag to pan, the strip zooms, arrows pan (Shift finer), + and − zoom, Enter is Done, Escape cancels; saved on the character with its image. In play: drag feel, and a big painting framed on its face.
- **Phase 6 slice 3, the edit-mode header** (2026-10-27): unlock the sheet; the name and scores are fields; gears beside Init, each ability, speed and HP; AC's gear and the HD chip open dnd5e's windows; a Token switch in the portrait's options tray. XP is a field in play too.
- **Phase 6 slice 2, the HP tray** (2026-10-27): play mode, a click on the HP bar opens it; type an amount, then Damage (temp first), Heal or Temp; the line under the buttons says what Damage would do. In edit mode a click on the bar still sets HP exactly (dnd5e's meter).
- **Special Traits tab** (2026-10-27): dnd5e's form in our look; checkboxes 20px (Foundry's `--checkbox-size`; unverified that Foundry's own tick follows it). Look at it in edit mode.
- **Portrait clicks** (2026-10-27): the chip layer had swallowed them; the art opens again (play: dnd5e's artwork; edit: the file picker).
- **Phase 6 slice 1, the portrait card** (2026-10-27; Quench passes, user 2026-10-27; offline checks and layout screenshots pass). In play: round token, square and tall art in the 234px frame; Temp and Max ± typed; the exhaustion dot (rest on it 1.5 s); Short and Long rest chips; a character with three or more classes.

- **Chat log scrolling** (2026-10-24, third try). New cards stopped short by the Apply section, which dnd5e fills in after the card is placed. Folded rolls post with `scroll: false`; the player's own new card posts with `scroll: true`, and while following it (8 s, until the player scrolls, clicks or types in the log) a `ResizeObserver` scrolls again on every size change. Apply starts folded.
- **List sort button** lights only when a filter or search is on (dnd5e marks it active always). Foundry's own ring on it (orange, user's screenshots 2026-10-27) is cleared too now (2026-10-27): check Inventory, Spellbook and Features with nothing filtered.
- **Slice 7 so far** (2026-10-27): the Spellbook's slot settings gear is the cog now (was a sun); a spell cast through another item (Favored Enemy's Hunter's Mark, under Additional Spells) shows that item's uses as "2 / 2", not a field.
- **Stats panels and traits panel** (2026-10-28, from the approved canvas row "Phase 6 · combat panel, abilities, traits beside the skills"): the combat panel (AC, Init, Prof, Level button with its tray) and the abilities panel (score | modifier, the modifier rolling the check; the save with its shield filled when proficient); Temp and Max ± as bars; the ability-emphasis setting retired; the traits panel at the Attributes main column's top, foldable, every trait in both modes. Quench "core": new test "folds the traits panel…". Look at: lock and unlock; a ready level-up; the traits fold; 644px.
- **Skill ability tray** (2026-10-27): in edit mode a skill's ability opens a tray of six chips (ours, both themes' contrast), marked by a small triangle under the word, not a dashed line; the native dropdown is gone. Quench "core": the skill test picks INT from the tray.
- **Slice 7, the user's next list** (2026-10-27): the window drags from a strip the sheet's full width; every speed with a value shows ("30 ft · Fly 60 ft"); the "+N" chip no longer pushes the second class's name down; skills are one row in both modes, dnd5e's way (fixed 24px cells), with every passive shown and the Passive toggle gone. Quench "core": the passive toggle step is gone from the skill test. Look at: drag the sheet by its top edge; skills lock and unlock. Open design picks (in chat): Level and proficiency's place, character traits without scrolling, a concentration mark, the traits list.
- **Slice 7, like elements** (2026-10-27, from the user's list): "HP" as large as its value; Columns, Passive, Con save, the Level pill and row subtitles in body style, no capitals; every gear 12px, AC's gear beside its label like the others (the shield no longer a button); the Skills heading one height in both modes (the reflow); a step more space above the traits; the attunement box one height in both modes; token, round and Frame in one gear chip's tray at the portrait's top (solid when on, no rings); spell level headings stay one line in edit mode at 644px (Time gives way first). Quench "core": the token and framing tests open that tray first. Look at: the portrait's top row in edit mode, the Skills heading lock and unlock, the Inventory footer lock and unlock.

Play checks, when convenient (not work for a session to pick up):

- **Header:** the milestone track with dnd5e's leveling set to no XP, from the combat panel's Level button.
- **Phase 5, not yet tried in play:** Level up and New class from the level tray into dnd5e's wizard; removing and choosing a class, species or background in edit mode; the biography editor's writing area when open; an effect switched off and on; exhaustion lowered with a right-click.

## Verified

In Foundry, by the user:

- **Phase 5 Features, Effects, Biography and header cards** (2026-10-27, Quench core and play): features by source or active and passive; effects by kind with the switch and conditions; biography fields edited in place; class, species and background cards under the abilities with Level up in the level tray; ledger rows on every list.
- **Phase 4 Spellbook** (2026-10-26, Quench core 35 of 35 and play): sections with slot pips (Pact Magic, item, ritual), the book, Can cast with slots spent, favorites and their glow, the concentration bar, filters and Columns menu, context menu and drag, Attributes favorites (innate and at will).
- **Phase 3 Inventory** (2026-10-26, Quench 30 of 30 and play): sections, equip and attune toggles, uses and quantity, expand, Columns menu, footer, search, filter and sort, pinned filters, containers (drop in, fold, nest, search inside).
- **Phase 2 Attributes, frame and tab row** (2026-10-24, Quench 26 of 26 and play): skills, passives, traits, favorites, slot pips, death saves in the header, tabs and lock.
- **Phase 1 header** (2026-10-24, screenshot and Quench): portrait chips, HP, XP and level, origin line, AC, Init and the ability row, in the dark theme with none of dnd5e's look.
- **Exhaustion penalty** (2026-10-26): skills, saves and Init show the same total at every level; nothing to fix.
- **Track R, rolls and chat cards** (2026-10-24, Quench and play): bands, late adds, saves for selected tokens, Apply, standalone rolls, GM requests, settings.

Offline:

- **Hooks** (2026-10-23): session start installs, editing a JS file lints it, `git push` is blocked until `npm run check` passes.
