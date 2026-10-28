/**
 * Standalone rolls in the same frame (Track R, SCOPE §6.5): a check or save made outside an item card (a skill from
 * the sheet, a death save, a concentration save, initiative) draws as our card with one rolled d20 band; a GM's
 * request draws as our card with one row per party member, each result folded in.
 *
 * Like the usage card, we subclass dnd5e's models and swap their templates, so dnd5e's own buttons (Break
 * concentration, Legendary Resistance, the request's roll button) keep their `data-action` and work.
 */
import { MODULE_ID } from '../constants.js';
import { actorArtwork, requestOf, rollFacts, usageOrigin } from '../compat.js';
import { bindCardActions, d20Band, saveRow, themeCard } from './card.js';

export const ROLL_TEMPLATE = `modules/${MODULE_ID}/templates/chat/roll-card.hbs`;
export const REQUEST_TEMPLATE = `modules/${MODULE_ID}/templates/chat/request-card.hbs`;

const cardsOn = () => game.settings.get(MODULE_ID, 'cards');

/** A check or save we draw on its own: not folded into an item card or a request. */
const standalone = (system) => cardsOn() && !usageOrigin(system.parent) && !requestOf(system.parent);

/** The band heading for a standalone roll, by message type and roll type. */
function headingKey(message)
{
   const type = message.system?.type;
   if (type === 'death') { return 'FHCS.Card.Band.death'; }
   if (type === 'initiative') { return 'FHCS.Card.Band.initiative'; }
   return message.type === 'save' ? 'FHCS.Card.Band.rollSave' : 'FHCS.Card.Band.rollCheck';
}

/**
 * Our model for dnd5e's check and save messages.
 *
 * @param {typeof foundry.abstract.TypeDataModel} Base  dnd5e's CheckMessageData or SaveMessageData.
 */
export function makeRollMessageData(Base)
{
   return class extends Base
   {
      /** @override */
      get template()
      {
         return standalone(this) ? ROLL_TEMPLATE : super.template;
      }

      /** @inheritDoc */
      async _prepareContext(options)
      {
         const context = await super._prepareContext(options);
         if (options?.summary || !standalone(this)) { return context; }
         const localize = (key) => game.i18n.localize(key);
         const format = (key, data) => game.i18n.format(key, data);
         const facts = rollFacts(this.parent);
         const actor = this.parent.getAssociatedActor();
         // dnd5e's own lines (a death save's result, a resisted save, broken concentration) and buttons stay.
         const supplements = [];
         if (context.outcome) { supplements.push(context.outcome); }
         if (context.resisted) { supplements.push(localize('DND5E.LegendaryResistance.Resisted')); }
         if (context.concentrationBroken) { supplements.push(localize('DND5E.CONCENTRATION.Lost')); }
         const others = Object.values(context.buttonGroups ?? {}).flatMap((group) => group.entries ?? [])
            .map((entry) => ({ action: entry.action, index: entry.index, label: localize(entry.label) }));
         context.fhcs = {
            portrait: await actorArtwork(actor),
            actorName: actor?.name ?? this.parent.alias ?? '',
            title: facts?.what || localize(headingKey(this.parent)),
            itemUuid: context.header?.item?.uuid ?? '',
            subtitle: '',
            bands: [{
               kind: 'd20',
               heading: localize(headingKey(this.parent)),
               action: null,
               rolled: facts ? d20Band(facts, [], format) : null,
               text: facts ? '' : localize('FHCS.Card.HiddenRoll')
            }],
            supplements,
            others,
            canAct: false
         };
         return context;
      }

      /** @inheritDoc */
      _onRender(element, options = {})
      {
         super._onRender(element, options);
         if (options.summary || !standalone(this)) { return; }
         element.classList.add('fhcs-chat', 'fhcs-card-message');
         themeCard(element);
         bindCardActions(element, null);
      }
   };
}

/**
 * One party member's row on a request: their result folded in, or the roll button for whoever may roll it.
 *
 * @param {object} target    From the request's targets: actor, result, user.
 * @param {string} rollLabel
 * @param {Function} format
 */
function requestRow(target, rollLabel, format)
{
   const actor = fromUuidSync(target.actor);
   if (!actor) { return null; }
   const result = target.result ?? null;
   const facts = result ? rollFacts(result) : null;
   const canRoll = !result && (game.user.isGM || (target.user ? game.user === target.user : actor.isOwner));
   return {
      uuid: actor.uuid,
      who: actor.name,
      done: Boolean(result),
      result: facts ? saveRow(facts, format) : null,
      doneText: result && !facts ? format('FHCS.Card.Done', {}) : '',
      canRoll,
      rollLabel,
      waitText: format('FHCS.Card.Waiting', {})
   };
}

/**
 * Our model for dnd5e's request messages (a GM asks the party to roll).
 *
 * @param {typeof foundry.abstract.TypeDataModel} Base  dnd5e's RequestMessageData.
 */
export function makeRequestMessageData(Base)
{
   return class extends Base
   {
      /** @override */
      get template()
      {
         return cardsOn() ? REQUEST_TEMPLATE : super.template;
      }

      /** @inheritDoc */
      async _prepareContext(options)
      {
         const context = await super._prepareContext(options);
         if (!cardsOn()) { return context; }
         const format = (key, data) => game.i18n.format(key, data);
         const author = this.parent.author;
         const rollLabel = context.button?.label ?? '';
         // The header says what to roll; each row's button just says "Roll".
         const rowLabel = game.i18n.localize('FHCS.Card.RollShort');
         context.fhcs = {
            portrait: author?.avatar ?? '',
            actorName: author?.name ?? '',
            title: rollLabel,
            itemUuid: '',
            subtitle: '',
            heading: game.i18n.localize('FHCS.Card.Band.request'),
            rows: this.targets.map((t) => requestRow(t, rowLabel, format)).filter(Boolean)
         };
         return context;
      }

      /** @inheritDoc */
      _onRender(element, options = {})
      {
         super._onRender(element, options);
         if (!cardsOn()) { return; }
         element.classList.add('fhcs-chat', 'fhcs-card-message');
         themeCard(element);
         bindCardActions(element, null);
      }
   };
}
