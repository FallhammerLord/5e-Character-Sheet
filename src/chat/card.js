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
import { actorArtwork, addBonus, addD20, answersButton, appliedFacts, canApplyDamage, damageFacts, hideTooltip, openTrays,
   preferSelected, rollCardDamage, rollFacts, rollsFrom, showTooltip } from '../compat.js';
import { describeRoll } from './outcome.js';
import { d20Row, dieClasses, MAX_PER_SIDE } from './d20.js';

/**
 * A card wears the world's theme, not the speaker's (SCOPE §5.3 rule 10), unless the world keeps cards plain
 * (`fhcs.chatTheme`). On the message element, beside `fhcs-chat`.
 */
export function themeCard(element)
{
   const theme = game.settings.get(MODULE_ID, 'chatTheme') ? game.settings.get(MODULE_ID, 'theme') : 'plain';
   if (theme && theme !== 'plain') { element.dataset.fhcsTheme = theme; }
   else { delete element.dataset.fhcsTheme; }
}

/** Every card in the page takes the world's theme again, when the theme or the chat setting changes. */
export function rethemeCards()
{
   for (const element of document.querySelectorAll('.fhcs-chat.fhcs-card-message')) { themeCard(element); }
}

export const CARD_TEMPLATE = `modules/${MODULE_ID}/templates/chat/usage-card.hbs`;

/** Parts the card templates include by path; preloaded at init. */
export const CARD_PARTS = ['header', 'rolled-band', 'd20-row', 'd20-tray', 'die', 'bonus']
   .map((name) => `modules/${MODULE_ID}/templates/chat/parts/${name}.hbs`);
// (roll-card.hbs and request-card.hbs include the same parts.)

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
         isSave: kind === 'save',
         // Which saves or checks answer this button: one button per ability, skill or tool.
         match: button.dataset?.skill ?? button.dataset?.tool ?? button.dataset?.ability ?? null,
         action: button.action,
         index: button.index,
         heading: localize(`FHCS.Card.Band.${button.action}`),
         // A save or check carries its own words ("DC 15 Dexterity Saving Throw"); the rest say what clicking does.
         text: (kind === 'save') || (kind === 'roll') ? label : rollText
      });
   }
   return { bands, others };
}

/** A band's history: each earlier roll from the same band with its own dice shown, newest first. */
const earlierNote = (earlier, format) => [...earlier].reverse().map((math) => format('FHCS.Card.Earlier', { math }));

/** One earlier roll's dice math, as a line: a d20 roll's sum, or each damage roll's. */
const earlierMath = (facts) => (Array.isArray(facts.math) ? facts.math.map((m) => m.result).join(' · ') : `${facts.math} = ${facts.total}`);

/** Notes for bonuses added late, each as its own term. */
const bonusNotes = (bonuses, format) => bonuses.map((b) => format('FHCS.Card.Added', { formula: b.formula, total: b.total }));

/** The late "+ Bonus" field, for whoever may change the roll. */
const bonusField = (facts, format) => (facts.canEdit
   ? { label: format('FHCS.Card.AddBonus', {}), placeholder: format('FHCS.Card.BonusPlaceholder', {}),
      aria: format('FHCS.Card.BonusAria', {}) }
   : null);

/**
 * The d20 row's two side cells and the tray under it (SCOPE §6.6, user 2026-10-24). Each side's newest die sits in the
 * cell beside the primary and is that side's add button (a + or − badge on it); before any die is added the cell is a
 * dashed d20 marked + or −. Older dice move to the tray. A side holding five dice shows its newest die, no longer a
 * button. So the button never moves and the latest result sits next to the primary.
 *
 * @param {object} facts    From compat.rollFacts (canEdit).
 * @param {object} row      From d20Row: left (newest first), center, right (oldest first).
 * @param {Function} format
 * @param {Function} withClasses   die => { value, classes }
 */
export function d20Cells(facts, row, format, withClasses)
{
   const cell = (side, dice) =>
   {
      const newest = dice.length ? withClasses(dice[0]) : null;
      const canAdd = facts.canEdit && (dice.length < MAX_PER_SIDE);
      return {
         die: newest,
         slot: canAdd ? {
            action: side === 'dis' ? 'lateDisadvantage' : 'lateAdvantage',
            side,
            sign: side === 'dis' ? '−' : '+',
            aria: format(side === 'dis' ? 'FHCS.Card.AddDisadvantage' : 'FHCS.Card.AddAdvantage', {})
         } : null
      };
   };
   const right = [...row.right].reverse();
   return {
      left: cell('dis', row.left),
      right: cell('adv', right),
      // Older dice, oldest nearest the primary on each side.
      trayLeft: row.left.slice(1).map(withClasses),
      trayRight: right.slice(1).reverse().map(withClasses)
   };
}

