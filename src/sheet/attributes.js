/**
 * The Attributes tab's display values (SCOPE §4.3), from plain facts. Pure, like header.js: the unit check and the
 * layout fixtures use the same code. `compat.attributesFacts` gathers the facts from dnd5e.
 */
import { signed } from './header.js';

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
   // Every skill shows its passive (user, 2026-10-27: the key-only toggle broke the rows' flow for little use).
   const skills = facts.skills.map((s) =>
   {
      const mark = PROF_MARKS[s.prof] ?? 'full';
      const mod = signed(s.total);
      return {
         key: s.key,
         label: s.label,
         abbr: s.abbr,
         mod,
         passive: s.passive,
         mark,
         markLabel: localize(`FHCS.Attributes.Prof.${mark}`),
         rollLabel: format('FHCS.Attributes.SkillLabel', { skill: s.label, mod, passive: s.passive,
            prof: localize(`FHCS.Attributes.Prof.${mark}`) }),
         // Edit mode (SCOPE §4.9): dnd5e's proficiency cycle and the ability, as stored; a gear for the skill's window.
         source: s.source ?? s.prof,
         abilities: (facts.abilities ?? []).map((a) => ({ ...a, selected: a.key === s.ability })),
         abilityLabel: format('FHCS.Attributes.SkillAbility', { skill: s.label }),
         profLabel: format('FHCS.Attributes.SkillProf', { skill: s.label }),
         configLabel: format('FHCS.Attributes.SkillConfig', { skill: s.label })
      };
   });

   // Every trait in both modes, "—" when empty (user, 2026-10-27: edit mode once showed what play mode hid).
   const traits = TRAIT_ORDER
      .map((key) => facts.traits.find((t) => t.key === key))
      .filter(Boolean)
      .map((t) => ({
         // A short label, so the label column stays narrow (user's mockup, 2026-10-27); dnd5e's full name stays in the gear's.
         key: t.key, title: localize(`FHCS.Attributes.TraitShort.${t.key}`), text: t.values.length ? t.values.join(', ') : '—', empty: !t.values.length,
         // Each trait's gear opens dnd5e's window for it; senses have their own (`data-config`), the rest go by trait.
         config: t.key === 'senses' ? 'senses' : '', trait: t.key === 'senses' ? '' : t.key,
         configLabel: format('FHCS.Attributes.TraitConfig', { trait: t.title })
      }));

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
               pips: Array.from({ length: slot.max }, (_, i) => ({
                  n: i + 1, filled: slot.value > i, label: format('FHCS.Attributes.SlotLabel', { n: i + 1, level })
               }))
            } : null,
            rows: rows.map((r) => ({
               ...r,
               uses: r.uses?.max ? `${r.uses.value} / ${r.uses.max}` : r.quantity > 1 ? `×${r.quantity}` : '',
               equipped: r.state === 'equipped',
               prepared: r.state === 'prepared',
               kind: r.kind ?? null,
               // Innate and at-will spells have no book; their kind is said in words beside the tint (SCOPE §4.5).
               kindText: ['innate', 'atwill'].includes(r.kind) ? localize(`FHCS.Spellbook.Kind.${r.kind}`) : '',
               stateLabel: r.kind ? localize(`FHCS.Spellbook.Kind.${r.kind}`) : r.state ? localize(`FHCS.Attributes.State.${r.state}`) : '',
               useLabel: format('FHCS.Inventory.UseLabel', { name: r.title }),
               detailsLabel: format('FHCS.Inventory.DetailsLabel', { name: r.title })
            }))
         };
      });

   return {
      skills,
      traits,
      // The traits panel folds (user, 2026-10-27), remembered like a favorites group; folded, one line of what's set.
      traitsOpen: !(facts.folded ?? []).includes('traits'),
      traitsSummary: traits.filter((t) => t.text !== '—').map((t) => t.text).join(' · '),
      favorites,
      editing: !!facts.editing,
      // The Resources category (user, 2026-10-28): all three always, folded like a favorites group.
      resources: facts.resources.map((r, i) =>
      {
         const title = r.label || format('FHCS.Attributes.ResourceN', { n: i + 1 });
         const recovery = [r.sr && localize('FHCS.Attributes.ShortRestAbbr'), r.lr && localize('FHCS.Attributes.LongRestAbbr')].filter(Boolean).join(' · ');
         return {
            ...r, title, named: !!r.label, recovery,
            groupLabel: format('FHCS.Attributes.ResourceLabel', { title, value: r.value, max: r.max }),
            nameLabel: format('FHCS.Attributes.ResourceName', { n: i + 1 }),
            valueLabel: format('FHCS.Attributes.ResourceValue', { title }),
            maxLabel: format('FHCS.Attributes.ResourceMax', { title })
         };
      }),
      resourcesOpen: !(facts.folded ?? []).includes('resources'),
      text: {
         skills: localize('FHCS.Attributes.Skills'),
         traits: localize('FHCS.Attributes.Traits'),
         resources: localize('FHCS.Attributes.Resources'),
         shortRest: localize('FHCS.Attributes.ShortRestAbbr'),
         longRest: localize('FHCS.Attributes.LongRestAbbr'),
         skillsConfig: localize('FHCS.Attributes.SkillsConfig'),
         favorites: localize('FHCS.Attributes.Favorites'),
         noFavorites: localize('FHCS.Attributes.NoFavorites')
      }
   };
}
