/**
 * Layout cases: each renders one of our templates with sample data. The layout check draws every case at every
 * width of its frame and fails on overflow. Each phase adds its parts here (Phase 1: the header).
 *
 * A case: { name, template: 'path/without-hbs', context: {...}, frame?: 'sheet' | 'chat', theme?: 'light' }
 */
import { cardParts, d20Band, damageBand, saveRow } from '../src/chat/card.js';
import { headerView, tabRow } from '../src/sheet/header.js';
import { format, localize } from './templates.mjs';

/** A usage card's context as FHCSUsageMessageData#_prepareContext builds it, with overrides. */
const card = (over = {}, buttons = []) => ({
   fhcs: {
      portrait: '', actorName: 'Kira', title: 'Longsword', itemUuid: 'Actor.x.Item.y', subtitle: 'Attack · Melee',
      flavor: '', description: '<p>A versatile blade.</p>', supplements: [], tags: ['Versatile', 'Proficient'],
      hasDetails: true, canAct: true, ...cardParts(buttons, localize), ...over
   }
});

const ATTACK = [
   { action: 'rollAttack', index: 0, label: 'DND5E.Attack' },
   { action: 'rollDamage', index: 1, label: 'DND5E.Damage' }
];
const FIREBALL = [
   { action: 'rollSave', index: 0, label: 'DC 15 Dexterity Saving Throw' },
   { action: 'rollDamage', index: 1, label: 'DND5E.Damage' },
   { action: 'placeTemplate', index: 2, label: 'Place Template' },
   { action: 'consumeResource', index: 3, label: 'Consume Resource' },
   { action: 'refundResource', index: 4, label: 'Refund Resource' }
];

/** Facts for an attack roll, as compat.rollFacts returns them, with overrides. */
const attack = (over = {}) => ({
   kind: 'attack', who: 'Kira', what: 'Longsword', total: 28, natural: 20, target: null, showResult: true,
   success: null, isCritical: true, targets: [{ name: 'Goblin Boss', isMiss: false }],
   dice: [{ result: 20, active: true }], advantageMode: 0, sides: [], spare: 7,
   formula: '1d20 + 5 + 3', math: '20 + 5 + 3', messageId: 'a1', canEdit: true, bonuses: [], ...over
});

/** Facts for a damage roll, as compat.damageFacts returns them, with overrides. */
const damage = (over = {}) => ({
   healing: false, critical: true, total: 16, parts: [{ type: 'slashing', label: 'Slashing', total: 16 }],
   math: [{ formula: '2d8 + 5', result: '(6 + 5) + 5 = 16', label: 'Slashing', dropped: [1] }], onSave: '', messageId: 'd1', canEdit: true,
   bonuses: [{ formula: '1d4', total: 3 }], ...over
});

/** The attack card with its attack band (and optionally its damage band) rolled and open. */
const rolledAttack = (facts, earlier = [], damageFacts = null) =>
{
   const context = card({}, ATTACK);
   context.fhcs.bands[0].rolled = { ...d20Band(facts, earlier, format), open: true };
   if (damageFacts) { context.fhcs.bands[1].rolled = { ...damageBand(damageFacts, ['(6 + 7) + 0 = 13', '(7 + 3) + 0 = 10', '(3 + 6) + 0 = 9', '(8 + 8) + 0 = 16', '(7 + 7) + 0 = 14',
      '(2 + 3) + 0 = 5', '(1 + 8) + 0 = 9'], format, { canCrit: true }), open: true }; }
   return context;
};

/** Facts for one token's save, as compat.rollFacts returns them. */
const save = (who, total, natural, success, over = {}) => ({
   kind: 'save', who, what: 'Dexterity Saving Throw', total, natural, target: 15, showResult: true, success,
   isCritical: false, targets: [], dice: [{ result: natural, active: true }], advantageMode: 0, sides: [], spare: 11,
   formula: '1d20 + 2', math: `${natural} + 2`, canResist: false, messageId: who, canEdit: true, bonuses: [], ...over
});

