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

## The container sheet, closer (2026-11-10)

dnd5e 6.0.6 `module/applications/item/container-sheet.mjs`; Tidy Classic v13.0.0 `item/ContainerSheet.svelte`,
`item/tabs/ItemContainerContentsTab.svelte`.

- **Class:** `ContainerSheet extends ItemSheet5e`, so our `makeItemSheet` can wrap it as it wraps the item sheet
  (`dnd5e.applications.item.ContainerSheet`). Same header, description, details, effects parts; one more part,
  `contents` (`templates/items/contents.hbs`: one `dnd5e-inventory` around dnd5e's inventory partial).
- **Tabs:** Contents first (`DND5E.ITEM.SECTIONS.Contents`), only when `item.system.canViewContents` (GM, identified,
  or no `unidentifiedContents` property); then the item's tabs. `tabGroups.primary = "contents"`.
- **Context (`_prepareContentsContext`):** `items` from `await item.system.contents` (a Collection; a promise in a
  compendium); per item `itemContext[id]` with `totalWeight`, `isStack`, `expanded`, and for a nested container its
  `capacity` and `clickAction: "view"`. Sections: every item type's `inventorySection` (columns price, weight,
  quantity, controls; a container's capacity, controls), plus dnd5e's `contents` section. `encumbrance` is
  `await item.system.computeCapacity()` (`value`, `max` Infinity when unset, `units` "Items" when by count, `pct`,
  `hidden` when the user can't view contents). `currency` is the container's own `system.currency`; `listControls`
  is the inventory's (search, filters, sort).
- **The inventory element in an item sheet:** `document` is the container (`app.inventorySource ?? app.document`),
  `actor` its owner or null; `getItem(id)` goes through `container.system.getContainedItem(id)`. `canUse` needs an
  owning actor: a world or compendium container's rows can be opened, not used.
- **Drag and drop:** the sheet's own `_onDragStart` / `_onDrop` (items and folders; recursion refused; a spell
  becomes a scroll; consumables stack through the owner's sheet; `_onSortItem` sorts by the rows' DOM order inside
  `[data-item-id]`'s parent). `_onRender` sets `data-item-id` on the `dnd5e-inventory` element to the container's id.
- **Filters and sort:** `_filters.inventory`, `_filterChildren('items')` over the cached `_items`, `_sortChildren`.
  Our rows keep `[data-item-id]` and the list keeps `[data-item-list="inventory"]`, so these carry over.
- **No equip, attune or favorite** columns: an item in a container is neither worn nor at hand. dnd5e shows price,
  weight and quantity.
- **Tidy Classic:** the item header (picture, name, type, rarity, source, toggles), then Contents, Description,
  Details, Effects. Contents: the utility bar (search, filters, sort), sections by type, nested containers inline,
  then the capacity bar and the currency.
- **Our Inventory tab and the container:** `compat.inventoryFacts` reads the actor's items, attunement and
  encumbrance. A container needs its own facts: rows from `item.system.contents` (nested through
  `getContainedItem`/`contents`, which works off an actor too), capacity in Carried's place, the container's coins.
  `src/sheet/inventory.js` and `item-row.hbs` can serve unchanged with equip, attune and favorite off.
- **The inherited tabs** (checked 2026-11-10, item-sheet.mjs:96, 1131–1168): `ContainerSheet.TABS` is Contents plus
  `ItemSheet5e.TABS`, each with its condition. For a container: Description always; Details once identified (or GM);
  **Activities never**, since `ContainerData` has no activities template (no `activities` in its system); Effects only
  when it already holds one (`metadata.hasEffects: null` → `item.effects.size > 0`); Advancement never. Our
  `makeItemSheet` passes `Base.TABS` through, so wrapping `ContainerSheet` keeps these as they are.

## The group sheet, closer (2026-11-10)

dnd5e 6.0.6 `module/applications/actor/group-sheet.mjs`, `api/multi-actor-sheet.mjs`, `templates/actors/group/*.hbs`;
Tidy Classic v13.0.0 `group/GroupSheet.svelte`, `group/tabs/*`, `group/parts/*`.

- **Class:** `GroupActorSheet extends MultiActorSheet extends BaseActorSheet`, the character's base: edit mode and
  its lock, `_prepareEffectsContext`, the inventory helpers. Exposed as `dnd5e.applications.actor.GroupActorSheet`.
  700 × 700. Tabs `members` (first), `inventory`, `effects`, `biography`; parts `header`, `tabs` (horizontal), the four
  bodies in a `tab-body` container.
- **Header (`group/header.hbs`):** portrait (`editImage` in edit mode), name; buttons `placeMembers` and one `rest`
  per `CONFIG.restTypes` (`data-type`); a Travel card: `travelPace` (`system.getTravelPace()`: `pace.label`,
  `pace.available`, `pace.slowed`, `paces.land/water/air`), `changePace` with `data-increment` ±1 in play, a
  `showConfiguration` gear (`data-config="movement"`) in edit mode; an Advancement card: `award` (trophy), the XP pool
  (`system.details.xp.value`, a field in edit mode, hidden when `levelingMode` is `noxp`) and the average level
  (`system.level`).
- **Members (`_prepareMembersContext`):** sections `character`, `npc`, `vehicle` by `actor.system.groupSection`, each
  sorted by name. Per member: `uuid`, `name`, `img`, `portrait` (token art when the group's
  `flags.dnd5e.showTokenPortrait`), `canView` (LIMITED), `hiddenStats` (not OBSERVER: HP and stats hidden), `classes`,
  `encumbrance`, `skills` (each `total`, `passive`, `css` rollable for an owner, `label`). The row (`member.hbs`,
  `li.member[data-uuid]`): portrait, name (`showDocument`), HP and HD meters, a vehicle's AC / DT / speed pills, in
  edit mode `removeMember`, else class icons; characters and NPCs add AC, walk speed (slowed mark), and Perception,
  Stealth and Survival (`data-action="roll" data-type="skill" data-key`, the travel pace passed to the roll), each
  with its passive. A context menu on `.member[data-uuid]`: View, Remove, Set or Unset primary vehicle.
- **Inventory:** `BaseActorSheet._prepareInventoryContext` on `inventorySource` (the group, or its primary vehicle
  when `flags.dnd5e.inventorySource` is `"vehicle"` and the user owns it; the `toggleInventory` split button is drawn
  into the currency after render, `_renderInventoryToggle`). A sidebar card per member (not the source): carried
  meter (`hiddenStats` hides its numbers), portrait, name, coins. `_onDropItem` onto a `[data-uuid]` member gives the
  item to that member. Only physical items drop (`_onDropCreateItems`). Currency edits go to the vehicle when it's the
  source (`_onChangeForm`, reading `data-name`).
- **Effects:** the actor's `actor-effects.hbs`, as ours. **Biography:** `system.description.summary` and `.full`,
  each with an `editDescription` feather opening one `prose-mirror` (`editingDescriptionTarget`).
- **Life-cycle:** the sheet registers itself in each member's `apps`, so a member's change redraws it.
- **Tidy Classic:** the header shows a summary line (members, level), movement and XP, and GM buttons (rests, award,
  place); Members has a search bar, a GM panel of the group's languages and skills, and rows of portrait with HP,
  name, AC shield, senses, condition immunities, Perception and the top skills; Inventory and Description follow.

## The encounter sheet, closer (2026-11-10)

dnd5e 6.0.6 `module/applications/actor/encounter-sheet.mjs`, `templates/actors/encounter/*.hbs`,
`module/data/actor/encounter.mjs`; Tidy Classic v13.0.0 `encounter/EncounterSheet.svelte`, `encounter/tabs/*`.

- **Class:** `EncounterActorSheet extends MultiActorSheet` (the group's base, so the character's base too: lock, edit
  mode, inventory helpers). `dnd5e.applications.actor.EncounterActorSheet`. **500 wide, height auto, not
  resizable**, its position never saved (`_saveSheetPosition` is empty). Tabs `members` (first), `inventory` (labelled
  Loot), `description`; parts `header`, `tabs`, the three bodies.
- **Header (`encounter/header.hbs`):** portrait (`editImage` in edit mode), name (a field in edit mode), subtitles: the
  difficulty word (`system.getDifficulty()` against the world's primary party; Low, Moderate, High), and buttons
  `rollQuantities` (roll every formula), `placeMembers` (always interactive), `award` (the encounter's XP and coins to
  the party).
- **Members (`_prepareMembersContext`):** NPCs only, sorted by name. Each `.member[data-uuid][data-index]`: portrait,
  name (`showDocument`), subtitle "size • type • N XP", the CR badge in play; the quantity formula (λ, a field
  `data-name="quantity.formula"` in edit mode, shown in play only while no count is rolled); the count (edit mode:
  − and + `data-action="decrease"/"increase"` on `.member .adjustment-button`, a field `data-name="quantity.value"`
  between; play: the number); edit mode `removeMember`; play `rollQuantity` (one formula). Edit mode or no members:
  "Add creature" (`browse`, dnd5e's compendium browser on NPCs). The foot: the XP total as a meter against the party's
  thresholds (`difficulty`: `value`, `max` the High threshold, `pct`, `stops.low`, `stops.high`).
- **Writing a member:** `_onChangeForm` and `_onChangeInputDelta` read the field's `data-name` and its row's
  `data-index`, then write the whole `system.members` array; the row needs both attributes.
- **Loot (`inventory`):** the actor-inventory part with the container's columns (price, weight, quantity); `_prepareItem`
  drops activities, `_prepareItemPhysical` drops equip and attunement. Coins are the encounter's own.
- **Description:** the group's biography template (Summary, Description).
- **Tidy Classic:** header with name, a summary, the XP, and GM buttons (Roll quantities, Award, Place members);
  Members, Inventory, Description tabs.

## The vehicle sheet, closer (2026-11-10)

dnd5e 6.0.6 `module/applications/actor/vehicle-sheet.mjs`, `templates/actors/vehicle/*.hbs`; Tidy Classic v13.0.0
`vehicle/VehicleSheetFull.svelte`, `vehicle/tabs/*`, `vehicle/parts/*`.

- **Class:** `VehicleActorSheet extends BaseActorSheet` (the character's base). `dnd5e.applications.actor.VehicleActorSheet`.
  700 × 800, `vertical-tabs`. Parts: `sidebarCollapser`, `sidebar`, `stations` (always shown, outside the tabs), `tabs`
  (sidebar tabs, right), and the tab bodies `inventory` (Cargo, first), `crew` (Crew & Passengers, only when
  `vehicleHasCrew`), `effects`, `description`. Items it won't take: background, class, facility, race, spell, subclass.
- **Display options** (edit mode switches in the sidebar): `flags.dnd5e.showVehicleAbilities`, `showVehicleInitiative`,
  `showVehicleQuality`, and `system.attributes.actions.stations` (actions come from crewed stations, not a count).
- **Sidebar (`vehicle/sidebar.hbs`):** portrait (`editImage`; `showArtwork`), initiative (roll; a gear in edit mode)
  and quality (a field in edit mode) when shown; action pips (`togglePip` on `system.attributes.actions.spent`) when
  actions are a count; name; type (`CONFIG.vehicleTypes`, a select in edit mode); in edit mode the action count and
  its three crew thresholds; HP (value / max, edited inline with `toggleEditInline`; DT and mishap threshold as pills;
  `hitPoints` gear); AC (`armorClass`); combat speed (`movement` gear; hover), travel speed (per hour), travel pace (per
  day); cost (value and denomination); size; weight, keel, beam (value and units); cargo capacity; crew and passenger
  maximums; resistances, immunities, condition immunities, vulnerabilities (trait pills).
- **Stations (`vehicle/stations.hbs`, `data-area="draft"`):** the abilities grid when shown (proficiency cycle, score,
  mod, save, gear); features in dnd5e's inventory element by activation (Features, Bonus, Reaction; columns uses and
  controls); draft animals (`.station.drafted[data-uuid]`: name, "size • type • pulls N", `removeMember` in edit
  mode); action stations, the mountable items (`.station[data-item-id][data-uuid]`, its own context menu): name with
  cover, AC and DT (`useItem`), a weapon's attack and damage enriched, HP and uses bars (inline-edited, `data-name`),
  speed, crew slots (`.slot[data-index]`, a portrait or empty; `uncrew` in edit mode); in edit mode four drop areas:
  `createItem` feat, equipment (vehicle), weapon (siege), and `browseActors` for draft animals.
- **Cargo:** the base inventory on the vehicle, with `encumbrance` from `system.getEncumbrance()` (its cargo).
- **Crew & Passengers (`vehicle/crew.hbs`):** `data-area="crew"` unassigned (or all crew) and assigned, and
  `data-area="passengers"`; each `.crew[data-uuid]` (draggable; `showDocument`) with a quantity: − and +
  (`adjustCrew`, `data-delta`) around a `.crew-quantity` field and a hidden diff, or "× N". Drop zones when empty.
  Actors dropped go to the area under the pointer (`_onDropActor`), onto a station to crew it.
- **Description:** one editor, `system.details.biography.value`.
- **Tidy Classic:** a header with profile, HP, AC, movement and the damage and mishap thresholds; tabs Attributes
  (stations and features), Cargo, Crew & Passengers, Description.
