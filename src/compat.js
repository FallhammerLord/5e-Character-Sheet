/**
 * The only place for version-sensitive Foundry and dnd5e APIs. When dnd5e or Foundry moves something, fix it here.
 * Checked against dnd5e 6.0.6 (module/applications/actor/character-sheet.mjs, dnd5e.mjs, documents/chat-message.mjs,
 * data/chat-message/, dice/d20-roll.mjs). Chat facts: docs/research/dnd5e-6.0-chat.md.
 */

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
      math: roll.result,
      canResist: Boolean(system.canResist)
   };
}

/** Whether a save or check message answers a card's save or check button (by skill, tool or ability). */
export function answersButton(message, match)
{
   if (!match) { return true; }
   const { skill, tool, ability } = message.system ?? {};
   return [skill, tool, ability].includes(match);
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
      healing: message.type === 'healing',
      critical: rolls.some((r) => r.isCritical),
      total: rolls.reduce((sum, r) => sum + Math.max(0, r.total), 0),
      parts: [...parts].map(([type, total]) => ({ type, label: label(type), total })),
      math: rolls.map((r) => ({ formula: r.formula, result: `${r.result} = ${r.total}`, label: label(r.options.type) })),
      onSave: onSave
         ? game.i18n.localize(`DND5E.SAVE.FIELDS.damage.onSave.${onSave[0].toUpperCase()}${onSave.slice(1)}`)
         : ''
   };
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
 * Rolls a card's damage again, as a critical or not, the way dnd5e's Damage button does (last attack's ability,
 * ammunition and mode; the card's scaling and targets), without the damage dialog. The click's event links the roll
 * to the card (`system.origin`).
 *
 * @param {ChatMessage} usage
 * @param {Event} event
 * @param {boolean} isCritical
 */
export async function rollDamageAgain(usage, event, isCritical)
{
   const activity = usage.getAssociatedActivity?.({ scaled: true });
   if (!activity?.rollDamage) { return; }
   const lastAttack = usage.getAssociatedRolls('attack').at(-1);
   const { ability, ammunitionItem: ammunition, mode: attackMode } = lastAttack?.system ?? {};
   await activity.rollDamage({ event, ability, ammunition, attackMode, isCritical }, { configure: false },
      { data: { system: { targets: usage.system.targets } } });
}

/** The usage card a roll message was made from, if it is one. */
export function usageOrigin(message)
{
   const origin = message.system?.origin;
   return origin?.type === 'usage' ? origin : null;
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
