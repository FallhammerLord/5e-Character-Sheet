/**
 * One card per action (Track R, SCOPE §6.5): dnd5e's usage card drawn with our layout. Portrait and title, a folded
 * description, then one full-width band per roll the action offers (attack, save or check, damage), then any other
 * actions as centered buttons.
 *
 * We subclass dnd5e's usage-message data model and swap its template, so dnd5e still binds every click
 * (`data-action` + `data-index` reach `activity.onChatAction`) and its trays (`recorded-targets`,
 * `effect-application`) work inside our markup. Slices 2–8 fill the bands with results.
 */
import { MODULE_ID } from '../constants.js';
import { actorArtwork } from '../compat.js';

export const CARD_TEMPLATE = `modules/${MODULE_ID}/templates/chat/usage-card.hbs`;

/** dnd5e's chat button actions that become bands, and the kind of band each is. */
const BAND_KINDS = {
   rollAttack: 'attack',
   rollSave: 'save',
   rollCheck: 'save',
   rollDamage: 'damage',
   rollHealing: 'damage',
   rollFormula: 'roll'
};

/**
 * Splits dnd5e's prepared chat buttons into bands and other actions, in dnd5e's order.
 *
 * @param {object[]} buttons    From UsageMessageData#_prepareButtons: action, index, label, hidden.
 * @param {Function} localize   key => text (passes plain text through).
 * @returns {{ bands: object[], others: object[] }}
 */
export function cardParts(buttons, localize)
{
   const bands = [];
   const others = [];
   for (const button of buttons)
   {
      if (button.hidden) { continue; }
      const label = localize(button.label ?? '');
      const kind = BAND_KINDS[button.action];
      if (!kind) { others.push({ action: button.action, index: button.index, label }); continue; }
      const rollText = localize(`FHCS.Card.Roll.${button.action}`);
      bands.push({
         kind,
         action: button.action,
         index: button.index,
         heading: localize(`FHCS.Card.Band.${button.action}`),
         // A save or check carries its own words ("DC 15 Dexterity Saving Throw"); the rest say what clicking does.
         text: (kind === 'save') || (kind === 'roll') ? label : rollText
      });
   }
   return { bands, others };
}

/** Whether a message draws as our card: the setting is on and dnd5e didn't fall back to legacy HTML content. */
const useCard = (system) => game.settings.get(MODULE_ID, 'cards') && !system.parent.content;

/**
 * Our usage-message data model, built from dnd5e's at init (a module can't import the system by path).
 *
 * @param {typeof foundry.abstract.TypeDataModel} Base  dnd5e's UsageMessageData.
 */
export function makeUsageMessageData(Base)
{
   return class FHCSUsageMessageData extends Base
   {
      /** @override */
      get template()
      {
         return useCard(this) ? CARD_TEMPLATE : super.template;
      }

      /** @inheritDoc */
      async _prepareContext(options)
      {
         const context = await super._prepareContext(options);
         if (options?.summary || !useCard(this)) { return context; }

         const localize = (key) => game.i18n.localize(key);
         const actor = this.parent.getAssociatedActor();
         const item = context.item ?? {};
         const { bands, others } = cardParts(context.buttons ?? [], localize);
         const tags = Object.values(context.rows ?? {}).flatMap((row) => row.entries ?? []).map((e) => e.label);
         context.fhcs = {
            portrait: await actorArtwork(actor),
            actorName: actor?.name ?? this.parent.alias ?? '',
            title: item.name ?? '',
            itemUuid: item.uuid ?? '',
            subtitle: context.subtitle ?? '',
            flavor: context.activity?.chatFlavor ?? '',
            description: context.description ?? '',
            supplements: (context.supplements ?? []).map((s) => ({ label: localize(s.label), detail: s.detail })),
            tags,
            hasDetails: Boolean(context.description || context.activity?.chatFlavor || tags.length
               || context.supplements?.length),
            bands,
            others
         };
         return context;
      }

      /** @inheritDoc */
      _onRender(element, options = {})
      {
         super._onRender(element, options);
         if (!options.summary && useCard(this)) { element.classList.add('fhcs-chat', 'fhcs-card-message'); }
      }
   };
}
