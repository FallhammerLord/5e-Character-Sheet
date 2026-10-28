/**
 * Checks our pure functions offline: what a roll's outcome says, and how a usage card splits dnd5e's buttons.
 * Usage: npm run unit (also part of npm run check)
 */
import { deepStrictEqual } from 'node:assert';
import { describeRoll } from '../src/chat/outcome.js';
import { appliedLines, cardParts, damageBand, saveRow } from '../src/chat/card.js';
import { sparkDelay } from '../src/apps/sparks.js';
import { countingDie, d20Row, modeForSides } from '../src/chat/d20.js';
import { diceMath } from '../src/chat/math.js';
import { attributesView } from '../src/sheet/attributes.js';
import { keepStable } from '../src/sheet/death.js';
import { columnChoice, inventoryView } from '../src/sheet/inventory.js';
import { canCast, prepState, spellbookView, spellColumnChoice, spellKind } from '../src/sheet/spellbook.js';
import { featureColumnChoice, featuresView, groupingOf } from '../src/sheet/features.js';
import { classSpans, levelUpChoices, originCards } from '../src/sheet/origins.js';
import { effectsView } from '../src/sheet/effects.js';
import { biographyView, paragraphs } from '../src/sheet/biography.js';
import { pinView } from '../src/sheet/lists.js';
import { comfortWidth, headerMinWidth, headerView, hpPreview, inspirationBar, levelOrder, levelTrack, portraitFrame, signed, tabRow, themePicker } from '../src/sheet/header.js';
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
const saveFacts = (over) => ({ ...facts({}), dice: [{ result: 11, active: true }], advantageMode: 0, sides: [], 
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
// Forge's sparks (user, 2026-10-28): a minute at least, then 1d6 × 10 seconds.
{
   const got = [1, 6].map((pip) => sparkDelay(() => pip));
   if (got.join() !== '70000,120000') { problems.push(`spark timing: ${got}`); }
}
// What Apply did, in words (user, 2026-10-28): each type when damage is split, healing, temp HP, none, an effect.
{
   const slash = { type: 'slashing', label: 'Slashing', value: 9 };
   const got = appliedLines([
      { kind: 'damage', who: 'Wolf', amount: 15, temp: 0, parts: [slash, { type: 'radiant', label: 'Radiant', value: 6 }] },
      { kind: 'damage', who: 'Wolf', amount: 9, temp: 0, parts: [slash] },
      { kind: 'damage', who: 'Kira', amount: -7, temp: 0, parts: [{ type: 'healing', label: 'Healing', value: 7 }] },
      { kind: 'damage', who: 'Kira', amount: 0, temp: 5, parts: [] },
      { kind: 'damage', who: 'Skeleton', amount: 0, temp: 0, parts: [{ type: 'poison', label: 'Poison', value: 0 }] },
      { kind: 'effect', who: 'Kira', name: 'Bless' }
   ], format).map((l) => l.text);
   const expected = ['Wolf takes 15: 9 slashing, 6 radiant', 'Wolf takes 9 slashing', 'Kira heals 7', 'Kira gains 5 temp HP',
      'Skeleton takes no damage', 'Bless on Kira'];
   try { deepStrictEqual(got, expected); }
   catch { problems.push(`applied lines: got ${JSON.stringify(got)}`); }
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
   // The theme picker on the title bar (SCOPE §4.11): the world default first, named, then each theme; one pressed.
   const options = themePicker({ chosen: '', world: 'forge', keys: ['plain', 'forge'] }, { localize, format }).options.map((o) => `${o.value || 'world'}:${o.name}:${o.on}`);
   try { deepStrictEqual(options, ['world:World default (Fire and Forge):true', 'plain:Plain:false', 'forge:Fire and Forge:false']); }
   catch { problems.push(`theme picker: ${JSON.stringify(options)}`); }
}

// Width comfort stops (user, 2026-10-28): within 12px of a stop holds at it; never under the least width.
{
   const got = [600, 650, 657, 700, 709, 731, 733, 812, 850, 1030].map((w) => comfortWidth(w, 644)).join(' ');
   if (got !== '644 644 657 700 720 720 733 800 850 1024') { problems.push(`comfort widths: ${got}`); }
}

// Inspiration (SCOPE §4.12): one star without a bank; a star per use with one, filled from the right, filled ones
// spend and empty ones bank;
// a bank over five shows only the count; edit mode's tray lists the items with uses, the one banking it pressed.
{
   const item = { id: 'h', uuid: 'Actor.a.Item.h', name: 'Heroic', img: '' };
   const mode = { canEdit: true, editing: false };
   const i18n = { localize, format };
   const none = inspirationBar({ on: true, bank: null, linkable: [item] }, mode, i18n);
   if (none.bank || none.count !== 1 || none.link) { problems.push(`inspiration without a bank: ${JSON.stringify(none)}`); }
   const bank = inspirationBar({ on: true, bank: { link: item, value: 2, max: 4 }, linkable: [item] }, mode, i18n);
   const stars = bank.stars.map((x) => `${x.filled ? '*' : 'o'}${x.delta}${x.last ? '!' : ''}`).join(' ');
   if (stars !== 'o1 o1 *-1! *-1' || bank.onlyCompact || bank.count !== 2) { problems.push(`inspiration bank 2 of 4: ${stars}, compact ${bank.onlyCompact}`); }
   const big = inspirationBar({ on: true, bank: { link: item, value: 6, max: 8 }, linkable: [item] }, mode, i18n);
   if (!big.onlyCompact || big.stars.length || big.add.can !== true || big.spend.can !== true) { problems.push(`inspiration bank 6 of 8: ${JSON.stringify(big)}`); }
   const empty = inspirationBar({ on: false, bank: { link: item, value: 0, max: 3 }, linkable: [item] }, { canEdit: true, editing: true }, i18n);
   const options = empty.link?.options.map((o) => `${o.id || 'own'}:${o.on}`).join(' ');
   if (empty.spend.can || options !== 'own:false h:true') { problems.push(`inspiration empty bank in edit mode: spend ${empty.spend.can}, options ${options}`); }
   const observer = inspirationBar({ on: true, bank: { link: item, value: 1, max: 3 }, linkable: [] }, { canEdit: false, editing: false }, i18n);
   if (observer.stars.some((x) => x.can) || observer.add.can) { problems.push('inspiration: an observer can change the bank'); }
}

// Attributes: every passive, every trait in both modes, favorites grouped in Classic's order with slot pips.
{
   const skill = (key, prof) => ({ key, label: key, abbr: 'Wis', total: 2, passive: 12, prof });
   const row = (title, group, level = null) => ({ id: title, title, group, level, uses: null, quantity: 0, state: null });
   const facts = {
      skills: [skill('prc', 1), skill('ath', 0.5), skill('ste', 2)],
      traits: [{ key: 'languages', title: 'Languages', values: ['Common'] }, { key: 'di', title: 'Immunities', values: [] }],
      favorites: [row('Fireball', 'spell', 3), row('Mace', 'inventory'), row('Light', 'spell', 0), row('Bless', 'spell', 1), row('Rage', 'features')],
      resources: [], slots: { 1: { value: 1, max: 2 } }, editing: false, folded: ['inventory']
   };
   const view = attributesView(facts, { format, localize });
   const got = {
      passives: view.skills.map((s) => s.passive), marks: view.skills.map((s) => s.mark),
      traits: view.traits.map((t) => t.key), groups: view.favorites.map((g) => g.label),
      open: view.favorites.map((g) => g.open), pips: view.favorites.find((g) => g.slots)?.slots.pips.map((p) => p.filled)
   };
   const expected = {
      passives: [12, 12, 12], marks: ['full', 'half', 'expert'], traits: ['languages', 'di'],
      groups: ['Inventory', 'Features', 'Cantrips', 'Spell level 1', 'Spell level 3'],
      open: [false, true, true, true, true], pips: [true, false]
   };
   try { deepStrictEqual(got, expected); }
   catch { problems.push(`attributes: got ${JSON.stringify(got)}, expected ${JSON.stringify(expected)}`); }
   const editing = attributesView({ ...facts, editing: true }, { format, localize });
   if (editing.traits.map((t) => t.text).join() !== 'Common,\u2014') { problems.push('edit mode does not list empty traits'); }
   // A favorited effect brings its switch, on or off, to the Attributes tab (user, 2026-10-28).
   const fx = attributesView({ ...facts, favorites: [{ ...row('Ward', 'effects'), toggle: { on: false } }] }, { format, localize }).favorites[0].rows[0];
   if (fx.toggle?.on !== false || !fx.toggle.label) { problems.push(`favorited effect switch: ${JSON.stringify(fx.toggle)}`); }
   // The traits panel folds, remembered with the favorites groups; folded it summarizes what's set.
   // Resources (SCOPE §4.10): in play only those set; with the lock off all three; a linked panel's recovery is its
   // item's periods, and its cog's tray marks the item shown.
   const resFacts = { ...facts, linkable: [{ id: 'ki', name: 'Ki', img: 'ki.svg' }], resources: [
      { key: 'primary', link: { id: 'ki', name: 'Ki', img: 'ki.svg' }, label: 'Ki', value: 2, max: 4, sourceMax: 4, sr: false, lr: false, periods: ['SR'] },
      { key: 'secondary', link: null, label: '', value: 0, max: 0, sourceMax: 0, sr: false, lr: false, periods: null },
      { key: 'tertiary', link: null, label: 'Rage', value: 1, max: 3, sourceMax: 3, sr: false, lr: true, periods: null }
   ] };
   // Where the group sits: leading the column while any is set; none set, only in edit mode, at the foot (rule 6).
   const none = { ...resFacts, resources: resFacts.resources.map((r) => ({ ...r, link: null, label: '', max: 0 })) };
   const place = (f, editing) => { const v = attributesView({ ...f, editing }, { format, localize }); return `${v.resourcesAtTop}/${v.resourcesAtFoot}`; };
   const placed = [place(resFacts, false), place(resFacts, true), place(none, false), place(none, true)].join(' ');
   if (placed !== 'true/false true/false false/false false/true') { problems.push(`resources placement: ${placed}`); }
   const show = (over) => attributesView({ ...resFacts, ...over }, { format, localize }).resources
      .map((r) => `${r.title}|${r.recovery}|${r.linked}|${r.options.filter((o) => o.on).map((o) => o.id || 'own')}`);
   const res = { play: show({ editing: false }), edit: show({ editing: true }) };
   try
   {
      deepStrictEqual(res, {
         play: ['Ki|SR|true|ki', 'Rage|LR|false|own'],
         edit: ['Ki|SR|true|ki', 'Resource 2||false|own', 'Rage|LR|false|own']
      });
   }
   catch { problems.push(`resources: ${JSON.stringify(res)}`); }
   const folded = attributesView({ ...facts, folded: ['traits'] }, { format, localize });
   if (!view.traitsOpen || folded.traitsOpen || folded.traitsSummary !== 'Common') { problems.push(`traits fold: ${folded.traitsOpen} "${folded.traitsSummary}"`); }
}

// Framing belongs to one image, stays inside its limits, and a token has none.
{
   const got = [
      portraitFrame({ src: 'a.webp', x: 30, y: 70, zoom: 2.04 }, 'a.webp'),
      portraitFrame({ src: 'a.webp', x: 30, y: 70, zoom: 2 }, 'b.webp'),
      portraitFrame({ src: 'a.webp', x: -5, y: 140, zoom: 9 }, 'a.webp'),
      portraitFrame(null, 'a.webp')
   ];
   try
   {
      deepStrictEqual(got, [{ x: 30, y: 70, zoom: 2 }, { x: 50, y: 0, zoom: 1 }, { x: 0, y: 100, zoom: 3 }, { x: 50, y: 0, zoom: 1 }]);
   }
   catch { problems.push(`portrait framing: ${JSON.stringify(got)}`); }
}

// Attributes in edit mode: each skill's ability marked, each trait's gear aimed at dnd5e's window (senses by config).
{
   const facts = { skills: [{ key: 'prc', label: 'Perception', abbr: 'Wis', total: 5, passive: 15, prof: 1, source: 1, ability: 'wis' }],
      abilities: [{ key: 'str', abbr: 'STR' }, { key: 'wis', abbr: 'WIS' }],
      traits: [{ key: 'senses', title: 'Senses', values: [] }, { key: 'languages', title: 'Languages', values: [] }],
      favorites: [], resources: [], slots: {}, editing: true, passives: 'all', folded: [] };
   const view = attributesView(facts, { format, localize });
   const got = [view.editing, view.skills[0].abilities.filter((a) => a.selected).map((a) => a.key).join(),
      view.traits.map((t) => `${t.key}:${t.config || `trait=${t.trait}`}`).join()];
   try { deepStrictEqual(got, [true, 'wis', 'senses:senses,languages:trait=languages']); }
   catch { problems.push(`attributes edit mode: ${JSON.stringify(got)}`); }
}

// The HP tray's preview: damage takes temp first and stops at 0; nothing typed asks for an amount.
{
   const hp = { value: 20, temp: 5 };
   const got = ['12', '3', '40', '', 'x', '-4'].map((n) => hpPreview(n, hp, { format, localize }));
   try
   {
      deepStrictEqual(got, ['Damage: 5 from temp, 7 from HP, leaves 13', 'Damage: 3 from temp, 0 from HP, leaves 20',
         'Damage: 5 from temp, 20 from HP, leaves 0', 'Type an amount, then choose', 'Type an amount, then choose',
         'Type an amount, then choose']);
   }
   catch { problems.push(`HP preview: ${JSON.stringify(got)}`); }
}

// Every speed with a value shows, walking first and bare (user, 2026-10-27).
{
   const base = { name: 'K', portrait: {}, classes: [], levelOrder: [], level: 1, leveling: 'xp', xp: null, origin: [],
      prof: 2, ac: 10, init: 0, inspiration: false, exhaustion: { value: 0, max: 6 }, hd: { value: 1, max: 1 },
      showRests: false, restTypes: [], abilities: [], hp: { value: 5, max: 10, temp: 0 }, speedUnits: 'ft',
      speeds: [{ key: 'walk', label: 'Speed', value: 30 }, { key: 'fly', label: 'Fly', value: 60 }] };
   const got = headerView(base, { format, localize }).speed;
   if (got !== '30 ft · Fly 60 ft') { problems.push(`speeds: got "${got}"`); }
}

// Death saves show only at 0 HP.
{
   const base = { name: 'K', portrait: {}, classes: [], levelOrder: [], level: 1, leveling: 'xp', xp: null, origin: [],
      speed: '', prof: 2, ac: 10, init: 0, inspiration: false, exhaustion: { value: 0, max: 6 }, hd: { value: 1, max: 1 },
      showRests: false, restTypes: [], abilities: [], death: { success: 2, failure: 1 } };
   const up = headerView({ ...base, hp: { value: 5, max: 10, temp: 0 } }, { format, localize });
   const down = headerView({ ...base, hp: { value: 0, max: 10, temp: 0 } }, { format, localize });
   if (up.death) { problems.push('death saves show above 0 HP'); }
   // The portrait card: exhaustion 0 hides behind its dot; Max ± is tempmax as a plain number (dnd5e reads a typed
   // sign as a delta); a token shows whole, other art fills the frame; one chip per rest.
   const card = headerView({ ...base, portrait: { token: true }, showRests: true, hp: { value: 5, max: 15, temp: 2, tempmax: 5 },
      restTypes: [{ key: 'short', label: 'Short' }, { key: 'long', label: 'Long' }] }, { format, localize });
   const tired = headerView({ ...base, portrait: {}, exhaustion: { value: 2, max: 6 }, hp: { value: 5, max: 10, temp: 0, tempmax: -3 } }, { format, localize });
   const got = [card.exhaustion.none, tired.exhaustion.none, card.hp.maxMod, tired.hp.maxMod, up.hp.maxMod, card.portrait.fit, tired.portrait.fit,
      card.rests.map((r) => `${r.key}${r.short ? '*' : ''}`).join()];
   // A token starts round and shows whole in either shape (user, 2026-10-28: cover cropped its own ring, like a zoom).
   const squareToken = headerView({ ...base, portrait: { token: true }, shape: 'square', hp: { value: 5, max: 10, temp: 0 } }, { format, localize });
   got.push(card.portrait.shape, squareToken.portrait.fit, tired.portrait.shape);
   try { deepStrictEqual(got, [true, false, '5', '-3', '', 'contain', 'cover', 'short*,long', 'round', 'contain', 'square']); }
   catch { problems.push(`portrait card: ${JSON.stringify(got)}`); }
   // Edit mode edits what's stored: the name and score as saved, not as an effect shows them.
   const stored = headerView({ ...base, name: 'Shown', nameSource: 'Stored', xp: { value: 10, max: 300 }, hp: { value: 5, max: 10, temp: 0 },
      abilities: [{ key: 'str', abbr: 'Str', label: 'Strength', value: 18, source: 16, mod: 4, save: 4, proficient: 0 }] }, { format, localize });
   const edited = [stored.nameSource, stored.abilities[0].source, stored.xp.maxText];
   try { deepStrictEqual(edited, ['Stored', 16, '/ 300 XP']); }
   catch { problems.push(`edit mode values: ${JSON.stringify(edited)}`); }
   const marks = down.death ? [down.death.success.map((p) => p.filled), down.death.failure.map((p) => p.filled)] : null;
   try { deepStrictEqual(marks, [[true, true, false], [true, false, false]]); }
   catch { problems.push(`death saves at 0 HP: ${JSON.stringify(marks)}`); }
}

// Death saves: the third success stays (healing above 0 clearing both rows is dnd5e's own, preUpdateHP).
{
   const reset = () => ({ 'system.attributes.death.success': 0, 'system.attributes.death.failure': 0 });
   const sheet = (classes) => ({ sheet: { options: { classes } } });
   const ours = { outcome: 'stable', updates: reset(), subject: sheet(['fhcs-sheet']) };
   keepStable([], ours);
   try { deepStrictEqual(ours.updates, { 'system.attributes.death.success': 3 }); }
   catch { problems.push(`third success: ${JSON.stringify(ours.updates)}`); }
   // Our sheet's rule only (user, 2026-10-27): on dnd5e's own sheet, dnd5e's reset stands.
   const theirs = { outcome: 'stable', updates: reset(), subject: sheet(['dnd5e2']) };
   keepStable([], theirs);
   try { deepStrictEqual(theirs.updates, reset()); }
   catch { problems.push(`third success on another sheet: ${JSON.stringify(theirs.updates)}`); }
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
   // One Uses column for the whole tab when any spell has uses, so every section's columns line up (user, 2026-10-27).
   if (!view.sections.every((sec) => sec.showUses)) { problems.push('the uses column is missing from some sections'); }
   if (view.sections[0].items[0].prep) { problems.push('a cantrip shows a prepare mark'); }
   if (view.classes[0].prepared !== '5' || view.concentration.save !== '-1' || !view.concentration.on) { problems.push(`casting strip: ${JSON.stringify([view.classes[0].prepared, view.concentration])}`); }
}

// Features (SCOPE §4.8): rows placed by the grouping in force, recharge.
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
   if (byOrigin.sections[1].items[1].recharge?.text !== 'Recharge') { problems.push('a spent recharge is not offered'); }
   try { deepStrictEqual(featureColumnChoice({ usage: false, gone: true }), { uses: true, usage: false, recovery: true, favorite: true }); }
   catch { problems.push(`feature columns: ${JSON.stringify(featureColumnChoice({ usage: false }))}`); }
}

// Header cards and Level up (SCOPE §4.1, §4.8): spans on the ability grid, the marks, the tray's choices.
{
   const facts = (over) => ({
      classes: [
         { id: 'w', uuid: 'w', name: 'Warlock', img: '', identifier: 'warlock', level: 1, subclass: null, needsSubclass: true },
         { id: 'c', uuid: 'c', name: 'Cleric', img: '', identifier: 'cleric', level: 9, subclass: { id: 's', uuid: 's', name: 'Life', img: '' }, needsSubclass: false }
      ],
      origins: [{ kind: 'species', item: { id: 'd', uuid: 'd', name: 'Dwarf', img: '' } }, { kind: 'background', item: null }],
      maxLevel: 20, xp: { value: 100, max: 300 }, canEdit: true, editing: false,
      ...over
   });
   const spans = [classSpans(7, 1), classSpans(7, 2), classSpans(7, 3), classSpans(8, 2), classSpans(8, 1)].map((x) => x.join('+'));
   // One class takes the columns left by species and background (the combat panel's and two abilities'); two split
   // them, the first on the combat panel's; a third and more go to the class tray (user, 2026-10-27).
   try { deepStrictEqual(spans, ['3', '1+2', '1+2', '1+3', '4']); }
   catch { problems.push(`card spans: ${JSON.stringify(spans)}`); }
   const cards = originCards(facts(), 7, { format, localize });
   const shape = cards.map((k) => `${k.kind}:${k.item?.name ?? ''}${k.level ? ` ${k.level}` : ''}${k.sub ? `/${k.sub.name}` : ''}${k.choose ? `+${k.choose.type}` : ''}${k.item?.clear ? 'x' : ''}@${k.span}`);
   // Highest level first; a subclass due offers Subclass; a missing background offers Choose; no removes outside edit mode.
   try { deepStrictEqual(shape, ['Class:Cleric 9/Life@1', 'Class:Warlock 1+subclass@2', 'Species:Dwarf@2', 'Background:+background@2']); }
   catch { problems.push(`header cards: ${JSON.stringify(shape)}`); }
   const editing = originCards(facts({ editing: true }), 7, { format, localize });
   if (!editing[0].item.clear || !editing[0].sub.clear || !editing[2].item.clear) { problems.push('edit mode does not offer to remove cards'); }
   const viewer = originCards(facts({ canEdit: false }), 7, { format, localize });
   if (viewer.some((k) => k.choose || k.item?.clear)) { problems.push('a viewer without edit rights gets Choose or remove'); }
   const blank = originCards(facts({ classes: [] }), 7, { format, localize });
   if (blank[0].choose?.type !== 'class' || blank[0].span !== 3) { problems.push(`no class: ${JSON.stringify(blank[0])}`); }
   // Four classes: the two highest take cards; the last card's "+2" holds the rest, highest first.
   const four = originCards(facts({ editing: true, classes: [
      ...facts().classes,
      { id: 'r', uuid: 'r', name: 'Rogue', img: '', identifier: 'rogue', level: 3, subclass: null, needsSubclass: true },
      { id: 'f', uuid: 'f', name: 'Fighter', img: '', identifier: 'fighter', level: 2, subclass: null, needsSubclass: false }
   ] }), 7, { format, localize });
   const fourShape = four.filter((k) => k.isClass).map((k) => `${k.item.name}@${k.span}${k.more ? `${k.more.text}:${k.more.classes.map((m) => `${m.item.name}${m.choose ? '+' : ''}${m.item.clear ? 'x' : ''}`).join(',')}` : ''}`);
   try { deepStrictEqual(fourShape, ['Cleric@1', 'Rogue@2+2:Fighterx,Warlock+x']); }
   catch { problems.push(`four classes: ${JSON.stringify(fourShape)}`); }
   if (cards.some((k) => k.more)) { problems.push('two classes get a "+N" chip'); }
   const up = levelUpChoices(facts(), { format, localize });
   if (up.classes.map((k) => `${k.name}${k.next}`).join() !== 'Cleric10,Warlock2' || up.ready) { problems.push(`level up: ${JSON.stringify(up)}`); }
   if (!levelUpChoices(facts({ xp: { value: 300, max: 300 } }), { format, localize }).ready) { problems.push('enough XP does not mark the level pill'); }
   if (levelUpChoices(facts({ classes: [{ ...facts().classes[1], level: 20 }] }), { format, localize })) { problems.push('the level tray shows at level 20 in play'); }
   // Level down: edit mode only, classes above level 1; at level 20 the tray keeps Level down and drops Level up.
   const downs = levelUpChoices(facts({ editing: true }), { format, localize }).down.map((k) => `${k.name}${k.next}`).join();
   if (downs !== 'Cleric8') { problems.push(`level down: ${downs}`); }
   const top = levelUpChoices(facts({ editing: true, classes: [{ ...facts().classes[1], level: 20 }] }), { format, localize });
   if (!top || top.canLevelUp || top.classes.length || top.down[0]?.next !== 19) { problems.push(`level 20 in edit mode: ${JSON.stringify(top)}`); }
   if (levelUpChoices(facts(), { format, localize }).down.length) { problems.push('Level down shows in play'); }
   if (levelUpChoices(facts({ canEdit: false }), { format, localize })) { problems.push('a viewer gets Level up'); }
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

// Biography (SCOPE §4.8): every field for whoever may edit; a viewer's empty fields hidden; boxes split into columns.
{
   const facts = (editable, enriched) => ({
      editable,
      characteristics: [{ name: 'system.details.eyes', label: 'Eyes', value: 'Grey', source: 'Grey' },
         { name: 'system.details.faith', label: 'Faith', value: ' ', source: '' }],
      boxes: ['trait', 'ideal', 'bond', 'flaw', 'appearance'].map((key) => ({ key, name: `system.details.${key}`, label: key, value: key === 'flaw' ? '' : `${key} text` })),
      biography: { name: 'system.details.biography.value', label: 'Biography', enriched, source: enriched }
   });
   const play = biographyView(facts(false, '<p> </p>'), { format, localize });
   const shape = [play.characteristics.length, play.left.map((b) => b.key).join(), play.right.map((b) => b.key).join(), play.biography];
   try { deepStrictEqual(shape, [1, 'trait,ideal,bond', 'appearance', null]); }
   catch { problems.push(`biography in play: ${JSON.stringify(shape)}`); }
   const edit = biographyView(facts(true, ''), { format, localize });
   if (edit.characteristics.length !== 2 || edit.left.length !== 4 || !edit.biography || edit.empty) { problems.push('an owner does not see every biography field'); }
   const blank = biographyView({ characteristics: [], boxes: [], biography: { enriched: '' } }, { format, localize });
   if (!blank.empty) { problems.push('an empty Biography is not marked empty'); }
   try { deepStrictEqual(paragraphs('One\r\n\n  Two  \n'), ['One', 'Two']); }
   catch { problems.push(`paragraphs: ${JSON.stringify(paragraphs('One\r\n\n  Two  \n'))}`); }
}

// Each extra ability (honor, sanity) widens the minimum by one column and its gap.
if (headerMinWidth(7) - headerMinWidth(6) !== 51) { problems.push('the sheet minimum does not grow by one ability column'); }

if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log(`${CASES.length} outcome lines, ${PART_CASES.length} card layouts, ${ROW_CASES.length} d20 rows, `
   + `${DAMAGE_CASES.length} damage bands, ${SAVE_CASES.length} save rows, ${KEEP_CASES.length} late adds and `
   + `${MATH_CASES.length} dice sums read as expected; ${ORDER_CASES.length} level orders, the milestone track, the inventory, spellbook, features, effects and biography views hold.`);
