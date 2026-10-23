import { MODULE_ID } from './constants.js';

/** Our settings. Client ones each player chooses; world ones the GM sets for the table. */
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

   // World: the table plays by one rule.
   for (const key of ['rollAttackOnUse', 'rollDamageOnUse', 'noRollDialogs'])
   {
      const label = key[0].toUpperCase() + key.slice(1);
      game.settings.register(MODULE_ID, key, {
         name: `FHCS.Settings.${label}.Name`,
         hint: `FHCS.Settings.${label}.Hint`,
         scope: 'world',
         config: true,
         type: Boolean,
         default: true
      });
   }

   // The spare d20 is part of every d20 roll's data.
   game.settings.register(MODULE_ID, 'twoD20s', {
      name: 'FHCS.Settings.TwoD20s.Name',
      hint: 'FHCS.Settings.TwoD20s.Hint',
      scope: 'world',
      config: true,
      type: Boolean,
      default: true
   });
}
