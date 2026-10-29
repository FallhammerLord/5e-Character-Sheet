/**
 * Fire and Forge's textures as vectors (user, 2026-10-28: "use vectors rather than pixels", the Damascus first): writes
 * the `--fhcs-theme-damascus` and `--fhcs-theme-rune-*` data URIs into styles/themes/forge.css. Run after changing a
 * number here: `node tools/forge-textures.mjs`.
 *
 * Damascus: folded steel in three tones, ladder rungs and raindrops (see `damascus`). (A hammered grain lived here too,
 * dropped 2026-10-28: on panels it read as rocks.)
 */

import { readFileSync, writeFileSync } from 'node:fs';

const CSS = new URL('../styles/themes/forge.css', import.meta.url);

const r1 = (n) => Math.round(n * 10) / 10;


/**
 * Pattern-welded steel (user, 2026-10-28: "folded pattern steel, not wood grain"; research note, Damascus): the layers'
 * depth as a field, cut into bands of three steels (bright nickel, grey steel, dark etched high-carbon) by turns, and
 * drawn as the bands' edges. Ladder rungs (grooves cut across the billet, the layers swung up into nested arches) and
 * raindrops (punched drops, concentric eyes) bend the field; a slow wave keeps it forged, not machined. Every term's
 * period divides the tile's width, so the tile repeats with no seam. The edges are traced by marching squares and
 * chained into paths, one per steel.
 */
/** The three steels: colour, opacity, stroke width. The brightest and darkest go to the layout check (`-hi`, `-lo`). */
const DAMASCUS_STEELS = [['#f4efe6', 0.2, 1.3], ['#9aa3ad', 0.22, 1.1], ['#000', 0.4, 1.6]];
const stroke = ([colour, alpha], ground) => `color-mix(in srgb, ${colour} ${Math.round(alpha * 100)}%, var(--fhcs-theme-${ground}))`;

function damascus()
{
   const W = 320;
   const H = 28;
   const TAU = Math.PI * 2;
   const STEP = 2;
   const BAND = 2.6;
   // Periodic distance in x, so terms near the tile's ends meet their copies across the seam.
   const dx = (x, x0) => ((x - x0) % W + W * 1.5) % W - W / 2;
   const rungs = [30, 130, 230];
   const drops = [[80, 9, 1], [180, 19, 0.9], [280, 11, 1.1]];
   const field = (x, y) =>
   {
      let f = y + 2.2 * Math.sin(TAU * x / W) + 1.1 * Math.sin(TAU * 3 * x / W + 1);
      for (const x0 of rungs) { f += 22 * Math.exp(-((dx(x, x0) / 9) ** 2)); }
      for (const [x0, y0, s] of drops) { f += 11 * s * Math.exp(-((dx(x, x0) / 13) ** 2) - ((y - y0) / 6) ** 2); }
      return f;
   };
   const cols = W / STEP;
   const rows = Math.ceil(H / STEP) + 2;
   const value = [];
   for (let j = 0; j <= rows; j++)
   {
      value.push([]);
      for (let i = 0; i <= cols; i++) { value[j].push(field(i * STEP, (j - 1) * STEP)); }
   }
   const lo = Math.floor(Math.min(...value.flat()) / BAND);
   const hi = Math.ceil(Math.max(...value.flat()) / BAND);
   const steels = [[], [], []];
   for (let n = lo; n <= hi; n++)
   {
      const c = n * BAND;
      const segments = [];
      const at = (i0, j0, i1, j1) =>
      {
         const a = value[j0][i0];
         const b = value[j1][i1];
         const t = (c - a) / (b - a);
         return [r1((i0 + (i1 - i0) * t) * STEP), r1((j0 - 1 + (j1 - j0) * t) * STEP)];
      };
      for (let j = 0; j < rows; j++)
      {
         for (let i = 0; i < cols; i++)
         {
            const corners = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]];
            const cut = [];
            for (let e = 0; e < 4; e++)
            {
               const [i0, j0] = corners[e];
               const [i1, j1] = corners[(e + 1) % 4];
               if ((value[j0][i0] < c) !== (value[j1][i1] < c)) { cut.push(at(i0, j0, i1, j1)); }
            }
            if (cut.length === 2) { segments.push(cut); }
            if (cut.length === 4) { segments.push([cut[0], cut[1]], [cut[2], cut[3]]); }
         }
      }
      steels[((n % 3) + 3) % 3].push(...chain(segments));
   }
   const look = DAMASCUS_STEELS;
   const paths = steels.map((lines, k) => `<path d='${lines.join('')}' stroke='${look[k][0]}' stroke-opacity='${look[k][1]}' stroke-width='${look[k][2]}'/>`);
   return `<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}'><g fill='none' stroke-linejoin='round'>${paths.join('')}</g></svg>`;
}

