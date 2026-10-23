/**
 * The d20 row (SCOPE §6.6): the primary die in the center, disadvantage dice to its left, advantage dice to its
 * right. The die that counts is filled; the rest are struck through. Pure, so tools/unit-check.mjs runs it offline.
 */

/** dnd5e's D20Roll.ADV_MODE values. */
const ADVANTAGE = 1;
const DISADVANTAGE = -1;

/**
 * Lays out a d20 term's results.
 *
 * @param {object[]} results       The d20 term's results: { result, active, discarded, rerolled }.
 * @param {number} advantageMode   The roll's advantage mode: 1, -1 or 0.
 * @param {string[]} [sides]       'adv' or 'dis' for each die after the primary, when recorded (late adds); otherwise
 *                                 every extra die takes the roll's mode (dnd5e's advantage, Elven Accuracy).
 * @returns {{ left: object[], center: object|null, right: object[] }}  Each die: { value, counts, side, natural }.
 */
export function d20Row(results, advantageMode, sides = [])
{
   // A die rerolled away (Halfling Lucky's 1) is replaced by the result rolled after it; show the replacement.
   const dice = results.filter((r) => !r.rerolled).map((r, i) =>
   {
      const side = i === 0 ? 'primary' : (sides[i - 1] ?? (advantageMode === DISADVANTAGE ? 'dis' : 'adv'));
      return {
         value: r.result,
         counts: (r.active !== false) && !r.discarded,
         side,
         natural: r.result === 20 ? 'high' : (r.result === 1 ? 'low' : null)
      };
   });
   const [center = null, ...extra] = dice;
   return {
      left: extra.filter((d) => d.side === 'dis').reverse(),
      center,
      right: extra.filter((d) => d.side === 'adv')
   };
}

/** CSS classes for one die in the row. */
export function dieClasses(die)
{
   return [
      'fhcs-die',
      `fhcs-die-${die.side}`,
      die.counts ? 'fhcs-die-counts' : 'fhcs-die-dropped',
      die.natural ? `fhcs-die-nat-${die.natural}` : ''
   ].filter(Boolean).join(' ');
}

/** Late dice allowed on each side of the d20 row (user, 2026-10-24). */
export const MAX_PER_SIDE = 5;

/**
 * Which die counts, by click order (SCOPE §6.6, user 2026-10-24): start with the primary; each die added on the
 * advantage side replaces the counting die if it is higher, each on the disadvantage side if it is lower. Nothing
 * cancels: the table decides what to click, the card doesn't adjudicate. Ties keep the die already counting.
 *
 * @param {number[]} values   The primary die, then each extra die, in the order rolled.
 * @param {string[]} sides    'adv' or 'dis' for each extra die, in the same order.
 * @returns {number} Index into values.
 */
export function countingDie(values, sides)
{
   let keep = 0;
   sides.forEach((side, i) =>
   {
      const value = values[i + 1];
      if ((side === 'adv') ? (value > values[keep]) : (value < values[keep])) { keep = i + 1; }
   });
   return keep;
}

/** The advantage mode dnd5e records: the side of the last die added (it only labels the roll). */
export function modeForSides(sides)
{
   const last = sides.at(-1);
   if (last === 'adv') { return ADVANTAGE; }
   if (last === 'dis') { return DISADVANTAGE; }
   return 0;
}

export { ADVANTAGE, DISADVANTAGE };
