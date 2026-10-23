import { MODULE_ID } from './constants.js';
import { extendChatModel, registerCharacterSheet, systemCharacterSheet } from './compat.js';
import { makeCharacterSheet } from './apps/CharacterSheet.js';
import { registerQuenchTests } from './tests/quench.js';
import { registerSettings } from './settings.js';
import { makeUsageMessageData } from './chat/card.js';
import { addSpareD20, damageAfterAttack, damageAfterUse, foldIntoCard, refreshOnRollChange, rollOnUse, skipRollDialog }
   from './chat/rolls.js';

Hooks.once('init', () =>
{
   registerSettings();
   // One card per action (Track R): runs for every dnd5e usage card, whatever sheet the player uses.
   if (!extendChatModel('usage', makeUsageMessageData))
   {
      console.error(`${MODULE_ID} | dnd5e's usage chat cards were not found; chat cards keep dnd5e's layout.`);
   }
   const Base = systemCharacterSheet();
   if (!Base)
   {
      console.error(`${MODULE_ID} | dnd5e's character sheet was not found; the sheet is not registered.`);
      return;
   }
   registerCharacterSheet(makeCharacterSheet(Base), 'FHCS.SheetLabel');
   console.log(`${MODULE_ID} | Character sheet registered (dnd5e ${game.system?.version}).`);
});

// One card per action: rolls made from a card draw in its bands; d20 rolls carry a spare die.
Hooks.on('dnd5e.renderChatMessage', foldIntoCard);
Hooks.on('dnd5e.postRollConfiguration', addSpareD20);
Hooks.on('updateChatMessage', refreshOnRollChange);
// Roll on use and no roll dialogs (world settings).
Hooks.on('dnd5e.preUseActivity', rollOnUse);
Hooks.on('dnd5e.postUseActivity', damageAfterUse);
Hooks.on('dnd5e.postRollAttack', damageAfterAttack);
Hooks.on('dnd5e.preRoll', skipRollDialog);

// In-world tests, only when the Quench module is active (src/tests/quench.js).
Hooks.on('quenchReady', registerQuenchTests);
