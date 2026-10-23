/**
 * Checks our pure functions offline: what each chat card's outcome line says for a given roll.
 * Usage: npm run unit (also part of npm run check)
 */
import { deepStrictEqual } from 'node:assert';
import { describeRoll } from '../src/chat/outcome.js';
import { format } from './templates.mjs';

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

if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log(`${CASES.length} outcome lines read as expected.`);