/** Fireball with three saves in, one of them a monster that can still use Legendary Resistance. */
const fireball = () =>
{
   const context = card({ title: 'Fireball', subtitle: '3rd-level evocation' }, FIREBALL);
   const band = context.fhcs.bands[0];
   band.prompt = localize('FHCS.Card.RollForSelected');
   band.rows = [
      saveRow(save('Goblin', 9, 7, false), format),
      saveRow(save('Bugbear', 17, 15, true), format),
      { ...saveRow(save('Adult Red Dragon of the Smoking Peaks', 4, 1, false, { canResist: true, sides: ['dis'], spare: null,
         dice: [{ result: 3, active: false, discarded: true }, { result: 1, active: true }] }), format), open: true }
   ];
   context.fhcs.bands[1].rolled = damageBand({ healing: false, critical: false, total: 28, parts: [{ type: 'fire', label: 'Fire', total: 28 }],
      math: [{ formula: '8d6', result: '(6 + 5 + 4 + 3 + 2 + 4 + 1 + 3) = 28', label: 'Fire' }], onSave: 'Half Damage' }, [], format);
   context.fhcs.apply = { damageId: 'd1', heading: localize('FHCS.Card.Apply'), note: localize('FHCS.Card.ApplyNote') };
   return context;
};

/** A standalone roll card (a check or save from the sheet) around one rolled d20 band. */
const standaloneCard = (title, heading, facts, extra = {}) => ({
   fhcs: {
      portrait: '', actorName: 'Kira', title, itemUuid: '', subtitle: '', canAct: false, supplements: [], others: [],
      bands: [{ kind: 'd20', heading, action: null, rolled: d20Band(facts, [], format) }], ...extra
   }
});

/** A GM's request: one result in, one player who may roll, one still waiting. */
const request = () => ({
   content: '<p>Everyone make a DC 14 Wisdom saving throw.</p>',
   fhcs: {
      portrait: '', actorName: 'Game Master', title: 'Roll Wisdom Saving Throw', itemUuid: '', subtitle: '', heading: 'Party',
      rows: [
         { uuid: 'Actor.k', who: 'Kira', done: true, result: saveRow(save('Kira', 19, 15, true, { what: 'Wisdom Saving Throw', target: 14 }), format) },
         { uuid: 'Actor.t', who: 'Thorn', done: false, canRoll: true, rollLabel: 'Roll', waitText: 'waiting' },
         { uuid: 'Actor.w', who: 'Wren of the Whispering Marsh', done: false, canRoll: false, waitText: 'waiting' }
      ]
   }
});

/** Sample art as data URIs: round token art, and a tall portrait. */
const art = (w, h, shape) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${shape}</svg>`)}`;
const ROUND = art(300, 300, '<circle cx="150" cy="150" r="146" fill="#8f7d55"/><circle cx="150" cy="115" r="48" fill="#d9ccae"/>');
const TALL = art(300, 450, '<rect width="300" height="450" fill="#8f7d55"/><circle cx="150" cy="150" r="56" fill="#d9ccae"/>');
const CLASS_ICON = (fill) => art(64, 64, `<circle cx="32" cy="32" r="32" fill="${fill}"/>`);

