/**
 * Checks our pure functions offline: what a roll's outcome says, and how a usage card splits dnd5e's buttons.
 * Usage: npm run unit (also part of npm run check)
 */
import { deepStrictEqual } from 'node:assert';
import { describeRoll } from '../src/chat/outcome.js';
import { cardParts, damageBand, saveRow } from '../src/chat/card.js';
import { countingDie, d20Row, modeForSides } from '../src/chat/d20.js';
import { diceMath } from '../src/chat/math.js';
import { attributesView } from '../src/sheet/attributes.js';
import { healUpdates, keepStable } from '../src/sheet/death.js';
import { columnChoice, inventoryView } from '../src/sheet/inventory.js';
import { canCast, prepState, spellbookView, spellColumnChoice, spellKind } from '../src/sheet/spellbook.js';
import { featureColumnChoice, featuresView, groupingOf } from '../src/sheet/features.js';
import { effectsView } from '../src/sheet/effects.js';
import { pinView } from '../src/sheet/lists.js';
import { headerMinWidth, headerView, levelOrder, levelTrack, signed, tabRow } from '../src/sheet/header.js';
import { format, localize } from './templates.mjs';

const facts = (over) => ({
   kind: 'save', who: 'Kira', what: 'Wisdom Saving Throw', total: 14, natural: 11, target: 15,
   showResult: true, success: false, isCritical: false, targets: [], ...over
});

const CASES = [
   ['failure against a DC', facts({}), { verdict: 'failure', details: ['Failure vs DC 15'] }],
   ['success against a DC', facts({ total: 15, success: true }), { verdict: 'success', details: ['Success vs DC 15'] }],
   ['DC hidden from this player', facts({ showResult: false }), { verdict: null, details: [] }],
   ['no DC', facts({ target: null, success: null }), { verdict: null, details: [] }],
   ['natural 20 still fails', facts({ natural: 20 }), { verdict: 'failure', details: ['Failure vs DC 15', 'Natural 20'] }],
   ['natural 1', facts({ natural: 1, success: true }), { verdict: 'success', details: ['Success vs DC 15', 'Natural 1'] }],
   [
      'attack: critical hit, hits and misses',
      facts({
         kind: 'attack', target: null, success: null, natural: 20, isCritical: true,
         targets: [{ name: 'Goblin', isMiss: false }, { name: 'Orc', isMiss: true }, { name: 'Wolf', isMiss: false }]
      }),
      { verdict: null, details: ['Natural 20', 'Critical hit', 'Hits Goblin, Wolf', 'Misses Orc'] }
   ],
   ['a save never says critical hit', facts({ isCritical: true }), { verdict: 'failure', details: ['Failure vs DC 15'] }]
];

const problems = [];
for (const [name, input, expected] of CASES)
{
   const { verdict, details } = describeRoll(input, format);
   try { deepStrictEqual({ verdict, details }, expected); }
   catch { problems.push(`${name}: got ${JSON.stringify({ verdict, details })}, expected ${JSON.stringify(expected)}`); }
}

// Usage card: which of dnd5e's buttons become bands, in dnd5e's order, and what each says.
const PART_CASES = [
   [
      'attack: two bands',
      [{ action: 'rollAttack', index: 0, label: 'DND5E.Attack' }, { action: 'rollDamage', index: 1, label: 'DND5E.Damage' }],
      { bands: ['attack:Attack:Roll attack:0', 'damage:Damage:Roll damage:1'], others: [] }
   ],
   [
      'save keeps its own words; other actions stay buttons',
      [
         { action: 'rollSave', index: 0, label: 'DC 15 Dexterity Saving Throw' },
         { action: 'rollDamage', index: 1, label: 'DND5E.Damage' },
         { action: 'placeTemplate', index: 2, label: 'Place Template' }
      ],
      { bands: ['save:Save:DC 15 Dexterity Saving Throw:0', 'damage:Damage:Roll damage:1'], others: ['placeTemplate:2'] }
   ],
   [
      'hidden buttons are left out',
      [{ action: 'rollAttack', index: 0, label: 'DND5E.Attack', hidden: true }, { action: 'consumeResource', index: 1, label: 'x', hidden: true }],
      { bands: [], others: [] }
   ],
   [
      'healing is a damage band',
      [{ action: 'rollHealing', index: 0, label: 'DND5E.Healing' }],
      { bands: ['damage:Healing:Roll healing:0'], others: [] }
   ]
];
for (const [name, buttons, expected] of PART_CASES)
{
   const { bands, others } = cardParts(buttons, localize);
   const got = {
      bands: bands.map((b) => `${b.kind}:${b.heading}:${b.text}:${b.index}`),
      others: others.map((o) => `${o.action}:${o.index}`)
   };
   try { deepStrictEqual(got, expected); }
   catch { problems.push(`${name}: got ${JSON.stringify(got)}, expected ${JSON.stringify(expected)}`); }
}

