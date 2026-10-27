# Status

The current state: what the next session does, what waits on the user, what's verified. Short, one entry per thing; history lives in commits, how things work in `docs/BUILT.md`, rules in `CLAUDE.md`.

## Next session

1. **Phase 6, step 2: portrait corner chosen, E** (SCOPE §4.1, 2026-10-27; canvas rows "Portrait corner" and "E · cards to the frame's foot"). Edit-mode, HP tray and class tray boards redrawn on E (one component, `HeaderE`), rendered and checked 2026-10-27; awaiting the user's approval, then slice 1 (portrait card in play mode). The rest of the mockup awaits the user's look (canvas row "Phase 6 · edit mode and the HP tray"; decisions in SCOPE §4.9). Then build slice 3, header fields and the HP tray (user, 2026-10-27, agreed order: research, mockup, header fields and HP tray, Attributes edit, spellcasting ability and level down, styling and space pass, then Limited and Observer views if wanted). Research is done (research note, "Edit mode and lifecycle"). Styling notes from the user's screenshots (2026-10-27) wait for the styling slice: the sort button shows Foundry's orange active ring with no filter on; a blank band above the header; the empty Attributes favorites leave the right column bare; Hunter's Mark's "Additional Spells" row (Favored Enemy's free casts) shows no uses; the spell slot settings icon (`spellbook.hbs`) draws as a sun, not a gear (use the cog from the Phase 6 boards).

The Actions tab is on the backburner (user, 2026-10-26; SCOPE §4.4). Don't rerun Quench or rework Track R or Phases 0–4 unless the user reports a problem.

## Waiting on the user

In code, not yet seen in Foundry:

- **Chat log scrolling** (2026-10-24, third try). New cards stopped short by the Apply section, which dnd5e fills in after the card is placed. Folded rolls post with `scroll: false`; the player's own new card posts with `scroll: true`, and while following it (8 s, until the player scrolls, clicks or types in the log) a `ResizeObserver` scrolls again on every size change. Apply starts folded.
- **Inventory sort button** lights only when a filter or search is on (dnd5e marks it active always). The user's screenshots (2026-10-27) show an orange ring on it on every tab with nothing on: Foundry's own `.active` style, which our rule doesn't clear. Fix in the styling slice.

Play checks, when convenient (not work for a session to pick up):

- **Header:** art fits (round, square, tall); both ability emphasis settings; the milestone track with dnd5e's leveling set to no XP.
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
