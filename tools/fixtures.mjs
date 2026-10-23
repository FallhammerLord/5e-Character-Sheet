/**
 * Layout cases: each renders one of our templates with sample data. The layout check draws every case at every
 * width of its frame and fails on overflow. Each phase adds its parts here (Phase 1: the header).
 *
 * A case: { name, template: 'path/without-hbs', context: {...}, frame?: 'sheet' | 'chat', theme?: 'light' }
 */
import { describeRoll } from '../src/chat/outcome.js';
import { format } from './templates.mjs';

/** Facts as compat.rollFacts returns them, with overrides. */
const facts = (over) => ({
   kind: 'save', who: 'Kira', what: 'Intelligence Saving Throw', total: 14, natural: 11, target: 15,
   showResult: true, success: false, isCritical: false, targets: [], ...over
});

export const CASES = [
   { name: 'chat-save-failure', template: 'chat/outcome', frame: 'chat', context: describeRoll(facts({ natural: 20 }), format) },
   {
      name: 'chat-long-names',
      template: 'chat/outcome',
      frame: 'chat',
      context: describeRoll(facts({
         who: 'Bartholomew Thistlewood-Ashcombe the Unreasonably Named',
         what: 'Constitution Saving Throw (Disadvantage)',
         total: 1, natural: 1, target: 10, success: false
      }), format)
   },
   {
      name: 'chat-attack-targets',
      template: 'chat/outcome',
      frame: 'chat',
      context: describeRoll(facts({
         kind: 'attack', what: 'Longsword', total: 23, natural: 20, target: null, success: null, isCritical: true,
         targets: [
            { name: 'Goblin Boss', isMiss: false }, { name: 'Hobgoblin Captain', isMiss: false },
            { name: 'Bugbear', isMiss: true }, { name: 'Supercalifragilisticexpialidocious', isMiss: true }
         ]
      }), format)
   },
   { name: 'chat-no-dc', template: 'chat/outcome', frame: 'chat', context: describeRoll(facts({ target: null, success: null }), format) }
];
