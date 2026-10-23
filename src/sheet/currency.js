/**
 * Coin icons on our sheet. dnd5e adds each currency's image at runtime, scoped to its own `.dnd5e2` class, which our
 * sheet drops; these are the same rules for `.fhcs-sheet`. Pure, so tools/unit-check.mjs runs it offline.
 *
 * @param {Record<string, { icon?: string }>} currencies   CONFIG.DND5E.currencies, modules' coins included.
 * @returns {string} CSS
 */
export function currencyIconRules(currencies)
{
   return Object.entries(currencies ?? {})
      .filter(([key, { icon } = {}]) => /^[\w-]+$/.test(key) && icon)
      .map(([key, { icon }]) => `.fhcs-sheet :is(i, span).currency.${key} { background-image: url("${String(icon).replace(/["\\]/g, '')}"); }`)
      .join('\n');
}