// d20 row: primary center, disadvantage left, advantage right; '*' marks the die that counts.
const r = (result, counts = true) => ({ result, active: counts, discarded: !counts });
const ROW_CASES = [
   ['normal', [r(12)], 0, undefined, '| 12* |'],
   ['advantage from dnd5e', [r(12, false), r(15)], 1, undefined, '| 12 | 15*'],
   ['disadvantage from dnd5e', [r(12, false), r(4)], -1, undefined, '4* | 12 |'],
   ['Elven Accuracy', [r(12, false), r(15, false), r(18)], 1, undefined, '| 12 | 15 18*'],
   ['both sides recorded: they cancel, primary counts', [r(12), r(15, false), r(4, false)], 0, ['adv', 'dis'], '4 | 12* | 15'],
   ['Halfling Lucky replaces a rerolled 1', [{ result: 1, active: false, rerolled: true }, r(9)], 0, undefined, '| 9* |']
];
const showRow = ({ left, center, right }) =>
{
   const die = (d) => `${d.value}${d.counts ? '*' : ''}`;
   return `${left.map(die).join(' ')} | ${center ? die(center) : ''} | ${right.map(die).join(' ')}`.trim();
};
for (const [name, results, mode, sides, expected] of ROW_CASES)
{
   const got = showRow(d20Row(results, mode, sides));
   if (got !== expected) { problems.push(`d20 row, ${name}: got "${got}", expected "${expected}"`); }
}

// Late adds: which die counts, by click order, and the mode dnd5e records.
const KEEP_CASES = [
   ['no extra dice', [12], [], 0, 0],
   ['advantage takes the higher', [12, 15], ['adv'], 1, 1],
   ['advantage keeps the primary when it is higher', [18, 3], ['adv'], 0, 1],
   ['disadvantage takes the lower', [12, 4], ['dis'], 1, -1],
   ['Elven Accuracy: highest of three', [12, 15, 18], ['adv', 'adv'], 2, 1],
   ['advantage then disadvantage: the later click decides', [12, 19, 2], ['adv', 'dis'], 2, -1],
   ['disadvantage then advantage: the later click decides', [12, 2, 19], ['dis', 'adv'], 2, 1],
   ['disadvantage lower than the counting die takes over', [12, 19, 15], ['adv', 'dis'], 2, -1],
   ['a disadvantage die that rolls higher changes nothing', [12, 4, 9], ['dis', 'dis'], 1, -1],
   ['a tie keeps the die already counting', [15, 15], ['adv'], 0, 1]
];
for (const [name, values, sides, keep, mode] of KEEP_CASES)
{
   const got = [countingDie(values, sides), modeForSides(sides)];
   if (got[0] !== keep || got[1] !== mode) { problems.push(`late adds, ${name}: got die ${got[0]}, mode ${got[1]}; expected die ${keep}, mode ${mode}`); }
}

// Damage band: words, totals by type, and the critical switch.
const dmg = (over) => ({ healing: false, critical: false, total: 12, parts: [{ type: 'fire', label: 'Fire', total: 12 }], math: [],
   onSave: '', ...over });
