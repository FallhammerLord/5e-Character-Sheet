/**
 * The only place for version-sensitive Foundry and dnd5e APIs. When dnd5e or Foundry moves something, fix it here.
 * Checked against dnd5e 6.0.6 and Foundry 14 rolls (`Roll#_evaluateTotal`, `Roll#resetFormula`, `Roll.fromData`) (module/applications/actor/character-sheet.mjs, dnd5e.mjs, documents/chat-message.mjs,
 * data/chat-message/, dice/d20-roll.mjs). Chat facts: docs/research/dnd5e-6.0-chat.md.
 */
import { countingDie, MAX_PER_SIDE, modeForSides } from './chat/d20.js';
import { diceMath } from './chat/math.js';

/** dnd5e's own character sheet, which ours extends so every mechanic keeps working. Set by dnd5e before init. */
export function systemCharacterSheet()
{
   return globalThis.dnd5e?.applications?.actor?.CharacterActorSheet;
}

/** Registers a sheet for character actors, offered beside dnd5e's own (not the default). */
export function registerCharacterSheet(sheetClass, label)
{
   foundry.applications.apps.DocumentSheetConfig.registerSheet(Actor, 'fhcs', sheetClass, {
      types: ['character'],
      makeDefault: false,
      label
   });
}

/**
 * Swaps dnd5e's data model for one chat message type with our subclass of it. Runs at init, after dnd5e's init set
 * CONFIG.ChatMessage.dataModels and before the world's messages are built.
 *
 * @param {string} type        Message type, e.g. 'usage'.
 * @param {Function} extend    (dnd5e's model class) => our subclass.
 * @returns {boolean} Whether dnd5e had that type.
 */
export function extendChatModel(type, extend)
{
   const models = CONFIG.ChatMessage?.dataModels;
   if (!models?.[type]) { return false; }
   models[type] = extend(models[type]);
   return true;
}

/** The actor's portrait for a chat card (dnd5e's choice of token or actor art), or ''. */
export async function actorArtwork(actor)
{
   if (!actor) { return ''; }
   const art = await actor.getPreferredArtwork?.();
   return (art && !art.isVideo ? art.src : actor.img) ?? '';
}

/** Registers template parts as Handlebars partials named by their paths, so card templates can include them. */
export function preloadTemplates(paths)
{
   return foundry.applications.handlebars.loadTemplates(paths);
}

/** Renders one of our templates by its Foundry path. */
export function renderTemplate(path, data)
{
   return foundry.applications.handlebars.renderTemplate(path, data);
}

/**
 * The facts our outcome line needs from a dnd5e chat message with a d20 roll, or null for any other message (and
 * for rolls the viewer may not see). Respects dnd5e's visibility settings: no verdict or hit list unless the
 * system would show them to this user.
 *
 * @param {ChatMessage} message
 * @returns {object|null} See chat/outcome.js describeRoll.
 */
export function rollFacts(message)
{
   const roll = message.rolls?.[0];
   const D20Roll = CONFIG.Dice.D20Roll;
   if (!D20Roll || !(roll instanceof D20Roll) || !roll._evaluated || !roll.validD20Roll) { return null; }
   if (!message.isContentVisible) { return null; }

   const system = message.system ?? {};
   const kind = message.type;
   const showResult = Boolean(system.displayResult ?? message.shouldDisplayChallenge);
   const target = Number.isFinite(roll.options.target) ? roll.options.target : null;
   const flavor = document.createElement('div');
   flavor.innerHTML = message.flavor ?? '';
   const d20 = roll.d20;
   return {
      messageId: message.id,
      kind,
      who: message.getAssociatedToken?.()?.name ?? message.alias ?? '',
      what: flavor.textContent.trim(),
      total: roll.total,
      natural: roll.d20.total,
      target,
      showResult,
      success: target === null ? null : Boolean(roll.isSuccess || system.forceSuccess),
      isCritical: Boolean(system.canCrit && roll.isCritical),
      targets: (kind === 'attack') && showResult
         ? (system.evaluatedTargets ?? []).map((t) => ({ name: t.name, isMiss: t.isMiss }))
         : [],
      dice: d20.results.map((r) => ({ result: r.result, active: r.active !== false, discarded: Boolean(r.discarded),
         rerolled: Boolean(r.rerolled) })),
      advantageMode: roll.options.advantageMode ?? 0,
      sides: roll.options.fhcs?.sides ?? [],
      spare: roll.options.fhcs?.spare ?? null,
      formula: roll.formula,
      math: diceMath(mathTerms(roll)).sum,
      canResist: Boolean(system.canResist),
      canEdit: canEdit(message),
      bonuses: roll.options.fhcs?.bonuses ?? []
   };
}

/** Whether this user may change a roll message: its author or the GM (Foundry's rule for updating messages). */
export function canEdit(message)
{
   return Boolean(message.isAuthor || game.user.isGM);
}

