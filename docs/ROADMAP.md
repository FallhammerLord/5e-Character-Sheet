# Roadmap

Goal: Tidy 5e's classic layout, maintained, with the ADHD-friendly rules from our other projects. Tidy 14 dropped its Classic sheets, so players who love that layout have no maintained home.

Every phase ends with the user testing in their own v14 world. A phase is done when it's verified there, not when the code lands.

## Phase 0: Foundations (in progress)

- [x] Module scaffold: manifest, sheet registered beside dnd5e's (not the default), `compat.js`, load check with dnd5e mocked
- [x] Claude Code hooks: install on session start, lint on edit, check before push
- [x] CI: `npm run check` on push
- [x] Layout spec from Tidy Classic's screenshots and source → `docs/SCOPE.md` §4
- [ ] Finish `docs/research/dnd5e-6.0-sheet.md`: context data, listeners, favorites
- [x] Read Tidy Classic's source: it rebuilds mechanics on `ActorSheetV2`; we extend dnd5e instead
- [ ] Layout check (Playwright, many widths, fails on overflow), as in the quest log
- [ ] Quench in-world tests: open, roll, use an item, rest, on a temporary actor

## Phase 1: Header and abilities (read-only)

Portrait, name, class and level, HP and temp HP, AC, initiative, speed, proficiency, inspiration, exhaustion, ability row with saves. Every roll works. Play mode only.

## Phase 2: Attributes tab

Classic layout: skills and saves column; resources; favorites; traits (senses, languages, proficiencies, resistances).

## Phase 3: Inventory

Built on dnd5e's `dnd5e-inventory` element. Equip, attune, quantity, weight and encumbrance, containers, currency, drag and drop, context menus.

## Phase 4: Spellbook

Slots as pips; prepared state; grouped by level; concentration; spellcasting ability and DC.

## Phase 5: Features, Effects, Biography, Journal

## Phase 6: Edit mode and lifecycle

Edit mode for every field; advancement and level-up; short and long rest; death saves; transformation.

## Phase 7: The ADHD layer

Optional "Now" strip: action, bonus action, reaction and movement, with spent ones dimmed until the next turn. Favorites capped at five. Panels fold; HP, AC and conditions stay pinned.

## Phase 8: Themes, compatibility, release

Themes shared with the quest log. Compatibility with modules that change the sheet (Midi-QOL, DAE). Screenshots, GitHub release.

## Mechanical parity checklist

What the default sheet and Tidy both do; ours must too before release. Tick when verified in a world.

- [ ] Every roll: abilities, saves, skills, tools, initiative, death saves, hit dice
- [ ] Item use through activities, with consumption and chat cards
- [ ] Drag and drop: items in, items out, reorder, containers, onto the hotbar
- [ ] Context menus on items and effects
- [ ] Spell slots, pact slots, prepared spells, concentration
- [ ] Temp HP, max HP override, hit dice
- [ ] Conditions and exhaustion
- [ ] Encumbrance and currency
- [ ] Short and long rest dialogs
- [ ] Advancement on level-up
- [ ] Favorites
- [ ] Limited and Observer permission views
