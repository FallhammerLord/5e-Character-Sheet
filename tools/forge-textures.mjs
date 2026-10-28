/**
 * Fire and Forge's textures as vectors (user, 2026-10-28: "use vectors rather than pixels", the Damascus first): writes
 * the `--fhcs-theme-damascus`, `--fhcs-theme-grain` and `--fhcs-theme-rune-*` data URIs into styles/themes/forge.css. Run after changing a
 * number here: `node tools/forge-textures.mjs`.
 *
 * Damascus: layers of folded steel as smooth Bézier lines, light and dark by turns. Every wave's period divides the
 * tile's width, so the tile repeats with no seam. Grain: hammer dimples, soft gradient ellipses, light above and dark
 * below, placed by a seeded random and drawn again across any edge they cross, so this tile repeats too.
 */

import { readFileSync, writeFileSync } from 'node:fs';

const CSS = new URL('../styles/themes/forge.css', import.meta.url);

/** A seeded random (mulberry32), so the textures are the same on every run. */
function seeded(seed)
{
   let a = seed;
   return () =>
   {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
   };
}

const r1 = (n) => Math.round(n * 10) / 10;

/** A smooth path through points (Catmull-Rom as cubic Béziers). */
function smooth(points)
{
   let d = `M${r1(points[0][0])} ${r1(points[0][1])}`;
   for (let i = 0; i < points.length - 1; i++)
   {
      const [p0, p1, p2, p3] = [points[i - 1] ?? points[i], points[i], points[i + 1], points[i + 2] ?? points[i + 1]];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += `C${r1(c1[0])} ${r1(c1[1])} ${r1(c2[0])} ${r1(c2[1])} ${r1(p2[0])} ${r1(p2[1])}`;
   }
   return d;
}

/**
 * Pattern-welded steel: lines 3.5px apart, each bent by two waves whose periods divide the tile, and pulled together
 * where a fold (a smooth periodic bump) passes, as the layers bunch in a ladder pattern.
 */
function damascus()
{
   const W = 320;
   const H = 28;
   const TAU = Math.PI * 2;
   const folds = [40, 150, 250];
   const bump = (x) => folds.reduce((sum, x0) => sum + ((1 + Math.cos(TAU * (x - x0) / W)) / 2) ** 10, 0);
   const lines = [];
   for (let k = -3; k * 3.5 < H + 10; k++)
   {
      const y0 = k * 3.5;
      const points = [];
      for (let x = 0; x <= W; x += 10)
      {
         const wave = 3.2 * Math.sin(TAU * x / W + k * 0.35) + 1.6 * Math.sin(TAU * 3 * x / W + k * 0.8);
         // Near a fold the layers swing up into a ladder rung.
         const rung = 6 * bump(x) * Math.sin(k * 0.9);
         points.push([x, y0 + wave + rung]);
      }
      const light = k % 2 === 0;
      lines.push(`<path d='${smooth(points)}' stroke='${light ? '#fff' : '#000'}' stroke-opacity='${light ? 0.16 : 0.18}' stroke-width='1.3'/>`);
   }
   return `<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}'><g fill='none'>${lines.join('')}</g></svg>`;
}

/**
 * Hammer dimples: 36 shallow ellipses, each filled with a soft gradient, light above and dark below, 5% at its ends
 * and clear through the middle; no outlines, which read as marks or letters (user's rule: art never competes with text).
 */
function grain()
{
   const S = 96;
   const random = seeded(7);
   const marks = [];
   for (let n = 0; n < 36; n++)
   {
      const x = random() * S;
      const y = random() * S;
      const rx = 4 + random() * 6;
      const ry = rx * (0.6 + random() * 0.3);
      const turn = Math.round(random() * 40 - 20);
      for (const dx of [-S, 0, S])
      {
         for (const dy of [-S, 0, S])
         {
            const cx = x + dx;
            const cy = y + dy;
            if (cx + rx < 0 || cx - rx > S || cy + rx < 0 || cy - rx > S) { continue; }
            marks.push(`<ellipse cx='${r1(cx)}' cy='${r1(cy)}' rx='${r1(rx)}' ry='${r1(ry)}' transform='rotate(${turn} ${r1(cx)} ${r1(cy)})'/>`);
         }
      }
   }
   const gradient = "<linearGradient id='g' x2='0' y2='1'><stop offset='0' stop-color='#fff' stop-opacity='0.05'/>"
      + "<stop offset='0.45' stop-color='#fff' stop-opacity='0'/><stop offset='0.55' stop-color='#000' stop-opacity='0'/>"
      + "<stop offset='1' stop-color='#000' stop-opacity='0.05'/></linearGradient>";
   return `<svg xmlns='http://www.w3.org/2000/svg' width='${S}' height='${S}'><defs>${gradient}</defs><g fill='url(#g)'>${marks.join('')}</g></svg>`;
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
for (const [name, svg] of [['damascus', damascus()], ['grain', grain()], ...runes])
{
   const line = new RegExp(`(--fhcs-theme-${name}: )url\\("data:image/svg\\+xml,[^"]*"\\);`);
   if (!line.test(css)) { throw new Error(`forge.css has no --fhcs-theme-${name} token to replace`); }
   css = css.replace(line, `$1${uri(svg)};`);
}
writeFileSync(CSS, css);
console.log('Wrote the Damascus, grain and rune marks into styles/themes/forge.css.');
