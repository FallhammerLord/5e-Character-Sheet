# Scope

The design and every decision. Skeleton: sections fill in as decisions are made.

## 1. What this is

A Foundry VTT v14 module (ID `fhcs`, CSS prefix `fhcs-`) adding a character sheet for dnd5e 6.x. It extends dnd5e's own sheet class: the system keeps doing every mechanic; we own layout, templates and styles.

## 2. Who it's for

The user's table first: players used to Tidy 5e's classic layout. Public release later.

## 3. Decisions

- **Extend, don't rebuild** (2026-10-22): subclass `CharacterActorSheet`; reuse dnd5e's custom elements (`dnd5e-inventory` and others) where they fit.
- **Characters only** to start; NPCs and vehicles keep dnd5e's sheets.
- **Offered beside dnd5e's sheet**, never forced as the default.

## 4. Layout

Target: Tidy 5e Classic, as in `docs/reference/` (screenshots) and its source at Tidy commit `54fdbad4` (the last before Classic was removed, 2026-09-01; `src/sheets/classic/character/`). Default window 740 × 810.

### 4.1 Header

- **Portrait** (round, about 150px) down the left edge. On it: exhaustion (top left), inspiration (top right), rest button (bottom left), HP bar (bottom center), hit dice left (bottom right). Under it: Temp and Max HP.
- **Beside it, in rows:**
  1. Name (large small caps); on the right: XP bar with current / next, level badge, ⋮ menu.
  2. Classes and subclasses ("Cleric 12 Life Domain").
  3. Origin line: size • creature type • species • background • alignment; on the right: Proficiency bonus.
  4. Speed.
  5. AC shield badge, then Initiative, then six ability columns. Each column: abbreviation, score (large), boxed modifier and save, save proficiency.

### 4.2 Tabs

Across the top, under the header: Actions, Attributes, Inventory, Spellbook, Features, Effects; Biography and Journal optional. Players choose and order them (Classic's tab selection window). Sheet lock at the far right of the tab row.

### 4.3 Attributes tab

- **Side panel** (about 240px, left): skills list (proficiency, name, ability, modifier, passive), then traits (senses, languages, damage immunities, resistances and vulnerabilities, condition immunities, weapon, armor and tool proficiencies).
- **Main panel:** pinned and favorite items, grouped (Inventory, Spell Level N with slots used / total). Columns: name, uses, spell components, activation (1 Action, 1 Bonus Action).

### 4.4 Actions tab

Everything usable, grouped by Action, Bonus Action, Reaction, Other. Each row: icon, name with a small subtitle (type, spell level and school), uses, range and target, hit or DC, damage, roll.

### 4.5 Where we change Classic (ADHD rules)

Keep the layout players know; fix what costs attention:

- **Gear and pencil icons only in edit mode.** Classic shows about 30 of them in play; each is a target under 24px.
- **Equipped and prepared** get an icon or label as well as the green and blue row color (color alone fails the colorblind player).
- **Actions tab is the "Now" home** (Phase 7): it's already grouped by action type, so turn economy fits there. Make it the default tab in play.
- **Targets at least 24px**, three text sizes, tooltips two to four words.
- **Pinned header:** HP, AC and conditions never scroll away.

## 5. ADHD rules carried over

From the quest log and Initiative: three text sizes; buttons at least 24px; tooltips two to four words, details in a tips panel; play and edit modes; one main action per area; plain words, no blame or counters; reduced motion; colors only through tokens.

## 6. Open questions

- Shared themes with the quest log, or Light and Dark first?
- Which sheet-changing modules matter at the user's table?
- Does the "Now" strip live in the header, a tab, or both?