const DAMAGE_CASES = [
   ['plain, no attack on the card', dmg({}), {}, { words: [], parts: ['Fire'], extra: [] }],
   ['plain, card has an attack', dmg({}), { canCrit: true }, { words: [], parts: ['Fire'], extra: ['damageCritical'] }],
   ['critical', dmg({ critical: true }), { canCrit: true }, { words: ['Critical: dice doubled'], parts: ['Fire'], extra: ['damageNormal'] }],
   ['half on a save', dmg({ onSave: 'Half Damage' }), {}, { words: ['On a save: Half Damage'], parts: ['Fire'], extra: [] }],
   [
      'two types',
      dmg({ total: 15, parts: [{ type: 'slashing', label: 'Slashing', total: 9 }, { type: 'fire', label: 'Fire', total: 6 }] }),
      {},
      { words: [], parts: ['9 Slashing', '6 Fire'], extra: [] }
   ]
];
for (const [name, facts, options, expected] of DAMAGE_CASES)
{
   const band = damageBand(facts, [], format, options);
   const got = { words: band.words, parts: band.parts.map((p) => p.text), extra: band.extra.map((e) => e.action) };
   try { deepStrictEqual(got, expected); }
   catch { problems.push(`damage band, ${name}: got ${JSON.stringify(got)}, expected ${JSON.stringify(expected)}`); }
}

// Save rows: the verdict as one word; the rest of the outcome stays in the opened row.
const saveFacts = (over) => ({ ...facts({}), dice: [{ result: 11, active: true }], advantageMode: 0, sides: [], spare: null,
   formula: '1d20 + 3', math: '11 + 3', canResist: false, messageId: 'm1', ...over });
const SAVE_CASES = [
   ['failure', saveFacts({}), { verdict: 'failure', verdictWord: 'Failure', words: [] }],
   ['success, natural 20', saveFacts({ total: 23, natural: 20, success: true }), { verdict: 'success', verdictWord: 'Success', words: ['Natural 20'] }],
   ['DC hidden from this player', saveFacts({ showResult: false }), { verdict: null, verdictWord: '', words: [] }]
];
for (const [name, input, expected] of SAVE_CASES)
{
   const { verdict, verdictWord, words } = saveRow(input, format);
   try { deepStrictEqual({ verdict, verdictWord, words }, expected); }
   catch { problems.push(`save row, ${name}: got ${JSON.stringify({ verdict, verdictWord, words })}, expected ${JSON.stringify(expected)}`); }
}

// Dice math: every die shown, never a dice term collapsed to its total.
const die = (value, counts = true) => ({ value, counts });
const MATH_CASES = [
   ['2d8 + 0 shows both dice', [{ dice: [die(3), die(2)] }, { op: '+' }, { value: 0 }], '(3 + 2) + 0', []],
   ['one die needs no brackets', [{ dice: [die(7)] }, { op: '+' }, { value: 5 }], '7 + 5', []],
   ['advantage: the counting d20 only', [{ dice: [die(12, false), die(15)] }, { op: '+' }, { value: 5 }], '15 + 5', [12]],
   ['a rerolled 1 is listed, not added', [{ dice: [die(1, false), die(6), die(4)] }], '(6 + 4)', [1]],
   ['a penalty die', [{ dice: [die(14)] }, { op: '+' }, { value: 3 }, { op: '-' }, { dice: [die(2)] }], '14 + 3 - 2', []],
   ['a bracketed group', [{ group: [{ dice: [die(4), die(5)] }, { op: '+' }, { value: 2 }] }, { op: '*' }, { value: 2 }], '((4 + 5) + 2) * 2', []]
];
for (const [name, terms, sum, dropped] of MATH_CASES)
{
   const got = diceMath(terms);
   try { deepStrictEqual(got, { sum, dropped }); }
   catch { problems.push(`dice math, ${name}: got ${JSON.stringify(got)}, expected ${JSON.stringify({ sum, dropped })}`); }
}