/** A header's facts as compat.headerFacts gathers them, with overrides. */
const headerFacts = (over = {}) => ({
   name: 'Kira Ashvale',
   portrait: { src: ROUND, isVideo: false, action: 'editImage', path: 'img', type: 'image' },
   classes: [{ id: 'cleric', name: 'Cleric', levels: 12, img: CLASS_ICON('#c9a227'), subclass: 'Life Domain' }],
   levelOrder: [], originalClass: 'cleric', level: 12, leveling: 'xp',
   xp: { value: 6500, max: 14000, pct: 46, valueLabel: '6,500', maxLabel: '14,000' },
   origin: ['Medium', 'Humanoid', 'Dragonborn', 'Acolyte', 'Chaotic Good'], speed: '30 ft',
   prof: 4, ac: 16, init: 0, hp: { value: 87, max: 87, temp: 0 }, inspiration: false,
   exhaustion: { value: 0, max: 6 }, hd: { value: 12, max: 12 }, showRests: true,
   restTypes: [{ key: 'short', label: 'Short Rest' }, { key: 'long', label: 'Long Rest' }], emphasis: 'modifier',
   abilities: [['str', 18, 4, 4, 0], ['dex', 10, 0, 0, 0], ['con', 14, 2, 2, 0], ['int', 8, -1, -1, 0],
      ['wis', 20, 5, 9, 1], ['cha', 9, -1, 3, 1]].map(([key, value, mod, save, proficient]) => ({
      key, abbr: key[0].toUpperCase() + key.slice(1), label: key, value, mod, save, proficient
   })),
   ...over
});
const header = (over) => ({ editable: false, rollableClass: 'rollable', fhcs: headerView(headerFacts(over), { format, localize }) });
const MULTICLASS = {
   classes: [
      { id: 'cleric', name: 'Cleric', levels: 9, img: CLASS_ICON('#c9a227'), subclass: 'Life Domain' },
      { id: 'fighter', name: 'Fighter', levels: 3, img: CLASS_ICON('#7a2e2e'), subclass: '' }
   ],
   levelOrder: ['cleric', 'fighter', 'fighter', 'cleric', 'cleric', 'cleric', 'cleric', 'cleric', 'cleric', 'fighter'],
   leveling: 'noxp'
};

/** dnd5e's tabs as `_getTabs` gives them, dnd5e's order and labels. */
const DND5E_TABS = Object.fromEntries(['details', 'inventory', 'features', 'spells', 'effects', 'biography', 'bastion', 'specialTraits']
   .map((id, i) => [id, { id, label: ['Details', 'Inventory', 'Features', 'Spells', 'Effects', 'Biography', 'Bastion', 'Special Traits'][i], active: id === 'details' }]));
const tabs = (mode) => ({ fhcsTabs: tabRow(DND5E_TABS, mode, localize) });