/** Whether a save or check message answers a card's save or check button (by skill, tool or ability). */
export function answersButton(message, match)
{
   if (!match) { return true; }
   const { skill, tool, ability } = message.system ?? {};
   return [skill, tool, ability].includes(match);
}

/** Whether this user may use dnd5e's apply-damage tray (the GM, or players when the world allows it). */
export function canApplyDamage()
{
   return game.user.isGM || Boolean(game.settings.get('dnd5e', 'allowPlayerDamageTray'));
}

/** dnd5e's chat trays (apply damage, apply effects) inside an element, opened: SCOPE §6.5 keeps them unfolded. */
export function openTrays(element)
{
   for (const tray of element.querySelectorAll('damage-application, effect-application')) { tray.open = true; }
}

/**
 * Points a card's "roll for" buttons at selected tokens (SCOPE §6.6): dnd5e's save and check buttons roll for
 * `message.system.evaluatedTargets`, which follows the message's targeting mode; its default is the player's targets.
 */
export function preferSelected(message)
{
   if (message._targetState && !message._targetState.mode) { message._targetState.mode = 'selected'; }
}

/**
 * The facts our damage band needs from a dnd5e damage or healing message, or null (none, or not visible).
 *
 * @param {ChatMessage} message
 * @returns {object|null} See chat/card.js damageBand.
 */
export function damageFacts(message)
{
   const DamageRoll = CONFIG.Dice.DamageRoll;
   const rolls = (message.rolls ?? []).filter((r) => DamageRoll && (r instanceof DamageRoll) && r._evaluated);
   if (!rolls.length || !message.isContentVisible) { return null; }
   const types = { ...CONFIG.DND5E.damageTypes, ...CONFIG.DND5E.healingTypes };
   const label = (type) => game.i18n.localize(types[type]?.label ?? '');
   const parts = new Map();
   for (const roll of rolls)
   {
      const type = roll.options.type ?? '';
      parts.set(type, (parts.get(type) ?? 0) + Math.max(0, roll.total));
   }
   const onSave = message.system?.onSave;
   return {
      messageId: message.id,
      canEdit: canEdit(message),
      bonuses: rolls.flatMap((r) => r.options.fhcs?.bonuses ?? []),
      healing: message.type === 'healing',
      critical: rolls.some((r) => r.isCritical),
      total: rolls.reduce((sum, r) => sum + Math.max(0, r.total), 0),
      parts: [...parts].map(([type, total]) => ({ type, label: label(type), total })),
      math: rolls.map((r) =>
      {
         const { sum, dropped } = diceMath(mathTerms(r));
         return { formula: r.formula, result: `${sum} = ${r.total}`, label: label(r.options.type), dropped };
      }),
      onSave: onSave
         ? game.i18n.localize(`DND5E.SAVE.FIELDS.damage.onSave.${onSave[0].toUpperCase()}${onSave.slice(1)}`)
         : ''
   };
}

/**
 * A Foundry roll's terms as the plain terms chat/math.js writes out: every die's value and whether it counts.
 *
 * @param {Roll} roll
 * @returns {object[]}
 */
export function mathTerms(roll)
{
   const { DiceTerm, OperatorTerm, ParentheticalTerm } = foundry.dice.terms;
   return roll.terms.map((term) =>
   {
      if (term instanceof OperatorTerm) { return { op: term.operator }; }
      if (term instanceof DiceTerm)
      {
         return { dice: term.results.map((r) => ({ value: r.result, counts: (r.active !== false) && !r.discarded })) };
      }
      if ((term instanceof ParentheticalTerm) && term.roll) { return { group: mathTerms(term.roll) }; }
      return { value: term.total ?? term.expression };
   });
}

/**
 * Roll messages of the given types made from a usage card's buttons, oldest first, that this user may see.
 *
 * @param {ChatMessage} usage   The usage card's message.
 * @param {string[]} types      'attack', 'damage', 'healing', 'save', 'check'.
 */
