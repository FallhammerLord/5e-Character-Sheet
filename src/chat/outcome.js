/**
 * Clear chat cards (Track R, SCOPE §6): every d20 card opens with its outcome in words. First line: who, what and
 * the total ("Kira · Intelligence Saving Throw · 14"); second line: the verdict against a known DC and the natural
 * die ("Failure vs DC 15 · Natural 20"). Saves summarized on the card that asked get the same line.
 *
 * describeRoll is pure, so tools/unit-check.mjs and the layout fixtures use it offline; dnd5e is read only through
 * compat.rollFacts.
 */
import { MODULE_ID } from '../constants.js';
import { renderTemplate, rollFacts } from '../compat.js';

export const OUTCOME_TEMPLATE = `modules/${MODULE_ID}/templates/chat/outcome.hbs`;

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

/**
 * Adds the outcome line to a rendered message, and to each roll summarized inside it. Safe to call twice.
 *
 * @param {ChatMessage} message  The dnd5e chat message.
 * @param {HTMLElement} html     Its rendered element, from `dnd5e.renderChatMessage`.
 */
export async function decorateMessage(message, html)
{
   html.classList.add('fhcs-chat');
   const places = [[message, html.querySelector('.message-content')]];
   for (const summary of html.querySelectorAll('.card-summary[data-message-id]'))
   {
      places.push([game.messages.get(summary.dataset.messageId), summary]);
   }

   const format = (key, data) => game.i18n.format(key, data);
   for (const [source, box] of places)
   {
      const facts = source && box ? rollFacts(source) : null;
      if (!facts) { continue; }
      const markup = await renderTemplate(OUTCOME_TEMPLATE, describeRoll(facts, format));
      if (!box.querySelector(':scope > .fhcs-outcome')) { box.insertAdjacentHTML('afterbegin', markup); }
   }
}