/**
 * What a rolled d20 band shows: the total, the d20 row, the outcome in words, and (when opened) the dice math.
 *
 * @param {object} facts       From compat.rollFacts, for the latest roll.
 * @param {string[]} earlier   Earlier rolls from the same band, oldest first, as dice math.
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
      row: { center: row.center ? withClasses(row.center) : null, ...d20Cells(facts, row, format, withClasses) },
      diceLabel: format('FHCS.Card.DiceLabel', {
         dice: all.map((d) => format(d.counts ? 'FHCS.Card.DieCounts' : 'FHCS.Card.DieDropped', { value: d.value }))
            .join(', ')
      }),
      rollId: facts.messageId,
      bonus: bonusField(facts, format),
      mathLines: [{ formula: facts.formula, result: `${facts.math} = ${facts.total}` }],
      notes: bonusNotes(facts.bonuses ?? [], format),
      history: earlierNote(earlier, format),
      historyLabel: format('FHCS.Card.History', {}),
      againLabel: format('FHCS.Card.RollAgain', {}),
      extra: []
   };
}

/**
 * What a rolled damage band shows: the total, the total by damage type, a critical in words, and (when opened) each
 * roll's dice math and a way to roll it again as a critical or not.
 *
 * @param {object} facts       From compat.damageFacts, for the latest roll.
 * @param {string[]} earlier   Earlier damage rolls from the card, oldest first, as dice math.
 * @param {Function} format    (key, data) => localized text.
 * @param {object} [options]
 * @param {boolean} [options.canCrit]  The card has an attack, so damage can be a critical.
 */
export function damageBand(facts, earlier, format, { canCrit = false } = {})
{
   const words = [];
   if (facts.critical) { words.push(format('FHCS.Card.CriticalDoubled', {})); }
   if (facts.onSave) { words.push(format('FHCS.Card.OnSave', { rule: facts.onSave })); }
   // One switch with a fixed label, checked while this damage is a critical; clicking re-rolls it the other way.
   const extra = (canCrit || facts.critical)
      ? [{
         action: facts.critical ? 'damageNormal' : 'damageCritical',
         label: format('FHCS.Card.Critical', {}),
         pressed: facts.critical,
         title: format(facts.critical ? 'FHCS.Card.RollNormal' : 'FHCS.Card.RollCritical', {})
      }]
      : [];

   return {
      total: facts.total,
      critical: facts.critical,
      verdict: null,
      words,
      row: null,
      // One damage type: its name under the total; several: each type's own total.
      parts: facts.parts.length === 1
         ? (facts.parts[0].label ? [{ text: facts.parts[0].label }] : [])
         : facts.parts.map((p) => ({ text: p.label ? `${p.total} ${p.label}` : `${p.total}` })),
      rollId: facts.messageId,
      bonus: bonusField(facts, format),
      mathLines: facts.math.map((m) => ({ formula: m.label ? `${m.formula} (${m.label})` : m.formula, result: m.result })),
      notes: [
         ...facts.math.filter((m) => m.dropped?.length)
            .map((m) => format('FHCS.Card.Dropped', { dice: m.dropped.join(', ') })),
         ...bonusNotes(facts.bonuses ?? [], format)
      ],
      history: earlierNote(earlier, format),
      historyLabel: format('FHCS.Card.History', {}),
      againLabel: format('FHCS.Card.RollAgain', {}),
      // Roll again keeps this damage's critical state; dnd5e's own Damage action would re-read the attack.
      againAction: 'damageAgain',
      extra
   };
}

/**
 * The card's record of what its Apply did (user, 2026-10-28), one line per target and click, kept whatever is
 * selected or targeted next: "Dire Wolf takes 9 slashing", "Bless on Kira".
 *
 * @param {object[]} entries  From compat.appliedFacts.
 * @param {Function} format   (key, data) => localized text.
 */
