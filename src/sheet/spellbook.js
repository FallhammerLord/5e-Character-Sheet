/**
 * The Spellbook tab's display values (SCOPE §4.7), from plain facts. Pure, like inventory.js: the unit check and the
 * layout fixtures use the same code. `compat.spellbookFacts` gathers the facts from dnd5e.
 */
import { SPELL_PINS, pinView } from './lists.js';

/** The columns a player can show or hide. The prepare mark always shows; it isn't a column choice. */
export const SPELL_COLUMNS = ['components', 'concentration', 'time', 'range', 'school', 'target', 'favorite'];

/** What shows before a player chooses (user, 2026-10-26): components, concentration, time, range and the favorite toggle. */
export const DEFAULT_SPELL_COLUMNS = { components: true, concentration: true, time: true, range: true, school: false, target: false,
   favorite: true };

/** Filters we add to dnd5e's: Can cast and the components (Tidy Classic's menu has them; dnd5e doesn't). */
export const EXTRA_SPELL_FILTERS = ['canCast', 'vocal', 'somatic', 'material'];

/** @returns {object} A player's saved choice laid over the defaults, so a column added later still shows. */
export function spellColumnChoice(saved)
{
   const choice = { ...DEFAULT_SPELL_COLUMNS };
   for (const key of SPELL_COLUMNS)
   {
      if (typeof saved?.[key] === 'boolean') { choice[key] = saved[key]; }
   }
   return choice;
}

/** Section order: cantrips, slot levels, Pact Magic, then the methods that never prepare (mockup, 2026-10-26). */
const METHOD_RANK = { spell: 10, pact: 30, ritual: 40, innate: 50, atwill: 60, item: 70 };

/** @returns {number} Where a section sorts. */
export function sectionRank(method, level)
{
   if (method === 'spell') { return level ? METHOD_RANK.spell + level : 0; }
   return METHOD_RANK[method] ?? 80;
}

/**
 * Preparation state, or null when the spell shows no prepare mark (SCOPE §4.7): only Spellcasting and Pact Magic
 * spells prepare; cantrips and spells cast through an item never count, so they show none.
 * @returns {'always'|'prepared'|'unprepared'|null}
 */
export function prepState(spell)
{
   if (!spell.prepares || !spell.level || spell.linked) { return null; }
   if (spell.prepared === 2) { return 'always'; }
   return spell.prepared ? 'prepared' : 'unprepared';
}

/**
 * The row's highlight (SCOPE §4.7): each preparation kind its own color. Innate and at-will spells always; others
 * when prepared, Pact Magic apart from the rest; unprepared, ritual-only and item spells plain.
 * @returns {'innate'|'atwill'|'always'|'pact'|'prepared'|null}
 */
export function spellKind(spell)
{
   if (spell.method === 'innate') { return 'innate'; }
   if (spell.method === 'atwill') { return 'atwill'; }
   const state = prepState(spell);
   if (state === 'always') { return 'always'; }
   if (state === 'prepared') { return spell.method === 'pact' ? 'pact' : 'prepared'; }
   return null;
}

/**
 * Whether a spell can be cast now, for the Can cast filter (after Tidy's `isCastableSpell`): limited uses need one
 * left; cantrips, at-will, innate, ritual-only and item spells always; a spell that prepares must be prepared (or be
 * a ritual); a slot spell needs a slot left at its level or higher.
 * @param {object} spell  Spell facts: level, method, prepares, prepared, linked, ritual, uses.
 * @param {{level: number, value: number}[]} slots  Every slot pool with its level and slots left (pact included).
 */
export function canCast(spell, slots)
{
   if (spell.uses?.max) { return spell.uses.value > 0; }
   if (!spell.level || spell.linked || ['atwill', 'innate', 'ritual'].includes(spell.method)) { return true; }
   if (spell.prepares && !spell.prepared) { return false; }
   if (spell.ritual) { return true; }
   return slots.some((s) => s.level >= spell.level && s.value > 0);
}

/** @returns {string} A modifier with its sign. */
const signed = (n) => (Number(n) >= 0 ? `+${Number(n)}` : `${Number(n)}`);

/**
 * Everything the Spellbook tab shows.
 * @param {object} facts  From compat.spellbookFacts (or a fixture).
 * @param {{format: Function, localize: Function}} i18n
 */
