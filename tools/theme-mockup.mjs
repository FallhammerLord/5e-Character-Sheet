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
