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
