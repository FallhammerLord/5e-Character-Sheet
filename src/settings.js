import { MODULE_ID, SHEET_CLASS_NAME, THEMES } from './constants.js';
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

   // The table's sheet theme (SCOPE §4.11, user 2026-10-28): a character's own choice wins; Plain is today's look.
   game.settings.register(MODULE_ID, 'theme', {
      name: 'FHCS.Settings.Theme.Name',
      hint: 'FHCS.Settings.Theme.Hint',
      scope: 'world',
      config: true,
      type: String,
      choices: Object.fromEntries(THEMES.map((key) => [key, `FHCS.Theme.${key}`])),
      default: 'plain',
      onChange: () => rerenderSheets(SHEET_CLASS_NAME)
   });

   // A theme's motion, each player's own (SCOPE §4.11): off, the sheet keeps still, as under reduced motion.
   game.settings.register(MODULE_ID, 'motion', {
      name: 'FHCS.Settings.Motion.Name',
      hint: 'FHCS.Settings.Motion.Hint',
      scope: 'client',
      config: true,
      type: Boolean,
      default: true,
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
}
