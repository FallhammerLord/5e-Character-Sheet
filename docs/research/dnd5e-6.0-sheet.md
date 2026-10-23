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

## Still to read (Phase 0)

- `_prepareContext` and each `_prepare*Context`: what data each part gets.
- `_onRender` and `_attachPartListeners`: listeners bound to specific markup.
- How Favorites are stored (`system.favorites`) and used.
- How Tidy's Quadrone sheet handles favorites, pins and the tab selection.

## How Tidy did it (checked 2026-10-23)

Tidy's Classic sheet (`Tidy5eActorSheetClassicV2Base`, Tidy commit `54fdbad4`) extends Foundry's plain `ActorSheetV2` through a Svelte mixin. It does **not** extend dnd5e's sheet: Tidy reimplements each mechanic through its own adapter layer. That's why it needs a release for every dnd5e version. Ours inherits from `CharacterActorSheet` to avoid that cost; the trade-off is that our markup must keep dnd5e's class names and actions.
