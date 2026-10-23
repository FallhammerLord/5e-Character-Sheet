/**
 * Roll hooks for one card per action (Track R, SCOPE §6.5–6.6).
 *
 * - A roll made from one of our usage cards is drawn in that card's band, so its own card is hidden. dnd5e re-renders
 *   the usage card when the roll arrives (`system.origin`); see docs/research/dnd5e-6.0-chat.md.
 * - With "always roll two d20s", every d20 roll carries one more d20 rolled in advance, for late advantage or
 *   disadvantage to use first.
 * - Roll on use (SCOPE §6.6): dnd5e already rolls an attack after an attack is used, and damage after a damage or
 *   healing activity (`subsequentActions`); our settings switch those off, and add damage after each attack and
 *   right after a save spell.
 * - No roll dialogs (SCOPE §6.4); holding dnd5e's skip-dialog key brings the dialog back.
 */
import { MODULE_ID } from '../constants.js';
import { d20Now, isD20Roll, rollCardDamage, skipKeyHeld, usageOrigin } from '../compat.js';

const setting = (key) => game.settings.get(MODULE_ID, key);

/** Roll message types drawn inside a usage card's bands. */
export const FOLDED_TYPES = new Set(['attack', 'damage', 'healing', 'save', 'check']);

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

/**
 * `dnd5e.preUseActivity`: switches off dnd5e's follow-up roll when our matching setting is off.
 *
 * @param {Activity} activity
 * @param {object} usageConfig
 */
export function rollOnUse(activity, usageConfig)
{
   if ((activity.type === 'attack') && !setting('rollAttackOnUse')) { usageConfig.subsequentActions = false; }
   if (['damage', 'heal'].includes(activity.type) && !setting('rollDamageOnUse')) { usageConfig.subsequentActions = false; }
}

/**
 * `dnd5e.postUseActivity`: a save spell rolls its damage at once, linked to its card.
 *
 * @param {Activity} activity
 * @param {object} usageConfig
 * @param {object} results
 */
export function damageAfterUse(activity, usageConfig, results)
{
   const usage = results?.message;
   if ((activity.type !== 'save') || !usage?.id || (usageConfig.subsequentActions === false)) { return; }
   if (setting('rollDamageOnUse')) { rollCardDamage(usage, { isCritical: false }); }
}

/**
 * `dnd5e.postRollAttack`: each attack made from a card rolls its damage, a critical if the attack was one.
 *
 * @param {Roll[]} rolls
 */
export function damageAfterAttack(rolls)
{
   const attack = rolls?.[0]?.parent;
   const usage = attack ? usageOrigin(attack) : null;
   if (!usage || !setting('rollDamageOnUse')) { return; }
   rollCardDamage(usage, { isCritical: rolls[0].isCritical === true });
}

/**
 * `dnd5e.preRoll`: no roll dialog, unless the skip-dialog key is held.
 *
 * @param {object} config
 * @param {object} dialog
 */
export function skipRollDialog(config, dialog)
{
   if (!setting('noRollDialogs')) { return; }
   dialog.configure ??= skipKeyHeld(config.event);
}
