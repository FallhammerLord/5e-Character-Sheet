import { MODULE_ID, MODULE_PATH, THEME_FLAG, THEMES, VIEW_ACTIONS } from '../constants.js';
import { attributesFacts, biographyFacts, vehicleCargoFacts, vehicleCrewFacts, vehicleHeaderFacts, vehicleStationsFacts, encounterHeaderFacts, encounterMembersFacts, groupHeaderFacts, groupInventoryFacts, groupMembersFacts, limitedFacts, changeHp, rollHitDie, rowDocument, saveSectionOrder, sectionOrder, stepResource, useResourceItem, inspirationFacts, lastSavedAgo, setInspirationSlot, linkInspiration, linkResource, refreshResource, setResourceUses, cycleListGrouping, extraHeaderControls, savePortraitFrame, savePortraitShape, saveSkillAbility, effectsFacts, endConcentration, featuresFacts, headerFacts, inventoryFacts, levelDownClass, levelUpClass,
   passesExtraFilters, renderTemplate, setLairInside, setSpellcastingAbility, spellbookFacts, toggleInspired, toggleListFilter, watchListFilters } from '../compat.js';
import { attributesView } from '../sheet/attributes.js';
import { columnChoice, containerColumnChoice, inventoryView } from '../sheet/inventory.js';
import { EXTRA_SPELL_FILTERS, spellbookView, spellColumnChoice } from '../sheet/spellbook.js';
import { featureColumnChoice, featuresView } from '../sheet/features.js';
import { effectsView } from '../sheet/effects.js';
import { biographyView } from '../sheet/biography.js';
import { limitedView } from '../sheet/limited.js';
import { groupHeaderView, groupMembersView } from '../sheet/group.js';
import { encounterHeaderView, encounterMembersView } from '../sheet/encounter.js';
import { vehicleCrewView, vehicleHeaderView, vehicleStationsView } from '../sheet/vehicle.js';
import { FEATURE_PINS, INVENTORY_PINS, SPELL_PINS } from '../sheet/lists.js';
import { NPC_TAB_NAMES, NPC_TAB_ORDER, TEMP_TOP_FLAG, comfortWidth, headerMinWidth, headerView, hpPreview, inspirationBar, tabRow, themePicker } from '../sheet/header.js';
import { themeMoment } from './sparks.js';
import { delayTips, keepFolds } from '../chat/card.js';
import { startFraming } from './framing.js';
import { animateFold, closeTrayFold, openTrayFold, trayIn, trayOut } from './folds.js';

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

/** Our templates for dnd5e's limited parts (SCOPE §4.15): the portrait and name, then the biography. */
export const LIMITED_SHEET_PARTS = {
   header: `${MODULE_PATH}/templates/sheet/limited-header.hbs`,
   biography: `${MODULE_PATH}/templates/sheet/limited-body.hbs`
};

/**
 * Part settings of ours that differ from dnd5e's. The list tabs scroll their item list, not the whole tab, so the
 * currency and carried weight (and the spellcasting cards) stay in view; Foundry keeps the list's scroll place across
 * re-renders. Their partials load with the part, since the tab (and each container) includes them.
 */
const LIST_BAR = `${MODULE_PATH}/templates/sheet/list-bar.hbs`;
const SECTION_MOVE = `${MODULE_PATH}/templates/sheet/section-move.hbs`;
/** Partials shared by the Attributes and Features tabs and an NPC's Abilities tab (SCOPE §4.13). */
const SKILLS = `${MODULE_PATH}/templates/sheet/skills.hbs`;
const TRAITS = `${MODULE_PATH}/templates/sheet/traits.hbs`;
const FEATURES_LIST = `${MODULE_PATH}/templates/sheet/features-list.hbs`;
const PART_OPTIONS = {
   header: { templates: [`${MODULE_PATH}/templates/sheet/level-up.hbs`, `${MODULE_PATH}/templates/sheet/gear.hbs`, `${MODULE_PATH}/templates/sheet/abilities.hbs`] },
   inventory: { scrollable: ['.fhcs-items'], templates: [`${MODULE_PATH}/templates/sheet/item-row.hbs`, LIST_BAR, SECTION_MOVE] },
   spells: { scrollable: ['.fhcs-items'], templates: [`${MODULE_PATH}/templates/sheet/spell-row.hbs`, LIST_BAR, `${MODULE_PATH}/templates/sheet/gear.hbs`, `${MODULE_PATH}/templates/sheet/conc-c.hbs`, SECTION_MOVE] },
   features: { scrollable: ['.fhcs-items'], templates: [FEATURES_LIST, `${MODULE_PATH}/templates/sheet/feature-row.hbs`, LIST_BAR, SECTION_MOVE] },
   effects: { scrollable: ['.fhcs-items'], templates: [LIST_BAR, `${MODULE_PATH}/templates/sheet/conc-c.hbs`, SECTION_MOVE] },
   biography: { templates: [`${MODULE_PATH}/templates/sheet/bio-box.hbs`] },
   details: { templates: [SKILLS, TRAITS, `${MODULE_PATH}/templates/sheet/gear.hbs`, SECTION_MOVE] },
   tabs: { templates: [`${MODULE_PATH}/templates/sheet/gear.hbs`] }
};

/** Each list tab's column setting, by dnd5e's list name. */
const COLUMN_SETTINGS = {
   inventory: { setting: 'inventoryColumns', choice: columnChoice },
   spells: { setting: 'spellColumns', choice: spellColumnChoice },
   features: { setting: 'featureColumns', choice: featureColumnChoice },
   // A container's Contents (SCOPE §4.13, the container sheet): the list is dnd5e's "inventory", the setting its own.
   container: { setting: 'containerColumns', choice: containerColumnChoice }
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
   const open = target.getAttribute('aria-expanded') !== 'true';
   target.setAttribute('aria-expanded', String(open));
   // What shows only while folded (the traits' one-line summary) swaps as the rows show and once they're gone.
   animateFold(list, open, (shown) =>
   {
      list.hidden = !shown;
      for (const el of group.querySelectorAll('[data-fhcs-folded]')) { el.hidden = shown; }
   });
   const folded = new Set(game.user.getFlag(MODULE_ID, PREFS.folded) ?? []);
   if (!open) { folded.add(group.dataset.fhcsGroup); }
   else { folded.delete(group.dataset.fhcsGroup); }
   await game.user.setFlag(MODULE_ID, PREFS.folded, [...folded]);
}

