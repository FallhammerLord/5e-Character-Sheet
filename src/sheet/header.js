/**
 * The sheet header's display values (SCOPE §4.1), from plain facts about the actor. Pure, so the unit check and the
 * layout fixtures use the same code the sheet does. `compat.headerFacts` gathers the facts from dnd5e.
 */
import { levelUpChoices, originCards } from './origins.js';

/** Pips on the milestone track: 4 rows of 5 (user, 2026-10-24). More appear if a character passes 20. */
export const TRACK_PIPS = 20;

/** The combat panel's width (AC, Init, Prof, Level; user, 2026-10-27). Matches `--fhcs-combat` in styles/fhcs.css. */
export const COMBAT_WIDTH = 125;

/**
 * The narrowest the sheet may be, so the stats row never wraps (user, 2026-10-24): padding, the 160px portrait
 * column, the combat panel, and the abilities panel (its edge and padding, each ability at its smallest column, 48px,
 * 3px between). Matches styles/fhcs.css.
 */
export function headerMinWidth(abilityCount)
{
   return 8 + 160 + 8 + COMBAT_WIDTH + 6 + (2 + 8 + abilityCount * 48 + (abilityCount - 1) * 3) + 8 + 2 * 8;
}

/** Common sheet widths, past the least one (user, 2026-10-28): 720 is where the inspiration stars show. */
export const WIDTH_STOPS = [720, 800, 900, 1024, 1280];

/**
 * Comfort stops while the sheet is dragged wider or narrower (user, 2026-10-28): a width within `pull` of a stop
 * holds at it, so the common widths are easy to land on: the least width and `WIDTH_STOPS`.
 * @param {number} width  The width asked for.
 * @param {number} least  The narrowest the sheet may be.
 */
export function comfortWidth(width, least, pull = 12)
{
   const near = [least, ...WIDTH_STOPS.filter((w) => w > least)].find((stop) => Math.abs(width - stop) <= pull);
   return Math.max(least, near ?? width);
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
 * No key of class names under it (user, 2026-10-28): the badges say it, and the class cards carry the levels.
 * @returns {{pips: object[], filled: number, total: number}}
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
   return { pips, filled: gained.length, total: Math.max(TRACK_PIPS, gained.length) };
}

/** @returns {number} A whole percentage, 0–100. */
/**
 * The portrait as drawn: a token whole at the top; other art filling the frame at its framing, which edit mode can
 * change (a token has nothing to frame).
 */
function framedPortrait(facts)
{
   const token = !!facts.portrait?.token;
   const frame = token ? { ...FRAME_DEFAULT } : portraitFrame(facts.frame, facts.portrait?.src);
   // Round or square, the player's choice (user, 2026-10-27); until chosen, a token is round and other art square.
   const shape = facts.shape === 'round' || facts.shape === 'square' ? facts.shape : token ? 'round' : 'square';
   // A token shows whole in either shape: it is often already a circle with its own ring, which cover would crop and
   // seem to zoom (user, 2026-10-28).
   return { ...facts.portrait, fit: token ? 'contain' : 'cover', canFrame: !token, frame, frameStyle: frameStyle(frame),
      shape, round: shape === 'round' };
}

const percent = (value, max) => (max > 0 ? Math.max(0, Math.min(100, Math.round(100 * value / max))) : 0);

/** Framing limits: the focus point in percent of the art, the zoom from whole (1) to three times. */
export const FRAME_ZOOM = { min: 1, max: 3, step: 0.1 };
export const FRAME_DEFAULT = { x: 50, y: 0, zoom: 1 };

/**
 * The portrait's framing (user, 2026-10-27: a large portrait's subject isn't always at the top), kept inside its
 * limits. A framing belongs to one image: saved with its path, it applies only while that image is the portrait.
 * @param {{src?: string, x?: number, y?: number, zoom?: number}|null} flag  As saved on the actor.
 * @param {string} src  The portrait shown now.
 * @returns {{x: number, y: number, zoom: number}}
 */
export function portraitFrame(flag, src)
{
   if (!flag || flag.src !== src) { return { ...FRAME_DEFAULT }; }
   const clamp = (v, lo, hi, fallback) => (Number.isFinite(Number(v)) ? Math.min(hi, Math.max(lo, Number(v))) : fallback);
   return {
      x: clamp(flag.x, 0, 100, FRAME_DEFAULT.x),
      y: clamp(flag.y, 0, 100, FRAME_DEFAULT.y),
      zoom: Math.round(clamp(flag.zoom, FRAME_ZOOM.min, FRAME_ZOOM.max, FRAME_DEFAULT.zoom) * 10) / 10
   };
}

/** @returns {string} A framing as the art's CSS variables. */
export const frameStyle = ({ x, y, zoom }) => `--fhcs-fx: ${x}%; --fhcs-fy: ${y}%; --fhcs-zoom: ${zoom}`;

