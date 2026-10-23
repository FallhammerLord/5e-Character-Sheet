/**
 * A roll's dice math with every die shown (user, 2026-10-24): "2d8 + 0" rolled as 3 and 2 reads "(3 + 2) + 0", never
 * "5 + 0". Foundry's own `roll.result` collapses each dice term to its total. Pure, so tools/unit-check.mjs runs it
 * offline; compat.mathTerms turns Foundry's terms into the plain terms read here.
 */

/**
 * @param {object[]} terms   Each one of: { dice: [{ value, counts }] }, { op: '+' }, { value: 3 }, { group: [terms] }.
 * @returns {{ sum: string, dropped: number[] }}  The sum as written, and the dice that don't count (rerolled or
 *                                               dropped), in order.
 */
export function diceMath(terms)
{
   const dropped = [];
   const write = (list) => list.map((term) =>
   {
      if (term.op) { return term.op; }
      if (term.group) { return `(${write(term.group)})`; }
      if (term.dice)
      {
         const counting = term.dice.filter((d) => d.counts).map((d) => d.value);
         dropped.push(...term.dice.filter((d) => !d.counts).map((d) => d.value));
         if (!counting.length) { return '0'; }
         return counting.length === 1 ? `${counting[0]}` : `(${counting.join(' + ')})`;
      }
      return `${term.value}`;
   }).join(' ');
   return { sum: write(terms), dropped };
}
