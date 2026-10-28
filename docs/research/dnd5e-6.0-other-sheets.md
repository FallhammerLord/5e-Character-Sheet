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
