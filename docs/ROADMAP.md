# Roadmap

Goal: Tidy 5e's classic layout, maintained, with the ADHD-friendly rules from our other projects. Tidy 14 dropped its Classic sheets, so players who love that layout have no maintained home.

Every phase ends with the user testing in their own v14 world. A phase is done when it's verified there, not when the code lands.

## Phase 0: Foundations (done; Quench verified 2026-10-24)

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

- [x] Mockup approved (2026-10-24): https://claude.ai/artifact/PfrTrdDsbn3Wx7DCa2HDEf
- [x] Header part: portrait 160 × up to 240 with corner chips (exhaustion, inspiration, rest, hit dice); HP with dnd5e's click-to-edit meter, Temp; name, XP or the milestone track, level; class, origin, speed, proficiency; AC, Init and abilities in one row (verified 2026-10-24)
- [ ] Ability emphasis, a client setting: modifier large (default) or score large (in code 2026-10-24)
- [ ] Milestone track (dnd5e's leveling mode "no XP"): 20 pips filled with class images in the order gained, recorded after advancement (in code 2026-10-24)
- [ ] Pinned strip on scroll (SCOPE §4.5)

## Phase 2: Attributes tab

Classic layout: skills and saves column; resources; favorites; traits (senses, languages, proficiencies, resistances).

- [x] Our own frame: dnd5e's look classes removed, sidebar dropped, tab row across the top with the lock (verified 2026-10-24)
- [x] Attributes tab: skills with proficiency marks and the passive toggle, traits, favorites grouped and folding, resources, slot pips (verified 2026-10-24, screenshot and Quench)
- [x] Death saves in the header at 0 HP (verified 2026-10-24, Quench)
- [x] Mockup approved with answers (2026-10-24): half proficiency mark, passive toggle, folding favorite groups; death saves move to the header (shown at 0 HP)

## Phase 3: Inventory

Built on dnd5e's `dnd5e-inventory` element. Equip, attune, quantity, weight and encumbrance, containers, currency, drag and drop, context menus. Verified 2026-10-26 (Quench 30 of 30, and the user in play).

- [x] Mockup approved with answers (2026-10-26): player-chosen columns, three-state attunement, encumbrance follows dnd5e's setting (SCOPE §4.6)
- [x] Shared list controls (search, filter, sort), styled once for Inventory, Spellbook and Features (verified 2026-10-26)
- [x] Item rows: equip and attune toggles, uses, usage, quantity, expand, edit and delete in edit mode; context menus and drag from dnd5e (verified 2026-10-26)
- [x] Column menu in edit mode, each player's choice (verified 2026-10-26)
- [x] Attunement, currency and carried-weight footer (verified 2026-10-26)
- [x] Pinned filter buttons beside the search (Action, Bonus, Equipped), as in the mockup, shared with the Spellbook (verified 2026-10-26)
- [x] Containers: drop onto a container row, contents folding open under it, nested (verified 2026-10-26; no top panel, user's choice)

## Phase 4: Spellbook (done; verified 2026-10-26)

Slots as pips; prepared state; grouped by level; concentration; spellcasting ability and DC. Decisions: SCOPE §4.7.

- [x] Research: dnd5e 6.0.6 spellbook data, preparation, filters, concentration; Tidy Classic's filters (2026-10-26, research note)
- [x] Answers on unprepared spells, preparation math, columns, filters (user, 2026-10-26)
- [x] Mockup approved (user, 2026-10-26: "the rest looks good"; https://claude.ai/artifact/PfrTrdDsbn3Wx7DCa2HDEf, Spellbook boards)
Built 2026-10-26; verified in Quench (core 35 of 35) and in play (user, 2026-10-26):

- [x] Attributes favorites: the home tab's look (book and kind colors; innate and at will tinted and named); the name opens the item's details in place, the picture uses it (user, 2026-10-26)
- [x] Spellcasting strip: a card per class (ability, attack, DC, prepared / max); concentration bar with open, End and Con save
- [x] Sections in the mockup's order with slot pips (filled = left, temporary dotted); Pact Magic, innate, at will, ritual and item sections; slot settings in edit mode
- [x] Spell rows: three-state book, components, time in words, range, concentration mark (filled while held), favorite toggle and glow; Columns menu (school and target off by default)
- [x] Favorite toggle column on Inventory rows too, with the glow (user, 2026-10-26); names left-aligned (Foundry centered them)
- [x] Filters: pinned Action, Bonus, Reaction, Conc., Prepared; Can cast and V, S, M added to dnd5e's menu

## Phase 5: Features, Effects, Biography (done; verified 2026-10-27)

Journal dropped (user, 2026-10-26; SCOPE §4.8).

- [x] Research: dnd5e 6.0.6 features, effects and biography parts; Tidy Classic's four tabs and its Journal (2026-10-26, research note)
- [x] Design answers: grouping, class cards, columns, effects and conditions, biography, data carried over, no Journal (user, 2026-10-26; SCOPE §4.8)
- [x] Mockup approved (user, 2026-10-26: "should be good"; canvas rows Features, Effects, Biography; header cards row approved 2026-10-26)
- [x] First look (user, 2026-10-26) and its fixes: cards alike with the art as an underlay and a remove in edit mode; effects keep their place when switched; every biography field edits in place; ledger rows on every list
- [x] First play round (user, 2026-10-27) and its fixes: header line size and speed; biography editing room; summary tags spaced

Verified in Quench (core, user, 2026-10-27) and play (user, 2026-10-27, "looks good"):

- [x] 5a Features: features by source or active and passive (dnd5e's grouping, named in words); Uses, Usage, Recovery, favorite; Columns menu; pins Action, Bonus, Reaction
- [x] 5b Effects: Temporary and Passive by kind (a switched-off effect stays put), Unavailable when any, on dnd5e's effects element, with Source, Duration, the on/off switch (a concentration shows its C) and the favorite bookmark; edit and delete in edit mode; the conditions grid (exhaustion counts up on a click, down on a right-click)
- [x] 5c Biography: characteristics, the five text boxes and the biography from dnd5e's fields, each editable where it stands
- [x] 5d Header cards: class, species and background cards under the abilities on their grid (dashed Choose for what's missing; remove in edit mode); Level up in the level pill's tray, per class or a new class, in XP and milestone mode

## Phase 6: Edit mode and lifecycle (done; verified 2026-10-28)

Edit mode for every field; advancement and level-up; short and long rest; death saves; transformation. Asked for by the user (2026-10-26): editable name, ability scores, AC and portrait (behind the lock); an HP calculator (Damage, Heal, Temp; damage takes temp first) opening from the HP number.

Already in place before the phase: portrait picker (edit mode), rests, death saves, Level up, transformation's Revert (dnd5e's ⋮ window control). Order agreed with the user (2026-10-27):

- [x] Research dnd5e 6.0.6 edit mode (research note, "Edit mode and lifecycle", 2026-10-27)
- [x] Design questions and mockup (SCOPE §4.1, §4.9; canvas rows "Phase 6 · portrait card (E)", "Portrait corner", "E · cards to the frame's foot"; approved by the user, 2026-10-27)
- [x] 1. Portrait card in play mode: one frame height, HP band with Temp and Max ±, Short and Long rest chips, HD chip, exhaustion dot; cards to the frame's foot; two class cards and the class tray (Quench passes, user 2026-10-27; play passes, user 2026-10-28)
- [x] 2. HP tray from the HP bar: Damage, Heal, Temp (Quench passes, user 2026-10-27; play passes, user 2026-10-28). Checked in dnd5e: healing from 0 clears death saves itself; an effect on tempmax isn't locked, so Max ± shows the player's value and the bar the total
- [x] 3. Edit-mode header: name, XP, ability scores, AC window, gears for Init, speed, HP and hit dice, Token switch (Quench passes, user 2026-10-27; play passes, user 2026-10-28)
- [x] 4. Framing large art: zoom, pan, arrow keys (`flags.fhcs.portrait`, keyed by the image) (Quench passes, user 2026-10-27; play passes, user 2026-10-28)
- [x] 5. Attributes in edit mode: skill proficiency and ability, trait and sense gears (Quench passes, user 2026-10-27; play passes, user 2026-10-28)
- [x] 6. Spellcasting ability; level down (Quench passes, user 2026-10-27; play passes, user 2026-10-28)
- [x] Special Traits tab in our look: dnd5e's form, name and control on a line, hint under (user's screenshot, 2026-10-27; play passes, user 2026-10-28)
- [x] 7. Styling and space pass, by SCOPE §5.2 (user, 2026-10-27): sort ring, slot gear, Additional Spells uses, title band, two-row header, mode parity, round or square portrait, drawn C, like elements alike (rules 16–19, every element compared across modes), skill rows on dnd5e's model, the combat and abilities panels and the traits panel, the title bar and status group, resources, one chip look, spacing 4 or 8 (2026-10-28); play passes, user 2026-10-28
- ~~Limited and Observer views~~ skipped (user, 2026-10-27): Observers get our sheet read-only; Limited keeps dnd5e's small layout

## Phase 6.5: Polish

From the user's screenshot after Phase 6 (2026-10-28). Decisions: SCOPE §4.10.

- [x] Research: dnd5e has no section folding (ours, as favorites groups); an effect favorite's subtitle is its duration's label whenever `remaining` is truthy; item uses change through `system.uses.spent`, recovery periods in `CONFIG.DND5E.limitedUsePeriods`
- [x] 1. Portrait art to the frame's foot, HP, Temp and Max ± on a scrim; class cards split class | subclass art, level ring, name in display; milestone tray without its key; effect favorites without "None"
- [x] 2. Resources: three panels in a row; only set ones in play; link an item from the cog in edit mode; Restore
- [x] 3. Sections fold on Inventory, Spellbook, Features and Effects (the caret in the picture column; a search shows matches through CSS on dnd5e's search field)
- [x] 4. Chat cards: each damage type its own total; a record on the card of what Apply did (SCOPE §6.7)
- [ ] Quench and play

## Phase 6.6: Themes (user, 2026-10-28; SCOPE §4.11)

- [ ] 1. Theme layer: `data-fhcs-theme` on the sheet, `fhcs-frame` on every panel, the four themes in light and dark (colors, frames, decals, motion); layout cases per theme; mockup page for the user (built 2026-10-28; waits on the user's review of `tools/theme-mockup.mjs`'s page)
- [ ] 2. Choosing: world default setting, per-character choice in edit mode (`flags.fhcs.theme`), the player's Motion switch
- [ ] 3. Chat cards in the world theme, with the setting to keep them plain
- [ ] Quench and play

## Phase 7: The ADHD layer

Skills column on every tab (user, 2026-10-26): the Attributes skills column stays beside every tab, as in Tidy's current sheet (its sidebar; Classic showed skills on Attributes only, checked in Tidy v13.0.0 source). Tab bodies then lose about 240px; recheck Inventory and Spellbook rows at 644px. Optional "Now" strip: action, bonus action, reaction and movement, with spent ones dimmed until the next turn. Favorites capped at five. Panels fold; HP, AC and conditions stay pinned. An effect that turns all incoming damage into one type (user, 2026-10-28; SCOPE §6.7).

## Phase 8: Themes, compatibility, release

Themes shared with the quest log. Compatibility with modules that change the sheet (Midi-QOL, DAE). Screenshots, GitHub release.

## Track R: Rolls and chat cards (done; verified 2026-10-24)

Done and verified in play (2026-10-24). Runs alongside the sheet phases; works whatever sheet a player uses (client setting, on by default). Built on dnd5e's `dnd5e.renderChatMessage` hook and its roll hooks, never replacing its roll pipeline. SCOPE §6.

- ~~Outcome line on dnd5e's cards~~ (2026-10-23): built, then superseded by the one-card design (SCOPE §6.5); its wording code feeds the bands
- [x] Mockup of the one card (attack with a rider save, Fireball, skill check, GM request, d20 row states) approved by the user (2026-10-23, "serviceable for now")
- [x] Card frame on usage cards: portrait, title, folding description, dnd5e's buttons as full-width bands (verified 2026-10-24)
- [x] d20 band: attack rolls drawn in the card, two d20s, natural and hit or miss in words, dice math on click (verified 2026-10-24)
- [x] Damage band: drawn in the card, crits double without asking, dice math on click (verified 2026-10-24)
- [x] Save / check band: roll for selected tokens, one row per token with its result in words (verified 2026-10-24)
- [x] Apply: dnd5e's damage and effect trays in "selected" mode, labelled, at least 24px (verified 2026-10-24)
- [x] Settings: roll attack on use, roll damage on use (verified 2026-10-24); always two d20s removed 2026-10-28 (SCOPE §6.6)
- [x] No roll pop-ups (SCOPE §6.4): roll dialogs skipped; dnd5e's spellcasting and activity chooser windows stay (verified 2026-10-24)
- [x] Late adds: advantage, disadvantage, + bonus (a number or a die) on any roll, shown as its own term (verified 2026-10-24)
- [x] Standalone rolls (sheet checks, saves, death saves, GM requests) in the same frame (verified 2026-10-24)
- ~~Compatibility: step aside when RSReforged is active~~ dropped (user, 2026-10-24): this replaces Ready Set Roll at the table; no RSR alongside it

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
