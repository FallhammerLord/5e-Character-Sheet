import { MODULE_ID, MODULE_PATH } from '../constants.js';
import { attributesFacts, biographyFacts, changeHp, cycleListGrouping, savePortraitFrame, savePortraitShape, saveSkillAbility, effectsFacts, endConcentration, featuresFacts, headerFacts, inventoryFacts, levelDownClass, levelUpClass,
   passesExtraFilters, spellbookFacts, toggleListFilter, watchListFilters } from '../compat.js';
import { attributesView } from '../sheet/attributes.js';
import { columnChoice, inventoryView } from '../sheet/inventory.js';
import { EXTRA_SPELL_FILTERS, spellbookView, spellColumnChoice } from '../sheet/spellbook.js';
import { featureColumnChoice, featuresView } from '../sheet/features.js';
import { effectsView } from '../sheet/effects.js';
import { biographyView } from '../sheet/biography.js';
import { FEATURE_PINS, INVENTORY_PINS, SPELL_PINS } from '../sheet/lists.js';
import { headerMinWidth, headerView, hpPreview, tabRow } from '../sheet/header.js';
import { delayTips, keepFolds } from '../chat/card.js';
import { startFraming } from './framing.js';

/** Our template parts, by dnd5e part ID. */
export const SHEET_PARTS = {
   header: `${MODULE_PATH}/templates/sheet/header.hbs`,
   tabs: `${MODULE_PATH}/templates/sheet/tabs.hbs`,
   // The Attributes tab takes dnd5e's Details tab: same ID, so dnd5e's tab handling still applies.
   details: `${MODULE_PATH}/templates/sheet/attributes.hbs`,
   inventory: `${MODULE_PATH}/templates/sheet/inventory.hbs`,
   spells: `${MODULE_PATH}/templates/sheet/spellbook.hbs`,
   features: `${MODULE_PATH}/templates/sheet/features.hbs`,
   effects: `${MODULE_PATH}/templates/sheet/effects.hbs`,
   biography: `${MODULE_PATH}/templates/sheet/biography.hbs`
};

/**
 * Part settings of ours that differ from dnd5e's. The list tabs scroll their item list, not the whole tab, so the
 * currency and carried weight (and the spellcasting cards) stay in view; Foundry keeps the list's scroll place across
 * re-renders. Their partials load with the part, since the tab (and each container) includes them.
 */
const LIST_BAR = `${MODULE_PATH}/templates/sheet/list-bar.hbs`;
const PART_OPTIONS = {
   header: { templates: [`${MODULE_PATH}/templates/sheet/level-up.hbs`, `${MODULE_PATH}/templates/sheet/gear.hbs`] },
   inventory: { scrollable: ['.fhcs-items'], templates: [`${MODULE_PATH}/templates/sheet/item-row.hbs`, LIST_BAR] },
   spells: { scrollable: ['.fhcs-items'], templates: [`${MODULE_PATH}/templates/sheet/spell-row.hbs`, LIST_BAR, `${MODULE_PATH}/templates/sheet/gear.hbs`, `${MODULE_PATH}/templates/sheet/conc-c.hbs`] },
   features: { scrollable: ['.fhcs-items'], templates: [`${MODULE_PATH}/templates/sheet/feature-row.hbs`, LIST_BAR] },
   effects: { scrollable: ['.fhcs-items'], templates: [LIST_BAR, `${MODULE_PATH}/templates/sheet/conc-c.hbs`] },
   biography: { templates: [`${MODULE_PATH}/templates/sheet/bio-box.hbs`] },
   details: { templates: [`${MODULE_PATH}/templates/sheet/gear.hbs`] }
};

/** Each list tab's column setting, by dnd5e's list name. */
const COLUMN_SETTINGS = {
   inventory: { setting: 'inventoryColumns', choice: columnChoice },
   spells: { setting: 'spellColumns', choice: spellColumnChoice },
   features: { setting: 'featureColumns', choice: featureColumnChoice }
};

/** Each list tab's pinned filters, by dnd5e's list name. */
const LIST_PINS = { inventory: INVENTORY_PINS, spells: SPELL_PINS, features: FEATURE_PINS };

