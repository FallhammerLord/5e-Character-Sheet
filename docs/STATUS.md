# Status

The current state: what the next session does, what waits on the user, what's verified. Short, one entry per thing; history lives in commits, how things work in `docs/BUILT.md`, rules in `CLAUDE.md`.

## Next session

1. **Ask the user** whether to push the branch to `main` (Phase 4 done), then whether the Actions tab (SCOPE §4.4, no phase yet) goes before Phase 5 (Features, Effects, Biography, Journal). Recommended: Actions first, since it's the default tab in play and the "Now" home (§4.5).
2. **Then start that phase at research** (CLAUDE.md, "How a phase goes"): dnd5e 6.0.6's source for the tab, Tidy Classic's version, findings into the research note; then design questions and a mockup. Phase 5 has no checklist or SCOPE section yet; Actions has only §4.4.

Don't rerun Quench or rework Track R or Phases 0–4 unless the user reports a problem.

## Waiting on the user

In code, not yet seen in Foundry:

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
