/**
 * Loads the whole module graph in Node with Foundry and dnd5e mocked, runs the init hook, and checks the sheet was
 * registered as a subclass of dnd5e's character sheet, dnd5e's usage card model is extended and settings are
 * registered. One bad import stops the entire module in Foundry, and ESLint
 * doesn't check that imports exist.
 * Usage: npm run load
 */
const { readFileSync, existsSync } = await import('node:fs');

const hooks = {};
const registered = [];
const settings = [];
class SystemCharacterSheet
{
   static DEFAULT_OPTIONS = { classes: ['character'] };
   static PARTS = {
      header: { template: 'systems/dnd5e/templates/actors/character-header.hbs' },
      sidebar: { container: { classes: ['main-content'], id: 'main' }, template: 'systems/dnd5e/templates/actors/character-sidebar.hbs' },
      details: { container: { classes: ['tab-body'], id: 'tabs' }, template: 'systems/dnd5e/templates/actors/tabs/character-details.hbs' },
      inventory: { container: { classes: ['tab-body'], id: 'tabs' }, template: 'systems/dnd5e/templates/actors/tabs/character-inventory.hbs', scrollable: [''] },
      spells: { container: { classes: ['tab-body'], id: 'tabs' }, template: 'systems/dnd5e/templates/actors/tabs/creature-spells.hbs', scrollable: [''] },
      features: { container: { classes: ['tab-body'], id: 'tabs' }, template: 'systems/dnd5e/templates/actors/tabs/character-features.hbs', scrollable: [''] },
      effects: { container: { classes: ['tab-body'], id: 'tabs' }, template: 'systems/dnd5e/templates/actors/tabs/actor-effects.hbs', scrollable: [''] },
      biography: { container: { classes: ['tab-body'], id: 'tabs' }, template: 'systems/dnd5e/templates/actors/tabs/character-biography.hbs', scrollable: [''] },
      abilityScores: { template: 'systems/dnd5e/templates/actors/character-ability-scores.hbs' },
      warnings: { template: 'systems/dnd5e/templates/shared/sheet-warnings-dialog.hbs' },
      tabs: { id: 'tabs', classes: ['tabs-right'], template: 'systems/dnd5e/templates/shared/sidebar-tabs.hbs' }
   };
   // Foundry joins every class's DEFAULT_OPTIONS; this is what dnd5e's chain gives a character sheet.
   _initializeApplicationOptions()
   {
      return { classes: ['dnd5e2', 'sheet', 'actor', 'standard-form', 'hidden-title', 'character', 'vertical-tabs', 'fhcs-sheet'] };
   }
}

globalThis.Hooks = { on: (name, fn) => { hooks[name] = fn; }, once: (name, fn) => { hooks[name] = fn; } };
globalThis.Actor = class {};
globalThis.Item = class {};
const preloaded = [];
globalThis.foundry = {
   applications: {
      apps: { DocumentSheetConfig: { registerSheet: (...args) => registered.push(args) } },
      handlebars: { loadTemplates: (paths) => preloaded.push(...paths) }
   }
};
globalThis.game = {
   system: { version: 'mock' },
   settings: { register: (scope, key, config) => settings.push({ scope, key, config }), get: () => true },
   messages: { get: () => null }
};
// A chat log like Foundry 14's: postOne scrolls to the bottom unless told `scroll: false`.
class FakeChatLog
{
   scrolled = 0;
   async postOne(message, options = {}) { this.notify = options.notify; if (options.scroll !== false) { await this.scrollBottom(); } }
   async scrollBottom() { this.scrolled++; }
   async updateMessage() {}
}
const chatLog = new FakeChatLog();
globalThis.ui = { chat: chatLog };
// dnd5e's item sheet, as its PARTS stand in 6.0.6 (item-sheet.mjs:56).
class SystemItemSheet
{
   static PARTS = {
      header: { template: 'systems/dnd5e/templates/items/header.hbs' },
      tabs: { template: 'systems/dnd5e/templates/shared/horizontal-tabs.hbs', templates: ['templates/generic/tab-navigation.hbs'] },
      activities: { template: 'systems/dnd5e/templates/items/activities.hbs', scrollable: [''] },
      advancement: { template: 'systems/dnd5e/templates/items/advancement.hbs', scrollable: [''] },
      description: { template: 'systems/dnd5e/templates/items/description.hbs', scrollable: [''] },
      details: { template: 'systems/dnd5e/templates/items/details.hbs', scrollable: [''] },
      effects: { template: 'systems/dnd5e/templates/items/effects.hbs', scrollable: [''] },
      warnings: { template: 'systems/dnd5e/templates/shared/sheet-warnings-dialog.hbs' }
   };
}
globalThis.dnd5e = { applications: { actor: { CharacterActorSheet: SystemCharacterSheet }, item: { ItemSheet5e: SystemItemSheet } } };
class SystemUsageMessageData {}
class SystemCheckMessageData {}
class SystemSaveMessageData {}
class SystemRequestMessageData {}
const systemModels = { usage: SystemUsageMessageData, check: SystemCheckMessageData, save: SystemSaveMessageData,
   request: SystemRequestMessageData };