/** Each player's own choices, kept on their user so they follow them to every character and device. */
const PREFS = { folded: 'foldedFavorites', openContainers: 'openContainers' };

/** Folds or opens a favorites group, and remembers it. */
async function toggleGroup(event, target)
{
   const group = target.closest('[data-fhcs-group]');
   const list = group?.querySelector('.fhcs-favorites, .fhcs-traits');
   if (!list) { return; }
   list.hidden = !list.hidden;
   target.setAttribute('aria-expanded', String(!list.hidden));
   // What shows only while folded (the traits' one-line summary).
   for (const el of group.querySelectorAll('[data-fhcs-folded]')) { el.hidden = !list.hidden; }
   const folded = new Set(game.user.getFlag(MODULE_ID, PREFS.folded) ?? []);
   if (list.hidden) { folded.add(group.dataset.fhcsGroup); }
   else { folded.delete(group.dataset.fhcsGroup); }
   await game.user.setFlag(MODULE_ID, PREFS.folded, [...folded]);
}

/** A favorite's name: opens or shuts the item's details under its row (user, 2026-10-26), until the sheet closes. */
function toggleFavoriteDetails(event, target)
{
   const id = target.closest('[data-favorite-id]')?.dataset.favoriteId;
   if (!id) { return; }
   this.fhcsOpenFavorites ??= new Set();
   if (this.fhcsOpenFavorites.has(id)) { this.fhcsOpenFavorites.delete(id); }
   else { this.fhcsOpenFavorites.add(id); }
   this.render({ parts: ['details'] });
}

/** Folds a container's contents open or shut under its row, and remembers it for this player. */
async function toggleContainer(event, target)
{
   const row = target.closest('[data-item-id]');
   const list = row?.querySelector(':scope > .fhcs-contents');
   if (!list) { return; }
   list.hidden = !list.hidden;
   target.setAttribute('aria-expanded', String(!list.hidden));
   const open = new Set(game.user.getFlag(MODULE_ID, PREFS.openContainers) ?? []);
   if (list.hidden) { open.delete(row.dataset.itemId); }
   else { open.add(row.dataset.itemId); }
   await game.user.setFlag(MODULE_ID, PREFS.openContainers, [...open]);
}

/** Shows or hides one column of a list tab for this player (user, 2026-10-26); the setting re-renders our sheets. */
async function toggleColumn(event, target)
{
   const key = target.dataset.column;
   const list = COLUMN_SETTINGS[target.dataset.list ?? 'inventory'];
   if (!list) { return; }
   const columns = list.choice(game.settings.get(MODULE_ID, list.setting));
   if (!(key in columns)) { return; }
   await game.settings.set(MODULE_ID, list.setting, { ...columns, [key]: !columns[key] });
}

/** A pinned filter button: turns one of dnd5e's list filters on or off (mockup, 2026-10-26). */
function pinFilter(event, target)
{
   const controls = target.closest('dnd5e-inventory')?.querySelector('item-list-controls');
   toggleListFilter(controls, target.dataset.filter);
}

/** Shows the pins as the list's filters stand, after any pass of dnd5e's filter (pins or its own menu). */
function showPins(controls)
{
   const bar = controls.closest('.fhcs-list-bar');
   watchListFilters(controls, (active) =>
   {
      for (const pin of bar?.querySelectorAll('[data-action="fhcsPinFilter"]') ?? [])
      {
         const key = pin.dataset.filter;
         pin.setAttribute('aria-pressed', active.includes(key) ? 'true' : active.includes(`!${key}`) ? 'mixed' : 'false');
      }
   });
}

/** A class card's Level up: dnd5e's level-up wizard for that class (user, 2026-10-26; SCOPE §4.8). */
function levelUp(event, target)
{
   return levelUpClass(this, target.dataset.itemId);
}

/** Round or square portrait, flipped from edit mode's chip (user, 2026-10-27). */
function portraitShape(event, target)
{
   return savePortraitShape(this.actor, MODULE_ID, target.getAttribute('aria-pressed') === 'true' ? 'square' : 'round');
}

/** A skill's ability, from its tray in edit mode (user, 2026-10-27: the native dropdown failed contrast). The tray
 *  closes first, so the redraw doesn't reopen it. */