/** Joins segments that share ends into polylines, as path data. */
function chain(segments)
{
   const key = (p) => `${p[0]},${p[1]}`;
   const ends = new Map();
   segments.forEach((s, i) => { for (const p of s) { ends.set(key(p), [...(ends.get(key(p)) ?? []), i]); } });
   const used = new Set();
   const lines = [];
   for (let i = 0; i < segments.length; i++)
   {
      if (used.has(i)) { continue; }
      used.add(i);
      const line = [...segments[i]];
      for (const forward of [true, false])
      {
         for (;;)
         {
            const tip = forward ? line[line.length - 1] : line[0];
            const next = (ends.get(key(tip)) ?? []).find((n) => !used.has(n));
            if (next === undefined) { break; }
            used.add(next);
            const [a, b] = segments[next];
            const far = key(a) === key(tip) ? b : a;
            if (forward) { line.push(far); }
            else { line.unshift(far); }
         }
      }
      lines.push(`M${line.map((p) => `${p[0]} ${p[1]}`).join('L')}`);
   }
   return lines;
}

/**
 * Inspiration's marks in Forge (user, 2026-10-28: "the runes from fire and forge"): five of the stamped runes, one per
 * place in the bank. Empty, the rune's lines; banked, a struck tile with the rune cut through it, so the shape says
 * which, not only the glow. Masks: only their shape counts, the sheet colours them.
 */
const RUNES = ['M9 5v14M9 8l6-3M9 12l6-3', 'M9 19V5l6 4v10', 'M9 5v14M9 8l5 4-5 4', 'M12 5v14M8 9l4-4 4 4', 'M12 5v14M8 8l8 7M16 8l-8 7'];
function rune(d, on)
{
   const lines = (colour, width) => `<path d='${d}' fill='none' stroke='${colour}' stroke-width='${width}' stroke-linecap='square' stroke-linejoin='miter'/>`;
   if (!on) { return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>${lines('#000', 2)}</svg>`; }
   return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><mask id='m'><rect width='24' height='24' fill='#fff'/>${lines('#000', 2.2)}</mask>`
      + `<rect x='2' y='1' width='20' height='22' rx='3' mask='url(#m)'/></svg>`;
}

const uri = (svg) => `url("data:image/svg+xml,${svg.replace(/#/g, '%23').replace(/</g, '%3C').replace(/>/g, '%3E').replace(/ /g, '%20')}")`;

let css = readFileSync(CSS, 'utf8');
const runes = RUNES.flatMap((d, i) => [[`rune-${i + 1}`, rune(d, false)], [`rune-${i + 1}-on`, rune(d, true)]]);
for (const [name, svg] of [['damascus', damascus()], ...runes])
{
   const line = new RegExp(`(--fhcs-theme-${name}: )url\\("data:image/svg\\+xml,[^"]*"\\);`);
   if (!line.test(css)) { throw new Error(`forge.css has no --fhcs-theme-${name} token to replace`); }
   css = css.replace(line, `$1${uri(svg)};`);
}
// The bar's gradient runs from bar-top to bar: the bright stroke is worst on the lighter end, the dark on the darker.
for (const [name, value] of [['damascus-hi', stroke(DAMASCUS_STEELS[0], 'bar-top')], ['damascus-lo', stroke(DAMASCUS_STEELS[2], 'bar')]])
{
   const line = new RegExp(`(--fhcs-theme-${name}: )[^;]*;`);
   if (!line.test(css)) { throw new Error(`forge.css has no --fhcs-theme-${name} token to replace`); }
   css = css.replace(line, `$1${value};`);
}
writeFileSync(CSS, css);
console.log('Wrote the Damascus and rune marks into styles/themes/forge.css.');
