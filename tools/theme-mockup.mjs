/**
 * Writes mockup pages of the themes (SCOPE §4.11), drawn from our real templates and stylesheets:
 * - tools/out/theme-mockup.html: every theme, the header and the Attributes tab, light beside dark, at 740px.
 * - tools/out/forge-mockup.html: Fire and Forge at full, bloodied and down HP, light and dark, one at 644px, with
 *   buttons that play its moments (a hit, a heal).
 * Hover and press to see each theme's motion. Usage: node tools/theme-mockup.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { template } from './templates.mjs';
import { CASES, LOOKS } from './fixtures.mjs';

const root = new URL('..', import.meta.url).pathname;
const css = JSON.parse(readFileSync(`${root}module.json`, 'utf8')).styles
   .map((path) => readFileSync(`${root}${path}`, 'utf8')
      // A stylesheet's relative url()s (a theme's font) resolve against the stylesheet, as Foundry serves it.
      .replace(/url\((['"]?)(\.\.?\/[^'")]+)\1\)/g, (m, q, rel) => `url(${q}${new URL(rel, `file://${root}${path}`).href}${q})`))
   .join('\n');
const NAMES = { forge: 'Fire and Forge', wind: 'Wind and Wrath', sand: 'Sand and Sanctuary', valley: 'Valley and Valor' };
const MODES = { light: 'background:#f4f1ea;color:#191813', dark: 'background:#26252b;color:#e8e6e3' };
const draw = (name) => { const c = CASES.find((x) => x.name === name); return template(c.template)(c.context); };
const LOCK = '<svg class="fhcs-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
const TABS = `<nav class="fhcs-tabs">${['Attributes', 'Inventory', 'Spellbook', 'Features', 'Effects', 'Biography']
   .map((t, i) => `<button type="button" class="fhcs-tab${i ? '' : ' active'}">${t}</button>`).join('')}<button type="button" class="fhcs-toggle fhcs-lock" aria-label="Lock">${LOCK}</button></nav>`;

/** One sheet window: header, tab row and the Attributes tab, in a theme, a mode, at an HP ratio and a width. */
const sheet = (look, mode, { hp = 1, width = 740, height = 760 } = {}) =>
{
   const state = hp <= 0 ? 'down' : hp <= 0.5 ? 'bloodied' : 'full';
   return `<section class="application sheet actor character fhcs-sheet themed theme-${mode}" data-fhcs-theme="${look}"
      data-fhcs-hp="${state}" style="--fhcs-hp:${hp};width:${width}px;height:${height}px;display:flex;flex-direction:column;flex:none;${MODES[mode]}">
      <div class="window-content" style="flex:1;min-height:0;overflow:hidden">
         ${draw(`theme-${look}-header`)}${TABS}
         <div class="tab-body">${draw(`theme-${look}-attributes`)}</div>
      </div></section>`;
};

