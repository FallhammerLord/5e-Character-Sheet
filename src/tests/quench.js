import { MODULE_ID, SHEET_ID, SYSTEM_ACTIONS } from '../constants.js';
import { addBonus, addD20, systemCharacterSheet } from '../compat.js';

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
            // dnd5e's sheet styles key on these; none may reach our window.
            for (const name of ['dnd5e2', 'vertical-tabs', 'hidden-title'])
            {
               assert.isFalse(sheet.element.classList.contains(name), `our window carries dnd5e's ${name}`);
            }
            assert.notOk(sheet.element.querySelector('.sidebar'), 'dnd5e\'s sidebar is gone');
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

         it('draws our header in place of dnd5e\'s header and ability scores', function ()
         {
            assert.ok(sheet.element.querySelector('.fhcs-header'), 'our header is on the sheet');
            assert.notOk(sheet.element.querySelector('.ability-scores'), 'dnd5e\'s ability scores are gone');
            assert.lengthOf(sheet.element.querySelectorAll('.fhcs-header .fhcs-ability[data-ability]'),
               Object.keys(CONFIG.DND5E.abilities).length, 'one column per ability');
         });

         it('rolls checks, saves and initiative from the header', async function ()
         {
            const [check] = await clickReaches('.fhcs-header [data-ability="dex"] .ability-check', 'dnd5e.preRollAbilityCheck');
            assert.strictEqual(check.ability, 'dex');
            const [save] = await clickReaches('.fhcs-header [data-ability="wis"] .saving-throw', 'dnd5e.preRollSavingThrow');
            assert.strictEqual(save.ability, 'wis');
            await clickReaches('.fhcs-header [data-type="initiative"]', 'dnd5e.preRollInitiativeDialog');
         });

         it('toggles inspiration and sets exhaustion from the portrait chips', async function ()
         {
            const before = !!actor.system.attributes.inspiration;
            const changed = (path) => new Promise((resolve) =>
            {
               const id = Hooks.on('updateActor', (doc, change) =>
               {
                  if (doc === actor && foundry.utils.hasProperty(change, path)) { Hooks.off('updateActor', id); resolve(); }
               });
            });
            let done = changed('system.attributes.inspiration');
            sheet.element.querySelector('.fhcs-header [data-action="toggleInspiration"]').click();
            await done;
            assert.strictEqual(!!actor.system.attributes.inspiration, !before);
            done = changed('system.attributes.exhaustion');
            sheet.element.querySelector('.fhcs-header [data-prop="system.attributes.exhaustion"] [data-n="2"]').click();
            await done;
            // dnd5e reads the level from an exhaustion effect it creates after the update (attributes.mjs:451).
            for (let waited = 0; actor.system.attributes.exhaustion !== 2 && waited < HOOK_WAIT_MS; waited += 50)
            {
               await new Promise((resolve) => { setTimeout(resolve, 50); });
            }
            assert.strictEqual(actor.system.attributes.exhaustion, 2);
         });

         it('records the order class levels were gained when advancement finishes', async function ()
         {
            const [cleric] = await actor.createEmbeddedDocuments('Item', [{ name: 'FHCS test cleric', type: 'class', system: { identifier: 'fhcs-cleric', levels: 2 } }]);
            Hooks.callAll('dnd5e.advancementManagerComplete', { actor });
            await new Promise((resolve) => { setTimeout(resolve, 500); });
            assert.deepEqual(actor.getFlag(MODULE_ID, 'levelOrder'), ['fhcs-cleric', 'fhcs-cleric']);
            await cleric.delete();
         });

         it('switches tabs from our tab row, and play and edit from its lock', async function ()
         {
            sheet.element.querySelector('.fhcs-tabs [data-tab="inventory"]').click();
            assert.strictEqual(sheet.tabGroups.primary, 'inventory');
            assert.isTrue(sheet.element.querySelector('.tab[data-tab="inventory"]').classList.contains('active'));
            sheet.element.querySelector('.fhcs-tabs [data-tab="details"]').click();
            assert.strictEqual(sheet.tabGroups.primary, 'details');
            // The lock: each click switches mode and the sheet redraws with the lock's new state.
            const flip = async () =>
            {
               const was = sheet.isEditMode;
               sheet.element.querySelector('.fhcs-tabs [data-action="changeMode"]').click();
               for (let waited = 0; sheet.isEditMode === was && waited < HOOK_WAIT_MS; waited += 50)
               {
                  await new Promise((resolve) => { setTimeout(resolve, 50); });
               }
               assert.notStrictEqual(sheet.isEditMode, was, 'the lock switched play and edit');
            };
            await flip();
            await flip();
         });

         it('rolls a skill from the Attributes tab, and toggles passives and folds groups for this player', async function ()
         {
            const [skill] = await clickReaches('.fhcs-attributes [data-key="prc"] [data-action="roll"]', 'dnd5e.preRollSkill');
            assert.strictEqual(skill.skill, 'prc');
            const before = game.user.getFlag(MODULE_ID, 'passives') ?? 'all';
            sheet.element.querySelector('.fhcs-attributes [data-action="fhcsTogglePassives"]').click();
            for (let waited = 0; (game.user.getFlag(MODULE_ID, 'passives') ?? 'all') === before && waited < HOOK_WAIT_MS; waited += 50)
            {
               await new Promise((resolve) => { setTimeout(resolve, 50); });
            }
            assert.notStrictEqual(game.user.getFlag(MODULE_ID, 'passives'), before, 'the passive toggle switched');
            await game.user.setFlag(MODULE_ID, 'passives', before);
         });

         it('shows death saves in the header at 0 HP, and rolls one from there', async function ()
         {
            // A new test character may already be at 0 HP (no class, no max), so this only checks the 0 HP side.
            const hp = actor.system.attributes.hp.value;
            await actor.update({ 'system.attributes.hp.value': 0 });
            await sheet.render();
            assert.ok(sheet.element.querySelector('.fhcs-header .fhcs-death'), 'death saves show at 0 HP');
            await clickReaches('.fhcs-header [data-type="deathSave"]', 'dnd5e.preRollDeathSave');
            await actor.update({ 'system.attributes.hp.value': hp });
            await sheet.render();
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
            // dnd5e uses a copy of the item (activity/mixin.mjs:229), so compare IDs.
            assert.strictEqual(activity.item.id, item.id);
         });

         /** Waits until a condition holds, or fails the test after HOOK_WAIT_MS. */
         const until = async (condition, what) =>
         {
            for (let waited = 0; !condition() && waited < HOOK_WAIT_MS; waited += 50)
            {
               await new Promise((resolve) => { setTimeout(resolve, 50); });
            }
            assert.isTrue(!!condition(), typeof what === 'function' ? what() : what);
         };

         it('equips, attunes, counts and opens items on the Inventory tab', async function ()
         {
            // Four saves, each with a redraw: more than Mocha's default 2 s, so each step has its own wait instead.
            this.timeout(HOOK_WAIT_MS * 5);
            const [ring] = await actor.createEmbeddedDocuments('Item', [{
               name: 'FHCS test ring', type: 'equipment',
               // dnd5e keeps attunement only on magical items (equippable-item.mjs:136).
               system: { attunement: 'required', properties: ['mgc'], equipped: false, attuned: false, quantity: 1 }
            }]);
            await sheet.render();
            const row = () => sheet.element.querySelector(`.fhcs-inventory [data-item-id="${ring.id}"]`);
            // On a failure, say what the row held instead.
            const found = (step) => () =>
            {
               // Plain words, not markup: Quench draws failure text as HTML.
               const r = row();
               if (!r) { return `${step}; the row is missing`; }
               const actions = [...r.querySelectorAll('[data-action]')].map((el) => el.dataset.action).join(', ');
               const fields = [...r.querySelectorAll('[data-name]')].map((el) => el.dataset.name).join(', ');
               return `${step}; the row has actions: ${actions || 'none'}; fields: ${fields || 'none'}`;
            };
            assert.ok(row(), 'the item has a row in our Inventory tab');
            assert.ok(row().querySelector('[data-action="attune"]'), found('an item that needs attunement has an attune toggle')());
            row().querySelector('[data-action="equip"]').click();
            await until(() => ring.system.equipped, 'the equip toggle equipped it');
            await until(() => row()?.querySelector('[data-action="attune"]'), found('the row redrew after equipping'));
            row().querySelector('[data-action="attune"]').click();
            await until(() => ring.system.attuned, 'the attune toggle attuned it');
            await until(() => row()?.querySelector('[data-name="system.quantity"]'), found('the row redrew after attuning'));
            const quantity = row().querySelector('[data-name="system.quantity"]');
            quantity.value = '+2';
            quantity.dispatchEvent(new Event('change', { bubbles: true }));
            await until(() => ring.system.quantity === 3, 'quantity takes a +2');
            await until(() => row()?.querySelector('[data-action="toggleExpand"]'), found('the row redrew after the quantity change'));
            row().querySelector('[data-action="toggleExpand"]').click();
            await until(() => row()?.querySelector('.item-summary'), 'the name opens dnd5e\'s summary');
            await ring.delete();
         });

         it('lists a container\'s contents under it, folds them, and takes items dropped on it', async function ()
         {
            this.timeout(HOOK_WAIT_MS * 4);
            const [pack] = await actor.createEmbeddedDocuments('Item', [{ name: 'FHCS test pack', type: 'container' }]);
            const [rope, torch] = await actor.createEmbeddedDocuments('Item', [
               { name: 'FHCS test rope', type: 'loot', system: { container: pack.id } },
               { name: 'FHCS test torch', type: 'loot' }
            ]);
            const flag = game.user.getFlag(MODULE_ID, 'openContainers');
            await sheet.render();
            const packRow = () => sheet.element.querySelector(`.fhcs-inventory [data-item-id="${pack.id}"]`);
            assert.isTrue(packRow()?.classList.contains('container'), 'the container row carries dnd5e\'s drop class');
            // Each create starts its own redraw; wait for the one that has the rope.
            await until(() => packRow()?.querySelector(`:scope > .fhcs-contents [data-item-id="${rope.id}"]`), 'the rope is drawn inside the pack');
            const list = packRow().querySelector(':scope > .fhcs-contents');
            const wasHidden = list.hidden;
            packRow().querySelector('[data-action="fhcsToggleContainer"]').click();
            assert.notStrictEqual(list.hidden, wasHidden, 'the fold button opens or shuts the contents');
            // dnd5e's own drop handler, as a drag of the torch onto the pack row would reach it.
            await sheet._onDropItem({ target: packRow().querySelector('.fhcs-item-name'), _behavior: 'move' }, torch);
            await until(() => torch.system.container === pack.id, 'a drop on the pack row puts the torch in it');
            await game.user.setFlag(MODULE_ID, 'openContainers', flag ?? []);
            await actor.deleteEmbeddedDocuments('Item', [pack.id, rope.id, torch.id]);
         });

         it('closes an open tray when the player clicks off it, not when they click inside it', function ()
         {
            const tray = sheet.element.querySelector('.fhcs-header details.fhcs-fold[data-fold-key="exhaustion"]');
            assert.ok(tray, 'the exhaustion chip has a tray');
            tray.open = true;
            tray.querySelector('.fhcs-tray').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
            assert.isTrue(tray.open, 'a click inside keeps it open');
            sheet.element.querySelector('.fhcs-tabs').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
            assert.isFalse(tray.open, 'a click elsewhere closes it');
         });

         it('shows and hides Inventory columns from edit mode, for this player', async function ()
         {
            this.timeout(HOOK_WAIT_MS * 4);
            const before = game.settings.get(MODULE_ID, 'inventoryColumns');
            assert.notOk(sheet.element.querySelector('[data-action="fhcsToggleColumn"]'), 'no column menu in play mode');
            sheet.element.querySelector('.fhcs-tabs [data-action="changeMode"]').click();
            await until(() => sheet.isEditMode && sheet.element.querySelector('[data-action="fhcsToggleColumn"]'), 'edit mode shows the column menu');
            const weight = () => !!sheet.element.querySelector('.fhcs-inventory .fhcs-item-head .fhcs-col-weight');
            const had = weight();
            sheet.element.querySelector('[data-action="fhcsToggleColumn"][data-column="weight"]').click();
            await until(() => weight() !== had, 'the weight column switched');
            await game.settings.set(MODULE_ID, 'inventoryColumns', before);
            sheet.element.querySelector('.fhcs-tabs [data-action="changeMode"]').click();
            await until(() => !sheet.isEditMode, 'back to play mode');
         });
      });
   }, { displayName: 'Fallhammer Character Sheet: core' });

   // Chat cards: uses an item without posting (dnd5e returns the message data), renders it in memory, and clicks it.
   quench.registerBatch(`${MODULE_ID}.chat`, (context) =>
   {
      const { describe, it, assert, before, after } = context;
      let actor = null;
      let activity = null;
      let rollDamageOnUse = true;

      /** Waits up to three seconds for a condition. */
      const waitFor = async (condition) =>
      {
         for (let waited = 0; !condition() && (waited < 3000); waited += 100)
         {
            await new Promise((resolve) => { setTimeout(resolve, 100); });
         }
      };

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
            // Damage on use would add rolls mid-test; the test for it switches it back on.
            rollDamageOnUse = game.settings.get(MODULE_ID, 'rollDamageOnUse');
            await game.settings.set(MODULE_ID, 'rollDamageOnUse', false);
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
            if (game.user.isGM) { await game.settings.set(MODULE_ID, 'rollDamageOnUse', rollDamageOnUse); }
         });

         it('draws usage cards with our model', function ()
         {
            assert.strictEqual(CONFIG.ChatMessage.dataModels.usage.name, 'FHCSUsageMessageData');
         });

         it('posts folded rolls without scrolling the chat log', function ()
         {
            assert.isTrue(Boolean(ui.chat.constructor.prototype.postOne.fhcsQuiet), 'ChatLog#postOne wrapped');
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
            // dnd5e's card clicks find the message in game.messages, so this card is posted privately and deleted.
            const results = await activity.use({ subsequentActions: false, consume: false }, { configure: false },
               { rollMode: 'selfroll' });
            const usage = results?.message;
            assert.ok(usage?.id, 'usage card posted');
            let id = null;
            let timer = null;
            try
            {
               const html = await usage.renderHTML();
               const band = html.querySelector('.fhcs-band[data-action="rollAttack"]');
               assert.ok(band, 'attack band');
               const reached = new Promise((resolve, reject) =>
               {
                  timer = setTimeout(() => reject(new Error('never reached dnd5e.preRollAttackV2')), HOOK_WAIT_MS);
                  id = Hooks.on('dnd5e.preRollAttackV2', (config) => { resolve(config); return false; });
               });
               band.dispatchEvent(new PointerEvent('click', { bubbles: true, cancelable: true, button: 0 }));
               assert.ok(await reached, 'dnd5e started an attack roll');
            }
            finally
            {
               // Always unhook, so a failure here can't cancel the next test's attack.
               clearTimeout(timer);
               if (id !== null) { Hooks.off('dnd5e.preRollAttackV2', id); }
               await usage.delete();
            }
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
               const tray = html.querySelector(`.fhcs-apply-damage[data-message-id="${damage()[0].id}"] damage-application`);
               assert.ok(tray, 'apply-damage tray bound to the damage roll');
               assert.isTrue(tray.hasAttribute('open'), 'apply tray unfolded');

               // "Roll as critical" sits in the band and rolls the damage again, doubled.
               assert.strictEqual(band.querySelector('[data-fhcs-action="damageAgain"]')?.dataset.critical, 'false',
                  'Roll again keeps normal damage normal');
               const button = band.querySelector('[data-fhcs-action="damageCritical"]');
               assert.ok(button, 'roll as critical offered');
               button.click();
               await waitFor(() => damage().length >= 2);
               assert.lengthOf(damage(), 2, 'second damage message posted');
               assert.isTrue(damage().at(-1).rolls[0].isCritical, 'second roll is a critical');
               html = await usage.renderHTML();
               band = html.querySelector('.fhcs-band-rolled.fhcs-band-damage');
               assert.ok(band.querySelector('[data-fhcs-action="damageNormal"]'), 'now offers roll as normal');
               assert.strictEqual(band.querySelector('[data-fhcs-action="damageAgain"]')?.dataset.critical, 'true',
                  'Roll again keeps critical damage critical');
            }
            finally
            {
               for (const message of damage()) { await message.delete(); }
               await usage.delete();
            }
         });

         it('skips roll dialogs unless the skip-dialog key is held', function ()
         {
            const dialog = {};
            Hooks.call('dnd5e.preRoll', { event: null }, dialog, {});
            assert.strictEqual(dialog.configure, game.settings.get(MODULE_ID, 'noRollDialogs') ? false : undefined);
         });

         it('rolls damage after an attack made from the card, critical when the attack is', async function ()
         {
            await game.settings.set(MODULE_ID, 'rollDamageOnUse', true);
            const results = await activity.use({ subsequentActions: false, consume: false }, { configure: false },
               { rollMode: 'selfroll' });
            const usage = results?.message;
            try
            {
               const [roll] = await activity.rollAttack({}, { configure: false },
                  { rollMode: 'selfroll', data: { system: { origin: usage.id } } }) ?? [];
               await waitFor(() => usage.getAssociatedRolls('damage').length > 0);
               const [damage] = usage.getAssociatedRolls('damage');
               assert.ok(damage, 'damage rolled after the attack');
               assert.strictEqual(damage.rolls[0].isCritical, roll.isCritical === true);
            }
            finally
            {
               await game.settings.set(MODULE_ID, 'rollDamageOnUse', false);
               for (const message of usage.getAssociatedRolls()) { await message.delete(); }
               await usage.delete();
            }
         });

         it('adds late advantage, disadvantage and a bonus to an attack, in place', async function ()
         {
            const results = await activity.use({ subsequentActions: false, consume: false }, { configure: false },
               { rollMode: 'selfroll' });
            const usage = results?.message;
            try
            {
               await activity.rollAttack({}, { configure: false },
                  { rollMode: 'selfroll', data: { system: { origin: usage.id } } });
               const attack = () => usage.getAssociatedRolls('attack').at(-1);
               const first = attack().rolls[0];
               const primary = first.d20.results[0].result;
               const bonus = first.total - first.d20.total;
               const spare = first.options.fhcs?.spare;

               await addD20(attack(), 'adv');
               let roll = attack().rolls[0];
               const advDie = roll.d20.results.at(-1).result;
               if (spare) { assert.strictEqual(advDie, spare, 'the spare d20 is used first'); }
               assert.strictEqual(roll.options.advantageMode, 1);
               assert.strictEqual(roll.total, Math.max(primary, advDie) + bonus, 'higher die counts');

               await addD20(attack(), 'dis');
               roll = attack().rolls[0];
               const disDie = roll.d20.results.at(-1).result;
               // Click order decides: the disadvantage die counts only if lower than the die counting before it.
               const counted = Math.min(Math.max(primary, advDie), disDie);
               assert.strictEqual(roll.options.advantageMode, -1, 'last click was disadvantage');
               assert.strictEqual(roll.total, counted + bonus, 'disadvantage compares with the counting die');
               assert.lengthOf(roll.d20.results, 3, 'no die erased');

               assert.isTrue(await addBonus(attack(), '2'));
               assert.strictEqual(attack().rolls[0].total, counted + bonus + 2, 'bonus added as its own term');
            }
            finally
            {
               for (const message of usage.getAssociatedRolls()) { await message.delete(); }
               await usage.delete();
            }
         });

         it('draws a skill check from the sheet as its own card with a rolled d20 band', async function ()
         {
            await actor.rollSkill({ skill: 'prc' }, { configure: false }, { rollMode: 'selfroll' });
            const message = game.messages.contents.filter((m) => (m.type === 'check') && (m.speaker.actor === actor.id)).at(-1);
            try
            {
               assert.ok(message, 'check posted');
               const html = await message.renderHTML();
               assert.isFalse(html.hidden, 'its own card shows');
               assert.ok(html.querySelector('.fhcs-card .fhcs-card-header'), 'our header');
               const band = html.querySelector('.fhcs-band-rolled');
               assert.ok(band, 'rolled d20 band');
               assert.strictEqual(Number(band.querySelector('.fhcs-band-total').textContent), message.rolls[0].total);
               assert.ok(band.querySelector('[data-fhcs-action="lateAdvantage"]'), 'late advantage offered');
               assert.notOk(band.querySelector('[data-fhcs-action="lateAdvantage"]').dataset.tooltip,
                  'no instant Foundry tooltip on the slot (ours waits)');
            }
            finally { await message?.delete(); }
         });

         it('draws a GM request with a row per party member and dnd5e\'s roll action', async function ()
         {
            const message = new ChatMessage.implementation({
               type: 'request',
               content: '<p>FHCS test request</p>',
               system: { handler: 'fhcsTest', button: { label: 'Roll something' }, targets: [{ actor: actor.uuid }] }
            });
            const html = await message.renderHTML();
            const row = html.querySelector(`.fhcs-row[data-uuid="${actor.uuid}"]`);
            assert.ok(row, 'row for the party member');
            assert.ok(row.querySelector('[data-action="handleRequest"]'), 'roll button keeps dnd5e\'s action');
         });

         it('keeps an opened band open when the card renders again', async function ()
         {
            const results = await activity.use({ subsequentActions: false, consume: false }, { configure: false },
               { rollMode: 'selfroll' });
            const usage = results?.message;
            try
            {
               await activity.rollAttack({}, { configure: false },
                  { rollMode: 'selfroll', data: { system: { origin: usage.id } } });
               const band = (html) => html.querySelector('details.fhcs-band-rolled.fhcs-band-attack');
               const first = band(await usage.renderHTML());
               assert.isFalse(first.open, 'starts folded');
               const toggled = new Promise((resolve) => { first.addEventListener('toggle', resolve, { once: true }); });
               first.open = true;
               await toggled;
               assert.isTrue(band(await usage.renderHTML()).open, 'still open after a re-render');
            }
            finally
            {
               for (const message of usage.getAssociatedRolls()) { await message.delete(); }
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