// Milestone track: class levels in the order gained; unrecorded levels follow, original class first.
const cls = (id, levels) => ({ id, name: id, levels, img: `${id}.svg` });
const ORDER_CASES = [
   ['recorded order kept', ['c', 'f', 'f', 'c'], [cls('c', 2), cls('f', 2)], 'c', ['c', 'f', 'f', 'c']],
   ['nothing recorded: original class first', [], [cls('f', 3), cls('c', 9)], 'c', [...Array(9).fill('c'), 'f', 'f', 'f']],
   ['a new level appended', ['c', 'f'], [cls('c', 2), cls('f', 1)], 'c', ['c', 'f', 'c']],
   ['a level removed drops its latest entry', ['c', 'f', 'c', 'f'], [cls('c', 2), cls('f', 1)], 'c', ['c', 'f', 'c']],
   ['a class removed', ['c', 'w', 'c'], [cls('c', 2)], 'c', ['c', 'c']]
];
for (const [name, order, classes, original, expected] of ORDER_CASES)
{
   const got = levelOrder(order, classes, original);
   try { deepStrictEqual(got, expected); }
   catch { problems.push(`level order, ${name}: got ${JSON.stringify(got)}, expected ${JSON.stringify(expected)}`); }
}
{
   const track = levelTrack([cls('c', 2), cls('f', 1)], ['c', 'f', 'c'], 'c', format);
   const got = { pips: track.pips.length, filled: track.pips.filter((p) => p.filled).map((p) => p.img), third: track.pips[2].label, fourth: track.pips[3].label };
   const expected = { pips: 20, filled: ['c.svg', 'f.svg', 'c.svg'], third: 'Level 3: c 2', fourth: 'Level 4: not reached' };
   try { deepStrictEqual(got, expected); }
   catch { problems.push(`milestone track: got ${JSON.stringify(got)}, expected ${JSON.stringify(expected)}`); }
}
for (const [n, text] of [[3, '+3'], [0, '+0'], [-1, '\u22121']])
{
   if (signed(n) !== text) { problems.push(`signed(${n}) is ${signed(n)}, not ${text}`); }
}
// Tab row: Classic's order and names; Special Traits only in edit mode.
{
   const dnd5eTabs = Object.fromEntries(['details', 'inventory', 'features', 'spells', 'effects', 'specialTraits']
      .map((id) => [id, { id, label: id, active: id === 'inventory' }]));
   const ids = (editing) => tabRow(dnd5eTabs, { canEdit: true, editing }, localize).tabs.map((t) => t.id).join();
   const play = ids(false);
   const edit = ids(true);
   if (play !== 'details,inventory,spells,features,effects') { problems.push(`tab row in play: ${play}`); }
   if (edit !== 'details,inventory,spells,features,effects,specialTraits') { problems.push(`tab row in edit mode: ${edit}`); }
   const names = tabRow(dnd5eTabs, { canEdit: true, editing: false }, localize).tabs.map((t) => t.label);
   if (names[0] !== 'Attributes' || names[2] !== 'Spellbook') { problems.push(`tab names: ${names.join()}`); }
}

// Attributes: key passives, empty traits hidden in play, favorites grouped in Classic's order with slot pips.
{
   const skill = (key, prof) => ({ key, label: key, abbr: 'Wis', total: 2, passive: 12, prof });
   const row = (title, group, level = null) => ({ id: title, title, group, level, uses: null, quantity: 0, state: null });
   const facts = {
      skills: [skill('prc', 1), skill('ath', 0.5), skill('ste', 2)],
      traits: [{ key: 'languages', title: 'Languages', values: ['Common'] }, { key: 'di', title: 'Immunities', values: [] }],
      favorites: [row('Fireball', 'spell', 3), row('Mace', 'inventory'), row('Light', 'spell', 0), row('Bless', 'spell', 1), row('Rage', 'features')],
      resources: [], slots: { 1: { value: 1, max: 2 } }, editing: false, passives: 'key', folded: ['inventory']
   };
   const view = attributesView(facts, { format, localize });
   const got = {
      passives: view.skills.map((s) => s.passive), marks: view.skills.map((s) => s.mark),
      traits: view.traits.map((t) => t.key), groups: view.favorites.map((g) => g.label),
      open: view.favorites.map((g) => g.open), pips: view.favorites.find((g) => g.slots)?.slots.pips.map((p) => p.filled)
   };
   const expected = {
      passives: [12, '', ''], marks: ['full', 'half', 'expert'], traits: ['languages'],
      groups: ['Inventory', 'Features', 'Cantrips', 'Spell level 1', 'Spell level 3'],
      open: [false, true, true, true, true], pips: [true, false]
   };
   try { deepStrictEqual(got, expected); }
   catch { problems.push(`attributes: got ${JSON.stringify(got)}, expected ${JSON.stringify(expected)}`); }
   const editing = attributesView({ ...facts, editing: true }, { format, localize });
   if (editing.traits.map((t) => t.text).join() !== 'Common,\u2014') { problems.push('edit mode does not list empty traits'); }
}