function skillAbility(event, target)
{
   target.closest('details')?.removeAttribute('open');
   return saveSkillAbility(this.actor, target.closest('[data-key]')?.dataset.key, target.dataset.fhcsAbility);
}

/** Level down, from the level tray in edit mode (SCOPE §4.9). */
function levelDown(event, target)
{
   return levelDownClass(this, target.dataset.itemId);
}

/** Frame: positions the portrait in its frame (user, 2026-10-27); Done saves it with the image it belongs to. */
function frame()
{
   startFraming(this.element, (place, src) => savePortraitFrame(this.actor, MODULE_ID, src, place));
}

/**
 * The HP tray's Damage, Heal and Temp (user, 2026-10-27): the amount typed, through dnd5e's own functions. The tray
 * closes first, so it doesn't stay open across the redraw the change brings.
 */
function hpChange(event, target)
{
   const tray = target.closest('.fhcs-hp-tray');
   const amount = Math.floor(Number(tray?.querySelector('[data-fhcs-amount]')?.value));
   if (!(amount > 0)) { return null; }
   const fold = target.closest('details');
   if (fold) { fold.open = false; }
   return changeHp(this.actor, target.dataset.kind, amount);
}

/**
 * The HP tray's amount field is not part of the sheet's form: its change must not submit the sheet (a redraw would
 * drop what was typed), and Enter does nothing (each change has its own button). Typing updates the preview line.
 */
function wireHpTray(element)
{
   const field = element.querySelector('.fhcs-hp-tray [data-fhcs-amount]');
   if (!field || field.dataset.fhcsWired) { return; }
   field.dataset.fhcsWired = 'true';
   const tray = field.closest('.fhcs-hp-tray');
   const preview = tray.querySelector('.fhcs-hp-preview');
   const hp = { value: Number(tray.dataset.hp) || 0, temp: Number(tray.dataset.temp) || 0 };
   const i18n = { localize: (key) => game.i18n.localize(key), format: (key, data) => game.i18n.format(key, data) };
   field.addEventListener('change', (event) => { event.stopPropagation(); });
   field.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); } });
   field.addEventListener('input', () => { if (preview) { preview.textContent = hpPreview(field.value, hp, i18n); } });
}

/** The grouping button in words: steps dnd5e's own switch, which moves the rows, then names the grouping now in force. */
async function cycleGroup(event, target)
{
   const controls = target.closest('dnd5e-inventory')?.querySelector('item-list-controls');
   const grouping = await cycleListGrouping(controls);
   if (!grouping) { return; }
   const label = game.i18n.localize(`FHCS.Features.Group.${grouping}`);
   const name = target.querySelector('.fhcs-group-name');
   if (name) { name.textContent = label; }
   target.setAttribute('aria-label', `${game.i18n.localize('FHCS.Features.GroupLabel')}: ${label}`);
}

/** The concentration bar's name: opens the spell held (user, 2026-10-26). */
function openConcentration(event, target)
{
   this.actor.items.get(target.dataset.itemId)?.sheet?.render({ force: true });
}

/** The concentration bar's End button: ends that concentration through dnd5e. */
function endConcentrationAction(event, target)
{
   return endConcentration(this.actor, target.dataset.effectId);
}

/**
 * Closes our open fold-out trays (exhaustion, rest, levels, inventory columns) when the player clicks anywhere else
 * (user, 2026-10-26: they closed only on a second click). One listener for the page, added with the first sheet.
 */
let traysCloseOnClickOff = false;
function closeTraysOnClickOff()
{
   if (traysCloseOnClickOff) { return; }
   traysCloseOnClickOff = true;
   document.addEventListener('pointerdown', (event) =>
   {
      for (const fold of document.querySelectorAll('.fhcs-sheet details.fhcs-fold[open]'))
      {
         if (!fold.contains(event.target)) { fold.open = false; }
      }
   }, { capture: true });
}

/**
 * Keeps a search match inside a container in view (user, 2026-10-26). dnd5e's list controls hide every row that
 * doesn't match, the container around a match included, and don't know about our folds. After each of their passes,
 * a container holding a visible match is shown again and marked, and CSS opens its contents while it is marked; the
 * player's own fold is untouched, so clearing the search puts it back.
 *
 * @param {HTMLElement} list  The Inventory tab's item list.
 */
