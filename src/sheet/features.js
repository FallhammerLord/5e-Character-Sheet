/**
 * The Features tab's display values (SCOPE §4.8), from plain facts. Pure, like inventory.js: the unit check and the
 * layout fixtures use the same code. `compat.featuresFacts` gathers the facts from dnd5e.
 */
import { FEATURE_PINS, pinView } from './lists.js';

/** The columns a player can show or hide, as on the other list tabs. */
export const FEATURE_COLUMNS = ['uses', 'usage', 'recovery', 'favorite'];

export const DEFAULT_FEATURE_COLUMNS = { uses: true, usage: true, recovery: true, favorite: true };

/** dnd5e's two groupings for features (character-sheet.mjs:445): by source first, as dnd5e starts. */
export const GROUPINGS = ['origin', 'activation'];

/** @returns {object} A player's saved choice laid over the defaults, so a column added later still shows. */
export function featureColumnChoice(saved)
{
   const choice = { ...DEFAULT_FEATURE_COLUMNS };
   for (const key of FEATURE_COLUMNS)
   {
      if (typeof saved?.[key] === 'boolean') { choice[key] = saved[key]; }
   }
   return choice;
}

/** @returns {string} The grouping in force: the player's choice, or dnd5e's first. */
export function groupingOf(saved)
{
   return GROUPINGS.includes(saved) ? saved : GROUPINGS[0];
}

/**
 * Everything the Features tab shows.
 * @param {object} facts  From compat.featuresFacts (or a fixture).
 * @param {{format: Function, localize: Function}} i18n
 */
export function featuresView(facts, { format, localize })
{
   const columns = featureColumnChoice(facts.columns);
   const grouping = groupingOf(facts.grouping);

   const row = (f) => ({
      id: f.id,
      uuid: f.uuid,
      name: f.name,
      img: f.img,
      sub: f.sub ?? '',
      origin: f.origin ?? 'other',
      activation: f.activation ?? 'passive',
      useLabel: format('FHCS.Features.UseLabel', { name: f.name }),
      detailsLabel: format('FHCS.Inventory.DetailsLabel', { name: f.name }),
      expanded: !!f.expanded,
      summary: f.summary ?? '',
      uses: f.uses?.max ? { value: f.uses.value, max: f.uses.max, prop: f.uses.prop,
         label: format('FHCS.Inventory.UsesLabel', { name: f.name }) } : null,
      // A recharge ability: a button to roll it when spent, the word "Charged" when ready.
      recharge: f.recharge ? { cooldown: !!f.recharge.cooldown, label: f.recharge.label,
         text: localize(f.recharge.cooldown ? 'FHCS.Features.Recharge' : 'FHCS.Features.Charged') } : null,
      usage: f.usage ?? '',
      recovery: f.recovery ?? '',
      favorite: !!f.favorite,
      favoriteLabel: localize(f.favorite ? 'FHCS.Favorite.On' : 'FHCS.Favorite.Off'),
      editLabel: format('FHCS.Inventory.EditLabel', { name: f.name }),
      deleteLabel: format('FHCS.Inventory.DeleteLabel', { name: f.name })
   });

   // Every section of both groupings is drawn, so dnd5e's grouping switch can move rows between them in the browser
   // (item-list-controls.mjs:407); rows start in the grouping in force, and the other grouping's sections start hidden.
   const rows = (facts.features ?? []).map(row);
   const ours = (facts.sections ?? []).filter((s) => s.group === grouping);
   // A row whose group has no section (a class removed since) goes to Other, in its place, so nothing disappears.
   const home = (r) => (ours.some((s) => s.value === r[grouping]) ? r[grouping] : 'other');
   const sections = (facts.sections ?? []).map((s) =>
   {
      const items = s.group === grouping ? rows.filter((r) => home(r) === s.value) : [];
      return { id: s.id, label: s.label, group: s.group, value: s.value, items, hidden: !items.length };
   });

   return {
      sections,
      columns,
      grouping,
      groupLabel: localize(`FHCS.Features.Group.${grouping}`),
      editing: !!facts.editing,
      filters: facts.filters ?? [],
      sorting: facts.sorting ?? [],
      groupings: GROUPINGS.map((key) => ({ key, label: localize(`FHCS.Features.Group.${key}`) })),
      pins: pinView(FEATURE_PINS, facts.activeFilters, localize),
      columnToggles: facts.editing ? FEATURE_COLUMNS.map((key) => ({
         key, pressed: columns[key], label: localize(`FHCS.Features.Column.${key}`)
      })) : [],
      empty: !rows.length,
      text: {
         search: localize('FHCS.Features.Search'),
         columns: localize('FHCS.Inventory.Columns'),
         group: localize('FHCS.Features.GroupLabel'),
         empty: localize('FHCS.Features.Empty'),
         head: Object.fromEntries(FEATURE_COLUMNS.map((key) => [key, localize(`FHCS.Features.Column.${key}`)]))
      }
   };
}