export function spellbookView(facts, { format, localize })
{
   const columns = spellColumnChoice(facts.columns);
   const holding = new Set((facts.concentration?.spells ?? []).map((s) => s.itemId).filter(Boolean));

   const row = (spell) =>
   {
      const state = prepState(spell);
      const kind = spellKind(spell);
      const isHolding = holding.has(spell.id);
      return {
         id: spell.id,
         uuid: spell.uuid,
         name: spell.name,
         img: spell.img,
         sub: spell.sub ?? '',
         kind,
         favorite: !!spell.favorite,
         favoriteLabel: localize(spell.favorite ? 'FHCS.Favorite.On' : 'FHCS.Favorite.Off'),
         useLabel: format('FHCS.Spellbook.CastLabel', { name: spell.name }),
         detailsLabel: format('FHCS.Inventory.DetailsLabel', { name: spell.name }),
         expanded: !!spell.expanded,
         summary: spell.summary ?? '',
         ritual: !!spell.ritual,
         ritualLabel: localize('FHCS.Spellbook.Ritual'),
         components: spell.components ?? '',
         conc: spell.concentration ? {
            holding: isHolding,
            label: localize(isHolding ? 'FHCS.Spellbook.Holding' : 'FHCS.Spellbook.Concentration')
         } : null,
         time: spell.time ?? '',
         range: spell.range ?? '',
         school: spell.school ?? '',
         target: spell.target ?? '',
         uses: spell.uses?.max ? { value: spell.uses.value, max: spell.uses.max, prop: spell.uses.prop,
            label: format('FHCS.Inventory.UsesLabel', { name: spell.name }) } : null,
         // Three states, like attunement (SCOPE §4.7): a click flips prepared and not; always prepared can't be clicked.
         prep: state ? {
            state,
            pressed: state !== 'unprepared',
            locked: state === 'always',
            label: localize(`FHCS.Spellbook.State.${state}`)
         } : null,
         editLabel: format('FHCS.Inventory.EditLabel', { name: spell.name }),
         deleteLabel: format('FHCS.Inventory.DeleteLabel', { name: spell.name })
      };
   };

   const sections = [...facts.sections]
      .filter((s) => s.items.length)
      .sort((a, b) => sectionRank(a.method, a.level) - sectionRank(b.method, b.level))
      .map((s) =>
      {
         const slot = s.slots;
         const total = slot ? Math.max(slot.max, slot.value) : 0;
         return {
            id: s.id,
            method: s.method,
            level: s.level ?? '',
            label: s.label,
            count: s.items.length,
            // Filled pips are slots still to spend, as on Attributes (user, 2026-10-26); past the max, temporary ones.
            slots: total ? {
               prop: `system.spells.${s.id}.value`,
               text: `${slot.value} / ${slot.max}`,
               pips: Array.from({ length: total }, (_, i) => ({
                  n: i + 1,
                  filled: slot.value > i,
                  temp: i >= slot.max,
                  label: format(s.method === 'pact' ? 'FHCS.Spellbook.PactSlotLabel' : 'FHCS.Attributes.SlotLabel', { n: i + 1, level: s.level })
               }))
            } : null,
            showUses: s.items.some((i) => i.uses?.max),
            items: s.items.map(row)
         };
      });

   const conc = facts.concentration ?? { spells: [], save: 0 };
   return {
      classes: (facts.classes ?? []).map((k) => ({
         label: k.label,
         abbr: k.abbr,
         mod: signed(k.mod),
         attack: signed(k.attack),
         save: String(k.save),
         prepared: k.prepared?.max ? `${k.prepared.value} / ${k.prepared.max}` : String(k.prepared?.value ?? 0),
         preparedLabel: k.prepared?.max ? format('FHCS.Spellbook.PreparedOf', k.prepared) : format('FHCS.Spellbook.PreparedCount', k.prepared ?? { value: 0 }),
         primary: !!k.primary
      })),
      concentration: {
         on: conc.spells.length > 0,
         spells: conc.spells.map((s) => ({
            ...s,
            openLabel: format('FHCS.Spellbook.OpenLabel', { name: s.name }),
            endLabel: format('FHCS.Spellbook.EndLabel', { name: s.name })
         })),
         save: signed(conc.save),
         saveLabel: format('FHCS.Spellbook.SaveLabel', { mod: signed(conc.save) })
      },
      sections,
      columns,
      editing: !!facts.editing,
      filters: facts.filters ?? [],
      sorting: facts.sorting ?? [],
      pins: pinView(SPELL_PINS, facts.activeFilters, localize),
      columnToggles: facts.editing ? SPELL_COLUMNS.map((key) => ({
         key, pressed: columns[key], label: localize(`FHCS.Spellbook.Column.${key}`)
      })) : [],
      empty: !sections.length,
      text: {
         search: localize('FHCS.Spellbook.Search'),
         columns: localize('FHCS.Inventory.Columns'),
         attack: localize('FHCS.Spellbook.Attack'),
         save: localize('FHCS.Spellbook.SaveDC'),
         prepared: localize('FHCS.Spellbook.Prepared'),
         concentration: localize('FHCS.Spellbook.Concentration'),
         none: localize('FHCS.Spellbook.NotConcentrating'),
         conSave: localize('FHCS.Spellbook.ConSave'),
         end: localize('FHCS.Spellbook.End'),
         slotsConfig: localize('FHCS.Spellbook.SlotsConfig'),
         empty: localize('FHCS.Spellbook.Empty'),
         uses: localize('FHCS.Inventory.Column.uses'),
         prep: localize('FHCS.Spellbook.Prepared'),
         head: Object.fromEntries(SPELL_COLUMNS.map((key) => [key, localize(`FHCS.Spellbook.Column.${key}`)]))
      }
   };
}
