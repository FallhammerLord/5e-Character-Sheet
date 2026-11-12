/**
 * Sand and Sanctuary's textures and marks as vectors (SCOPE §5.3 rule 4; docs/research/sand-theme.md): writes them
 * between `sand-textures:begin` and `:end` in styles/themes/sand.css. Seeded, so a run gives the same file. Run after
 * changing a number here: `node tools/sand-textures.mjs`.
 *
 * - grains: oxide sand, mostly dark, one in nine catching the light, one in forty hard and white (a 240px tile);
 * - dune: two ridges along the window's foot, a silver line on each crest; the ground stretches it taller as HP falls;
 * - sphinx: the fallen head of the scholastic's guardian, tilted in the sand, its nose broken;
 * - cracks: hairline cracks in the ruin stone of heading bars (a 320 × 28 tile);
 * - crack, seam: a hit's branching glass crack, and the same line mended in silver for a heal (fulgurite branching);
 * - fox-bloodied, fox-down: the mirror rim's desilvering, spots and streaks gathered at the corners;
 * - fog-full, -bloodied, -down: the same desilvering over the whole portrait, haze, edges and spots;
 * - glass-mark, glass-mark-on: inspiration's hourglass, empty and holding sand.
 */

import { readFileSync, writeFileSync } from 'node:fs';

const CSS = new URL('../styles/themes/sand.css', import.meta.url);
const r1 = (n) => Math.round(n * 10) / 10;

