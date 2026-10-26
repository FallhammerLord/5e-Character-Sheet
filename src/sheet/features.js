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
   const open = (doc) => ({ ...doc, openLabel: format('FHCS.Features.OpenLabel', { name: doc.name }) });

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

   const canEdit = !!facts.canEdit;
   // Removing is a setting, not play: like the gear icons, only in edit mode (SCOPE §4.5). dnd5e's delete asks first.
   const canClear = canEdit && !!facts.editing;
   const clear = (doc) => (canClear ? { uuid: doc.uuid, label: format('FHCS.Features.ClearLabel', { name: doc.name }) } : null);
   const totalLevel = (facts.classes ?? []).reduce((n, k) => n + (Number(k.level) || 0), 0);
   const classes = (facts.classes ?? []).map((k) => ({
      ...open(k),
      kind: localize('FHCS.Features.Class'),
      level: String(k.level),
      levelLabel: format('FHCS.Features.LevelLabel', { name: k.name, level: k.level }),
      clear: clear(k),
      subclass: k.subclass ? { ...open(k.subclass), clear: clear(k.subclass) } : null,
      // A subclass due: dnd5e's own check, its Subclass advancement reached and none owned (character-sheet.mjs:400).
      chooseSubclass: !k.subclass && k.needsSubclass && canEdit ? {
         identifier: k.identifier,
         label: format('FHCS.Features.ChooseSubclassLabel', { name: k.name })
      } : null,
      levelUp: canEdit && totalLevel < (facts.maxLevel ?? 20) ? {
         label: format('FHCS.Features.LevelUpLabel', { name: k.name })
      } : null
   }));

   // No class yet: a card to choose one, as dnd5e offers in play too (`showClassDrop`, character-sheet.mjs:463).
   const chooseClass = !classes.length && canEdit ? {
      label: format('FHCS.Features.ChooseLabel', { kind: localize('FHCS.Features.Class') }),
      kind: localize('FHCS.Features.Class')
   } : null;
   // Each class card takes about 240px and the species and background pair about 308px, so the row wraps (the pair
   // dropping together) only when the cards would squeeze their labels (SCOPE §4.8).
   const cards = classes.length || (chooseClass ? 1 : 0);
   const classBasis = cards ? cards * 240 + (cards - 1) * 8 : 0;
   const origins = (facts.origins ?? []).map((o) => ({
      kind: o.kind,
      label: localize(`FHCS.Features.Origin.${o.kind}`),
      item: o.item ? { ...open(o.item), clear: clear(o.item) } : null,
      // dnd5e allows one species and one background (`singleton`): to change one, remove it, then choose.
      choose: !o.item && canEdit ? {
         type: o.kind === 'species' ? 'race' : o.kind,
         label: format('FHCS.Features.ChooseLabel', { kind: localize(`FHCS.Features.Origin.${o.kind}`) })
      } : null
   }));

   return {
      classes,
      chooseClass,
      classBasis,
      origins,
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
         level: localize('FHCS.Features.Level'),
         levelUp: localize('FHCS.Features.LevelUp'),
         subclass: localize('FHCS.Features.Subclass'),
         choose: localize('FHCS.Features.Choose'),
         group: localize('FHCS.Features.GroupLabel'),
         empty: localize('FHCS.Features.Empty'),
         head: Object.fromEntries(FEATURE_COLUMNS.map((key) => [key, localize(`FHCS.Features.Column.${key}`)]))
      }
   };
}
