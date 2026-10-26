# dnd5e 6.0 character sheet: what ours builds on

Read from the dnd5e repository (system.json 6.0.6, verified on Foundry 14), 2026-10-22. Phase 0 started this note; Phase 0 finishes it.

## Class chain

`CharacterActorSheet` (`module/applications/actor/character-sheet.mjs`, 1351 lines)
→ `BaseActorSheet` (`actor/api/base-actor-sheet.mjs`, 2247 lines)
→ `PrimarySheetMixin` (`applications/api/primary-sheet-mixin.mjs`: Play/Edit modes, `MODES.PLAY = 1`, `MODES.EDIT = 2`)
→ Foundry's ApplicationV2 document sheet.

Reached at runtime as `dnd5e.applications.actor.CharacterActorSheet` (the `dnd5e` global exists before `init`). Registered with `DocumentSheetConfig.registerSheet(Actor, "dnd5e", …, { types: ["character"], makeDefault: true })`.

## Parts (`static PARTS`)

`header`, `sidebar`, `details`, `inventory`, `features`, `spells`, `effects`, `biography`, `bastion`, `renown`, `specialTraits`, `abilityScores`, `warnings`, `tabs`. Templates under `systems/dnd5e/templates/actors/`.

## Tabs (`static TABS`)

Details, Inventory, Features, Spells, Effects, Biography, Bastion (if any), Renown (if any), Special Traits. Vertical tabs.

## Actions (`DEFAULT_OPTIONS.actions`)

- Base: `rest`, `restoreTransformation`, `roll`, `showArtwork`, `showConfiguration`, `togglePip`, `toggleSidebar`.
- Character: `deleteFavorite`, `deleteOccupant`, `findItem`, `setSpellcastingAbility`, `toggleDeathTray`, `toggleInspiration`, `useFacility`, `useFavorite`.

Our templates keep `data-action` names so these keep working.

## Reusable custom elements

dnd5e defines web components we can drop into our own templates and get their behavior for free (context menus, drag, filters):
`dnd5e-inventory`, `dnd5e-effects`, `dnd5e-activities`, `item-list-controls`, `proficiency-cycle`, `dnd5e-checkbox`, `slide-toggle`, `filigree-box`, `dnd5e-icon`, and more (`module/applications/components/`).

**This is the key finding:** inventory, features and spells lists can be the system's own `dnd5e-inventory`, restyled, instead of rebuilt.

## DOM the base classes look for

Base sheet `querySelector` targets: `.tab-body`, `.main-content`, `.sidebar-collapser`, `.create-child`, `.level-selector`, `.value`/`.max` (pips and meters), `video[data-edit]`, `[data-attribution]`, `[data-reference-tooltip]`. Character sheet: `.death-tray`, `.death-tab`.

Our templates must keep these class names, or override the methods that use them in `compat.js`-guarded code.

## Window classes and look (checked 2026-10-24)

The window's classes join every class's `DEFAULT_OPTIONS.classes`: `dnd5e2` (application-v2-mixin.mjs:27), `actor standard-form hidden-title` (base-actor-sheet.mjs:82), `character vertical-tabs` (character-sheet.mjs:33). dnd5e's sheet LESS (`less/v2/*.less`) is scoped under `.dnd5e2`, so removing `dnd5e2` removes its sheet look; no module code checks for `dnd5e2`, `vertical-tabs` or `hidden-title` on the window. dnd5e's custom elements (`dnd5e-inventory` and others) are styled under `.dnd5e2` too, so on our sheet we style them ourselves.

At first render `BaseActorSheet#_onFirstRender` (base-actor-sheet.mjs:1107) wraps the tab bodies: `.sheet-body > .main-content > .tab-body > section.tab`. dnd5e's play/edit switch is a `slide-toggle.mode-slider` with `data-action="changeMode"` added to the window header (application-v2-mixin.mjs:204); `changeMode` updates the first `[data-action="changeMode"]` and re-renders.

## Context data

`_prepareContext` (base, `base-actor-sheet.mjs:216`) builds what every part shares: `actor`, `system`, `source` (the raw data in edit mode, prepared data in play), `labels` (actor labels plus damage types), `fields` (the schema, for form inputs), `limited`, `modernRules` (2024 rules), `rollableClass` (`"rollable"` when editable), `user`, `config`. It also prepares the items (`_prepareItems`) and caches concentration. The character version adds `abilityRows` and `spellbook` (`_prepareSpellbook`).

