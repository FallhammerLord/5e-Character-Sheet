# Roadmap

Goal: Tidy 5e's classic layout, maintained, with the ADHD-friendly rules from our other projects. Tidy 14 dropped its Classic sheets, so players who love that layout have no maintained home.

Every phase ends with the user testing in their own v14 world. A phase is done when it's verified there, not when the code lands.

## Theme kit (user, 2026-11-09; before any new theme; done; verified 2026-11-09)

A new theme should be textures, marks and motion, not new plumbing. Before the kit it wasn't: no BUILT entry says how a theme plugs in, Plain and Forge each keep their own copy of the plate list (the Limited view had to be added to both, Forge's twice), particles branch per theme in `src/apps/sparks.js`, and Wind, Sand and Valley stopped at about 80 lines of tokens. The class themes parked in SCOPE §7 waited for it.

- [x] One plate class on the sheet's elements (`fhcs-plate`), so no theme lists them; Plain and Forge read it (screenshots pixel-identical before and after)
- [x] A particle registry: each theme registers its answers (inspiration gained and spent, hit, heal); the engine never changes for a new theme (`registerMoments` in `src/apps/sparks.js`; the sheet now also calls `hit` and `heal`, which no theme answers yet)
- [x] A starter theme file with every hook named (`styles/themes/_starter.css`): tokens, ground, frames, heading bands, tab row, emblem, inspiration marks, state art (`--fhcs-hp`, `data-fhcs-hp`), moments, chat card
- [x] A load check: each entry in `THEMES` has its CSS file in the manifest, its label, a layout case and an emblem; every theme file and every registered theme is in `THEMES` (seen failing on Plain's old emblem name). Layout cases now come from `THEMES`
- [x] Extended (Claude): one emblem place for every theme, in `styles/fhcs.css`; Wind, Sand and Valley's emblems had sat under the inspiration star
- [x] BUILT entry, "how a theme plugs in", with the recipe; CLAUDE.md's "How a theme goes" points to it

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
- ~~Ability emphasis, a client setting~~ retired (user, 2026-10-27; SCOPE §4.1): score and modifier share one style
- [x] Milestone track (dnd5e's leveling mode "no XP"): 20 pips filled with class images in the order gained, recorded after advancement (played 2026-11-08)
- Pinned strip on scroll: moved to Phase 7 (user, 2026-11-08)

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

Second pass, from the user's play (2026-10-28):

- [x] 5. Rows no longer drop on the lock: Foundry's control height reset on every `summary` and `select` too (the edit-mode theme chip was a `summary`); the layout check gives `summary` Foundry's height, so it can't return
- [x] 6. Status group segments one width, icons centred; exhaustion's ring hides while its chip shows
- [x] 7. Theme picker on the title bar, both modes; portrait options chip top left, solid
- [x] 8. Inspiration on the tab row, right-aligned before the lock: one star, or a bank in an item's uses as stars or a count; edit mode's gear links the item; Forge's anvil rides beside it (SCOPE §4.12; Quench test added)
- [x] 9. Window: least height at the tab row's foot; width comfort stops while dragging (644, 720, 800, 900, 1024, 1280; Quench test added)
- [x] 10. Textures as vectors (Damascus, frame grain), drawn by `tools/forge-textures.mjs`
- [x] 11. Inspiration fills from the right; banked marks glow (starlight; Forge embers); each theme its own mark (Forge's runes)
- [x] 12. Forge portrait hover heats and gleams like every frame, instead of dimming
- [x] 13. Inspiration's on and off moments, each theme its own (Forge: stamped hot, cooling off)

Third pass, from the user's play (2026-10-28):

- [x] 14. Theme picker works: a title-bar button, its tray hung from the window
- [x] 15. Inspiration in any order (the star clicked); narrow or big banks a roomy chip with a tray of stars
- [x] 16. Forge's sparks only on inspiration gain (rule: big effects answer events, never timers)
- [x] 17. Panel gleam follows the pointer (not the portrait); no texture under item entries
- [x] 18. Traits' fold bar a whole-bar button; species and background wrap (their names' height no longer fixed)
- [x] 19. Categories: custom ones (context menu "Category…", Tidy's read too) on Inventory, Spellbook and Features; up and down arrows on every tab's sections and the favorites groups; Quench test added. The item sheet's Category field comes with the item sheet
- [x] 20. Grain off every panel; inspiration's moment on the star clicked; sparks from the mark struck; five marks at every width (Special Traits to a gear on Traits)
- [x] 21. Resource panels: the name uses the linked item; − and + spend and regain; edit mode's cog in −'s place
- [x] 23. Item sheet: no lock (editable when Foundry says so), Foundry's icons for equipped and identified, resizable, room at the sides
- [x] 24. Traits as ledger rows, as the other categories; Damascus redrawn as folded steel (three steels, ladder rungs, raindrops), middle-click opens a row's sheet
- [x] 25. Design audit (2026-10-29): stemmed move arrows, the halved shield for equipped everywhere, one focus ring; the layout check holds focus, icon contrast and text over a texture (`ONLY=` for a quick run)
- [x] 26. Item sheet keeps all of dnd5e's: rarity, weight unit, currency and requirements with dnd5e's inputs; the unidentified and chat descriptions; the add button on Activities and Advancement
- [x] 28. The item sheet's tabs fill the window; the description editor follows its height
- [x] 27. From the Quench run and dnd5e's own item sheets (2026-10-29): Traits wears the groups' frame; no edit slider on the item sheet; dnd5e's info row with its gears; a class's level; full-width descriptions for classes, species and backgrounds; tables and headings in our styles
- [x] 22. From the Quench run and play (2026-10-28): item sheet unlocks (always-interactive), Special Traits gear opens, HD rolls in play, Forge one look (dark), Traits and Resources reorderable, Traits' left padding (and a check for text on a panel's edge)

## Phase 6.6: Themes (user, 2026-10-28; SCOPE §4.11)

- [x] 1. Theme layer: `data-fhcs-theme` on the sheet, `fhcs-frame` on every panel, the four themes in light and dark (colors, frames, decals, motion); layout cases per theme; mockup page for the user (built 2026-10-28; waits on the user's review of `tools/theme-mockup.mjs`'s page)
- [x] 1b. Fire and Forge as artwork, the whole sheet: every tab, edit mode, trays, fields, buttons, tips, scrollbars, light mode in polished steel (user, 2026-10-28): the window a smithy, state art from HP, plates, Grenze, moments, embers; the layout check reads text over art against black and white (`--fhcs-art`); `tools/forge-mockup.html` (built 2026-10-28; waits on the user's review). The sheet already applies a character's `flags.fhcs.theme` and its HP state.
- [x] 2. Choosing: world default setting, per-character choice from the title bar (`flags.fhcs.theme`), the player's Motion switch (built 2026-10-28; Quench test added)
- [x] 3. Chat cards in the world theme, with the setting to keep them plain (done in Phase 6.7, 2026-10-28)
- [ ] Quench and play

## Phase 6.55: Themes round 2, Plain as Day and Night (user, 2026-10-29; SCOPE §4.11)

"Bringing plain light & dark in line with subdued textures and animations." Plain becomes Day (sunlight) and Night (moonlight) with a ledger subtheme; particles are scripts. All ten agreed (user, 2026-10-29); Night is moonlight and moonbeams, never stars or sparks (SCOPE §4.11).

- [x] 1. (built 2026-10-29, `styles/themes/plain.css`, character sheet only; the item sheet and chat cards follow) Ground: ledger ruling in the window's gutters; Day lit warm from the upper left, Night cool from the upper right
- [x] 2. (built 2026-10-29) Heading bars: a double hairline (the ledger's totals rule); frames a 1px top highlight (sun or moon catching the edge)
- [x] Play notes (user, 2026-10-29): (a) the sheet stayed dark with windows set to light: fixed, the window's own mode decides, every stylesheet; (b) after a theme change the tabs sometimes vanished (user's screenshot): a real bug, fixed: Forge's sparks canvas stayed in the window and, without Forge's styles, pushed the tab body out; it now places itself and leaves when its sparks die; (d) no glint on hover (user, 2026-10-29): a real bug, fixed: kept weak in the cascade, it lost to each frame's own `background` and showed on two frames of eleven; (e) chat cards' Apply trays seemed not to follow selected and targeted tokens (user, 2026-10-29): not a bug: the tokens had no actor, and dnd5e lists only tokens with one (recorded-targets.mjs, `if ( t.actor )`); a guess first taken for the cause (trays never marked on screen) left a harmless guard, our cards marking their own trays as dnd5e's log does; (f) an item's Category never saved, Foundry refusing the form for a bad `img` (user's console, 2026-10-29): a real bug, fixed: the icon's `data-edit` sat on its button, which has no src; it now sits on the image, as in dnd5e's header, and the load check fails `data-edit` on anything but an image or video; (g) players saw attack cards with no bands, others' rolls missing entirely (user's screenshot, 2026-11-02): a real bug, fixed: dnd5e hides attack and damage buttons from all but the roller and the GM, our bands came only from visible buttons, and the roll's own message is hidden once drawn in the card; a hidden roll button now keeps its band, locked, shown once rolled; a client that can't find the activity builds the bands from the message's stored buttons; (c) favorites lacked dnd5e's item menu: fixed, the list carries dnd5e's `.favorites` (drops there favorite the item, dnd5e's way); load check added
- [x] 3. (built 2026-10-29; conditions too, and every theme uses Plain's until it brings its own; a Quench test added) Toggle moments for every toggle Plain lacks (slot pips, death saves, equip, attune, prepared, favorite, effect switch): inked in, erased
- [x] 4. (built 2026-10-29; and in every theme the fill drains or fills from where it stood) Hit and heal at the HP line (the hooks exist for every theme)
- [x] 5. (built 2026-10-29: the slide in Day and Night; tray fades and unfolds in every theme, on the player's own click only; folds don't redraw, so all unfold) Tab line slides to the new tab; trays and tips fade in with a 2px drop; section folds animate if folding doesn't redraw
- [x] 6. (built 2026-10-29: Day's glint gold, Night's silver; frames with their own art keep it) Hover: the frame's top edge catches the light where the pointer is (`--fhcs-gleam-x`); a press dips 1px
- [x] 6b. (built 2026-10-29, user's ask) The portrait catches the light on hover: a band crosses the art once, gold from the upper left in Day, silver from the upper right in Night; round portraits keep their circle; one pass from the pointer's arrival, clearing on its own and never restarted by a quick out and in (user, 2026-10-29: it lingered and replayed; Forge's gleam too)
- [x] 7b. (built 2026-10-29, user's ask) Night's marks wax and wane across the row; the moonbeam burns a mark full, a cloud wipes it away
- [x] 7c. (built 2026-10-29, user's ask) Day's banked sun burns red-orange; gained, it spins up; spent, it goes nova (flash and ring, a script). Night's marks a step dimmer
- [x] 7. (built 2026-10-29: one engine in `src/apps/sparks.js`, one shared canvas that places itself and leaves; Forge's sparks unchanged) Particles as scripts (`src/apps/sparks.js` grows into one engine with an emitter per theme): Day sun motes drifting up, Night a moonbeam falling on the mark struck, on inspiration gained
- [x] 8. (built with slice 1, 2026-10-29) State art: Night's moon wanes with HP (full, bloodied, down); Day's light lowers toward dusk
- [x] 9. (built 2026-10-29; marks in the sheet's ink, the glow gold or silver; the emblem leaves a narrow edit row, as Forge's anvil) Emblems and marks: a sun for Day, a moon for Night on the tab row; Night's inspiration mark a moon, not a star; Sand's emblem a sanctuary arch
- [x] 10. (built 2026-10-29; the check seen failing) "Theme motion" becomes "Sheet motion"; the load check fails an animation outside the reduced-motion and Motion-off gates
- [x] Mockups: canvas row "Phase 6.55 · Plain as Day and Night" (Day, Night, 644px bloodied and edit mode, down; the marks, pips, shields, tabs and HP tray click through to their moments); waits on the user's review (2026-10-29)
- [ ] Quench and play

## Play round, 2026-11-08 (user's play; asks 3 and 4 to build)

From the user's play of `main` (2026-11-08). Build one ask per slice, by CLAUDE.md's polish round; answer by number at the end.

- [x] 1. Toggle moments ease in: today the icon lights and its outline pops on at once. Effective, not smooth. Keep under 300ms (SCOPE §5.3 rule 6), every theme's toggle hooks. Built: the toggle's box (edge and ink) eases with its mark, one curve, 260ms; frames checked offline.
- [x] 2. Temp HP is a bar of its own: blue, filling as Temp over its own top, with the same hit and heal moments as HP. Today the Temp field sits empty. Damage takes Temp first, so a hit drains Temp's bar before HP's. Its top: the Temp last gained, stored on the character when Temp rises (user, 2026-11-08: "I don't mind an additional value"). Built: `flags.fhcs.tempTop` from a `preUpdateActor` hook, in the same write; Temp's moments in Plain and Forge; Quench's HP tray test checks the top and the fill.
- [x] 3. Trays and folds open and close smoothly: today they jump on fold and unfold. Covers trays, section folds and favorites groups, in every theme; closing animates as well as opening. Built: `src/apps/folds.js` animates a fold's height and a tray's fade both ways (220ms, 160ms), caret turning with them; still under Motion off and reduced motion; a reverse mid-way settles the first. Checked in a browser offline (heights mid-way, clean-up, Motion off). Play (user, 2026-11-08): trays jittery; the browser painted a tray whole for one frame before its fade began at nothing (measured offline, frame by frame). Trays now open themselves with the fade begun in that frame. Played (user, 2026-11-08: "animations are better"); Quench's click-off test waited for the close (test bug, fixed), next run to confirm.
- [x] 4. Night brighter: moonbeams and lit moons stronger; lit moons breathe (SCOPE §4.12's banked glows, slow, still under Motion off and reduced motion). The dim outlines of unlit moons stay as they are. Day unchanged. Built: the full moon #eef2fb (was #cfd6e6), its halo at 90% (was 55%), a breath of its own (`fhcs-plain-moon-breath`, 5s, 3px to 9px), a stronger flare; the moonbeam's shaft and pool near twice as bright, the pool wider. Before and after rendered offline at the breath's low and peak.
- [x] 5. Exhaustion at 0 shows its face icon (the chip's icon at 1 and up), not the empty dot.
- [x] 6. Special Traits' gear sits at the right of its bar (after the arrows).
- [x] 7. Special Traits opened in edit mode can't be closed without locking the sheet (a real bug: `CharacterSheet.js` returns to Attributes only on leaving edit mode). The gear closes it again, back to Attributes. Built: the page opens with a bar of its name and the gear, pressed; Quench's Special Traits test clicks it.
- [x] 8. Edit-mode HP band: the HP gear takes width from the number, so a large total wraps ("HP 105 / 105" on two lines; user's screenshot). HP and its total hold one line at every width; a layout case with a three-digit HP in edit mode at 644px, so it can't return. Built: the gear hangs over the art at the bar's top left, a solid chip like the portrait's; the layout check's new `oneLine` option fails wrapped text (seen failing on the old layout).
- [x] 9. Max HP overrides on the HP bar (user, 2026-11-08): a positive or negative Max HP change shows on the main bar, as a dashed break line where the unmodified maximum falls. Built: the bar spans the larger max; the dashed mark sits at the bar's top and bottom edges, off the numbers (a line through "97" broke the reading); a negative change shades the lost HP. Also: the Max ± and Temp fields cut "-20" to "-2"; they now use their whole width, and the layout check fails a number field whose value is cut (free text scrolls by design).
- [x] 10. The Traits bar's gear stands over the row gears (user, 2026-11-08: 4px left of them). Built: the bar runs to the panel's edge like its rows; the edit-mode Attributes case checks the two right edges.
- [x] 11. Quench: the effect test's favorite switch, seen on, was gone at its click (2026-11-08). Not yet known; the click now reports the row, the actor's favorites and the trap's logged writes, which also show in the console as warnings. The next run passed (user, 2026-11-08); the cause is still not known, and the trap stays.
- [x] 12. Token sizes kept through Token HUD Wildcard's image swaps: the user's guard, taken in (SCOPE §4.14). Built: `src/tokens/sizes.js`, a `preUpdateToken` hook, a world setting; unit cases. Waits on a session of play (user, 2026-11-08: checked later).
- [x] 13. The portrait's light catch rests 10 + 1d6 seconds after each catch (user, 2026-11-08: it replayed as soon as it finished). Played (user, 2026-11-08: "works properly").
- [x] 14. Inspiration's moments play out of step between players (user, 2026-11-08): the GM's local client sees them at once, remote players at uneven times. Every connected player should see a smooth moment. Research (our code, 2026-11-08): each client starts the moment when its own redraw lands, so a network's delay apart is unavoidable; two faults made it rough. Only the clicking client knew which star was clicked, so the others guessed (leftmost filled, rightmost empty) and often played it on the wrong star; and a redraw landing mid-moment replaced the stars and cut it off. Built: every client finds the star that changed between its draws; a redraw mid-moment carries it on (`--fhcs-inspire-at`, as toggles); the console says how long after the save each client drew it (`fhcs | Inspiration … ms after the save`, by Foundry's server clock). Quench's bank test spends a star from outside the sheet and checks the moment lands on it.
- [ ] Quench and play (asks 1, 2, 5–10 passed and played, 2026-11-08; 3, 4, 13 and 14 played; 12 to come)

## Phase 6.7: Every sheet (user, 2026-10-28)

"Build our styling to the other sheet styles (npc, item, spell, and the rest), as well as the chat cards." Research: docs/research/dnd5e-6.0-other-sheets.md. Decisions: SCOPE §4.13 (user, 2026-10-28).

- [x] Research: dnd5e's NPC, vehicle, group, encounter, item and container sheets, and its smaller windows
- [x] Design answers (rebuild item and NPC; reuse Inventory for the rest; skin the smaller windows; theme by owner, else world)
- [x] Item sheet decisions (SCOPE §4.13, user 2026-10-28)
- [x] Item sheet mocked up (canvas row "Phase 6.7 · the item sheet": a weapon light, a spell dark, a feature in Forge, 500px edit mode), waits on the user's review
- [x] NPC research: dnd5e 6.0.6's NPC sheet and Tidy Classic's, against our code (research note, "The NPC sheet, closer", 2026-11-09)
- [x] NPC design questions answered (SCOPE §4.13, 2026-11-09): one everything tab, the character's header with CR and legendary panels, the player's chips with inspiration, the biography's NPC fields
- [x] NPC mocked up (canvas row "Phase 6.7 · the NPC sheet": a Bandit Captain light, a lich in its lair dark, the lich at 644px in edit mode), approved 2026-11-09
- [x] Mockups for the rest (container, group and vehicle boards; the encounter and the skin built without, at the user's word)
- [x] Chat cards in the world theme (world setting "Themed chat cards", on by default); Forge's card: a riveted iron plate, Grenze title and totals, iron-edged bands that heat on hover; every card case checked in Forge; Quench test added
- [x] Item sheet (every type, spells included): header, our tab row and lock, Description with the properties column and Category; dnd5e's forms for the rest; layout cases (500–740px, Forge), unit and load checks, a Quench test (built 2026-10-28; waits on Quench and play)
- [x] NPC sheet, in slices (verified 2026-11-10: Quench and play):
  - [x] Header and tab row (2026-11-09): registered beside dnd5e's NPC sheet, not the default; CR, XP, size · type · alignment; the legendary row (pips, lair switch, edit-mode fields); the player's chips; inspiration of its own; tab row with Abilities first and Special Traits' gear. The tab bodies followed in the next slices
  - [x] Abilities tab (2026-11-09): skills, traits (gear, treasure, habitat), features by dnd5e's activation sections with NPC pins; shared Skills, Traits and Features-list partials with the character's tabs
  - [x] Inventory, Spellbook, Effects on ours; Biography with the NPC's fields (2026-11-09)
  - [x] Quench and play (user, 2026-11-10: "quench passes and styling is fine"), BUILT entry
- [ ] Container, group, encounter, vehicle
  - [x] Container research (research note "The container sheet, closer", 2026-11-10) and decisions (SCOPE §4.13, user 2026-11-10)
  - [x] Container mocked up (canvas row "Phase 6.7 · the container sheet": a backpack light, a Bag of Holding with a pouch open dark, 500px with long names), waits on the user's review
  - [x] Container sheet built (2026-11-10): our item sheet around dnd5e's `ContainerSheet`, Contents on our Inventory rows, capacity and coins, Effects always for an editor; layout cases (`container*`, 500–740px, Forge), unit, load and a Quench test
  - [ ] Container: Quench passed (2026-11-10 to 11-12); play and BUILT entry wait
  - [x] Group research (research note "The group sheet, closer", 2026-11-10) and decisions (SCOPE §4.13, user 2026-11-10)
  - [x] Group mocked up (canvas row "Phase 6.7 · the group sheet": a party of four light, its Inventory, allies and a wagon dark, 644px edit mode), waits on the user's review
  - [x] Group sheet built, in slices:
    - [x] Header and tab row (2026-11-10): registered beside dnd5e's group sheet, not the default; portrait, name, Place members and the rests, the member line, Travel (pace arrows, gear in edit mode, three speeds) and Advancement (Award, the XP pool)
    - [x] Members (2026-11-10): rows in Characters, NPCs, Vehicles; portrait, name (opens the member), HP and hit dice, AC, speed, Perception, Stealth and Survival rolling with their passives; a vehicle's travel and DT; edit mode's remove; dnd5e's `.member[data-uuid]` kept for its context menu and drops
    - [x] Inventory, Effects, Biography; Quench test (2026-11-10): the members above the list (carried, coins; drop an item on a line to give it), the container's columns, the Group / vehicle switch with the coins written to whichever shows; our Effects; Summary then Description in one column
  - [ ] Group: Quench passed (2026-11-10 to 11-12); play and BUILT entry wait
  - [x] Encounter research (research note "The encounter sheet, closer") and decisions (SCOPE §4.13, user 2026-11-10); no boards, at the user's word
  - [x] Encounter sheet built (2026-11-10): header, Members with counts and formulas, the difficulty bar, Loot, Description; resizable from 500px; unit, load and layout cases (`encounter*`, 500–740px, Forge), a Quench test
  - [ ] Encounter: Quench passed (2026-11-10 to 11-12); play and BUILT entry wait
  - [x] Vehicle research (research note "The vehicle sheet, closer") and decisions (SCOPE §4.13, user 2026-11-10)
  - [x] Vehicle mocked up (canvas row "Phase 6.7 · the vehicle sheet": a ship light, a siege wagon dark, 644px edit mode, Crew & Passengers), waits on the user's review
  - [x] Vehicle sheet built, in slices:
    - [x] Header and tab row (2026-11-12): registered beside dnd5e's, not the default, its sidebar gone; portrait, name, action pips, the line; Hull (HP field, DT, mishap), AC, Speed, Initiative and Quality when shown; the character's ability row when shown (now a shared partial); edit mode's gears and display-options tray
    - [x] Stations as the first tab (2026-11-12): Traits beside the action stations (cover, AC, DT, a weapon's rolls, HP and uses fields, crew places), the features as Inventory rows, draft animals, the add buttons
    - [x] Cargo, Crew & Passengers, Effects, Description; Quench test (2026-11-12): Cargo on our list with the cargo bar; crew and passengers as rows with counts (− field + in edit mode, dnd5e's adjustCrew), dragged between areas; our Effects; dnd5e's one description
  - [ ] Vehicle: Quench passed (2026-11-10 to 11-12); play and BUILT entry wait
- [ ] The smaller windows: a skin
  - [x] Research (research note "The smaller windows, closer") and decisions (SCOPE §4.13, user 2026-11-12)
  - [x] Built (2026-11-12): `fhcs-skin` on dnd5e's windows for documents on our sheets (`src/apps/skin.js`), the token blocks widened to it, dnd5e's and Foundry's variables re-pointed; the item sheet's dnd5e tabs too; four copied windows in the layout check (`skin-*`), unit and load checks, a Quench test
  - [ ] Quench passed (2026-11-12); play waits
- [ ] Quench and play

## Phase 7: The ADHD layer

Skills column on every tab (user, 2026-10-26): the Attributes skills column stays beside every tab, as in Tidy's current sheet (its sidebar; Classic showed skills on Attributes only, checked in Tidy v13.0.0 source). Tab bodies then lose about 240px; recheck Inventory and Spellbook rows at 644px. Optional "Now" strip: action, bonus action, reaction and movement, with spent ones dimmed until the next turn. Favorites capped at five. Panels fold; HP, AC and conditions stay pinned: the pinned strip on scroll (SCOPE §4.1, §4.5; moved here from Phase 1, user 2026-11-08). An effect that turns all incoming damage into one type (user, 2026-10-28; SCOPE §6.7).

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

## Player-side bugs (user, 2026-11-06)

"Sometimes the chat cards populate but do not show rolls; sometimes the sheet locks up and cannot be edited until close, reopen or F5. Not repeatable by the GM."

1. [x] Cards without their rolls: a card's draw is async, and a roll created meanwhile asks for a redraw that finds no card in the log yet, or two redraws race and the older one lands. Each card now records the rolls it drew (`data-fhcs-drawn`); after every draw the chat log draws a card again when it missed one, three times at most, saying so in the console (`fhcs | Card … was drawn before its latest roll arrived`). Cause found by reading dnd5e's source, not seen happen. Quench chat cards: new test. Waits on play.
2. [ ] Sheet locks up: no cause found in our code yet. Our after-render steps now can't leave the sheet half-wired (a failure logs `fhcs | The sheet's extras failed…`), and a part that fails to draw names itself and the user (`fhcs | The <part> part failed to draw…`). Waits on the user: the next time it happens, F12 console output, and whether fields look greyed, clicks do nothing, or the window won't drag.

## Mechanical parity (user, 2026-11-08; SCOPE §4.15; done, verified 2026-11-09)

What the default sheet and Tidy both do; ours must too before release. Tick when verified in a world.

1. [x] Every roll: abilities, saves, initiative, skills, death saves, hit dice, and tools from Traits (slice B; Quench core 2026-11-09)
2. [x] Item use through activities, with consumption and chat cards (play, user 2026-11-08: resources work)
3. [x] Drag and drop: in, out, reorder, containers, hotbar (play, user 2026-11-08)
4. [x] Context menus on items and effects (play, user 2026-11-08: right-click works)
5. [x] Spell slots, pact slots, prepared spells, concentration (Quench core; pact slots in play, user 2026-11-08)
6. [x] Temp HP, max HP override, hit dice (Quench core; override in play, user 2026-11-08)
7. [x] Conditions and exhaustion (Quench core, play)
8. [x] Encumbrance and currency (slice C; Quench core 2026-11-09)
9. [x] Short and long rest dialogs (Quench core, play)
10. [x] Advancement on level-up (Quench core, play)
11. [x] Favorites (Quench core, play)
12. [x] Limited and Observer views (slices D, E; Quench 2026-11-09; played 2026-11-09)
13. [x] Every activity type on our chat card (user, 2026-11-09: Infuse Item showed nothing; slice G)

Slices:

- [x] A. The map (2026-11-08)
- [x] B. Tools roll from the Traits panel (built 2026-11-08; Quench core "rolls a tool from the Traits panel"): each tool pill carries dnd5e's `roll` action (`rollable`, `data-type="tool"`, the tool's `data-key`), so dnd5e's `rollToolCheck` runs. Fixture case, Quench click test
- [x] C. Encumbrance and currency (test written 2026-11-08, Quench core "saves coins typed…"): Quench test that edits a coin and checks the carried bar against dnd5e's `attributes.encumbrance`; then play
- [x] D. Limited view in our frame (built 2026-11-08; Quench core "shows a Limited viewer…"): our templates for dnd5e's two limited parts, the public biography added; layout cases `limited*`. The layout screenshots stood in for a canvas board (the user asked for the whole track in one go)
- [x] E. Observer view (built 2026-11-08; Quench core "lets an Observer fold…"): view-only controls stay live (`VIEW_ACTIONS`), everything else off as dnd5e has it
- [x] G. Activity types (2026-11-09; SCOPE §6.8, chat research note): surveyed all 13; Enchant's tray was the only miss, now in an Enchant section. Quench chat "gives an Enchant activity's tray its place…"; layout `card-enchant-*`
- [x] H. Favorites drag from Attributes (user, 2026-11-09; SCOPE §4.15): item and effect favorites carry dnd5e's `draggable`. Quench core "drags an item favorite from Attributes…"; played 2026-11-09 ("works as advertised")
- [x] F. Quench (passed 2026-11-09), then play as a player account (Limited and Observer, 2026-11-09) (Limited and Observer need a real non-owner; Quench runs as GM)
