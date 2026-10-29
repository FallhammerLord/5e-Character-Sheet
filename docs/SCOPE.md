# Scope

The design and every decision, with who decided and when. What's built and verified lives in `docs/STATUS.md` and `docs/ROADMAP.md`; how it works, in `docs/BUILT.md`. A superseded decision is replaced in place, not kept beside the new one.

## 1. What this is

A Foundry VTT v14 module (ID `fhcs`, CSS prefix `fhcs-`) adding a character sheet for dnd5e 6.x. It extends dnd5e's own sheet class: the system keeps doing every mechanic; we own layout, templates and styles.

## 2. Who it's for

The user's table: players used to Tidy 5e's classic layout. Private use for now (user, 2026-10-24); a public release is not planned.

## 3. Decisions

- **Extend, don't rebuild** (2026-10-22): subclass `CharacterActorSheet`; reuse dnd5e's custom elements (`dnd5e-inventory` and others) where they fit.
- **Characters only** to start; NPCs and vehicles keep dnd5e's sheets.
- **Offered beside dnd5e's sheet**, never forced as the default.
- **Replaces Ready Set Roll; private use for now** (user, 2026-10-24): no compatibility layer for RSR or its forks; the module is for the user's table, public release later if ever.
- **Track R (rolls and chat cards) went first** (2026-10-23, user deferred to our call): it's used by every player and the GM every session whatever sheet they use, and it ends the table's reliance on an experimental Ready Set Roll fork. Done and verified 2026-10-24; the sheet phases lead from here, in ROADMAP order.

## 4. Layout

Target: Tidy 5e Classic, as in `docs/reference/` (screenshots) and its source at Tidy commit `54fdbad4` (the last before Classic was removed, 2026-09-01; tag `v13.0.0` has it too; `src/sheets/classic/`). Default window 740 × 810; minimum 644 wide. Never shorter than the tab row's foot, so the tabs always show; dragging the width holds for a moment (within 12px) at 644, 720 (where the inspiration stars show), 800, 900, 1024 and 1280 (user, 2026-10-28: comfort stops at common breakpoints; the stops Claude's).

**Skeleton, our style** (user, 2026-10-24): every part sits where Classic puts it, so muscle memory carries over; type, spacing, contrast and controls follow our rules (§5, CLAUDE.md). Everything visual goes through tokens, so themes beyond light and dark can follow the first working sheet.

### 4.1 Header

