/**
 * Renders our templates and stylesheets in Chromium at a range of sheet widths and reports anything that overflows
 * its box or the window, and any text field inside a width container. Writes screenshots to tools/out/.
 * Usage: npm run layout (set CHROMIUM_PATH to use an installed Chromium instead of Playwright's download)
 *
 * Every run starts with a self-test: a known-good page must pass and known-bad pages must fail, so an empty or
 * broken check can't pass silently.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { template } from './templates.mjs';
import { CASES } from './fixtures.mjs';

const root = new URL('..', import.meta.url).pathname;
const out = `${root}tools/out`;
mkdirSync(out, { recursive: true });

// Classic Tidy opens at 740 wide (SCOPE §4); dnd5e's own sheet at 800.
const WIDTHS = [560, 650, 740, 900];
const HEIGHT = 810;
// Every stylesheet module.json loads, in its order.
const css = JSON.parse(readFileSync(`${root}module.json`, 'utf8')).styles
   .map((path) => readFileSync(`${root}${path}`, 'utf8')).join('\n');

/** A window like Foundry's, with the classes dnd5e and our sheet put on it. */
const frame = (width, theme, body) => `<section class="application sheet actor character fhcs-sheet fhcs-theme-${theme}"
   style="width:${width}px;height:${HEIGHT}px;display:flex;flex-direction:column;border:1px solid #000;margin:8px">
   <header style="background:#111;color:#eee;padding:4px 8px;font:13px sans-serif">${width}px</header>
   <div class="window-content" style="flex:1;min-height:0;overflow:auto">${body}</div></section>`;

const page = (html) => `<!doctype html><html><head><meta charset="utf-8">
   <style>body{margin:0;background:#444;font-family:sans-serif}*{box-sizing:border-box}button,input,select{font:inherit}
   ${css}</style></head><body>${html}</body></html>`;

/** Runs in the page: lists everything that overflows, and text fields inside width containers. */
function findProblems()
{
   const issues = [];
   const app = document.querySelector('.application');
   const edge = app.getBoundingClientRect().right;
   for (const el of app.querySelectorAll('.window-content *'))
   {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || el.closest('[hidden], .sr-only')) { continue; }
      const r = el.getBoundingClientRect();
      if (!r.width) { continue; }
      const label = `${el.tagName.toLowerCase()}.${[...el.classList].join('.')} "${(el.textContent || el.value || '').trim().slice(0, 30)}"`;
      if (r.right > edge + 1) { issues.push(`past window edge by ${Math.round(r.right - edge)}px: ${label}`); continue; }
      const clipsOnPurpose = cs.textOverflow === 'ellipsis' || ['auto', 'scroll', 'hidden'].includes(cs.overflowX);
      if (!clipsOnPurpose && el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0
         && !['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName))
      {
         issues.push(`content wider than box by ${el.scrollWidth - el.clientWidth}px: ${label}`);
      }
   }
   // Foundry's form and editor styles collapse inside a size container (quest log lesson).
   for (const field of app.querySelectorAll('input, textarea, select, prose-mirror'))
   {
      for (let node = field.parentElement; node && node !== app; node = node.parentElement)
      {
         if (getComputedStyle(node).containerType !== 'normal')
         {
            issues.push(`text field inside a width container (${node.tagName.toLowerCase()}.${[...node.classList].join('.')})`);
            break;
         }
      }
   }
   return [...new Set(issues)];
}

const SELF_TEST = [
   { id: 'self-fits', expect: false, body: '<p style="width:200px">Fits easily.</p>' },
   { id: 'self-wide', expect: true, body: '<div style="width:100px"><span style="display:inline-block;width:300px">Too wide</span></div>' },
   { id: 'self-past-edge', expect: true, body: '<div style="width:2000px">Past the edge</div>' },
   { id: 'self-container', expect: true, body: '<div style="container-type:inline-size"><input type="text"></div>' }
];

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const tab = await browser.newPage({ viewport: { width: 1100, height: HEIGHT + 40 } });

/** Renders one page and returns its problems. */
async function check(id, html, screenshot)
{
   writeFileSync(`${out}/${id}.html`, page(html));
   await tab.goto(`file://${out}/${id}.html`);
   const found = await tab.evaluate(findProblems);
   if (screenshot) { await tab.screenshot({ path: `${out}/${id}.png`, fullPage: true }); }
   return found;
}

const problems = [];
for (const t of SELF_TEST)
{
   const caught = (await check(t.id, frame(WIDTHS[0], 'light', t.body), false)).length > 0;
   if (caught !== t.expect) { problems.push(`self-test ${t.id}: expected ${t.expect ? 'a problem' : 'none'}, got ${caught ? 'a problem' : 'none'}`); }
}

let checked = 0;
for (const c of CASES)
{
   const body = template(c.template)(c.context);
   for (const width of WIDTHS)
   {
      const id = `${c.name}-${width}`;
      for (const issue of await check(id, frame(width, c.theme ?? 'light', body), true)) { problems.push(`${id}: ${issue}`); }
      checked++;
   }
}
await browser.close();

console.log(problems.length ? problems.join('\n') : 'No overflow found; self-test passed.');
console.log(`\n${checked} layouts checked (${CASES.length} cases × ${WIDTHS.length} widths). Screenshots in tools/out/.`);
process.exit(problems.length ? 1 : 0);