// Death saves show only at 0 HP.
{
   const base = { name: 'K', portrait: {}, classes: [], levelOrder: [], level: 1, leveling: 'xp', xp: null, origin: [],
      speed: '', prof: 2, ac: 10, init: 0, inspiration: false, exhaustion: { value: 0, max: 6 }, hd: { value: 1, max: 1 },
      showRests: false, restTypes: [], abilities: [], death: { success: 2, failure: 1 } };
   const up = headerView({ ...base, hp: { value: 5, max: 10, temp: 0 } }, { format, localize });
   const down = headerView({ ...base, hp: { value: 0, max: 10, temp: 0 } }, { format, localize });
   if (up.death) { problems.push('death saves show above 0 HP'); }
   const marks = down.death ? [down.death.success.map((p) => p.filled), down.death.failure.map((p) => p.filled)] : null;
   try { deepStrictEqual(marks, [[true, true, false], [true, false, false]]); }
   catch { problems.push(`death saves at 0 HP: ${JSON.stringify(marks)}`); }
}

// Death saves: the third success stays; healing above 0 clears both rows.
{
   const details = { outcome: 'stable', updates: { 'system.attributes.death.success': 0, 'system.attributes.death.failure': 0 } };
   keepStable([], details);
   try { deepStrictEqual(details.updates, { 'system.attributes.death.success': 3 }); }
   catch { problems.push(`third success: ${JSON.stringify(details.updates)}`); }
   const cleared = { 'system.attributes.death.success': 0, 'system.attributes.death.failure': 0 };
   const HEAL_CASES = [[0, 5, { success: 3, failure: 1 }, cleared], [0, 0, { success: 3, failure: 0 }, null],
      [4, 9, { success: 1, failure: 0 }, null], [0, 5, { success: 0, failure: 0 }, null]];
   for (const [from, to, death, expected] of HEAL_CASES)
   {
      try { deepStrictEqual(healUpdates(from, to, death), expected); }
      catch { problems.push(`heal ${from}→${to}: ${JSON.stringify(healUpdates(from, to, death))}`); }
   }
}

// Inventory: columns default to the user's choice (weight off), a saved choice wins, and a new column still shows.
{
   try { deepStrictEqual(columnChoice(null), { weight: false, uses: true, usage: true, quantity: true, equipped: true, attuned: true, favorite: true }); }
   catch { problems.push(`default inventory columns: ${JSON.stringify(columnChoice(null))}`); }
   const chosen = columnChoice({ weight: true, usage: false, gone: true });
   if (!chosen.weight || chosen.usage || 'gone' in chosen || !chosen.attuned) { problems.push(`saved inventory columns: ${JSON.stringify(chosen)}`); }

   const row = (name, over) => ({ id: name, uuid: name, name, img: '', ...over });
   const base = {
      sections: [
         { id: 'weapons', label: 'Weapons', items: [row('Ring', { attune: { on: true } }), row('Wand', { attune: { on: false, need: 'Requires attunement' } }),
            row('Rope', { equip: { on: false } })] },
         { id: 'loot', label: 'Loot', items: [] }
      ],
      columns: null, editing: false, currency: [], attunement: { value: 1, max: 3 }, encumbrance: null
   };
   const view = inventoryView(base, { format, localize });
   if (view.sections.map((s) => s.id).join() !== 'weapons') { problems.push('empty inventory sections still show'); }
   // Attunement has three states: attuned, needs attuning, or none at all.
   const states = view.sections[0].items.map((i) => (i.attune ? `${i.attune.pressed}:${i.attune.label}` : 'none'));
   try { deepStrictEqual(states, ['true:Attuned', 'false:Requires attunement', 'none']); }
   catch { problems.push(`attunement states: ${JSON.stringify(states)}`); }
   if (view.sections[0].items[2].equip?.label !== 'Not equipped') { problems.push('an unequipped item does not say so'); }
   if (view.columnToggles.length) { problems.push('the column menu shows in play mode'); }
   // A container lists its contents, folded as the player left it; an empty one has no fold.
   const packs = inventoryView({ ...base, openContainers: ['bag'], sections: [{ id: 'containers', label: 'Containers', items: [
      row('bag', { contents: [row('Rope'), row('box', { contents: [row('Gem')] })] }), row('chest', { contents: [] })] }] }, { format, localize });
   const [bag, chest] = packs.sections[0].items;
   const shape = [bag.container?.count, bag.container?.open, bag.container?.contents[1].container?.open, chest.container?.count, view.sections[0].items[0].container];
   try { deepStrictEqual(shape, [2, true, false, 0, null]); }
   catch { problems.push(`container contents: ${JSON.stringify(shape)}`); }
   if (inventoryView({ ...base, editing: true }, { format, localize }).columnToggles.length !== 7) { problems.push('the column menu is missing in edit mode'); }
}

