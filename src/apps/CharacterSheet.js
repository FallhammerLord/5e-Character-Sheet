import { MODULE_ID, MODULE_PATH } from '../constants.js';
import { headerFacts } from '../compat.js';
import { headerMinWidth, headerView, tabRow } from '../sheet/header.js';
import { delayTips, keepFolds } from '../chat/card.js';

/** Our template parts, by dnd5e part ID. */
export const SHEET_PARTS = {
   header: `${MODULE_PATH}/templates/sheet/header.hbs`,
   tabs: `${MODULE_PATH}/templates/sheet/tabs.hbs`
};

/**
 * dnd5e parts we drop: our header holds the ability scores; the sidebar's portrait, HP and AC are in the header, its
 * favorites move to the Attributes tab and its death saves to the header.
 */
const DROPPED_PARTS = ['abilityScores', 'sidebar'];

/** Parts drawn first, in this order: the header, then the tab row across the top, then the tab bodies. */
const LEADING_PARTS = ['header', 'tabs'];

/**
 * Window classes that carry dnd5e's look, removed so its sheet styles never reach ours (user, 2026-10-24: "it
 * shouldn't be influenced visually by the default sheet at all"). dnd5e's code doesn't look for them.
 */
const DND5E_LOOK = ['dnd5e2', 'vertical-tabs', 'hidden-title'];

/** dnd5e's parts with ours swapped in, the dropped ones gone, and the leading ones first. */
function ourParts(baseParts)
{
   const entries = Object.entries(baseParts ?? {})
      .filter(([id]) => !DROPPED_PARTS.includes(id))
      // Ours keep only dnd5e's part ID, not its classes.
      .map(([id, part]) => [id, SHEET_PARTS[id] ? { ...(part.id ? { id: part.id } : {}), template: SHEET_PARTS[id] } : part]);
   const rank = (id) => (LEADING_PARTS.includes(id) ? LEADING_PARTS.indexOf(id) : LEADING_PARTS.length);
   return Object.fromEntries(entries.sort(([a], [b]) => rank(a) - rank(b)));
}

/**
 * Our character sheet: dnd5e's own sheet class with our layout. Built from the class dnd5e provides at init,
 * since a module can't import from the system by path. dnd5e keeps every mechanic; the look is ours alone.
 *
 * Phase 1: our header. Phase 2: our frame and tab row in place of dnd5e's sidebar and vertical tabs.
 */
export function makeCharacterSheet(Base)
{
   return class FHCSCharacterSheet extends Base
   {
      static DEFAULT_OPTIONS = {
         classes: ['fhcs-sheet']
      };

      static PARTS = ourParts(Base.PARTS);

      /** Foundry joins every parent's classes; drop dnd5e's look from the list. */
      _initializeApplicationOptions(options)
      {
         const initialized = super._initializeApplicationOptions(options);
         initialized.classes = initialized.classes.filter((name) => !DND5E_LOOK.includes(name));
         return initialized;
      }

      /** @inheritDoc */
      async _preparePartContext(partId, context, options)
      {
         context = await super._preparePartContext(partId, context, options);
         const i18n = { localize: (key) => game.i18n.localize(key), format: (key, data) => game.i18n.format(key, data) };
         if (partId === 'header' && !this.actor.limited)
         {
            const facts = await headerFacts(this, context, MODULE_ID, game.settings.get(MODULE_ID, 'abilityEmphasis'));
            context.fhcs = { ...headerView(facts, i18n), editable: facts.editable };
         }
         if (partId === 'tabs')
         {
            context.fhcsTabs = tabRow(context.tabs, { canEdit: this.isEditable, editing: this.isEditMode }, i18n.localize);
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