globalThis.CONFIG = { ChatMessage: { dataModels: { ...systemModels } }, Item: { dataModels: { weapon: {}, spell: {}, feat: {}, container: {} } } };

const problems = [];
try
{
   await import(new URL('../src/main.js', import.meta.url));
   hooks.init?.();
   if (typeof hooks.quenchReady !== 'function') { problems.push('Quench tests are not hooked to quenchReady'); }
   if (typeof hooks.ready !== 'function') { problems.push('quiet chat posts are not hooked to ready'); }
   else
   {
      // A roll folded into its usage card posts without scrolling or notifying.
      hooks.ready();
      const folded = { id: 'r1', isAuthor: true, type: 'attack', system: { origin: { type: 'usage', content: '' } } };
      await chatLog.postOne(folded, { notify: true });
      if (chatLog.scrolled !== 0 || chatLog.notify !== false) { problems.push('a folded roll still scrolls the chat log'); }
      // The player's own new card scrolls, and its redraws follow it down while it fills in.
      const card = { id: 'c1', isAuthor: true, type: 'usage', system: {} };
      await chatLog.postOne(card, {});
      if (chatLog.scrolled !== 1) { problems.push('a new card does not scroll the chat log'); }
      await chatLog.updateMessage(card);
      if (chatLog.scrolled !== 2) { problems.push('a new card filling in does not keep the log at the bottom'); }
      // Another message redrawing doesn't move the log.
      await chatLog.updateMessage({ id: 'old' });
      if (chatLog.scrolled !== 2) { problems.push('an older card redrawing moved the chat log'); }
   }
   for (const name of ['dnd5e.renderChatMessage', 'updateChatMessage', 'dnd5e.preRoll'])
   {
      if (typeof hooks[name] !== 'function') { problems.push(`chat rolls are not hooked to ${name}`); }
   }
   // No d20 is rolled in advance (user, 2026-10-28: it sat in the message's data, where a player could read it).
   if (typeof hooks['dnd5e.postRollConfiguration'] === 'function') { problems.push('a d20 roll is changed before it is evaluated'); }
   for (const [type, Model] of Object.entries(systemModels))
   {
      const ours = globalThis.CONFIG.ChatMessage.dataModels[type];
      if (!(ours.prototype instanceof Model)) { problems.push(`${type} chat cards do not extend dnd5e's ${type} model`); }
   }
}
catch (err)
{
   console.error(`Module failed to load: ${err.message}`);
   process.exit(1);
}

