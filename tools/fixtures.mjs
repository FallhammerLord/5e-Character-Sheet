/**
 * Layout cases: each renders one of our templates with sample data. The layout check draws every case at every
 * width of its frame and fails on overflow. Each phase adds its parts here (Phase 1: the header).
 *
 * A case: { name, template: 'path/without-hbs', context: {...}, frame?: 'sheet' | 'chat', theme?: 'light' }
 */
import { appliedLines, cardParts, d20Band, damageBand, saveRow } from '../src/chat/card.js';
import { headerView, inspirationBar, tabRow, themePicker } from '../src/sheet/header.js';
import { itemSheetView } from '../src/sheet/item.js';
import { attributesView } from '../src/sheet/attributes.js';
import { inventoryView } from '../src/sheet/inventory.js';
import { spellbookView } from '../src/sheet/spellbook.js';
import { featuresView } from '../src/sheet/features.js';
import { effectsView } from '../src/sheet/effects.js';
import { biographyView } from '../src/sheet/biography.js';
import { format, localize, template } from './templates.mjs';

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
   dice: [{ result: 20, active: true }], advantageMode: 0, sides: [], 
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
   isCritical: false, targets: [], dice: [{ result: natural, active: true }], advantageMode: 0, sides: [], 
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
      { ...saveRow(save('Adult Red Dragon of the Smoking Peaks', 4, 1, false, { canResist: true, sides: ['dis'], 
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
const SQUARE = art(400, 400, '<rect width="400" height="400" fill="#5a6e8c"/><circle cx="200" cy="150" r="70" fill="#d9ccae"/>');
const CLASS_ICON = (fill) => art(64, 64, `<circle cx="32" cy="32" r="32" fill="${fill}"/>`);

/** The header's class, species and background cards, as compat.originFacts gathers them, with overrides. */
const originDoc = (name, fill) => ({ id: name.replace(/\W/g, ''), uuid: `Actor.x.Item.${name}`, name, img: CLASS_ICON(fill) });
const originFacts = (over = {}) => ({
   classes: [{ ...originDoc('Cleric', '#c9a227'), identifier: 'cleric', level: 12, subclass: originDoc('Life Domain', '#3a8a5a'), needsSubclass: false }],
   origins: [{ kind: 'species', item: originDoc('Dragonborn', '#8a5a3a') }, { kind: 'background', item: originDoc('Acolyte', '#7a5ab8') }],
   maxLevel: 20, xp: { value: 6500, max: 14000 }, canEdit: true, editing: false,
   ...over
});
/** A header's facts as compat.headerFacts gathers them, with overrides. */
const headerFacts = (over = {}) => ({
   name: 'Kira Ashvale',
   portrait: { src: ROUND, isVideo: false, action: 'editImage', path: 'img', type: 'image', token: true },
   classes: [{ id: 'cleric', name: 'Cleric', levels: 12, img: CLASS_ICON('#c9a227'), subclass: 'Life Domain' }],
   levelOrder: [], originalClass: 'cleric', level: 12, leveling: 'xp',
   xp: { value: 6500, max: 14000, pct: 46, valueLabel: '6,500', maxLabel: '14,000' },
   origin: ['Medium'], speed: '30 ft',
   speeds: [{ key: 'walk', label: 'Speed', value: 30 }, { key: 'fly', label: 'Fly', value: 60 }, { key: 'swim', label: 'Swim', value: 30 }], speedUnits: 'ft',
   originCards: originFacts(),
   prof: 4, ac: 16, init: 0, hp: { value: 87, max: 87, temp: 0 }, inspiration: false,
   exhaustion: { value: 0, max: 6 }, hd: { value: 12, max: 12 }, showRests: true,
   restTypes: [{ key: 'short', label: 'Short Rest' }, { key: 'long', label: 'Long Rest' }],
   abilities: [['str', 18, 4, 4, 0], ['dex', 10, 0, 0, 0], ['con', 14, 2, 2, 0], ['int', 8, -1, -1, 0],
      ['wis', 20, 5, 9, 1], ['cha', 9, -1, 3, 1]].map(([key, value, mod, save, proficient]) => ({
      key, abbr: key[0].toUpperCase() + key.slice(1), label: key, value, mod, save, proficient
   })),
   ...over
});
const header = (over) => ({ editable: false, rollableClass: 'rollable',
   fhcs: { ...headerView(headerFacts(over), { format, localize }), editable: over?.editable ?? true } });
const MULTICLASS = {
   classes: [
      { id: 'cleric', name: 'Cleric', levels: 9, img: CLASS_ICON('#c9a227'), subclass: 'Life Domain' },
      { id: 'fighter', name: 'Fighter', levels: 3, img: CLASS_ICON('#7a2e2e'), subclass: '' }
   ],
   levelOrder: ['cleric', 'fighter', 'fighter', 'cleric', 'cleric', 'cleric', 'cleric', 'cleric', 'cleric', 'fighter'],
   leveling: 'noxp',
   originCards: originFacts({
      classes: [
         { ...originDoc('Cleric', '#c9a227'), identifier: 'cleric', level: 9, subclass: originDoc('Life Domain', '#3a8a5a'), needsSubclass: false },
         { ...originDoc('Fighter', '#7a2e2e'), identifier: 'fighter', level: 3, subclass: null, needsSubclass: true }
      ],
      origins: [{ kind: 'species', item: originDoc('Aasimar of the Radiant Dawn', '#e0c060') }, { kind: 'background', item: null }],
      xp: null
   })
};

/** The header's second row: the HP band and the cards share its top and bottom (SCOPE §5.2 rule 1). */
const HEADER_ALIGN = [['.fhcs-portrait-band', 'top', '.fhcs-origin-card', 'top'], ['.fhcs-portrait-band', 'bottom', '.fhcs-origin-card', 'bottom'],
   // The two stats panels share their top and foot; the cards' outer edges meet the panels' (user, 2026-10-27).
   ['.fhcs-combat', 'top', '.fhcs-abilities', 'top'], ['.fhcs-combat', 'bottom', '.fhcs-abilities', 'bottom'],
   ['.fhcs-combat', 'left', '.fhcs-cards > :first-child', 'left'], ['.fhcs-abilities', 'right', '.fhcs-cards > :last-child', 'right'],
   // An ability's score and the AC shield share a line; its save and Level share the foot.
   ['.fhcs-combat .fhcs-button', 'top', '.fhcs-ability-pair', 'top'], ['.fhcs-combat-level', 'bottom', '.fhcs-abilities .saving-throw', 'bottom']];

/** Four classes, highest first after sorting: Cleric and Fighter take the cards, Rogue and Wizard the class tray. */
const FOUR_CLASSES = (over = {}) => originFacts({
   classes: [
      { ...originDoc('Rogue', '#3a4a6a'), identifier: 'rogue', level: 2, subclass: null, needsSubclass: false },
      { ...originDoc('Cleric', '#c9a227'), identifier: 'cleric', level: 6, subclass: originDoc('Life Domain', '#3a8a5a'), needsSubclass: false },
      { ...originDoc('Wizard', '#3a6a5a'), identifier: 'wizard', level: 1, subclass: null, needsSubclass: false },
      { ...originDoc('Fighter', '#7a2e2e'), identifier: 'fighter', level: 3, subclass: originDoc('Champion', '#8a3a2a'), needsSubclass: false }
   ],
   ...over
});

/**
 * dnd5e's Special Traits tab as Foundry draws it (creature-special-traits.hbs: fieldsets of `formField` groups, each a
 * label, the control in .form-fields and a hint), for the layout check: our styles must hold it without dnd5e's.
 */
const field = (label, control, hint) => `<div class="form-group"><label>${label}</label><div class="form-fields">${control}</div>${hint ? `<p class="hint">${hint}</p>` : ''}</div>`;
const SPECIAL_TRAITS = `<section class="tab active" data-tab="specialTraits" data-group="primary">
   <fieldset class="card"><legend>Class</legend>
      ${field('Original Class', '<select name="system.details.originalClass"><option>Ranger</option><option>Rogue</option></select>', 'First class taken by character used to determine certain class traits when multiclassing.')}
   </fieldset>
   <fieldset class="card"><legend>Feats</legend>
      ${field('Diamond Soul', '<input type="checkbox" name="flags.dnd5e.diamondSoul">', 'Gain proficiency to all saving throws.')}
      ${field('Alert Feat', '<input type="checkbox" name="flags.dnd5e.initiativeAlert" checked>', 'Proficient in Initiative rolls.')}
      ${field('Jack of All Trades', '<input type="checkbox" name="flags.dnd5e.jackOfAllTrades">', 'Half-Proficiency to Ability Checks in which you are not already Proficient.')}
      ${field('Weapon Critical Hit Threshold', '<input type="number" name="flags.dnd5e.weaponCriticalThreshold" placeholder="20">', 'An integer for the minimum natural roll which is a critical hit.')}
      ${field('Melee Critical Damage Dice', '<input type="text" name="flags.dnd5e.meleeCriticalDamageDice" value="1">', '')}
   </fieldset>
</section>`;

/** dnd5e's tabs as `_getTabs` gives them, dnd5e's order and labels. */
const DND5E_TABS = Object.fromEntries(['details', 'inventory', 'features', 'spells', 'effects', 'biography', 'bastion', 'specialTraits']
   .map((id, i) => [id, { id, label: ['Details', 'Inventory', 'Features', 'Spells', 'Effects', 'Biography', 'Bastion', 'Special Traits'][i], active: id === 'details' }]));
// Inspiration in the tab row (SCOPE §4.12): dnd5e's on or off, a bank of five (three banked), and a bank too big for stars.
const INSPIRE_ITEMS = [{ id: 'insp1', uuid: 'Actor.a.Item.insp1', name: 'Heroic Inspiration', img: '' },
   { id: 'luck1', uuid: 'Actor.a.Item.luck1', name: 'Lucky', img: '' }];
const INSPIRE = {
   none: { on: true, bank: null, linkable: INSPIRE_ITEMS },
   bank: { on: true, bank: { link: INSPIRE_ITEMS[0], value: 3, max: 5 }, linkable: INSPIRE_ITEMS },
   big: { on: true, bank: { link: INSPIRE_ITEMS[1], value: 5, max: 8 }, linkable: INSPIRE_ITEMS }
};
const tabs = (mode, inspire = 'none') => ({ fhcsTabs: { ...tabRow(DND5E_TABS, mode, localize), inspiration: inspirationBar(INSPIRE[inspire], mode, { localize, format }) } });
// The theme picker on the title bar (SCOPE §4.11), its tray open: this character wears Forge, the world Plain.
const THEME_PICK = themePicker({ chosen: 'forge', world: 'plain', keys: ['plain', 'forge', 'wind', 'sand', 'valley'] }, { localize, format });
const themePick = template('sheet/theme-pick')(THEME_PICK);
const titleBarPick = themePick.slice(0, themePick.indexOf('<div class="fhcs-tray'));
// The tray open, as CharacterSheet places it: a child of the window, just under the 28px title bar.
const titleTrayOpen = themePick.slice(themePick.indexOf('<div class="fhcs-tray')).replace(' hidden>', ' style="top:28px">');

/** The Attributes tab's facts as compat.attributesFacts gathers them, with overrides. */
const SKILLS = [['acr', 'Acrobatics', 'Dex', 0, 10, 0], ['ani', 'Animal Handling', 'Wis', 5, 15, 0], ['arc', 'Arcana', 'Int', -1, 9, 0],
   ['ath', 'Athletics', 'Str', 4, 14, 0.5], ['dec', 'Deception', 'Cha', -1, 9, 0], ['his', 'History', 'Int', 3, 13, 1],
   ['ins', 'Insight', 'Wis', 9, 19, 1], ['itm', 'Intimidation', 'Cha', -1, 9, 0], ['inv', 'Investigation', 'Int', -1, 9, 0],
   ['med', 'Medicine', 'Wis', 9, 19, 1], ['nat', 'Nature', 'Int', -1, 9, 0], ['prc', 'Perception', 'Wis', 13, 23, 2],
   ['prf', 'Performance', 'Cha', -1, 9, 0], ['per', 'Persuasion', 'Cha', -1, 9, 0], ['rel', 'Religion', 'Int', 3, 13, 1],
   ['slt', 'Sleight of Hand', 'Dex', 0, 10, 0], ['ste', 'Stealth', 'Dex', 0, 10, 0], ['sur', 'Survival', 'Wis', 5, 15, 0]]
   .map(([key, label, abbr, total, passive, prof]) => ({ key, label, abbr, total, passive, prof, source: prof, ability: abbr.toLowerCase() }));
const ICON = (fill) => art(48, 48, `<rect width="48" height="48" rx="6" fill="${fill}"/>`);
const fav = (title, group, over = {}) => ({
   id: `.Item.${title}`, type: 'item', title, subtitle: '', img: ICON('#6b5a3a'), uses: null, quantity: 0,
   itemId: title, activityId: '', effectId: '', key: '', rollableClass: 'rollable', group, level: null, state: null, ...over
});
const attributesFacts = (over = {}) => ({
   skills: SKILLS,
   abilities: ['str', 'dex', 'con', 'int', 'wis', 'cha'].map((key) => ({ key, abbr: key.toUpperCase() })),
   traits: [
      { key: 'senses', title: 'Senses', values: ['Darkvision 60 ft'] },
      { key: 'languages', title: 'Languages', values: ['Common', 'Draconic', 'Giant', 'Halfling'] },
      { key: 'di', title: 'Damage Immunities', values: [] },
      { key: 'dr', title: 'Damage Resistances', values: ['Cold'] },
      { key: 'ci', title: 'Condition Immunities', values: [] },
      { key: 'weapon', title: 'Weapon Proficiencies', values: ['Simple Weapons'] },
      { key: 'armor', title: 'Armor Proficiencies', values: ['Light Armor', 'Medium Armor', 'Heavy Armor', 'Shields'] },
      { key: 'tool', title: 'Tool Proficiencies', values: ['Herbalism Kit'] }
   ],
   favorites: [
      fav('Light Crossbow', 'inventory', { subtitle: 'Ranged Weapon Attack', state: 'equipped', expandable: true, expanded: true,
         summary: '<div class="item-summary"><p>A simple ranged weapon. Load one bolt at a time.</p></div>' }),
      fav('Mace', 'inventory', { subtitle: 'Melee Weapon Attack', state: 'equipped' }),
      fav('Shield', 'inventory', { state: 'equipped' }),
      fav('Torch', 'inventory', { uses: { value: 1, max: 1 }, quantity: 3 }),
      fav('Bless', 'spell', { level: 1, subtitle: 'V S M \u00b7 1 Action', state: 'prepared', kind: 'prepared' }),
      fav('Healing Word', 'spell', { level: 1, subtitle: 'V \u00b7 1 Bonus Action', state: 'prepared', kind: 'always' }),
      fav('Detect Magic', 'spell', { level: 1, subtitle: 'V S \u00b7 1 Action' }),
      fav('Counterspell', 'spell', { level: 3, subtitle: 'S \u00b7 1 Reaction', state: 'prepared', kind: 'pact', expandable: true }),
      fav('Misty Step', 'spell', { level: 2, subtitle: 'V \u00b7 1 Bonus Action', kind: 'innate', expandable: true }),
      fav('Sacred Flame', 'spell', { level: 0, subtitle: 'V S \u00b7 1 Action' }),
      fav('Channel Divinity: Preserve Life', 'features', { subtitle: '1 Action \u00b7 Short Rest', uses: { value: 1, max: 2 } }),
      // Favorited effects show their switch, on and off (user, 2026-10-28).
      fav('Bless', 'effects', { subtitle: '7 rounds', toggle: { on: true } }),
      fav('Cloak of Protection', 'effects', { toggle: { on: false } })
   ],
   // Three resource panels (SCOPE §4.10): one linked to an item, one of dnd5e's own with a long name and both rests, one
   // never set (shown only with the lock off).
   resources: [
      { key: 'primary', link: { id: 'cd', uuid: 'Actor.x.Item.cd', name: 'Channel Divinity', img: CLASS_ICON('#c9a227') },
         label: 'Channel Divinity', value: 1, max: 2, sourceMax: 2, sr: false, lr: false, periods: ['SR', 'LR'] },
      { key: 'secondary', link: null, label: 'Superiority Dice from the Battle Master Feat', value: 3, max: 4, sourceMax: 4, sr: true, lr: true, periods: null },
      { key: 'tertiary', link: null, label: '', value: 0, max: 0, sourceMax: 0, sr: false, lr: false, periods: null }
   ],
   linkable: [
      { id: 'cd', uuid: 'Actor.x.Item.cd', name: 'Channel Divinity', img: CLASS_ICON('#c9a227') },
      { id: 'wild', uuid: 'Actor.x.Item.wild', name: 'Wand of Magic Missiles with a Long Name', img: CLASS_ICON('#3a6a5a') }
   ],
   slots: { 1: { value: 3, max: 4 }, 3: { value: 3, max: 3 } },
   editing: false, folded: [], ...over
});
const attributes = (over) => ({
   tab: { id: 'details', group: 'primary', cssClass: 'active' }, rollableClass: 'rollable',
   fhcsAttributes: attributesView(attributesFacts(over), { format, localize })
});

/** One inventory row's facts as compat.inventoryFacts gathers them, with overrides. */
const gear = (name, fill, over = {}) => ({
   id: name.replace(/\W/g, ''), uuid: `Actor.x.Item.${name}`, name, img: ICON(fill), sub: '', useAction: 'use',
   expanded: false, summary: '', weight: '', uses: null, usage: '', quantity: 1, equip: null, attune: null, ...over
});
const worn = (on) => ({ on, disabled: false });
const inventoryFacts = (over = {}) => ({
   sections: [
      { id: 'weapons', label: 'Weapons', items: [
         gear('Light Crossbow', '#6b5a3a', { equip: worn(true), weight: '5 lb', usage: '1 Action', expanded: true,
            summary: '<div class="item-summary"><p>A simple ranged weapon. Load one bolt at a time.</p></div>' }),
         gear('Mace', '#5a5a66', { equip: worn(true), weight: '4 lb', usage: '1 Action', favorite: true }),
         gear('Mace of Disruption of the Seventh Sunless Vault', '#9a7a2a', { equip: worn(false), weight: '4 lb', usage: '1 Action',
            attune: { on: false, disabled: false, need: 'Requires attunement' } })
      ] },
      { id: 'equipment', label: 'Equipment', items: [
         gear('Scale Mail', '#77705f', { equip: worn(true), weight: '45 lb' }),
         gear('Amulet of Health', '#7a2e5a', { equip: worn(true), attune: { on: true, disabled: false, need: '' }, weight: '1 lb' })
      ] },
      { id: 'consumables', label: 'Consumables', items: [
         gear('Potion of Healing', '#a3221b', { weight: '1.5 lb', usage: '1 Bonus Action', quantity: 3,
            uses: { value: 1, max: 1, prop: 'system.uses.value' } }),
         gear('Crossbow Bolts', '#5a4a3a', { weight: '1.5 lb', quantity: 20 })
      ] },
      { id: 'containers', label: 'Containers', items: [
         gear('Backpack', '#6a5a3a', { useAction: 'view', weight: '17 lb', sub: '12 / 30 lb', quantity: 1, contents: [
            gear('Rations (1 day)', '#8a7a5a', { weight: '2 lb', quantity: 5, usage: '1 Action' }),
            gear('Waterskin', '#4a6a8a', { weight: '5 lb' }),
            gear('Pouch of Seven Curious Trinkets from the Market', '#7a5a3a', { useAction: 'view', weight: '1 lb', sub: '3 / 6 lb', quantity: 1,
               contents: [gear('Ring of Mind Shielding', '#9a7a2a', { equip: worn(false), weight: '', attune: { on: false, disabled: false, need: 'Requires attunement' } })] })
         ] }),
         gear('Chest', '#5a4a2a', { useAction: 'view', weight: '25 lb', sub: '0 / 300 lb', contents: [] })
      ] },
      { id: 'other', label: 'Other', items: [] }
   ],
   columns: {},
   editing: false,
   filters: [{ key: 'action', group: 'activation', label: 'Action' }, { key: 'equipped', group: 'property', label: 'Equipped' }],
   sorting: [{ key: 'm', icon: 'fa-solid fa-arrow-down-short-wide', label: 'Manual' }, { key: 'a', icon: 'fa-solid fa-arrow-down-a-z', label: 'Alphabetical' }],
   currency: ['pp', 'gp', 'ep', 'sp', 'cp'].map((key, i) => ({ key, value: [0, 147, 0, 32, 15][i], prop: `system.currency.${key}`,
      abbr: key.toUpperCase(), name: `${key} coins` })),
   attunement: { value: 1, max: 3, sourceMax: 3 },
   openContainers: ['Backpack', 'PouchofSevenCuriousTrinketsfromtheMarket'],
   encumbrance: { value: '84', max: '240', pct: 35, stops: { encumbered: 33, heavilyEncumbered: 66 }, units: 'lb' },
   ...over
});
const inventory = (over) => ({
   tab: { id: 'inventory', group: 'primary', cssClass: 'active' }, rollableClass: 'rollable',
   fhcsInventory: inventoryView(inventoryFacts(over), { format, localize })
});
const ALL_COLUMNS = { weight: true, uses: true, usage: true, quantity: true, equipped: true, attuned: true };

/** One spell's facts as compat.spellbookFacts gathers them, with overrides. */
const spell = (name, fill, over = {}) => ({
   id: name.replace(/\W/g, ''), uuid: `Actor.x.Item.${name}`, name, img: ICON(fill), sub: '', level: 1, method: 'spell',
   prepares: true, prepared: 1, linked: false, ritual: false, concentration: false, components: 'V, S', time: '1 Action',
   range: '60 ft', school: 'Evocation', target: '1 creature', uses: null, favorite: false, expanded: false, summary: '', ...over
});
const level = (n, items, slots) => ({ id: `spell${n}`, method: 'spell', level: n, label: n ? `Level ${n}` : 'Cantrips',
   slots: slots ? { value: slots[0], max: slots[1] } : null, items });
const spellbookFacts = (over = {}) => ({
   classes: [{ label: 'Cleric Spellcasting', abbr: 'WIS', ability: 'wis', mod: 4, attack: 8, save: 16, prepared: { value: 11, max: 14 }, primary: true }],
   concentration: { save: 5, spells: [{ effectId: 'e1', itemId: 'SpiritGuardians', name: 'Spirit Guardians', img: ICON('#c9a227'), sub: '3rd Level' }] },
   sections: [
      level(0, [
         spell('Guidance', '#b8a46a', { level: 0, concentration: true, range: 'Touch' }),
         spell('Sacred Flame', '#c9732a', { level: 0 })
      ]),
      level(1, [
         spell('Bless', '#c9a227', { concentration: true, components: 'V, S, M', range: '30 ft', favorite: true }),
         spell('Healing Word', '#3a9a7a', { components: 'V', time: '1 Bonus Action', favorite: true }),
         spell('Shield of Faith', '#5a7ab8', { prepared: 2, concentration: true, time: '1 Bonus Action', sub: 'Life Domain' }),
         spell('Detect Magic', '#7a5ab8', { prepared: 0, concentration: true, ritual: true, range: 'Self', expanded: true,
            summary: '<div class="item-summary"><p>For the duration, you sense the presence of magic within 30 feet of you.</p></div>' })
      ], [3, 4]),
      level(3, [
         spell('Spirit Guardians', '#c9a227', { level: 3, concentration: true, components: 'V, S, M', range: 'Self', favorite: true }),
         spell('Dispel Magic of the Grand Unweaving Circle', '#7a5ab8', { level: 3, prepared: 0, range: '120 ft' })
      ], [1, 3]),
      { id: 'pact', method: 'pact', level: 2, label: 'Pact Magic', slots: { value: 1, max: 2 }, items: [
         spell('Hex', '#5a2a6a', { method: 'pact', concentration: true, time: '1 Bonus Action', range: '90 ft' }),
         spell('Armor of Agathys', '#4a8ab8', { method: 'pact', prepared: 0, range: 'Self' })
      ] },
      { id: 'innate', method: 'innate', level: null, label: 'Innate Spellcasting', slots: null, items: [
         spell('Misty Step', '#5a7ab8', { method: 'innate', prepares: false, prepared: 0, level: 2, components: 'V', time: '1 Bonus Action',
            range: 'Self', sub: 'Fey Touched', uses: { value: 1, max: 1, prop: 'system.uses.spent' } })
      ] },
      { id: 'atwill', method: 'atwill', level: null, label: 'At-Will', slots: null, items: [
         spell('Detect Magic', '#7a5ab8', { id: 'DetectMagic2', method: 'atwill', prepares: false, prepared: 0, concentration: true, range: 'Self', sub: 'Invocation' })
      ] },
      // Cast through another item's activity: its uses are the feature's, shown, not a field (user's screenshot, 2026-10-27).
      { id: 'item', method: 'item', level: null, label: 'Additional Spells', slots: null, items: [
         spell('Hunter\'s Mark', '#3a6a4a', { id: 'HuntersMark2', method: 'item', prepares: false, prepared: 0, level: 1, concentration: true,
            components: 'V', time: '1 Bonus Action', range: '90 ft', sub: 'Favored Enemy', uses: { value: 2, max: 2, linked: true } })
      ] }
   ],
   columns: {},
   editing: false,
   activeFilters: ['prepared'],
   filters: [{ key: 'action', group: 'activation', label: 'Action' }, { key: 'prepared', group: 'property', label: 'Prepared' }],
   sorting: [{ key: 'a', icon: 'fa-solid fa-arrow-down-a-z', label: 'Alphabetical' }],
   ...over
});
const spellbook = (over) => ({
   tab: { id: 'spells', group: 'primary', cssClass: 'active' }, rollableClass: 'rollable',
   fhcsSpellbook: spellbookView(spellbookFacts(over), { format, localize })
});
const ALL_SPELL_COLUMNS = { components: true, concentration: true, time: true, range: true, school: true, target: true };
const MULTICLASS_CASTER = [
   { label: 'Cleric Spellcasting', abbr: 'WIS', mod: 4, attack: 7, save: 15, prepared: { value: 8, max: 9 }, primary: true },
   { label: 'Warlock Spellcasting', abbr: 'CHA', mod: 2, attack: 5, save: 13, prepared: { value: 4, max: 4 }, primary: false }
];

/** One feature's facts as compat.featuresFacts gathers them, with overrides. */
const feat = (name, fill, origin, over = {}) => ({
   id: name.replace(/\W/g, ''), uuid: `Actor.x.Item.${name}`, name, img: ICON(fill), origin, activation: 'passive',
   expanded: false, summary: '', uses: null, recharge: null, usage: '', recovery: '', favorite: false, ...over
});
const act = (usage, over = {}) => ({ activation: 'active', usage, ...over });
const uses = (value, max) => ({ value, max, prop: 'system.uses.value' });
const doc = (name, fill) => ({ id: name.replace(/\W/g, ''), uuid: `Actor.x.Item.${name}`, name, img: ICON(fill) });
const FEATURE_SECTIONS = (classes) => [
   ...classes.map((k) => ({ id: k.identifier, label: `${k.name} Features`, group: 'origin', value: k.identifier })),
   { id: 'species', label: 'Species Features', group: 'origin', value: 'species' },
   { id: 'background', label: 'Background Features', group: 'origin', value: 'background' },
   { id: 'other', label: 'Other Features', group: 'origin', value: 'other' },
   { id: 'active', label: 'Active', group: 'activation', value: 'active' },
   { id: 'passive', label: 'Passive', group: 'activation', value: 'passive' }
];
const CLERIC = { ...doc('Cleric', '#c9a227'), identifier: 'cleric', level: 9, subclass: doc('Life Domain', '#3a8a5a'), needsSubclass: false };
const featuresFacts = (over = {}) => ({
   sections: FEATURE_SECTIONS([CLERIC]),
   features: [
      feat('Channel Divinity', '#c9a227', 'cleric', { uses: uses(1, 2), recovery: 'Short Rest', favorite: true, expanded: true,
         summary: '<div class="item-summary"><p>Channel divine energy for one of your Channel Divinity options.</p><div class="item-properties pills"><span class="tag pill transparent">Bonus Action</span><span class="tag pill transparent">1 Hour</span><span class="tag pill transparent">90 ft</span><span class="tag pill transparent">1 Creature</span></div></div>' }),
      feat('Turn Undead', '#4a4a5a', 'cleric', act('1 Action')),
      feat('Preserve Life', '#3a8a5a', 'cleric', act('1 Action')),
      feat('Blessed Healer', '#3a9a7a', 'cleric'),
      feat('Divine Order: Protector', '#5a7ab8', 'cleric'),
      feat('Stonecunning', '#8a6a4a', 'species', act('1 Bonus Action', { uses: uses(2, 2), recovery: 'Long Rest' })),
      feat('Darkvision', '#3a3a4a', 'species'),
      feat('Magic Initiate (Cleric)', '#7a5ab8', 'background', { uses: uses(1, 1), recovery: 'Long Rest' }),
      feat('Lucky', '#3a8a3a', 'other', { uses: uses(3, 3), recovery: 'Long Rest', favorite: true }),
      feat('Breath of the Wyrm', '#8a3a2a', 'other', act('1 Action', { recharge: { cooldown: true, label: 'Recharge [5+]' } }))
   ],
   columns: {},
   grouping: 'origin',
   editing: false,
   activeFilters: [],
   filters: [{ key: 'action', group: 'activation', label: 'Action' }, { key: 'sr', group: 'recovery', label: 'Short Rest' }],
   sorting: [{ key: 'a', icon: 'fa-solid fa-arrow-down-a-z', label: 'Alphabetical' }],
   ...over
});
const features = (over) => ({
   tab: { id: 'features', group: 'primary', cssClass: 'active' }, rollableClass: 'rollable',
   fhcsFeatures: featuresView(featuresFacts(over), { format, localize })
});
const MULTICLASS_FEATS = [
   { ...doc('Cleric', '#c9a227'), identifier: 'cleric', level: 5, subclass: doc('Light Domain', '#e0b040'), needsSubclass: false },
   { ...doc('Warlock', '#6a3a8a'), identifier: 'warlock', level: 3, subclass: null, needsSubclass: true }
];
const MULTICLASS_FEATURES = [
   feat('Channel Divinity', '#c9a227', 'cleric', { uses: uses(2, 2), recovery: 'Short Rest' }),
   feat('Warding Flare', '#e0a030', 'cleric', act('1 Reaction', { uses: uses(3, 3), recovery: 'Long Rest' })),
   feat('Radiance of the Dawn', '#e0b040', 'cleric', act('1 Action')),
   feat('Pact Magic', '#6a3a8a', 'warlock'),
   feat('Magical Cunning', '#7a4a9a', 'warlock', act('1 Minute', { uses: uses(1, 1), recovery: 'Long Rest' })),
   feat('Celestial Revelation: Heavenly Wings of the Morning', '#e0c060', 'species', act('1 Bonus Action', { uses: uses(1, 1), recovery: 'Long Rest, Dawn' })),
   feat('Fey Touched (Misty Step, Gift of Alacrity)', '#5a7ab8', 'other', { uses: uses(1, 1), recovery: 'Long Rest' })
];
const ALL_FEATURE_COLUMNS = { uses: true, usage: true, recovery: true, favorite: true };

/** One effect's facts as compat.effectsFacts gathers them, with overrides. */
const fx = (name, fill, over = {}) => ({
   id: name.replace(/\W/g, ''), uuid: `Actor.x.ActiveEffect.${name}`, parentId: '', name, img: ICON(fill), source: '', duration: '',
   disabled: false, toggleable: true, concentration: false, expanded: false, summary: '', favorite: false, ...over
});
const CONDITIONS = ['Blinded', 'Charmed', 'Deafened', 'Exhaustion', 'Frightened', 'Grappled', 'Incapacitated', 'Invisible',
   'Paralyzed', 'Petrified', 'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious'];
const conditionFacts = (on = [], exhaustion = 0) => CONDITIONS.map((name, i) => ({
   id: name.toLowerCase(), name, img: ICON(['#5a5a6a', '#8a4a6a', '#6a6a5a', '#7a5a3a', '#6a3a3a'][i % 5]),
   on: on.includes(name), level: name === 'Exhaustion' ? exhaustion : null
}));
const effectsFacts = (over = {}) => ({
   categories: [
      { id: 'temporary', label: 'Temporary Effects', effects: [
         fx('Concentrating: Spirit Guardians', '#c9a227', { toggleable: false, concentration: true, source: 'Spirit Guardians', duration: '9 min' }),
         fx('Bless', '#c9a227', { source: 'Brother Aldo', duration: '7 rounds', favorite: true, expanded: true,
            summary: '<div class="item-summary"><p>Add 1d4 to attack rolls and saving throws.</p></div>' }),
         fx('Enlarge (Potion of Growth)', '#8a5a3a', { disabled: true, source: 'Potion of Growth', duration: '1 hour' }),
         fx('Frightened', '#6a3a3a', { source: 'Dragon Fear', duration: '1 round' })
      ] },
      { id: 'passive', label: 'Passive Effects', effects: [
         fx('Cloak of Protection', '#4a6a8a', { source: 'Cloak of Protection', parentId: 'cloak' }),
         fx('Dwarven Resilience', '#8a6a4a', { source: 'Dwarf', disabled: true })
      ] }
   ],
   conditions: conditionFacts(['Frightened', 'Prone'], 1),
   editing: false,
   canEdit: true,
   ...over
});
const effects = (over) => ({
   tab: { id: 'effects', group: 'primary', cssClass: 'active' }, rollableClass: 'rollable',
   fhcsEffects: effectsView(effectsFacts(over), { format, localize })
});

/** The Biography tab's facts as compat.biographyFacts gathers them, with overrides. */
const CHARACTERISTICS = { alignment: 'Neutral Good', eyes: 'Grey', height: '4 ft 5 in', faith: 'Lathander, the Morninglord',
   hair: 'Copper, braided', weight: '170 lb', gender: 'Female', skin: 'Ruddy', age: '87' };
const biographyFacts = (over = {}, chars = CHARACTERISTICS) => ({
   characteristics: Object.entries(chars).map(([key, value]) => ({
      name: `system.details.${key}`, label: key[0].toUpperCase() + key.slice(1), value, source: value
   })),
   boxes: [
      ['trait', 'Personality Traits', 'Quotes scripture at the worst possible moment.'],
      ['ideal', 'Ideals', 'Charity. Every soul deserves a second dawn.'],
      ['bond', 'Bonds', 'The temple at Thunderforge took me in when the clan would not.'],
      ['flaw', 'Flaws', 'I trust priests far too quickly.'],
      ['appearance', 'Appearance', 'Stocky and weathered, with a sunburst tattoo across her left forearm.']
   ].map(([key, label, value]) => ({ key, name: `system.details.${key}`, label, value })),
   biography: { name: 'system.details.biography.value', label: 'Biography',
      enriched: '<p>Born to a clan of smiths in the Thunderforge holds, Brenna was expected to work the forge.</p><p>A cave-in changed that.</p>',
      source: '<p>Born to a clan of smiths…</p>' },
   uuid: 'Actor.x',
   editable: true,
   ...over
});
const biography = (over, chars) => ({
   tab: { id: 'biography', group: 'primary', cssClass: 'active' },
   fhcsBiography: biographyView(biographyFacts(over, chars), { format, localize })
});
const LONG_BIO = ['Born to a clan of smiths in the Thunderforge holds, Brenna Coppervein was expected to work the forge like her mothers before her. A cave-in at the eastern seam changed that: trapped for three days with the injured, she prayed until the dark answered with light.',
   'The temple of Lathander took her in when the clan called the vision madness. Twenty years of service followed: field hospitals in the Goblin Wars, plague wards in Neverwinter, and one ill-advised pilgrimage with a bard who still owes her forty gold.',
   'Notes: owes the Harpers a favour; Brother Aldo knows her real name; https://example.invalid/an-unbroken-very-long-link-that-must-wrap-somewhere-sensible'];

export const CASES = [
   { name: 'biography', template: 'sheet/biography', context: biography({}, { ...CHARACTERISTICS, faith: '', skin: '' }) },
   {
      name: 'biography-viewer', template: 'sheet/biography',
      context: biography({
         editable: false,
         boxes: biographyFacts().boxes.map((b) => ({ ...b, value: b.key === 'flaw' ? '' : b.key === 'trait'
            ? 'Quotes scripture at the worst possible moment, and means every word.\nKeeps a tally of every life saved, scratched into the haft of her mace.' : b.value })),
         biography: { ...biographyFacts().biography, enriched: LONG_BIO.map((p) => `<p>${p}</p>`).join('') }
      }, { ...CHARACTERISTICS, faith: '', skin: '' })
   },
   {
      name: 'biography-viewer-empty', template: 'sheet/biography',
      context: biography({ editable: false, boxes: biographyFacts().boxes.map((b) => ({ ...b, value: '' })), biography: { ...biographyFacts().biography, enriched: '' } },
         Object.fromEntries(Object.keys(CHARACTERISTICS).map((k) => [k, ''])))
   },
   { name: 'effects', template: 'sheet/effects', context: effects() },
   {
      name: 'effects-long', template: 'sheet/effects',
      context: effects({ categories: [
         { id: 'temporary', label: 'Temporary Effects', effects: [
            fx('Aura of Protection (Sir Bartholomew the Unyielding)', '#c9b060', { source: 'Sir Bartholomew the Unyielding', duration: 'While within 10 ft' }),
            fx('Hex: Strength', '#5a2a6a', { source: 'Mirela Vantorre, Warlock of the Hollow Star', duration: '58 minutes, 30 seconds' })
         ] },
         { id: 'suppressed', label: 'Unavailable Effects', effects: [fx('Ring of Protection', '#8a8ab8', { source: 'Ring of Protection' })] }
      ], conditions: conditionFacts(['Blinded', 'Charmed', 'Deafened', 'Grappled', 'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified',
         'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious'], 6) })
   },
   { name: 'effects-editing', template: 'sheet/effects', context: effects({ editing: true }) },
   { name: 'effects-empty', template: 'sheet/effects', context: effects({ categories: [], conditions: conditionFacts() }) },
   { name: 'features', template: 'sheet/features', context: features(), rows: '.fhcs-list-bar, .fhcs-item-row' },
   // Edit mode may slide columns left for its controls; heights and flow stay (SCOPE §5.2 rule 6, user 2026-10-27).
   { name: 'features-editing-parity', template: 'sheet/features', context: features({ editing: true }), rows: '.fhcs-list-bar, .fhcs-item-row', sameRowsAs: 'features' },
   {
      name: 'features-multiclass', template: 'sheet/features',
      context: features({ sections: FEATURE_SECTIONS(MULTICLASS_FEATS), features: MULTICLASS_FEATURES })
   },
   { name: 'features-by-activation', template: 'sheet/features', context: features({ grouping: 'activation' }) },
   { name: 'features-editing', template: 'sheet/features', open: ['features-columns'], context: features({ editing: true, columns: ALL_FEATURE_COLUMNS }) },
   {
      name: 'features-empty', template: 'sheet/features',
      context: features({ sections: FEATURE_SECTIONS([]), features: [] })
   },
   { name: 'spellbook', template: 'sheet/spellbook', context: spellbook(), rows: '.fhcs-casting-class, .fhcs-list-bar, .fhcs-item-row', marks: '.fhcs-casting-name, .fhcs-list-bar item-list-controls' },
   // Edit mode keeps the casting cards and the search field where play mode has them (SCOPE §5.2 rule 6).
   { name: 'spellbook-editing-parity', template: 'sheet/spellbook', context: spellbook({ editing: true }), rows: '.fhcs-casting-class, .fhcs-list-bar, .fhcs-item-row', marks: '.fhcs-casting-name, .fhcs-list-bar item-list-controls', sameRowsAs: 'spellbook' },
   { name: 'spellbook-multiclass-idle', template: 'sheet/spellbook', context: spellbook({ classes: MULTICLASS_CASTER, concentration: { save: -1, spells: [] } }) },
   { name: 'spellbook-editing', template: 'sheet/spellbook', open: ['spells-columns'], context: spellbook({ editing: true, columns: ALL_SPELL_COLUMNS }) },
   // Two casting classes in edit mode: the radio dot picks the main spellcasting ability (user, 2026-10-27).
   { name: 'spellbook-editing-two-casters', template: 'sheet/spellbook', context: spellbook({ editing: true, classes: [
      { label: 'Cleric Spellcasting', abbr: 'WIS', ability: 'wis', mod: 4, attack: 8, save: 16, prepared: { value: 11, max: 14 }, primary: true },
      { label: 'Warlock Spellcasting', abbr: 'CHA', ability: 'cha', mod: 3, attack: 7, save: 15, prepared: { value: 2, max: 4 }, primary: false }
   ] }) },
   { name: 'spellbook-few-columns', template: 'sheet/spellbook', context: spellbook({ columns: { components: false, concentration: false, time: false, range: false } }) },
   {
      name: 'spellbook-two-concentrations', template: 'sheet/spellbook',
      context: spellbook({ concentration: { save: 5, spells: [
         { effectId: 'e1', itemId: 'SpiritGuardians', name: 'Spirit Guardians', img: ICON('#c9a227'), sub: '3rd Level' },
         { effectId: 'e2', itemId: '', name: 'Concentrating on Something Long Without Its Spell', img: ICON('#5a2a6a'), sub: '' }
      ] } })
   },
   { name: 'spellbook-empty', template: 'sheet/spellbook', context: spellbook({ classes: [], sections: [], concentration: { save: 2, spells: [] } }) },
   { name: 'inventory', template: 'sheet/inventory', context: inventory(), rows: '.fhcs-list-bar, .fhcs-item-row' },
   { name: 'inventory-editing-parity', template: 'sheet/inventory', context: inventory({ editing: true }), rows: '.fhcs-list-bar, .fhcs-item-row', sameRowsAs: 'inventory' },
   { name: 'inventory-all-columns', template: 'sheet/inventory', context: inventory({ columns: ALL_COLUMNS }) },
   { name: 'inventory-editing', template: 'sheet/inventory', open: ['inventory-columns'], context: inventory({ editing: true, columns: ALL_COLUMNS }) },
   // A category of the player's own, moved first (SCOPE §4.13): edit mode's arrows, the first's up arrow off.
   { name: 'inventory-categories', template: 'sheet/inventory', context: inventory({ editing: true, columns: ALL_COLUMNS, order: ['custom-ritual-kit'],
      sections: [{ id: 'custom-ritual-kit', label: 'Ritual Kit', custom: true, items: [gear('Holy Symbol', '#c9a227', { weight: '1 lb' }), gear('Incense', '#7a5a3a', { quantity: 5 })] },
         ...inventoryFacts().sections] }) },
   {
      name: 'inventory-few-columns', template: 'sheet/inventory',
      context: inventory({ columns: { uses: false, usage: false, quantity: false, equipped: true, attuned: false }, encumbrance: null })
   },
   { name: 'inventory-containers-shut', template: 'sheet/inventory', context: inventory({ openContainers: [], editing: true, columns: ALL_COLUMNS }) },
   // Folded sections (user, 2026-10-28): the heading stays, its rows hide; a spell level's pips stay in its heading.
   { name: 'inventory-folded', template: 'sheet/inventory', context: inventory({ folded: ['inventory:weapons'] }) },
   { name: 'spellbook-folded', template: 'sheet/spellbook', context: spellbook({ folded: ['spells:spell0', 'spells:spell1'] }) },
   { name: 'features-folded', template: 'sheet/features', context: features({ folded: ['features:cleric'] }) },
   { name: 'effects-folded', template: 'sheet/effects', context: effects({ folded: ['effects:temporary'] }) },
   { name: 'inventory-empty', template: 'sheet/inventory', context: inventory({ sections: [], attunement: { value: 0, max: 0 }, encumbrance: null }) },
   { name: 'attributes', template: 'sheet/attributes', context: attributes(), rows: '.fhcs-skills > li, .fhcs-trait-row', marks: '.fhcs-skill-name, .fhcs-skill-mod',
      align: [['.fhcs-attributes-side .fhcs-panel-head', 'top', '.fhcs-traits-panel .fhcs-group-head', 'top'], ['.fhcs-attributes-side .fhcs-panel-head', 'bottom', '.fhcs-traits-panel .fhcs-group-head', 'bottom']] },
   { name: 'attributes-folded', template: 'sheet/attributes', context: attributes({ folded: ['inventory', 'spell-1', 'traits'] }),
      // The traits heading sits on the Skills heading's line, folded or open (user, 2026-10-27).
      align: [['.fhcs-attributes-side .fhcs-panel-head', 'top', '.fhcs-traits-panel .fhcs-group-head', 'top'], ['.fhcs-attributes-side .fhcs-panel-head', 'bottom', '.fhcs-traits-panel .fhcs-group-head', 'bottom']] },
   { name: 'attributes-editing', template: 'sheet/attributes', context: attributes({ editing: true }), rows: '.fhcs-skills > li, .fhcs-trait-row', marks: '.fhcs-skill-name, .fhcs-skill-mod', sameRowsAs: 'attributes' },
   { name: 'attributes-resource-tray', template: 'sheet/attributes', open: ['resource-primary'], context: attributes({ editing: true }) },
   { name: 'attributes-ability-tray', template: 'sheet/attributes', open: ['skill-ability-ath'], context: attributes({ editing: true }) },
   { name: 'attributes-empty', template: 'sheet/attributes', context: attributes({ favorites: [], resources: [], traits: [] }) },
   { name: 'tabs', template: 'sheet/tabs', context: tabs({ canEdit: true, editing: false }) },
   { name: 'tabs-editing', template: 'sheet/tabs', context: tabs({ canEdit: true, editing: true }) },
   { name: 'tabs-bank', template: 'sheet/tabs', context: tabs({ canEdit: true, editing: false }, 'bank'), rows: '.fhcs-tabs' },
   { name: 'tabs-bank-editing', template: 'sheet/tabs', context: tabs({ canEdit: true, editing: true }, 'bank'), rows: '.fhcs-tabs', sameRowsAs: 'tabs-bank' },
   { name: 'tabs-bank-big', template: 'sheet/tabs', context: tabs({ canEdit: true, editing: false }, 'big') },
   { name: 'tabs-inspiration-tray', template: 'sheet/tabs', context: tabs({ canEdit: true, editing: true }, 'bank'), open: ['inspiration'] },
   { name: 'tabs-bank-tray', template: 'sheet/tabs', context: tabs({ canEdit: true, editing: false }, 'big'), open: ['inspiration-bank'] },
   { name: 'tabs-observer', template: 'sheet/tabs', context: tabs({ canEdit: false, editing: false }, 'bank') },
   { name: 'title-theme-tray', template: 'sheet/tabs', context: tabs({ canEdit: true, editing: false }), titleBar: titleBarPick, titleTray: titleTrayOpen },
   { name: 'special-traits', html: SPECIAL_TRAITS },
   { name: 'header', template: 'sheet/header', context: header(), align: HEADER_ALIGN, rows: '.fhcs-header, .fhcs-ability' },
   { name: 'header-tall-art', template: 'sheet/header', context: header({ portrait: { src: TALL, isVideo: false } }) },
   { name: 'header-inspired', template: 'sheet/header', context: header({ inspiration: true, exhaustion: { value: 2, max: 6 } }) },
   {
      name: 'header-milestones', template: 'sheet/header', open: ['milestones'],
      context: header({ ...MULTICLASS, name: 'Kira Ashvale of the Long Road, Keeper of the Ember Gate' })
   },
   { name: 'header-exhaustion-open', template: 'sheet/header', open: ['exhaustion'], context: header({ exhaustion: { value: 3, max: 6 } }) },
   { name: 'header-dying', template: 'sheet/header', context: header({ hp: { value: 0, max: 87, temp: 0 }, death: { success: 1, failure: 2 } }) },
   { name: 'header-square-art', template: 'sheet/header', context: header({ portrait: { src: SQUARE, isVideo: false } }) },
   // Round, the player's choice (user, 2026-10-27): square art in a circle; the token art fixture is round by default.
   // A token in round mode shows whole; the card's edge steps back around the art (user, 2026-10-28).
   { name: 'header-round-token', template: 'sheet/header', context: header({ portrait: { src: SQUARE, isVideo: false, token: true }, shape: 'round', exhaustion: { value: 2, max: 6 } }), align: HEADER_ALIGN },
   { name: 'header-round-art', template: 'sheet/header', context: header({ portrait: { src: SQUARE, isVideo: false }, shape: 'round' }), align: HEADER_ALIGN },
   // Aid on: temp HP and a temporary change to max (Max ±), so both fields hold a value.
   { name: 'header-max-mod', template: 'sheet/header', context: header({ hp: { value: 82, max: 92, temp: 5, tempmax: 5 } }) },
   {
      name: 'header-level-down', template: 'sheet/header', open: ['level-up'],
      context: { ...header({ originCards: originFacts({ editing: true, classes: [
         { ...originDoc('Cleric', '#c9a227'), identifier: 'cleric', level: 17, subclass: originDoc('Life Domain', '#3a8a5a'), needsSubclass: false },
         { ...originDoc('Fighter', '#7a2e2e'), identifier: 'fighter', level: 3, subclass: originDoc('Champion', '#8a3a2a'), needsSubclass: false }
      ] }) }), editable: true }
   },
   // Edit mode (SCOPE §4.9): name and scores as fields, gears, the AC window, the Token switch.
   { name: 'header-editing', template: 'sheet/header', context: { ...header({ originCards: originFacts({ editing: true }) }), editable: true }, align: HEADER_ALIGN, rows: '.fhcs-header, .fhcs-ability', sameRowsAs: 'header' },
   { name: 'header-editing-tall', template: 'sheet/header', context: { ...header({ portrait: { src: TALL, isVideo: false }, originCards: FOUR_CLASSES({ editing: true }) }), editable: true } },
   {
      name: 'header-editing-multiclass', template: 'sheet/header', open: ['level-up'],
      context: { ...header({ ...MULTICLASS, leveling: 'xp', originCards: originFacts({ ...MULTICLASS.originCards, editing: true, xp: { value: 6500, max: 14000 } }) }), editable: true }
   },
   // Framing (user, 2026-10-27): positioning in edit mode; a framed painting in play (zoom 2, focus low).
   { name: 'header-framing', template: 'sheet/header', context: { ...header({ portrait: { src: TALL, isVideo: false, framing: true } }), editable: true } },
   { name: 'header-framed', template: 'sheet/header', context: header({ portrait: { src: TALL, isVideo: false }, frame: { src: TALL, x: 50, y: 60, zoom: 2 } }) },
   // The HP tray open from the bar, Aid on (user, 2026-10-27); and a viewer's bar, which opens nothing.
   { name: 'header-hp-tray', template: 'sheet/header', open: ['hp'], context: header({ hp: { value: 82, max: 92, temp: 5, tempmax: 5 } }) },
   // Four classes: two cards, "+2" opens the class tray (user, 2026-10-27).
   // Every card's first line sits level, the "+N" card's too (user's screenshot, 2026-10-27).
   { name: 'header-four-classes', template: 'sheet/header', context: header({ originCards: FOUR_CLASSES() }),
      align: [1, 2, 3].map((n) => ['.fhcs-cards > :nth-child(1) .fhcs-origin-line', 'top', `.fhcs-cards > :nth-child(${n + 1}) .fhcs-origin-line`, 'top']) },
   { name: 'header-classes-open', template: 'sheet/header', open: ['classes'], context: header({ originCards: FOUR_CLASSES() }) },
   { name: 'header-classes-editing', template: 'sheet/header', open: ['classes'], context: header({ originCards: FOUR_CLASSES({ editing: true }) }) },
   {
      name: 'header-level-up', template: 'sheet/header', open: ['level-up'],
      context: header({ xp: { value: 14200, max: 14000, pct: 100, valueLabel: '14,200', maxLabel: '14,000' },
         originCards: originFacts({ xp: { value: 14200, max: 14000 }, editing: true }) })
   },
   { name: 'header-viewer', template: 'sheet/header', context: header({ editable: false, originCards: originFacts({ canEdit: false, origins: [{ kind: 'species', item: null }, { kind: 'background', item: null }] }) }) },
   {
      name: 'card-attack-full-side',
      template: 'chat/usage-card',
      frame: 'chat',
      context: rolledAttack(attack({
         total: 10, natural: 2, isCritical: false, sides: ['adv', 'dis', 'dis', 'dis', 'dis', 'dis'],
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
   // What Apply did, kept on the card (user, 2026-10-28): split damage, one type, none, an effect, a long name.
   { name: 'card-applied', template: 'chat/usage-card', frame: 'chat', context: (() =>
   {
      const context = rolledAttack(attack(), [], damage());
      context.fhcs.appliedHeading = 'Applied';
      context.fhcs.applied = appliedLines([
         { kind: 'damage', who: 'Dire Wolf', amount: 15, temp: 0, parts: [{ type: 'slashing', label: 'Slashing', value: 9 }, { type: 'radiant', label: 'Radiant', value: 6 }] },
         { kind: 'damage', who: 'Dire Wolf 2', amount: 9, temp: 0, parts: [{ type: 'slashing', label: 'Slashing', value: 9 }] },
         { kind: 'damage', who: 'Skeleton', amount: 0, temp: 0, parts: [{ type: 'poison', label: 'Poison', value: 0 }] },
         { kind: 'effect', who: 'Grimgrollo the Unnecessarily Long-Named Ogre', name: 'Bless' }
      ], format);
      return context;
   })() },
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
         total: 26, natural: 18, isCritical: false, advantageMode: 1, 
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

// The four themes (SCOPE §4.11): the header, Attributes and Spellbook in each, light and dark, every width; `look` sets
// the sheet's data-fhcs-theme.
export const LOOKS = ['forge', 'wind', 'sand', 'valley'];
for (const look of LOOKS)
{
   CASES.push({ name: `theme-${look}-header`, template: 'sheet/header', look,
      context: header({ portrait: { src: TALL, isVideo: false }, originCards: FOUR_CLASSES() }) });
   CASES.push({ name: `theme-${look}-header-round`, template: 'sheet/header', look,
      context: header({ portrait: { src: SQUARE, isVideo: false }, shape: 'round' }) });
   for (const name of ['attributes', 'spellbook', 'inventory', 'tabs', 'tabs-editing'])
   {
      const base = CASES.find((c) => c.name === name);
      CASES.push({ ...base, name: `theme-${look}-${name}`, look, sameRowsAs: undefined });
   }
}

// Fire and Forge, the whole sheet (user, 2026-10-28: "finish the sheet ... trays, tabs, and anything we've missed"):
// every tab, edit mode, and each tray open.
for (const name of ['features', 'effects', 'biography', 'attributes-editing', 'attributes-resource-tray', 'inventory-editing',
   'spellbook-editing', 'features-editing', 'inventory-categories', 'title-theme-tray', 'tabs-bank-big', 'tabs-inspiration-tray', 'tabs-bank-tray', 'header-editing', 'header-hp-tray', 'header-exhaustion-open',
   'header-level-up', 'header-classes-open', 'header-milestones'])
{
   const base = CASES.find((c) => c.name === name);
   CASES.push({ ...base, name: `theme-forge-${name}`, look: 'forge', sameRowsAs: undefined });
}

// A character with no resource set (the user's Cúán, 2026-10-28): play shows no Resources group, edit mode all three
// panels; and a character with four classes; each must keep the rows above from moving between modes.
const NO_RESOURCES = ['primary', 'secondary', 'tertiary'].map((key) => ({ key, link: null, label: '', value: 0, max: 0, sourceMax: 0, sr: false, lr: false, periods: null }));
CASES.push({ ...CASES.find((c) => c.name === 'attributes'), name: 'attributes-no-resources', context: attributes({ resources: NO_RESOURCES }) });
CASES.push({ ...CASES.find((c) => c.name === 'attributes-editing'), name: 'attributes-no-resources-editing', context: attributes({ resources: NO_RESOURCES, editing: true }), sameRowsAs: 'attributes-no-resources' });
CASES.push({ name: 'header-four-classes-play', template: 'sheet/header', context: header({ originCards: FOUR_CLASSES() }), rows: '.fhcs-header, .fhcs-ability' });
CASES.push({ name: 'header-four-classes-editing', template: 'sheet/header', context: { ...header({ originCards: FOUR_CLASSES({ editing: true }) }), editable: true }, rows: '.fhcs-header, .fhcs-ability', sameRowsAs: 'header-four-classes-play' });

// Play and edit mode must match row for row in Forge too (rule 6; user, 2026-10-28: "toggling edit mode causes the
// sheet to jump around again"): each play/edit pair again, themed.
for (const c of CASES.filter((x) => x.sameRowsAs && !x.look))
{
   for (const name of [c.sameRowsAs, c.name])
   {
      if (CASES.some((x) => x.name === `forge-parity-${name}`)) { continue; }
      const base = CASES.find((x) => x.name === name);
      CASES.push({ ...base, name: `forge-parity-${name}`, look: 'forge', sameRowsAs: base.sameRowsAs ? `forge-parity-${base.sameRowsAs}` : undefined });
   }
}

// The item sheet (SCOPE §4.13): a weapon, a spell and a feature, each as a viewer reads it and as its owner edits it;
// a long name at 500px.
const ITEM_TABS = Object.fromEntries(['description', 'details', 'activities', 'effects']
   .map((id, i) => [id, { id, label: ['Description', 'Details', 'Activities', 'Effects'][i], active: id === 'description' }]));
// dnd5e's own inputs, as Foundry draws a field's choices (compat's `fieldInput`).
const SELECT = (name, values) => `<select name="${name}">${values.map((v) => `<option value="${v}">${v}</option>`).join('')}</select>`;
const ITEMS = {
   weapon: { type: 'weapon', name: 'Sun Blade', nameField: 'name', img: ICON('#c9a227'), editable: true, concealed: false,
      subtitles: ['Martial Melee', 'Rare', 'DMG 2024'], typeLabel: 'Weapon',
      toggles: [{ key: 'equipped', on: true }, { key: 'attuned', on: true }, { key: 'identified', on: true }],
      physical: { quantity: 1, weight: 3, weightUnit: 'lb', weightUnitInput: SELECT('system.weight.units', ['lb', 'kg']),
         price: { value: 12000, unit: 'gp', unitInput: SELECT('system.price.denomination', ['gp', 'sp', 'cp']) } }, uses: null, spell: null,
      headerFields: [{ key: 'rarities', label: 'Rarity', value: 'Rare', input: SELECT('system.rarities', ['Common', 'Uncommon', 'Rare']) }],
      descriptions: [{ key: 'unidentified', label: 'Unidentified Description', name: 'system.unidentified.description', source: '', enriched: '<p>A sword hilt with no blade.</p>' },
         { key: 'chat', label: 'Chat Description', name: 'system.description.chat', source: '', enriched: '' }],
      tags: ['Finesse', 'Versatile', 'Magical'], category: 'Sun relics', categoryField: 'flags.fhcs.section',
      description: { name: 'system.description.value', source: '', enriched: '<p>This item appears to be a longsword hilt. While grasping the hilt, you can take a Bonus Action to cause a blade of pure radiance to spring into existence.</p><p>You gain a +2 bonus to attack rolls and damage rolls made with this weapon.</p>' },
      uuid: 'Actor.a.Item.sun' },
   spell: { type: 'spell', name: 'Spirit Guardians', nameField: 'name', img: ICON('#7fb0ec'), editable: true, concealed: false,
      subtitles: [], typeLabel: 'Spell', toggles: [{ key: 'prepared', on: true }], physical: null, uses: null,
      spell: { level: '3rd Level', school: 'Conjuration', components: 'V, S, M', concentration: true, ritual: false,
         time: '1 Action', range: 'Self (15 ft)', duration: 'Up to 10 minutes', target: '', materials: 'A prayer scroll' },
      tags: ['Concentration'], category: '', categoryField: 'flags.fhcs.section',
      description: { name: 'system.description.value', source: '', enriched: '<p>Protective spirits flit around you in a 15-foot Emanation for the duration.</p>' },
      uuid: 'Actor.a.Item.sg' },
   feature: { type: 'feat', name: 'Second Wind', nameField: 'name', img: ICON('#c96a3a'), editable: true, concealed: false,
      subtitles: ['Fighter 1', 'Class Feature'], typeLabel: 'Feature', toggles: [], physical: null,
      uses: { value: 2, max: 3, recovery: 'Short Rest, Long Rest' }, spell: null, tags: [], category: '', categoryField: 'flags.fhcs.section',
      description: { name: 'system.description.value', source: '', enriched: '' }, uuid: 'Actor.a.Item.sw' }
};
// A class, a species and a background, as dnd5e's SRD writes them (user's screenshots, 2026-10-29): a traits table and
// headings; the species' info row; bold lead-ins.
const LONG = { nameField: 'name', editable: true, concealed: false, toggles: [], physical: null, uses: null, spell: null, tags: [], category: '',
   categoryField: 'flags.fhcs.section', headerFields: [], descriptions: [] };
ITEMS.class = { ...LONG, type: 'class', name: 'Cleric', img: ICON('#5b8fd6'), subtitles: ['Class'], typeLabel: 'Class', levels: 1, uuid: 'Item.cleric',
   description: { name: 'system.description.value', source: '', enriched: '<h3>Core Cleric Traits</h3><table><tbody>'
      + '<tr><th>Primary Ability</th><td>Wisdom</td></tr><tr><th>Hit Point Die</th><td>D8 per Cleric level</td></tr>'
      + '<tr><th>Saving Throw Proficiencies</th><td>Wisdom and Charisma</td></tr><tr><th>Skill Proficiencies</th><td><em>Choose 2:</em> History, Insight, Medicine, Persuasion, or Religion</td></tr>'
      + '<tr><th>Starting Equipment</th><td><em>Choose A or B:</em> (A) <a class="content-link">Chain Shirt</a>, <a class="content-link">Shield</a>, <a class="content-link">Mace</a>; or (B) 110 GP</td></tr></tbody></table>'
      + '<blockquote><p><em>A Miraculous Priest of Divine Power</em></p></blockquote><p>Clerics draw power from the realms of the gods and harness it to work miracles.</p>' } };
ITEMS.species = { ...LONG, type: 'race', name: 'Dwarf', img: ICON('#a0703a'), subtitles: ['Species'], typeLabel: 'Species', uuid: 'Item.dwarf',
   info: [{ label: 'Creature Type', value: 'Humanoid (Dwarf)', config: 'type', tip: 'Configure creature type' },
      { label: 'Movement', value: '<span class="key">Speed</span> <span class="value">30</span>', config: 'movement', tip: 'Configure movement' },
      { label: 'Senses', value: '<span class="key">Darkvision</span> <span class="value">120</span>', config: 'senses', tip: 'Configure senses' }],
   description: { name: 'system.description.value', source: '', enriched: '<h3>Dwarf Traits</h3><p><strong>Creature Type:</strong> Humanoid</p><p><strong>Size:</strong> Medium (about 4–5 feet tall)</p>'
      + '<p><strong>Darkvision.</strong> You have Darkvision with a range of 120 feet.</p>' } };
ITEMS.background = { ...LONG, type: 'background', name: 'Criminal', img: ICON('#8a5a3c'), subtitles: ['Background'], typeLabel: 'Background', uuid: 'Item.criminal',
   description: { name: 'system.description.value', source: '', enriched: '<p><strong>Ability Scores:</strong> Dexterity, Constitution, Intelligence</p><p><strong>Feat:</strong> <a class="content-link">Alert</a></p>'
      + '<p>You eked out a living in dark alleyways, cutting purses or burgling shops.</p>' } };
const itemSheet = (kind, { editing = false, ...over } = {}) =>
{
   // No lock (SCOPE §4.13): an owner always edits, a viewer only reads; "editing" here is the owner's sheet.
   const view = itemSheetView({ ...ITEMS[kind], editable: editing, editing, ...over }, { localize, format });
   const tab = { id: 'description', group: 'primary', cssClass: 'active' };
   return template('item/header')({ fhcsItem: view })
      + template('sheet/tabs')({ fhcsTabs: tabRow(ITEM_TABS, { canEdit: false, editing }, localize, {}, []) })
      + `<div class="tab-body">${template('item/description')({ fhcsItem: view, tab })}</div>`;
};
for (const kind of Object.keys(ITEMS))
{
   CASES.push({ name: `item-${kind}`, frame: 'item', html: itemSheet(kind), rows: '.fhcs-item-header, .fhcs-tabs, .fhcs-item-prop' });
   // No lock, so no play-and-edit pair (SCOPE §5.4 rule 3): an owner's sheet holds fields a viewer's doesn't.
   CASES.push({ name: `item-${kind}-editing`, frame: 'item', html: itemSheet(kind, { editing: true }) });
   CASES.push({ name: `theme-forge-item-${kind}-editing`, frame: 'item', look: 'forge', html: itemSheet(kind, { editing: true }) });
   CASES.push({ name: `theme-forge-item-${kind}`, frame: 'item', look: 'forge', html: itemSheet(kind) });
}
CASES.push({ name: 'item-long-name', frame: 'item', html: itemSheet('weapon', { name: 'Sun Blade of the Dawnwarden, Twice-Forged in the Ember Halls' }) });

// Chat cards in the world's theme (SCOPE §5.3 rule 10): every card case again in Forge.
for (const base of CASES.filter((c) => c.frame === 'chat' && !c.look))
{
   CASES.push({ ...base, name: `theme-forge-${base.name}`, look: 'forge' });
}

// Fire and Forge's hearth follows HP (SCOPE §4.11): bloodied and down, beside the full cases above.
for (const [state, hp] of [['bloodied', 0.4], ['down', 0]])
{
   const base = CASES.find((c) => c.name === 'attributes');
   CASES.push({ ...base, name: `theme-forge-attributes-${state}`, look: 'forge', hp, sameRowsAs: undefined });
}
