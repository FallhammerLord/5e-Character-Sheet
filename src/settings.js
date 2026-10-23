import { MODULE_ID } from './constants.js';

/** Client settings: each player chooses for themselves. */
export function registerSettings()
{
   game.settings.register(MODULE_ID, 'cards', {
      name: 'FHCS.Settings.Cards.Name',
      hint: 'FHCS.Settings.Cards.Hint',
      scope: 'client',
      config: true,
      type: Boolean,
      default: true,
      requiresReload: true
   });
}
