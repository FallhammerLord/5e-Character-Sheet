/**
 * The only place for version-sensitive Foundry and dnd5e APIs. When dnd5e or Foundry moves something, fix it here.
 * Checked against dnd5e 6.0.6 (module/applications/actor/character-sheet.mjs, dnd5e.mjs).
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
