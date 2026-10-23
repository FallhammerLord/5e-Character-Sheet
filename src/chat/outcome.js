/**
 * A roll's outcome in words (Track R, SCOPE §6.5): the verdict against a known DC, the natural die, a critical hit,
 * hits and misses. The d20 and save bands use it. Pure, so tools/unit-check.mjs runs it offline; dnd5e is read only
 * through compat.rollFacts.
 */

/**
 * Turns the facts of one roll into the outcome line's context.
 *
 * @param {object} facts     From compat.rollFacts: kind, who, what, total, natural, target, showResult, success,
 *                           isCritical, targets ({ name, isMiss }).
 * @param {Function} format  (key, data) => localized text.
 * @returns {{ who: string, what: string, total: number, verdict: string|null, details: string[] }}
 */
export function describeRoll(facts, format)
{
   const verdict = facts.showResult && (facts.success !== null) ? (facts.success ? 'success' : 'failure') : null;
   const details = [];
   if (verdict)
   {
      details.push(format(verdict === 'success' ? 'FHCS.Chat.SuccessVsDC' : 'FHCS.Chat.FailureVsDC', { dc: facts.target }));
   }
   if ((facts.natural === 20) || (facts.natural === 1)) { details.push(format('FHCS.Chat.Natural', { n: facts.natural })); }
   if ((facts.kind === 'attack') && facts.isCritical) { details.push(format('FHCS.Chat.CriticalHit', {})); }

   const names = (isMiss) => facts.targets.filter((t) => t.isMiss === isMiss).map((t) => t.name).join(', ');
   if (names(false)) { details.push(format('FHCS.Chat.Hits', { names: names(false) })); }
   if (names(true)) { details.push(format('FHCS.Chat.Misses', { names: names(true) })); }

   return { who: facts.who, what: facts.what, total: facts.total, verdict, details };
}
