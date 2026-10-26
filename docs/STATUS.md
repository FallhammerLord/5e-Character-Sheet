# Status

The current state: what the next session does, what waits on the user, what's verified. Short, one entry per thing; history lives in commits, how things work in `docs/BUILT.md`, rules in `CLAUDE.md`.

## Next session

1. **Phase 4 play check.** Quench passed (core 35 of 35, 2026-10-26) and the user approved the styling pass after first look (2026-10-26: soft-blue pips without a count, fold carets, open-row panels; SCOPE §5.1). Left: one look at a real caster, ideally multiclass with Pact Magic:
   - Can cast with slots spent;
   - spells granted by an item (staff, wand) in their own section; a ritual caster's ritual-only spells;
   - clicking slot pips;
   - dnd5e's right-click menu and drag on spell rows, and a spell dragged onto a section heading;
   - the Inventory pins (Action, Bonus, Equipped), Phase 3's last item, built with Phase 4;
   - innate or at-will favorites on Attributes.

   Then tick ROADMAP Phase 4, write its BUILT entry (from the ROADMAP list and `src/sheet/spellbook.js`), and ask the user before pushing to `main`.
2. **Then:** ask whether the Actions tab (SCOPE §4.4, no phase yet) goes before Phase 5 (Features, Effects, Biography, Journal). Either starts with dnd5e research and a mockup (CLAUDE.md, "How a phase goes").

Don't rerun Quench or rework Track R or Phases 0–3 unless the user reports a problem.

## Waiting on the user

In code, not yet seen in Foundry:

- **Chat log scrolling** (2026-10-24, third try). New cards stopped short by the Apply section, which dnd5e fills in after the card is placed. Folded rolls post with `scroll: false`; the player's own new card posts with `scroll: true`, and while following it (8 s, until the player scrolls, clicks or types in the log) a `ResizeObserver` scrolls again on every size change. Apply starts folded.
- **Inventory sort button** lights only when a filter or search is on (dnd5e marks it active always).

Play checks, when convenient (not work for a session to pick up):

- **Header:** art fits (round, square, tall); both ability emphasis settings; the milestone track with dnd5e's leveling set to no XP.

## Verified

In Foundry, by the user:

- **Phase 4 Spellbook in Quench** (2026-10-26, core 35 of 35): rows by section, the book (always prepared locked), the favorite toggle, the Prepared pin, the concentration bar, the column menu, Attributes favorites (details in place, picture uses). Play check pending (Next session).
- **Phase 3 Inventory** (2026-10-26, Quench 30 of 30 and play): sections, equip and attune toggles, uses and quantity, expand, Columns menu, footer, search, filter and sort, containers (drop in, fold, nest, search inside).
- **Phase 2 Attributes, frame and tab row** (2026-10-24, Quench 26 of 26 and play): skills, passives, traits, favorites, slot pips, death saves in the header, tabs and lock.
- **Phase 1 header** (2026-10-24, screenshot and Quench): portrait chips, HP, XP and level, origin line, AC, Init and the ability row, in the dark theme with none of dnd5e's look.
- **Exhaustion penalty** (2026-10-26): skills, saves and Init show the same total at every level; nothing to fix.
- **Track R, rolls and chat cards** (2026-10-24, Quench and play): bands, late adds, saves for selected tokens, Apply, standalone rolls, GM requests, settings.
- **Features, Effects and Biography** still show Foundry's bare defaults; expected until their phase.

Offline:

- **Hooks** (2026-10-23): session start installs, editing a JS file lints it, `git push` is blocked until `npm run check` passes.