const page = (title, note, body, script = '') => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title>
<style>body{margin:0;padding:16px;background:#3a3a3a;color:#eee;font-family:sans-serif}*{box-sizing:border-box}
button,input,select{font:inherit}h2{margin:24px 0 8px;font-size:20px}.row{display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start}
p.note{max-width:900px;margin:0 0 8px;color:#ccc}.cap{margin:0 0 4px;color:#ccc;font-size:14px}.moments button{margin-right:8px;padding:4px 10px}
${css}</style></head><body><h1 style="font-size:24px;margin:0">${title}</h1><p class="note">${note}</p>${body}${script}</body></html>`;

const figure = (caption, html) => `<div><p class="cap">${caption}</p>${html}</div>`;

mkdirSync(`${root}tools/out`, { recursive: true });

writeFileSync(`${root}tools/out/theme-mockup.html`, page('Sheet themes: mockup',
   'Our real templates and stylesheets. Hover a panel or a heading, press a button: each theme answers once. With your system\'s reduced-motion setting on, nothing moves.',
   LOOKS.map((look) => `<h2>${NAMES[look]}</h2><div class="row">${sheet(look, 'light')}${sheet(look, 'dark')}</div>`).join('\n')));

writeFileSync(`${root}tools/out/forge-mockup.html`, page('Fire and Forge',
   'The hearth follows HP: full, bloodied, down. Embers rise for a few seconds in every twenty. Hover frames, press buttons, or play a moment.',
   `<div class="moments"><button type="button" data-moment="fhcs-moment-hit">Play: a hit</button><button type="button" data-moment="fhcs-moment-heal">Play: a heal</button></div>
   <h2>Dark</h2><div class="row">${figure('Full HP', sheet('forge', 'dark'))}${figure('Bloodied (40%)', sheet('forge', 'dark', { hp: 0.4 }))}${figure('Down (0 HP)', sheet('forge', 'dark', { hp: 0 }))}</div>
   <h2>Light</h2><div class="row">${figure('Full HP', sheet('forge', 'light'))}${figure('Bloodied (40%)', sheet('forge', 'light', { hp: 0.4 }))}${figure('Down (0 HP)', sheet('forge', 'light', { hp: 0 }))}</div>
   <h2>644px, the narrowest</h2><div class="row">${figure('Dark, full', sheet('forge', 'dark', { width: 644 }))}${figure('Light, bloodied', sheet('forge', 'light', { hp: 0.4, width: 644 }))}</div>`,
   `<script>
   for (const button of document.querySelectorAll('[data-moment]'))
   {
      button.addEventListener('click', () =>
      {
         for (const sheet of document.querySelectorAll('.fhcs-sheet'))
         {
            sheet.classList.remove(button.dataset.moment);
            void sheet.offsetWidth;
            sheet.classList.add(button.dataset.moment);
            setTimeout(() => sheet.classList.remove(button.dataset.moment), 650);
         }
      });
   }
   </script>`));

console.log('Wrote tools/out/theme-mockup.html and tools/out/forge-mockup.html');

/* ---------- The viewer: one large sheet with controls (user, 2026-10-28: the side-by-side pages were hard to use
   and their animations hard to see). Written without a document skeleton, for publishing as an artifact page; the
   theme's font is inlined so the page needs no files beside it. ---------- */

const inlineFonts = (text) => text.replace(/url\((['"]?)file:\/\/([^'")]+\.woff2)\1\)/g,
   (m, q, path) => `url(data:font/woff2;base64,${readFileSync(path).toString('base64')})`);
const tabPane = (look, name, active) => draw(`theme-${look}-${name}`).replace(/class="tab ([^"]*?)\bactive\b/, `class="tab $1${active ? 'active' : ''}`);
const viewerSheet = (look) => `<section class="application sheet actor character fhcs-sheet themed theme-dark" data-fhcs-theme="${look}"
   data-fhcs-hp="full" style="--fhcs-hp:1;width:740px;height:820px;display:flex;flex-direction:column;flex:none">
   <div class="window-content" style="flex:1;min-height:0;overflow:hidden">
      ${draw(`theme-${look}-header`)}
      <nav class="fhcs-tabs">${[['details', 'Attributes'], ['inventory', 'Inventory'], ['spells', 'Spellbook']]
         .map(([id, label], i) => `<button type="button" class="fhcs-tab${i ? '' : ' active'}" data-viewer-tab="${id}">${label}</button>`).join('')}<button type="button" class="fhcs-toggle fhcs-lock" aria-label="Lock">${LOCK}</button></nav>
      <div class="tab-body">${tabPane(look, 'attributes', true)}${tabPane(look, 'inventory', false)}${tabPane(look, 'spellbook', false)}</div>
   </div></section>`;

const viewer = `<title>Fire and Forge</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
/* A smith's workbench: the controls are a dark steel strip above the sheet; the sheet is the subject. */
:root { --v-bg: #ece7df; --v-panel: #ffffff; --v-ink: #221c17; --v-muted: #5d5650; --v-line: #cfc6bb; --v-accent: #a8481b; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --v-bg: #17140f; --v-panel: #231e19; --v-ink: #efe6da; --v-muted: #b3a99d; --v-line: #3d352d; --v-accent: #ef8a4a; color-scheme: dark; } }
:root[data-theme="dark"] { --v-bg: #17140f; --v-panel: #231e19; --v-ink: #efe6da; --v-muted: #b3a99d; --v-line: #3d352d; --v-accent: #ef8a4a; color-scheme: dark; }
body { background: var(--v-bg); color: var(--v-ink); font: 14px/1.4 system-ui, sans-serif; }
.v-wrap { display: grid; gap: 12px; padding-block: 16px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
.v-bar { display: flex; flex-wrap: wrap; gap: 12px 20px; align-items: center; padding: 12px; border: 1px solid var(--v-line); border-radius: 8px; background: var(--v-panel); }
.v-bar h1 { margin: 0; font-size: 18px; text-wrap: balance; }
.v-group { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.v-label { color: var(--v-muted); font-size: 12px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; }
.v-bar button, .v-bar select { min-height: 32px; padding: 0 10px; border: 1px solid var(--v-line); border-radius: 6px; background: var(--v-bg); color: var(--v-ink); font: inherit; cursor: pointer; }
.v-bar button[aria-pressed="true"] { border-color: var(--v-accent); box-shadow: inset 0 0 0 1px var(--v-accent); }
.v-bar button:focus-visible, .v-bar input:focus-visible, .v-bar select:focus-visible { outline: 2px solid var(--v-accent); outline-offset: 2px; }
.v-bar input[type="range"] { width: 160px; accent-color: var(--v-accent); }
.v-hp { min-width: 9.5em; font-variant-numeric: tabular-nums; }
.v-note { margin: 0; color: var(--v-muted); max-width: 70ch; }
.v-warn { margin: 0; padding: 8px 12px; border: 1px solid var(--v-accent); border-radius: 6px; max-width: 70ch; }
.v-stage { overflow-x: auto; padding-bottom: 8px; }
${inlineFonts(css)}
</style>
<div class="v-wrap">
   <div class="v-bar" role="group" aria-label="Preview controls">
      <h1>Fire and Forge</h1>
      <div class="v-group"><span class="v-label">Sheet</span>
         <button type="button" id="v-dark" data-mode="dark" aria-pressed="true">Dark</button><button type="button" id="v-light" data-mode="light" aria-pressed="false">Light</button></div>
      <div class="v-group"><span class="v-label">Width</span>
         <button type="button" id="v-w644" data-width="644" aria-pressed="false">644</button><button type="button" id="v-w740" data-width="740" aria-pressed="true">740</button><button type="button" id="v-w900" data-width="900" aria-pressed="false">900</button></div>
      <div class="v-group"><label class="v-label" for="v-hp">HP</label>
         <input type="range" id="v-hp" min="0" max="100" value="100"><span class="v-hp" id="v-hp-text">100% · full</span></div>
      <div class="v-group"><span class="v-label">Play</span>
         <button type="button" id="v-hit">A hit</button><button type="button" id="v-heal">A heal</button><button type="button" id="v-embers">Sparks</button></div>
      <div class="v-group"><span class="v-label">Motion</span>
         <button type="button" id="v-motion" aria-pressed="true">On</button></div>
   </div>
   <p class="v-warn" id="v-reduced" hidden>Your device asks for reduced motion, so the sheet keeps still. That's the theme respecting the setting; turn reduced motion off in your system settings to preview the animations.</p>
   <p class="v-note">Drag HP to cool the forge: yellow at full, cherry at half, dull red low, cold iron at 0. Sparks spray from the lower-left corner once a minute plus 1d6 × 10 seconds; the Sparks button throws a burst now, fresh each time. Hover a panel for the temper gleam along its top rim; press any button on the sheet for the hammer strike. The sheet's tabs switch between Attributes, Inventory and Spellbook. The numbers on the sheet are sample data.</p>
   <div class="v-stage">${viewerSheet('forge')}</div>
</div>
<script>
${readFileSync(`${root}src/apps/sparks.js`, 'utf8').replace(/^export /gm, '')}
const sheet = document.querySelector('.fhcs-sheet');
const press = (selector, button) => { for (const b of document.querySelectorAll(selector)) { b.setAttribute('aria-pressed', String(b === button)); } };
for (const b of document.querySelectorAll('[data-mode]')) b.addEventListener('click', () => { sheet.classList.toggle('theme-dark', b.dataset.mode === 'dark'); sheet.classList.toggle('theme-light', b.dataset.mode === 'light'); press('[data-mode]', b); });
for (const b of document.querySelectorAll('[data-width]')) b.addEventListener('click', () => { sheet.style.width = b.dataset.width + 'px'; press('[data-width]', b); });
const moment = (name) => { sheet.classList.remove('fhcs-moment-hit', 'fhcs-moment-heal'); void sheet.offsetWidth; sheet.classList.add(name); setTimeout(() => sheet.classList.remove(name), 650); };
const hp = document.getElementById('v-hp'); const hpText = document.getElementById('v-hp-text');
let last = 100;
const setHp = () => { const v = Number(hp.value); const state = v <= 0 ? 'down' : v <= 50 ? 'bloodied' : 'full'; sheet.style.setProperty('--fhcs-hp', String(v / 100)); sheet.dataset.fhcsHp = state; hpText.textContent = v + '% · ' + state; };
hp.addEventListener('input', setHp);
hp.addEventListener('change', () => { const v = Number(hp.value); if (v !== last) moment(v < last ? 'fhcs-moment-hit' : 'fhcs-moment-heal'); last = v; });
document.getElementById('v-hit').addEventListener('click', () => moment('fhcs-moment-hit'));
document.getElementById('v-heal').addEventListener('click', () => moment('fhcs-moment-heal'));
document.getElementById('v-embers').addEventListener('click', () => sparkBurst(sheet));
const motion = document.getElementById('v-motion');
motion.addEventListener('click', () => { const on = motion.getAttribute('aria-pressed') !== 'true'; motion.setAttribute('aria-pressed', String(on)); motion.textContent = on ? 'On' : 'Off'; if (on) delete sheet.dataset.fhcsMotion; else sheet.dataset.fhcsMotion = 'off'; });
for (const t of document.querySelectorAll('[data-viewer-tab]')) t.addEventListener('click', () => {
   for (const o of document.querySelectorAll('[data-viewer-tab]')) o.classList.toggle('active', o === t);
   for (const pane of sheet.querySelectorAll('.tab-body > .tab')) pane.classList.toggle('active', pane.dataset.tab === t.dataset.viewerTab);
});
if (matchMedia('(prefers-reduced-motion: reduce)').matches) document.getElementById('v-reduced').hidden = false;
</script>`;

writeFileSync(`${root}tools/out/forge-viewer.html`, viewer);
console.log('Wrote tools/out/forge-viewer.html (for publishing as an artifact)');