export function rollsFrom(usage, types)
{
   if (!usage.id) { return []; }
   return types.flatMap((type) => usage.getAssociatedRolls?.(type) ?? [])
      .filter((m) => m.visible)
      .sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Rolls a card's damage the way dnd5e's Damage button does (last attack's ability, ammunition and mode; the card's
 * scaling and targets), as a critical or not, without the damage dialog, linked to the card (`system.origin`).
 *
 * @param {ChatMessage} usage
 * @param {object} options
 * @param {boolean} options.isCritical
 * @param {Event} [options.event]   The click, when there is one.
 */
export async function rollCardDamage(usage, { isCritical, event = null })
{
   const activity = usage.getAssociatedActivity?.({ scaled: true });
   if (!activity?.rollDamage || !activity.damage?.parts?.length) { return; }
   const lastAttack = usage.getAssociatedRolls('attack').at(-1);
   const { ability, ammunitionItem: ammunition, mode: attackMode } = lastAttack?.system ?? {};
   await activity.rollDamage({ event, ability, ammunition, attackMode, isCritical }, { configure: false },
      { data: { system: { origin: usage.id, targets: usage.system.targets } } });
}

/** Whether dnd5e's "skip dialog" key (Shift by default, rebindable) is held for this event. */
export function skipKeyHeld(event)
{
   return Boolean(event && globalThis.dnd5e?.utils?.areKeysPressed?.(event, 'skipDialogNormal'));
}

/** The usage card a roll message was made from, if it is one. */
export function usageOrigin(message)
{
   const origin = message.system?.origin;
   return origin?.type === 'usage' ? origin : null;
}

/** The request card a roll answers (dnd5e flags each result `requestResult`), if it is still there. */
export function requestOf(message)
{
   const requestId = message.getFlag?.('dnd5e', 'requestResult')?.requestId;
   return requestId ? (game.messages.get(requestId) ?? null) : null;
}

/** One d20 rolled now, from Foundry's random source (synchronous, for roll hooks that can't wait). */
export function d20Now()
{
   return Math.ceil(CONFIG.Dice.randomUniform() * 20);
}

/** Whether a roll is one of dnd5e's d20 rolls (checks, saves, attacks). */
export function isD20Roll(roll)
{
   const D20Roll = CONFIG.Dice.D20Roll;
   return Boolean(D20Roll) && (roll instanceof D20Roll);
}

/** One d20 rolled now, with Dice So Nice's animation when it is active. */
async function freshD20()
{
   const roll = await new Roll('1d20').evaluate();
   await game.dice3d?.showForRoll?.(roll, game.user, true);
   return roll.total;
}

/** A roll's copy to change, and the message update that saves it in place of the original. */
function editable(message, index)
{
   const roll = message.rolls?.[index];
   if (!roll) { return null; }
   const copy = roll.constructor.fromData(roll.toJSON());
   copy.options.fhcs = { ...copy.options.fhcs };
   const save = () =>
   {
      copy._total = copy._evaluateTotal();
      copy.resetFormula();
      return message.update({ rolls: message.rolls.map((r, i) => (i === index ? copy : r)) });
   };
   return { copy, save };
}

/**
 * Late advantage or disadvantage (SCOPE §6.6): adds a d20 on one side of a d20 roll (at most five a side), keeps
 * every die already there, recomputes which die counts by click order, and saves the roll in place. The first die
 * added is the spare rolled in advance.
 *
 * @param {ChatMessage} message   A check, save or attack message.
 * @param {'adv'|'dis'} side
 */
export async function addD20(message, side)
{
   if (!isD20Roll(message.rolls?.[0]) || !canEdit(message)) { return; }
   const { copy, save } = editable(message, 0);
   const d20 = copy.d20;
   const live = d20.results.filter((r) => !r.rerolled);
   const mode = copy.options.advantageMode ?? 0;
   const sides = copy.options.fhcs.sides ?? live.slice(1).map(() => (mode === -1 ? 'dis' : 'adv'));
   if (sides.filter((s) => s === side).length >= MAX_PER_SIDE) { return; }
   const value = copy.options.fhcs.spare ?? await freshD20();
   const added = { result: value, active: true };
   d20.results.push(added);
   const all = [...live, added];
   sides.push(side);
   const keep = countingDie(all.map((r) => r.result), sides);
   all.forEach((r, i) => { r.active = i === keep; r.discarded = i !== keep; });
   d20.modifiers = d20.modifiers.filter((m) => !/^(adv|dis|kh|kl)/i.test(m));
   copy.options.advantageMode = modeForSides(sides);
   d20.options.advantageMode = copy.options.advantageMode;
   copy.options.fhcs.sides = sides;
   copy.options.fhcs.spare = null;
   await save();
}

/**
 * A late bonus or penalty (SCOPE §6.4): rolls a number or dice formula ("2", "1d4", "-1d4") and adds it to a roll as
 * its own term, then saves the roll in place.
 *
 * @param {ChatMessage} message
 * @param {string} formula
 * @param {number} [index]   Which of the message's rolls (damage messages may hold several).
 * @returns {Promise<boolean>} False when the formula isn't a roll.
 */
export async function addBonus(message, formula, index = 0)
{
   const text = formula.trim();
   if (!text || !Roll.validate(text) || !canEdit(message)) { return false; }
   const target = editable(message, index);
   if (!target) { return false; }
   const bonus = await new Roll(text, target.copy.data).evaluate();
   if (!bonus.isDeterministic) { await game.dice3d?.showForRoll?.(bonus, game.user, true); }
   const terms = bonus.terms;
   if (!(terms[0] instanceof foundry.dice.terms.OperatorTerm))
   {
      target.copy.terms.push(new foundry.dice.terms.OperatorTerm({ operator: '+' }));
   }
   target.copy.terms.push(...terms);
   target.copy.options.fhcs.bonuses = [...(target.copy.options.fhcs.bonuses ?? []), { formula: bonus.formula, total: bonus.total }];
   await target.save();
   return true;
}

/**
 * Re-renders the usage card a roll belongs to, on every client, when the roll changes in place. dnd5e refreshes the
 * card only when a roll's `system` data changes (`ChatMessage5e#_onUpdate`); late adds change its rolls.
 *
 * @param {ChatMessage} message
 */
export async function refreshCard(message)
{
   const request = requestOf(message);
   if (request) { ui.chat?.updateMessage(request); }
   const origin = usageOrigin(message);
   if (!origin) { return; }
   await origin.system?.onDescendentRefresh?.(message);
   ui.chat?.updateMessage(origin);
}

/** How long after posting a card the log keeps following it down as its rolls fill in. */
const FOLLOW_MS = 8000;

/**
 * Keeps the chat log where the player wants it (user, 2026-10-24). Checked against Foundry 14's ChatLog
 * (`postOne(message, { notify, scroll })`: scroll true always scrolls, false never, omitted is Foundry's own choice;
 * `updateMessage`, `scrollBottom`).
 *
 * - A roll drawn inside a card (folded) posts with no scroll and no notification: re-rolling on a card higher up
 *   the log doesn't move the log.
 * - A new card this player makes always scrolls the log to the bottom, then follows it down for a few seconds while
 *   its attack and damage fold in and it grows (each redraw, and any change in its size). Scrolling, clicking or
 *   typing in the log ends the follow at once.
 *
 * Logs and leaves chat alone if Foundry renames these methods.
 *
 * @param {Function} isQuiet   (message) => true for a folded roll.
 * @returns {boolean} Whether the chat log was wrapped.
 */
export function quietPosts(isQuiet)
{
   const proto = ui.chat?.constructor?.prototype;
   if (!proto || !['postOne', 'scrollBottom', 'updateMessage'].every((m) => typeof proto[m] === 'function'))
   {
      console.warn('fhcs | ChatLog#postOne, #scrollBottom or #updateMessage not found; the chat log scrolls as Foundry decides.');
      return false;
   }
   if (proto.postOne.fhcsQuiet) { return true; }
   const { postOne, updateMessage } = proto;
   const follow = { id: null, until: 0, observer: null };
   const following = (id) => Boolean(id) && (id === follow.id) && (Date.now() < follow.until);
   const stopFollowing = () => { follow.id = null; follow.observer?.disconnect(); follow.observer = null; };
   // A card keeps growing after it is placed (dnd5e builds its trays' lists, images load); watch its size while
   // following and scroll again each time it changes.
   const watchCard = (log, id) =>
   {
      follow.observer?.disconnect();
      const card = log.element?.querySelector?.(`[data-message-id="${id}"]`);
      if (!card || (typeof ResizeObserver !== 'function')) { return; }
      follow.observer = new ResizeObserver(() => { if (following(id)) { log.scrollBottom(); } else { stopFollowing(); } });
      follow.observer.observe(card);
   };

   proto.postOne = async function (message, options = {})
   {
      if (isQuiet(message)) { return postOne.call(this, message, { ...options, notify: false, scroll: false }); }
      if (!message.isAuthor) { return postOne.call(this, message, options); }
      watchForPlayer(this, stopFollowing);
      Object.assign(follow, { id: message.id, until: Date.now() + FOLLOW_MS });
      const result = await postOne.call(this, message, { ...options, scroll: true });
      watchCard(this, message.id);
      return result;
   };
   proto.postOne.fhcsQuiet = true;

   proto.updateMessage = async function (message, ...rest)
   {
      const result = await updateMessage.call(this, message, ...rest);
      if (following(message?.id))
      {
         watchCard(this, message.id);
         await this.scrollBottom({ waitImages: true });
      }
      return result;
   };
   return true;
}

/** Ends a follow the moment the player scrolls, clicks or types in the chat log themselves. */
function watchForPlayer(log, stop)
{
   const element = log.element;
   if (!element || element.dataset.fhcsWatched) { return; }
   element.dataset.fhcsWatched = 'true';
   for (const type of ['wheel', 'touchmove', 'pointerdown', 'keydown'])
   {
      element.addEventListener(type, stop, { passive: true, capture: true });
   }
}

/** Shows Foundry's tooltip on an element, above it (our delayed tooltips; chat/card.js). */
export function showTooltip(element, text)
{
   game.tooltip?.activate?.(element, { text, direction: 'UP' });
}

/** Hides Foundry's tooltip. */
export function hideTooltip()
{
   game.tooltip?.deactivate?.();
}
