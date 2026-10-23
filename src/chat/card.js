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
import { actorArtwork, damageFacts, rollDamageAgain, rollFacts, rollsFrom } from '../compat.js';
import { describeRoll } from './outcome.js';
import { d20Row, dieClasses } from './d20.js';

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

/** Notes under a band's dice math: earlier rolls from the same band. */
const earlierNote = (earlier, format) => (earlier.length ? [format('FHCS.Card.Earlier', { totals: earlier.join(', ') })] : []);

/**
 * What a rolled d20 band shows: the total, the d20 row, the outcome in words, and (when opened) the dice math.
 *
 * @param {object} facts       From compat.rollFacts, for the latest roll.
 * @param {number[]} earlier   Totals of earlier rolls from the same band, oldest first.
 * @param {Function} format    (key, data) => localized text.
 */
export function d20Band(facts, earlier, format)
{
   const row = d20Row(facts.dice, facts.advantageMode, facts.sides);
   const withClasses = (die) => ({ value: die.value, classes: dieClasses(die) });
   const all = [...row.left, row.center, ...row.right].filter(Boolean);
   const outcome = describeRoll(facts, format);
   return {
      total: facts.total,
      critical: facts.isCritical,
      verdict: outcome.verdict,
      words: outcome.details,
      row: { left: row.left.map(withClasses), center: row.center ? withClasses(row.center) : null,
         right: row.right.map(withClasses) },
      diceLabel: format('FHCS.Card.DiceLabel', {
         dice: all.map((d) => format(d.counts ? 'FHCS.Card.DieCounts' : 'FHCS.Card.DieDropped', { value: d.value }))
            .join(', ')
      }),
      mathLines: [{ formula: facts.formula, result: `${facts.math} = ${facts.total}` }],
      notes: [...(facts.spare ? [format('FHCS.Card.Spare', { value: facts.spare })] : []), ...earlierNote(earlier, format)],
      againLabel: format('FHCS.Card.RollAgain', {}),
      extra: []
   };
}

/**
 * What a rolled damage band shows: the total, the total by damage type, a critical in words, and (when opened) each
 * roll's dice math and a way to roll it again as a critical or not.
 *
 * @param {object} facts       From compat.damageFacts, for the latest roll.
 * @param {number[]} earlier   Totals of earlier damage rolls from the card, oldest first.
 * @param {Function} format    (key, data) => localized text.
 * @param {object} [options]
 * @param {boolean} [options.canCrit]  The card has an attack, so damage can be a critical.
 */
export function damageBand(facts, earlier, format, { canCrit = false } = {})
{
   const words = [];
   if (facts.critical) { words.push(format('FHCS.Card.CriticalDoubled', {})); }
   if (facts.onSave) { words.push(format('FHCS.Card.OnSave', { rule: facts.onSave })); }
   const extra = [];
   if (canCrit || facts.critical)
   {
      extra.push(facts.critical
         ? { action: 'damageNormal', label: format('FHCS.Card.RollNormal', {}) }
         : { action: 'damageCritical', label: format('FHCS.Card.RollCritical', {}) });
   }
   return {
      total: facts.total,
      critical: facts.critical,
      verdict: null,
      words,
      row: null,
      parts: facts.parts.map((p) => ({ text: p.label ? `${p.total} ${p.label}` : `${p.total}` })),
      mathLines: facts.math.map((m) => ({ formula: m.label ? `${m.formula} (${m.label})` : m.formula, result: m.result })),
      notes: earlierNote(earlier, format),
      againLabel: format('FHCS.Card.RollAgain', {}),
      extra
   };
}

/** Roll messages drawn inside each kind of band: their types, how to read them, how to draw them. */
const BAND_ROLLS = {
   attack: { types: ['attack'], facts: rollFacts, draw: d20Band },
   damage: { types: ['damage', 'healing'], facts: damageFacts, draw: damageBand }
};

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
         const format = (key, data) => game.i18n.format(key, data);
         const { bands, others } = cardParts(context.buttons ?? [], localize);
         const canCrit = bands.some((b) => b.kind === 'attack');
         for (const band of bands)
         {
            const source = BAND_ROLLS[band.kind];
            if (!source) { continue; }
            const rolls = rollsFrom(this.parent, source.types);
            const facts = rolls.length ? source.facts(rolls.at(-1)) : null;
            const earlier = rolls.slice(0, -1).map((m) => source.facts(m)?.total).filter((t) => t !== undefined);
            if (facts) { band.rolled = source.draw(facts, earlier, format, { canCrit }); }
            else if (rolls.length) { band.text = localize('FHCS.Card.HiddenRoll'); }
         }
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
            others,
            // A card's author uses its rolls; the GM uses every card (SCOPE §6.6).
            canAct: this.parent.isAuthor || game.user.isGM
         };
         return context;
      }

      /** @inheritDoc */
      _onRender(element, options = {})
      {
         super._onRender(element, options);
         if (options.summary || !useCard(this)) { return; }
         element.classList.add('fhcs-chat', 'fhcs-card-message');
         for (const button of element.querySelectorAll('[data-fhcs-action]'))
         {
            button.addEventListener('click', (event) => this.#onCardAction(event, button));
         }
      }

      /** Our own card buttons (dnd5e's have `data-action` and go through dnd5e). */
      async #onCardAction(event, button)
      {
         event.preventDefault();
         button.disabled = true;
         try
         {
            switch (button.dataset.fhcsAction)
            {
               case 'damageNormal': await rollDamageAgain(this.parent, event, false); break;
               case 'damageCritical': await rollDamageAgain(this.parent, event, true); break;
            }
         }
         finally { button.disabled = false; }
      }
   };
}
