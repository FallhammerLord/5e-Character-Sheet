/**
 * Writes one page with every theme (SCOPE §4.11) drawn from our real templates and stylesheets: the header and the
 * Attributes tab, light beside dark, at 740px. Hover and press to see each theme's motion. Usage: node tools/theme-mockup.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { template } from './templates.mjs';
import { CASES, LOOKS } from './fixtures.mjs';

const root = new URL('..', import.meta.url).pathname;
const css = JSON.parse(readFileSync(`${root}module.json`, 'utf8')).styles
   .map((path) => readFileSync(`${root}${path}`, 'utf8')).join('\n');
const NAMES = { forge: 'Fire and Forge', wind: 'Wind and Wrath', sand: 'Sand and Sanctuary', valley: 'Valley and Valor' };
const MODES = { light: 'background:#f4f1ea;color:#191813', dark: 'background:#26252b;color:#e8e6e3' };
const draw = (name) => { const c = CASES.find((x) => x.name === name); return template(c.template)(c.context); };

const sheet = (look, mode) => `<section class="application sheet actor character fhcs-sheet themed theme-${mode}"
   data-fhcs-theme="${look}" style="width:740px;height:760px;display:flex;flex-direction:column;${MODES[mode]}">
   <div class="window-content" style="flex:1;min-height:0;overflow:auto">
      ${draw(`theme-${look}-header`)}
      <nav class="fhcs-tabs"><button type="button" class="fhcs-tab active">Attributes</button><button type="button" class="fhcs-tab">Inventory</button><button type="button" class="fhcs-tab">Spellbook</button><button type="button" class="fhcs-tab">Features</button><button type="button" class="fhcs-tab">Effects</button><button type="button" class="fhcs-tab">Biography</button><button type="button" class="fhcs-toggle fhcs-lock" aria-label="Lock"><svg class="fhcs-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></button></nav>
      <div class="tab-body">${draw(`theme-${look}-attributes`)}</div>
   </div></section>`;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Sheet Themes</title>
<style>body{margin:0;padding:16px;background:#3a3a3a;color:#eee;font-family:sans-serif}*{box-sizing:border-box}
button,input,select{font:inherit}h2{margin:24px 0 8px;font-size:20px}.pair{display:flex;gap:16px;flex-wrap:wrap}
p.note{max-width:900px;margin:0 0 8px;color:#ccc}
${css}</style></head><body>
<h1 style="font-size:24px;margin:0">Sheet themes: mockup</h1>
<p class="note">Our real templates and stylesheets. Hover a panel or a heading, press a button: each theme answers once.
With your system's reduced-motion setting on, nothing moves.</p>
${LOOKS.map((look) => `<h2>${NAMES[look]}</h2><div class="pair">${sheet(look, 'light')}${sheet(look, 'dark')}</div>`).join('\n')}
</body></html>`;

mkdirSync(`${root}tools/out`, { recursive: true });
writeFileSync(`${root}tools/out/theme-mockup.html`, html);
console.log('Wrote tools/out/theme-mockup.html');
