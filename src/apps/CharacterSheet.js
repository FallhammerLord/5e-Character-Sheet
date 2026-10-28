import { MODULE_ID, MODULE_PATH, THEME_FLAG, THEMES } from '../constants.js';
import { attributesFacts, biographyFacts, changeHp, stepResource, useResourceItem, inspirationFacts, setInspirationSlot, linkInspiration, linkResource, refreshResource, setResourceUses, cycleListGrouping, extraHeaderControls, savePortraitFrame, savePortraitShape, saveSkillAbility, effectsFacts, endConcentration, featuresFacts, headerFacts, inventoryFacts, levelDownClass, levelUpClass,
   passesExtraFilters, renderTemplate, spellbookFacts, toggleListFilter, watchListFilters } from '../compat.js';
import { attributesView } from '../sheet/attributes.js';
import { columnChoice, inventoryView } from '../sheet/inventory.js';
import { EXTRA_SPELL_FILTERS, spellbookView, spellColumnChoice } from '../sheet/spellbook.js';
import { featureColumnChoice, featuresView } from '../sheet/features.js';
import { effectsView } from '../sheet/effects.js';
import { biographyView } from '../sheet/biography.js';
import { FEATURE_PINS, INVENTORY_PINS, SPELL_PINS } from '../sheet/lists.js';
import { comfortWidth, headerMinWidth, headerView, hpPreview, inspirationBar, tabRow, themePicker } from '../sheet/header.js';
import { inspirationGained } from './sparks.js';
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
   details: { templates: [`${MODULE_PATH}/templates/sheet/gear.hbs`] },
   tabs: { templates: [`${MODULE_PATH}/templates/sheet/gear.hbs`] }
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

/** How long a theme's moment (a hit taken, a heal) stays marked on the sheet: its animation runs within it. */
const MOMENT_MS = 650;

/**
 * The sheet's state for its theme (SCOPE §4.11): the character's theme (`flags.fhcs.theme`, else the world's), the
 * player's Motion switch, HP as a 0–1 ratio and full / bloodied / down for the theme's art, and a moment when HP falls or
 * rises between two draws.
 */
function themeState(element, actor)
{
   const theme = actor.getFlag(MODULE_ID, THEME_FLAG) || game.settings.get(MODULE_ID, 'theme');
   if (theme && theme !== 'plain') { element.dataset.fhcsTheme = theme; }
   else { delete element.dataset.fhcsTheme; }
   if (game.settings.get(MODULE_ID, 'motion')) { delete element.dataset.fhcsMotion; }
   else { element.dataset.fhcsMotion = 'off'; }
   const hp = actor.system.attributes?.hp ?? {};
   const value = Number(hp.value) || 0;
   const ratio = hp.max > 0 ? Math.clamp(value / hp.max, 0, 1) : 1;
   element.style.setProperty('--fhcs-hp', ratio.toFixed(2));
   element.dataset.fhcsHp = value <= 0 ? 'down' : ratio <= 0.5 ? 'bloodied' : 'full';
   const before = element.dataset.fhcsHpValue;
   element.dataset.fhcsHpValue = String(value);
   if (before === undefined || Number(before) === value) { return; }
   const moment = value < Number(before) ? 'fhcs-moment-hit' : 'fhcs-moment-heal';
   element.classList.remove('fhcs-moment-hit', 'fhcs-moment-heal');
   element.classList.add(moment);
   setTimeout(() => element.classList.remove(moment), MOMENT_MS);
}

/** The theme tray (edit mode): a theme of the character's own, or back to the world default (no value). */
function setTheme(event, target)
{
   showThemeTray(this.element, false);
   const value = target.dataset.theme;
   if (value && !THEMES.includes(value)) { return null; }
   return value ? this.actor.setFlag(MODULE_ID, THEME_FLAG, value) : this.actor.unsetFlag(MODULE_ID, THEME_FLAG);
}

/** The title bar's theme picker (SCOPE §4.11). */
const THEME_PICK = `${MODULE_PATH}/templates/sheet/theme-pick.hbs`;

/**
 * Draws the theme picker on Foundry's title bar, beside ⋮, for whoever may edit the character (user, 2026-10-28:
 * always there, in play and edit mode). Redrawn after each render, so it shows the theme worn; an open tray stays open.
 */
