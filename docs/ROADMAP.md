# Roadmap

Goal: Tidy 5e's classic layout, maintained, with the ADHD-friendly rules from our other projects. Tidy 14 dropped its Classic sheets, so players who love that layout have no maintained home.

Every phase ends with the user testing in their own v14 world. A phase is done when it's verified there, not when the code lands.

## Phase 0: Foundations (done in code 2026-10-23; Quench run waits on the user)

- [x] Module scaffold: manifest, sheet registered beside dnd5e's (not the default), `compat.js`, load check with dnd5e mocked
- [x] Claude Code hooks: install on session start, lint on edit, check before push
- [x] CI: `npm run check` on push
- [x] Layout spec from Tidy Classic's screenshots and source → `docs/SCOPE.md` §4
- [x] Finish `docs/research/dnd5e-6.0-sheet.md`: context data, listeners, favorites
- [x] Read Tidy Classic's source: it rebuilds mechanics on `ActorSheetV2`; we extend dnd5e instead
- [x] Layout check (Playwright, four widths, fails on overflow, self-tests each run); CI runs it
- [x] Quench in-world tests: opens as ours, keeps every dnd5e action, ability roll, long rest, item use (clicks stop at dnd5e's pre-hooks)

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

## Track R: Rolls and chat cards (before Phase 1)

Runs alongside the sheet phases; works whatever sheet a player uses (client setting, on by default). Built on dnd5e's `dnd5e.renderChatMessage` hook and its roll hooks, never replacing its roll pipeline. SCOPE §6.

- [ ] Clear chat cards
  - [ ] Outcome first: who · what · total, success or failure in words vs a known DC, natural 1 and 20 in words, hits and misses (in code 2026-10-23; waits on the user)
  - [ ] Labelled buttons at least 24px, tags folded
  - [ ] Rolls in a row from one speaker grouped
- [ ] Late advantage and disadvantage on d20 cards (the one new mechanic; SCOPE §6.2)
- [ ] dnd5e's own Roll damage, Roll save and Apply buttons: labelled, at least 24px, target trays open with "selected" or "targeted" in words
- [ ] No held keys, no roll pop-ups (SCOPE §6.4): roll dialogs skipped, damage and saves land on the card that asked; dnd5e's spellcasting and activity chooser windows stay
- [ ] Late bonuses on the card: a flat number or a die roll added to any roll, shown as its own term
- [ ] Compatibility: step aside cleanly when RSReforged is active

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
