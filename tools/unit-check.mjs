/**
 * Checks our pure functions offline: what a roll's outcome says, and how a usage card splits dnd5e's buttons.
 * Usage: npm run unit (also part of npm run check)
 */
import { deepStrictEqual } from 'node:assert';
import { describeRoll } from '../src/chat/outcome.js';
import { cardParts } from '../src/chat/card.js';
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

if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log(`${CASES.length} outcome lines and ${PART_CASES.length} card layouts read as expected.`);