async function drawThemePicker(sheet)
{
   const bar = sheet.element.querySelector(':scope > .window-header');
   const oldChip = bar?.querySelector(':scope > .fhcs-theme-chip');
   const oldTray = sheet.element.querySelector(':scope > .fhcs-theme-tray');
   if (!bar || !sheet.isEditable) { oldChip?.remove(); oldTray?.remove(); return; }
   const i18n = { localize: (key) => game.i18n.localize(key), format: (key, data) => game.i18n.format(key, data) };
   const theme = { chosen: sheet.actor.getFlag(MODULE_ID, THEME_FLAG) ?? '', world: game.settings.get(MODULE_ID, 'theme'), keys: THEMES };
   const holder = document.createElement('div');
   holder.innerHTML = await renderTemplate(THEME_PICK, themePicker(theme, i18n));
   const chip = holder.querySelector('.fhcs-theme-chip');
   const tray = holder.querySelector('.fhcs-theme-tray');
   if (oldChip) { oldChip.replaceWith(chip); }
   else { bar.insertBefore(chip, bar.querySelector(':scope > [data-action="toggleControls"]')); }
   if (oldTray) { oldTray.replaceWith(tray); }
   else { sheet.element.append(tray); }
   if (oldTray && !oldTray.hidden) { showThemeTray(sheet.element, true); }
   delayTips(bar);
}

/** Opens or closes the theme tray, just under the title bar. */
function showThemeTray(element, open)
{
   const tray = element.querySelector(':scope > .fhcs-theme-tray');
   const chip = element.querySelector(':scope > .window-header > .fhcs-theme-chip');
   const bar = element.querySelector(':scope > .window-header');
   if (!tray) { return; }
   tray.hidden = !open;
   chip?.setAttribute('aria-expanded', String(open));
   if (open && bar) { tray.style.top = `${bar.offsetTop + bar.offsetHeight}px`; }
}

/** The Traits panel's gear (edit mode): dnd5e's Special Traits page, which the tab row no longer draws. */
function openSpecialTraits()
{
   this.changeTab('specialTraits', 'primary');
}

/** The title bar's palette: opens or closes its tray. */
function themeTray()
{
   const tray = this.element.querySelector(':scope > .fhcs-theme-tray');
   showThemeTray(this.element, !!tray?.hidden);
}

