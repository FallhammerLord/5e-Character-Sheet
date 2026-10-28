/**
 * What the list tabs (Inventory, Spellbook, Features) share: the filter buttons pinned beside dnd5e's search. Pure.
 */

/** Filters pinned beside each tab's search (mockup, 2026-10-26; Tidy Classic's pins, plus Prepared). */
export const SPELL_PINS = ['action', 'bonus', 'reaction', 'concentration', 'prepared'];
export const INVENTORY_PINS = ['action', 'bonus', 'equipped'];
export const FEATURE_PINS = ['action', 'bonus', 'reaction'];

/**
 * Pinned filter buttons beside a tab's search. dnd5e's filters are three-state: a key includes, `!key` excludes.
 * @param {string[]} keys
 * @param {string[]} active  The list's current filter set.
 */
export function pinView(keys, active, localize)
{
   const on = new Set(active ?? []);
   return keys.map((key) => ({
      key,
      label: localize(`FHCS.Filter.${key}`),
      pressed: on.has(key) ? 'true' : on.has(`!${key}`) ? 'mixed' : 'false'
   }));
}

/**
 * A list section's fold (user, 2026-10-28, SCOPE §4.10): remembered per player with the favorites groups, keyed by tab
 * and section ("inventory:weapon").
 * @param {string} tab  The tab's part ID.
 * @param {string} id   The section's ID.
 * @param {string[]} folded  The player's folded keys.
 */
export function sectionFold(tab, id, folded)
{
   const key = `${tab}:${id}`;
   return { key, open: !(folded ?? []).includes(key) };
}

/**
 * A custom category's section ID from its name (user, 2026-10-28: "custom categories ... matching identifiers in the
 * item and feature sheets"): every item carrying the same name, whatever its case or spacing, shares one section.
 * @param {string} name
 */
export function categoryId(name)
{
   const slug = String(name ?? '').trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
   return slug ? `custom-${slug}` : '';
}

/**
 * Sections in the player's order (user, 2026-10-28: "let user reorder categories on all tabs"), each with its up and
 * down arrows in edit mode. Sections the order names come first, in its order; the rest keep their own order after
 * them (a new custom category lands last). An arrow is off at its end, counting only the sections shown.
 * @param {object[]} sections  Each with an `id`; `hidden` ones are passed over by the arrows.
 * @param {string[]} order     The saved order of section IDs, if any.
 * @param {{tab: string, editing: boolean, format: Function}} options
 */
export function arrangeSections(sections, order, { tab, editing, format })
{
   const rank = new Map((order ?? []).map((id, i) => [id, i]));
   const sorted = sections.map((s, i) => ({ s, i }))
      .sort((a, b) => (rank.get(a.s.id) ?? rank.size + a.i) - (rank.get(b.s.id) ?? rank.size + b.i))
      .map(({ s }) => s);
   const shown = sorted.filter((s) => !s.hidden);
   return sorted.map((s) =>
   {
      if (!editing) { return { ...s, move: null }; }
      const at = shown.indexOf(s);
      return {
         ...s,
         move: {
            tab,
            up: at > 0, down: at >= 0 && at < shown.length - 1,
            upLabel: format('FHCS.Section.Up', { name: s.label }),
            downLabel: format('FHCS.Section.Down', { name: s.label })
         }
      };
   });
}
