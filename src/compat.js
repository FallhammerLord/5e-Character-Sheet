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
   return {
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
         : []
   };
}
