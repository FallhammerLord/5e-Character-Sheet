import { MODULE_ID, SHEET_ID, SYSTEM_ACTIONS } from '../constants.js';
import { systemCharacterSheet } from '../compat.js';

/** How long a click may take to reach dnd5e's hook before a test fails. */
const HOOK_WAIT_MS = 3000;

/**
 * In-world tests for Quench (https://github.com/Ethaks/FVTT-Quench), run by a GM from the Quench window.
 * Unlike tools/*-check.mjs, these use the real dnd5e system: they open our sheet on a temporary character and click
 * its markup, so a renamed action or a lost class name shows up as a failure. Each click is stopped at dnd5e's own
 * "pre" hook, so no dialog opens, nothing is rolled, and no chat message is made. The character is deleted after.
 *
 * @param {object} quench - The Quench API, from its `quenchReady` hook.
 */
export function registerQuenchTests(quench)
{
   quench.registerBatch(`${MODULE_ID}.core`, (context) =>
   {
      const { describe, it, assert, before, after } = context;
      let actor = null;
      let sheet = null;

      /** Clicks an element (Shift held, as a fast-forward) and resolves with the hook's arguments, or rejects. */
      const clickReaches = (selector, hook) => new Promise((resolve, reject) =>
      {
         const element = sheet.element.querySelector(selector);
         if (!element) { reject(new Error(`no element matches ${selector}`)); return; }
         const timer = setTimeout(() =>
         {
            Hooks.off(hook, id);
            reject(new Error(`clicking ${selector} never reached ${hook}`));
         }, HOOK_WAIT_MS);
         const id = Hooks.on(hook, (...args) =>
         {
            clearTimeout(timer);
            Hooks.off(hook, id);
            resolve(args);
            return false;
         });
         element.dispatchEvent(new PointerEvent('click', { bubbles: true, cancelable: true, shiftKey: true }));
      });

      describe('Fallhammer Character Sheet', function ()
      {
         before(async function ()
         {
            if (!game.user.isGM) { this.skip(); }
            actor = await Actor.implementation.create({
               name: 'FHCS test (safe to delete)',
               type: 'character',
               flags: { core: { sheetClass: SHEET_ID } }
            });
            sheet = actor.sheet;
            await sheet.render({ force: true });
         });

         after(async function ()
         {
            await sheet?.close();
            await actor?.delete();
         });

         it('is offered for characters, and is not the default', function ()
         {
            const entry = CONFIG.Actor.sheetClasses.character?.[SHEET_ID];
            assert.ok(entry, `${SHEET_ID} is registered for characters`);
            assert.isFalse(entry.default);
         });

         it('opens as our sheet, built on dnd5e\'s', function ()
         {
            const Base = systemCharacterSheet();
            assert.instanceOf(sheet, Base);
            assert.notStrictEqual(sheet.constructor, Base);
            assert.isTrue(sheet.element.classList.contains('fhcs-sheet'));
            assert.isTrue(sheet.element.classList.contains('character'));
         });

         it('keeps every dnd5e sheet action', function ()
         {
            const missing = SYSTEM_ACTIONS.filter((name) => !sheet.options.actions[name]);
            assert.deepEqual(missing, [], 'dnd5e renamed or removed these; update SYSTEM_ACTIONS and the research note');
         });

         it('rolls an ability check from the sheet', async function ()
         {
            const [config] = await clickReaches('[data-ability="str"] [data-action="roll"][data-type="ability"]',
               'dnd5e.preRollAbilityCheck');
            assert.strictEqual(config.ability, 'str');
         });

         it('starts a long rest from the sheet', async function ()
         {
            const [rester, config] = await clickReaches('[data-action="rest"][data-type="long"]', 'dnd5e.preLongRest');
            assert.strictEqual(rester, actor);
            assert.strictEqual(config.type, 'long');
         });

         it('uses an item from the sheet', async function ()
         {
            const [item] = await actor.createEmbeddedDocuments('Item', [{ name: 'FHCS test dagger', type: 'weapon' }]);
            await item.createActivity('attack', {}, { renderSheet: false });
            await sheet.render();
            const [activity] = await clickReaches(`[data-item-id="${item.id}"] [data-action="use"]`, 'dnd5e.preUseActivity');
            assert.strictEqual(activity.item, item);
         });
      });
   }, { displayName: 'Fallhammer Character Sheet: core' });
}
