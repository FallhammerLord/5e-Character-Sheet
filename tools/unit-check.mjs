/**
 * Checks our pure functions offline: what a roll's outcome says, and how a usage card splits dnd5e's buttons.
 * Usage: npm run unit (also part of npm run check)
 */
import { deepStrictEqual } from 'node:assert';
import { describeRoll } from '../src/chat/outcome.js';
import { cardParts, damageBand } from '../src/chat/card.js';
import { d20Row } from '../src/chat/d20.js';
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

// Damage band: words, totals by type, and the critical switch.
const dmg = (over) => ({ healing: false, critical: false, total: 12, parts: [{ type: 'fire', label: 'Fire', total: 12 }], math: [],
   onSave: '', ...over });
const DAMAGE_CASES = [
   ['plain, no attack on the card', dmg({}), {}, { words: [], parts: ['12 Fire'], extra: [] }],
   ['plain, card has an attack', dmg({}), { canCrit: true }, { words: [], parts: ['12 Fire'], extra: ['damageCritical'] }],
   ['critical', dmg({ critical: true }), { canCrit: true }, { words: ['Critical: dice doubled'], parts: ['12 Fire'], extra: ['damageNormal'] }],
   ['half on a save', dmg({ onSave: 'Half Damage' }), {}, { words: ['On a save: Half Damage'], parts: ['12 Fire'], extra: [] }]
];
for (const [name, facts, options, expected] of DAMAGE_CASES)
{
   const band = damageBand(facts, [], format, options);
   const got = { words: band.words, parts: band.parts.map((p) => p.text), extra: band.extra.map((e) => e.action) };
   try { deepStrictEqual(got, expected); }
   catch { problems.push(`damage band, ${name}: got ${JSON.stringify(got)}, expected ${JSON.stringify(expected)}`); }
}

if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log(`${CASES.length} outcome lines, ${PART_CASES.length} card layouts, ${ROW_CASES.length} d20 rows and ${DAMAGE_CASES.length} damage bands read as expected.`);