export function appliedLines(entries, format)
{
   return entries.map((e) =>
   {
      if (e.kind === 'effect') { return format('FHCS.Card.EffectOn', { name: e.name, who: e.who }); }
      const parts = (e.parts ?? []).filter((p) => p.value);
      const type = (p) => p.label.toLocaleLowerCase();
      if (e.amount < 0) { return format('FHCS.Card.Heals', { who: e.who, amount: -e.amount }); }
      if (e.amount === 0) { return format(e.temp ? 'FHCS.Card.GainsTemp' : 'FHCS.Card.TakesNone', { who: e.who, amount: e.temp }); }
      if (parts.length === 1) { return format('FHCS.Card.TakesType', { who: e.who, amount: e.amount, type: type(parts[0]) }); }
      return format('FHCS.Card.TakesTypes', { who: e.who, amount: e.amount, types: parts.map((p) => `${p.value} ${type(p)}`).join(', ') });
   }).map((text) => ({ text }));
}

/**
 * One token's row in a save or check band: who, the total, success or failure, and (when opened) its d20s and math.
 *
 * @param {object} facts     From compat.rollFacts, for one save or check message.
 * @param {Function} format  (key, data) => localized text.
 */
export function saveRow(facts, format)
{
   const band = d20Band(facts, [], format);
   const verdict = band.verdict;
   return {
      id: facts.messageId,
      who: facts.who,
      total: facts.total,
      verdict,
      verdictWord: verdict ? format(verdict === 'success' ? 'FHCS.Chat.Success' : 'FHCS.Chat.Failure', {}) : '',
      words: verdict ? band.words.slice(1) : band.words,
      row: band.row,
      diceLabel: band.diceLabel,
      rollId: band.rollId,
      bonus: band.bonus,
      notes: band.notes,
      mathLines: band.mathLines,
      canResist: facts.canResist,
      resistLabel: format('FHCS.Card.Resist', {})
   };
}

/** Roll messages drawn inside each kind of band: their types, how to read them, how to draw them. */
const BAND_ROLLS = {
   attack: { types: ['attack'], facts: rollFacts, draw: d20Band },
   damage: { types: ['damage', 'healing'], facts: damageFacts, draw: damageBand }
};

/**
 * Which panels a player has open, by message and panel (`data-fold-key`). A roll changed by a button re-renders the
 * whole card; without this every panel would fold shut again (user, 2026-10-24). Kept for the page's life.
 */
const folds = new Map();

/** Elements whose listeners are bound, so a render that keeps them doesn't bind them twice. */
const bound = new WeakSet();

/**
 * Restores open panels after a render and records each toggle.
 *
 * @param {HTMLElement} element   The rendered message, carrying its `data-message-id`, or a sheet.
 * @param {string} [scope]   What the panels belong to; a message by default.
 */
export function keepFolds(element, scope = element.dataset.messageId)
{
   const messageId = scope;
   if (!messageId) { return; }
   for (const panel of element.querySelectorAll('details[data-fold-key]'))
   {
      // A sheet re-renders one part at a time; panels left in place are bound already.
      if (bound.has(panel)) { continue; }
      bound.add(panel);
      const key = `${messageId}|${panel.dataset.foldKey}`;
      if (folds.has(key)) { panel.open = folds.get(key); }
      panel.addEventListener('toggle', () => folds.set(key, panel.open));
   }
}

/** How long the pointer must rest on one of our buttons before its tooltip shows (user, 2026-10-24). */
const TIP_DELAY_MS = 1500;

/**
 * Our buttons' tooltips (`data-fhcs-tip`): shown only after the pointer rests for TIP_DELAY_MS, above the button, and
 * cleared at once by a click. Foundry's own tooltips appear on hover and covered the dice a click had just added.
 *
 * @param {HTMLElement} element   The rendered message or sheet.
 */
export function delayTips(element)
{
   for (const target of element.querySelectorAll('[data-fhcs-tip]'))
   {
      if (bound.has(target)) { continue; }
      bound.add(target);
      let timer = null;
      const cancel = () => { clearTimeout(timer); timer = null; };
      target.addEventListener('pointerenter', () =>
      {
         cancel();
         // A card redrawn meanwhile has replaced this button; show nothing then. A tip marked `data-fhcs-tip-cut` (a
         // long name, user 2026-10-28) shows only while its text is cut short.
         const cut = () => !target.hasAttribute('data-fhcs-tip-cut') || target.scrollWidth > target.clientWidth;
         timer = setTimeout(() => { if (target.isConnected && cut()) { showTooltip(target, target.dataset.fhcsTip); } }, TIP_DELAY_MS);
      });
      target.addEventListener('pointerleave', () => { cancel(); hideTooltip(); });
      target.addEventListener('pointerdown', () => { cancel(); hideTooltip(); });
   }
}