function showMatchesInContainers(list)
{
   const pass = () =>
   {
      for (const box of list.querySelectorAll('.fhcs-item.container'))
      {
         const match = !!box.querySelector(':scope > .fhcs-contents .item:not([hidden])');
         // A match means a search is on: when nothing is filtered, every row is visible and no box needs opening.
         const searching = match && !!list.querySelector('.item[hidden]');
         box.classList.toggle('fhcs-has-match', searching);
         if (searching && box.hidden) { box.hidden = false; }
      }
   };
   pass();
   // Our own changes come back as mutations; the pass changes nothing the second time, so it settles.
   new MutationObserver(pass).observe(list, { subtree: true, attributes: true, attributeFilter: ['hidden'] });
}

/**
 * dnd5e parts we drop: our header holds the ability scores; the sidebar's portrait, HP and AC are in the header, its
 * favorites move to the Attributes tab and its death saves to the header.
 */
const DROPPED_PARTS = ['abilityScores', 'sidebar'];

/** Parts drawn first, in this order: the header, then the tab row across the top, then the tab bodies. */
const LEADING_PARTS = ['header', 'tabs'];

/**
 * Window classes that carry dnd5e's look, removed so its sheet styles never reach ours (user, 2026-10-24: "it
 * shouldn't be influenced visually by the default sheet at all"). dnd5e's code doesn't look for them.
 */
const DND5E_LOOK = ['dnd5e2', 'vertical-tabs', 'hidden-title'];

/** dnd5e's parts with ours swapped in, the dropped ones gone, and the leading ones first. */
function ourParts(baseParts)
{
   const entries = Object.entries(baseParts ?? {})
      .filter(([id]) => !DROPPED_PARTS.includes(id))
      // Ours keep dnd5e's part settings (ID, container, scrolling) but not its classes or extra templates.
      .map(([id, part]) =>
      {
         if (!SHEET_PARTS[id]) { return [id, part]; }
         const kept = { ...part, template: SHEET_PARTS[id] };
         delete kept.classes;
         delete kept.templates;
         return [id, { ...kept, ...PART_OPTIONS[id] }];
      });
   const rank = (id) => (LEADING_PARTS.includes(id) ? LEADING_PARTS.indexOf(id) : LEADING_PARTS.length);
   return Object.fromEntries(entries.sort(([a], [b]) => rank(a) - rank(b)));
}

/**
 * Our character sheet: dnd5e's own sheet class with our layout. Built from the class dnd5e provides at init,
 * since a module can't import from the system by path. dnd5e keeps every mechanic; the look is ours alone.
 *
 * Phase 1: our header. Phase 2: our frame, tab row and Attributes tab in place of dnd5e's sidebar, vertical tabs
 * and Details tab. Phase 3: our Inventory tab. Phase 4: our Spellbook tab. Phase 5: our Features, Effects and Biography tabs.
 */
