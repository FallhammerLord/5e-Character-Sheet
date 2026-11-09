# dnd5e 6.0.6: the other sheets (2026-10-28)

What's left after the character sheet: dnd5e's other document sheets and its smaller windows. Read from tag
`release-6.0.6` (`module/applications/`, `dnd5e.mjs:171–260`) and Tidy Classic's tag `v13.0.0` (`src/sheets/classic/`).

## The sheets

| Sheet | dnd5e class (base) | Default size | Tabs (dnd5e's part IDs) | Own actions |
|---|---|---|---|---|
| NPC | `NPCActorSheet` (`BaseActorSheet`, as the character's) | 700 × 700 | features, inventory, spells, effects, biography, specialTraits; header and a collapsible sidebar | `editDescription`; shares the base actor actions (`roll`, `rest`, `showConfiguration`, `togglePip` for legendary actions, `showArtwork`) |
| Vehicle | `VehicleActorSheet` (`BaseActorSheet`) | 700 × 800 | inventory (Cargo), crew (only with crew), effects, description; a stations part | `adjustCrew`, `browseActors`, `createItem`, `removeMember`, `toggleEditInline`, `uncrew`, `useItem` |
| Group | `GroupActorSheet` (`MultiActorSheet`) | 700 × 700 | members, inventory, effects, biography | `award`, `changePace`, `roll`, `toggleInventory` |
| Encounter | `EncounterActorSheet` (`MultiActorSheet`) | 500 × auto | members, inventory (Loot), description | `award`, `browse`, `decrease`, `increase`, `rollQuantities`, `rollQuantity` |
| Item (every type: weapon, equipment, consumable, tool, loot, spell, feat, class, subclass, species, background, facility) | `ItemSheet5e` (`PrimarySheetMixin(DocumentSheet5e)`, not an actor sheet) | 500 wide | description, details (once identified), activities, effects, advancement, each only when the item has some | `addRecovery`, `deleteCraft`, `deleteDocument`, `deleteRecovery`, `editDescription`, `modifyAdvancementChoices`, `showConfiguration`, `showDocument`, `showIcon`, `toggleState` |
| Container | `ContainerSheet` (`ItemSheet5e`) | as item | contents first, then the item's tabs | the item's, plus the inventory element's |

Details differ per item type: `templates/items/details/details-*.hbs`, one per type (16), plus shared parts.

## What carries over from the character sheet

- **NPC and vehicle share the character's base** (`BaseActorSheet`): the same `_prepare…` helpers, the same
  `dnd5e-inventory`, `item-list-controls` and `dnd5e-effects` elements, and for the NPC the same tab parts
  (`actor-features`, `actor-inventory`, `creature-spells`, `actor-effects`). Our compat functions and tab templates for
  Inventory, Spellbook, Features and Effects should serve the NPC with little change; the header is the new work
  (CR, XP value, legendary actions and resistances as pips, lair, HP formula).
- **Group and encounter** (`MultiActorSheet`) are lists of actors with an inventory; our Inventory tab may serve their
  inventory part.
- **The item sheet is a different base:** one class for every type, a 500px window, its body a form of fields per type.
  Little of our code carries over beyond styles, tokens, themes and the title bar.
- **Limited views:** `BaseActorSheet.LIMITED_PARTS` (base-actor-sheet.mjs:110) draws a cut-down sheet for a player with
  limited permission; nothing to do for us (user, 2026-10-28: every user sees the sheet's chosen styling).

## The smaller windows ("the rest")

Every dnd5e window is an AppV2 with the `dnd5e2` class: the active effect sheet, activity sheets
(`applications/activity`), advancement and its config windows, the actor config windows our gears open (AC, HP,
abilities, skills, traits), rest dialogs, the award and currency windows, the compendium browser. Restyling them is
a skin (our tokens, type and spacing over dnd5e's markup), not a rebuild; a skin can't promise our three text styles
where dnd5e's markup mixes more.

## Chat cards

Ours already (Track R); left from Phase 6.6: cards in the world theme, with a world setting to keep them plain
(SCOPE §5.3 rule 10).

## The item sheet, closer (2026-10-28)

- **dnd5e's header** (`templates/items/header.hbs`): the icon (`editImage` / `showIcon`), the name (a field when
  editable), type-specific subtitles (fields in edit mode, words otherwise; hidden while unidentified), and for physical
  items quantity, weight and price (price only once identified, or for the GM).
- **dnd5e's body:** description, details (one template per type, `templates/items/details/details-*.hbs`, 16 of them,
  built from `formInput` and dnd5e's helpers), activities, effects, advancement; 1,312 lines of templates in all.
- **Tidy Classic** (`src/sheets/classic/item/`): one sheet per type sharing parts. Header: the picture, the name, the
  type, a summary line (type, rarity, source), and toggles (equipped, attuned, identified). Description tab: a narrow
  left column of properties (quantity, weight, price, property tags) beside the description. Details tab: the type's
  form, with shared field parts (activation, damage, duration, range, targets, uses).

## What a replaced item part must keep (2026-10-29)

- **Header-only fields:** `context.subtitles` entries with a `field` (a physical item's `rarities`, a SetField; a
  feature's `requirements`), and the physical item's `weight.units` and `price.denomination` selects
  (`templates/items/header.hbs`). The Details tab doesn't hold them.
- **Descriptions:** `description.value`, `unidentified.description` (GM, identifiable items) and `description.chat`
  (owner, or set), enriched in `context.enriched` (`item-sheet.mjs:336`).
- **The add button:** `PrimarySheetMixin._onFirstRender` appends `.create-child` (`addDocument`) to the window; dnd5e's
  CSS shows it only on `tab-inventory`, `-features`, `-spells`, `-effects`, `-advancement`, `-activities`, `-crew`,
  `-changes` (`less/v2/sheets.less:304`), the class `changeTab` puts on the window. `_addDocument` opens the dialog
  for the open tab.

## The NPC sheet, closer (2026-11-09)

Read from `release-6.0.6`: `module/applications/actor/npc-sheet.mjs`, `templates/actors/npc-header.hbs`,
`npc-sidebar.hbs`, `tabs/npc-biography.hbs`, `module/data/actor/npc.mjs`; Tidy Classic `v13.0.0`
`src/sheets/classic/npc/` and `src/runtime/actor/NpcSheetClassicRuntime.svelte.ts`.

**Window and parts.** `NPCActorSheet` (`BaseActorSheet`), 700 × 700, classes `npc`, `vertical-tabs`. Parts: `header`,
`sidebarCollapser` and `sidebar` (container `main-content`), `features`, `inventory`, `spells`, `effects`,
`biography`, `specialTraits`, `warnings`, `tabs`. **No `details` part:** an NPC's skills, senses and traits live in
the sidebar. `TABS` (static, read by `_getTabs` in primary-sheet-mixin.mjs:216): features, inventory, spells, effects,
biography, specialTraits; the first tab is Features (`tabGroups.primary`). A tab of ours needs an entry in `TABS` and
a part of the same ID; dnd5e prepares no context for an ID it doesn't know, so our part builds its own.

**Header context** (`_prepareHeaderContext`): `portrait`, `abilities`, `classes`; `legact` and `legres` as pip lists
(`togglePip` on `system.resources.legact.spent` / `legres.spent`, `data-n` counting down from max − 1); `hasLegendaries`;
`showDeathSaves` (important and at 0 HP, play mode); `showInitiativeScore` (modern rules); `showLoyalty` (important,
the `loyaltyScore` setting, GM only); `showRests`. XP is written into the frame after render (`.header-elements
.cr-xp`, from `_renderFrame` and `_onRender`): our dropped header controls must not lose it, or we draw XP ourselves.

**Header markup dnd5e's code relies on:** name (`name`); size (`system.traits.size` select); creature type
(`showConfiguration`, `data-config="creatureType"`); alignment (`system.details.alignment`); CR (`system.details.cr`,
a text field: `_processFormData` turns "½", "1/4", "—" and blank into numbers or null); proficiency (read only, from
CR); rests (`rest`, `data-type`); AC (`armorClass` config); Init (`roll` `initiative`, edit mode `initiative` config;
modern rules add the initiative score); HP (`hp.value` meter, `hitPoints` config, `hp.temp`, `hp.tempmax`); abilities
as the character's (`ability-check`, `saving-throw`, `proficiency-cycle`, `ability` config); death saves for an
important NPC at 0 HP; loyalty (`system.attributes.loyalty.value`). Edit mode: legendary actions and resistances max
(`system.resources.legact.max`, `legres.max`), and the lair: modern rules a "has lair" checkbox
(`system.resources.lair.value`), legacy rules its initiative (`lair.initiative`). Play, modern: a slide toggle "in
lair" (`lair.inside`), which raises XP (CR + 1) and legendary actions and resistances by one each (npc.mjs:377).

**Sidebar context** (`_prepareSidebarContext`): hit dice for an important NPC only (display; dnd5e's TODO to roll it);
speed (every movement type with a value, hover, special); skills (only proficient, in the `defaultSkills` setting, or
with a bonus); senses plus passive Perception; resistances, immunities (damage and condition), vulnerabilities,
damage modification, languages; habitat and treasure (`showConfiguration` `habitat`, `treasure`: NPC-only config
windows); gear (items with the `gear` property and a quantity; `showDocument`, drags as gear). All drawn with
`dnd5e.actor-trait-pills`. Our `attributesFacts` reads the same base helpers (`_prepareTraits`, `_prepareSenses`,
`_prepareSkillsTools`, base-actor-sheet.mjs:521–662); only `_prepareFavorites` is the character sheet's (627).

**Features tab:** sections by activation type (`CONFIG.DND5E.activityActivationTypes`, passive ones folded into
"Features" first), an item's section its first activity's activation type, or passive for the `trait` property
(`ctx.group`, set in `_prepareItem`). Weapons are listed here as well as in Inventory. Filters: action, bonus,
reaction, legendary, lair; manual or alphabetical sort; columns recovery, uses, roll, formula. **No `groups` or
origin grouping:** our `featuresFacts` reads `section.groups` and `ctx.groups`, so the NPC needs its own path.

**Spells:** the shared `_prepareSpellbook`; one spellcasting entry ("Spellcasting (class or NPC)"): `level` (the
class's levels, else `attributes.spell.level`, default max(CR, 1)), `ability` (the class's, else
`attributes.spellcasting`), `attack`, `save`, `noSpellcaster`, `concentration`. No preparation max. Our
`spellbookFacts` already maps this shape to its class cards; the caster level and the ability choice are new.

**Biography:** ideals, bonds, flaws (`dnd5e.biography-textbox`); public (`system.details.biography.public`) and
details (`biography.value`), each opened for editing by `editDescription` (`data-target`), a compact `prose-mirror`.
No appearance, trait or characteristics fields: those are the character's.

**Special Traits** adds an NPC section first: identifier, important, price (value and denomination).

**Data an NPC has and a character doesn't:** `traits.important` (or any class: hit dice, death saves, loyalty),
`attributes.hp.formula` (gives the hit dice: npc.mjs:364), `details.cr`, `details.xp.value` (from CR), `prof` (from
CR; null when CR is), `details.type`, `details.habitat`, `details.treasure`, `details.source`, `resources.legact`,
`legres`, `lair`, `attributes.spell.level`, `attributes.spellcasting`, `attributes.loyalty`, `attributes.price`.
**A character's and not an NPC's:** favorites, inspiration, the three legacy resources, XP progress and levelling,
species and background cards, the bastion. Exhaustion is both (creature attributes, attributes.mjs:159).

**What of ours carries.** `makeCharacterSheet(Base)` is written against `BaseActorSheet`'s methods, so most of it fits
`NPCActorSheet`. Character-only pieces: `headerFacts` (classes, level order, XP progress, inspiration, hit dice),
`attributesFacts`' favorites and resources, the tab row's inspiration bar, `featuresFacts`' grouping,
`biographyFacts`' fields. Parts to drop: `sidebarCollapser`, `sidebar` (as the character's `sidebar`). Inventory,
Effects and Special Traits should serve as they are.

**Tidy Classic's NPC sheet:** the character's header with NPC facts: portrait with HP under it (a HP formula roller
in edit mode), rests, loyalty; the name row with XP and a CR badge; the origin line "size • type (habitat icon) •
alignment • source" and proficiency; movement and special saves; the stats row (AC, Init, abilities). Tabs: Actions
(optional), Abilities (skills and traits beside legendary actions, then features by activation with Uses and Usage
columns), Spellbook, Effects, Biography, Journal, Inventory, Special Traits.