/**
 * Binds our own card buttons (dnd5e's carry `data-action` and go through dnd5e): late adds on any card, damage
 * re-rolls on a usage card, and Enter in a bonus field; and keeps open panels open across re-renders.
 *
 * @param {HTMLElement} element   The rendered message.
 * @param {ChatMessage|null} usage   The usage card, when the element is one.
 */
export function bindCardActions(element, usage)
{
   keepFolds(element);
   delayTips(element);
   for (const button of element.querySelectorAll('[data-fhcs-action]'))
   {
      button.addEventListener('click', (event) => onCardAction(event, button, usage));
   }
   for (const input of element.querySelectorAll('.fhcs-bonus-input'))
   {
      input.addEventListener('keydown', (event) =>
      {
         if (event.key !== 'Enter') { return; }
         event.preventDefault();
         input.closest('.fhcs-bonus')?.querySelector('[data-fhcs-action="addBonus"]')?.click();
      });
   }
}

/** One of our card buttons, clicked. */
async function onCardAction(event, button, usage)
{
   // Buttons can sit inside a band's <summary>; a click there must not also fold the band.
   event.preventDefault();
   event.stopPropagation();
   const roll = game.messages.get(button.dataset.rollId);
   button.disabled = true;
   try
   {
      switch (button.dataset.fhcsAction)
      {
         case 'damageAgain':
            if (usage) { await rollCardDamage(usage, { event, isCritical: button.dataset.critical === 'true' }); }
            break;
         case 'damageNormal': if (usage) { await rollCardDamage(usage, { event, isCritical: false }); } break;
         case 'damageCritical': if (usage) { await rollCardDamage(usage, { event, isCritical: true }); } break;
         case 'lateAdvantage': if (roll) { await addD20(roll, 'adv'); } break;
         case 'lateDisadvantage': if (roll) { await addD20(roll, 'dis'); } break;
         case 'addBonus':
         {
            const input = button.closest('.fhcs-bonus')?.querySelector('input');
            if (roll && input?.value.trim() && !(await addBonus(roll, input.value)))
            {
               ui.notifications?.warn(game.i18n.format('FHCS.Card.BonusInvalid', { formula: input.value }));
            }
            break;
         }
      }
   }
   finally { button.disabled = false; }
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
         const format = (key, data) => game.i18n.format(key, data);
         const { bands, others } = cardParts(context.buttons ?? [], localize);
         const canCrit = bands.some((b) => b.kind === 'attack');
         for (const band of bands.filter((b) => b.isSave))
         {
            band.prompt = localize('FHCS.Card.RollForSelected');
            band.rows = rollsFrom(this.parent, ['save', 'check']).filter((m) => answersButton(m, band.match))
               .map((m) => rollFacts(m)).filter(Boolean).map((facts) => saveRow(facts, format));
         }
         // Saves and checks are drawn as rows in their bands; dnd5e's own summaries of them would repeat them.
         context.summaries = (context.summaries ?? []).filter((s) => !['save', 'check'].includes(game.messages.get(s.id)?.type));
         for (const band of bands)
         {
            const source = BAND_ROLLS[band.kind];
            if (!source) { continue; }
            const rolls = rollsFrom(this.parent, source.types);
            const facts = rolls.length ? source.facts(rolls.at(-1)) : null;
            const earlier = rolls.slice(0, -1).map((m) => source.facts(m)).filter(Boolean).map(earlierMath);
            if (facts) { band.rolled = source.draw(facts, earlier, format, { canCrit }); }
            else if (rolls.length) { band.text = localize('FHCS.Card.HiddenRoll'); }
            if (facts && (band.kind === 'damage')) { band.damageId = facts.messageId; }
         }
         // Apply: dnd5e's damage tray for the latest damage roll, and its effects tray (SCOPE §6.5).
         const damageId = canApplyDamage() ? bands.find((b) => b.damageId)?.damageId : null;
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
            canAct: this.parent.isAuthor || game.user.isGM,
            apply: (damageId || context.effects?.length)
               ? { damageId, heading: localize('FHCS.Card.Apply'), note: localize('FHCS.Card.ApplyNote') }
               : null,
            applied: appliedLines(appliedFacts(this.parent), format),
            appliedHeading: localize('FHCS.Card.Applied')
         };
         return context;
      }

      /** @inheritDoc */
      _onRender(element, options = {})
      {
         super._onRender(element, options);
         if (options.summary || !useCard(this)) { return; }
         element.classList.add('fhcs-chat', 'fhcs-card-message');
         themeCard(element);
         preferSelected(this.parent);
         openTrays(element);
         bindCardActions(element, this.parent);
      }
   };
}
