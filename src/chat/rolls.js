/**
 * Roll hooks for one card per action (Track R, SCOPE §6.5–6.6).
 *
 * - A roll made from one of our usage cards is drawn in that card's band, so its own card is hidden. dnd5e re-renders
 *   the usage card when the roll arrives (`system.origin`); see docs/research/dnd5e-6.0-chat.md.
 * - With "always roll two d20s", every d20 roll carries one more d20 rolled in advance, for late advantage or
 *   disadvantage to use first.
 */
import { MODULE_ID } from '../constants.js';
import { d20Now, isD20Roll, usageOrigin } from '../compat.js';

/** Roll message types drawn inside a usage card's bands. Later slices add saves and checks. */
export const FOLDED_TYPES = new Set(['attack', 'damage', 'healing']);

/**
 * `dnd5e.renderChatMessage`: hides a roll's own card when its usage card draws it.
 *
 * @param {ChatMessage} message
 * @param {HTMLElement} html
 */
export function foldIntoCard(message, html)
{
   if (!FOLDED_TYPES.has(message.type) || !game.settings.get(MODULE_ID, 'cards')) { return; }
   const origin = usageOrigin(message);
   if (origin && !origin.content) { html.hidden = true; }
}

/**
 * `dnd5e.postRollConfiguration`: adds a spare d20 to each d20 roll, before it is evaluated.
 *
 * @param {Roll[]} rolls
 */
export function addSpareD20(rolls)
{
   if (!game.settings.get(MODULE_ID, 'twoD20s')) { return; }
   for (const roll of rolls)
   {
      if (!isD20Roll(roll) || !roll.validD20Roll) { continue; }
      roll.options.fhcs = { ...roll.options.fhcs, spare: d20Now() };
   }
}