// Spellbook (SCOPE §4.7): preparation states and kinds, Can cast, section order, slot pips, the concentration mark.
{
   const s = (over) => ({ level: 1, method: 'spell', prepares: true, prepared: 1, linked: false, ritual: false, uses: null, ...over });
   const states = [s(), s({ prepared: 0 }), s({ prepared: 2 }), s({ level: 0 }), s({ method: 'innate', prepares: false }),
      s({ linked: true }), s({ method: 'pact' })];
   const shape = states.map((x) => `${prepState(x)}/${spellKind(x)}`);
   try
   {
      deepStrictEqual(shape, ['prepared/prepared', 'unprepared/null', 'always/always', 'null/null', 'null/innate',
         'null/null', 'prepared/pact']);
   }
   catch { problems.push(`spell states and kinds: ${JSON.stringify(shape)}`); }

   const slots = [{ level: 1, value: 0 }, { level: 2, value: 1 }];
   const cast = [
      canCast(s(), slots), // a level 1 spell can use the level 2 slot
      canCast(s({ level: 3 }), slots), // no slot that high
      canCast(s({ prepared: 0 }), slots), // not prepared
      canCast(s({ prepared: 0, ritual: true, level: 9 }), []), // not prepared, but a ritual still needs preparing
      canCast(s({ ritual: true, level: 9 }), []), // prepared ritual: cast as a ritual without a slot
      canCast(s({ level: 0, prepared: 0 }), []), // cantrip
      canCast(s({ method: 'innate', prepares: false, uses: { value: 0, max: 1 } }), slots), // innate, used up
      canCast(s({ method: 'atwill', prepares: false, level: 4 }), [])
   ];
   try { deepStrictEqual(cast, [true, false, false, false, true, true, false, true]); }
   catch { problems.push(`can cast: ${JSON.stringify(cast)}`); }

   try { deepStrictEqual(spellColumnChoice({ school: true, time: false, gone: 1 }), { components: true, concentration: true, time: false, range: true, school: true, target: false, favorite: true }); }
   catch { problems.push(`spell columns: ${JSON.stringify(spellColumnChoice({ school: true, time: false }))}`); }

   const pins = pinView(['action', 'bonus', 'prepared'], ['action', '!prepared'], localize).map((p) => p.pressed);
   try { deepStrictEqual(pins, ['true', 'false', 'mixed']); }
   catch { problems.push(`pinned filters: ${JSON.stringify(pins)}`); }

   const row = (name, over) => ({ ...s(), id: name, uuid: name, name, img: '', concentration: false, ...over });
   const view = spellbookView({
      classes: [{ label: 'Cleric', abbr: 'WIS', mod: 4, attack: 8, save: 16, prepared: { value: 5, max: 0 } }],
      concentration: { save: -1, spells: [{ effectId: 'e', itemId: 'Bless', name: 'Bless', img: '' }] },
      sections: [
         { id: 'innate', method: 'innate', level: null, label: 'Innate', slots: null, items: [row('Step', { method: 'innate', prepares: false, uses: { value: 1, max: 1 } })] },
         { id: 'pact', method: 'pact', level: 2, label: 'Pact', slots: { value: 1, max: 2 }, items: [row('Hex', { method: 'pact' })] },
         { id: 'spell1', method: 'spell', level: 1, label: 'Level 1', slots: { value: 3, max: 2 }, items: [row('Bless', { concentration: true })] },
         { id: 'spell0', method: 'spell', level: 0, label: 'Cantrips', slots: null, items: [row('Light', { level: 0 })] },
         { id: 'spell5', method: 'spell', level: 5, label: 'Level 5', slots: { value: 0, max: 1 }, items: [] }
      ]
   }, { format, localize });
   const order = view.sections.map((x) => x.id).join();
   if (order !== 'spell0,spell1,pact,innate') { problems.push(`spell sections in order ${order}`); }
   const level1 = view.sections[1];
   const pips = level1.slots.pips.map((p) => `${p.filled ? 1 : 0}${p.temp ? 't' : ''}`).join();
   if (pips !== '1,1,1t' || level1.slots.prop !== 'system.spells.spell1.value') { problems.push(`slot pips: ${pips} on ${level1.slots.prop}`); }
   if (!level1.items[0].conc?.holding) { problems.push('the spell held in concentration is not marked'); }
   if (view.sections[2].slots.pips[0].label !== 'Pact slot 1') { problems.push(`pact slot label: ${view.sections[2].slots.pips[0].label}`); }
   if (!view.sections[3].showUses || view.sections[0].showUses) { problems.push('the uses column shows in the wrong sections'); }
   if (view.sections[0].items[0].prep) { problems.push('a cantrip shows a prepare mark'); }
   if (view.classes[0].prepared !== '5' || view.concentration.save !== '-1' || !view.concentration.on) { problems.push(`casting strip: ${JSON.stringify([view.classes[0].prepared, view.concentration])}`); }
}

