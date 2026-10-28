/**
 * Renders our templates and stylesheets in Chromium at a range of sheet widths, in light and dark themes, and reports
 * anything that overflows its box or the window, siblings drawn over each other, text below WCAG contrast (4.5:1, or
 * 3:1 for large text), more than three text styles, and any text field inside a width container. Writes screenshots to tools/out/.
 * Usage: npm run layout (set CHROMIUM_PATH to use an installed Chromium instead of Playwright's download)
 *
 * Every run starts with a self-test: a known-good page must pass and known-bad pages must fail, so an empty or
 * broken check can't pass silently.
 */
import { headerMinWidth } from '../src/sheet/header.js';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { template } from './templates.mjs';
import { CASES } from './fixtures.mjs';

const root = new URL('..', import.meta.url).pathname;
const out = `${root}tools/out`;
mkdirSync(out, { recursive: true });

// Classic Tidy opens at 740 wide (SCOPE §4); dnd5e's own sheet at 800. Foundry's chat sidebar is about 300 wide;
// players drag it narrower or wider, and pop messages out.
// The sheet never goes narrower than its ability row needs (headerMinWidth).
const WIDTHS = { sheet: [headerMinWidth(6), 740, 900], chat: [240, 300, 380] };
const HEIGHT = 810;
// Every stylesheet module.json loads, in its order.
const css = JSON.parse(readFileSync(`${root}module.json`, 'utf8')).styles
   .map((path) => readFileSync(`${root}${path}`, 'utf8')
      // A stylesheet's relative url()s (a theme's font) resolve against the stylesheet, as Foundry serves it.
      .replace(/url\((['"]?)(\.\.?\/[^'")]+)\1\)/g, (m, q, rel) => `url(${q}${new URL(rel, `file://${root}${path}`).href}${q})`))
   .join('\n');

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
const frame = (kind, width, theme, body, { look = '', hp = null } = {}) => `<section class="application ${FRAMES[kind].classes} themed theme-${theme} fhcs-theme-${theme}"${look ? ` data-fhcs-theme="${look}"` : ''}${hp === null ? '' : ` data-fhcs-hp="${hp <= 0 ? 'down' : hp <= 0.5 ? 'bloodied' : 'full'}"`}
   style="${hp === null ? '' : `--fhcs-hp:${hp};`}width:${width}px;height:${HEIGHT}px;display:flex;flex-direction:column;border:1px solid #000;margin:8px;
   ${THEMES[theme]}">
   ${kind === 'sheet'
      // Foundry's title bar as it draws one, with a module's extra button that must wait in the ⋮ menu (rule 14).
      ? `<header class="window-header"><h1 class="window-title">${width}px</h1><button type="button" class="header-control icon fa-solid fa-ellipsis-vertical" data-action="toggleControls" aria-label="Controls"></button><button type="button" class="header-control icon fa-solid fa-id-badge" data-action="moduleExtra" aria-label="A module's button"></button><button type="button" class="header-control icon fa-solid fa-xmark" data-action="close" aria-label="Close"></button></header>`
      : `<header style="background:#111;color:#eee;padding:4px 8px;font:13px sans-serif">${width}px</header>`}
   <div class="window-content" style="flex:1;min-height:0;overflow:auto">${FRAMES[kind].wrap(body)}</div></section>`;

const page = (html) => `<!doctype html><html lang="en"><head><meta charset="utf-8">
   <style>body{margin:0;background:#444;font-family:sans-serif}*{box-sizing:border-box}button,input,select{font:inherit}
   /* Foundry core's control defaults, roughly (v13/v14 foundry.css): ours must override them. */
   button{min-height:var(--button-size,2rem);padding:0 .5rem;line-height:1.5;justify-content:center}
   /* Foundry's glow on the open tab and its box on a focused button (the user's screenshot, 2026-10-28). */
   nav.tabs [data-tab].active{text-shadow:0 0 10px #c33}button:focus{box-shadow:0 0 6px #c33}
   /* Foundry's window frame, roughly (v13/v14): a 36px title bar and padded content; ours must override both. */
   .application{gap:1rem}.application .window-header{display:flex;flex:0 0 36px;align-items:center;padding:0 .5rem;border-bottom:1px solid #888}.application .window-content{padding:1rem}input[type=text],select{height:var(--input-height,2rem)}
   /* Foundry's form groups stretch each control across the row (the user's Special Traits screenshot, 2026-10-27). */
   .form-group{display:flex;flex-wrap:wrap;align-items:center;gap:4px}.form-group>label{flex:2}.form-fields{display:flex;flex:3;gap:4px}.form-fields>*{flex:1}.form-group>.hint{flex:0 0 100%}
   ${css}</style></head><body>${html}</body></html>`;

/** Runs in the page: lists everything that overflows, and text fields inside width containers. */
function findProblems()
{
   const issues = [];
   const POPOVER = '.fhcs-tray';
   const WHOLE = '.fhcs-condition-name, .fhcs-origin-text > .fhcs-label, .fhcs-origin-head > .fhcs-label, .fhcs-class-card .fhcs-origin-line > .fhcs-origin-name';
   const app = document.querySelector('.application');
   const edge = app.getBoundingClientRect().right;
   for (const el of app.querySelectorAll('.window-content *'))
   {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || el.closest('[hidden], .sr-only, .fhcs-sr-only, details:not([open]) > :not(summary)')) { continue; }
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
      // A fold-out tray opens over the layout on purpose; measure what holds one without it (the tray's own
      // contents are still measured, and still may not pass the window's edge).
      const trays = el.closest(POPOVER) ? [] : [...el.querySelectorAll(POPOVER)];
      trays.forEach((t) => { t.style.display = 'none'; });
      const wider = el.scrollWidth - el.clientWidth;
      trays.forEach((t) => { t.style.display = ''; });
      if (!clipsOnPurpose && wider > 1 && el.clientWidth > 0 && !['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName))
      {
         issues.push(`content wider than box by ${wider}px: ${label}`);
      }
      // Short fixed words may never be cut short, ellipsis or not, even by 1px: "Exhaus…" passed once (2026-10-26), and
      // "Backgrou…" at 1px (2026-10-28).
      if (clipsOnPurpose && wider >= 1 && el.matches(WHOLE)) { issues.push(`cut short by ${wider}px: ${label}`); }
   }
   // A checkbox stays square: Foundry's form groups stretched one into a bar across the row (user, 2026-10-27).
   for (const el of app.querySelectorAll('.window-content input[type=checkbox]'))
   {
      const r = el.getBoundingClientRect();
      if (r.width && Math.abs(r.width - r.height) > 1) { issues.push(`checkbox is ${Math.round(r.width)}×${Math.round(r.height)}: ${el.name}`); }
   }
   // dnd5e's proficiency cycle draws in its own shadow DOM, and its size followed Foundry's styles (user's screenshots,
   // 2026-10-27, twice). It must lie unseen over play mode's mark, which stays drawn the same size.
   for (const el of app.querySelectorAll('.window-content proficiency-cycle'))
   {
      const mark = el.parentElement?.querySelector(':scope > .fhcs-prof-mark');
      if (Number(getComputedStyle(el).opacity) !== 0 || !mark) { issues.push('dnd5e\'s proficiency cycle is drawn; play mode\'s mark must show under it, the cycle unseen'); continue; }
      const m = mark.getBoundingClientRect(), c = el.getBoundingClientRect();
      if (Math.abs((m.left + m.right) / 2 - (c.left + c.right) / 2) > 1 || Math.abs((m.top + m.bottom) / 2 - (c.top + c.bottom) / 2) > 1)
      {
         issues.push('the proficiency cycle is off its mark');
      }
   }
   // A round control stays round: Foundry's button sizes once made our pips oval (user, 2026-10-24).
   for (const el of app.querySelectorAll('.window-content :is(button, span, div)'))
   {
      const cs = getComputedStyle(el);
      if (cs.borderRadius !== '50%' || cs.display === 'none' || !el.getClientRects().length) { continue; }
      const r = el.getBoundingClientRect();
      if (Math.abs(r.width - r.height) > 1)
      {
         issues.push(`round element is ${Math.round(r.width)}×${Math.round(r.height)}: ${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`);
      }
   }
   // An icon fits its button (SCOPE §5.2 rule 4, user 2026-10-27): inside its box, and centred both ways when it's
   // the button's only content (vertically when text follows it). Concentration's icons sat off centre once.
   const HOLDS_ICON = 'button, summary, label.fhcs-chip, a[data-action], [role="img"]:not(svg)';
   for (const el of app.querySelectorAll(`.window-content :is(${HOLDS_ICON})`))
   {
      // The control's own icon: a direct child, or in a direct child span (drawings deeper in, like a card's d20s, aren't).
      // A mark under a word (the ability tray's triangle) is not the control's icon.
      const icon = el.querySelector(':scope > svg:not(.fhcs-pick-mark), :scope > span > svg');
      if (!icon || icon.closest(HOLDS_ICON) !== el) { continue; }
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || !el.getClientRects().length || getComputedStyle(icon).display === 'none') { continue; }
      const b = el.getBoundingClientRect(), i = icon.getBoundingClientRect();
      if (!b.width || !i.width) { continue; }
      const what = `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}${el.dataset.action ? ` [${el.dataset.action}]` : ''}`;
      if (i.left < b.left - 0.5 || i.right > b.right + 0.5 || i.top < b.top - 0.5 || i.bottom > b.bottom + 0.5)
      {
         issues.push(`icon spills out of its button (${Math.round(i.width)}×${Math.round(i.height)} in ${Math.round(b.width)}×${Math.round(b.height)}): ${what}`);
         continue;
      }
      const alone = !(el.textContent || '').trim();
      const dx = Math.abs((i.left + i.right) / 2 - (b.left + b.right) / 2), dy = Math.abs((i.top + i.bottom) / 2 - (b.top + b.bottom) / 2);
      if ((alone && dx > 1) || dy > 1.5) { issues.push(`icon off centre by ${Math.round(dx)}px across, ${Math.round(dy)}px down: ${what}`); }
   }

   // Like elements look alike (SCOPE §5.2 rules 16–19, user 2026-10-27).
   const shown = (el) => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden' && !el.closest('[aria-hidden="true"], [hidden]');
   const named = (el) => `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`;
   const ownText = (el) => [...el.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent).join('').trim();
   // 16: the portrait's chips are the inspiration chip's size (an icon-only chip square), and chips side by side
   // share a row, never stacked.
   const model = app.querySelector('.window-content .fhcs-portrait-stage [data-action="toggleInspiration"]');
   if (model && shown(model))
   {
      const m = model.getBoundingClientRect();
      for (const el of app.querySelectorAll('.window-content .fhcs-portrait-stage .fhcs-chip'))
      {
         if (el === model || !shown(el)) { continue; }
         const r = el.getBoundingClientRect();
         const iconOnly = !(el.textContent || '').trim();
         // A ring drawn around a chip (box-shadow) makes it look larger than its neighbours: "on" was once a ring.
         const ring = getComputedStyle(el).boxShadow !== getComputedStyle(model).boxShadow;
         if (ring || Math.abs(r.height - m.height) > 1 || (iconOnly && Math.abs(r.width - m.width) > 1))
         {
            issues.push(`portrait chip is ${Math.round(r.width)}×${Math.round(r.height)}${ring ? ' with a ring' : ''}, inspiration ${Math.round(m.width)}×${Math.round(m.height)}: ${named(el)}`);
         }
      }
      // The chips on the portrait keep a gap between them (a crowded top row once ran Frame into Inspiration).
      const chips = [...app.querySelectorAll('.window-content .fhcs-portrait-stage .fhcs-chip')].filter((el) => shown(el) && !el.closest('.fhcs-tray'));
      for (const [n, x] of chips.entries())
      {
         const rx = x.getBoundingClientRect();
         for (const y of chips.slice(n + 1))
         {
            const ry = y.getBoundingClientRect();
            if (rx.left < ry.right + 2 && ry.left < rx.right + 2 && rx.top < ry.bottom + 2 && ry.top < rx.bottom + 2) { issues.push(`portrait chips touch: ${named(x)} and ${named(y)}`); }
         }
      }
      for (const group of app.querySelectorAll('.window-content .fhcs-portrait-stage :is(.fhcs-rests, .fhcs-portrait-edit > .fhcs-tray, .fhcs-framing-zoom)'))
      {
         const tops = [...group.children].filter(shown).map((el) => Math.round(el.getBoundingClientRect().top));
         if (new Set(tops).size > 1) { issues.push(`portrait chips stacked, not side by side: ${named(group)}`); }
      }
   }
   // 16, the name row's status group (user, 2026-10-28): its segments are one height, touch with no gap, and an
   // icon-only segment is square.
   for (const group of app.querySelectorAll('.window-content .fhcs-status'))
   {
      const parts = [...group.children].filter(shown).map((el) => el.matches('details') ? el.querySelector(':scope > summary') : el);
      const boxes = parts.map((el) => el.getBoundingClientRect());
      for (const [n, r] of boxes.entries())
      {
         const el = parts[n];
         if (Math.abs(r.height - boxes[0].height) > 1) { issues.push(`status segment ${Math.round(r.height)}px tall, the first ${Math.round(boxes[0].height)}px: ${named(el)}`); }
         if (!(el.textContent || '').trim() && Math.abs(r.width - r.height) > 1) { issues.push(`icon-only status segment ${Math.round(r.width)}×${Math.round(r.height)}: ${named(el)}`); }
         if (n && r.left - boxes[n - 1].right > 1.5) { issues.push(`status segments ${Math.round(r.left - boxes[n - 1].right)}px apart: ${named(el)}`); }
      }
   }
   // 17: one text size inside one control ("HP" once sat smaller than its value). A row drawn as one button (a skill)
   // is a table row: its columns follow their own styles.
   // The sheet only: the chat cards' bands (a heading over its total) were settled in Phase 2.
   for (const el of app.querySelectorAll('.window-content :is(button, summary, [role="meter"], .fhcs-pill, label.fhcs-chip)'))
   {
      if (!shown(el) || !el.closest('.fhcs-sheet') || el.closest('.fhcs-skill')) { continue; }
      const sizes = new Set([el, ...el.querySelectorAll('*')].filter((n) => !n.ownerSVGElement && shown(n) && ownText(n)
         && n.closest('button, summary, [role="meter"], .fhcs-pill, label.fhcs-chip') === el).map((n) => getComputedStyle(n).fontSize));
      if (sizes.size > 1) { issues.push(`mixed text sizes (${[...sizes].join(', ')}) in one control: ${named(el)} "${el.textContent.trim().replace(/\s+/g, ' ').slice(0, 24)}"`); }
   }
   // 18: a button's words are body style, not capitals. An abbreviation (Str, Dex) may stay in capitals, and a heading
   // that folds (a favorites group, a list section) keeps the headings' label style.
   for (const el of app.querySelectorAll('.window-content :is(button, summary) *, .window-content :is(button, summary)'))
   {
      if (el.ownerSVGElement || !shown(el) || !el.closest('.fhcs-sheet')) { continue; }
      const text = ownText(el);
      if (/[a-z]/.test(text) && text.length > 3 && !el.closest('.fhcs-group-toggle, .fhcs-section-toggle') && getComputedStyle(el).textTransform === 'uppercase')
      {
         issues.push(`capitals in a button: ${named(el)} "${text.slice(0, 20)}"`);
      }
   }
   // 19: a gear is no taller than the words it sits beside: the control's own, else its parent's (its line). A gear
   // alone in a chip, with no words on its line, is a chip icon.
   for (const gear of app.querySelectorAll('.window-content svg.fhcs-gear'))
   {
      // The drawing itself is aria-hidden; only its control's visibility counts.
      if (!shown(gear.parentElement) || getComputedStyle(gear).display === 'none') { continue; }
      const h = gear.getBoundingClientRect().height;
      let words = null;
      for (let n = gear.parentElement, up = 0; n && n !== app && !words && up < 2; n = n.parentElement, up++)
      {
         words = [n, ...n.querySelectorAll('*')].find((t) => !t.ownerSVGElement && !t.contains(gear) && shown(t) && ownText(t))
            ?? (ownText(n) ? n : null);
      }
      const size = words ? parseFloat(getComputedStyle(words).fontSize) : 0;
      if (size && h > size + 1) { issues.push(`gear ${Math.round(h)}px beside ${Math.round(size)}px text: ${named(gear.parentElement)}`); }
   }

   // Every control takes its own clicks: at its centre the topmost element is the control or inside it. A layer drawn
   // over the portrait once swallowed its clicks (user, 2026-10-27). An open tray may cover what's under it.
   for (const el of app.querySelectorAll('.window-content [data-action]'))
   {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || el.closest('[hidden], details:not([open]) > :not(summary)')) { continue; }
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) { continue; }
      // A control scrolled or clipped out of sight (outside an ancestor that clips) is not covered, only hidden.
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      let clipped = false;
      for (let n = el.parentElement; n && n !== app && !clipped; n = n.parentElement)
      {
         if (getComputedStyle(n).overflow === 'visible') { continue; }
         const v = n.getBoundingClientRect();
         clipped = y < v.top || y > v.bottom || x < v.left || x > v.right;
      }
      if (clipped) { continue; }
      const hit = document.elementFromPoint(x, y);
      // An open tray, or a panel marked as laid over on purpose (the death saves over the portrait), may cover.
      if (!hit || el.contains(hit) || hit.closest('.fhcs-tray, [data-fhcs-overlay]')) { continue; }
      issues.push(`covered at its centre by ${hit.tagName.toLowerCase()}.${[...hit.classList].join('.')}: ${el.tagName.toLowerCase()}.${[...el.classList].join('.')} [${el.dataset.action}]`);
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
   // Art (SCOPE §4.11): an element a theme marks `--fhcs-art: 1` carries a picture whose colors the check can't know.
   // Text over it must read with pure black or pure white in the art's place, through the plates between them.
   // Custom properties inherit, so the art is where the mark starts, not every element under it.
   const marked = (n) => !!n && getComputedStyle(n).getPropertyValue('--fhcs-art').trim() === '1';
   const isArt = (n) => marked(n) && !marked(n.parentElement);
   const backdrops = (el) =>
   {
      const list = chain(el);
      const at = list.findLastIndex(isArt);
      if (at < 0 && !isArt(app)) { return [backdrop(el)]; }
      return [{ r: 0, g: 0, b: 0, a: 1 }, { r: 255, g: 255, b: 255, a: 1 }]
         .map((base) => list.slice(at + 1).reduce((bg, n) => over(parse(getComputedStyle(n).backgroundColor), bg), base));
   };
   const opacity = (el) => [app, ...chain(el)].reduce((o, n) => o * Number(getComputedStyle(n).opacity), 1);
   const luminance = ({ r, g, b }) =>
   {
      const lin = (c) => { const x = c / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
   };
   const ratio = (a, b) => { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
   for (const el of app.querySelectorAll('.window-content *'))
   {
      if (el.ownerSVGElement || el.closest('[hidden], details:not([open]) > :not(summary)') || !el.getClientRects().length) { continue; }
      const text = [...el.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent).join('').trim();
      if (!text) { continue; }
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden') { continue; }
      // A drawing behind the text (positioned under it), like a die's face or the AC shield, is its backdrop.
      const drawing = [...(el.parentElement?.children ?? [])].find((n) => n.tagName === 'svg' && getComputedStyle(n).position === 'absolute');
      const shape = drawing?.querySelector(':scope :is(polygon, path)');
      const fg = parse(cs.color);
      const size = parseFloat(cs.fontSize);
      const large = size >= 24 || (size >= 18.66 && Number(cs.fontWeight) >= 700);
      const needed = large ? 3 : 4.5;
      const got = Math.min(...backdrops(el).map((under) =>
      {
         const bg = shape ? over(parse(getComputedStyle(shape).fill), under) : under;
         return ratio(over({ ...fg, a: fg.a * opacity(el) }, bg), bg);
      }));
      if (got < needed) { issues.push(`contrast ${got.toFixed(2)}:1 below ${needed}:1: ${el.tagName.toLowerCase()}.${[...el.classList].join('.')} "${text.slice(0, 30)}"`); }
   }

   // Three text styles, no more (user, 2026-10-24): size, weight and capitals of every piece of text in our parts.
   const styles = new Map();
   for (const el of app.querySelectorAll('.window-content *'))
   {
      if (!el.closest('.fhcs-chat, .fhcs-sheet')) { continue; }
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

   // The title bar is one control tall, and the sheet starts right under it (user's screenshot, 2026-10-28: a wide gap).
   const bar = app.querySelector(':scope > .window-header'), content = app.querySelector(':scope > .window-content');
   if (bar && content && app.matches('.fhcs-sheet') && content.firstElementChild?.matches('[class*="fhcs-"]'))
   {
      // The first thing drawn: the topmost box inside the first part (a part's own padding is space, not content).
      const b = bar.getBoundingClientRect();
      const tops = [...content.firstElementChild.querySelectorAll('*')].filter((el) => !el.ownerSVGElement && el.getClientRects().length).map((el) => el.getBoundingClientRect().top);
      const first = tops.length ? { top: Math.min(...tops) } : null;
      if (Math.abs(b.height - 28) > 1) { issues.push(`title bar is ${Math.round(b.height)}px tall, not 28`); }
      // A theme's window band (Forge's iron, `--fhcs-theme-band`) is drawn there, not empty: the air is measured below it.
      const band = parseFloat(getComputedStyle(app).getPropertyValue('--fhcs-theme-band')) || 0;
      if (first && first.top - b.bottom - band > 4.5) { issues.push(`${Math.round(first.top - b.bottom - band)}px between the title bar and the sheet`); }
   }
   // The tab row draws no glow or box of its own (user, 2026-10-28): the underline marks the open tab.
   for (const tab of app.querySelectorAll('.window-content .fhcs-tabs > :is(.fhcs-tab, .fhcs-lock)'))
   {
      const cs = getComputedStyle(tab);
      if (cs.textShadow !== 'none' || cs.boxShadow !== 'none') { issues.push(`tab ${tab.dataset.tab ?? 'lock'} glows: ${cs.textShadow !== 'none' ? cs.textShadow : cs.boxShadow}`); }
   }
   // The title bar holds only ⋮ and × (rule 14, user 2026-10-28); any other button waits in the ⋮ menu.
   for (const control of app.querySelectorAll(':scope > .window-header > .header-control'))
   {
      const kept = control.matches('[data-action="toggleControls"], [data-action="close"], .preparation-warnings');
      if (kept !== !!control.getClientRects().length) { issues.push(`title bar: ${control.dataset.action} ${kept ? 'hidden' : 'shows'}`); }
   }
   // Spacing is 4 or 8 (SCOPE §5.2 rule 3, user 2026-10-28), every gap, padding and margin on the sheet, except:
   // a hang (rule 21: a control reaching into the space around its line, a negative margin on the named controls),
   // an indent that lines text up with a column (the name column, a container's contents, the footer's last column),
   // the screen-reader clip, and the lock's automatic margin (the theme chip's, when it stands before the lock).
   if (app.matches('.fhcs-sheet'))
   {
      const HANGS = '.fhcs-shield, .fhcs-gear-button, .fhcs-more, .fhcs-class-level';
      const INDENTS = '.fhcs-favorite-details, .fhcs-item-details > .wrapper, .fhcs-contents, .fhcs-inventory-foot';
      const SPACING = ['rowGap', 'columnGap', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft'];
      const off = new Map();
      for (const el of app.querySelectorAll('.window-content *'))
      {
         if (el.ownerSVGElement || !el.getClientRects().length || el.matches('.fhcs-sr-only, .fhcs-lock, .fhcs-theme-pick')) { continue; }
         // Ours only: inside our markup (a plain page's paragraph keeps the browser's margins).
         if (!el.closest('.window-content [class*="fhcs-"]')) { continue; }
         const cs = getComputedStyle(el);
         for (const prop of SPACING)
         {
            const v = parseFloat(cs[prop]);
            if (Number.isNaN(v) || [0, 4, 8].includes(v)) { continue; }
            if (prop.endsWith('Gap') && !/flex|grid/.test(cs.display)) { continue; }
            if (v < 0 && el.matches(HANGS)) { continue; }
            if (el.matches(INDENTS)) { continue; }
            off.set(`${prop} ${v}px: ${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`, true);
         }
      }
      for (const key of off.keys()) { issues.push(`spacing not 4 or 8, ${key}`); }
   }

   // Foundry's tab action finds a tab button only as a child of `.tabs`; anywhere else the click does nothing.
   for (const tab of app.querySelectorAll('[data-action="tab"]'))
   {
      if (!tab.parentElement?.matches('.tabs')) { issues.push(`tab "${tab.dataset.tab}" is not a direct child of .tabs; Foundry won't switch to it`); }
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
   { id: 'self-tab', expect: true, body: '<nav><button type="button" data-action="tab" data-tab="a">A</button></nav>' },
   { id: 'self-container', expect: true, body: '<div style="container-type:inline-size"><input type="text"></div>' },
   { id: 'self-styles', expect: true, body: '<div class="fhcs-chat"><p style="font-size:10px">a</p><p style="font-size:11px">b</p><p style="font-size:12px">c</p><p style="font-size:13px">d</p></div>' },
   { id: 'self-art-thin-plate', expect: true, body: '<div style="--fhcs-art:1;background:#888"><p style="color:#111;background:rgba(255,255,255,.3)">Text on a thin plate over art</p></div>' },
   { id: 'self-art-plate', expect: false, body: '<div style="--fhcs-art:1;background:#888"><p style="color:#111;background:rgba(255,255,255,.92)">Text on a plate over art</p></div>' },
   { id: 'self-contrast', expect: true, body: '<p style="color:#bbb">Too faint to read</p>' },
   { id: 'self-oval', expect: true, body: '<button style="width:40px;height:24px;min-height:0;border-radius:50%"></button>' },
   { id: 'self-tray', expect: false, body: '<div style="position:relative;width:40px"><div class="fhcs-tray" style="position:absolute;width:200px">A tray</div></div>' },
   { id: 'self-shape-contrast', expect: true, body: '<span style="position:relative;display:grid;color:#333"><svg style="position:absolute" width="40" height="40"><path d="M0 0h40v40H0z" fill="#222"/></svg><span>16</span></span>' },
   { id: 'self-icon-off-centre', expect: true, body: '<button style="display:flex;align-items:flex-start;justify-content:flex-start;width:28px;height:28px;padding:0"><svg width="16" height="16"><path d="M0 0h16v16H0z"/></svg></button>' },
   { id: 'self-icon-spills', expect: true, body: '<button style="display:grid;place-items:center;width:20px;height:20px;padding:0;overflow:visible"><svg width="28" height="28" style="flex:none"><path d="M0 0h28v28H0z"/></svg></button>' },
   { id: 'self-icon-centred', expect: false, body: '<button style="display:grid;place-items:center;width:28px;height:28px;min-height:0;padding:0"><svg width="16" height="16"><path d="M0 0h16v16H0z"/></svg></button>' },
   { id: 'self-mixed-sizes', expect: true, body: '<button style="display:flex;width:120px"><span style="font-size:12px">HP</span><span style="font-size:20px">8</span></button>' },
   { id: 'self-capitals', expect: true, body: '<button style="text-transform:uppercase;width:120px">Columns</button>' },
   { id: 'self-gear', expect: true, body: '<span style="display:flex;align-items:center;font-size:12px">Str<button style="display:grid;place-items:center;width:24px;height:24px;min-height:0;padding:0"><svg class="fhcs-gear" style="width:16px;height:16px"><path d="M0 0h16v16H0z"/></svg></button></span>' },
   { id: 'self-spacing', expect: true, body: '<div class="fhcs-self" style="display:flex;gap:3px"><span>a</span><span>b</span></div>' },
   { id: 'self-overlap', expect: true, body: '<div style="display:grid;grid-template-columns:40px 1fr"><span style="justify-self:start;white-space:nowrap">Runs into the next</span><span>x</span></div>' }
];

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const tab = await browser.newPage({ viewport: { width: 1100, height: HEIGHT + 40 } });

/**
 * Runs in the page: edges a case says must line up (SCOPE §5.2 rule 1): [selector, edge, selector, edge], each the
 * first match's top, bottom, left or right.
 */
function misaligned(pairs)
{
   const issues = [];
   const edge = (selector, side) => document.querySelector(`.window-content ${selector}`)?.getBoundingClientRect()[side];
   for (const [a, sa, b, sb] of pairs)
   {
      const ea = edge(a, sa), eb = edge(b, sb);
      if (ea === undefined || eb === undefined) { issues.push(`can't align ${a} ${sa} with ${b} ${sb}: one is missing`); continue; }
      if (Math.abs(ea - eb) > 1) { issues.push(`${a} ${sa} is ${Math.round(ea - eb)}px off ${b} ${sb}`); }
   }
   return issues;
}

/**
 * Runs in the page: every element of ours in normal flow, keyed by its last fhcs class and its index among those, with
 * its height, its top within the window, and how many elements it holds. Edit mode must keep every one that both modes draw (SCOPE §5.2 rule 6).
 */
function everyBox()
{
   const root = document.querySelector('.window-content'), top = root.getBoundingClientRect().top;
   const boxes = {}, counts = {};
   for (const el of root.querySelectorAll('[class*="fhcs-"]'))
   {
      if (!el.getClientRects().length || el.closest('[hidden], [aria-hidden="true"]')) { continue; }
      // Laid over the page on purpose (trays, chips on the portrait): not part of the flow.
      let floating = false;
      for (let n = el; n && n !== root && !floating; n = n.parentElement) { floating = ['absolute', 'fixed'].includes(getComputedStyle(n).position); }
      if (floating) { continue; }
      // Its most particular class: the last of ours that names a part, not a style (`fhcs-body fhcs-skill-name` and
      // `fhcs-skill-name` pair up; `fhcs-muted` names nothing).
      const STYLE = ['fhcs-body', 'fhcs-label', 'fhcs-display', 'fhcs-muted', 'fhcs-on', 'fhcs-nowrap', 'fhcs-icon'];
      const cls = [...el.classList].filter((c) => c.startsWith('fhcs-') && !STYLE.includes(c)).pop();
      if (!cls) { continue; }
      const n = counts[cls] = (counts[cls] ?? 0) + 1;
      const r = el.getBoundingClientRect();
      // Where its own words sit: edit mode's text once sat 4px low in rows of the same height (user, 2026-10-27).
      const words = [...el.childNodes].find((t) => t.nodeType === Node.TEXT_NODE && t.textContent.trim());
      let textTop = null;
      if (words) { const range = document.createRange(); range.selectNodeContents(words); textTop = Math.round(range.getBoundingClientRect().top - top); }
      // The third number counts what it holds: a container that edit mode gives more to (the empty traits, shown to be
      // set) may grow at its end without moving anything.
      boxes[`${cls}#${n}`] = [Math.round(r.height), Math.round(r.top - top), el.querySelectorAll('*').length, textTop];
   }
   return { boxes, counts };
}

/**
 * Runs in the page: the heights of everything `rows` finds, and the left and right edges of everything `marks` finds,
 * for comparing play mode with edit mode.
 */
function heights({ rows, marks })
{
   const box = document.querySelector('.window-content').getBoundingClientRect();
   const all = (selector) => [...document.querySelectorAll(`.window-content ${selector}`)];
   return {
      rows: all(rows).map((el) => Math.round(el.getBoundingClientRect().height)),
      marks: marks ? all(marks).map((el) => { const r = el.getBoundingClientRect(); return [Math.round(r.left - box.left), Math.round(r.right - box.left)]; }) : []
   };
}

/** Renders one page and returns its problems, and the row heights a case asks to compare. */
async function check(id, html, screenshot, c = {})
{
   writeFileSync(`${out}/${id}.html`, page(html));
   await tab.goto(`file://${out}/${id}.html`);
   const found = await tab.evaluate(findProblems);
   if (c.align) { found.push(...await tab.evaluate(misaligned, c.align)); }
   if (c.rows) { measured.set(`${c.name}|${id.slice(c.name.length)}`, await tab.evaluate(heights, { rows: c.rows, marks: c.marks })); }
   if (c.rows) { boxes.set(`${c.name}|${id.slice(c.name.length)}`, await tab.evaluate(everyBox)); }
   if (screenshot) { await tab.screenshot({ path: `${out}/${id}.png`, fullPage: true }); }
   return found;
}

/** Row heights by case and frame, for SCOPE §5.2 rule 6: edit mode keeps play mode's rows. */
const measured = new Map();
/** Every element's box by case and frame, for the same rule. */
const boxes = new Map();

const problems = [];
for (const t of SELF_TEST)
{
   const caught = (await check(t.id, frame('sheet', WIDTHS.sheet[0], 'light', t.body), false)).length > 0;
   if (caught !== t.expect) { problems.push(`self-test ${t.id}: expected ${t.expect ? 'a problem' : 'none'}, got ${caught ? 'a problem' : 'none'}`); }
}

let checked = 0;
for (const c of CASES)
{
   // `open` lists folded panels to draw open, by their data-fold-key.
   // A case gives a template and its context, or `html`: markup Foundry draws for dnd5e (its form helpers aren't here).
   const body = (c.open ?? []).reduce((html, key) => html.replace(`data-fold-key="${key}"`, `data-fold-key="${key}" open`),
      c.html ?? template(c.template)(c.context));
   const kind = c.frame ?? 'sheet';
   for (const theme of c.theme ? [c.theme] : Object.keys(THEMES))
   {
      for (const width of WIDTHS[kind])
      {
         const id = `${c.name}-${theme}-${width}`;
         for (const issue of await check(id, frame(kind, width, theme, body, c), true, c)) { problems.push(`${id}: ${issue}`); }
         // `sameRowsAs` names the play-mode case this edit-mode one must match row for row (rule 6).
         if (c.sameRowsAs)
         {
            const mine = measured.get(`${c.name}|${id.slice(c.name.length)}`), theirs = measured.get(`${c.sameRowsAs}|${id.slice(c.name.length)}`);
            if (mine && theirs && JSON.stringify(mine.rows) !== JSON.stringify(theirs.rows))
            {
               const at = mine.rows.findIndex((h, n) => h !== theirs.rows[n]);
               problems.push(`${id}: edit mode reshapes ${c.rows}: row ${at + 1} is ${mine.rows[at]}px, ${theirs.rows[at]}px in ${c.sameRowsAs}`);
            }
            // Every element both modes draw keeps its height and place; a class drawn a different number of times in
            // each mode (edit mode's gears) can't be paired, so it's left to the rows above.
            const bm = boxes.get(`${c.name}|${id.slice(c.name.length)}`), bt = boxes.get(`${c.sameRowsAs}|${id.slice(c.name.length)}`);
            const shifted = Object.keys(bm?.boxes ?? {}).filter((k) =>
            {
               const cls = k.split('#')[0], t = bt?.boxes[k], m = bm.boxes[k];
               return t && bm.counts[cls] === bt.counts[cls] && ((m[2] === t[2] && Math.abs(m[0] - t[0]) > 1) || Math.abs(m[1] - t[1]) > 1
                  || (m[3] !== null && t[3] !== null && Math.abs(m[3] - t[3]) > 1));
            });
            if (shifted.length)
            {
               const say = shifted.slice(0, 4).map((k) => `${k} ${bm.boxes[k][0]}px@${bm.boxes[k][1]} text@${bm.boxes[k][3]}, was ${bt.boxes[k][0]}px@${bt.boxes[k][1]} text@${bt.boxes[k][3]}`);
               problems.push(`${id}: edit mode moves or resizes ${shifted.length} element(s): ${say.join('; ')}`);
            }
            const moved = (mine?.marks ?? []).findIndex((m, n) => theirs?.marks[n] && (Math.abs(m[0] - theirs.marks[n][0]) > 1 || Math.abs(m[1] - theirs.marks[n][1]) > 1));
            if (moved >= 0)
            {
               problems.push(`${id}: edit mode moves ${c.marks} #${moved + 1}: ${mine.marks[moved].join('–')}px, ${theirs.marks[moved].join('–')}px in ${c.sameRowsAs}`);
            }
         }
         checked++;
      }
   }
}
await browser.close();

console.log(problems.length ? problems.join('\n') : 'No overflow found; self-test passed.');
console.log(`\n${checked} layouts checked (${CASES.length} cases, light and dark, at their frame's widths). Screenshots in tools/out/.`);
process.exit(problems.length ? 1 : 0);
