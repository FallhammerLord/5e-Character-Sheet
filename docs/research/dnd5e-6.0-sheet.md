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

## Favorites

Stored on the actor as `system.favorites`: an array of `{ id, type, sort }`, where `id` is a relative UUID and `type` is `item`, `effect`, `activity`, `skill`, `tool`, `slots` or `facility`. Change them only through `actor.system.addFavorite(...)` / `removeFavorite(id)` (`data/actor/character.mjs:323–363`). `_prepareFavorites` (`character-sheet.mjs:633`) turns them into display rows and puts legacy resources (`system.resources`) first. Hidden items and inactive dependent effects are skipped.

This is where Classic's "pins" go: same list, so favorites made on our sheet show on dnd5e's and Tidy's, and the other way round.

## Templates

dnd5e's templates use its own Handlebars helpers (`dnd5e-icon`, `dnd5e-formatModifier`, `dnd5e-numberFormat`, and others, `module/utils.mjs:1358`). They exist in Foundry but not in our offline layout check. **Our templates use only core helpers**; compute display values in our context methods (the quest log rule).

dnd5e's CSS is built from LESS at release (`dnd5e.css` isn't in the repository), so the layout check can't load it. Our styles must stand on their own inside `.fhcs-sheet`.

## How Tidy did it (checked 2026-10-23)

Tidy's Classic sheet (`Tidy5eActorSheetClassicV2Base`, Tidy commit `54fdbad4`) extends Foundry's plain `ActorSheetV2` through a Svelte mixin. It does **not** extend dnd5e's sheet: Tidy reimplements each mechanic through its own adapter layer. That's why it needs a release for every dnd5e version. Ours inherits from `CharacterActorSheet` to avoid that cost; the trade-off is that our markup must keep dnd5e's class names and actions.

## Item lists (Inventory, Features, Spellbook; read 2026-10-24)

- One template for all three: `templates/inventory/inventory.hbs` inside `<dnd5e-inventory class="inventory-element">` (`components/inventory.mjs`). Sections are `.items-section` with an `.items-header` (an `h3.item-name` and one `.item-header[data-column-id]` per column) over `ol.item-list` of `li.item` → `.item-row` (`.item-name` with `data-action="use"`, then one `.item-detail[data-column-id]` per column) and `.item-description.collapsible-content` (shown when `li` lacks `.collapsed`).
- Columns (`Inventory.COLUMNS`): price 80, weight 60, quantity 70, charges and uses 70, controls 70, formula and target 80, range 50, recovery 60, roll, school and time 40, capacity 200. On resize dnd5e adds `.hidden-width` to low-priority columns, computed from those widths; it sets no inline widths, so its CSS (or ours) sizes them.
- Controls column (`columns/controls.hbs`): in edit mode Edit and Delete; in play mode Attune (`.attuned` / `.not-attuned`), Equip and Prepare (`.active` when on); always Expand (`toggleExpand`) and ⋮ (`data-context-menu`). The inventory element handles these clicks itself, not the sheet's actions.
- Quantity (`columns/quantity.hbs`): `a.adjustment-button` (`decrease`, `increase`) around an input, unless `@root.locked` (not editable), then plain text. `locked` is `!isEditable`, so owners get the buttons in play mode too.
- `item-list-controls` builds its own DOM on connect: `<search>` with an `input` and `ul.controls` of `button.filter-control` (`clear`, `filter`, `sort`, `group`; `.active` when in use).
- Creating an embedded item re-renders the sheet in edit mode (`primary-sheet-mixin.mjs:99`, `renderContext === "createItem"`).
- Coin icons (`i.currency.<key>`) get their image from a `<style>` dnd5e adds at setup (`dnd5e.mjs` ~491), scoped to `.dnd5e2`; ours copies it for `.fhcs-sheet`.
- Encumbrance (`inventory/encumbrance.hbs`): `.meter.progress` with `--bar-percentage`, `--breakpoint-low`, `--breakpoint-high`, a `.label` (value / max) and four `i.breakpoint` arrows; dnd5e's CSS draws the fill.
- The attunement count is not in a template: `_renderAttunement` (`base-actor-sheet.mjs:1002`) appends `div.attunement` to the inventory part's `.middle` after render, with an input for the max in edit mode.
- Features tab: `parts/actor-classes.hbs` class pills (`.classes.pills-lg > .class.pill-lg`: `img.underlay` full-size class art, `.icons` with `showDocument` images or a `findItem` add-subclass link, delete controls in edit mode, `.name-stacked`, `.level` with `select.level-selector` in edit mode), then the shared list.
