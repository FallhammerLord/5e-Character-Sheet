import { MODULE_ID } from './constants.js';

/** Client settings: each player chooses for themselves. */
export function registerSettings()
{
   game.settings.register(MODULE_ID, 'clearCards', {
      name: 'FHCS.Settings.ClearCards.Name',
      hint: 'FHCS.Settings.ClearCards.Hint',
      scope: 'client',
      config: true,
      type: Boolean,
      default: true
   });
}
