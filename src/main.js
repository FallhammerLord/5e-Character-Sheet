import { MODULE_ID } from './constants.js';
import { registerCharacterSheet, systemCharacterSheet } from './compat.js';
import { makeCharacterSheet } from './apps/CharacterSheet.js';
import { registerQuenchTests } from './tests/quench.js';

Hooks.once('init', () =>
{
   const Base = systemCharacterSheet();
   if (!Base)
   {
      console.error(`${MODULE_ID} | dnd5e's character sheet was not found; the sheet is not registered.`);
      return;
   }
   registerCharacterSheet(makeCharacterSheet(Base), 'FHCS.SheetLabel');
   console.log(`${MODULE_ID} | Character sheet registered (dnd5e ${game.system?.version}).`);
});

// In-world tests, only when the Quench module is active (src/tests/quench.js).
Hooks.on('quenchReady', registerQuenchTests);