/** A seeded generator (Park–Miller), so every run writes the same textures. */
function seeded(seed)
{
   let s = seed;
   return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

const uri = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg).replace(/'/g, '%27')}")`;

function grains()
{
   const rnd = seeded(7);
   const W = 240;
   const dots = [];
   for (let i = 0; i < 260; i++)
   {
      const x = r1(rnd() * W);
      const y = r1(rnd() * W);
      const k = rnd();
      const [fill, r] = k > 0.975 ? ['#f8fafd', 0.9] : k > 0.89 ? ['#ced2d9', r1(0.5 + rnd() * 0.4)] : k > 0.5 ? ['#7a6c5e', r1(0.4 + rnd() * 0.6)] : ['#4a3d33', r1(0.5 + rnd() * 0.7)];
      const alpha = k > 0.975 ? 0.85 : k > 0.89 ? 0.45 : 0.4;
      dots.push(`<circle cx='${x}' cy='${y}' r='${r}' fill='${fill}' fill-opacity='${alpha}'/>`);
   }
   return `<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${W}'>${dots.join('')}</svg>`;
}

function dune()
{
   // Drawn in a 1000 × 200 box and stretched to the window (preserveAspectRatio none): two ridges, the nearer darker.
   const far = 'M0 90 C140 40 300 60 420 80 S700 30 1000 70 V200 H0 Z';
   const near = 'M0 140 C180 100 380 150 560 120 S840 90 1000 130 V200 H0 Z';
   return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 200' preserveAspectRatio='none'>`
      + `<defs><linearGradient id='f' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#4a3727'/><stop offset='1' stop-color='#21180f'/></linearGradient>`
      + `<linearGradient id='n' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#33261b'/><stop offset='1' stop-color='#120d09'/></linearGradient></defs>`
      + `<path d='${far}' fill='url(#f)'/><path d='M0 90 C140 40 300 60 420 80 S700 30 1000 70' fill='none' stroke='#dfe3ea' stroke-opacity='.35' stroke-width='1.2' vector-effect='non-scaling-stroke'/>`
      + `<path d='${near}' fill='url(#n)'/><path d='M0 140 C180 100 380 150 560 120 S840 90 1000 130' fill='none' stroke='#dfe3ea' stroke-opacity='.25' stroke-width='1' vector-effect='non-scaling-stroke'/></svg>`;
}

function sphinx()
{
   // A guardian's head, front on, in a striped headdress, tipped over in the sand; lit from the upper left in silver.
   const stone = '#8f846f';
   return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 150'><g transform='rotate(-14 90 90)'>`
      + `<path d='M44 40 Q90 6 136 40 L156 132 H24 Z' fill='#2c241c' stroke='${stone}' stroke-opacity='.55' stroke-width='1.5'/>`
      + `<g fill='none' stroke='${stone}' stroke-opacity='.35' stroke-width='1.4'>`
      + `<path d='M38 64 Q48 60 58 64M34 82 Q46 78 58 82M30 100 Q44 96 58 100M27 118 Q42 114 58 118'/>`
      + `<path d='M142 64 Q132 60 122 64M146 82 Q134 78 122 82M150 100 Q136 96 122 100M153 118 Q138 114 122 118'/></g>`
      + `<path d='M62 46 Q90 32 118 46 L122 104 Q90 136 58 104 Z' fill='#3a3026' stroke='${stone}' stroke-opacity='.6' stroke-width='1.5'/>`
      + `<g fill='none' stroke='${stone}' stroke-opacity='.6' stroke-width='1.6' stroke-linecap='round'>`
      + `<path d='M70 66 Q78 62 86 66M94 66 Q102 62 110 66'/><path d='M72 74 Q78 72 84 74M96 74 Q102 72 108 74'/>`
      + `<path d='M90 70 V86 L86 90 M94 88 L90 86'/><path d='M81 101 Q90 99 99 101'/></g>`
      + `<path d='M62 46 Q90 32 118 46' fill='none' stroke='#eef1f5' stroke-opacity='.55' stroke-width='1.4'/>`
      + `<path d='M44 40 Q60 26 78 22' fill='none' stroke='#eef1f5' stroke-opacity='.5' stroke-width='1.4'/>`
      + `<path d='M104 40 L112 58 L106 70 L116 92' fill='none' stroke='#120d09' stroke-opacity='.8' stroke-width='1.2'/></g></svg>`;
}

function cracks()
{
   // Few and long, angular as stone breaks: a crack runs from the bar's top or foot most of the way across it.
   const rnd = seeded(23);
   const paths = [];
   for (const x0 of [40, 190])
   {
      let x = x0;
      let y = rnd() > 0.5 ? 0 : 28;
      let d = `M${x} ${y}`;
      const down = y === 0 ? 1 : -1;
      for (let i = 0; i < 5; i++)
      {
         x += r1(6 + rnd() * 14);
         y += down * r1(2 + rnd() * 3);
         d += ` L${r1(x)} ${r1(y)}`;
      }
      paths.push(`<path d='${d}'/>`);
   }
   return `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='28'><g fill='none' stroke='#2e241a' stroke-opacity='.28' stroke-width='.8' stroke-linejoin='miter'>${paths.join('')}</g></svg>`;
}

// From the bar's top and bottom edges only, the middle third left clear: a mark on HP's bar never crosses its numbers
// (SCOPE, Max ± on the bar, user 2026-11-08).
const CRACK = 'M2 0 L10 4 L14 9 M10 4 L20 3 L28 8 M20 3 L24 0 M8 32 L16 27 L18 23 M16 27 L28 29 L34 25 M28 29 L32 32';
const crack = (colour, width) => `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 32' preserveAspectRatio='none'><path d='${CRACK}' fill='none' stroke='${colour}' stroke-width='${width}' stroke-linecap='round' stroke-linejoin='round' vector-effect='non-scaling-stroke'/></svg>`;

function fox(count, grow)
{
   // Spots along the rim, gathered at the corners (bias toward each end of a side), streaks along the edge.
   const rnd = seeded(11);
   const spots = [];
   for (let i = 0; i < 60; i++)
   {
      const side = Math.floor(rnd() * 4);
      const bias = Math.pow(rnd(), 2.2);
      const along = rnd() < 0.5 ? bias * 50 : 100 - bias * 50;
      const [x, y] = [[along, 1], [99, along], [along, 99], [1, along]][side];
      const r = 1.5 + rnd() * 4;
      const streak = rnd() > 0.7;
      spots.push({ x, y, r, side, streak, order: bias + rnd() * 0.25 });
   }
   spots.sort((a, b) => a.order - b.order);
   return spots.slice(0, count).map((s) =>
   {
      const r = r1(s.r * grow);
      const long = s.streak ? r1(s.r * grow * 3) : r;
      const size = s.side % 2 ? `${r}px ${long}px` : `${long}px ${r}px`;
      return `radial-gradient(${size} at ${r1(s.x)}% ${r1(s.y)}%, rgba(8,7,6,.95) 0, rgba(8,7,6,.85) 60%, transparent 100%)`;
   }).join(', ');
}

/**
 * The mirror's fog over the whole portrait (user, 2026-11-12: "foxing should fog the whole portrait in the foreground";
 * "closer to true"). How real desilvering looks (docs/research/sand-theme.md, "Desilvering up close"): soft, cloudy
 * blooms with irregular edges and varied sizes, never a repeated pattern of round dots (that is acid-antiqued modern
 * glass); gathered at the edges where damp got behind the frame, the silver there flaking away in an uneven band; on
 * old mercury mirrors, the loss grainy and sparkling. So: an edge band with an uneven inner contour and fingers;
 * blooms as wobbly outlines in three layers (a pale cloudy halo, a grey body, a dark core); a few bright and dark
 * grains inside each bloom; a milky haze over the whole. A 160 × 234 drawing (the portrait card's frame) stretched to
 * the portrait. Over the art, under the stage, so the HP band keeps its own ground.
 */
function fog({ seed, blooms, size, reach, edge, haze })
{
   const W = 160;
   const H = 234;
   const rnd = seeded(seed);
   const shapes = [];
   // A wobbly closed outline around (cx, cy): the radius bends by a few low harmonics, each bloom its own.
   const outline = (cx, cy, R) =>
   {
      const waves = [2, 3, 4, 5, 7].map((h) => [h, (rnd() * 0.22) / Math.sqrt(h), rnd() * Math.PI * 2]);
      const pts = [];
      for (let i = 0; i < 22; i++)
      {
         const t = (i / 22) * Math.PI * 2;
         const r = R * (1 + waves.reduce((sum, [h, amp, ph]) => sum + amp * Math.sin(h * t + ph), 0));
         pts.push(`${r1(cx + Math.cos(t) * r)} ${r1(cy + Math.sin(t) * r)}`);
      }
      return `M${pts.join('L')}Z`;
   };
   // The edge band: depth along each side, uneven, with fingers reaching in; three bands, darker toward the edge.
   if (edge > 0)
   {
      const sides = [[W, (t, d) => [t, d]], [H, (t, d) => [W - d, t]], [W, (t, d) => [W - t, H - d]], [H, (t, d) => [d, H - t]]];
      // Fingers: where damp reached further in, wide and soft. Many thin bands, each faint, so the band darkens
      // gradually toward the frame instead of in steps.
      const fingers = Array.from({ length: 4 }, () => [rnd(), 0.04 + rnd() * 0.06, 0.4 + rnd() * 0.6]);
      const phases = Array.from({ length: 4 }, () => [rnd() * 6, rnd() * 6]);
      // Each side its own band, from the frame to its contour: the corners, where two sides overlap, go darkest, as on
      // real mirrors.
      const SCALES = [1, 0.88, 0.76, 0.65, 0.55, 0.45, 0.36, 0.28, 0.2, 0.12];
      for (const scale of SCALES)
      {
         for (const [side, [len, at]] of sides.entries())
         {
            const ph = phases[side];
            const contour = [];
            for (let i = 0; i <= 40; i++)
            {
               const u = i / 40;
               const finger = fingers.reduce((sum, [c, w, k]) => sum + k * Math.exp(-(((u - c) / w) ** 2)), 0);
               const depth = edge * scale * (0.6 + 0.25 * Math.sin(u * 5 + ph[0]) + 0.12 * Math.sin(u * 11 + ph[1]) + finger);
               contour.push(at(u * len, Math.max(0, depth)));
            }
            const [x0, y0] = at(0, 0);
            const [x1, y1] = at(len, 0);
            const back = contour.reverse().map(([x, y]) => `L${r1(x)} ${r1(y)}`).join('');
            shapes.push(`<path d='M${r1(x0)} ${r1(y0)}L${r1(x1)} ${r1(y1)}${back}Z' fill='%23100e0c' fill-opacity='.09'/>`);
         }
      }
   }
   // Blooms: most near the edges, reaching inward as `reach` grows; sizes spread wide, a few large ones.
   for (let i = 0; i < blooms; i++)
   {
      const side = Math.floor(rnd() * 4);
      const inward = Math.pow(rnd(), 1.4) * reach;
      const along = rnd();
      const [x, y] = [[along * W, inward * H / 2], [W - inward * W / 2, along * H], [along * W, H - inward * H / 2], [inward * W / 2, along * H]][side];
      const R = size * (0.25 + Math.pow(rnd(), 2.2) * 1.6);
      // A cloudy halo, then the bloom itself: irregular outlines filled with radial gradients, dense at the heart and
      // fading to nothing at the edge, so a bloom is soft rather than a cut-out.
      shapes.push(`<path d='${outline(x, y, R * 2.1)}' fill='url(%23h)'/>`);
      shapes.push(`<path d='${outline(x, y, R * 1.3)}' fill='url(%23c)'/>`);
      // The grainy loss: a few grains in the bloom, some catching light.
      for (let g = 0; g < Math.round(2 + R / 3); g++)
      {
         const a = rnd() * Math.PI * 2;
         const rr = R * 1.5 * Math.sqrt(rnd());
         const bright = rnd() > 0.6;
         shapes.push(`<circle cx='${r1(x + Math.cos(a) * rr)}' cy='${r1(y + Math.sin(a) * rr)}' r='${bright ? 0.5 : 0.7}' fill='${bright ? '%23f2f4f7' : '%23100e0c'}' fill-opacity='${bright ? 0.7 : 0.6}'/>`);
      }
   }
   const defs = `<defs><radialGradient id='c'><stop offset='0' stop-color='%23100e0c' stop-opacity='.88'/><stop offset='.45' stop-color='%231c1916' stop-opacity='.7'/>`
      + `<stop offset='.8' stop-color='%23302a25' stop-opacity='.3'/><stop offset='1' stop-color='%23302a25' stop-opacity='0'/></radialGradient>`
      + `<radialGradient id='h'><stop offset='0' stop-color='%23d6d5cf' stop-opacity='.24'/><stop offset='1' stop-color='%23d6d5cf' stop-opacity='0'/></radialGradient></defs>`;
   const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${W} ${H}' preserveAspectRatio='none'>${defs}`
      + (haze ? `<rect width='${W}' height='${H}' fill='%23c4c6c8' fill-opacity='${haze}'/>` : '')
      + `${shapes.join('')}</svg>`;
   return `url("data:image/svg+xml,${svg.replace(/</g, '%3C').replace(/>/g, '%3E').replace(/"/g, '%22')}") 0 0 / 100% 100% no-repeat`;
}

const GLASS ='M7 2.5h10M7 21.5h10M8 2.5c0 5 7.5 6 7.5 9.5S8 16.5 8 21.5M16 2.5c0 5-7.5 6-7.5 9.5s7.5 4.5 7.5 9.5';
const SAND = 'M8.6 20.8c.8-2.9 3.4-3.9 3.4-6 0 2.1 2.6 3.1 3.4 6zM10.4 6.2h3.2c-.4.9-1 1.5-1.6 1.9-.6-.4-1.2-1-1.6-1.9z';
const mark = (filled) => `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='${GLASS}' fill='none' stroke='%23000' stroke-width='1.8' stroke-linecap='round'/>${filled ? `<path d='${SAND}' fill='%23000'/>` : ''}</svg>`.replace(/%23/g, '#');

const block = [
   `--fhcs-theme-grains: ${uri(grains())};`,
   `--fhcs-theme-dune: ${uri(dune())};`,
   `--fhcs-theme-sphinx: ${uri(sphinx())};`,
   `--fhcs-theme-cracks: ${uri(cracks())};`,
   `--fhcs-theme-crack: ${uri(crack('#f4f7fb', 1.3))};`,
   `--fhcs-theme-seam: ${uri(crack('#dfe3ea', 2.2))};`,
   `--fhcs-theme-fox-bloodied: ${fox(26, 2)};`,
   `--fhcs-theme-fox-down: ${fox(60, 3.4)};`,
   `--fhcs-theme-fog-full: ${fog({ seed: 31, blooms: 3, size: 3, reach: 0.15, edge: 2, haze: 0 })};`,
   `--fhcs-theme-fog-bloodied: ${fog({ seed: 31, blooms: 16, size: 6, reach: 0.55, edge: 9, haze: 0.07 })};`,
   `--fhcs-theme-fog-down: ${fog({ seed: 31, blooms: 34, size: 9, reach: 1, edge: 22, haze: 0.22 })};`,
   `--fhcs-theme-glass-mark: ${uri(mark(false))};`,
   `--fhcs-theme-glass-mark-on: ${uri(mark(true))};`
].map((line) => `   ${line}`).join('\n');

const css = readFileSync(CSS, 'utf8');
const next = css.replace(/(\/\* sand-textures:begin[^\n]*\n)[\s\S]*?(\s*\/\* sand-textures:end \*\/)/, `$1${block}$2`);
if (next === css && !css.includes(block)) { throw new Error('sand-textures: markers not found in sand.css'); }
writeFileSync(CSS, next);
console.log('Wrote Sand and Sanctuary\'s textures into styles/themes/sand.css');
