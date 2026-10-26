import { MODULE_ID, SHEET_CLASS_NAME } from './constants.js';
import { rerenderSheets } from './compat.js';
import { DEFAULT_COLUMNS } from './sheet/inventory.js';
import { DEFAULT_SPELL_COLUMNS } from './sheet/spellbook.js';
import { DEFAULT_FEATURE_COLUMNS } from './sheet/features.js';

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

   // What the header shows large in each ability column (user, 2026-10-24: each player's choice).
   game.settings.register(MODULE_ID, 'abilityEmphasis', {
      name: 'FHCS.Settings.AbilityEmphasis.Name',
      hint: 'FHCS.Settings.AbilityEmphasis.Hint',
      scope: 'client',
      config: true,
      type: String,
      choices: {
         modifier: 'FHCS.Settings.AbilityEmphasis.Modifier',
         score: 'FHCS.Settings.AbilityEmphasis.Score'
      },
      default: 'modifier',
      onChange: () => rerenderSheets(SHEET_CLASS_NAME)
   });

   // Which Inventory columns show (user, 2026-10-26: each player's choice, made from the tab in edit mode).
   game.settings.register(MODULE_ID, 'inventoryColumns', {
      name: 'FHCS.Settings.InventoryColumns.Name',
      hint: 'FHCS.Settings.InventoryColumns.Hint',
      scope: 'client',
      config: false,
      type: Object,
      default: { ...DEFAULT_COLUMNS },
      onChange: () => rerenderSheets(SHEET_CLASS_NAME)
   });

   // Which Spellbook columns show (SCOPE §4.7), chosen the same way.
   game.settings.register(MODULE_ID, 'spellColumns', {
      name: 'FHCS.Settings.SpellColumns.Name',
      hint: 'FHCS.Settings.SpellColumns.Hint',
      scope: 'client',
      config: false,
      type: Object,
      default: { ...DEFAULT_SPELL_COLUMNS },
      onChange: () => rerenderSheets(SHEET_CLASS_NAME)
   });

   // Which Features columns show (SCOPE §4.8), chosen the same way.
   game.settings.register(MODULE_ID, 'featureColumns', {
      name: 'FHCS.Settings.FeatureColumns.Name',
      hint: 'FHCS.Settings.FeatureColumns.Hint',
      scope: 'client',
      config: false,
      type: Object,
      default: { ...DEFAULT_FEATURE_COLUMNS },
      onChange: () => rerenderSheets(SHEET_CLASS_NAME)
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