- **Portrait** (round, about 150px) down the left edge. Nothing on it in play: inspiration moved to the tab row (user, 2026-10-28, §4.12); exhaustion, Short and Long rest and hit dice moved to the name row (user, 2026-10-28, so the art shows). Under it, dnd5e's portrait card made compact (user, 2026-10-27: "clean presentation, just too large and spread out"): an HP meter, 32px, with "HP 87 / 87" inside the bar; then Temp and Max ±, each a bar like HP's with its word and field inside (user, 2026-10-27). The bars' fills are light tints that keep ink text at 4.5:1. In edit mode the HP meter gets a gear at its left (dnd5e's HP window) and HP's current value becomes a field inside the bar; the portrait gets one gear chip at its top left, solid ink so it shows on any art (user, 2026-10-28: the outlined chip at top centre was too light to notice), the portrait's options: its tray holds the Token switch (dnd5e's `flags.dnd5e.showTokenPortrait`), Round and Frame (user, 2026-10-27: separate chips crowded the top row and their "on" rings made them look larger than the rest).
- **Beside it, in rows:**
  1. Name (large small caps); on the right: XP bar with current / next, level badge, ⋮ menu.
  2. Classes and subclasses ("Cleric 12 Life Domain").
  3. Origin line: size • creature type • species • background • alignment; on the right: Proficiency bonus.
  4. Speed.
  5. The stats row (user, 2026-10-27, replacing AC, Init and the ability columns side by side): the **combat panel** (AC's shield, Init, Prof on the abilities' lines, a full-width Level button under them; the Level pill left the name row) and the **abilities panel**, both on the fill underlay with an edge. Each ability: its label, then score | modifier in one split box (the modifier is the check's roll button), then the save button, a shield filled when proficient and outlined when not, with the save bonus. The row of small numbers is gone. Score, modifier and save are body style; display stays for AC, Init and Prof (user, 2026-10-27: display was cramped at 644px, and there was no width to give).

Header decisions (user, 2026-10-24; mockup https://claude.ai/artifact/PfrTrdDsbn3Wx7DCa2HDEf):
- **Portrait card, one height for every art shape** (user, 2026-10-27, layout E of six on the canvas, replacing "160 wide, up to 240 tall, the header grows"): a 160 × 234 frame; the art fills it (cover), a round token sits whole at the top; HP, Temp and Max ± sit on a band over the frame's foot. The header keeps one height for every character.
- **Framing large art** (user, 2026-10-27: not every tall portrait has its subject at the top): in edit mode Frame (in the portrait's options tray, top centre) enters positioning; the other chips hide, the player drags the art, a strip at the top zooms (100–300%), Reset and Done take the bottom corners. Saved per character in `flags.fhcs.portrait` (focus x and y as percents of the art, zoom), drawn as the art's size and position; every viewer sees the same framing. Round tokens have nothing to position.
- **Origin cards reach the portrait card's foot** (user, 2026-10-27): the right column stretches to the frame's height and the cards take the spare height, so the class card gives its subclass its own line at every width.
- **Two class cards at most** (user, 2026-10-27): one class takes 4 of the grid's 8 columns, two or more show the two highest-level classes at 2 columns each. With three or more, a small "+N" chip in the second class card's corner (inside the card; nothing moves) opens the class tray: every further class as a dense row (name and level, which opens the item; subclass, or a dashed Subclass to choose; × in edit mode). The level tray still lists every class for Level up and Level down. Icons-only cards were weighed and dropped: class art is often generic, and a picture alone carries no word. In edit mode a card's × sits in its label line (beside "Class", with the "+N" chip), so the name keeps its line; a subclass keeps its own × beside it and is the one thing that shortens at 644px with two classes.
- **The status group** (user, 2026-10-28, replacing the corner chips except inspiration): one joined bar on the panels' underlay (the fill, an edge, ink marks) at the name row's right end, under the title bar's ×, its segments one width with their icons centred (user, 2026-10-28: "icons evenly spread"), a 1px divider between: exhaustion (at 0 a small ring; resting on it 1.5 s, focusing it or clicking shows the chip and hides the ring, so the two never draw over each other; above 0 the chip with its number; its tray of levels opens from the bar's right edge), Short rest and Long rest (one click each into dnd5e's rest dialog), hit dice ("HD 12"; in play a click rolls a hit die, dnd5e's first class with one left, no dialog, user 2026-10-28; in edit mode a gear and dnd5e's hit dice window). Inspiration is on the tab row (§4.12). The name gives way first: at 644px about 280px; resting on a cut name shows it whole (the tip shows only when the name is cut).
- ~~Ability emphasis, a per-player choice~~ retired (user, 2026-10-27): score and modifier now sit side by side in one style, so there is nothing to emphasise.
- **Leveling follows dnd5e's `levelingMode` world setting** (the GM's choice; we add no setting of our own). XP modes show the usual XP bar. Milestone mode (`noxp`) puts a Level button where the bar was; it folds out a tray of 20 pips (4 rows of 5). Each class level fills the next pip with that class's icon, in the order the levels were gained; empty pips show levels not reached. A pip fills when the player levels up through dnd5e, after its advancement finishes. Nothing to add by hand.
  - dnd5e stores levels per class, not their order, so we record the order in an actor flag after each advancement (`dnd5e.advancementManagerComplete`); characters from before that fill class by class, original class first. Icons: the class item's own image, so any source's classes work.
- **Pinned strip** when scrolled (§4.5): portrait thumbnail, name, HP and bar, AC, conditions, inspiration.
- **The stats row never wraps** (user, 2026-10-24; panels 2026-10-27): the combat panel (125px) and the abilities panel stay in one row; ability columns are 48px at the least, and the sheet stops shrinking at the width the row and the cards need (644px with six abilities; `headerMinWidth`). Text sizes stay the three styles; only the columns scale.
- **Class, species and background cards under the abilities** (user, 2026-10-26; mockup row "Phase 5 · origin cards in the header"): moved from the Features tab into the blank space under the ability row, on that row's columns (the combat panel's, then one per ability) so their outer edges meet the panels'. Species and background span 2 ability columns each; one class takes the rest (the combat panel's and two abilities'); two split them, the first on the combat panel's column (user, 2026-10-27). The header's class line goes, and the small line keeps only size and speed (user, 2026-10-27: type was redundant, alignment lives on the Biography). At 644px with two classes a subclass drops to its own line. Card details: §4.8.
- **Level up in the level pill's tray** (user, 2026-10-26), in XP and milestone mode: one button per class (dnd5e's level-up wizard) and New class (dnd5e's class browser; adding the class runs its wizard). In XP mode the pill turns solid with an up arrow once the XP is reached.
- Saves show as a proficiency shield and the bonus, without the word "Save": at the default width a column is about 62px, too narrow for "Save +10". The button's tooltip and label name it.

### 4.2 Tabs

A tab row across the top, under the header, in Classic's order: Attributes, Inventory, Spellbook, Features, Effects, Biography (Bastion when the character has one; no Journal, §4.8). Special Traits, dnd5e's settings page, is off the row: in edit mode a gear on the Traits panel's heading opens it, and locking the sheet leaves it for Attributes (user, 2026-10-28: the row's room went to five inspiration marks at 644px; before, a tab in edit mode). The sheet lock (play and edit) sits at the far right of the row. The open tab is marked by its underline alone: no glow, and no box left on a tab after a click; keyboard focus shows as an outline (user, 2026-10-28). *check*

Planned, not built: the Actions tab (§4.4, backburner); players choosing and ordering their tabs (Classic's tab selection window); the Attributes skills column kept beside every tab, as Tidy's current sheet does with its sidebar (user, 2026-10-26; Phase 7, where tab bodies narrow by about 240px and the list tabs need a recheck at 644).

### 4.3 Attributes tab

- **Side panel** (about 240px, left): the skills list (proficiency, name, ability, modifier, passive).
- **Main panel:** the traits panel (senses, languages, damage immunities, resistances and vulnerabilities, condition immunities, weapon, armor and tool proficiencies), then the favorites grouped: Resources first (three panels in a row, §4.10; replaced the 2026-10-28 rows), then Inventory, Features, Cantrips, Spell level N with its slot pips, Effects, Skills and tools). Each row: picture, name, details (components, activation), uses.

Attributes decisions (user, 2026-10-24; mockup https://claude.ai/artifact/PfrTrdDsbn3Wx7DCa2HDEf, Attributes boards):
- **Skills:** one 28px roll button per skill. Proficiency is a mark, not bold text: empty circle none, half-filled half (Jack of All Trades), filled proficient, ringed expertise.
- **Passive scores:** every skill shows its passive, in play mode, in the row's last cell (user, 2026-10-27: the key-only toggle in the Skills heading did little and broke the rows' flow; replaced the 2026-10-24 toggle).
- **Traits** (user, 2026-10-27, replacing "empty ones hidden in play, all shown in edit mode" and their place under the skills): a panel at the main column's top, so it shows without scrolling, its heading on the Skills heading's line, folded or open (rule 1). It folds, remembered with the favorites groups; folded, one line of what's set. The whole heading bar is the fold button, its focus box drawn round the bar (user, 2026-10-28). Every trait in both modes, one line each with a short label ("Weapons"), "—" when empty; edit mode adds a gear in the last column and the rows keep their height. Its frame and heading are a favorites group's, inset the same, riveted the same in Forge (user, 2026-10-29: "the traits category" should match). Each trait a ledger row, as the favorites groups' rows: 32px tall, a soft line under it, every other one filled (user, 2026-10-28: "the same styling as the other categories").
- **Favorites:** each group folds, and stays as the player left it. Rows carry their home tab's marks (§5.1); slot pips sit in each spell level's heading.
- **Favorite rows act and look as on their home tab** (user, 2026-10-26): the picture uses the item; the name (with fold caret) opens its details in place, no item window; equipped and preparation kinds keep their tints and marks, and innate and at-will spells are also named in words. Skills and effects stay one button. No favorite glow here: every row is one.
- **Death saves** go in the header, shown only at 0 HP.

### 4.4 Actions tab

Backburner (user, 2026-10-26): Attributes favorites probably cover the same space; revisit after Phase 5. Kept for reference:

Everything usable, grouped by Action, Bonus Action, Reaction, Other. Each row: icon, name with a small subtitle (type, spell level and school), uses, range and target, hit or DC, damage, roll.

### 4.5 Where we change Classic (ADHD rules)

Keep the layout players know; fix what costs attention:

- **Gear and pencil icons only in edit mode.** Classic shows about 30 of them in play; each is a target under 24px.
- **Equipped and prepared** get an icon or label as well as their row color (color alone fails the colorblind player; §5.1).
- **The "Now" home** (Phase 7): was to be the Actions tab, now backburnered (user, 2026-10-26); where turn economy lives is open again (§7).
- **Targets at least 24px**, three text sizes, tooltips two to four words. On chat cards, our tooltips wait 1.5 s, open above the button and clear on a click (user, 2026-10-24).
- **Pinned header:** HP, AC and conditions never scroll away.

### 4.6 Inventory tab

Classic's layout (Tidy source, `src/sheets/classic/actor/tabs/ActorInventoryTab.svelte`, `InventoryList.svelte`): a search bar, then one section per item type (Weapons, Equipment, Consumables, Tools, Containers, Loot), each a table with a count; attunement, currency and carried weight in a footer.

Inventory decisions (user, 2026-10-26; mockup https://claude.ai/artifact/PfrTrdDsbn3Wx7DCa2HDEf, Inventory boards):
- **What matters at the table:** uses, usage, equipped, and attunement. Weight is mostly unimportant: nothing enforces 5e weight rules, and this isn't a video game.
- **Players choose the columns:** Weight, Uses, Usage, Qty, Equipped, Attuned, Favorite. Default: all but Weight. A client setting, so the choice follows the player to every character. The Columns menu shows only in edit mode, since it's a setting.
- **Filters:** dnd5e's search, filter menu and sort, with Action, Bonus and Equipped pinned beside the search (mockup).
- **Attunement has three states:** filled star (attuned), outline star (needs attuning; click to attune), blank (not required). Its own column, like the equip toggle.
- **Equipped:** a 28px toggle per row, plus the green tint and left edge. Edit and delete show only in edit mode.
- **The carried-weight bar follows dnd5e's encumbrance world setting:** hidden when the GM has it off. We add no setting of our own.
- **The picture uses the item; the name opens its details** (Classic's split), with a fold caret; an open row sits in a faint panel.
- **Containers** (user, 2026-10-26): a container is a row like any other, and a drop anywhere on it puts the item inside (dnd5e's own drop handling). Its contents fold open under it, indented, with a count on the fold button; each player's open containers are remembered. Containers nest. No container panel at the top. dnd5e's container window (from the picture) keeps dnd5e's look for now.

### 4.7 Spellbook tab

Built on dnd5e's `spells` part and `dnd5e-inventory`, like Inventory (research note, "Spellbook"). Decisions: user, 2026-10-26 (questions, mockup boards "Spellbook", first play), unless marked.

- **Spell states are two things in dnd5e:** how it's cast (`method`: Spellcasting, Pact Magic, Innate, At will, Ritual, or granted by an item) and its preparation (unprepared, prepared, always prepared). Only Spellcasting and Pact Magic spells prepare (2024 warlocks prepare).
- **Top of the tab:** one card per casting class (ability, attack, save DC, prepared / max), the class name on its own line so two cards fit side by side at 644px. Preparation follows dnd5e's class math: we show its counts and compute nothing; a class without a preparation formula shows a count only.
- **Concentration bar,** under the cards, always in the same place: the held spell's icon and name (opens the spell), End (dnd5e's `endConcentration`), and a Con save button that stays when not concentrating. One entry per concentration when the limit is above 1. A save after damage is dnd5e's own chat prompt, not the sheet's job. Phase 7 may mirror the bar in the header.
- **Sections:** cantrips, spell levels, Pact Magic, then innate, at will, ritual and item spells. Slot sections carry their pips in the heading (§5.1) and, in edit mode, a gear for dnd5e's slot settings. A section with limited-use spells adds a Uses column.
- **Rows:** the picture casts; the name (with fold caret) opens dnd5e's summary in place. Columns: components, concentration mark, time in words ("1 Bonus Action", not dnd5e's "1BA"), range; school and target off by default; then the book and the favorite bookmark. Players choose columns from the Columns menu in edit mode (client setting).
- **The book** has three states, like attunement: filled (prepared; click to unprepare), outline (unprepared; click to prepare), locked (always prepared; no click). Cantrips (they never count), innate, at-will, ritual-only and item spells have none.
- **Unprepared spells show,** marked by the outline book and a plain row, not faded; the Prepared filter narrows the list.
- **Filters:** pinned Action, Bonus, Reaction, Conc. and Prepared (Tidy Classic's pins plus Prepared); dnd5e's menu has Ritual, schools and casting class, and we add Can cast and V, S, M.
- **Choosing the primary spellcasting ability** is edit mode only (Phase 6).

### 4.8 Phase 5: Features, Effects, Biography (user, 2026-10-26)

Research note, "Features, Effects, Biography, Journal". Every list matches Inventory and Spellbook: the shared search bar, pins, Columns menu, row layout and column widths, the picture uses, the name opens details in place; the rules in CLAUDE.md and §5.1 apply.

- **Data carries over** (user, 2026-10-26): every player-written field is dnd5e's own (`system.details.*`, biography, characteristics), so text written on dnd5e's sheet or Tidy's shows on ours, and the other way round. We add no text fields of our own.
- **Features:** dnd5e's sections and its grouping switch, starting By source (one section per class, Species, Background, Other); Active and Passive one click away. Columns Uses, Usage (in words, like spell time), Recovery. Pins Action, Bonus, Reaction.
- **Class, species and background cards** now sit in the header (§4.1; user, 2026-10-26), all alike (user, 2026-10-26, after first look): the kind as a label ("Class", "Species", "Background"), then the name, which opens the item (one target; no separate picture); a class shows its level and subclass ("Cleric 9 · Life Domain"). The item's art is a faded underlay at the card's right, nil behind the label and 25% at the edge, so text keeps 4.5:1. A dashed "Subclass" or "Choose" button stands in for what's missing (dnd5e's `findItem`). In edit mode a × removes the class, subclass, species or background through dnd5e's delete, which asks first; dnd5e allows one species and one background, so changing one is remove, then choose. Level up is in the level pill's tray (§4.1). Level down stays edit mode (Phase 6).
- **Effects:** two categories by kind, Temporary and Passive, plus Unavailable (dnd5e's suppressed) when any. A switched-off effect stays where it was (user, 2026-10-26: switching must not reorder; dnd5e would move it to Inactive); rows keep one order, the effects' own sort then name. Rows: Source, Duration, the on/off switch (a concentration shows its mark: it ends on the Spellbook), the favorite. In edit mode a concentration has Break (the concentration mark struck through, dnd5e's end concentration) where other effects have Delete (user, 2026-10-28). Under them a conditions grid, each with its icon and name. The header keeps showing active conditions. Fixed columns, no Columns menu (Claude, 2026-10-26: four short columns, nothing to hide).
- **Biography:** Classic's layout (characteristics across the top; personality, ideals, bonds, flaws on the left; appearance and biography on the right). Every field always shows and edits where it stands, without unlocking the sheet (user, 2026-10-26, replacing "read in play, edit in edit mode"): fields read as text with a faint edge until hovered or focused; the biography is dnd5e's editor, toggled. A viewer without edit rights reads, empty fields hidden.
- **Journal: dropped** (user, 2026-10-26). dnd5e has none; quests live in the quest log, notes in the biography. Tidy's Journal notes stay untouched in Tidy's flags on the actor.

### 4.9 Phase 6: Edit mode (user, 2026-10-27)

Research note, "Edit mode and lifecycle". dnd5e keeps the settings windows; we add the controls that open them, shown only in edit mode (§4.5).

- **Values stay visible in edit mode,** with a gear beside the label (Init, speed, HP, hit dice, each trait group). dnd5e swaps the value for its gear, which hides the number while you edit.
- **AC:** in edit mode the shield itself opens dnd5e's AC window (user, 2026-10-27: "a popout window for AC calc"); no separate gear. In play it keeps dnd5e's breakdown on hover.
- **Ability scores:** in edit mode the big number is an input; the save stays a roll button; a gear on the label opens dnd5e's ability window.
- **Name:** an input in edit mode only. **XP:** editable in play too, no unlock needed (user, 2026-10-27).
- **Temp and Max ± are fields** side by side under the HP bar, in play and edit (user, 2026-10-27: "a plethora of game features modify max HP"). Max ± writes dnd5e's temporary max change (`system.attributes.hp.tempmax`: Aid, drains), which is what those features change and lifts cleanly; the bar shows the result ("87 / 92"). The permanent max override stays in dnd5e's HP window behind the gear. In edit mode the current HP is a field inside the bar.
- **Traits run down the left column under the skills** in edit mode, every group with its gear; favorites keep the right column (user, 2026-10-27: extend downwards, don't cover information).
- **HP tray** opens from the HP number in play mode (damage is play): an amount box, then Damage, Heal and Temp, through dnd5e's `applyDamage` (temp first) and `applyTempHP`. Setting HP to an exact number is edit mode.
- **Skills in edit mode:** the dot becomes dnd5e's proficiency cycle (none, half, full, expertise); the ability label becomes a dropdown.
- **Level down** sits in the level tray beside Level up, edit mode only, through dnd5e's confirm dialog.

### 4.10 Phase 6.5: Polish (user, 2026-10-28)

From the user's screenshot after Phase 6's play check. Mockups: the layout check's renders (light, dark, 644px), not canvas boards; the canvas still shows the Phase 1–5 look.

- **Portrait art runs to the frame's foot:** the band has no ground of its own; HP, Temp and Max ± sit at its bottom, each on a scrim (the surface at 85% with a blur behind), so the art shows above and between them. The gap under Temp and Max ± goes. Round and tall portraits stay as the player framed them (the framing already governs the image).
- **Class cards split class | subclass art** down the middle, on both class cards, accepting that the second gets tight at 644px. Without a subclass, the class art alone as before.
- **The class level in a ring at the card's top right;** the name reads "Fighter" over "Rune Knight", in the display style; "Class" stays as the label (user, 2026-10-28, reversing Claude's hiding it). Species and background names take the display style too, wrapping (hyphenated where the browser can) rather than cutting. "+N" moved from the label line to the end of the card's last line (beside it the subclass shortens, whole on rest, rather than the chip wrapping and the header growing in edit mode), and in edit mode a species or background's × sits in the card's bottom right, so nothing is cut at 644px and the header keeps its height (Claude, 2026-10-28).
- **The milestone tray drops its key** of class names and levels: the badges say it. Level up and Level down stay.
- **An effect favorite shows its duration only when it runs out:** dnd5e's label read "None" for an endless effect.
- **Resources: three panels in a row,** each several lines (as Classic's): name (wrapping to two lines before it's cut; a linked item's name is a button that uses the item, user 2026-10-28); − uses left / most + (− spends one, + regains one, each disabled at its end, user 2026-10-28; play mode's value is text, typed in edit mode); recovery (SR, LR, or a linked item's periods) and Restore. Labels centred; a linked item's art fills the panel as an underlay at 15% (user, 2026-10-28, replacing the art beside the name). In play only the resources that are set show; with the lock off all three show, for editing and adding. With none set, edit mode draws the group at the column's foot rather than its top, so opening the lock moves nothing (user, 2026-10-28: the sheet jumped). Edit mode: the name and the numbers become fields, recovery two checkboxes, and a cog in −'s place opens a tray to link an item with uses to that panel (the name line keeps the panel's whole width in both modes, so it wraps the same). A linked panel shows and edits the item's uses and recovery (stored in `flags.fhcs.resources`); unlinked keeps dnd5e's own resource. Refresh sets uses back to most. A linked item may also be a favorite (Claude's pick; the user didn't object).
- **Sections fold on Inventory, Spellbook, Features and Effects,** as favorites groups do, remembered per player. A search shows matches inside folded sections and clearing it puts the folds back; a spell level's slot pips stay usable while folded.

### 4.11 Themes (user, 2026-10-28)

Four themes for players who want them, ahead of the rest of Phase 7: **Fire and Forge**, **Wind and Wrath**, **Sand and Sanctuary**, **Valley and Valor**. Plain (today's look) stays the default. The rules every theme follows are §5.3; this section holds the choosing and each theme's look.

- **Per character, with a world default:** a character's theme is stored on the actor (`flags.fhcs.theme`); without one, the GM's world setting ("Sheet theme", Plain by default) applies. Everyone who opens the sheet sees the same theme. A palette chip on the title bar, before dnd5e's ⋮, opens a tray: World default (named), Plain and the four themes, the one worn marked with the radio dot. It shows in both modes to anyone who can edit the sheet (user, 2026-10-28, moved off the tab row: in edit mode it crowded the Forge emblem); a choice, or a click elsewhere, closes the tray. The chip is a button and its tray hangs from the window, not the title bar (user, 2026-10-28: "change theme button is broken"; Foundry drags the window from any press in the bar but a button's). Each player's "Theme motion" setting (on by default) keeps a themed sheet still when off.
- **Chat cards follow the world theme,** not the speaker's; a world setting switches themed cards off (plain cards). A later slice than the sheet.
- **The four, as first mocked up** (Claude, 2026-10-28, for the user's review; `styles/themes/*.css`, `tools/theme-mockup.mjs`). The panels carry `fhcs-frame`; a round portrait keeps no frame. Each theme puts its emblem on the tab row, at the inspiration bar's left.
  - *Fire and Forge* (taken further first, user 2026-10-28): the window as a smithy. A brick wall across the window, warmed from below by a hearth whose heat is the character's HP (cold grey at 0); a tool rack in the lower corner; an iron band round the window with a grate of coals along its foot that burn with HP; plates at 88%; riveted iron frames; Grenze for the display style and headings; the portrait lit from below by the hearth; an anvil on the tab row and the rail under the tabs warm. From the research (docs/research/forge-theme.md, user 2026-10-28 "let's try it out"): HP is a smith's heat colour, cooling from yellow-orange through cherry to dull red and black iron at 0, on the hearth, coals, seams and portrait rim; a straw-to-bronze temper sheen along each frame's top rim follows the pointer on hover (purple and blue left out: they mean Pact Magic and prepared); heading bars etched with pattern-welded (Damascus) steel, folded light and dark layers at 16% at most; a maker's mark (hammer over anvil) stamped at the nameplate's right end, in a brass border so a long name never runs under it. The whole sheet (user, 2026-10-28, "finish the sheet ... trays, tabs, and anything we've missed"): trays are iron-edged plates with rivets, a temper sheen and a deep shadow; fields keep the sheet's look, their edge heating on focus (sunken wells were tried and dropped: they reshaped values on unlocking); buttons take an iron edge; scrollbars are iron; Foundry's tooltip wears Forge when it comes from a Forge sheet; the heading bars and tab rail are dark iron with light letters (one look, user 2026-10-28; polished steel in light mode was dropped); a plate holding an open tray rises above its neighbours (the blur makes each plate its own layer). Bolder (user, 2026-10-28): a riveted brass nameplate behind the name; headings as stamped-steel bars (light letters on dark iron, both modes); the tab row an iron rail with the open tab an ingot at working heat (no glow: the open tab never glows, user 2026-10-28); the anvil rides at the inspiration bar's left, whose stars are runes glowing like embers; and the runes left the rail when inspiration took its empty right (2026-10-28); the portrait set in an arched forge mouth with a hearth-lit rim (a round portrait stays round); a hammered grain tried on frames and dropped (it read as rocks; it stays on chat cards); bloodied, the window band's seams glow red; down, ash frosts the band and frames. Hover heats a frame's edge, the portrait's too, with the gleam crossing the art (user, 2026-10-28: the portrait had dimmed on hover); a press dips 1px with a spark ring; sparks spray from the window's bottom-left corner, a fresh burst each time (canvas particles under gravity, cooling white-gold to red, fewer and dimmer as HP falls, none at 0), when inspiration is gained (user, 2026-10-28; before, on a timer); the header starts below the window's iron band (user: "the top is a little cramped"); a hit jolts and flares the portrait and flares an ember glow round the window, a heal swells the portrait's light. Chat cards (2026-10-28): the message a riveted iron plate with the temper sheen along its top, the hammered grain and a faint warmth at its foot; the title and totals in Grenze; the header underlined in steel; bands and buttons iron-edged, heating on hover and dipping on a press. Forge's success green is a step darker in light mode (same hue) to hold 4.5:1 on its warmer surface.
  - *Plain, as Day and Night* (user, 2026-10-29, Phase 6.55): Plain stays the default and keeps Foundry's two modes, now named and drawn as **Day** (sunlight, light mode) and **Night** (moonlight, dark mode), the overriding look; a **ledger** is the subtheme (ruled pages, totals rules under headings). Subdued: the same kinds of texture and motion as Forge, quieter. Particle effects are scripts (canvas, as Forge's sparks), never CSS-only (user, 2026-10-29: "high quality scripts instead of static css"). Decided (user, 2026-10-29, "good on all counts", agreeing to Claude's picks, ROADMAP Phase 6.55 1–10):
    - **Day and Night are Foundry's light and dark modes,** redrawn; not extra choices in the theme tray.
    - **Light has a direction:** Day's sun from the upper left, warm; Night's moon from the upper right, cool. Edge highlights, the hover glint and the gutters' wash take that side.
    - **The ledger:** faint ruling in the gutters; a double hairline under headings (the totals rule); a 1px top highlight on frames.
    - **Moments:** every toggle gets on and off moments (inked in, erased); hit and heal at the HP line; the tab line slides; trays and tips fade in; folds animate where they don't redraw; a press dips 1px.
    - **Night is moonlight and moonbeams only** (user, 2026-10-29: "not stars or falling sparks"): its inspiration mark, glow and particles are moonlight (a moon mark, a pale halo, a moonbeam falling on the mark struck), replacing today's starlight in dark mode. Day: a rayed sun mark, a gold glow, sun motes drifting up from the mark struck.
    - **Particles are one script engine** (`src/apps/sparks.js` grown), an emitter per theme.
    - **State art:** Night's moon wanes with HP (full, waning when bloodied, new when down); Day's light lowers toward dusk.
    - **Marks in ink** (Claude, 2026-10-29, for the user to reverse): inspiration's suns and moons draw in the sheet's ink and only their glow is gold or silver, since gold marks concentration (§5.1).
    - **Emblems:** a sun for Day, a moon for Night; Sand and Sanctuary takes a sanctuary arch for its emblem in place of the sun.
    - **"Theme motion" becomes "Sheet motion";** the load check fails an animation outside the reduced-motion and Motion-off gates.
  - *Wind and Wrath:* storm slate and overcast; square frames with a cut top-right corner and a storm-light left edge; faint wind lines in the ground; a bolt. Hover sends a gust across a heading; a press is shoved sideways.
  - *Sand and Sanctuary:* sandstone and shade-brown; carved frames with stepped corners and a terracotta inlay along the top; a tile lattice; a sun. Hover passes a shaft of light down the portrait; a press settles like stone.
  - *Valley and Valor:* meadow parchment and forest night; tooled frames, a brass edge with a second line inside (solid, since dashed means choose); a meadow tint rising from the foot; a crimson pennant, which also notches the open tab's line. Hover runs a gleam along a heading; a press pulses like a shield bash.

### 4.12 Inspiration on the tab row (user, 2026-10-28; built 2026-10-28)

Modern Tidy (checked in its source, 2026-10-28): a world "homebrew" setting turns banking on, a second limits managing it to the GM; the player marks a feature with uses as the inspiration source (its context menu), stored on the actor (`flags.tidy5e-sheet.inspiration-source`); the badge then shows that item's uses with − and +. Without a source, dnd5e's on/off inspiration (`system.attributes.inspiration`, a boolean).

Ours:
- **Where** (user, 2026-10-28): in the tab row's empty right, right-aligned before the lock. It left the portrait.
- **Without a bank:** one star, dnd5e's on or off (its `toggleInspiration`), filled when on.
- **The bank:** an item with uses, picked from a gear tray in edit mode ("Bank in": No bank, then every item with uses), stored as `flags.fhcs.inspiration`. Unset, we read Tidy's source, so a character keeps its bank across sheets; choosing No bank clears both. No world switch: linking an item is the switch (Claude, 2026-10-28, a narrowing of Tidy's; the GM-only option can follow if wanted).
- **Stars, not a number:** one per use, up to five; filled ones are banked. A click on a star spends it if filled, banks it if empty, in any order (user, 2026-10-28); which places are filled is kept on the actor (`flags.fhcs.inspirationSlots`) and brought in step when a rest or anything else changes the uses (new ones fill from the right, by the lock). A bank over five shows one chip instead, a star and "5/8", whose tray holds every star (user, 2026-10-28: "don't squish inspiration"; it replaced a cramped + and count). A click's moment starts on the star clicked: the places save without a redraw, then the uses. Edit mode's gear sits at the bar's left, so nothing moves on the lock.
- **dnd5e stays in step:** its boolean is on while the bank holds any, so whatever reads dnd5e's inspiration still works.
- **Gained and spent, each a moment** (600ms; user, 2026-10-28: "each theme should get its own on-off animations as general rule"): default, the newest star turns in with a flare of starlight, and a spent one settles as its light fades; Forge, stamped hot (the tile struck down white-hot, cooling to ember) and cooling off (orange, dull red, dark iron). Themes set `--fhcs-inspire-on`, `-off` (the mark) and `-on-glow`, `-off-glow` (its light). Still under Motion off and reduced motion.
- **Banked glows** (user, 2026-10-28): a filled mark gives off light, starlight by default (gold in light mode, pale in dark), breathing slowly and a little out of step star to star; still under Motion off and reduced motion, the glow then steady. The filled shape says banked; the glow only adorns.
- **Each theme its own mark** (user, 2026-10-28): the mark is a mask a theme swaps (`--fhcs-mark`, `--fhcs-mark-on`). Forge: five of its stamped runes, one per place; empty the rune's lines, banked a struck tile with the rune cut through, glowing like embers with a coal's flicker.
- **Room:** five marks at every width (user, 2026-10-28: "always show five marks, even at the sheet's narrowest"). At 644px in edit mode the row holds Bastion, the gear and five marks once Special Traits left it; tabs sit with no gap between them (each tab's padding keeps labels 8px apart) and the bar's controls touch (each a 24px target round a smaller mark).

### 4.13 Every sheet (user, 2026-10-28)

"Build our styling to the other sheet styles (npc, item, spell, and the rest), as well as the chat cards." Research: docs/research/dnd5e-6.0-other-sheets.md.

- **Rebuilt in our layout:** the item sheet (every type, spells included) and the NPC sheet. Container, group, encounter and vehicle reuse our Inventory tab and parts; the smaller windows (active effects, activities, advancement, the config windows our gears open, rests, award, currency) get a skin: our tokens, type and spacing over dnd5e's markup.
- **Which theme:** an item wears its owner's theme, else the world's; an NPC, vehicle, group or encounter has its own choice like a character (`flags.fhcs.theme`), else the world's; chat cards the world's (§5.3 rule 10).
- **Order:** chat cards in the world theme; the item sheet; the NPC; container, group, encounter, vehicle; the smaller windows.
- **Categories of the player's own, and the sections' order** (user, 2026-10-28, agreeing to Claude's picks; "matching identifiers in the various item and feature sheets. tidy does this and we should too"): an item's category is a name on the item (`flags.fhcs.section`; Tidy's `flags.tidy5e-sheet.section` is read when ours is unset, so Tidy users keep theirs). It is set from "Category…" on dnd5e's item context menu (a name typed or picked from those in use; blank puts the item back in its usual place) and from the Category field on our item sheet. Every item of one name shares one section, on Inventory, Spellbook and Features (in both of Features' groupings), after dnd5e's sections until moved; an empty category has no section. In edit mode every section heading on Inventory, Spellbook, Features and Effects, and on Attributes the Traits panel, the Resources and each favorites group (user, 2026-10-28: "both traits and resources should be reorderable"), has up and down arrows in its edit column, each off at its end; the order is saved per character per tab (`flags.fhcs.sectionOrder`). Arrows, not drag (user: "up and down arrows are fine in lieu of drag"). On the Spellbook the slots' gear moved from the edit column to the heading's empty prepared column to make room.
- **Limited views need nothing:** every user sees the sheet's chosen styling (user, 2026-10-28).
- **The item sheet** (user, 2026-10-28, agreeing to Claude's picks): rebuilt are the header and the Description tab, Tidy Classic's way (a properties column of quantity, weight, price and property tags beside the description); Details, Activities, Effects and Advancement keep dnd5e's forms under our skin (field names in label style, values in body, our spacing and tokens). The header: the icon in the theme's frame; the name in display; one line under it, type · rarity · source (a spell: level · school · V S M, with the ritual and concentration marks of §5.1); toggles: equipped and identified in dnd5e's own Font Awesome marks, the halved shield and the wand with sparkles (user, 2026-10-28: "foundry should have appropriate icons"), attuned our star, prepared our book. No lock (user, 2026-10-28, replacing "the lock at the tab row's end"): as Foundry's own sheets, an item sheet is editable whenever Foundry says it is (its owner, outside a locked compendium), so it opens with its fields; a viewer reads it. Resizable, with room at its sides and foot. 500px at the least, 560px to start; the comfort stops carry over. Built 2026-10-28 (Claude, carrying the picks further, for the user to reverse): offered for every item type but containers, not the default (as the character sheet: chosen per item or made the default in Foundry's sheet settings); the tabs keep dnd5e's order and names; the properties column shows quantity, weight, price, uses and recovery, a spell's casting time, range, duration, target and materials, and the Category (in both modes, "—" when unset), with dnd5e's property tags under it; the window keeps dnd5e's `dnd5e2` look for its forms; an item wears its owner's theme, else the world's.
  - **Nothing of dnd5e's lost** (user, 2026-10-29: "check each built sheet's tabs for correct core functionality"): what dnd5e edits only in the header it replaces (a physical item's rarity, weight unit and currency; a feature's requirements) sits in the properties column with dnd5e's own inputs; the unidentified description (GM) and the chat description (owner) follow the description, each its own panel; dnd5e's add button shows on every tab that adds (Activities, Advancement, Effects).
  - **Long-text items and dnd5e's info row** (user, 2026-10-29, comparing dnd5e's Cleric, Dwarf and Criminal): dnd5e's info row (a species' creature type, movement and senses with their gears; a weapon's to-hit and damage; armour's AC) sits above the description. A class, species or background (dnd5e's single description) has no chat panel, and its properties run as a row so the description takes the full width; so does any item with nothing for the column. A class shows its level in a ring. A description's own structure takes our styles: headings display, lesser headings, table heads and bold lead-ins label, tables as ledgers, a quote with a line down its left. A reader sees only what's set (the category's "—" is gone: no lock, §5.4 rule 3). Every tab fills the window; the description panel grows with it, so its editor follows the window's height (user, 2026-10-29), and the tab scrolls when the text is longer.

## 5. ADHD rules carried over

Typography and spacing (user, 2026-10-24): three text styles across the module (display, body, label), two spacing steps, one control height; every panel uses space economically, folded and open: a band's heading, total and open mark share one line; the card header is one label line (actor · details) over the title.

From the quest log and Initiative: three text sizes; targets at least 24px; tooltips two to four words, details in a tips panel; play and edit modes; one main action per area; plain words, no blame or counters; reduced motion; colors only through tokens.

Don't say a thing twice: a mark that shows its own state needs no count beside it (user, 2026-10-26: the slot pips lost their "3 / 4").

### 5.0 Principles (Claude, 2026-10-29, drawn from the user's decisions through Phase 6.5 and Forge)

The rules below, in seven lines. When a case isn't covered, decide by these, in this order.

1. **Readability first.** Text and marks win over art, texture and motion (§5.3 rules 1, 5).
2. **Nothing moves.** Heights and places hold across modes, folds, themes and widths (§5.2 rule 6, §5.3 rule 3).
3. **One meaning per mark, one mark per meaning** (§5.1). Check the table, and look at the marks that share a bar: a fold caret and a move arrow both drew ⌄ on one heading (2026-10-28).
4. **Like things alike.** A new part copies the nearest existing pattern (Traits took the favorites groups' rows, user 2026-10-28); a feature for one tab goes on every tab it fits (categories and their order, user 2026-10-28).
5. **Foundry and dnd5e first.** Their behaviour, icons and permissions before ours: an item sheet is editable whenever Foundry says so, no lock; dnd5e's halved shield for equipped; windows resize; a middle-click opens a sheet (user, 2026-10-28).
6. **Effects answer the player.** A moment starts where its event shows, when it happens; never on a timer (§5.3 rule 6).
7. **What a check can hold, a check holds,** seen failing once; §5.2 lists what is still read by eye.

### 5.1 Icons and colors on the sheet (one meaning each)

Check here before choosing a mark, and add new ones. Every tint has an icon, mark or word beside it; never color alone. Colors are tokens with light and dark values (`styles/fhcs.css`).

| Mark | Means | Where |
|---|---|---|
| Bookmark; filled rose when on | Favorite | Toggle column on Inventory and Spellbook rows, and dnd5e's right-click menu. Favorited rows glow faintly rose, keeping their own left edge (user, 2026-10-26). |
| Book: filled, outline, filled with a lock | Prepared, not prepared, always prepared | Spellbook rows (a toggle); Attributes favorites (filled only) |
| Tint and left edge by kind: blue, teal, violet, orange-brown, grey | Prepared, always prepared, Pact Magic prepared, innate, at will | Spellbook rows, Attributes favorites. Unprepared rows plain. |
| Halved shield (dnd5e's), its left half filled when on, in a green toggle; green tint and left edge | Equipped | Inventory rows, Attributes favorites, the item sheet's header (2026-10-29, replacing a check: one mark per meaning). The line down its middle tells it from the save button's whole shield. |
| Star: filled, outline, none | Attuned, needs attuning (click to attune), no attunement | Inventory rows |
| Star on the tab row (a theme's own mark: Forge's runes, a struck tile when banked): filled, outline | Inspiration: on or banked, an empty place in the bank | Tab row, before the lock (2026-10-28; on the portrait before, so the star has carried both meanings, told apart by place, since Phase 1) |
| Head in profile with a turning arrow (dnd5e's concentrating icon, drawn simpler); filled gold | Concentration spell; held now | Spellbook rows and their column heading, the concentration bar, the Effects tab's On column (user, 2026-10-28: replaced a C in a ring, which read as ©). The concentration bar takes a gold edge and tint while concentrating. |
| The concentration head struck through | Break concentration | Effects rows in edit mode, in Delete's place (user, 2026-10-28) |
| R | Ritual | Beside the spell's name |
| Shield on the save button: filled, outline | Proficient save, not proficient | The abilities panel (user, 2026-10-27; filled means proficient, as the skill dots) |
| Soft blue dot, 12px in a 24px target: filled, ring, dotted ring | Slot left, spent, temporary | Spell level headings on Spellbook and Attributes; no count beside them |
| Caret: pointing right, pointing down | Folded, open | Row names (details), favorite groups, containers, list sections in the picture column (user, 2026-10-28) |
| Faint panel with a line under it | An open row | Inventory, Spellbook, Attributes favorites |
| Pin: heavier edge; dashed and struck through | Filter on; filter excluding | Pinned filters beside a list's search |
| Green pips with a tick, red with a cross | Death save successes, failures | Header, at 0 HP |
| Underline | The open tab | Tab row |
| Level pill solid, with an up arrow | Enough XP to level up | Header, XP mode (user, 2026-10-26) |
| Every other row faintly filled | Nothing: a ledger, for reading across | Every list: Inventory, Spellbook, Features, Effects, Attributes favorites and skills (user, 2026-10-26). A row's own tint or open panel wins. |
| Switch: filled track, knob right; outline track, knob left | On, off | Effects rows and conditions (user, 2026-10-26); a favorited effect on the Attributes tab (user, 2026-10-28). Neutral ink, not green. |
| Dashed button with a plus | Something to choose or add | Class cards (subclass), Species and Background cards (user, 2026-10-26) |
| × in a square control | Remove this (asks first) | Class, subclass, species and background cards, edit mode only (user, 2026-10-26) |
| Cup; bed | Short rest; long rest | The status group in the name row (user, 2026-10-28) |
| Small ringed dot | Exhaustion 0; rest on it to show the chip | The status group's first segment (user, 2026-10-28) |
| "+N" in a small box | N more classes, in the class tray | The end of the last class card's last line (user, 2026-10-27; moved 2026-10-28) |
| Number in a ring | The class's level | Each class card's top right (user, 2026-10-28); a class's item sheet header (2026-10-29) |
| Light green fill inside the HP bar | HP left, with the numbers written over it | The portrait card's band (user, 2026-10-27) |
| Heart with a crack; heart with a plus; shield with a plus | Damage; heal; temporary HP | The HP tray, each with its word; Damage solid as the main action (user, 2026-10-27) |
| Gear | Settings: opens one of dnd5e's settings windows, or a tray of settings | Edit mode only: beside AC, Init, each ability, speed, HP, skills and traits; on the HD chip; alone in a chip at the portrait's top left (its options tray) (user, 2026-10-27); each resource panel's name line, the item to show (2026-10-28); the inspiration bar's left, the item that banks it (2026-10-28) |
| Two opposed arrows; solid when on, outline when off | Show the token in place of the portrait | Edit mode, the portrait's options tray (dnd5e's own switch) |
| Circle; solid when on, outline when off | Round portrait | Edit mode, the portrait's options tray (user, 2026-10-27) |
| Crop corners | Frame the portrait (pan and zoom) | Edit mode, the portrait's options tray; not for a token (user, 2026-10-27) |
| Dashed edge on the portrait | Framing: drag the art | While framing (user, 2026-10-27) |
| Radio dot: filled, ring | The one chosen; another | Edit mode: each casting card on the Spellbook, the main spellcasting ability (user, 2026-10-27); a resource panel's cog tray, the item shown (2026-10-28) |
| Circular arrow | Restore: uses back to most | Each resource panel's foot (user, 2026-10-28) |
| Palette | The sheet's theme | The title bar, before ⋮, both modes (user, 2026-10-28) |
| Arrow up, arrow down (with a stem) | Move this section up or down (each off at its end; 2026-10-29, replacing chevrons, which matched the open caret on the same bar) | Edit mode: section headings on Inventory, Spellbook, Features and Effects; favorites groups on Attributes (user, 2026-10-28) |
| Wand with sparkles (dnd5e's) | Identified | The item sheet's header toggle, filled when on (user, 2026-10-28) |
| Down arrow | Level down | Edit mode, the level tray (user, 2026-10-27) |

Chat cards keep their own scheme (§6.6): the primary d20 black (white in dark themes), disadvantage dice red, advantage dice blue.


### 5.2 Sheet styling rules (user, 2026-10-27)

One set of rules for every tab and both modes (user, 2026-10-27: "apply as uniformly as we can, now that everything is where it should be"). The layout check enforces what it can (marked *check*). Not checked yet: rules 5, 7, 8, 12 and 13, and rule 9 for control edges; read those by eye on the screenshots.

**Layout and alignment**
1. **Edges that meet line up.** A region is a grid; neighbouring parts share its lines. Every heading is one fixed height whatever it holds, so headings side by side share their line (user's screenshot, 2026-10-28: Traits' heading, holding its fold button, sat lower than Skills'). The header: the portrait card spans two rows; the HP band and the cards share the second, so both their tops and bottoms align (the user's screenshot, 2026-10-27). *check*
2. **Ratios hold at every width:** chips square or pill, round controls round, the shield and cards keep their shape. *check (round, square)*
3. **Narrow padding, clear boundaries:** `--fhcs-s1` (4px) inside controls and rows, `--fhcs-s2` (8px) between regions, and no other spacing (user, 2026-10-28, after comparing the strict version with the loose one on the canvas: the 2, 3 and 6px values went to 4). Not spacing, so allowed: a hang (rule 21), an indent that lines text up with a column, the screen-reader clip. Every region shows its edge (a 1px line or a fill), never space alone. *check*

**Controls and icons**
4. **An icon fits its button** (user, 2026-10-27): buttons are sized to show Foundry's standard icons and ours clearly (a control, 28px, or the 24px target); the icon is centred both ways, and where a button is smaller, the icon shrinks to fit rather than spill or crowd. *check*
5. **Text buttons read from the left** (Foundry centres them); icon, then text.

**Play and edit**
6. **Same heights and flow in both modes** (user, 2026-10-27: "its ok if they move left, but its not ok for the heights and flow to change"). Columns may slide left to make room for edit mode's controls (a row's edit and delete); no row, card or bar changes height, and nothing below moves. Within that: a control takes the place of the mark it edits (a skill is one row in both modes, dnd5e's way: fixed 24px cells whose contents change, never the row; the dot stays drawn and dnd5e's proficiency cycle lies over it unseen, since its own drawing changed size with Foundry's styles; the ability stays its text, a small triangle under it, and opens a tray of ability chips: user, 2026-10-27, the native dropdown failed contrast and its dashed underline moved the text), and a gear takes a column play mode leaves empty or quiet. Fields may show their edge; nothing reshapes. Text stays where it sits in play mode. Content edit mode adds at a column's end (the empty traits, shown so they can be set) may extend it. *check (row heights; every element both modes draw keeps its height, place and text position)*
   - **Nothing moves when a group folds or the lock turns** (user, 2026-10-28). Scrolling areas keep their scrollbar's room (`scrollbar-gutter: stable`, thin), so opening or folding a group never narrows the column; on a list tab the list's scrollbar room takes the place of the tab's right padding. At 644px with every column on, Uses (to 56px), Weight (to 50px), Usage (to 56px) and Time, Range, School and Target (to 36px) give way to make the room. *check (every scrolling area)*
   - **Foundry's control height is reset on every control kind** (button, `summary`, `select`): a control that appears only in edit mode once grew the tab row by Foundry's 2rem and dropped every row (twice: buttons 2026-10-27, a `summary` 2026-10-28). *check (the harness gives each kind Foundry's height)*

**Colour, focus and attention** (WCAG 2.2; ADHD rules, §5)
7. **Never colour alone** (WCAG 1.4.1): every tint has an icon, mark or word (§5.1).
8. **Colours told apart differ in lightness, not hue alone;** no pair that only red against green separates (death saves keep tick and cross).
9. **Contrast:** text 4.5:1, large text 3:1 (WCAG 1.4.3) *check*; a control's edge and an icon 3:1 against what they sit on (WCAG 1.4.11). *check (icons)*
10. **Focus shows** on every control, in every theme (WCAG 2.4.7): one ring for all, 2px in the control's own ink, inside its edge (2026-10-29). *check*
11. **Motion:** §5.3 rule 6 (one copy).
12. **Same thing, same place, same look** across tabs: search bar, pins, Columns menu, row layout, empty lines.
13. **Empty states** are one short line in body, muted (a new sheet's empty favorites is normal, user 2026-10-27).

**Window**
14. **The title bar: a plain row above the sheet** (user, 2026-10-28, replacing "no title band" with controls floating over the header): about 28px, no fill or edge, its whole width a grip; it holds only the theme palette, ⋮ and × (and dnd5e's warnings triangle while a character has warnings). The sheet starts right under it, whatever height Foundry gives its own title bar (user, 2026-10-28: too much padding beneath it). Every other title-bar button, Foundry's or a module's, waits in the ⋮ menu: hidden in the bar, listed in dnd5e's menu, and its entry clicks the button itself. *check (offline and Quench)*
15. **Round or square portrait,** the player's choice in edit mode, saved on the character (user, 2026-10-27). Round drops the card's edge and fill around the art, so the frame reads as a circle; the HP band keeps its own edge. A token shows whole in either shape, never cropped (user, 2026-10-28).

**Like elements alike** (user, 2026-10-27: "HP is different sized than the hp value itself", "the portrait buttons are … different size than the inspiration button")
16. **Chips match:** one look for every chip, the panels' underlay (the fill, an edge, ink marks; user, 2026-10-28, replacing solid ink on the art); every chip on the portrait is one size (an icon-only chip square), chips side by side share a row with a gap. On is a filled mark (the star filled), never a ring that enlarges a chip; in a tray of choices (exhaustion levels, the portrait's options) on is solid and off an outline. *check*
17. **One text size inside one control:** a label and the value it names share a size ("HP 87 / 87" all display). A row drawn as one button (a skill) is a table row: its columns keep their column's style. *check*
18. **A button's words are body style, not capitals** (user, 2026-10-27: "we are mixing all caps in the spellbook buttons with regular text"): Columns, Con save, the Level pill, a row name's subtitle ("Life Domain", muted). Abbreviations (Str, Dex) and headings that fold (favorites groups) keep the label style. *check*
19. **A gear is no larger than the words beside it:** 12px beside labels, the same gear on every label (AC included, centred with its word); alone in a chip, a chip icon's size. A gear in a line of text keeps its 24px target without making the line taller. *check*
20. **A 24px target, or the room around one** (WCAG 2.5.8): a control's target is 24px; where a column can't spare that (a gear in a stats label, 16 × 24), the target may be narrower when nothing else clickable lies within the 24px circle around it (user, 2026-10-27).
21. **A hang** (user, 2026-10-28): a control may reach into the space around its line without growing it, by a negative margin: a gear in a line of text, the "+N" chip in a card's label line, the AC shield in its 28px line. Only these; anything else that would grow a line makes the line that height in both modes instead. *check*

### 5.3 Theme rules (gathered 2026-10-28 from the user's notes on Forge)

Every theme, and Plain where it applies. The look of each theme is §4.11.

1. **Artwork, readability its north star** (user, 2026-10-28): text sits on plates; the art lives in the window's frame, the gutters, the space under short lists, and faintly through the plates. An element whose background carries art is marked `--fhcs-art: 1` (Plain's window too, since Day and Night's ground, 2026-10-29); the layout check reads every text over it against pure black and pure white in the art's place. *check*
2. **What a theme may change** (Claude, 2026-10-28): the ground, panel surfaces and frames, corners, decals, heading bands, the tab row, its own marks (inspiration's) and motion. Never a meaning colour's hue (§5.1); it may shift lightness to keep contrast. Accent colours decorate, never mark.
3. **A theme never reshapes:** every size, padding and height stays Plain's, so play and edit mode match in every theme; fields look as in Plain (only the edge heats on focus); the open tab never glows (user, 2026-10-28). *check (play and edit pairs per theme)*
4. **Vectors and CSS only** (user, 2026-10-28): decals SVG, frames CSS, textures vector lines and gradients, never pixels or filter noise (`feTurbulence`); generated textures come from a script (Forge: `tools/forge-textures.mjs`). **No texture inside a panel** (user, 2026-10-28: Forge's grain read as rocks behind item entries, then traits and resources): a theme's texture lives in the ground, the bars and the window's frame, never behind a panel's text. One OFL display font per theme may take the display style and headings (Forge: Grenze). Custom images later, not now.
5. **One look per theme** (user, 2026-10-28: "no difference between F&F light and dark ... default them to dark ... only worry about 1 style per style"): a theme draws the same in Foundry's light and dark modes (Forge is dark in both); contrast as §5.2 rule 9, and text over a texture holds 4.5:1 against its brightest and its darkest stroke, not only its ground (Claude, 2026-10-29, replacing "texture under text 16% at most": the Damascus redraw passed that unchecked). A theme sets `--fhcs-texture-hi` and `-lo` on the textured element, written by its texture script. *check* Plain keeps Foundry's light and dark, and the window's own mode decides, not the interface's around it (user, 2026-10-29: with windows set to light under a dark interface, the sheet stayed dark). *check (every theme in both of Foundry's modes, every width)*
6. **Motion** (user, 2026-10-28): answers to the player under 300ms; moments (a hit, a heal, inspiration gained or spent) about 600ms, once; ambient motion only slow (a banked mark's breathing glow); never more than three flashes a second; all still under the player's Motion switch and reduced motion. **A hover gleam follows the pointer** across a frame (user, 2026-10-28, replacing a gleam that ran across once; the sheet sets `--fhcs-gleam-x`), the portrait keeping its own. **A theme's effect starts where its event shows** (user, 2026-10-28: Forge's sparks fan from the inspiration mark struck). **A theme's big effects answer an event, never a timer** (user, 2026-10-28: Forge's sparks now spray only when inspiration is gained, replacing a burst every 70 to 120 seconds). **Every theme brings its own on and off moments for a toggle**, through the toggle's hooks (inspiration: `--fhcs-inspire-on`, `-off`, `-on-glow`, `-off-glow`; every other toggle, the one clicked, once its redraw lands: `--fhcs-toggle-on`, `-off`, `-off-fill`, Plain's inked in and erased, 2026-10-29).
7. **State art** (user, 2026-10-28): a theme's art follows the character's state, beside the marks that say it, never in their place: `--fhcs-hp` (0–1), `data-fhcs-hp` (full, bloodied, down), and a moment class when HP falls or rises.
8. **Layers:** a translucent plate with a blur is its own layer, so a plate holding an open tray rises above its neighbours; a tray sets its own ink, not the bar's it opens from.
9. **Self-contained:** one CSS file per theme (with its font and generated textures), so a theme can travel to the quest log later; not shared yet.
10. **Chat cards follow the world theme,** not the speaker's; a world setting keeps them plain.

### 5.4 Other sheets (Claude, 2026-10-29, from SCOPE §4.13 and the item sheet)

1. **Our own parts follow §5.0 to §5.3** (the item sheet's header and Description tab).
2. **dnd5e's forms get a skin, not a rebuild:** our tokens, type and spacing over their markup (Details, Activities, Effects, Advancement, the config windows). Their markup may mix more than three text styles; we don't promise otherwise.
3. **A sheet without a lock has no play mode,** so §5.2 rule 6 applies only where there is a lock. A sheet locks only where dnd5e's own character or NPC sheet does.
4. **Every window resizes,** with a least width (dnd5e's own) and a starting height.
5. **A part we replace keeps every control dnd5e's part had** (2026-10-29: the item header's rarity and units, the add button on Advancement). Before replacing one, list its fields and actions from dnd5e's template; draw a field we don't restyle with its own input (`DataField#toInput`, as `compat.fieldInput`).

## 6. Rolls and chat cards

### 6.1 What's wrong with dnd5e 6.0's cards (user's screenshot, 2026-10-23)

The roll type ("Intelligence Saving Throw") is the faintest text; the natural die is a small grey circle; success or failure is never written; a concentration request and its save are separate cards; Apply damage hides behind a `>` chevron; dice, play and undo are about 16px unlabelled icons; item tags outweigh the item name; every card repeats speaker, time and ⋮.

### 6.2 Ready Set Roll (to recapitulate)

Ready Set Roll for D&D5e (MangoFVTT) is verified only to Foundry 13; issues report it broken on v14 (April 2026). A community fork, RSReforged, carries it on; its dnd5e 6 release (6.0.0) is labelled experimental, and several forks disagree on which is canonical. Same story as Forien's Quest Log and Tidy Classic.

What the table uses (user, 2026-10-23), and where dnd5e 6.0 already has it (checked in its source):

| Need | dnd5e 6.0 | Our work |
|---|---|---|
| Quick roll with advantage or disadvantage | Yes: Shift skips the dialog, Alt advantage, Ctrl disadvantage (`module/settings.mjs`, rebindable) | Make it visible: say the keys in the tips panel; consider Adv / Dis buttons on the sheet |
| Late advantage or disadvantage on the card | **No** | **Build it:** Advantage / Disadvantage buttons on a d20 card roll one more d20 and update the same card, both dice shown, the dropped one struck through |
| Roll damage button | Yes: `rollDamage` on activity cards | Label and size it |
| Roll save for selected | Yes: `rollSave` button; the targets tray switches between selected and targeted tokens (`recorded-targets.mjs`) | Label it, open the tray in "selected" mode (§6.6) |
| Apply damage or effects to selected | Yes: damage and effect application trays, same selected / targeted switch | Unhide them (today behind a `>` chevron), "selected" mode, labelled buttons at least 24px |

So Track R is mostly presentation over dnd5e's own buttons; late advantage is the one new mechanic. How RSR built its cards and why it broke on 6.0: `docs/research/ready-set-roll.md`.

### 6.3 Table feel

The user's principle (2026-10-23): keep a pencil-and-paper feel. A card should read like what someone says at the table, and actions stay in the players' and GM's hands. Show the dice; never auto-apply damage, saves or effects; every step is a button someone chooses to press.

### 6.4 Fewest clicks: no held keys, no pop-up windows

The user's rule (2026-10-23): the chat card holds everything; nobody holds a key or answers a Foundry dialog. How, against dnd5e 6.0 (checked in its source):

- **Roll dialogs:** every roll fires the generic `dnd5e.preRoll` hook first (`dice/basic-roll.mjs`); setting `dialog.configure = false` there skips the dialog for all rolls. Advantage moves to the card (late advantage), so Alt and Ctrl are never needed.
- **Damage on the same card:** Roll damage adds the damage to the attack's card instead of posting a new one; a critical hit doubles the dice without asking. Apply buttons sit under it.
- **Saves on the same card:** Roll save for selected lists each token's result on the card that asked, with success or failure against the DC in words; concentration requests and their saves the same. dnd5e 6.0 already does the listing (its "summarize chat" setting, on by default, `docs/research/dnd5e-6.0-chat.md`); we add the words.
- **Activity dialogs stay** (user, 2026-10-23): the spellcasting window (slot level, concentration, consumption; `_requiresConfigurationDialog`, `documents/activity/mixin.mjs`) and the chooser for items with several activities are expected. We don't skip them.
- **Late bonuses on the card** (user, 2026-10-23): a "+ bonus" control on any roll on the card adds a flat number or a die roll (a late Bless d4, a Bardic Inspiration d8) to that roll's total. The added part shows as its own term, so everyone can see what changed. Same for damage rolls.

### 6.5 The card: one card per action (user, 2026-10-23)

Ready Set Roll's format is the target, rebuilt on dnd5e 6.0's model: every roll stays a real message linked to the item's usage card (`system.origin`), drawn as a band inside that card, its own card hidden. The first slice (an outcome line added to dnd5e's cards) changed too little; the card's layout must carry the meaning.

Top to bottom, each part only when the action has it:

1. **Header:** the acting actor's portrait, large; the action's title (item name, activity under it).
2. **Description:** folded; click to unfold.
3. **d20 band**, full width: the total, both d20s (the dropped one struck through), natural 1 or 20 and hit or miss in words. Click to open the dice math and late adds: Advantage, Disadvantage, + Bonus.
4. **Damage band**, full width: the total by damage type. Click to open the dice math, every die shown ("(3 + 2) + 0 = 5", never "5 + 0"; user 2026-10-24) and any die rerolled or dropped named. A critical hit doubles the dice without asking; "Roll as normal" undoes it.
5. **Save / check band**, full width: "Dexterity save, DC 15" and a button to roll for selected tokens; one row per token with its result in words, filling in as rolls arrive. On-hit riders (a Topple save, an opposed check) sit here inside the attack's card.
6. **Apply:** a folded panel (user, 2026-10-24) holding damage and attached effects through dnd5e's own trays, labelled, at least 24px.

Buttons and band contents are centered (user, 2026-10-23). A band's heading sits on its own top line, left, with the open/closed mark right; side columns squeezed the words to a few letters per line at 240px.

Panels the player opened stay open when the card re-renders (a re-roll, a late die, a bonus; user 2026-10-24). Buttons keep one size and one place on every band and every roll (user, 2026-10-24): a two-column grid (bonus field and + Bonus; Roll again and a Critical switch with a check box, or an empty cell), a band's words always two lines tall, notes below the buttons. Inside an open band the buttons sit right under the current roll's math, and earlier rolls follow in their own scrolling box, newest first, about five lines tall, so repeated re-rolls never move the buttons. A save band's token rows scroll the same way past about five.

The same frame serves every roll: a skill check from the sheet is header plus d20 band; a GM request is header plus the check band. The card updates in place when a later roll arrives.

### 6.6 Settings, selection and targets (user, 2026-10-23)

- **Roll on use:** using an item rolls its attack and its damage into the card at once. Each is a world setting, on by default; off makes it a button in its band. Damage follows every attack made from the card (doubled on a critical), and a save spell's damage rolls right after it is cast.
- **No roll dialogs:** world setting, on by default. Holding dnd5e's skip-dialog key (Shift) brings the window back for a one-off bonus; the spellcasting and activity-choice windows still ask.
- **Every added d20 is rolled when it's added** (user, 2026-10-28, replacing "always roll two d20s", which rolled one in advance: the card showed it as "Next d20 ready: 4", and the message's data kept it where a player could read it before choosing advantage). The setting is gone; the odds are the same.
- **The d20 row** (user, 2026-10-23; revised 2026-10-24): the primary die in the center, a black d20; disadvantage dice to its left, outlined red; advantage dice to its right, outlined blue. Every die and add slot is a d20 silhouette of one size. In dark themes the default die is white and numbers on filled dice dark (contrast, user 2026-10-24); dropped dice keep full color, marked by a dashed outline and strike-through. Each side's cell, right beside the primary die, starts as a dashed d20 marked − or +; once a die lands there, that side's newest die takes the cell and is the add button (a small − or + badge on it), so the latest result sits next to the primary and the button never moves (user, 2026-10-24). Older dice move to a tray below, disadvantage left and advantage right. A side with five dice shows its newest die, no longer a button. **Click order decides:** each die added is compared with the die counting at that moment; advantage keeps the higher, disadvantage the lower. Nothing cancels, so the table makes the call and the card doesn't adjudicate. Elven Accuracy is two clicks on the advantage side. The die that counts is filled; the rest are struck through.
- **Who can click:** a card's author uses its rolls, late adds and saves; the GM uses every card. Foundry lets a player control and change only what they own, so a player's Apply reaches their own tokens (healing themselves); damage to enemies is the GM's click.
- **Selected tokens, not targets.** Player targeting is too unreliable to drive anything. Apply buttons and "roll for" buttons act on selected tokens: in practice the GM's selection. A player's targets may show as information (the hit or miss against each); nothing happens automatically because of them. dnd5e's trays open in "selected" mode, said in words.

### 6.7 Polish (user, 2026-10-28)

- **Each damage type its own total:** the damage band splits a roll as dnd5e's Apply does (`aggregateDamageRolls`): radiant dice in a slashing roll read "9 Slashing · 6 Radiant" under the total, not all as slashing.
- **What Apply did stays on the card:** one line per target and click under an "Applied" heading, open, whatever is selected or targeted next: "Dire Wolf takes 9 slashing", "Dire Wolf takes 15: 9 slashing, 6 radiant", "Kira heals 7", "Bless on Kira". Saved on the usage card (`flags.fhcs.applied`), so only the card's author or the GM leaves a line; our HP tray leaves none. No undo.
- **Hits against targets** come from the targets dnd5e recorded at the attack roll, which don't follow later targeting; a report of the hit line changing waits on a before-and-after screenshot.
- **Later (Phase 7 list):** an effect that turns every incoming damage type into one (dnd5e's `preCalculateDamage` hook, an actor flag set by the effect).

## 7. Open questions

- Shared themes with the quest log, or Light and Dark first?
- Which sheet-changing modules matter at the user's table?
- Does the "Now" strip live in the header, a tab, or both?
