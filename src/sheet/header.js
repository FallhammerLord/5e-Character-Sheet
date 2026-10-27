/**
 * The sheet header's display values (SCOPE §4.1), from plain facts about the actor. Pure, so the unit check and the
 * layout fixtures use the same code the sheet does. `compat.headerFacts` gathers the facts from dnd5e.
 */
import { levelUpChoices, originCards } from './origins.js';

/** Pips on the milestone track: 4 rows of 5 (user, 2026-10-24). More appear if a character passes 20. */
export const TRACK_PIPS = 20;

/**
 * The narrowest the sheet may be, so the ability row never wraps (user, 2026-10-24): padding, the 160px portrait
 * column, and AC, Init and each ability at the smallest column (52px) with 4px between. Matches styles/fhcs.css.
 */
export function headerMinWidth(abilityCount)
{
   const columns = 2 + abilityCount;
   return 8 + 160 + 8 + columns * 52 + (columns - 1) * 4 + 8 + 2 * 8;
}

/** @returns {string} A modifier with its sign: +3, +0, −1 (a true minus sign). */
export function signed(n)
{
   const value = Number(n) || 0;
   return value < 0 ? `−${Math.abs(value)}` : `+${value}`;
}

/**
 * The order the character's class levels were gained in, one class identifier per level. Keeps the recorded order
 * where it still matches the class levels; levels it doesn't cover follow, class by class, original class first.
 * @param {string[]} order      Recorded identifiers, oldest first (may be empty or out of date).
 * @param {{id: string, levels: number}[]} classes
 * @param {string} [originalId] The original class's identifier.
 * @returns {string[]}
 */
export function levelOrder(order, classes, originalId)
{
   const levels = Object.fromEntries(classes.map((c) => [c.id, c.levels]));
   const placed = {};
   const result = [];
   for (const id of order ?? [])
   {
      if ((placed[id] ?? 0) < (levels[id] ?? 0))
      {
         result.push(id);
         placed[id] = (placed[id] ?? 0) + 1;
      }
   }
   const rest = [...classes].sort((a, b) => (b.id === originalId) - (a.id === originalId) || b.levels - a.levels);
   for (const c of rest)
   {
      for (let n = placed[c.id] ?? 0; n < c.levels; n++) { result.push(c.id); }
   }
   return result;
}

/**
 * The milestone track: one pip per level up to 20, each gained level showing its class's image in gain order.
 * @returns {{pips: object[], key: object[], filled: number, total: number}}
 */
export function levelTrack(classes, order, originalId, format)
{
   const byId = Object.fromEntries(classes.map((c) => [c.id, c]));
   const gained = levelOrder(order, classes, originalId);
   const count = {};
   const pips = gained.map((id, i) =>
   {
      count[id] = (count[id] ?? 0) + 1;
      const c = byId[id];
      return { filled: true, img: c.img, label: format('FHCS.Header.LevelPip', { n: i + 1, name: c.name, level: count[id] }) };
   });
   for (let n = pips.length + 1; n <= TRACK_PIPS; n++)
   {
      pips.push({ filled: false, img: '', label: format('FHCS.Header.LevelEmpty', { n }) });
   }
   const key = classes.map((c) => ({ img: c.img, text: `${c.name} ${c.levels}` }));
   return { pips, key, filled: gained.length, total: Math.max(TRACK_PIPS, gained.length) };
}

/** @returns {number} A whole percentage, 0–100. */
const percent = (value, max) => (max > 0 ? Math.max(0, Math.min(100, Math.round(100 * value / max))) : 0);

/**
 * Everything the header template shows.
 * @param {object} facts  From compat.headerFacts (or a fixture).
 * @param {{format: Function, localize: Function}} i18n
 */