`_preparePartContext(partId, …)` then adds each part's data, one method per part: `abilityScores`, `bastion`, `biography`, `details`, `effects`, `features`, `header`, `inventory`, `renown`, `sidebar`, `specialTraits`, `spells`. **Our parts can reuse these by giving them the same IDs**, or call the methods directly from a part with a new ID.

Useful pieces for Phase 1:
- Header (`character-sheet.mjs:484`): `labels.class` ("Cleric 12 / Fighter 2", highest first), `epicBoonsEarned`, `showExperience` (the `levelingMode` setting isn't `noxp`), `showRests` (GM, or owner when `allowRests` is on). Limited actors get only `portrait`.
- Portrait: `_preparePortrait(context)`.
- Abilities, skills, senses, traits: `_prepareAbilities`, `_prepareSkillsTools(context, "skills")`, `_prepareSenses`, `_prepareTraits`.

## Listeners bound to markup

Most behavior goes through `data-action` (above). The rest is bound in `_onRender` to specific markup; keep it, or that feature silently stops:

- `[data-attribution]`, `[data-reference-tooltip]`: rich tooltips (`_applyTooltips`).
- `.sidebar-collapsed` on the window: toggled from a user flag.
- When editable: `.level-selector` (class level change); text inputs with `data-dtype="Number"` or `inputmode="numeric"` (`+5` / `-3` delta input); `.meter > [role="meter"]:has(> input)` (click a meter to edit it, blur to close).
- Character only: `_renderAttunement` and `_renderSpellbook` run after render unless the actor is Limited.

Actions read their target from nearby data attributes:
- `roll` does nothing unless the clicked element has the class `rollable` (templates use `{{ @root.rollableClass }}`, set only when editable). An ability roll is a save if the element also has `saving-throw`, else a check.
- `roll`: `data-type` = `ability` (with `[data-ability]`), `deathSave`, `initiative`, `skill` / `tool` (with `[data-key]`), and more.
- `rest`: `data-type` = `short` or `long` → `actor.initiateRest`.
- `togglePip`: `[data-n]` and `[data-prop]` (the actor property to set). Pips for spell slots, hit dice, death saves can use this directly.
- `deleteFavorite`: `[data-favorite-id]`.

## Inventory element and list controls (checked 2026-10-26)

`dnd5e-inventory` (components/inventory.mjs) binds on connect, inside itself: `.item-action[data-action]` clicks (`use`, `view`, `equip`, `attune`, `toggleExpand`, `edit`, `delete`, `duplicate`, `prepare`, `recharge`, `currency`), the context menu on `[data-item-id]`, `.adjustment-button`, and numeric inputs. Rows need `[data-item-id]`, `[data-uuid]` and `[data-entry-id]`; drag starts on `[data-item-id] > .item-row` with class `draggable` (base-actor-sheet.mjs:1680). `toggleExpand` flips classes on `[data-action="toggleExpand"] > i` (it throws without that `<i>`), toggles `collapsed` on the row, and renders `items/parts/item-summary.hbs` into `:scope > .item-description > .wrapper`. Numeric fields with `inputmode="numeric"` and `data-name` go through the sheet's `_onChangeInputDelta` (base-actor-sheet.mjs:1295), which looks for `.inventory-element` around them.

`item-list-controls` (components/item-list-controls.mjs) builds its own search field and buttons from `<datalist data-list="filters|sort|group">`, finds its list by `[data-item-list="<for>"]`, hides `.item-list .item` rows by `data-entry-id` and empty `.items-section`s, and sorts rows within their parent. With a `group` datalist it moves rows into sections by `data-group-<key>`; we leave grouping out and place rows by type ourselves.

dnd5e renders every inventory item into one hidden union section and sorts rows into sections in the browser; `context.sections` arrive empty. The character sheet drops containers from `itemCategories.inventory` (character-sheet.mjs:507) and lists them in `context.containers`.

After every render the character sheet calls `_renderAttunement` (base-actor-sheet.mjs:1002), which appends into `[data-application-part="inventory"] .middle`; our markup has none, so we override it (our footer draws the counter).

**Attunement needs Magical** (equippable-item.mjs:136): on items whose type allows the `mgc` property (weapons, equipment and others), dnd5e blanks `system.attunement` during data prep unless the item has `mgc`, and `attuned` follows. An item made with `attunement: 'required'` alone shows no attunement. (Found 2026-10-26 when our Quench ring had no attune toggle.)

## Containers (checked 2026-10-26)

- **Storage:** an item inside a container keeps the container's ID in `system.container` (null when loose). Containers nest. `ContainerData` (data/item/container.mjs) gives `contents` (direct), `allContainedItems` (nested), `contentsCount`, `contentsWeight`, `totalWeight` (container plus contents, unless the `weightlessContents` property), and `computeCapacity()` → `{ value, max, pct, units, hidden }`, by item count or by weight, `hidden` when the contents are concealed (unidentified container with `unidentifiedContents`). A container also holds its own `system.currency`, counted in its weight.
- **Character sheet:** `_prepareItems` leaves out every item inside a container on this actor (base-actor-sheet.mjs:466), so contents get no `itemContext`. Containers go to `context.containers` (each with `ctx.capacity`, click action `view`) and are dropped from the inventory list (character-sheet.mjs:507). The tab shows them only as a strip of icons at the top (`inventory/containers.hbs`): `li.container.draggable[data-item-id]` around a `showDocument` link, a capacity meter, an equipped mark. Clicking one opens the container's own window; contents are seen nowhere else on the actor sheet.
- **Container window** (`ContainerSheet`, applications/item/container-sheet.mjs): an item sheet with a Contents tab: its own `dnd5e-inventory` of the contents, their currency, the capacity bar. Its `_onDrop` takes items in. It is dnd5e's item-sheet look; our CSS doesn't reach it.
- **Drag and drop on the actor sheet** (`_onDropItem`, base-actor-sheet.mjs:1714): a drop on any `.container[data-item-id]` element calls `_onDropItemContainer` (refuses a container into itself or its children, asks before filling a concealed one, moves an item from this actor by setting `system.container`, copies others in with `Item5e.createWithContents`). A move-drop anywhere else on the sheet from this actor clears `system.container` and sorts. Deleting a container offers to delete its contents (`deleteContents`).
- **Filtering:** `item-list-controls` matches each row by `data-entry-id` alone, or as `<parent's id>.<entry id>` when the row has `data-parent-id`. For an item the parent is the actor, not its container, so contents rows must not carry `data-parent-id`. Sorting appends each row to its own parent list, so contents drawn in their own `.item-list` inside the container stay there.
- **Trap:** `_onFirstRender` (character-sheet.mjs:900) binds a context menu on `.containers [data-item-id]` that calls the Features tab's inventory element; until our Features tab has one, a `.containers` wrapper would throw on right-click. Don't use that class.

## Spellbook (checked 2026-10-26, dnd5e 6.0.6)

- **Sections** (`_prepareSpellbook`, base-actor-sheet.mjs:570): one per slot key from each `CONFIG.DND5E.spellcasting` method's `getAvailableLevels(actor)`: `spell0` (cantrips), `spell1`…`spell9`, `pact`, plus `innate`, `atwill`, `ritual` and `item` (spells granted by items, shown only when the activity has `displayInSpellbook`). Each section has `label`, `order`, `usesSlots`, `dataset: { level, method, type: "spell" }`, and, when it uses slots, `pips` (`{ n, filled, label, classes }`; `tmp` past the max). Slots live at `actor.system.spells.<key>` (`value`, `max`, `override`). Columns: `school`, `time`, `range`, `target`, `roll`, `uses`, `formula`, `controls`. Rows are sorted into sections in the browser, as on Inventory.
- **Spellcasting cards** (character-sheet.mjs:590): `context.spellcasting`, one per entry in `actor.spellcastingClasses`, highest level first: `label`, `ability: { mod, ability }`, `attack`, `save`, `preparation: { value, max }`, `primary` (matches `system.attributes.spellcasting`). Each class also adds a filter `{ key: <class identifier>, group: "class" }`. dnd5e's markup: `button[data-action="setSpellcastingAbility"]` inside `.spellcasting[data-ability]`.
- **Preparation:** `system.method` (`spell`, `pact`, `innate`, `atwill`, `ritual`) and `system.prepared` (`CONFIG.DND5E.spellPreparationStates`: 0 unprepared, 1 prepared, 2 always). `system.canPrepare` is true when the method `prepares`: `spell` and `pact` do (2024 warlocks prepare), `innate`, `atwill` and `ritual` don't (config.mjs:3165). Only state 1 with a `classIdentifier` counts (`countsPrepared`, spell.mjs:249). `preparation.max` comes from the class's `spellcasting.preparation.formula` (spellcasting-field.mjs:42); classes without a formula (older 2014 class items) give no max. The row action `prepare` (inventory.mjs:796) flips 0 ↔ 1 only; it would turn an always-prepared spell into unprepared, so we don't offer it on state 2. dnd5e's own row context (`ctx.preparation`, base-actor-sheet.mjs:961) already marks it: `applicable` when the method prepares and the spell isn't from an item, `disabled` when always prepared, icon sun (prepared or not) or certificate (always). Cantrips with method `spell` get the mark too and start prepared on a character (spell.mjs:819), but never count toward the max.
- **Filters** (`_prepareSpellsContext`, base-actor-sheet.mjs:411; logic in `_filterItems`, :2029): `action`, `bonus`, `reaction`, `concentration`, `ritual`, `prepared` (`canPrepare && prepared`: always-prepared passes, innate and at-will don't), every school, each casting class. Filters are three-state (include, exclude). Extra filters go in `_filterItem(item, filters)`: it returns true or false to decide, undefined to fall through.
- **Concentration:** `actor.concentration` → `{ items, effects }` (actor.mjs:247), effects carrying the `concentrating` status, `flags.dnd5e.item` naming the spell. `system.attributes.concentration.limit` (usually 1). End it with `actor.endConcentration(effect)` (:1130; fires `dnd5e.endConcentration`). The concentration save rolls through `roll` with `data-type="ability"` under `[data-ability="concentration"]` (base-actor-sheet.mjs:1370 → `rollConcentration`). On damage, dnd5e itself calls `challengeConcentration` (data/actor/templates/attributes.mjs:705, unless the `disableConcentration` world setting is on): a `prompt` chat message with a save button. Our chat cards don't restyle `prompt` messages yet.
- **Tidy Classic** (`ItemFilterRuntime.svelte.ts` `defaultFilterPins`, character Spellbook): pinned Action, Bonus, Reaction, Concentration, Can cast. Its menu adds Other activation, components (V, S, M, Concentration, Ritual), Prepared and Can cast, and schools. "Can cast" = prepared, always prepared, at will, innate, uses left, or a ritual for a ritual caster (`SpellUtils.isCastableSpell`). dnd5e has no Can cast or V/S/M filters.

## Features, Effects, Biography, Journal (checked 2026-10-26, dnd5e 6.0.6, Tidy Classic v13.0.0)

- **Features part** (`features`, `character-features.hbs`): dnd5e's class pills (`dnd5e.actor-classes`), then the shared `inventory/inventory.hbs` in `dnd5e-inventory`. `_prepareFeaturesContext` (character-sheet.mjs:394): classes highest level first, `needsSubclass` when the class's Subclass advancement level is reached and none is owned; `showClassDrop` when there are no classes or in edit mode. Pill actions: `showDocument` (`data-uuid`), `findItem` (`data-item-type` class or subclass, `data-class-identifier`), `deleteDocument`; class level is a `select.level-selector` bound by `change` (base-actor-sheet.mjs:1161), no action.
- **Feature sections** come in two groupings, switched by `item-list-controls` (`grouping`, saved per user as `prefs.group`): **origin** (default): one per class (`group-origin` = class identifier), Species, Background (only when the actor has that item), Other; **activation**: Active, Passive. Each row says its own groups (`_prepareItemFeature`, character-sheet.mjs:850): origin from the `advancementRoot` or `advancementOrigin` flag's item (race → species, background, class → its identifier, subclass → its class), else `other`; activation passive when the item has the `trait` property or no activities. `_applyGrouping` (item-list-controls.mjs:407) moves each `.item` into the `.items-section[data-group-<key>]` matching its `data-group-<key>`, and hides columns a section lacks. Columns: `uses` (order 200), `recovery`, `controls`. The class pills sit outside the list; class and subclass items aren't rows.
- **Feature filters:** `action`, `bonus`, `reaction`, `sr`, `lr` (recovers on short or long rest), `concentration`, `mgc`; sort manual or A–Z. Row actions as Inventory, plus `recharge` (a cooldown's roll).
- **Context menu outside the list:** `_onFirstRender` (character-sheet.mjs:897) gives the features element's menu to `.pills-lg [data-item-id]`, `.favorites [data-item-id]` and `.facility[data-item-id]`; it needs the features tab's `dnd5e-inventory` to exist.
- **Effects part** (`effects`, `actor-effects.hbs` → `dnd5e.active-effects`, element `dnd5e-effects`). `_prepareEffectsContext` (base-actor-sheet.mjs:250): `EffectsElement.prepareCategories(actor.allApplicableEffects())` → temporary, passive, inactive, suppressed (hidden when empty), plus enchantment categories (hidden when empty). Conditions are their own list: every non-pseudo `CONFIG.DND5E.conditionTypes` entry, `disabled` unless the actor has it, `level` for exhaustion; condition effects are kept out of the categories unless they have a duration. Each effect row: `getSheetContext()`, `toggleable` (not a concentration effect), `isExpanded`, `parentId` (from an item), `source`. Rows carry `data-effect-id`, `data-parent-id`; riders nest under their effect. Actions the element binds on every `[data-action]` inside it (effects.mjs:93, :286): `create`, `delete`, `duplicate`, `edit`, `favorite`/`unfavorite`, `toggle`, `toggleExpand`, `toggleCondition` (on `[data-condition-id]`). Columns: `detail` (duration or source), `controls`. Search via `item-list-controls for="effects" collection="effects"`.
- **Biography part** (`biography`, `character-biography.hbs`): `characteristics` (alignment, eyes, height, faith, hair, weight, gender, skin, age; `name`, `label`, `value`, `source`), plain inputs when editable. Five textboxes (`system.details.ideal`, `bond`, `flaw`, `trait`, `appearance`): `textarea` when editable, else text through `dnd5e-textFormat`. Biography: `<prose-mirror name="system.details.biography.value">` when editable, else `enriched.value` (enriched with secrets for owners).
- **Journal:** not a dnd5e part. Tidy Classic's Journal tab (`ActorJournalTab.svelte`, owner only) holds four renamable rich-text notes in Tidy flags (`notes1`–`notes4`: Persons of Interest, Locations of Interest, Quests, Miscellaneous) plus a list of journal entries (`TIDY5E.JournalEntries`). Tidy's flags aren't readable by us without depending on Tidy.
- **Tidy Classic Features** (`CharacterSheetSections.buildClassicFeaturesSections`): sections Species (the species item itself), Background (the item), Classes (class items with a Level column), Active (feats with activities: Type, Requirements, Usage, Uses), Passive (Type, Requirements, Uses), plus custom sections from a flag. Pinned filters: Action, Bonus, Reaction. Rows: favorite, edit, delete (unlocked), the Actions-list override.
- **Tidy Classic Effects** (`CharacterEffectsTab.svelte`): dnd5e's categories as tables (Source 200px, Duration 120px, controls), then a conditions panel. **Biography** (`CharacterBiographyTab.svelte`): characteristics across the top, Ideals/Bonds/Flaws and Personality left, Appearance and Background/Biography right, each opening one editor at a time.

## Favorites

Stored on the actor as `system.favorites`: an array of `{ id, type, sort }`, where `id` is a relative UUID and `type` is `item`, `effect`, `activity`, `skill`, `tool`, `slots` or `facility`. Change them only through `actor.system.addFavorite(...)` / `removeFavorite(id)` (`data/actor/character.mjs:323–363`). `_prepareFavorites` (`character-sheet.mjs:633`) turns them into display rows and puts legacy resources (`system.resources`) first. Hidden items and inactive dependent effects are skipped.

This is where Classic's "pins" go: same list, so favorites made on our sheet show on dnd5e's and Tidy's, and the other way round.

## Templates

dnd5e's templates use its own Handlebars helpers (`dnd5e-icon`, `dnd5e-formatModifier`, `dnd5e-numberFormat`, and others, `module/utils.mjs:1358`). They exist in Foundry but not in our offline layout check. **Our templates use only core helpers**; compute display values in our context methods (the quest log rule).

dnd5e's CSS is built from LESS at release (`dnd5e.css` isn't in the repository), so the layout check can't load it. Our styles must stand on their own inside `.fhcs-sheet`.

## How Tidy did it (checked 2026-10-23)

Tidy's Classic sheet (`Tidy5eActorSheetClassicV2Base`, Tidy commit `54fdbad4`) extends Foundry's plain `ActorSheetV2` through a Svelte mixin. It does **not** extend dnd5e's sheet: Tidy reimplements each mechanic through its own adapter layer. That's why it needs a release for every dnd5e version. Ours inherits from `CharacterActorSheet` to avoid that cost; the trade-off is that our markup must keep dnd5e's class names and actions.
