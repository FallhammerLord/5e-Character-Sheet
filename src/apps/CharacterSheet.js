import { MODULE_ID, MODULE_PATH } from '../constants.js';
import { headerFacts } from '../compat.js';
import { headerMinWidth, headerView } from '../sheet/header.js';
import { delayTips, keepFolds } from '../chat/card.js';

/** Our template parts, by dnd5e part ID. Phase 1: the header, which also takes the ability scores. */
export const SHEET_PARTS = {
   header: `${MODULE_PATH}/templates/sheet/header.hbs`
};

/** dnd5e parts our parts replace, dropped from the sheet. */
const REPLACED_PARTS = ['abilityScores'];

/**
 * Our character sheet: dnd5e's own sheet class with our layout. Built from the class dnd5e provides at init,
 * since a module can't import from the system by path.
 *
 * Phase 1: our header (SCOPE §4.1) in place of dnd5e's header and ability scores; dnd5e's other parts unchanged.
 */
export function makeCharacterSheet(Base)
{
   const parts = Object.fromEntries(Object.entries(Base.PARTS ?? {})
      .filter(([id]) => !REPLACED_PARTS.includes(id))
      .map(([id, part]) => [id, SHEET_PARTS[id] ? { ...part, template: SHEET_PARTS[id] } : part]));

   return class FHCSCharacterSheet extends Base
   {
      static DEFAULT_OPTIONS = {
         classes: ['fhcs-sheet']
      };

      static PARTS = parts;

      /** @inheritDoc */
      async _preparePartContext(partId, context, options)
      {
         context = await super._preparePartContext(partId, context, options);
         if (partId === 'header' && !this.actor.limited)
         {
            const facts = await headerFacts(this, context, MODULE_ID, game.settings.get(MODULE_ID, 'abilityEmphasis'));
            const i18n = { localize: (key) => game.i18n.localize(key), format: (key, data) => game.i18n.format(key, data) };
            context.fhcs = { ...headerView(facts, i18n), editable: facts.editable };
         }
         return context;
      }

      /** Never narrower than the ability row needs, so it never wraps. */
      _updatePosition(position)
      {
         const min = headerMinWidth(Object.keys(CONFIG.DND5E?.abilities ?? {}).length || 6);
         if (typeof position.width === 'number') { position.width = Math.max(position.width, min); }
         return super._updatePosition(position);
      }

      /** @inheritDoc */
      async _onRender(context, options)
      {
         await super._onRender(context, options);
         // The header's trays stay open across re-renders; its chips' tooltips wait like the cards' do.
         keepFolds(this.element, `sheet-${this.id}`);
         delayTips(this.element);
      }
   };
}
