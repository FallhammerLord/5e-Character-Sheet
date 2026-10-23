/**
 * Checks our pure functions offline: what a roll's outcome says, and how a usage card splits dnd5e's buttons.
 * Usage: npm run unit (also part of npm run check)
 */
import { deepStrictEqual } from 'node:assert';
import { describeRoll } from '../src/chat/outcome.js';
import { cardParts, damageBand, saveRow } from '../src/chat/card.js';
import { countingDie, d20Row, modeForSides } from '../src/chat/d20.js';
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

// Late adds: which die counts once dice sit on either side, and the mode dnd5e records.
const KEEP_CASES = [
   ['no extra dice', [12], [], 0, 0],
   ['advantage takes the higher', [12, 15], ['adv'], 1, 1],
   ['advantage keeps the primary when it is higher', [18, 3], ['adv'], 0, 1],
   ['disadvantage takes the lower', [12, 4], ['dis'], 1, -1],
   ['Elven Accuracy: highest of three', [12, 15, 18], ['adv', 'adv'], 2, 1],
   ['both sides cancel: primary counts', [12, 19, 2], ['adv', 'dis'], 0, 0],
   ['a tie goes to the primary', [15, 15], ['adv'], 0, 1]
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

if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log(`${CASES.length} outcome lines, ${PART_CASES.length} card layouts, ${ROW_CASES.length} d20 rows, `
   + `${DAMAGE_CASES.length} damage bands, ${SAVE_CASES.length} save rows and ${KEEP_CASES.length} late adds read as expected.`);