export const CASES = [
   { name: 'tabs', template: 'sheet/tabs', context: tabs({ canEdit: true, editing: false }) },
   { name: 'tabs-editing', template: 'sheet/tabs', context: tabs({ canEdit: true, editing: true }) },
   { name: 'header', template: 'sheet/header', context: header() },
   { name: 'header-tall-art', template: 'sheet/header', context: header({ portrait: { src: TALL, isVideo: false } }) },
   { name: 'header-score-first', template: 'sheet/header', context: header({ emphasis: 'score', inspiration: true, exhaustion: { value: 2, max: 6 } }) },
   {
      name: 'header-milestones', template: 'sheet/header', open: ['milestones'],
      context: header({ ...MULTICLASS, name: 'Kira Ashvale of the Long Road, Keeper of the Ember Gate' })
   },
   { name: 'header-exhaustion-open', template: 'sheet/header', open: ['exhaustion'], context: header({ exhaustion: { value: 3, max: 6 } }) },
   { name: 'header-rest-open', template: 'sheet/header', open: ['rest'], context: header() },
   {
      name: 'card-attack-full-side',
      template: 'chat/usage-card',
      frame: 'chat',
      context: rolledAttack(attack({
         total: 10, natural: 2, isCritical: false, spare: null, sides: ['adv', 'dis', 'dis', 'dis', 'dis', 'dis'],
         dice: [{ result: 12, active: false, discarded: true }, { result: 17, active: false, discarded: true },
            { result: 9, active: false, discarded: true }, { result: 5, active: false, discarded: true },
            { result: 14, active: false, discarded: true }, { result: 2, active: true }, { result: 11, active: false, discarded: true }],
         math: '2 + 5 + 3'
      }))
   },
   {
      name: 'card-standalone-check',
      template: 'chat/roll-card',
      frame: 'chat',
      context: standaloneCard('Perception Skill Check', 'Check', save('Kira', 17, 12, null, {
         kind: 'check', what: 'Perception Skill Check', target: null, formula: '1d20 + 5', math: '12 + 5'
      }))
   },
   {
      name: 'card-death-save',
      template: 'chat/roll-card',
      frame: 'chat',
      context: standaloneCard('Death Saving Throw', 'Death save', save('Kira', 20, 20, true, {
         what: 'Death Saving Throw', target: 10, formula: '1d20', math: '20'
      }), { supplements: ['Kira regains 1 hit point.'], others: [{ action: 'breakConcentration', index: 0, label: 'Break Concentration' }] })
   },
   { name: 'card-request', template: 'chat/request-card', frame: 'chat', context: request() },
   { name: 'card-fireball-saves', template: 'chat/usage-card', frame: 'chat', context: fireball() },
   { name: 'card-attack-crit', template: 'chat/usage-card', frame: 'chat', context: rolledAttack(attack(), ['6 + 5 + 3 = 14', '1 + 5 + 3 = 9'], damage()) },
   {
      name: 'card-damage-mixed',
      template: 'chat/usage-card',
      frame: 'chat',
      context: rolledAttack(attack({ isCritical: false, total: 17, natural: 9, dice: [{ result: 9, active: true }], math: '9 + 5 + 3' }), [], damage({
         critical: false, total: 31,
         parts: [{ type: 'slashing', label: 'Slashing', total: 12 }, { type: 'radiant', label: 'Radiant', total: 9 },
            { type: 'necrotic', label: 'Necrotic', total: 10 }],
         math: [{ formula: '1d8 + 5', result: '7 + 5 = 12', label: 'Slashing' }, { formula: '2d8', result: '(4 + 5) = 9', label: 'Radiant' },
            { formula: '3d6', result: '(2 + 3 + 5) = 10', label: 'Necrotic' }],
         onSave: 'Half Damage'
      }))
   },
   {
      name: 'card-attack-elven',
      template: 'chat/usage-card',
      frame: 'chat',
      context: rolledAttack(attack({
         total: 26, natural: 18, isCritical: false, advantageMode: 1, spare: null,
         dice: [{ result: 12, active: false, discarded: true }, { result: 15, active: false, discarded: true }, { result: 18, active: true }],
         math: '18 + 5 + 3', targets: [{ name: 'Hobgoblin Captain of the Iron Legion', isMiss: false }, { name: 'Bugbear', isMiss: true }]
      }))
   },
   {
      name: 'card-attack-both-sides',
      template: 'chat/usage-card',
      frame: 'chat',
      context: rolledAttack(attack({
         total: 20, natural: 12, isCritical: false, sides: ['adv', 'adv', 'dis', 'dis'],
         dice: [{ result: 12, active: true }, { result: 15, active: false, discarded: true }, { result: 19, active: false, discarded: true },
            { result: 4, active: false, discarded: true }, { result: 2, active: false, discarded: true }],
         math: '12 + 5 + 3'
      }))
   },
   { name: 'card-attack', template: 'chat/usage-card', frame: 'chat', context: card({}, ATTACK) },
   { name: 'card-fireball', template: 'chat/usage-card', frame: 'chat', context: card({ title: 'Fireball', subtitle: '3rd-level evocation' }, FIREBALL) },
   {
      name: 'card-long-names',
      template: 'chat/usage-card',
      frame: 'chat',
      context: card({
         actorName: 'Bartholomew Thistlewood-Ashcombe the Unreasonably Named',
         title: 'Supercalifragilisticexpialidocious Greatsword of the Northern Wastes',
         subtitle: 'Attack · Melee · Heavy · Two-Handed · Topple'
      }, [{ action: 'rollSave', index: 0, label: 'DC 18 Constitution Saving Throw (Topple, or knocked Prone)' }, ...ATTACK])
   },
   { name: 'card-no-details', template: 'chat/usage-card', frame: 'chat', context: card({ hasDetails: false }, []) }
];
