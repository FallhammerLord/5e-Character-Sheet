/**
 * Renders our templates and stylesheets in Chromium at a range of sheet widths, in light and dark themes, and reports
 * anything that overflows its box or the window, siblings drawn over each other, text below WCAG contrast (4.5:1, or
 * 3:1 for large text), more than three text styles, and any text field inside a width container. Writes screenshots to tools/out/.
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

// Classic Tidy opens at 740 wide (SCOPE §4); dnd5e's own sheet at 800. Foundry's chat sidebar is about 300 wide;
// players drag it narrower or wider, and pop messages out.
const WIDTHS = { sheet: [560, 650, 740, 900], chat: [240, 300, 380] };
const HEIGHT = 810;
// Every stylesheet module.json loads, in its order.
const css = JSON.parse(readFileSync(`${root}module.json`, 'utf8')).styles
   .map((path) => readFileSync(`${root}${path}`, 'utf8')).join('\n');

/** The classes and wrapper Foundry and dnd5e give each kind of frame. */
const FRAMES = {
   sheet: { classes: 'sheet actor character fhcs-sheet', wrap: (body) => body },
   chat: {
      classes: 'chat-sidebar',
      wrap: (body) => `<ol class="chat-log" style="list-style:none;margin:0;padding:6px">
         <li class="chat-message message dnd5e2 fhcs-chat">
         <div class="message-content">${body}</div></li></ol>`
   }
};

/** Foundry's light and dark themes, as the page and text colors a card sits on. */
const THEMES = { light: 'background:#f4f1ea;color:#191813', dark: 'background:#26252b;color:#e8e6e3' };