export function makeCharacterSheet(Base)
{
   return class FHCSCharacterSheet extends Base
   {
      static DEFAULT_OPTIONS = {
         classes: ['fhcs-sheet'],
         actions: { fhcsToggleGroup: toggleGroup, fhcsToggleColumn: toggleColumn,
            fhcsToggleContainer: toggleContainer, fhcsPinFilter: pinFilter, fhcsOpenConcentration: openConcentration,
            fhcsEndConcentration: endConcentrationAction, fhcsToggleFavoriteDetails: toggleFavoriteDetails,
            fhcsLevelUp: levelUp, fhcsCycleGroup: cycleGroup, fhcsHpChange: hpChange, fhcsFrame: frame, fhcsLevelDown: levelDown, fhcsPortraitShape: portraitShape,
            fhcsSkillAbility: skillAbility }
      };

      static PARTS = ourParts(Base.PARTS);

      /** Foundry joins every parent's classes; drop dnd5e's look from the list. */
      _initializeApplicationOptions(options)
      {
         const initialized = super._initializeApplicationOptions(options);
         initialized.classes = initialized.classes.filter((name) => !DND5E_LOOK.includes(name));
         return initialized;
      }

      /** @inheritDoc */
      async _preparePartContext(partId, context, options)
      {
         context = await super._preparePartContext(partId, context, options);
         const i18n = { localize: (key) => game.i18n.localize(key), format: (key, data) => game.i18n.format(key, data) };
         if (partId === 'header' && !this.actor.limited)
         {
            const facts = await headerFacts(this, context, MODULE_ID);
            context.fhcs = { ...headerView(facts, i18n), editable: facts.editable };
         }
         if (partId === 'details')
         {
            const prefs = {
               folded: game.user.getFlag(MODULE_ID, PREFS.folded) ?? [],
               open: this.fhcsOpenFavorites ?? new Set()
            };
            context.fhcsAttributes = attributesView(await attributesFacts(this, context, prefs), i18n);
         }
         if (partId === 'inventory')
         {
            const columns = columnChoice(game.settings.get(MODULE_ID, 'inventoryColumns'));
            const openContainers = game.user.getFlag(MODULE_ID, PREFS.openContainers) ?? [];
            context.fhcsInventory = inventoryView(await inventoryFacts(this, context, { columns, openContainers }), i18n);
         }
         if (partId === 'spells')
         {
            const columns = spellColumnChoice(game.settings.get(MODULE_ID, 'spellColumns'));
            context.fhcsSpellbook = spellbookView(await spellbookFacts(this, context, { columns }), i18n);
         }
         if (partId === 'features')
         {
            const columns = featureColumnChoice(game.settings.get(MODULE_ID, 'featureColumns'));
            context.fhcsFeatures = featuresView(await featuresFacts(this, context, { columns }), i18n);
         }
         if (partId === 'effects')
         {
            context.fhcsEffects = effectsView(await effectsFacts(this, context), i18n);
         }
         if (partId === 'biography')
         {
            context.fhcsBiography = biographyView(biographyFacts(this, context), i18n);
         }
         if (partId === 'tabs')
         {
            context.fhcsTabs = tabRow(context.tabs, { canEdit: this.isEditable, editing: this.isEditMode }, i18n.localize);
         }
         return context;
      }

      /**
       * dnd5e adds its attunement counter into its own inventory markup (`.middle`, base-actor-sheet.mjs:1002) after
       * each render; ours has no such slot, and our Inventory footer draws the counter itself.
       */
      _renderAttunement()
      {
         // Drawn by templates/sheet/inventory.hbs.
      }

      /** dnd5e adds slot pips into its own spell headings after each render (base-actor-sheet.mjs:1054); ours draw them. */
      _renderSpellbook()
      {
         // Drawn by templates/sheet/spellbook.hbs.
      }

      /** Our Spellbook filters (Can cast, components) on top of dnd5e's (SCOPE §4.7). */
      _filterItem(item, filters)
      {
         const allowed = super._filterItem(item, filters);
         if (allowed !== undefined) { return allowed; }
         return passesExtraFilters(this.actor, item, filters, EXTRA_SPELL_FILTERS);
      }

      /** Never narrower than the ability row needs, so it never wraps. */
      _updatePosition(position)
      {
         const min = headerMinWidth(Object.keys(CONFIG.DND5E?.abilities ?? {}).length || 6);
         if (typeof position.width === 'number') { position.width = Math.max(position.width, min); }
         return super._updatePosition(position);
      }

      /** @inheritDoc */
      async _onRender(context, options)
      {
         await super._onRender(context, options);
         // The header's trays stay open across re-renders; its chips' tooltips wait like the cards' do.
         keepFolds(this.element, `sheet-${this.id}`);
         closeTraysOnClickOff();
         wireHpTray(this.element);
         const items = this.element.querySelector('.fhcs-inventory .fhcs-items');
         if (items && !items.dataset.fhcsWatched)
         {
            items.dataset.fhcsWatched = 'true';
            showMatchesInContainers(items);
         }
         for (const list of Object.keys(LIST_PINS))
         {
            const controls = this.element.querySelector(`item-list-controls[for="${list}"]`);
            if (controls) { showPins(controls); }
         }
         delayTips(this.element);
      }
   };
}