// The item sheet (SCOPE §4.13): every item type but containers, not the default, dnd5e's class with our header, tab
// row and Description tab, each part's partials loaded with it.
const itemRegistration = registered.find(([doc]) => doc === globalThis.Item);
if (!itemRegistration) { problems.push('the item sheet is not registered'); }
else
{
   const [, itemScope, itemSheet, itemOptions] = itemRegistration;
   if (itemScope !== 'fhcs') { problems.push(`item sheet registered under "${itemScope}", not "fhcs"`); }
   if (!(itemSheet.prototype instanceof SystemItemSheet)) { problems.push('item sheet does not extend dnd5e\'s item sheet'); }
   if (itemOptions?.types?.join() !== 'weapon,spell,feat') { problems.push(`item sheet types are ${itemOptions?.types}, not every type but containers`); }
   if (itemOptions?.makeDefault) { problems.push('item sheet must not make itself the default'); }
   const itemParts = itemSheet.PARTS ?? {};
   for (const id of ['header', 'tabs', 'description'])
   {
      const part = itemParts[id];
      if (!part?.template.startsWith('modules/fhcs/')) { problems.push(`the item sheet's ${id} part is still dnd5e's`); continue; }
      if (!existsSync(new URL(`../${part.template.replace(/^modules\/fhcs\//, '')}`, import.meta.url))) { problems.push(`item part template ${part.template} is missing`); }
      for (const path of part.templates ?? []) { if (!existsSync(new URL(`../${path.replace(/^modules\/fhcs\//, '')}`, import.meta.url))) { problems.push(`item ${id} partial ${path} is missing`); } }
   }
   if (!itemParts.header?.templates?.some((p) => p.endsWith('/conc-c.hbs'))) { problems.push('the item header part does not load conc-c.hbs'); }
   if (!itemParts.details?.template.startsWith('systems/dnd5e/')) { problems.push('the item sheet lost dnd5e\'s details form'); }
}