/** How long a theme's moment (a hit taken, a heal) stays marked on the sheet: its animation runs within it. */
const MOMENT_MS = 650;

/** Below this width the sheet is narrow (`data-fhcs-narrow`), matching the layout check's frames. */
const NARROW_WIDTH = 700;

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
   // Temp first: damage takes it first, so on a hit that takes both, HP's bar drains after Temp's (user, 2026-11-08).
   const temp = Math.max(0, Number(hp.temp) || 0);
   const tempTop = Math.max(Number(actor.flags?.[MODULE_ID]?.[TEMP_TOP_FLAG]) || 0, temp);
   const tempMoved = barMoment(element, 'Temp', temp, tempTop, 'fhcs-moment-temp');
   // HP's bar spans max HP with or without Max ±, whichever is larger (header.js hpBars).
   element.style.setProperty('--fhcs-hp-delay', tempMoved === 'hit' ? `${TEMP_DRAIN_MS}ms` : '0ms');
   const hpMoved = barMoment(element, 'Hp', value, Math.max(Number(hp.effectiveMax ?? hp.max) || 0, Number(hp.max) || 0), 'fhcs-moment');
   // The theme's answer, once for the draw (HP's moment over Temp's), at the HP bar shown.
   const moved = hpMoved ?? tempMoved;
   if (moved) { themeMoment(element, moved, [...element.querySelectorAll('.fhcs-hp-meter')].find((bar) => bar.getClientRects().length)); }
}

/** How long Temp's bar drains before HP's starts, on a hit that takes both. */
const TEMP_DRAIN_MS = 250;

/**
 * A hit or heal moment on one of the HP bars, when its value moved between two draws: where its fill stood
 * (`--fhcs-hp-was`, `--fhcs-temp-was`) and `<prefix>-hit` or `-heal` on the sheet for one moment.
 * @returns {'hit'|'heal'|null} Which way the value moved, if it did.
 */
