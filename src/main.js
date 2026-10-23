import { MODULE_ID } from './constants.js';
import { registerCharacterSheet, systemCharacterSheet } from './compat.js';
import { makeCharacterSheet } from './apps/CharacterSheet.js';
import { registerQuenchTests } from './tests/quench.js';
import { registerSettings } from './settings.js';
import { decorateMessage } from './chat/outcome.js';

Hooks.once('init', () =>
{
   registerSettings();
   const Base = systemCharacterSheet();
   if (!Base)
   {
      console.error(`${MODULE_ID} | dnd5e's character sheet was not found; the sheet is not registered.`);
      return;
   }
   registerCharacterSheet(makeCharacterSheet(Base), 'FHCS.SheetLabel');
   console.log(`${MODULE_ID} | Character sheet registered (dnd5e ${game.system?.version}).`);
});

// Clear chat cards (Track R): runs for every dnd5e message, whatever sheet the player uses.
Hooks.on('dnd5e.renderChatMessage', (message, html) =>
{
   if (game.settings.get(MODULE_ID, 'clearCards')) { decorateMessage(message, html); }
});

// In-world tests, only when the Quench module is active (src/tests/quench.js).
Hooks.on('quenchReady', registerQuenchTests);
