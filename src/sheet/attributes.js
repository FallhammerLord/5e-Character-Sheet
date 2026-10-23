/**
 * The Attributes tab's display values (SCOPE §4.3), from plain facts. Pure, like header.js: the unit check and the
 * layout fixtures use the same code. `compat.attributesFacts` gathers the facts from dnd5e.
 */
import { signed } from './header.js';

/** The passives shown when a player keeps only the key ones (user, 2026-10-24). */
export const KEY_PASSIVES = ['prc', 'ins', 'inv'];

/** Favorite groups in Classic's order; spell levels sit between features and effects. */
const GROUP_ORDER = ['inventory', 'features', 'spell', 'effects', 'skills', 'other'];

/** Proficiency multiplier → the mark drawn for it. */
const PROF_MARKS = { 0: 'none', 0.5: 'half', 1: 'full', 2: 'expert' };

/** Traits in Classic's order, by dnd5e trait key, with the label key dnd5e doesn't give for some. */
export const TRAIT_ORDER = ['senses', 'languages', 'di', 'dr', 'dv', 'dm', 'ci', 'weapon', 'armor', 'tool'];

/** @returns {number} Where a group sorts: spell levels by level inside the spell slot. */
function groupRank(key)
{
   const [kind, level] = key.split('-');
   const base = GROUP_ORDER.indexOf(kind);
   return (base < 0 ? GROUP_ORDER.length : base) * 100 + (Number(level) || 0);
}

/**
 * Everything the Attributes tab shows.
 * @param {object} facts  From compat.attributesFacts (or a fixture).
 * @param {{format: Function, localize: Function}} i18n
 */
export function attributesView(facts, { format, localize })
{
   const showAll = facts.passives !== 'key';
   const skills = facts.skills.map((s) =>
   {
      const mark = PROF_MARKS[s.prof] ?? 'full';
      const mod = signed(s.total);
      return {
         key: s.key,
         label: s.label,
         abbr: s.abbr,
         mod,
         passive: (showAll || KEY_PASSIVES.includes(s.key)) ? s.passive : '',
         mark,
         markLabel: localize(`FHCS.Attributes.Prof.${mark}`),
         rollLabel: format('FHCS.Attributes.SkillLabel', { skill: s.label, mod, passive: s.passive,
            prof: localize(`FHCS.Attributes.Prof.${mark}`) })
      };
   });

   // Empty traits are hidden in play; edit mode lists them all (SCOPE §4.3).
   const traits = TRAIT_ORDER
      .map((key) => facts.traits.find((t) => t.key === key))
      .filter((t) => t && (t.values.length || facts.editing))
      .map((t) => ({ key: t.key, title: t.title, text: t.values.length ? t.values.join(', ') : '—' }));

   const groups = new Map();
   for (const row of facts.favorites)
   {
      const key = row.group === 'spell' ? `spell-${row.level ?? 0}` : row.group;
      if (!groups.has(key)) { groups.set(key, []); }
      groups.get(key).push(row);
   }
   const favorites = [...groups.entries()]
      .sort(([a], [b]) => groupRank(a) - groupRank(b))
      .map(([key, rows]) =>
      {
         const level = key.startsWith('spell-') ? Number(key.slice(6)) : null;
         const slot = level ? facts.slots[level] : null;
         return {
            key,
            label: level === null ? localize(`FHCS.Attributes.Group.${key}`)
               : level === 0 ? localize('FHCS.Attributes.Group.cantrips') : format('FHCS.Attributes.Group.spellLevel', { level }),
            open: !facts.folded.includes(key),
            slots: slot?.max ? {
               prop: `system.spells.spell${level}.value`,
               text: `${slot.value} / ${slot.max}`,
               pips: Array.from({ length: slot.max }, (_, i) => ({
                  n: i + 1, filled: slot.value > i, label: format('FHCS.Attributes.SlotLabel', { n: i + 1, level })
               }))
            } : null,
            rows: rows.map((r) => ({
               ...r,
               uses: r.uses?.max ? `${r.uses.value} / ${r.uses.max}` : r.quantity > 1 ? `×${r.quantity}` : '',
               equipped: r.state === 'equipped',
               prepared: r.state === 'prepared',
               stateLabel: r.state ? localize(`FHCS.Attributes.State.${r.state}`) : ''
            }))
         };
      });

   return {
      skills,
      traits,
      favorites,
      resources: facts.resources.map((r) => ({ ...r, label: format('FHCS.Attributes.ResourceLabel', r) })),
      showAllPassives: showAll,
      text: {
         skills: localize('FHCS.Attributes.Skills'),
         passive: localize('FHCS.Attributes.Passive'),
         passiveToggle: localize(showAll ? 'FHCS.Attributes.PassiveKey' : 'FHCS.Attributes.PassiveAll'),
         favorites: localize('FHCS.Attributes.Favorites'),
         noFavorites: localize('FHCS.Attributes.NoFavorites')
      }
   };
}