// Features (SCOPE §4.8): rows placed by the grouping in force, the cards' marks, level up, recharge.
{
   const f = (id, origin, activation, over) => ({ id, uuid: id, name: id, img: '', origin, activation, ...over });
   const facts = (over) => ({
      classes: [
         { id: 'c', uuid: 'c', name: 'Cleric', img: '', identifier: 'cleric', level: 9, subclass: { id: 's', uuid: 's', name: 'Life', img: '' }, needsSubclass: false },
         { id: 'w', uuid: 'w', name: 'Warlock', img: '', identifier: 'warlock', level: 1, subclass: null, needsSubclass: true }
      ],
      origins: [{ kind: 'species', item: { id: 'd', uuid: 'd', name: 'Dwarf', img: '' } }, { kind: 'background', item: null }],
      maxLevel: 20,
      canEdit: true,
      sections: [
         { id: 'cleric', label: 'Cleric', group: 'origin', value: 'cleric' },
         { id: 'other', label: 'Other', group: 'origin', value: 'other' },
         { id: 'active', label: 'Active', group: 'activation', value: 'active' },
         { id: 'passive', label: 'Passive', group: 'activation', value: 'passive' }
      ],
      features: [
         f('Turn', 'cleric', 'active', { uses: { value: 1, max: 2, prop: 'system.uses.value' } }),
         f('Gone', 'paladin', 'passive'),
         f('Breath', 'other', 'active', { recharge: { cooldown: true, label: 'Recharge [5+]' } })
      ],
      ...over
   });
   const shape = (view) => view.sections.map((x) => `${x.id}:${x.items.map((i) => i.id).join('+')}${x.hidden ? '!' : ''}`).join(' ');
   const byOrigin = featuresView(facts(), { format, localize });
   // A row whose class has no section any more (Gone) lands in Other; the other grouping's sections start hidden.
   if (shape(byOrigin) !== 'cleric:Turn other:Gone+Breath active:! passive:!') { problems.push(`features by source: ${shape(byOrigin)}`); }
   const byActivation = featuresView(facts({ grouping: 'activation' }), { format, localize });
   if (shape(byActivation) !== 'cleric:! other:! active:Turn+Breath passive:Gone') { problems.push(`features by activation: ${shape(byActivation)}`); }
   if (groupingOf('nonsense') !== 'origin' || byActivation.groupLabel !== 'Active or passive') { problems.push('the grouping falls back wrongly or is unnamed'); }
   const [cleric, warlock] = byOrigin.classes;
   const marks = [!!cleric.chooseSubclass, warlock.chooseSubclass?.identifier, !!cleric.levelUp, byOrigin.origins[1].choose?.type,
      byOrigin.origins[0].choose, byOrigin.sections[1].items[1].recharge?.text, byOrigin.chooseClass];
   try { deepStrictEqual(marks, [false, 'warlock', true, 'background', null, 'Recharge', null]); }
   catch { problems.push(`feature cards: ${JSON.stringify(marks)}`); }
   // At level 20 in total, no Level up; without edit rights, no buttons at all.
   const capped = featuresView(facts({ classes: [{ ...facts().classes[0], level: 19 }, facts().classes[1]] }), { format, localize });
   if (capped.classes[0].levelUp) { problems.push('Level up shows at level 20'); }
   const viewer = featuresView(facts({ canEdit: false }), { format, localize });
   if (viewer.classes.some((k) => k.levelUp || k.chooseSubclass) || viewer.origins.some((o) => o.choose)) { problems.push('a viewer without edit rights gets level up or choose buttons'); }
   const blank = featuresView(facts({ classes: [], features: [] }), { format, localize });
   if (!blank.chooseClass || blank.classBasis !== 200 || !blank.empty) { problems.push(`no class: ${JSON.stringify([blank.chooseClass, blank.classBasis, blank.empty])}`); }
   if (byOrigin.classBasis !== 408) { problems.push(`two class cards take ${byOrigin.classBasis}px`); }
   try { deepStrictEqual(featureColumnChoice({ usage: false, gone: true }), { uses: true, usage: false, recovery: true, favorite: true }); }
   catch { problems.push(`feature columns: ${JSON.stringify(featureColumnChoice({ usage: false }))}`); }
}

