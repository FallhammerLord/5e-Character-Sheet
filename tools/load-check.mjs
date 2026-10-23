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

// Every handler is kept; hooks[name] runs them all, as Foundry does.
const handlers = {};
const addHook = (name, fn) =>
{
   (handlers[name] ??= []).push(fn);
   hooks[name] = (...args) => { for (const h of handlers[name]) { h(...args); } };
};
globalThis.Hooks = { on: addHook, once: addHook };
// Just enough DOM for the style our ready hook adds (coin icons).
const appended = [];
globalThis.document = {
   createElement: (tag) => ({ tagName: tag.toUpperCase() }),
   getElementById: () => null,
   head: { append: (el) => appended.push(el) }
};
globalThis.Actor = class {};
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
globalThis.dnd5e = { applications: { actor: { CharacterActorSheet: SystemCharacterSheet } } };
class SystemUsageMessageData {}
class SystemCheckMessageData {}
class SystemSaveMessageData {}
class SystemRequestMessageData {}
const systemModels = { usage: SystemUsageMessageData, check: SystemCheckMessageData, save: SystemSaveMessageData,
   request: SystemRequestMessageData };
globalThis.CONFIG = { ChatMessage: { dataModels: { ...systemModels } },
   DND5E: { currencies: { gp: { icon: 'systems/dnd5e/icons/currency/gold.webp' } } } };

const problems = [];
try
{
   await import(new URL('../src/main.js', import.meta.url));
   hooks.init?.();
   if (typeof hooks.quenchReady !== 'function') { problems.push('Quench tests are not hooked to quenchReady'); }
   if (typeof hooks.ready !== 'function') { problems.push('quiet chat posts are not hooked to ready'); }
   else
   {
      hooks.ready();
      // Coin icons for our sheet, from dnd5e's currencies.
      if (!appended.some((el) => el.tagName === 'STYLE' && el.textContent?.includes('.fhcs-sheet :is(i, span).currency.gp')))
      {
         problems.push('coin icons are not added for our sheet at ready');
      }
      // A roll folded into its usage card posts without scrolling or notifying.
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
   for (const name of ['dnd5e.renderChatMessage', 'dnd5e.postRollConfiguration', 'updateChatMessage', 'dnd5e.preRoll'])
   {
      if (typeof hooks[name] !== 'function') { problems.push(`chat rolls are not hooked to ${name}`); }
   }
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

const [documentClass, scope, sheet, options] = registered[0] ?? [];
if (registered.length !== 1) { problems.push(`expected one sheet registration, got ${registered.length}`); }
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
   const expected = 'header,tabs,details,warnings';
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
}
for (const name of ['dnd5e.rollDeathSaveV2', 'preUpdateActor'])
{
   if (typeof hooks[name] !== 'function') { problems.push(`death saves are not hooked to ${name}`); }
}
if (typeof hooks['dnd5e.advancementManagerComplete'] !== 'function') { problems.push('level order is not hooked to dnd5e.advancementManagerComplete'); }

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