const characterRegistrations = registered.filter(([doc]) => doc !== globalThis.Item);
const [documentClass, scope, sheet, options] = characterRegistrations[0] ?? [];
if (characterRegistrations.length !== 1) { problems.push(`expected one character sheet registration, got ${characterRegistrations.length}`); }
else
{
   if (documentClass !== globalThis.Actor) { problems.push('sheet is not registered for Actor'); }
   if (scope !== 'fhcs') { problems.push(`sheet registered under "${scope}", not "fhcs"`); }
   if (!(sheet.prototype instanceof SystemCharacterSheet)) { problems.push('sheet does not extend dnd5e\'s character sheet'); }
   // Foundry files a sheet under scope.className; worlds store that ID, and the Quench tests open it by it.
   const { SHEET_CLASS_NAME } = await import('../src/constants.js');
   if (sheet.name !== SHEET_CLASS_NAME) { problems.push(`sheet class is named ${sheet.name}, not ${SHEET_CLASS_NAME}`); }
   if (options?.types?.join() !== 'character') { problems.push('sheet is not limited to characters'); }
   if (options?.makeDefault) { problems.push('sheet must not make itself the default'); }
   // Our header and tab row come first, in place of dnd5e's; its ability scores and sidebar are gone; its tab bodies stay.
   const parts = sheet.PARTS ?? {};
   const expected = 'header,tabs,details,inventory,spells,features,effects,biography,warnings';
   if (Object.keys(parts).join() !== expected) { problems.push(`sheet parts are ${Object.keys(parts).join()}, not ${expected}`); }
   if (parts.tabs?.classes) { problems.push('our tab row still carries dnd5e\'s tab classes'); }
   // None of dnd5e's look reaches our window.
   const classes = sheet.prototype._initializeApplicationOptions.call(Object.create(sheet.prototype), {}).classes;
   const leaked = classes.filter((name) => ['dnd5e2', 'vertical-tabs', 'hidden-title'].includes(name));
   if (leaked.length) { problems.push(`dnd5e's look classes reach our window: ${leaked.join(', ')}`); }
   if (!classes.includes('fhcs-sheet') || !classes.includes('character')) { problems.push('our window lost fhcs-sheet or character'); }
   for (const part of Object.values(parts).filter((p) => p.template.startsWith('modules/fhcs/')))
   {
      if (!existsSync(new URL(`../${part.template.replace(/^modules\/fhcs\//, '')}`, import.meta.url))) { problems.push(`sheet part template ${part.template} is missing`); }
   }
   for (const id of ['header', 'tabs']) { if (!parts[id]?.template.startsWith('modules/fhcs/')) { problems.push(`the ${id} part is still dnd5e's`); } }
   if (parts.details?.container?.id !== 'tabs') { problems.push('dnd5e\'s tab bodies lost their container'); }
   if (!parts.inventory?.template.startsWith('modules/fhcs/')) { problems.push('the inventory part is still dnd5e\'s'); }
   // The item list scrolls, not the tab, so Foundry keeps its place when an equip or quantity change re-renders.
   if (parts.inventory?.scrollable?.join() !== '.fhcs-items') { problems.push('the inventory part does not keep its item list\'s scroll'); }
   // The row partial is included by the tab and by every container; Foundry won't find it unless the part loads it.
   for (const path of parts.inventory?.templates ?? []) { if (!existsSync(new URL(`../${path.replace(/^modules\/fhcs\//, '')}`, import.meta.url))) { problems.push(`inventory partial ${path} is missing`); } }
   if (!parts.inventory?.templates?.some((p) => p.endsWith('/item-row.hbs'))) { problems.push('the inventory part does not load its row partial'); }
   if (!parts.spells?.template.startsWith('modules/fhcs/')) { problems.push('the spells part is still dnd5e\'s'); }
   if (parts.spells?.scrollable?.join() !== '.fhcs-items') { problems.push('the spells part does not keep its list\'s scroll'); }
   if (!parts.features?.template.startsWith('modules/fhcs/')) { problems.push('the features part is still dnd5e\'s'); }
   if (parts.features?.scrollable?.join() !== '.fhcs-items') { problems.push('the features part does not keep its list\'s scroll'); }
   if (!parts.effects?.template.startsWith('modules/fhcs/')) { problems.push('the effects part is still dnd5e\'s'); }
   if (!parts.effects?.templates?.some((p) => p.endsWith('/list-bar.hbs'))) { problems.push('the effects part does not load list-bar.hbs'); }
   // Every animation keeps still for the player who asks (SCOPE §5.3 rule 6): inside a reduced-motion query, and on the
   // sheet behind the Motion switch (`:not([data-fhcs-motion="off"])`). Chat cards have no Motion switch, only the query.
   for (const path of JSON.parse(readFileSync(new URL('../module.json', import.meta.url), 'utf8')).styles)
   {
      const text = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
      const stack = [];
      let start = 0;
      for (let i = 0; i < text.length; i++)
      {
         if (text[i] === '{') { stack.push(text.slice(start, i).trim()); start = i + 1; }
         else if (text[i] === '}') { stack.pop(); start = i + 1; }
         else if (text[i] === ';' && /^\s*animation\s*:/.test(text.slice(start, i)) && !stack.some((p) => p.startsWith('@keyframes')))
         {
            const selector = stack.at(-1) ?? '';
            const value = text.slice(start, i).split(':').slice(1).join(':').trim();
            const queried = stack.some((p) => /@media[^{]*prefers-reduced-motion:\s*no-preference/.test(p));
            const switched = /\.fhcs-chat|\.fhcs-tip-/.test(selector) || /:not\(\[data-fhcs-motion="off"\]|data-fhcs-motion="off"\]\)/.test(selector);
            if (value !== 'none' && (!queried || !switched))
            {
               problems.push(`${path}: an animation outside ${queried ? 'the Motion switch' : 'the reduced-motion query'}: ${selector.replace(/\s+/g, ' ').slice(0, 90)}`);
            }
            start = i + 1;
         }
         else if (text[i] === ';') { start = i + 1; }
      }
   }
   // dnd5e's item menu and favorite drops find favorites by `.favorites [data-item-id]` (character-sheet.mjs:902).
   if (!/class="fhcs-favorites favorites"[\s\S]*?data-item-id=/.test(readFileSync(new URL('../templates/sheet/attributes.hbs', import.meta.url), 'utf8')))
   {
      problems.push('the favorites list lost dnd5e\'s .favorites class, so its rows have no item menu');
   }
   if (!parts.biography?.template.startsWith('modules/fhcs/')) { problems.push('the biography part is still dnd5e\'s'); }
   if (!parts.biography?.templates?.some((p) => p.endsWith('/bio-box.hbs'))) { problems.push('the biography part does not load bio-box.hbs'); }
   if (parts.biography?.scrollable?.join() !== '') { problems.push('the biography tab lost dnd5e\'s scrolling'); }
   // Partials included by a tab must load with its part: each list tab's rows and the shared search bar.
   for (const [id, row] of [['inventory', 'item-row'], ['spells', 'spell-row'], ['features', 'feature-row']])
   {
      for (const name of [row, 'list-bar'])
      {
         if (!parts[id]?.templates?.some((p) => p.endsWith(`/${name}.hbs`))) { problems.push(`the ${id} part does not load ${name}.hbs`); }
      }
      for (const path of parts[id]?.templates ?? []) { if (!existsSync(new URL(`../${path.replace(/^modules\/fhcs\//, '')}`, import.meta.url))) { problems.push(`${id} partial ${path} is missing`); } }
   }
   // dnd5e adds slot pips into spell headings ours draw themselves; our filters (Can cast, components) join dnd5e's.
   if (!Object.hasOwn(sheet.prototype, '_renderSpellbook')) { problems.push('dnd5e\'s spell slot pips are not replaced'); }
   if (!Object.hasOwn(sheet.prototype, '_filterItem')) { problems.push('our spell filters are not added to dnd5e\'s'); }
   // dnd5e adds its attunement counter into markup ours lacks; without our override every render throws.
   if (!Object.hasOwn(sheet.prototype, '_renderAttunement')) { problems.push('dnd5e\'s attunement counter is not replaced'); }
}
// Three successes stay shown; dnd5e clears death saves itself on healing (preUpdateHP), so only the roll is hooked.
if (typeof hooks['dnd5e.rollDeathSaveV2'] !== 'function') { problems.push('death saves are not hooked to dnd5e.rollDeathSaveV2'); }
if (typeof hooks['dnd5e.advancementManagerComplete'] !== 'function') { problems.push('level order is not hooked to dnd5e.advancementManagerComplete'); }

