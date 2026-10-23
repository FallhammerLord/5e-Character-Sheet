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

   // Chat cards: uses an item without posting (dnd5e returns the message data), renders it in memory, and clicks it.
   quench.registerBatch(`${MODULE_ID}.chat`, (context) =>
   {
      const { describe, it, assert, before, after } = context;
      let actor = null;
      let activity = null;

      /** A usage card for the test weapon, rendered but never posted, and its element. */
      const renderCard = async () =>
      {
         const results = await activity.use({ subsequentActions: false, consume: false }, { configure: false },
            { create: false });
         const message = new ChatMessage.implementation(results.message);
         return { message, html: await message.renderHTML() };
      };

      describe('One card per action', function ()
      {
         before(async function ()
         {
            if (!game.user.isGM) { this.skip(); }
            actor = await Actor.implementation.create({ name: 'FHCS test (safe to delete)', type: 'character' });
            const [item] = await actor.createEmbeddedDocuments('Item', [{
               name: 'FHCS test sword',
               type: 'weapon',
               system: { damage: { base: { number: 1, denomination: 8, types: ['slashing'] } } }
            }]);
            activity = await item.createActivity('attack', {}, { renderSheet: false });
            activity ??= item.system.activities.contents[0];
         });

         after(async function ()
         {
            await actor?.delete();
         });

         it('draws usage cards with our model', function ()
         {
            assert.strictEqual(CONFIG.ChatMessage.dataModels.usage.name, 'FHCSUsageMessageData');
         });

         it('has a header, and an attack band carrying dnd5e\'s action', async function ()
         {
            const { html } = await renderCard();
            assert.ok(html.querySelector('.fhcs-card-header'), 'card header');
            assert.include(html.querySelector('.fhcs-card-title')?.textContent ?? '', 'FHCS test sword');
            const band = html.querySelector('.fhcs-band[data-action="rollAttack"]');
            assert.ok(band, 'attack band');
            assert.isTrue(html.classList.contains('fhcs-chat'));
         });

         it('rolls the attack when the band is clicked', async function ()
         {
            const { html } = await renderCard();
            const band = html.querySelector('.fhcs-band[data-action="rollAttack"]');
            const reached = new Promise((resolve, reject) =>
            {
               const timer = setTimeout(() => { Hooks.off('dnd5e.preRollAttackV2', id); reject(new Error('never reached dnd5e.preRollAttackV2')); }, 3000);
               const id = Hooks.on('dnd5e.preRollAttackV2', (config) =>
               {
                  clearTimeout(timer);
                  Hooks.off('dnd5e.preRollAttackV2', id);
                  resolve(config);
                  return false;
               });
            });
            band.dispatchEvent(new PointerEvent('click', { bubbles: true, cancelable: true, button: 0 }));
            const config = await reached;
            assert.ok(config, 'dnd5e started an attack roll');
         });

         it('draws the attack in the card and hides the attack\'s own card', async function ()
         {
            // Posted privately to the GM and deleted at the end.
            const results = await activity.use({ subsequentActions: false, consume: false }, { configure: false },
               { rollMode: 'selfroll' });
            const usage = results?.message;
            assert.ok(usage?.id, 'usage card posted');
            let attack = null;
            try
            {
               const [roll] = await activity.rollAttack({}, { configure: false },
                  { rollMode: 'selfroll', data: { system: { origin: usage.id } } }) ?? [];
               attack = roll?.parent ?? usage.getAssociatedRolls('attack').at(-1);
               assert.ok(attack, 'attack message posted');
               assert.isTrue((await attack.renderHTML()).hidden, 'attack card hidden');
               const html = await usage.renderHTML();
               const band = html.querySelector('.fhcs-band-rolled.fhcs-band-attack');
               assert.ok(band, 'rolled attack band');
               assert.strictEqual(Number(band.querySelector('.fhcs-band-total').textContent), attack.rolls[0].total);
               assert.ok(band.querySelector('.fhcs-die-primary'), 'primary d20 shown');
            }
            finally
            {
               await attack?.delete();
               await usage.delete();
            }
         });

         it('draws damage in the card, and rolls it again as a critical', async function ()
         {
            const results = await activity.use({ subsequentActions: false, consume: false }, { configure: false },
               { rollMode: 'selfroll' });
            const usage = results?.message;
            const damage = () => usage.getAssociatedRolls('damage');
            try
            {
               await activity.rollDamage({ isCritical: false }, { configure: false },
                  { rollMode: 'selfroll', data: { system: { origin: usage.id } } });
               assert.lengthOf(damage(), 1, 'damage message posted');
               assert.isTrue((await damage()[0].renderHTML()).hidden, 'damage card hidden');
               let html = await usage.renderHTML();
               let band = html.querySelector('.fhcs-band-rolled.fhcs-band-damage');
               assert.ok(band, 'rolled damage band');
               assert.strictEqual(Number(band.querySelector('.fhcs-band-total').textContent), damage()[0].rolls[0].total);

               // "Roll as critical" sits in the band and rolls the damage again, doubled.
               const button = band.querySelector('[data-fhcs-action="damageCritical"]');
               assert.ok(button, 'roll as critical offered');
               button.click();
               for (let waited = 0; (damage().length < 2) && (waited < 3000); waited += 100)
               {
                  await new Promise((resolve) => { setTimeout(resolve, 100); });
               }
               assert.lengthOf(damage(), 2, 'second damage message posted');
               assert.isTrue(damage().at(-1).rolls[0].isCritical, 'second roll is a critical');
               html = await usage.renderHTML();
               band = html.querySelector('.fhcs-band-rolled.fhcs-band-damage');
               assert.ok(band.querySelector('[data-fhcs-action="damageNormal"]'), 'now offers roll as normal');
            }
            finally
            {
               for (const message of damage()) { await message.delete(); }
               await usage.delete();
            }
         });

         it('lists each save in the card\'s save band, and rolls for selected tokens', async function ()
         {
            const [spell] = await actor.createEmbeddedDocuments('Item', [{ name: 'FHCS test blast', type: 'spell', system: { level: 1 } }]);
            const saveActivity = await spell.createActivity('save', { save: { ability: ['dex'] } }, { renderSheet: false })
               ?? spell.system.activities.contents[0];
            const results = await saveActivity.use({ subsequentActions: false, consume: false }, { configure: false },
               { rollMode: 'selfroll' });
            const usage = results?.message;
            let save = null;
            try
            {
               let html = await usage.renderHTML();
               assert.ok(html.querySelector('.fhcs-band-save [data-action="rollSave"]'), 'save band');
               assert.strictEqual(usage._targetState?.mode, 'selected', 'rolls for selected tokens');

               await actor.rollSavingThrow({ ability: 'dex', target: 99 }, { configure: false },
                  { rollMode: 'selfroll', data: { system: { origin: usage.id } } });
               save = usage.getAssociatedRolls('save').at(-1);
               assert.ok(save, 'save message posted');
               assert.isTrue((await save.renderHTML()).hidden, 'save card hidden');
               html = await usage.renderHTML();
               const row = html.querySelector(`.fhcs-row[data-message-id="${save.id}"]`);
               assert.ok(row, 'row for the save');
               assert.include(row.querySelector('.fhcs-row-verdict').textContent, 'Failure');
               assert.lengthOf(html.querySelectorAll('.card-summary'), 0, 'no repeat of dnd5e\'s summary');
            }
            finally
            {
               await save?.delete();
               await usage.delete();
               await spell.delete();
            }
         });
      });
   }, { displayName: 'Fallhammer Character Sheet: chat cards' });
}
