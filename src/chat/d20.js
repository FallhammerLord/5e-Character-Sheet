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

/**
 * Which die counts once dice sit on both sides (SCOPE §6.6): advantage dice alone, the highest of them and the
 * primary; disadvantage dice alone, the lowest; both sides, they cancel and the primary counts. Ties go to the
 * primary, then the earlier die.
 *
 * @param {number[]} values   The primary die, then each extra die, in the order rolled.
 * @param {string[]} sides    'adv' or 'dis' for each extra die.
 * @returns {number} Index into values.
 */
export function countingDie(values, sides)
{
   const adv = [];
   const dis = [];
   sides.forEach((side, i) => (side === 'dis' ? dis : adv).push(i + 1));
   if ((adv.length && dis.length) || (!adv.length && !dis.length)) { return 0; }
   const pool = [0, ...(adv.length ? adv : dis)];
   const best = (adv.length ? Math.max : Math.min)(...pool.map((i) => values[i]));
   return pool.find((i) => values[i] === best);
}

/** The advantage mode dnd5e should record once dice sit on these sides. */
export function modeForSides(sides)
{
   const adv = sides.includes('adv');
   const dis = sides.includes('dis');
   if (adv && !dis) { return ADVANTAGE; }
   if (dis && !adv) { return DISADVANTAGE; }
   return 0;
}

export { ADVANTAGE, DISADVANTAGE };
