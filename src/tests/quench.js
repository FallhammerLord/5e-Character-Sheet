import { MODULE_ID, SHEET_ID, SYSTEM_ACTIONS } from '../constants.js';
import { addBonus, addD20, systemCharacterSheet } from '../compat.js';

/** How long a click may take to reach dnd5e's hook before a test fails. */
const HOOK_WAIT_MS = 3000;

/** How long a change gets to start its sheet redraws before `settled()` waits them out. */
const REDRAW_START_MS = 100;

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

      /*
       * The redraw rule (CLAUDE.md): a click on markup a pending redraw is about to replace never reaches the sheet,
       * and that failed several tests at random (2026-10-26). So every click and input here goes through `click`,
       * `clickReaches` or `enter`: each waits for the sheet to settle, then finds its element by selector, fresh.
       * The load check fails on a bare `.click()` or `dispatchEvent(` in this batch.
       */

      /** Waits for the redraws a change started, then draws once more and waits for that. */
      const settled = async () =>
      {
         await new Promise((resolve) => { setTimeout(resolve, REDRAW_START_MS); });
         await sheet.render();
      };

      /** @returns {HTMLElement} The sheet's element for a selector, now; fails the test if there is none. */
      const find = (selector) =>
      {
         const element = sheet.element.querySelector(selector);
         assert.ok(element, `no element matches ${selector}`);
         return element;
      };

      /** Once the sheet has settled, clicks the element a selector finds. */
      const click = async (selector) =>
      {
         await settled();
         find(selector).click(); // redraw-safe: after settled()
      };

      /** Once the sheet has settled, types a value into a field and sends its change. */
      const enter = async (selector, value) =>
      {
         await settled();
         const field = find(selector);
         field.value = value;
         field.dispatchEvent(new Event('change', { bubbles: true })); // redraw-safe: after settled()
      };

      /**
       * Creates items and returns them in the order given, matched by name: Foundry's result need not keep that order,
       * and a test that took it on trust mixed up its spells (2026-10-26).
       */
      const createItems = async (data) =>
      {
         const made = await actor.createEmbeddedDocuments('Item', data);
         return data.map((d) => made.find((item) => item.name === d.name));
      };

      /** Waits until a condition holds, or fails the test after HOOK_WAIT_MS. */
      const until = async (condition, what) =>
      {
         for (let waited = 0; !condition() && waited < HOOK_WAIT_MS; waited += 50)
         {
            await new Promise((resolve) => { setTimeout(resolve, 50); });
         }
         assert.isTrue(!!condition(), typeof what === 'function' ? what() : what);
      };

      /**
       * Once the sheet has settled, clicks an element (Shift held, as a fast-forward) and resolves with the hook's
       * arguments, or rejects.
       */
      const clickReaches = async (selector, hook) =>
      {
         await settled();
         return clickNow(selector, hook);
      };

      const clickNow = (selector, hook) => new Promise((resolve, reject) =>
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
         element.dispatchEvent(new PointerEvent('click', { bubbles: true, cancelable: true, shiftKey: true })); // redraw-safe: clickReaches settles first
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
            await click('.fhcs-header [data-action="toggleInspiration"]');
            await done;
            assert.strictEqual(!!actor.system.attributes.inspiration, !before);
            done = changed('system.attributes.exhaustion');
            await click('.fhcs-header [data-prop="system.attributes.exhaustion"] [data-n="2"]');
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
            await click('.fhcs-tabs [data-tab="inventory"]');
            assert.strictEqual(sheet.tabGroups.primary, 'inventory');
            assert.isTrue(sheet.element.querySelector('.tab[data-tab="inventory"]').classList.contains('active'));
            await click('.fhcs-tabs [data-tab="details"]');
            assert.strictEqual(sheet.tabGroups.primary, 'details');
            // The lock: each click switches mode and the sheet redraws with the lock's new state.
            const flip = async () =>
            {
               const was = sheet.isEditMode;
               await click('.fhcs-tabs [data-action="changeMode"]');
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
            await click('.fhcs-attributes [data-action="fhcsTogglePassives"]');
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
            await click(`.fhcs-inventory [data-item-id="${ring.id}"] [data-action="equip"]`);
            await until(() => ring.system.equipped, 'the equip toggle equipped it');
            await until(() => row()?.querySelector('[data-action="attune"]'), found('the row redrew after equipping'));
            await click(`.fhcs-inventory [data-item-id="${ring.id}"] [data-action="attune"]`);
            await until(() => ring.system.attuned, 'the attune toggle attuned it');
            await until(() => row()?.querySelector('[data-name="system.quantity"]'), found('the row redrew after attuning'));
            await enter(`.fhcs-inventory [data-item-id="${ring.id}"] [data-name="system.quantity"]`, '+2');
            await until(() => ring.system.quantity === 3, 'quantity takes a +2');
            await until(() => row()?.querySelector('[data-action="toggleExpand"]'), found('the row redrew after the quantity change'));
            await click(`.fhcs-inventory [data-item-id="${ring.id}"] [data-action="toggleExpand"]`);
            await until(() => row()?.querySelector('.item-summary'), 'the name opens dnd5e\'s summary');
            await ring.delete();
         });

         it('lists a container\'s contents under it, folds them, and takes items dropped on it', async function ()
         {
            this.timeout(HOOK_WAIT_MS * 4);
            const [pack] = await actor.createEmbeddedDocuments('Item', [{ name: 'FHCS test pack', type: 'container' }]);
            const [rope, torch] = await createItems([
               { name: 'FHCS test rope', type: 'loot', system: { container: pack.id } },
               { name: 'FHCS test torch', type: 'loot' }
            ]);
            const flag = game.user.getFlag(MODULE_ID, 'openContainers');
            await sheet.render();
            const packRow = () => sheet.element.querySelector(`.fhcs-inventory [data-item-id="${pack.id}"]`);
            assert.isTrue(packRow()?.classList.contains('container'), 'the container row carries dnd5e\'s drop class');
            // Each create starts its own redraw; wait for the one that has the rope.
            await until(() => packRow()?.querySelector(`:scope > .fhcs-contents [data-item-id="${rope.id}"]`), 'the rope is drawn inside the pack');
            const shut = () => packRow()?.querySelector(':scope > .fhcs-contents')?.hidden;
            const wasShut = shut();
            await click(`.fhcs-inventory [data-item-id="${pack.id}"] > .fhcs-item-row [data-action="fhcsToggleContainer"]`);
            await until(() => shut() !== wasShut, 'the fold button opens or shuts the contents');
            // dnd5e's own drop handler, as a drag of the torch onto the pack row would reach it.
            await settled();
            await sheet._onDropItem({ target: find(`.fhcs-inventory [data-item-id="${pack.id}"] .fhcs-item-name`), _behavior: 'move' }, torch);
            await until(() => torch.system.container === pack.id, 'a drop on the pack row puts the torch in it');
            await game.user.setFlag(MODULE_ID, 'openContainers', flag ?? []);
            await actor.deleteEmbeddedDocuments('Item', [pack.id, rope.id, torch.id]);
         });

         it('closes an open tray when the player clicks off it, not when they click inside it', async function ()
         {
            // Nothing below redraws the sheet, so one wait covers both presses.
            await settled();
            const tray = sheet.element.querySelector('.fhcs-header details.fhcs-fold[data-fold-key="exhaustion"]');
            assert.ok(tray, 'the exhaustion chip has a tray');
            tray.open = true;
            tray.querySelector('.fhcs-tray').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); // redraw-safe: after settled()
            assert.isTrue(tray.open, 'a click inside keeps it open');
            sheet.element.querySelector('.fhcs-tabs').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); // redraw-safe: after settled()
            assert.isFalse(tray.open, 'a click elsewhere closes it');
         });

         it('shows and hides Inventory columns from edit mode, for this player', async function ()
         {
            this.timeout(HOOK_WAIT_MS * 4);
            const before = game.settings.get(MODULE_ID, 'inventoryColumns');
            assert.notOk(sheet.element.querySelector('[data-action="fhcsToggleColumn"]'), 'no column menu in play mode');
            await click('.fhcs-tabs [data-action="changeMode"]');
            await until(() => sheet.isEditMode && sheet.element.querySelector('[data-action="fhcsToggleColumn"]'), 'edit mode shows the column menu');
            const weight = () => !!sheet.element.querySelector('.fhcs-inventory .fhcs-item-head .fhcs-col-weight');
            const had = weight();
            await click('[data-action="fhcsToggleColumn"][data-list="inventory"][data-column="weight"]');
            await until(() => weight() !== had, 'the weight column switched');
            await game.settings.set(MODULE_ID, 'inventoryColumns', before);
            await click('.fhcs-tabs [data-action="changeMode"]');
            await until(() => !sheet.isEditMode, 'back to play mode');
         });

         it('lists spells by section and prepares them from the book', async function ()
         {
            this.timeout(HOOK_WAIT_MS * 4);
            const [open, always, cantrip] = await createItems([
               { name: 'FHCS test bolt', type: 'spell', system: { level: 1, method: 'spell', prepared: 0 } },
               { name: 'FHCS test ward', type: 'spell', system: { level: 1, method: 'spell', prepared: 2 } },
               { name: 'FHCS test spark', type: 'spell', system: { level: 0, method: 'spell' } }
            ]);
            const row = (spell) => sheet.element.querySelector(`.fhcs-spellbook [data-item-id="${spell.id}"]`);
            await settled();
            await until(() => row(open) && row(always) && row(cantrip), 'the three spells have rows on our Spellbook tab');
            // Each create starts its own redraw; wait for one that has settled, and say where each spell landed.
            const section = (spell) => row(spell)?.closest('[data-fhcs-section]')?.dataset.fhcsSection;
            // What dnd5e holds for each spell, and where its own spellbook files it, in case they differ from ours.
            const held = (spell) =>
            {
               const book = Object.values(sheet._prepareSpellbook?.({ itemCategories: { spells: [open, always, cantrip] } }) ?? {});
               const filed = book.find((s) => s.items.includes(spell))?.slot;
               return `level ${spell.system.level}, method ${spell.system.method}, prepared ${spell.system.prepared}, dnd5e files it in ${filed}`;
            };
            await until(() => section(open) && section(open) === section(always),
               () => `both level 1 spells share a section; the unprepared one is in ${section(open)} (${held(open)}), the always prepared one in ${section(always)} (${held(always)})`);
            assert.notOk(row(cantrip).querySelector('[data-action="prepare"]'), 'a cantrip has no prepare mark');
            assert.strictEqual(row(always).querySelector('[data-action="prepare"]')?.getAttribute('aria-disabled'), 'true',
               `always prepared can't be clicked (${held(always)})`);
            await click(`.fhcs-spellbook [data-item-id="${open.id}"] [data-action="prepare"]`);
            await until(() => open.system.prepared === 1, 'the book prepared the spell');
            await until(() => row(open)?.classList.contains('fhcs-kind-prepared'), 'the row took the prepared color');
            await click(`.fhcs-spellbook [data-item-id="${always.id}"] [data-action="prepare"]`);
            await settled();
            assert.strictEqual(always.system.prepared, 2, 'a click on always prepared changes nothing');
            // The bookmark in the row favorites the spell, as dnd5e's right-click menu does.
            const favorite = () => actor.system.favorites.some((f) => f.id === open.getRelativeUUID(actor));
            const wasFavorite = favorite();
            await until(() => row(open)?.querySelector('[data-action="toggleFavorite"]'), 'the row has a favorite toggle');
            await click(`.fhcs-spellbook [data-item-id="${open.id}"] [data-action="toggleFavorite"]`);
            await until(() => favorite() !== wasFavorite, 'the bookmark toggled the favorite');
            await actor.deleteEmbeddedDocuments('Item', [open.id, always.id, cantrip.id]);
         });

         it('filters spells from a pinned button and shows the pin pressed', async function ()
         {
            this.timeout(HOOK_WAIT_MS * 3);
            const [ready, idle] = await createItems([
               { name: 'FHCS test ready', type: 'spell', system: { level: 1, method: 'spell', prepared: 1 } },
               { name: 'FHCS test idle', type: 'spell', system: { level: 1, method: 'spell', prepared: 0 } }
            ]);
            const row = (spell) => sheet.element.querySelector(`.fhcs-spellbook [data-item-id="${spell.id}"]`);
            const pin = () => sheet.element.querySelector('.fhcs-spellbook [data-action="fhcsPinFilter"][data-filter="prepared"]');
            await settled();
            await until(() => row(ready) && row(idle) && pin(), 'both spells and the Prepared pin are drawn');
            await click('.fhcs-spellbook [data-action="fhcsPinFilter"][data-filter="prepared"]');
            await until(() => row(idle).hidden && !row(ready).hidden, 'the Prepared pin hides the unprepared spell');
            assert.strictEqual(pin().getAttribute('aria-pressed'), 'true', 'the pin shows it is on');
            await click('.fhcs-spellbook [data-action="fhcsPinFilter"][data-filter="prepared"]');
            await until(() => !row(idle).hidden, 'a second click shows it again');
            assert.strictEqual(pin().getAttribute('aria-pressed'), 'false', 'the pin shows it is off');
            await actor.deleteEmbeddedDocuments('Item', [ready.id, idle.id]);
         });

         it('shows the spell held in concentration, rolls its save and ends it', async function ()
         {
            this.timeout(HOOK_WAIT_MS * 4);
            const [spell] = await actor.createEmbeddedDocuments('Item', [
               { name: 'FHCS test guardians', type: 'spell', system: { level: 3, method: 'spell', prepared: 1, properties: ['concentration'] } }
            ]);
            const bar = () => sheet.element.querySelector('.fhcs-spellbook .fhcs-concentration');
            assert.notOk(bar()?.classList.contains('fhcs-on'), 'the bar starts idle');
            const [effect] = await actor.createEmbeddedDocuments('ActiveEffect', [{
               name: 'Concentrating', img: spell.img, statuses: [CONFIG.specialStatusEffects.CONCENTRATING],
               flags: { dnd5e: { item: { id: spell.id } } }
            }]);
            await settled();
            await until(() => bar()?.querySelector(`[data-item-id="${spell.id}"]`), 'the bar names the spell');
            assert.isTrue(bar().classList.contains('fhcs-on'), 'the bar shows concentration is on');
            await clickReaches('.fhcs-spellbook .fhcs-concentration [data-action="roll"]', 'dnd5e.preRollConcentration');
            await click(`.fhcs-spellbook [data-action="fhcsEndConcentration"][data-effect-id="${effect.id}"]`);
            await until(() => !actor.effects.get(effect.id), 'End removes the concentration effect');
            await until(() => !bar()?.classList.contains('fhcs-on'), 'the bar goes idle');
            await spell.delete();
         });

         it('shows and hides Spellbook columns from edit mode', async function ()
         {
            this.timeout(HOOK_WAIT_MS * 4);
            const before = game.settings.get(MODULE_ID, 'spellColumns');
            const [spell] = await actor.createEmbeddedDocuments('Item', [{ name: 'FHCS test light', type: 'spell', system: { level: 0 } }]);
            await click('.fhcs-tabs [data-action="changeMode"]');
            await until(() => sheet.isEditMode && sheet.element.querySelector('[data-action="fhcsToggleColumn"][data-list="spells"]'),
               'edit mode shows the Spellbook column menu');
            const school = () => !!sheet.element.querySelector('.fhcs-spellbook .fhcs-item-head .fhcs-col-school');
            const had = school();
            await click('[data-action="fhcsToggleColumn"][data-list="spells"][data-column="school"]');
            await until(() => school() !== had, 'the school column switched');
            await game.settings.set(MODULE_ID, 'spellColumns', before);
            await click('.fhcs-tabs [data-action="changeMode"]');
            await until(() => !sheet.isEditMode, 'back to play mode');
            await spell.delete();
         });

         it('opens a favorite\'s details from its name and uses it from its picture, on Attributes', async function ()
         {
            this.timeout(HOOK_WAIT_MS * 4);
            const [axe] = await actor.createEmbeddedDocuments('Item', [{ name: 'FHCS test axe', type: 'weapon' }]);
            await axe.createActivity('attack', {}, { renderSheet: false });
            await actor.system.addFavorite({ type: 'item', id: axe.getRelativeUUID(actor) });
            await settled();
            const fav = () => sheet.element.querySelector(`.fhcs-attributes [data-favorite-id="${axe.getRelativeUUID(actor)}"]`);
            await until(() => fav()?.querySelector('[data-action="fhcsToggleFavoriteDetails"]'), 'the favorite\'s name opens its details');
            await click(`.fhcs-attributes [data-favorite-id="${axe.getRelativeUUID(actor)}"] [data-action="fhcsToggleFavoriteDetails"]`);
            await until(() => fav()?.querySelector('.fhcs-favorite-details .item-summary'), 'dnd5e\'s summary opens under the row');
            assert.notOk(axe.sheet?.rendered, 'no item window opened');
            const [activity] = await clickReaches(`.fhcs-attributes [data-favorite-id="${axe.getRelativeUUID(actor)}"] .fhcs-favorite-pic`,
               'dnd5e.preUseActivity');
            assert.strictEqual(activity.item.id, axe.id, 'the picture uses the item');
            await axe.delete();
         });

         it('lists features by source, switches to active and passive, uses and favorites a feature', async function ()
         {
            this.timeout(HOOK_WAIT_MS * 6);
            const flag = 'sheetPrefs.character.tabs.features.group';
            const before = game.user.getFlag('dnd5e', flag);
            await game.user.unsetFlag('dnd5e', flag);
            const [rage, tough] = await createItems([
               { name: 'FHCS test rage', type: 'feat' },
               { name: 'FHCS test tough', type: 'feat' }
            ]);
            await rage.createActivity('utility', {}, { renderSheet: false });
            const row = (item) => sheet.element.querySelector(`.fhcs-features [data-item-id="${item.id}"]`);
            const home = (item, key) => row(item)?.closest('.items-section')?.getAttribute(`data-group-${key}`);
            await settled();
            await until(() => row(rage) && row(tough), 'both features have rows on our Features tab');
            // Neither came from a class, species or background, so dnd5e files both under Other.
            await until(() => home(rage, 'origin') === 'other' && home(tough, 'origin') === 'other',
               () => `both start in Other; found ${home(rage, 'origin')} and ${home(tough, 'origin')} (rows say ${row(rage)?.dataset.groupOrigin}, ${row(tough)?.dataset.groupOrigin})`);
            await click('.fhcs-features [data-action="fhcsCycleGroup"]');
            await until(() => home(rage, 'activation') === 'active' && home(tough, 'activation') === 'passive',
               () => `the switch moves them to Active and Passive; found ${home(rage, 'activation')} and ${home(tough, 'activation')} (rows say ${row(rage)?.dataset.groupActivation}, ${row(tough)?.dataset.groupActivation})`);
            assert.include(sheet.element.querySelector('.fhcs-features .fhcs-group')?.textContent ?? '', game.i18n.localize('FHCS.Features.Group.activation'),
               'the button names the grouping now in force');
            const [activity] = await clickReaches(`.fhcs-features [data-item-id="${rage.id}"] [data-action="use"]`, 'dnd5e.preUseActivity');
            assert.strictEqual(activity.item.id, rage.id, 'the picture uses the feature');
            const favorite = () => actor.system.favorites.some((f) => f.id === tough.getRelativeUUID(actor));
            const wasFavorite = favorite();
            await click(`.fhcs-features [data-item-id="${tough.id}"] [data-action="toggleFavorite"]`);
            await until(() => favorite() !== wasFavorite, 'the bookmark toggled the favorite');
            if (before === undefined) { await game.user.unsetFlag('dnd5e', flag); }
            else { await game.user.setFlag('dnd5e', flag, before); }
            await actor.deleteEmbeddedDocuments('Item', [rage.id, tough.id]);
         });

         it('levels a class up from its card, and offers to choose what is missing', async function ()
         {
            this.timeout(HOOK_WAIT_MS * 4);
            const [cls] = await actor.createEmbeddedDocuments('Item', [
               { name: 'FHCS test class', type: 'class', system: { identifier: 'fhcs-test', levels: 1 } }
            ]);
            await settled();
            const card = () => sheet.element.querySelector(`.fhcs-features .fhcs-class-card[data-item-id="${cls.id}"]`);
            await until(() => card()?.querySelector('[data-action="fhcsLevelUp"]'), 'the class has a card with Level up');
            for (const type of ['race', 'background'])
            {
               if (actor.system.details[type] && typeof actor.system.details[type] === 'object') { continue; }
               assert.ok(sheet.element.querySelector(`.fhcs-features [data-action="findItem"][data-item-type="${type}"]`),
                  `a missing ${type} offers dnd5e's Choose`);
            }
            const Manager = globalThis.dnd5e.applications.advancement.AdvancementManager;
            const wizard = () => [...foundry.applications.instances.values()].find((app) => app instanceof Manager && app.actor === actor);
            await click(`.fhcs-features .fhcs-class-card[data-item-id="${cls.id}"] [data-action="fhcsLevelUp"]`);
            // With advancement steps, dnd5e's wizard opens; with none (or advancements off), the level just goes up.
            await until(() => wizard() || cls.system.levels === 2,
               () => `Level up opens dnd5e's wizard or raises the level; the class is level ${cls.system.levels}`);
            await wizard()?.close();
            await cls.delete();
         });

         it('switches an effect off and on, favorites it, and toggles a condition from the Effects tab', async function ()
         {
            this.timeout(HOOK_WAIT_MS * 6);
            const [effect] = await actor.createEmbeddedDocuments('ActiveEffect', [{ name: 'FHCS test ward', img: 'icons/svg/aura.svg' }]);
            const row = () => sheet.element.querySelector(`.fhcs-effects [data-effect-id="${effect.id}"]`);
            const category = () => row()?.closest('[data-effect-type]')?.dataset.effectType;
            await settled();
            await until(() => row()?.querySelector('[data-action="toggle"]'), 'the effect has a row with a switch');
            assert.strictEqual(row().querySelector('[data-action="toggle"]').getAttribute('aria-pressed'), 'true', 'the switch starts on');
            const place = () => [...(row()?.closest('ol')?.children ?? [])].indexOf(row());
            const [was, wasAt] = [category(), place()];
            await click(`.fhcs-effects [data-effect-id="${effect.id}"] [data-action="toggle"]`);
            await until(() => effect.disabled && row()?.querySelector('[data-action="toggle"]')?.getAttribute('aria-pressed') === 'false',
               () => `the switch turns it off and shows it; disabled ${effect.disabled}`);
            // Switching never moves the row (user, 2026-10-26): dnd5e would file it under Inactive.
            assert.strictEqual(`${category()} ${place()}`, `${was} ${wasAt}`, 'the row stays where it was');
            await click(`.fhcs-effects [data-effect-id="${effect.id}"] [data-action="toggle"]`);
            await until(() => !effect.disabled, 'a second click turns it back on');
            const relative = foundry.utils.buildRelativeUuid(effect, actor);
            await click(`.fhcs-effects [data-effect-id="${effect.id}"] [data-action="favorite"]`);
            await until(() => actor.system.hasFavorite(relative), 'the bookmark makes it a favorite');
            await until(() => row()?.querySelector('[data-action="unfavorite"]'), 'the bookmark now offers to remove it');
            await click(`.fhcs-effects [data-effect-id="${effect.id}"] [data-action="unfavorite"]`);
            await until(() => !actor.system.hasFavorite(relative), 'a second click removes the favorite');
            const prone = () => actor.statuses.has('prone');
            const had = prone();
            await click('.fhcs-effects [data-action="toggleCondition"][data-condition-id="prone"]');
            await until(() => prone() !== had, () => `the Prone button toggles the condition; prone is ${prone()}`);
            await until(() => sheet.element.querySelector('.fhcs-effects [data-condition-id="prone"]')?.getAttribute('aria-pressed') === String(!had),
               'the Prone button shows its new state');
            await click('.fhcs-effects [data-action="toggleCondition"][data-condition-id="prone"]');
            await until(() => prone() === had, 'a second click puts it back');
            await effect.delete();
         });

         it('shows every biography field from dnd5e\'s data, and saves one edited without unlocking', async function ()
         {
            this.timeout(HOOK_WAIT_MS * 4);
            const before = foundry.utils.deepClone(actor._source.system.details);
            await actor.update({ 'system.details.ideal': 'FHCS test ideal', 'system.details.bond': '' });
            await settled();
            const field = (key) => sheet.element.querySelector(`.fhcs-biography [name="system.details.${key}"]`);
            assert.isFalse(sheet.isEditMode, 'the sheet is locked');
            await until(() => field('ideal')?.value === 'FHCS test ideal', 'the ideal written through dnd5e shows in its field');
            assert.ok(field('bond'), 'an empty box still shows, ready to write in');
            assert.isFalse(field('bond').disabled || field('bond').readOnly, 'the box can be written in while the sheet is locked');
            await enter('.fhcs-biography [name="system.details.bond"]', 'FHCS test bond');
            await until(() => actor.system.details.bond === 'FHCS test bond', () => `the box saves to dnd5e's field; bond is "${actor.system.details.bond}"`);
            await actor.update({ 'system.details.ideal': before.ideal ?? '', 'system.details.bond': before.bond ?? '' });
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