function barMoment(element, name, value, top, prefix)
{
   const key = `fhcs${name}Value`;
   const before = element.dataset[key];
   element.dataset[key] = String(value);
   if (before === undefined || Number(before) === value) { return null; }
   element.style.setProperty(`--fhcs-${name.toLowerCase()}-was`, (top > 0 ? Math.clamp(Number(before) / top, 0, 1) : 0).toFixed(2));
   const fell = value < Number(before);
   const moment = `${prefix}-${fell ? 'hit' : 'heal'}`;
   element.classList.remove(`${prefix}-hit`, `${prefix}-heal`);
   element.classList.add(moment);
   setTimeout(() => element.classList.remove(moment), MOMENT_MS);
   return fell ? 'hit' : 'heal';
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

/**
 * The Traits panel's gear (edit mode): dnd5e's Special Traits page, which the tab row no longer draws. The page's own
 * gear closes it, back to Attributes (user, 2026-11-08).
 */
function openSpecialTraits()
{
   const open = this.tabGroups.primary === 'specialTraits';
   this.changeTab(open ? this.fhcsHomeTab : 'specialTraits', 'primary', { force: true });
}

const SETTINGS_HEAD = `${MODULE_PATH}/templates/sheet/settings-head.hbs`;

/** Special Traits' bar, drawn into dnd5e's page: its name and the gear that closes it. Edit mode only. */
async function drawSettingsHead(sheet)
{
   const page = sheet.element.querySelector('.tab[data-tab="specialTraits"]');
   const old = page?.querySelector(':scope > .fhcs-settings-head');
   if (!page || !sheet.isEditMode) { old?.remove(); return; }
   if (old) { return; }
   const holder = document.createElement('div');
   holder.innerHTML = await renderTemplate(SETTINGS_HEAD, {
      title: game.i18n.localize('FHCS.Attributes.SpecialTraits'), close: game.i18n.localize('FHCS.Attributes.SpecialTraitsClose')
   });
   page.prepend(holder.firstElementChild);
   delayTips(page);
}

/** The title bar's palette: opens or closes its tray. */
function themeTray()
{
   const tray = this.element.querySelector(':scope > .fhcs-theme-tray');
   if (!tray) { return; }
   if (tray.hidden) { showThemeTray(this.element, true); trayIn(tray); }
   else { trayOut(tray, () => showThemeTray(this.element, false)); }
}

/** Folds or opens a section on a list tab (user, 2026-10-28), and remembers it with the favorites groups. */
async function toggleSection(event, target)
{
   const section = target.closest('[data-fhcs-fold]');
   if (!section) { return; }
   const open = target.getAttribute('aria-expanded') !== 'true';
   target.setAttribute('aria-expanded', String(open));
   animateFold(section.querySelector(':scope > .fhcs-item-list'), open, (shown) => section.classList.toggle('fhcs-folded', !shown));
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
   const shown = list.hidden;
   target.setAttribute('aria-expanded', String(shown));
   animateFold(list, shown, (show) => { list.hidden = !show; });
   const open = new Set(game.user.getFlag(MODULE_ID, PREFS.openContainers) ?? []);
   if (!shown) { open.delete(row.dataset.itemId); }
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

/** The inspiration bar (SCOPE §4.12): the star clicked is spent if filled, banked if empty (user, 2026-10-28: any order). */
function inspirationAction(event, target)
{
   return setInspirationSlot(this.actor, Number(target.dataset.slot));
}

/** The inspiration gear's tray: bank inspiration in an item's uses, or back to dnd5e's on or off. */
function linkInspirationAction(event, target)
{
   target.closest('details')?.removeAttribute('open');
   return linkInspiration(this.actor, target.dataset.itemId);
}

/** The bank's places as drawn, one letter each (filled or empty), read from the row or the count's tray. */
function drawnPlaces(bar)
{
   const places = [];
   for (const star of bar.querySelectorAll('.fhcs-star[data-slot]')) { places[Number(star.dataset.slot)] = star.classList.contains('fhcs-on') ? 'x' : '-'; }
   return Array.from(places, (place) => place ?? '-').join('');
}

/**
 * Inspiration gained or spent between two draws: a moment on the star that changed (SCOPE §4.12); each theme draws its
 * own (Forge: stamped hot, cooling off). Every client finds that star the same way, by the places drawn before and now
 * (ask 14, 2026-11-08: only the clicking client knew the star, so other players saw the moment land on another), and
 * a further redraw while the moment runs carries it on from where it was (`--fhcs-inspire-at`), as toggles do. Styles
 * keep it still under Motion off and reduced motion.
 */
function inspirationMoment(element, actor)
{
   const bar = element.querySelector('.fhcs-tabs .fhcs-inspiration');
   if (!bar) { return; }
   const count = Number(bar.dataset.fhcsCount) || 0;
   const places = drawnPlaces(bar);
   const before = element.fhcsInspired;
   element.fhcsInspired = { count, places };
   let moment = element.fhcsInspireMoment;
   if (before && count !== before.count)
   {
      const gained = count > before.count;
      // The places that turned the way the count went; else (no bank, or a bank just linked) where the view shows it.
      const slots = [...places].flatMap((place, slot) => (place !== (before.places[slot] ?? '-') && (place === 'x') === gained ? [slot] : []));
      moment = element.fhcsInspireMoment = { gained, slots, start: Date.now() };
      element.classList.remove('fhcs-moment-inspire', 'fhcs-moment-uninspire');
      element.classList.add(gained ? 'fhcs-moment-inspire' : 'fhcs-moment-uninspire');
      clearTimeout(element.fhcsInspireTimer);
      element.fhcsInspireTimer = setTimeout(() => element.classList.remove('fhcs-moment-inspire', 'fhcs-moment-uninspire'), MOMENT_MS);
      savedAgo(actor, gained);
   }
   if (!moment) { return; }
   const elapsed = Date.now() - moment.start;
   if (elapsed >= MOMENT_MS) { element.fhcsInspireMoment = null; return; }
   const stars = [...(moment.slots.length ? bar.querySelectorAll(moment.slots.map((slot) => `.fhcs-star[data-slot="${slot}"]`).join(', '))
      : bar.querySelectorAll(moment.gained ? '.fhcs-star-last' : '.fhcs-star-cooled'))];
   for (const star of stars)
   {
      star.style.setProperty('--fhcs-inspire-at', `-${elapsed}ms`);
      star.classList.add('fhcs-star-moment');
   }
   // A theme's answer starts at the mark that shows it (user, 2026-10-28), once: its canvas outlives redraws.
   if (moment.shown) { return; }
   moment.shown = true;
   const shown = stars.find((star) => star.getClientRects().length) ?? bar;
   themeMoment(element, moment.gained ? 'gained' : 'spent', shown);
}

/**
 * Says in the console how long after the save this client drew inspiration's moment (ask 14): the save's server time
 * against this client's, so players' consoles can be compared.
 */
function savedAgo(actor, gained)
{
   const ago = lastSavedAgo(actor);
   if (ago !== null) { console.info(`fhcs | Inspiration ${gained ? 'gained' : 'spent'}: drawn for ${game.user?.name} ${ago}ms after the save.`); }
}

/**
 * Trays open and close smoothly (ask 3): a summary's press on a tray's `details` opens it with the tray's fade begun
 * in the same frame, or fades the tray out before the `details` closes. Only the player's own press: one reopened after
 * a redraw (keepFolds) stays put. Bound once per window.
 */
function fadeTrays(sheet)
{
   if (!sheet.element || sheet.element.dataset.fhcsTrays) { return; }
   sheet.element.dataset.fhcsTrays = 'true';
   sheet.element.addEventListener('click', (event) =>
   {
      const summary = event.target.closest?.('details > summary');
      const details = summary?.parentElement;
      if (!details?.querySelector(':scope > .fhcs-tray')) { return; }
      event.preventDefault();
      if (details.open) { closeTrayFold(details); }
      else { openTrayFold(details); }
   }, { capture: true });
}

/** How long the tab line takes to slide: an answer to the player, under 300ms (SCOPE §5.3 rule 6). */
const TAB_SLIDE_MS = 250;

/**
 * Slides the open tab's line from where the last one was (`from`, its box): the new tab's line starts at that place
 * and width (`--fhcs-tab-from-x`, `-w`) and settles under the new tab. Styles keep it still under Motion off.
 */
function slideTabLine(row, from)
{
   const tab = row?.querySelector('.fhcs-tab.active');
   if (!tab || !from) { return; }
   const to = tab.getBoundingClientRect();
   if (!to.width || Math.abs(to.left - from.left) < 1) { return; }
   tab.style.setProperty('--fhcs-tab-from-x', `${Math.round(from.left - to.left)}px`);
   tab.style.setProperty('--fhcs-tab-from-w', (from.width / to.width).toFixed(3));
   tab.classList.remove('fhcs-tab-slid');
   void tab.offsetWidth;
   tab.classList.add('fhcs-tab-slid');
   setTimeout(() => tab.classList.remove('fhcs-tab-slid'), TAB_SLIDE_MS + 50);
}

/** The toggles that get an on and an off moment (SCOPE §5.3 rule 6; Phase 6.55): pips, marks and switches. */
const TOGGLES = '.fhcs-slot, .fhcs-death-pip, .fhcs-toggle-equip, .fhcs-toggle-attune, .fhcs-toggle-prep, .fhcs-toggle-fav, '
   + '.fhcs-switch, .fhcs-condition';

/** How long a clicked toggle waits for its redraw. */
const TOGGLE_WAIT_MS = 3000;

/** The data that names a toggle across a redraw: its action and place, its row's item or effect, its pips' field. */
const TOGGLE_NAMES = ['itemId', 'effectId', 'parentId', 'prop', 'conditionId'];

/** A toggle's name: its action, its own data, then each named place it sits in, out to the window. */
function toggleName(toggle)
{
   const parts = [toggle.dataset.action ?? '', toggle.dataset.n ?? '', toggle.dataset.conditionId ?? ''];
   for (let node = toggle.parentElement; node && !node.matches('.window-content'); node = node.parentElement)
   {
      for (const key of TOGGLE_NAMES) { if (node.dataset[key]) { parts.push(`${key}=${node.dataset[key]}`); } }
   }
   return parts.join('|');
}

/**
 * Remembers the toggle a click lands on, so the redraw that click causes can give that one toggle its moment (the
 * redraw replaces the markup). Bound once per window, in the capture phase, ahead of dnd5e's own handlers.
 */
function rememberToggles(sheet)
{
   const content = sheet.element.querySelector(':scope > .window-content');
   if (!content || content.dataset.fhcsToggles) { return; }
   content.dataset.fhcsToggles = 'true';
   content.addEventListener('click', (event) =>
   {
      const toggle = event.target.closest?.(TOGGLES);
      if (toggle && content.contains(toggle)) { sheet.fhcsToggled = { name: toggleName(toggle), was: toggle.getAttribute('aria-pressed'), at: Date.now() }; }
   }, { capture: true });
}

/**
 * After a redraw, the toggle last clicked turns on or off with its moment (`fhcs-toggled-on`, `-off`), if its state
 * changed; each theme draws its own through `--fhcs-toggle-on` and `-off`. A further redraw while the moment runs
 * (two saves for one click) carries it on from where it was (`--fhcs-toggle-at`), so it never starts over. Styles keep
 * it still under Motion off and reduced motion.
 */
function toggleMoment(sheet)
{
   const clicked = sheet.fhcsToggled;
   // A click whose redraw never came (nothing changed) is forgotten, so a later change from elsewhere keeps still.
   if (!clicked || Date.now() - clicked.at > TOGGLE_WAIT_MS) { return; }
   const found = [...sheet.element.querySelectorAll(TOGGLES)].filter((toggle) => toggleName(toggle) === clicked.name);
   if (!clicked.start)
   {
      const changed = found.find((toggle) => toggle.getAttribute('aria-pressed') !== clicked.was);
      if (!changed) { return; }
      clicked.start = Date.now();
      clicked.now = changed.getAttribute('aria-pressed');
   }
   const elapsed = Date.now() - clicked.start;
   if (elapsed >= MOMENT_MS) { sheet.fhcsToggled = null; return; }
   const moment = clicked.now === 'true' ? 'fhcs-toggled-on' : 'fhcs-toggled-off';
   for (const toggle of found.filter((each) => each.getAttribute('aria-pressed') === clicked.now))
   {
      toggle.style.setProperty('--fhcs-toggle-at', `-${elapsed}ms`);
      toggle.classList.add(moment);
      setTimeout(() => toggle.classList.remove(moment), MOMENT_MS - elapsed);
   }
}

/** How long the portrait's light catch takes to cross the art (the styles' animation, 500ms) and a little over. */
const CATCH_MS = 550;

/** When each window's portrait may catch the light again. */
const catchRests = new WeakMap();

/** The portrait's rest after a catch, from its start: the catch itself, then 10 + 1d6 seconds. */
const catchRest = () => CATCH_MS + (10 + Math.ceil(Math.random() * 6)) * 1000;

/**
 * The portrait catches the light once each time the pointer comes onto it (SCOPE §5.3 rule 6): the sheet marks it
 * `fhcs-catching` for one pass, so the catch runs to its end, clears on its own while the pointer stays, and a quick
 * out and in never restarts it (user, 2026-10-29: on :hover it lingered and replayed); then it rests 10 + 1d6 seconds
 * (user, 2026-11-08). Bound once per window.
 */
function catchLight(element)
{
   if (element.dataset.fhcsCatch) { return; }
   element.dataset.fhcsCatch = 'on';
   element.addEventListener('pointerover', (event) =>
   {
      const portrait = event.target.closest?.('.fhcs-portrait');
      if (!portrait || portrait.contains(event.relatedTarget) || portrait.classList.contains('fhcs-catching')) { return; }
      // A rest after each catch (user, 2026-11-08: replaying at once was distracting): 10 + 1d6 seconds. Kept on the
      // window, so a redraw's new portrait waits too.
      if (Date.now() < (catchRests.get(element) ?? 0)) { return; }
      catchRests.set(element, Date.now() + catchRest());
      portrait.classList.add('fhcs-catching');
      setTimeout(() => portrait.classList.remove('fhcs-catching'), CATCH_MS);
   });
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

/**
 * A section's up or down arrow in edit mode (SCOPE §4.13, user 2026-10-28): it swaps places with the next section
 * shown that way, and the tab's whole order, as drawn, is saved on the character.
 */
function moveSection(event, target)
{
   const { tab, section } = target.dataset;
   const delta = Number(target.dataset.delta);
   const head = target.closest('[data-fhcs-section]');
   const list = head?.parentElement;
   if (!list || !tab) { return null; }
   const all = [...list.querySelectorAll(':scope > [data-fhcs-section]')];
   const shown = all.filter((el) => !el.hidden);
   const at = shown.findIndex((el) => el.dataset.fhcsSection === section);
   const other = shown[at + delta];
   if (at < 0 || !other) { return null; }
   const ids = all.map((el) => el.dataset.fhcsSection);
   const a = ids.indexOf(section);
   const b = ids.indexOf(other.dataset.fhcsSection);
   [ids[a], ids[b]] = [ids[b], ids[a]];
   return saveSectionOrder(this.actor, tab, ids);
}

/** The HD chip in play mode: rolls a hit die. */
function rollHitDieAction(event)
{
   return rollHitDie(this.actor, event);
}

/**
 * A middle click on a row opens its sheet (user, 2026-10-28: "middle click to open its item/feature/spell/etc
 * sheets"): items, effects, and anything with a UUID (the header's class, species and background cards). The middle
 * button's press is held back on a row, so the browser's autoscroll doesn't start. Bound once per window.
 */
function middleClickOpens(element, actor)
{
   if (element.dataset.fhcsMiddle) { return; }
   element.dataset.fhcsMiddle = 'on';
   const row = (event) => (event.button === 1 && !event.target.closest('input, textarea, select, prose-mirror')
      ? event.target.closest('.window-content [data-item-id], .window-content [data-effect-id], .window-content [data-uuid]') : null);
   element.addEventListener('mousedown', (event) => { if (row(event)) { event.preventDefault(); } });
   element.addEventListener('auxclick', (event) =>
   {
      const target = row(event);
      const doc = target ? rowDocument(actor, target) : null;
      if (!doc?.sheet) { return; }
      event.preventDefault();
      doc.sheet.render({ force: true });
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
         if (!fold.contains(event.target)) { closeTrayFold(fold); }
      }
      // The title bar's theme tray, outside the content: its chip opens and closes it itself.
      for (const tray of document.querySelectorAll('.fhcs-sheet > .fhcs-theme-tray:not([hidden])'))
      {
         const sheet = tray.parentElement;
         if (!tray.contains(event.target) && !event.target.closest?.('.fhcs-theme-chip')) { trayOut(tray, () => showThemeTray(sheet, false)); }
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
 * The Inventory list's own actions, shared with the container sheet's Contents tab (SCOPE §4.13): folds for sections
 * and containers, and the Columns menu.
 */
export const INVENTORY_LIST_ACTIONS = { fhcsToggleContainer: toggleContainer, fhcsToggleSection: toggleSection, fhcsToggleColumn: toggleColumn };

/**
 * What an Inventory list needs after each render on a sheet that isn't ours by class (the container sheet): trays that
 * close on a click elsewhere, and search matches kept in view inside containers.
 * @param {HTMLElement} element  The window.
 */
export function wireInventoryList(element)
{
   closeTraysOnClickOff();
   const items = element.querySelector('.fhcs-inventory .fhcs-items');
   if (items && !items.dataset.fhcsWatched)
   {
      items.dataset.fhcsWatched = 'true';
      showMatchesInContainers(items);
   }
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

/** dnd5e's limited parts with our templates, keeping its part settings (container, scrolling) but not its classes. */
function limitedParts(baseParts)
{
   return Object.fromEntries(Object.entries(baseParts ?? {}).map(([id, part]) =>
   {
      if (!LIMITED_SHEET_PARTS[id]) { return [id, part]; }
      const kept = { ...part, template: LIMITED_SHEET_PARTS[id] };
      delete kept.classes;
      delete kept.templates;
      return [id, kept];
   }));
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
            fhcsSkillAbility: skillAbility, fhcsLinkResource: linkResourceAction, fhcsRefreshResource: refreshResourceAction, fhcsStepResource: stepResourceAction, fhcsRollHitDie: rollHitDieAction, fhcsMoveSection: moveSection, fhcsUseResource: useResourceAction,
            fhcsToggleSection: toggleSection, fhcsSetTheme: setTheme, fhcsThemeTray: themeTray, fhcsSpecialTraits: openSpecialTraits,
            fhcsInspiration: inspirationAction, fhcsLinkInspiration: linkInspirationAction }
      };

      static PARTS = ourParts(Base.PARTS);

      static LIMITED_PARTS = limitedParts(Base.LIMITED_PARTS);

      /** The tab Special Traits closes back to, and a locked sheet leaves it for. */
      get fhcsHomeTab()
      {
         return 'details';
      }

      /** Whether this sheet draws a part with our template (an NPC's tab bodies stay dnd5e's until their slices). */
      fhcsDraws(partId)
      {
         return String(this.constructor.PARTS?.[partId]?.template ?? '').startsWith(`${MODULE_PATH}/`);
      }

      /** dnd5e's ⋮ menu, with every other title-bar button added, so the bar holds only ⋮ and × (user, 2026-10-28). */
      * _getHeaderControlContextEntries()
      {
         yield* super._getHeaderControlContextEntries();
         yield* extraHeaderControls(this.element);
      }

      /** The open tab's line slides from the tab left to the one opened (Phase 6.55). */
      changeTab(tab, group, options)
      {
         const row = this.element?.querySelector('.fhcs-tabs');
         const from = row?.querySelector('.fhcs-tab.active')?.getBoundingClientRect();
         super.changeTab(tab, group, options);
         slideTabLine(row, from);
      }

      /**
       * A viewer who can't edit (Observer) still folds, expands and opens what they read (SCOPE §4.15): Foundry has
       * just disabled every control, and dnd5e re-enabled only `.always-interactive`.
       */
      _toggleDisabled(disabled)
      {
         super._toggleDisabled(disabled);
         if (!disabled) { return; }
         const selector = VIEW_ACTIONS.map((action) => `.window-content [data-action="${action}"]`).join(', ');
         for (const control of this.element.querySelectorAll(selector)) { control.disabled = false; }
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
         try { return await this.fhcsPartContext(partId, context); }
         catch (error)
         {
            // Foundry logs the failed render; this names the part and who saw it (user, 2026-11-06: players only).
            console.error(`fhcs | The ${partId} part failed to draw (${game.user.isGM ? 'GM' : 'player'} ${game.user.name}, ${this.actor?.name}).`, error);
            throw error;
         }
      }

      /** Our display values for one part, beside dnd5e's context. */
      async fhcsPartContext(partId, context)
      {
         const i18n = { localize: (key) => game.i18n.localize(key), format: (key, data) => game.i18n.format(key, data) };
         // The player's folded favorites groups and list sections.
         const folded = () => game.user.getFlag(MODULE_ID, PREFS.folded) ?? [];
         // A Limited view (SCOPE §4.15) draws dnd5e's limited parts only: the header and the biography.
         if (this.actor.limited)
         {
            if (partId in LIMITED_SHEET_PARTS) { context.fhcsLimited = limitedView(await limitedFacts(this, context, MODULE_ID), i18n); }
            return context;
         }
         if (!this.fhcsDraws(partId)) { return context; }
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
            context.fhcsAttributes = attributesView({ ...await attributesFacts(this, context, prefs), order: sectionOrder(this.actor, 'favorites') }, i18n);
         }
         if (partId === 'inventory')
         {
            const columns = columnChoice(game.settings.get(MODULE_ID, 'inventoryColumns'));
            const openContainers = game.user.getFlag(MODULE_ID, PREFS.openContainers) ?? [];
            context.fhcsInventory = inventoryView({ ...await inventoryFacts(this, context, { columns, openContainers }), folded: folded(), order: sectionOrder(this.actor, 'inventory') }, i18n);
         }
         if (partId === 'spells')
         {
            const columns = spellColumnChoice(game.settings.get(MODULE_ID, 'spellColumns'));
            context.fhcsSpellbook = spellbookView({ ...await spellbookFacts(this, context, { columns }), folded: folded(), order: sectionOrder(this.actor, 'spells') }, i18n);
         }
         if (partId === 'features')
         {
            const columns = featureColumnChoice(game.settings.get(MODULE_ID, 'featureColumns'));
            context.fhcsFeatures = featuresView({ ...await featuresFacts(this, context, { columns }), folded: folded(), order: sectionOrder(this.actor, 'features') }, i18n);
            // An NPC's Abilities tab (SCOPE §4.13): its skills and traits beside the features.
            if (this.actor.type === 'npc')
            {
               // One Traits panel and nothing to order it against: no move arrows.
               context.fhcsAttributes = { ...attributesView({ ...await attributesFacts(this, context, { folded: folded() }), order: [] }, i18n), traitsMove: null };
            }
         }
         if (partId === 'effects')
         {
            context.fhcsEffects = effectsView({ ...await effectsFacts(this, context), folded: folded(), order: sectionOrder(this.actor, 'effects') }, i18n);
         }
         if (partId === 'biography')
         {
            context.fhcsBiography = biographyView(biographyFacts(this, context), i18n);
         }
         if (partId === 'tabs')
         {
            const mode = { canEdit: this.isEditable, editing: this.isEditMode };
            const { names, order } = this.fhcsTabNames ?? {};
            context.fhcsTabs = { ...tabRow(context.tabs, mode, i18n.localize, names, order), inspiration: inspirationBar(inspirationFacts(this.actor), mode, i18n) };
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

      /**
       * dnd5e's NPC sheet adds an add button into its own inventory's `.bottom` after each render (npc-sheet.mjs:527,
       * base-actor-sheet.mjs:1033); ours has no such slot, and it threw there, stopping the rest of the render (Quench,
       * 2026-11-10). The window's own add button (primary-sheet-mixin.mjs:263) serves Inventory, as on a character's.
       */
      _renderCreateInventory()
      {
         // The window's add button is shown on Inventory by styles/fhcs.css.
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
         // An encounter has no ability row and opens narrower (SCOPE §4.13): its own least width.
         const min = this.fhcsMinWidth ?? headerMinWidth(Object.keys(CONFIG.DND5E?.abilities ?? {}).length || 6);
         if (typeof position.width === 'number') { position.width = comfortWidth(position.width, min); }
         // Narrow (under 700px, the 644 minimum's band): lesser columns give way where a width container can't be used
         // (no container-type around text fields, CLAUDE.md). The layout check marks its narrow frames the same way.
         if (typeof position.width === 'number') { this.element?.toggleAttribute('data-fhcs-narrow', position.width < NARROW_WIDTH); }
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
         // Our extras run after dnd5e's: one that throws must not leave the sheet half-wired (user, 2026-11-06: players'
         // sheets sometimes stop taking edits until reopened). It says so in the console, naming who and which step.
         try { await this.fhcsAfterRender(); }
         catch (error)
         {
            console.error(`fhcs | The sheet's extras failed after a render (${game.user.isGM ? 'GM' : 'player'} ${game.user.name}, ${this.actor?.name}).`, error);
         }
      }

      /** What our sheet adds after each render: listeners, theme state, the title bar's picker, pinned filters. */
      async fhcsAfterRender()
      {
         // The header's trays stay open across re-renders; its chips' tooltips wait like the cards' do.
         keepFolds(this.element, `sheet-${this.id}`);
         closeTraysOnClickOff();
         wireHpTray(this.element);
         wireResourceUses(this.element, this.actor);
         themeState(this.element, this.actor);
         inspirationMoment(this.element, this.actor);
         rememberToggles(this);
         fadeTrays(this);
         toggleMoment(this);
         followPointer(this.element);
         catchLight(this.element);
         middleClickOpens(this.element, this.actor);
         // Special Traits is a settings page: locking the sheet leaves it for Attributes.
         if (!this.isEditMode && this.tabGroups.primary === 'specialTraits') { this.changeTab(this.fhcsHomeTab, 'primary'); }
         await drawSettingsHead(this);
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

/* ---------- The NPC sheet (SCOPE §4.13, user 2026-11-09) ---------- */

/** dnd5e's NPC parts we draw: every one but Special Traits, which keeps dnd5e's form under our styles, as the character's. */
const NPC_OUR_PARTS = ['header', 'tabs', 'features', 'inventory', 'spells', 'effects', 'biography'];

/**
 * An NPC's own templates and part settings where they differ from the character's: Abilities (dnd5e's "features")
 * holds the skills, traits and features, and the whole tab scrolls.
 */
const NPC_PART_TEMPLATES = { features: `${MODULE_PATH}/templates/sheet/npc-abilities.hbs` };
const NPC_PART_OPTIONS = {
   features: { scrollable: [''], templates: [SKILLS, TRAITS, FEATURES_LIST, `${MODULE_PATH}/templates/sheet/feature-row.hbs`, LIST_BAR, SECTION_MOVE,
      `${MODULE_PATH}/templates/sheet/gear.hbs`] }
};

/** dnd5e's NPC sidebar and its collapser go: its skills and traits move to the Abilities tab (its own slice). */
const NPC_DROPPED_PARTS = ['sidebarCollapser', 'sidebar'];

/** dnd5e's NPC parts with ours swapped in, its sidebar gone, the header and tab row first. */
function npcParts(baseParts)
{
   const entries = Object.entries(baseParts ?? {})
      .filter(([id]) => !NPC_DROPPED_PARTS.includes(id))
      .map(([id, part]) =>
      {
         if (!NPC_OUR_PARTS.includes(id)) { return [id, part]; }
         const kept = { ...part, template: NPC_PART_TEMPLATES[id] ?? SHEET_PARTS[id] };
         delete kept.classes;
         delete kept.templates;
         return [id, { ...kept, ...(NPC_PART_OPTIONS[id] ?? PART_OPTIONS[id]) }];
      });
   const rank = (id) => (LEADING_PARTS.includes(id) ? LEADING_PARTS.indexOf(id) : LEADING_PARTS.length);
   return Object.fromEntries(entries.sort(([a], [b]) => rank(a) - rank(b)));
}

/** An NPC's spellcasting ability, with no casting class (its Spellbook card, edit mode). */
function spellAbilityAction(event, target)
{
   target.closest('details')?.removeAttribute('open');
   return setSpellcastingAbility(this.actor, target.dataset.fhcsAbility);
}

/** In the lair or out (the NPC's lair panel, play mode, modern rules). */
function lairInsideAction(event, target)
{
   return setLairInside(this.actor, target.getAttribute('aria-pressed') !== 'true');
}

/** An NPC's inspiration on or off, without a bank (dnd5e's own action is the character sheet's). */
function toggleInspiredAction()
{
   return toggleInspired(this.actor);
}

/**
 * Our NPC sheet: dnd5e's NPC sheet with the character sheet's layer on top (the same base class, BaseActorSheet), the
 * header and tab row ours, its everything tab first.
 */
export function makeNpcSheet(Base)
{
   return class FHCSNpcSheet extends makeCharacterSheet(Base)
   {
      static DEFAULT_OPTIONS = {
         classes: ['fhcs-npc'],
         actions: { fhcsLairInside: lairInsideAction, fhcsToggleInspiration: toggleInspiredAction, fhcsSpellAbility: spellAbilityAction }
      };

      static PARTS = npcParts(Base.PARTS);

      /** Our names and order for the NPC's tabs. */
      fhcsTabNames = { names: NPC_TAB_NAMES, order: NPC_TAB_ORDER };

      /** @inheritDoc */
      get fhcsHomeTab()
      {
         return 'features';
      }

   };
}

/* ---------- The group sheet (SCOPE §4.13, user 2026-11-10) ---------- */

/** dnd5e's group parts we draw, with their templates and part settings. The tab bodies follow in their slices. */
const GROUP_PARTS = {
   header: { template: `${MODULE_PATH}/templates/group/header.hbs`, templates: [`${MODULE_PATH}/templates/sheet/gear.hbs`] },
   tabs: { template: SHEET_PARTS.tabs, ...PART_OPTIONS.tabs },
   members: { template: `${MODULE_PATH}/templates/group/members.hbs`, scrollable: [''] },
   inventory: { template: SHEET_PARTS.inventory, ...PART_OPTIONS.inventory },
   effects: { template: SHEET_PARTS.effects, ...PART_OPTIONS.effects },
   biography: { template: SHEET_PARTS.biography, ...PART_OPTIONS.biography }
};

/** dnd5e's group parts with ours swapped in, keeping its part settings (container, scrolling) but not its classes. */
function groupParts(baseParts)
{
   return Object.fromEntries(Object.entries(baseParts ?? {}).map(([id, part]) =>
   {
      if (!GROUP_PARTS[id]) { return [id, part]; }
      const kept = { ...part };
      delete kept.classes;
      delete kept.templates;
      return [id, { ...kept, ...GROUP_PARTS[id] }];
   }));
}

/**
 * Our group sheet: dnd5e's group sheet with the character sheet's layer on top (the same base class, BaseActorSheet):
 * our lock, theme and title bar; the header, tab row and tab bodies ours.
 */
export function makeGroupSheet(Base)
{
   return class FHCSGroupSheet extends makeCharacterSheet(Base)
   {
      static DEFAULT_OPTIONS = {
         classes: ['fhcs-group']
      };

      static PARTS = groupParts(Base.PARTS);

      /** @inheritDoc */
      get fhcsHomeTab()
      {
         return 'members';
      }

      /** The group's header and tab row; the rest as the character sheet draws them. */
      async fhcsPartContext(partId, context)
      {
         const i18n = { localize: (key) => game.i18n.localize(key), format: (key, data) => game.i18n.format(key, data) };
         if (partId === 'header')
         {
            context.fhcsGroup = groupHeaderView(groupHeaderFacts(this, context), i18n);
            return context;
         }
         if (partId === 'members')
         {
            context.fhcsMembers = groupMembersView(groupMembersFacts(this, context), i18n);
            return context;
         }
         if (partId === 'inventory')
         {
            // The container's columns and their setting (SCOPE §4.13): a group wears nothing.
            const columns = containerColumnChoice(game.settings.get(MODULE_ID, 'containerColumns'));
            const openContainers = game.user.getFlag(MODULE_ID, PREFS.openContainers) ?? [];
            const folded = game.user.getFlag(MODULE_ID, PREFS.folded) ?? [];
            context.fhcsInventory = inventoryView({ ...await groupInventoryFacts(this, context, { columns, openContainers }), folded,
               order: sectionOrder(this.actor, 'inventory') }, i18n);
            return context;
         }
         if (partId === 'tabs')
         {
            // dnd5e's tab names; no inspiration (a group has none).
            context.fhcsTabs = tabRow(context.tabs, { canEdit: this.isEditable, editing: this.isEditMode }, i18n.localize, {}, []);
            return context;
         }
         return super.fhcsPartContext(partId, context);
      }
   };
}

/* ---------- The encounter sheet (SCOPE §4.13, user 2026-11-10) ---------- */

/** dnd5e's encounter parts we draw: all of them; Loot is our Inventory, Description our Biography. */
const ENCOUNTER_PARTS = {
   header: { template: `${MODULE_PATH}/templates/encounter/header.hbs` },
   tabs: GROUP_PARTS.tabs,
   members: { template: `${MODULE_PATH}/templates/encounter/members.hbs`, scrollable: [''] },
   inventory: GROUP_PARTS.inventory,
   description: { template: SHEET_PARTS.biography, ...PART_OPTIONS.biography }
};

/** dnd5e's least width for an encounter (encounter-sheet.mjs: 500), which ours keeps. */
const ENCOUNTER_MIN_WIDTH = 500;

/**
 * Our encounter sheet: dnd5e's encounter sheet with the group sheet's layer on top (the same base, MultiActorSheet):
 * the group's header pattern, the Members rows with counts, Loot and Description. Resizable (§5.4 rule 4), which
 * dnd5e's isn't.
 */
export function makeEncounterSheet(Base)
{
   const parts = Object.fromEntries(Object.entries(Base.PARTS ?? {}).map(([id, part]) =>
   {
      if (!ENCOUNTER_PARTS[id]) { return [id, part]; }
      const kept = { ...part };
      delete kept.classes;
      delete kept.templates;
      return [id, { ...kept, ...ENCOUNTER_PARTS[id] }];
   }));
   return class FHCSEncounterSheet extends makeGroupSheet(Base)
   {
      static DEFAULT_OPTIONS = {
         classes: ['fhcs-encounter'],
         position: { width: 560, height: 640 },
         window: { resizable: true }
      };

      static PARTS = parts;

      /** @inheritDoc */
      get fhcsMinWidth()
      {
         return ENCOUNTER_MIN_WIDTH;
      }

      /** The encounter's header, Members and Description; the tab row and Loot as the group draws them. */
      async fhcsPartContext(partId, context)
      {
         const i18n = { localize: (key) => game.i18n.localize(key), format: (key, data) => game.i18n.format(key, data) };
         if (partId === 'header')
         {
            context.fhcsEncounter = encounterHeaderView(await encounterHeaderFacts(this), i18n);
            return context;
         }
         if (partId === 'members')
         {
            context.fhcsEncounterMembers = encounterMembersView(await encounterMembersFacts(this, context), i18n);
            return context;
         }
         if (partId === 'description')
         {
            context.fhcsBiography = biographyView(biographyFacts(this, context), i18n);
            return context;
         }
         return super.fhcsPartContext(partId, context);
      }
   };
}

/* ---------- The vehicle sheet (SCOPE §4.13, user 2026-11-10) ---------- */

/** dnd5e's vehicle sidebar and its collapser go: their stats move to our header, their traits to Stations. */
const VEHICLE_DROPPED_PARTS = ['sidebarCollapser', 'sidebar'];

/** Our vehicle parts. dnd5e's vehicle has no header part; ours leads, then the tab row. The bodies follow in slices. */
const VEHICLE_PARTS = {
   header: { template: `${MODULE_PATH}/templates/vehicle/header.hbs`, templates: [`${MODULE_PATH}/templates/sheet/gear.hbs`, `${MODULE_PATH}/templates/sheet/abilities.hbs`] },
   tabs: GROUP_PARTS.tabs,
   // dnd5e draws its stations beside every tab; ours are the first tab (SCOPE §4.13, user 2026-11-10).
   stations: { template: `${MODULE_PATH}/templates/vehicle/stations.hbs`, container: { classes: ['tab-body'], id: 'tabs' }, scrollable: [''],
      templates: [`${MODULE_PATH}/templates/sheet/gear.hbs`, `${MODULE_PATH}/templates/sheet/item-row.hbs`] },
   inventory: GROUP_PARTS.inventory,
   crew: { template: `${MODULE_PATH}/templates/vehicle/crew.hbs`, scrollable: [''] },
   effects: GROUP_PARTS.effects,
   description: { template: SHEET_PARTS.biography, ...PART_OPTIONS.biography }
};

/** The vehicle's tabs: Stations first, then dnd5e's own with their conditions (Crew & Passengers only with crew). */
function vehicleTabs(baseTabs)
{
   return [{ tab: 'stations', label: 'FHCS.Vehicle.StationsTab' }, ...(baseTabs ?? []).filter((t) => t.tab !== 'stations')];
}

/** dnd5e's vehicle parts with ours swapped in, its sidebar gone, the header and tab row first. */
function vehicleParts(baseParts)
{
   const entries = Object.entries(baseParts ?? {})
      .filter(([id]) => !VEHICLE_DROPPED_PARTS.includes(id))
      .map(([id, part]) =>
      {
         if (!VEHICLE_PARTS[id]) { return [id, part]; }
         const kept = { ...part };
         delete kept.classes;
         delete kept.templates;
         return [id, { ...kept, ...VEHICLE_PARTS[id] }];
      });
   if (!entries.some(([id]) => id === 'header')) { entries.unshift(['header', { ...VEHICLE_PARTS.header }]); }
   const rank = (id) => (LEADING_PARTS.includes(id) ? LEADING_PARTS.indexOf(id) : LEADING_PARTS.length);
   return Object.fromEntries(entries.sort(([a], [b]) => rank(a) - rank(b)));
}

/**
 * Our vehicle sheet: dnd5e's vehicle sheet with the character sheet's layer on top (the same base, BaseActorSheet): our
 * lock, theme and title bar; a header of ours where dnd5e has a sidebar.
 */
export function makeVehicleSheet(Base)
{
   return class FHCSVehicleSheet extends makeCharacterSheet(Base)
   {
      static DEFAULT_OPTIONS = {
         classes: ['fhcs-vehicle']
      };

      static PARTS = vehicleParts(Base.PARTS);

      static TABS = vehicleTabs(Base.TABS);

      /** Stations open first. */
      tabGroups = { primary: 'stations' };

      /** @inheritDoc */
      get fhcsHomeTab()
      {
         return 'stations';
      }

      /** The vehicle's header and tab row; the rest as the character sheet draws them. */
      async fhcsPartContext(partId, context)
      {
         const i18n = { localize: (key) => game.i18n.localize(key), format: (key, data) => game.i18n.format(key, data) };
         if (partId === 'header')
         {
            context.fhcsVehicle = vehicleHeaderView(vehicleHeaderFacts(this, context), i18n);
            return context;
         }
         if (partId === 'stations')
         {
            const facts = await vehicleStationsFacts(this, context);
            context.fhcsStations = vehicleStationsView(facts, i18n);
            // The features are Inventory rows (dnd5e's inventory element binds them), with one column: Uses.
            const folded = game.user.getFlag(MODULE_ID, PREFS.folded) ?? [];
            context.fhcsInventory = inventoryView({ group: true, editing: false, columns: { weight: false, uses: true, quantity: false },
               sections: facts.features, currency: [], encumbrance: null, folded }, i18n);
            return context;
         }
         if (partId === 'inventory')
         {
            // Cargo (SCOPE §4.13): the container's columns and setting, the cargo capacity as the bar.
            const columns = containerColumnChoice(game.settings.get(MODULE_ID, 'containerColumns'));
            const openContainers = game.user.getFlag(MODULE_ID, PREFS.openContainers) ?? [];
            const folded = game.user.getFlag(MODULE_ID, PREFS.folded) ?? [];
            context.fhcsInventory = inventoryView({ ...await vehicleCargoFacts(this, context, { columns, openContainers }), folded,
               order: sectionOrder(this.actor, 'inventory') }, i18n);
            return context;
         }
         if (partId === 'crew')
         {
            context.fhcsCrew = vehicleCrewView(vehicleCrewFacts(this, context), i18n);
            return context;
         }
         if (partId === 'description')
         {
            context.fhcsBiography = biographyView(biographyFacts(this, context), i18n);
            return context;
         }
         if (partId === 'tabs')
         {
            context.fhcsTabs = tabRow(context.tabs, { canEdit: this.isEditable, editing: this.isEditMode }, i18n.localize, {}, []);
            return context;
         }
         return super.fhcsPartContext(partId, context);
      }
   };
}
