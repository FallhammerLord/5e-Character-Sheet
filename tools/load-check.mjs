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
}

globalThis.Hooks = { on: (name, fn) => { hooks[name] = fn; }, once: (name, fn) => { hooks[name] = fn; } };
globalThis.Actor = class {};
globalThis.foundry = {
   applications: { apps: { DocumentSheetConfig: { registerSheet: (...args) => registered.push(args) } } }
};
globalThis.game = {
   system: { version: 'mock' },
   settings: { register: (scope, key, config) => settings.push({ scope, key, config }) }
};
globalThis.dnd5e = { applications: { actor: { CharacterActorSheet: SystemCharacterSheet } } };
class SystemUsageMessageData {}
globalThis.CONFIG = { ChatMessage: { dataModels: { usage: SystemUsageMessageData } } };

const problems = [];
try
{
   await import(new URL('../src/main.js', import.meta.url));
   hooks.init?.();
   if (typeof hooks.quenchReady !== 'function') { problems.push('Quench tests are not hooked to quenchReady'); }
   for (const name of ['dnd5e.renderChatMessage', 'dnd5e.postRollConfiguration'])
   {
      if (typeof hooks[name] !== 'function') { problems.push(`chat rolls are not hooked to ${name}`); }
   }
   const usage = globalThis.CONFIG.ChatMessage.dataModels.usage;
   if (!(usage.prototype instanceof SystemUsageMessageData)) { problems.push('usage chat cards do not extend dnd5e\'s usage model'); }
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
}

// Everything the manifest names exists, and every label key the code uses is in lang/en.json.
const root = new URL('../', import.meta.url);
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
