# Status

The current state: what the next session does, what waits on the user, what's verified. Short, one entry per thing; history lives in commits, how things work in `docs/BUILT.md`, rules in `CLAUDE.md`.

## Next session

1. **Phase 5 in Quench and play** (user). Built: Features, Effects, Biography, the first-look fixes (2026-10-26) and the header cards with the level tray (2026-10-27). Ask for a Quench run (core gains five tests), then a look at a real character: a multiclass with a subclass due; the cards under the abilities at 644px and wider; Level up from the level pill (each class, New class) into dnd5e's wizard; removing and choosing a background in edit mode; the By source switch; an effect switched off and on (it stays put); a condition and exhaustion (right-click lowers it); writing in the biography with the sheet locked; the ledger rows on Inventory and Spellbook too.
2. **Then:** fix what play finds (expect one styling pass), tick ROADMAP Phase 5, write its BUILT entry, ask before pushing to `main`.

The Actions tab is on the backburner (user, 2026-10-26; SCOPE §4.4). Don't rerun Quench or rework Track R or Phases 0–4 unless the user reports a problem.

## Waiting on the user

In code, not yet seen in Foundry:

- **Phase 5a Features tab** (2026-10-26): offline checks pass (load, unit, layout; screenshots checked). Quench has a new core test (grouping, use and favorite).
- **Phase 5d header cards and level tray** (2026-10-27): offline checks pass (screenshots checked at 644, 740, 900). Quench has a new core test (the card, Level up from the tray, Choose and New class).
- **Phase 5b Effects tab** (2026-10-26): offline checks pass (screenshots checked). Quench has one new core test (switch, favorite, a condition). The layout check now fails when a short fixed word (a condition, a card label, a class name) is cut short.
- **Phase 5c Biography tab** (2026-10-26): offline checks pass (screenshots checked; the editor itself only renders in Foundry). Quench has one new core test (read in play, write in edit mode).

- **Chat log scrolling** (2026-10-24, third try). New cards stopped short by the Apply section, which dnd5e fills in after the card is placed. Folded rolls post with `scroll: false`; the player's own new card posts with `scroll: true`, and while following it (8 s, until the player scrolls, clicks or types in the log) a `ResizeObserver` scrolls again on every size change. Apply starts folded.
- **Inventory sort button** lights only when a filter or search is on (dnd5e marks it active always).

Play checks, when convenient (not work for a session to pick up):

- **Header:** art fits (round, square, tall); both ability emphasis settings; the milestone track with dnd5e's leveling set to no XP.

## Verified

In Foundry, by the user:

- **Phase 4 Spellbook** (2026-10-26, Quench core 35 of 35 and play): sections with slot pips (Pact Magic, item, ritual), the book, Can cast with slots spent, favorites and their glow, the concentration bar, filters and Columns menu, context menu and drag, Attributes favorites (innate and at will).
- **Phase 3 Inventory** (2026-10-26, Quench 30 of 30 and play): sections, equip and attune toggles, uses and quantity, expand, Columns menu, footer, search, filter and sort, pinned filters, containers (drop in, fold, nest, search inside).
- **Phase 2 Attributes, frame and tab row** (2026-10-24, Quench 26 of 26 and play): skills, passives, traits, favorites, slot pips, death saves in the header, tabs and lock.
- **Phase 1 header** (2026-10-24, screenshot and Quench): portrait chips, HP, XP and level, origin line, AC, Init and the ability row, in the dark theme with none of dnd5e's look.
- **Exhaustion penalty** (2026-10-26): skills, saves and Init show the same total at every level; nothing to fix.
- **Track R, rolls and chat cards** (2026-10-24, Quench and play): bands, late adds, saves for selected tokens, Apply, standalone rolls, GM requests, settings.
- **Features, Effects and Biography** still show Foundry's bare defaults; expected until their phase.

Offline:

- **Hooks** (2026-10-23): session start installs, editing a JS file lints it, `git push` is blocked until `npm run check` passes.