/** Folds or opens a section on a list tab (user, 2026-10-28), and remembers it with the favorites groups. */
async function toggleSection(event, target)
{
   const section = target.closest('[data-fhcs-fold]');
   if (!section) { return; }
   const open = !section.classList.toggle('fhcs-folded');
   target.setAttribute('aria-expanded', String(open));
   const folded = new Set(game.user.getFlag(MODULE_ID, PREFS.folded) ?? []);
   if (open) { folded.delete(section.dataset.fhcsFold); }
   else { folded.add(section.dataset.fhcsFold); }
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

/** A resource panel's cog tray: show an item's uses on the panel, or its own counter again (SCOPE §4.10). */
function linkResourceAction(event, target)
{
   target.closest('details')?.removeAttribute('open');
   return linkResource(this.actor, target.dataset.key, target.dataset.itemId);
}

/**
 * The inspiration bar (SCOPE §4.12): the star clicked is spent if filled, banked if empty (user, 2026-10-28: any
 * order). The sheet remembers which, so the redraw's moment lands on that star.
 */
function inspirationAction(event, target)
{
   const slot = Number(target.dataset.slot);
   this.element.dataset.fhcsInspireSlot = String(slot);
   return setInspirationSlot(this.actor, slot);
}

/** The inspiration gear's tray: bank inspiration in an item's uses, or back to dnd5e's on or off. */
function linkInspirationAction(event, target)
{
   target.closest('details')?.removeAttribute('open');
   return linkInspiration(this.actor, target.dataset.itemId);
}

/**
 * Inspiration gained or spent between two draws: a moment on the newest star, or on the one just spent (SCOPE §4.12);
 * each theme draws its own (Forge: stamped hot, cooling off). Styles keep it still under Motion off and reduced motion.
 */
function inspirationMoment(element)
{
   const bar = element.querySelector('.fhcs-tabs .fhcs-inspiration');
   if (!bar) { return; }
   const count = Number(bar.dataset.fhcsCount) || 0;
   const before = element.dataset.fhcsInspired;
   const slot = element.dataset.fhcsInspireSlot;
   element.dataset.fhcsInspired = String(count);
   if (before === undefined || count === Number(before)) { return; }
   delete element.dataset.fhcsInspireSlot;
   const gained = count > Number(before);
   // The star clicked, in the row and in the count's tray; else where a gain or spend from elsewhere shows.
   const stars = [...(slot !== undefined ? bar.querySelectorAll(`.fhcs-star[data-slot="${slot}"]`)
      : bar.querySelectorAll(gained ? '.fhcs-star-last' : '.fhcs-star-cooled'))];
   for (const star of stars) { star.classList.add('fhcs-star-moment'); }
   const moment = gained ? 'fhcs-moment-inspire' : 'fhcs-moment-uninspire';
   element.classList.remove('fhcs-moment-inspire', 'fhcs-moment-uninspire');
   element.classList.add(moment);
   setTimeout(() => element.classList.remove(moment), MOMENT_MS);
   // A theme's answer to a gain starts at the mark that shows it (user, 2026-10-28).
   if (gained) { inspirationGained(element, stars.find((star) => star.getClientRects().length) ?? bar); }
}

/**
 * A frame's gleam follows the pointer (user, 2026-10-28; SCOPE §5.3): the pointer's place across the frame under it,
 * as `--fhcs-gleam-x`, for a theme to draw its sheen at. Bound once per window; one write a frame at most; nothing
 * under Motion off or reduced motion; the portrait keeps its own gleam.
 */
function followPointer(element)
{
   if (element.dataset.fhcsGleam) { return; }
   element.dataset.fhcsGleam = 'on';
   let frame = null;
   let pending = null;
   element.addEventListener('pointermove', (event) =>
   {
      pending = event;
      requestAnimationFrame(() =>
      {
         if (!pending) { return; }
         const { target, clientX } = pending;
         pending = null;
         const still = element.dataset.fhcsMotion === 'off' || globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
         const next = still ? null : target.closest?.('.fhcs-frame:not(.fhcs-portrait)');
         if (frame && frame !== next) { frame.style.removeProperty('--fhcs-gleam-x'); }
         frame = next;
         if (frame) { frame.style.setProperty('--fhcs-gleam-x', `${Math.round(clientX - frame.getBoundingClientRect().left)}px`); }
      });
   });
   element.addEventListener('pointerleave', () =>
   {
      pending = null;
      frame?.style.removeProperty('--fhcs-gleam-x');
      frame = null;
   });
}

/** A resource panel's − and + (user, 2026-10-28). */
function stepResourceAction(event, target)
{
   return stepResource(this.actor, target.dataset.key, Number(target.dataset.delta));
}

/** A linked resource panel's name: uses its item. */
function useResourceAction(event, target)
{
   return useResourceItem(this.actor, target.dataset.key, event);
}

/** A resource panel's Restore: uses back to most. */
function refreshResourceAction(event, target)
{
   return refreshResource(this.actor, target.dataset.key);
}

/**
 * A linked panel's uses field is not one of the actor's fields: its change saves the item's uses itself and must not
 * submit the sheet's form.
 */
function wireResourceUses(element, actor)
{
   for (const field of element.querySelectorAll('[data-fhcs-resource-uses]'))
   {
      if (field.dataset.fhcsWired) { continue; }
      field.dataset.fhcsWired = 'true';
      field.addEventListener('change', (event) =>
      {
         event.stopPropagation();
         setResourceUses(actor, field.dataset.fhcsResourceUses, Number(field.value));
      });
   }
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
      // The title bar's theme tray, outside the content: its chip opens and closes it itself.
      for (const tray of document.querySelectorAll('.fhcs-sheet > .fhcs-theme-tray:not([hidden])'))
      {
         const sheet = tray.parentElement;
         if (!tray.contains(event.target) && !event.target.closest?.('.fhcs-theme-chip')) { showThemeTray(sheet, false); }
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
            fhcsSkillAbility: skillAbility, fhcsLinkResource: linkResourceAction, fhcsRefreshResource: refreshResourceAction, fhcsStepResource: stepResourceAction, fhcsUseResource: useResourceAction,
            fhcsToggleSection: toggleSection, fhcsSetTheme: setTheme, fhcsThemeTray: themeTray, fhcsSpecialTraits: openSpecialTraits,
            fhcsInspiration: inspirationAction, fhcsLinkInspiration: linkInspirationAction }
      };

      static PARTS = ourParts(Base.PARTS);

      /** dnd5e's ⋮ menu, with every other title-bar button added, so the bar holds only ⋮ and × (user, 2026-10-28). */
      * _getHeaderControlContextEntries()
      {
         yield* super._getHeaderControlContextEntries();
         yield* extraHeaderControls(this.element);
      }

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
         // The player's folded favorites groups and list sections.
         const folded = () => game.user.getFlag(MODULE_ID, PREFS.folded) ?? [];
         if (partId === 'header' && !this.actor.limited)
         {
            const facts = await headerFacts(this, context, MODULE_ID);
            context.fhcs = { ...headerView(facts, i18n), editable: facts.editable };
         }
         if (partId === 'details')
         {
            const prefs = {
               folded: folded(),
               open: this.fhcsOpenFavorites ?? new Set()
            };
            context.fhcsAttributes = attributesView(await attributesFacts(this, context, prefs), i18n);
         }
         if (partId === 'inventory')
         {
            const columns = columnChoice(game.settings.get(MODULE_ID, 'inventoryColumns'));
            const openContainers = game.user.getFlag(MODULE_ID, PREFS.openContainers) ?? [];
            context.fhcsInventory = inventoryView({ ...await inventoryFacts(this, context, { columns, openContainers }), folded: folded() }, i18n);
         }
         if (partId === 'spells')
         {
            const columns = spellColumnChoice(game.settings.get(MODULE_ID, 'spellColumns'));
            context.fhcsSpellbook = spellbookView({ ...await spellbookFacts(this, context, { columns }), folded: folded() }, i18n);
         }
         if (partId === 'features')
         {
            const columns = featureColumnChoice(game.settings.get(MODULE_ID, 'featureColumns'));
            context.fhcsFeatures = featuresView({ ...await featuresFacts(this, context, { columns }), folded: folded() }, i18n);
         }
         if (partId === 'effects')
         {
            context.fhcsEffects = effectsView({ ...await effectsFacts(this, context), folded: folded() }, i18n);
         }
         if (partId === 'biography')
         {
            context.fhcsBiography = biographyView(biographyFacts(this, context), i18n);
         }
         if (partId === 'tabs')
         {
            const mode = { canEdit: this.isEditable, editing: this.isEditMode };
            context.fhcsTabs = { ...tabRow(context.tabs, mode, i18n.localize), inspiration: inspirationBar(inspirationFacts(this.actor), mode, i18n) };
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

      /**
       * Never narrower than the ability row needs, so it never wraps; held at comfort stops while dragged; never shorter
       * than the tab row's foot, so the tabs always show (user, 2026-10-28).
       */
      _updatePosition(position)
      {
         const min = headerMinWidth(Object.keys(CONFIG.DND5E?.abilities ?? {}).length || 6);
         if (typeof position.width === 'number') { position.width = comfortWidth(position.width, min); }
         const tabs = this.element?.querySelector('.fhcs-tabs');
         if (typeof position.height === 'number' && tabs && !this.minimized)
         {
            const border = parseFloat(getComputedStyle(this.element).borderBottomWidth) || 0;
            const least = Math.ceil(tabs.getBoundingClientRect().bottom - this.element.getBoundingClientRect().top + border);
            position.height = Math.max(position.height, least);
         }
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
         wireResourceUses(this.element, this.actor);
         themeState(this.element, this.actor);
         inspirationMoment(this.element);
         followPointer(this.element);
         // Special Traits is a settings page: locking the sheet leaves it for Attributes.
         if (!this.isEditMode && this.tabGroups.primary === 'specialTraits') { this.changeTab('details', 'primary'); }
         await drawThemePicker(this);
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