// Effects (SCOPE §4.8): empty categories hidden, the switch, concentration's C, conditions with levels.
{
   const e = (id, over) => ({ id, uuid: id, name: id, img: '', toggleable: true, disabled: false, ...over });
   const view = effectsView({
      categories: [
         { id: 'temporary', label: 'Temporary', effects: [e('Conc', { toggleable: false, concentration: true }), e('Bless', { favorite: true })] },
         { id: 'passive', label: 'Passive', effects: [] },
         { id: 'inactive', label: 'Inactive', effects: [e('Enlarge', { disabled: true })] }
      ],
      conditions: [
         { id: 'prone', name: 'Prone', img: '', on: true, level: null },
         { id: 'exhaustion', name: 'Exhaustion', img: '', on: true, level: 0 },
         { id: 'blinded', name: 'Blinded', img: '', on: false, level: null }
      ]
   }, { format, localize });
   const shape = [
      view.sections.map((x) => x.id).join(),
      view.sections[0].items.map((i) => `${i.toggle ? (i.toggle.on ? 'on' : 'off') : 'none'}${i.concentration ? '+C' : ''}`).join(),
      view.sections[1].items[0].toggle.on,
      view.sections[0].items[1].favoriteAction,
      view.conditions.map((c) => `${c.on ? 1 : 0}${c.level}`).join()
   ];
   // Exhaustion at level 0 is off whatever dnd5e's disabled says; its level reads as a number.
   try { deepStrictEqual(shape, ['temporary,inactive', 'none+C,on', false, 'unfavorite', '1,00,0']); }
   catch { problems.push(`effects view: ${JSON.stringify(shape)}`); }
   if (!effectsView({ categories: [], conditions: [] }, { format, localize }).empty) { problems.push('an empty Effects tab is not marked empty'); }
}

// Each extra ability (honor, sanity) widens the minimum by one column and its gap.
if (headerMinWidth(7) - headerMinWidth(6) !== 56) { problems.push('the sheet minimum does not grow by one ability column'); }

if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log(`${CASES.length} outcome lines, ${PART_CASES.length} card layouts, ${ROW_CASES.length} d20 rows, `
   + `${DAMAGE_CASES.length} damage bands, ${SAVE_CASES.length} save rows, ${KEEP_CASES.length} late adds and `
   + `${MATH_CASES.length} dice sums read as expected; ${ORDER_CASES.length} level orders, the milestone track, the inventory, spellbook, features and effects views hold.`);
