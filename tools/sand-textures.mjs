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
 * The mirror's fog over the whole portrait (user, 2026-11-12: "foxing should fog the whole portrait in the foreground"):
 * a milky haze, darkening that creeps in from the edges, and dark spots that spread inward and grow as HP falls. Drawn
 * over the art, under the stage, so the HP band keeps its own ground.
 */
function fog(spots, reach, haze, edge)
{
   const rnd = seeded(31);
   const layers = [];
   for (let i = 0; i < spots; i++)
   {
      // Most spots near an edge, more of them inward as `reach` grows (0–1).
      const side = Math.floor(rnd() * 4);
      const depth = Math.pow(rnd(), 1.6) * reach * 50;
      const along = rnd() * 100;
      const [x, y] = [[along, depth], [100 - depth, along], [along, 100 - depth], [depth, along]][side];
      const r = r1(2 + rnd() * 7 * (0.6 + reach));
      const alpha = r1(0.45 + rnd() * 0.4);
      layers.push(`radial-gradient(${r}px ${r1(r * (0.7 + rnd() * 0.6))}px at ${r1(x)}% ${r1(y)}%, rgba(12,11,10,${alpha}) 0, rgba(12,11,10,${r1(alpha * 0.5)}) 55%, transparent 100%)`);
   }
   layers.push(`radial-gradient(ellipse 75% 70% at 50% 45%, transparent ${Math.round(70 - reach * 55)}%, rgba(14,12,11,${edge}) 100%)`);
   layers.push(`linear-gradient(rgba(196,198,200,${haze}), rgba(196,198,200,${haze}))`);
   return layers.join(', ');
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
   `--fhcs-theme-fog-full: ${fog(4, 0.15, 0.03, 0.15)};`,
   `--fhcs-theme-fog-bloodied: ${fog(28, 0.55, 0.12, 0.5)};`,
   `--fhcs-theme-fog-down: ${fog(70, 1, 0.3, 0.85)};`,
   `--fhcs-theme-glass-mark: ${uri(mark(false))};`,
   `--fhcs-theme-glass-mark-on: ${uri(mark(true))};`
].map((line) => `   ${line}`).join('\n');

const css = readFileSync(CSS, 'utf8');
const next = css.replace(/(\/\* sand-textures:begin[^\n]*\n)[\s\S]*?(\s*\/\* sand-textures:end \*\/)/, `$1${block}$2`);
if (next === css && !css.includes(block)) { throw new Error('sand-textures: markers not found in sand.css'); }
writeFileSync(CSS, next);
console.log('Wrote Sand and Sanctuary\'s textures into styles/themes/sand.css');