/** A window like Foundry's, with the classes dnd5e, Foundry's theme and our code put on it. */
const frame = (kind, width, theme, body) => `<section class="application ${FRAMES[kind].classes} themed theme-${theme} fhcs-theme-${theme}"
   style="width:${width}px;height:${HEIGHT}px;display:flex;flex-direction:column;border:1px solid #000;margin:8px;
   ${THEMES[theme]}">
   <header style="background:#111;color:#eee;padding:4px 8px;font:13px sans-serif">${width}px</header>
   <div class="window-content" style="flex:1;min-height:0;overflow:auto">${FRAMES[kind].wrap(body)}</div></section>`;

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
      // Shapes inside one SVG drawing overlap by design.
      if (el.ownerSVGElement) { continue; }
      const r = el.getBoundingClientRect();
      if (!r.width) { continue; }
      const label = `${el.tagName.toLowerCase()}.${[...el.classList].join('.')} "${(el.textContent || el.value || '').trim().slice(0, 30)}"`;
      if (r.right > edge + 1) { issues.push(`past window edge by ${Math.round(r.right - edge)}px: ${label}`); continue; }
      // Siblings drawn on top of each other (a grid item wider than its track runs into the next one).
      if (cs.position !== 'absolute' && cs.position !== 'fixed')
      {
         for (let next = el.nextElementSibling; next; next = next.nextElementSibling)
         {
            const ns = getComputedStyle(next);
            if (ns.display === 'none' || ns.position === 'absolute' || ns.position === 'fixed') { continue; }
            const n = next.getBoundingClientRect();
            const across = Math.min(r.right, n.right) - Math.max(r.left, n.left);
            const down = Math.min(r.bottom, n.bottom) - Math.max(r.top, n.top);
            if ((across > 1) && (down > 1)) { issues.push(`overlaps its next sibling by ${Math.round(across)}px: ${label}`); }
         }
      }
      const clipsOnPurpose = cs.textOverflow === 'ellipsis' || ['auto', 'scroll', 'hidden'].includes(cs.overflowX);
      if (!clipsOnPurpose && el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0
         && !['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName))
      {
         issues.push(`content wider than box by ${el.scrollWidth - el.clientWidth}px: ${label}`);
      }
   }
   // Contrast: each piece of text against what it is drawn on (a die's number against the die's fill).
   const parse = (value) =>
   {
      let m = /rgba?\(([^)]+)\)/.exec(value);
      if (m) { const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 }; }
      m = /color\(srgb ([^)]+)\)/.exec(value);
      if (m) { const p = m[1].split(/[\s/]+/).filter(Boolean).map(Number); return { r: p[0] * 255, g: p[1] * 255, b: p[2] * 255, a: p[3] ?? 1 }; }
      return { r: 0, g: 0, b: 0, a: 0 };
   };
   const over = (top, bottom) => ({
      r: top.r * top.a + bottom.r * (1 - top.a), g: top.g * top.a + bottom.g * (1 - top.a),
      b: top.b * top.a + bottom.b * (1 - top.a), a: 1
   });
   const chain = (el) => { const list = []; for (let n = el; n && n !== app; n = n.parentElement) { list.unshift(n); } return list; };
   const backdrop = (el) => chain(el).reduce((bg, n) => over(parse(getComputedStyle(n).backgroundColor), bg),
      parse(getComputedStyle(app).backgroundColor));
   const opacity = (el) => [app, ...chain(el)].reduce((o, n) => o * Number(getComputedStyle(n).opacity), 1);
   const luminance = ({ r, g, b }) =>
   {
      const lin = (c) => { const x = c / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
   };
   const ratio = (a, b) => { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
   for (const el of app.querySelectorAll('.window-content *'))
   {
      if (el.ownerSVGElement || el.closest('[hidden]') || !el.getClientRects().length) { continue; }
      const text = [...el.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent).join('').trim();
      if (!text) { continue; }
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden') { continue; }
      let bg = backdrop(el);
      const shape = el.parentElement?.querySelector(':scope > svg polygon');
      if (shape) { bg = over(parse(getComputedStyle(shape).fill), bg); }
      const fg = parse(cs.color);
      const seen = over({ ...fg, a: fg.a * opacity(el) }, bg);
      const size = parseFloat(cs.fontSize);
      const large = size >= 24 || (size >= 18.66 && Number(cs.fontWeight) >= 700);
      const needed = large ? 3 : 4.5;
      const got = ratio(seen, bg);
      if (got < needed) { issues.push(`contrast ${got.toFixed(2)}:1 below ${needed}:1: ${el.tagName.toLowerCase()}.${[...el.classList].join('.')} "${text.slice(0, 30)}"`); }
   }

   // Three text styles, no more (user, 2026-10-24): size, weight and capitals of every piece of text in our parts.
   const styles = new Map();
   for (const el of app.querySelectorAll(':is(.fhcs-chat, .fhcs-sheet) *'))
   {
      if (el.ownerSVGElement || el.closest('[aria-hidden="true"], [hidden]') || !el.getClientRects().length) { continue; }
      const own = [...el.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent).join('').trim();
      if (!own) { continue; }
      const cs = getComputedStyle(el);
      const key = `${cs.fontSize} ${Number(cs.fontWeight) >= 600 ? 'bold' : 'regular'} ${cs.textTransform === 'uppercase' ? 'capitals' : 'mixed'}`;
      if (!styles.has(key)) { styles.set(key, `${el.tagName.toLowerCase()}.${[...el.classList].join('.')} "${own.slice(0, 20)}"`); }
   }
   if (styles.size > 3)
   {
      issues.push(`${styles.size} text styles (3 allowed): ${[...styles].map(([k, v]) => `${k} (${v})`).join('; ')}`);
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
   { id: 'self-container', expect: true, body: '<div style="container-type:inline-size"><input type="text"></div>' },
   { id: 'self-styles', expect: true, body: '<div class="fhcs-chat"><p style="font-size:10px">a</p><p style="font-size:11px">b</p><p style="font-size:12px">c</p><p style="font-size:13px">d</p></div>' },
   { id: 'self-contrast', expect: true, body: '<p style="color:#bbb">Too faint to read</p>' },
   { id: 'self-overlap', expect: true, body: '<div style="display:grid;grid-template-columns:40px 1fr"><span style="justify-self:start;white-space:nowrap">Runs into the next</span><span>x</span></div>' }
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
   const caught = (await check(t.id, frame('sheet', WIDTHS.sheet[0], 'light', t.body), false)).length > 0;
   if (caught !== t.expect) { problems.push(`self-test ${t.id}: expected ${t.expect ? 'a problem' : 'none'}, got ${caught ? 'a problem' : 'none'}`); }
}

let checked = 0;
for (const c of CASES)
{
   const body = template(c.template)(c.context);
   const kind = c.frame ?? 'sheet';
   for (const theme of c.theme ? [c.theme] : Object.keys(THEMES))
   {
      for (const width of WIDTHS[kind])
      {
         const id = `${c.name}-${theme}-${width}`;
         for (const issue of await check(id, frame(kind, width, theme, body), true)) { problems.push(`${id}: ${issue}`); }
         checked++;
      }
   }
}
await browser.close();

console.log(problems.length ? problems.join('\n') : 'No overflow found; self-test passed.');
console.log(`\n${checked} layouts checked (${CASES.length} cases, light and dark, at their frame's widths). Screenshots in tools/out/.`);
process.exit(problems.length ? 1 : 0);