// The redraw rule (CLAUDE.md): in the sheet's Quench batch, every click or input waits for the sheet to settle first.
// A bare `.click()` or `dispatchEvent(` there must go through the batch's helpers, which carry a `redraw-safe` note.
{
   const quench = readFileSync(new URL('../src/tests/quench.js', import.meta.url), 'utf8');
   const core = quench.slice(quench.indexOf('registerBatch(`${MODULE_ID}.core`'), quench.indexOf('registerBatch(`${MODULE_ID}.chat`'));
   core.split('\n').forEach((line, i) =>
   {
      if (/^\s*\*/.test(line) || !/\.click\(\)|dispatchEvent\(/.test(line) || line.includes('redraw-safe')) { return; }
      problems.push(`Quench core batch, line ${i + 1} of the batch: clicks without waiting for redraws; use click(), enter() or clickReaches()`);
   });
}

// Everything the manifest names exists, and every label key the code uses is in lang/en.json.
const root = new URL('../', import.meta.url);
// Every template part a card includes is preloaded and exists (Foundry won't find a partial it hasn't loaded).
for (const path of preloaded)
{
   if (!existsSync(new URL(path.replace(/^modules\/fhcs\//, ''), root))) { problems.push(`preloaded template ${path} is missing`); }
}
const included = new Set();
for (const file of ['templates/chat/usage-card.hbs', 'templates/chat/roll-card.hbs', 'templates/chat/request-card.hbs',
   'templates/chat/parts/rolled-band.hbs', 'templates/chat/parts/d20-row.hbs', 'templates/chat/parts/d20-tray.hbs'])
{
   for (const [, path] of readFileSync(new URL(file, root), 'utf8').matchAll(/{{>\s*"([^"]+)"/g)) { included.add(path); }
}
for (const path of included) { if (!preloaded.includes(path)) { problems.push(`${path} is included but not preloaded`); } }
const manifest = JSON.parse(readFileSync(new URL('module.json', root), 'utf8'));
for (const path of [...manifest.esmodules, ...manifest.styles, ...manifest.languages.map((l) => l.path)])
{
   if (!existsSync(new URL(path, root))) { problems.push(`module.json names missing file ${path}`); }
}
const lang = JSON.parse(readFileSync(new URL('lang/en.json', root), 'utf8'));
const inLang = (key) => key.split('.').reduce((node, part) => node?.[part], lang);
const label = options?.label ?? '';
if (!inLang(label)) { problems.push(`label ${label} is not in lang/en.json`); }
if (!settings.length) { problems.push('no settings registered at init'); }
for (const { scope, key, config } of settings)
{
   if (scope !== 'fhcs') { problems.push(`setting ${key} registered under "${scope}", not "fhcs"`); }
   for (const text of [config.name, config.hint]) { if (!inLang(text ?? '')) { problems.push(`setting ${key}: ${text} is not in lang/en.json`); } }
}

if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log('Module graph loads; the sheet registers as a dnd5e character sheet; usage cards and settings are wired; manifest files exist.');