/**
 * The HP tray's line under its buttons (user, 2026-10-27): what Damage would do with the amount typed, before the
 * click. Damage takes temp first, as dnd5e's `applyDamage` does (actor.mjs:785), and stops at 0.
 * @param {string|number} amount  As typed.
 * @param {{value: number, temp: number}} hp
 * @param {{format: Function, localize: Function}} i18n
 * @returns {string}
 */
export function hpPreview(amount, hp, { format, localize })
{
   const n = Math.max(0, Math.floor(Number(amount)));
   if (!n) { return localize('FHCS.Header.HpPreviewNone'); }
   const fromTemp = Math.min(Math.max(0, hp.temp || 0), n);
   const fromHp = Math.min(Math.max(0, hp.value), n - fromTemp);
   return format('FHCS.Header.HpPreview', { temp: fromTemp, hp: fromHp, left: hp.value - fromHp });
}

/**
 * Everything the header template shows.
 * @param {object} facts  From compat.headerFacts (or a fixture).
 * @param {{format: Function, localize: Function}} i18n
 */
export function headerView(facts, { format, localize })
{
   // The cards' grid: the combat panel's column, then one per ability, so the cards line up with the stats row.
   const columns = facts.abilities.length + 1;
   const i18n = { format, localize };
   const { hp, xp } = facts;
   const milestones = facts.leveling === 'noxp';
   const level = format('FHCS.Header.Level', { level: facts.level });
   return {
      name: facts.name,
      // Edit mode edits the name as stored, not as an effect or a token may show it.
      nameSource: facts.nameSource ?? facts.name,
      // The portrait card (SCOPE §4.1, user, 2026-10-27): art fills the frame; a token shows whole, at the top.
      portrait: framedPortrait(facts),
      abilityCount: facts.abilities.length,
      cards: facts.originCards ? originCards(facts.originCards, columns, i18n) : [],
      levelUp: facts.originCards ? levelUpChoices(facts.originCards, i18n) : null,
      levelUpLabel: format('FHCS.Header.LevelUpLabel', { level }),
      origin: facts.origin.filter(Boolean).join(' · '),
      // Walking speed bare, the others named ("30 ft · Fly 60 ft"); facts without the list keep their one speed.
      speed: facts.speeds?.length
         ? facts.speeds.map((s) => (s.key === 'walk' ? `${s.value} ${facts.speedUnits}` : `${s.label} ${s.value} ${facts.speedUnits}`)).join(' · ')
         : facts.speed,
      prof: signed(facts.prof),
      level,
      xp: !milestones && xp ? {
         value: xp.value, max: xp.max, pct: xp.pct ?? percent(xp.value, xp.max),
         text: format('FHCS.Header.XP', { value: xp.valueLabel ?? xp.value, max: xp.maxLabel ?? xp.max }),
         maxText: format('FHCS.Header.XPMax', { max: xp.maxLabel ?? xp.max })
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
         label: format('FHCS.Header.HPLabel', { value: hp.value, max: hp.max }),
         // The HP tray (play mode, for whoever may edit the character): Damage, Heal, Temp.
         changeLabel: format('FHCS.Header.HpChangeLabel', { value: hp.value, max: hp.max }),
         current: hp.value, tempValue: hp.temp || 0,
         preview: hpPreview('', hp, i18n)
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
      abilities: facts.abilities.map((a) => ({
         key: a.key,
         abbr: a.abbr,
         mod: signed(a.mod),
         save: signed(a.save),
         score: a.value,
         // The score as stored, for edit mode's field (effects may raise the score shown).
         source: a.source ?? a.value,
         scoreLabel: format('FHCS.Header.ScoreLabel', { ability: a.label }),
         configLabel: format('FHCS.Header.AbilityConfig', { ability: a.label }),
         proficient: a.proficient > 0,
         checkLabel: format('FHCS.Header.CheckLabel', { ability: a.label, mod: signed(a.mod) }),
         saveLabel: format(a.proficient > 0 ? 'FHCS.Header.SaveProficient' : 'FHCS.Header.SaveLabel',
            { ability: a.label, mod: signed(a.save) })
      })),
      text: {
         hp: localize('FHCS.Header.HP'), temp: localize('FHCS.Header.Temp'), maxMod: localize('FHCS.Header.MaxMod'),
         maxModLabel: localize('FHCS.Header.MaxModLabel'), exhaustionShow: localize('FHCS.Header.ExhaustionShow'),
         name: localize('FHCS.Header.Name'), xpLabel: localize('FHCS.Header.XPLabel'),
         speedConfig: localize('FHCS.Header.SpeedConfig'), acConfig: format('FHCS.Header.ACConfig', { ac: facts.ac ?? '—' }),
         initConfig: localize('FHCS.Header.InitConfig'), hdConfig: localize('FHCS.Header.HDConfig'),
         hpConfig: localize('FHCS.Header.HPConfig'), tokenSwitch: localize('FHCS.Header.TokenSwitch'),
         amount: localize('FHCS.Header.HpAmount'), damage: localize('FHCS.Header.HpDamage'), heal: localize('FHCS.Header.HpHeal'),
         shapeRound: localize('FHCS.Header.ShapeRound'), portraitOptions: localize('FHCS.Header.PortraitOptions'),
         frame: localize('FHCS.Header.Frame'), frameDone: localize('FHCS.Header.FrameDone'),
         frameReset: localize('FHCS.Header.FrameReset'), zoomIn: localize('FHCS.Header.ZoomIn'),
         zoomOut: localize('FHCS.Header.ZoomOut'), zoom: localize('FHCS.Header.Zoom'),
         giveTemp: localize('FHCS.Header.HpTemp'), damageLabel: localize('FHCS.Header.HpDamageLabel'),
         healLabel: localize('FHCS.Header.HpHealLabel'), tempLabel: localize('FHCS.Header.HpTempLabel'),
         ac: localize('FHCS.Header.AC'),
         init: localize('FHCS.Header.Init'), prof: localize('FHCS.Header.Prof'),
         profLabel: format('FHCS.Header.ProfLabel', { prof: signed(facts.prof) }),
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

/** The most stars the inspiration bar draws; a bigger bank shows as a count ("5 / 8"). */
export const INSPIRATION_STARS = 5;

/**
 * The inspiration bar at the tab row's right, before the lock (SCOPE §4.12, user 2026-10-28). Without a bank, one star:
 * dnd5e's on or off. With one, a star per use, filled ones banked: a click on a filled star spends it, on an empty
 * star banks it, in any order. A count ("compact") stands in when the bank is bigger than the stars drawn, and in a
 * narrow row (styles); its tray holds the stars. Edit mode adds a gear whose tray picks the item that banks it.
 * @param {{on: boolean, bank: object|null, linkable: object[]}} facts  From `compat.inspirationFacts`.
 * @param {{canEdit: boolean, editing: boolean}} mode
 */
export function inspirationBar(facts, { canEdit, editing }, { localize, format })
{
   const bank = facts.bank;
   const count = bank ? bank.value : facts.on ? 1 : 0;
   const label = localize('FHCS.Inspiration.Label');
   const view = { label, canEdit, editing, count, bank: !!bank, on: facts.on };
   if (bank)
   {
      const spend = localize('FHCS.Inspiration.Spend');
      const add = localize('FHCS.Inspiration.Bank');
      view.value = bank.value;
      view.max = bank.max;
      view.name = bank.link.name;
      view.countLabel = format('FHCS.Inspiration.Count', { value: bank.value, max: bank.max, name: bank.link.name });
      // A bank too big for the row shows only its count, whose tray holds every star.
      view.onlyCompact = bank.max > INSPIRATION_STARS;
      // Any place may be spent or banked, the one clicked (user, 2026-10-28). Without a click to follow, a gain or a
      // spend shows its moment on the leftmost filled place or the rightmost empty one.
      const filled = bank.filled ?? Array.from({ length: bank.max }, (_, i) => i >= bank.max - bank.value);
      const lastOn = filled.indexOf(true);
      const lastOff = filled.lastIndexOf(false);
      view.stars = filled.map((on, slot) => ({ slot, filled: on, last: slot === lastOn, cooled: slot === lastOff, label: on ? spend : add, can: canEdit }));
   }
   if (editing)
   {
      view.link = {
         label: localize('FHCS.Inspiration.Link'),
         title: localize('FHCS.Inspiration.LinkTitle'),
         options: [
            { id: '', name: localize('FHCS.Inspiration.Own'), on: !bank },
            ...facts.linkable.map((item) => ({ ...item, on: bank?.link.id === item.id }))
         ]
      };
   }
   return view;
}

/**
 * The theme picker on the title bar (SCOPE §4.11): the world default (named), then each theme; the one worn pressed.
 * @param {{chosen: string, world: string, keys: string[]}} theme  The character's own ('' for none), the world's.
 */
export function themePicker(theme, { localize, format })
{
   return {
      label: localize('FHCS.Theme.Label'),
      title: localize('FHCS.Theme.Title'),
      options: [
         { value: '', name: format('FHCS.Theme.WorldDefault', { name: localize(`FHCS.Theme.${theme.world}`) }), on: !theme.chosen },
         ...theme.keys.map((key) => ({ value: key, name: localize(`FHCS.Theme.${key}`), on: theme.chosen === key }))
      ]
   };
}