export function headerView(facts, { format, localize })
{
   // The ability grid: AC, Init, then each ability; the class, species and background cards share its columns.
   const columns = facts.abilities.length + 2;
   const i18n = { format, localize };
   const { hp, xp } = facts;
   const milestones = facts.leveling === 'noxp';
   const level = format('FHCS.Header.Level', { level: facts.level });
   return {
      name: facts.name,
      // The portrait card (SCOPE §4.1, user, 2026-10-27): art fills the frame; a token shows whole, at the top.
      portrait: { ...facts.portrait, fit: facts.portrait?.token ? 'contain' : 'cover' },
      columns,
      cards: facts.originCards ? originCards(facts.originCards, columns, i18n) : [],
      levelUp: facts.originCards ? levelUpChoices(facts.originCards, i18n) : null,
      levelUpLabel: format('FHCS.Header.LevelUpLabel', { level }),
      origin: facts.origin.filter(Boolean).join(' · '),
      speed: facts.speed,
      prof: signed(facts.prof),
      level,
      xp: !milestones && xp ? {
         value: xp.value, max: xp.max, pct: xp.pct ?? percent(xp.value, xp.max),
         text: format('FHCS.Header.XP', { value: xp.valueLabel ?? xp.value, max: xp.maxLabel ?? xp.max })
      } : null,
      milestones: milestones ? {
         ...levelTrack(facts.classes, facts.levelOrder, facts.originalClass, format),
         label: format('FHCS.Header.ShowMilestones', { level })
      } : null,
      hp: {
         value: hp.value, max: hp.max, temp: hp.temp || '', pct: percent(hp.value, hp.max),
         // Max ± is dnd5e's temporary change to max HP (`tempmax`: Aid, drains), not the max override (user, 2026-10-27).
         // A plain number: dnd5e reads a typed leading + or − as add or subtract (`_onChangeInputDelta`).
         maxMod: hp.tempmax ? String(hp.tempmax) : '',
         text: `${hp.value} / ${hp.max}`,
         label: format('FHCS.Header.HPLabel', { value: hp.value, max: hp.max })
      },
      ac: facts.ac ?? '—',
      init: signed(facts.init),
      inspiration: !!facts.inspiration,
      // Death saves only at 0 HP (user, 2026-10-24): three successes, the roll, three failures.
      death: hp.value <= 0 && facts.death ? {
         rollLabel: localize('FHCS.Header.DeathRoll'),
         success: [1, 2, 3].map((n) => ({ n, filled: facts.death.success >= n, label: format('FHCS.Header.DeathSuccess', { n }) })),
         failure: [1, 2, 3].map((n) => ({ n, filled: facts.death.failure >= n, label: format('FHCS.Header.DeathFailure', { n }) }))
      } : null,
      exhaustion: {
         value: facts.exhaustion.value,
         // At 0 the chip hides behind a small dot; resting on the dot shows it (user, 2026-10-27).
         none: !facts.exhaustion.value,
         label: format('FHCS.Header.Exhaustion', { n: facts.exhaustion.value }),
         pips: Array.from({ length: facts.exhaustion.max }, (_, i) => ({
            n: i + 1, filled: facts.exhaustion.value > i, label: format('FHCS.Header.ExhaustionLevel', { n: i + 1 })
         }))
      },
      hd: {
         text: format('FHCS.Header.HD', { n: facts.hd.value }),
         label: format('FHCS.Header.HDLabel', { value: facts.hd.value, max: facts.hd.max })
      },
      // One chip per rest, one click each into dnd5e's rest dialog (user, 2026-10-27, replacing one chip with a tray).
      rests: facts.showRests ? facts.restTypes.map((r) => ({ ...r, short: r.key === 'short' })) : [],
      scoreFirst: facts.emphasis === 'score',
      abilities: facts.abilities.map((a) => ({
         key: a.key,
         abbr: a.abbr,
         mod: signed(a.mod),
         save: signed(a.save),
         score: a.value,
         proficient: a.proficient > 0,
         checkLabel: format('FHCS.Header.CheckLabel', { ability: a.label, mod: signed(a.mod) }),
         saveLabel: format(a.proficient > 0 ? 'FHCS.Header.SaveProficient' : 'FHCS.Header.SaveLabel',
            { ability: a.label, mod: signed(a.save) })
      })),
      text: {
         hp: localize('FHCS.Header.HP'), temp: localize('FHCS.Header.Temp'), maxMod: localize('FHCS.Header.MaxMod'),
         maxModLabel: localize('FHCS.Header.MaxModLabel'), exhaustionShow: localize('FHCS.Header.ExhaustionShow'),
         ac: localize('FHCS.Header.AC'),
         init: localize('FHCS.Header.Init'), proficiency: localize('FHCS.Header.Proficiency'),
         save: localize('FHCS.Header.Save'), inspiration: localize('FHCS.Header.Inspiration'),
         rest: localize('FHCS.Header.Rest'), milestones: localize('FHCS.Header.Milestones'),
         initLabel: format('FHCS.Header.InitLabel', { mod: signed(facts.init) })
      }
   };
}

/** Tabs shown only in edit mode. */
export const EDIT_ONLY_TABS = ['specialTraits'];

/** Classic's tab order; tabs dnd5e adds that aren't listed follow in dnd5e's order. */
export const TAB_ORDER = ['details', 'inventory', 'spells', 'features', 'effects', 'biography', 'bastion', 'specialTraits'];

/**
 * The tab row (SCOPE §4.2): dnd5e's tabs in Classic's order, with our names where Classic's differ.
 * @param {object} tabs   dnd5e's `context.tabs`, by tab ID.
 * @param {{canEdit: boolean, editing: boolean}} mode
 */
export function tabRow(tabs, { canEdit, editing }, localize)
{
   const names = { details: 'FHCS.Tabs.Attributes', spells: 'FHCS.Tabs.Spellbook' };
   const rank = (id) => { const i = TAB_ORDER.indexOf(id); return i < 0 ? TAB_ORDER.length : i; };
   return {
      label: localize('FHCS.Tabs.Label'),
      // Special Traits is settings, not play: like the gear icons, it shows only in edit mode (SCOPE §4.5).
      tabs: Object.values(tabs).filter((t) => editing || !EDIT_ONLY_TABS.includes(t.id) || t.active)
         .sort((a, b) => rank(a.id) - rank(b.id)).map((t) => ({ id: t.id, active: !!t.active, label: localize(names[t.id] ?? t.label) })),
      canEdit,
      editing,
      lockLabel: localize(editing ? 'FHCS.Tabs.Lock' : 'FHCS.Tabs.Unlock')
   };
}
