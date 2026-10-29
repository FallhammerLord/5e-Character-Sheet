/**
 * A theme's particles, drawn on a canvas over the content that never takes a click (SCOPE §5.3 rule 6; user,
 * 2026-10-29: "keep any particle effects as high quality scripts instead of static css"). Each answers an event, never
 * a timer, and starts where the event shows: today, inspiration gained, from the mark that was struck.
 *
 * - Fire and Forge (SCOPE §4.11, user 2026-10-28: "a nice 'forge sparks' animation spray ... rendered fresh each
 *   time"): a burst fans up and out from the mark, each spark with its own speed, angle, size and life, falling under
 *   gravity and cooling from white-gold to red; fewer and dimmer as HP falls (the hearth's heat).
 * - Day (Plain in light mode, Phase 6.55): sun motes, dust in a sunbeam, drifting up from the mark and swaying as they
 *   rise, catching the light as they turn.
 * - Night (Plain in dark mode): a moonbeam, moonlight only (user, 2026-10-29: "not stars or falling sparks"), slanting
 *   down from the upper right onto the mark, brightening, then fading, with a pool of light where it lands; it burns
 *   the mark into a full moon (styles/themes/plain.css). Spent, a cloud drifts across the mark and wipes it away.
 *
 * Nothing moves while the player's Motion setting or the system's reduced motion says keep still, or at 0 HP. The
 * canvas places itself and leaves when its last effect ends (user, 2026-10-29: left behind after a theme change, it
 * pushed the tabs out of sight).
 *
 * Plain DOM and canvas, no Foundry, no imports: the theme viewer (tools/theme-mockup.mjs) inlines this file.
 */

/** How long a burst emits, and the longest a spark lives. */
const EMIT_S = 0.35;
const LIFE_S = [1.0, 2.2];

/** How long sun motes rise, how long the moonbeam shines, and how long a cloud takes to cross a mark. */
const MOTE_LIFE_S = [1.3, 2.3];
const BEAM_S = 1.1;
const CLOUD_S = 0.6;

/** A theme's answer to inspiration gained, from the mark that was struck. */
export function inspirationGained(element, mark)
{
   const theme = element.dataset.fhcsTheme;
   if (theme === 'forge') { sparkBurst(element, mark); }
   else if (!theme) { if (darkMode(element)) { moonbeam(element, mark); } else { sunMotes(element, mark); } }
}

/** A theme's answer to inspiration spent, at the mark spent: Night's cloud wipes the full moon away. */
export function inspirationSpent(element, mark)
{
   if (!element.dataset.fhcsTheme && darkMode(element)) { cloudWipe(element, mark); }
}

/** Whether the sheet may move now. */
function mayMove(element)
{
   if (element.dataset.fhcsMotion === 'off' || element.dataset.fhcsHp === 'down') { return false; }
   return !globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** Whether the window draws in dark mode: its own mode, else the nearest one round it (Foundry's interface's). */
function darkMode(element)
{
   return !!element.closest('.theme-dark, .theme-light')?.classList.contains('theme-dark');
}

/** The character's HP as 0–1, for effects that dim as it falls. */
function hpOf(element)
{
   const hp = Number.parseFloat(getComputedStyle(element).getPropertyValue('--fhcs-hp'));
   return Number.isFinite(hp) ? Math.min(1, Math.max(0, hp)) : 1;
}

const random = (lo, hi) => lo + Math.random() * (hi - lo);

/**
 * The window's particle canvas over the content, at the screen's resolution, with its 2D context; null when there is
 * none. Shared by effects that overlap; `done()` removes it once the last has ended.
 */
function particleCanvas(element)
{
   const content = element.querySelector('.window-content') ?? element;
   let canvas = content.querySelector(':scope > canvas.fhcs-sparks');
   if (!canvas)
   {
      canvas = document.createElement('canvas');
      canvas.className = 'fhcs-sparks';
      canvas.setAttribute('aria-hidden', 'true');
      // Placed by itself, not by a theme's styles.
      Object.assign(canvas.style, { position: 'absolute', zIndex: '3', pointerEvents: 'none' });
      content.append(canvas);
   }
   // Over the content's box, wherever its nearest positioned ancestor is (Forge's content is one; Plain's isn't).
   const scale = globalThis.devicePixelRatio || 1;
   const box = content.getBoundingClientRect();
   const parent = canvas.offsetParent?.getBoundingClientRect() ?? box;
   Object.assign(canvas.style, { left: `${box.left - parent.left}px`, top: `${box.top - parent.top}px`, width: `${box.width}px`, height: `${box.height}px` });
   if (canvas.width !== Math.round(box.width * scale)) { canvas.width = Math.round(box.width * scale); }
   if (canvas.height !== Math.round(box.height * scale)) { canvas.height = Math.round(box.height * scale); }
   const ctx = canvas.getContext('2d');
   if (!ctx) { if (!canvas.fhcsBursts) { canvas.remove(); } return null; }
   ctx.setTransform(scale, 0, 0, scale, 0, 0);
   canvas.fhcsBursts = (canvas.fhcsBursts ?? 0) + 1;
   return {
      canvas, ctx, box, width: box.width, height: box.height,
      done: () => { if (--canvas.fhcsBursts <= 0) { canvas.remove(); } }
   };
}

/** Where a mark's centre sits on the canvas, or null. */
function originOf(mark, box)
{
   const at = mark?.getBoundingClientRect();
   return at ? { x: at.left + at.width / 2 - box.left, y: at.top + at.height / 2 - box.top } : null;
}

/**
 * Runs an effect's frames until it reports nothing left alive, then lets the canvas go. Effects sharing the canvas
 * draw over one another: whichever draws first in a frame clears it.
 */
function run(surface, element, draw)
{
   const start = performance.now();
   let last = start;
   const frame = (now) =>
   {
      const dt = Math.min(0.05, Math.max(0, now - last) / 1000);
      last = now;
      const { canvas, ctx, width, height } = surface;
      if (canvas.fhcsCleared !== now) { ctx.clearRect(0, 0, width, height); canvas.fhcsCleared = now; }
      // The first frame's time can fall a hair before `start`; an effect's age never goes below 0.
      const alive = draw(ctx, Math.max(0, now - start) / 1000, dt);
      if (alive && element.isConnected) { requestAnimationFrame(frame); }
      else { surface.done(); }
   };
   requestAnimationFrame(frame);
}

/** A spark's colour by how far through its life it is: white-gold, gold, orange, then a dull red as it dies. */
function sparkColour(t, alpha)
{
   const stops = [[255, 246, 214], [255, 196, 92], [255, 122, 42], [168, 40, 16]];
   const at = Math.min(t, 0.999) * (stops.length - 1);
   const i = Math.floor(at);
   const f = at - i;
   const [r, g, b] = stops[i].map((c, k) => Math.round(c + (stops[i + 1][k] - c) * f));
   return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Sprays one burst of sparks, fresh each time: from a mark's centre, fanning up and out to both sides, or without one
 * from the bottom-left corner, up and to the right.
 * @param {HTMLElement} element  The sheet's window element.
 * @param {HTMLElement} [mark]   Where the event shows (the inspiration mark struck).
 */
export function sparkBurst(element, mark = null)
{
   if (!mayMove(element)) { return; }
   const surface = particleCanvas(element);
   if (!surface) { return; }
   // The hearth's heat sets how many sparks and how bright: a full forge throws a spray, a cooling one a few.
   const heat = hpOf(element);
   const count = Math.round(14 + 30 * heat);
   const origin = originOf(mark, surface.box);
   const sparks = Array.from({ length: count }, () =>
   {
      // From a mark: a fan from up-left to up-right, slower, as it starts high on the sheet; else the corner's spray.
      const angle = (origin ? random(20, 160) : random(25, 78)) * Math.PI / 180;
      const speed = origin ? random(120, 300) : random(220, 520);
      return {
         x: origin ? origin.x + random(-4, 4) : random(6, 34), y: origin ? origin.y + random(-4, 4) : surface.height - random(10, 18),
         vx: Math.cos(angle) * speed, vy: -Math.sin(angle) * speed,
         size: random(0.8, 2.2), born: random(0, EMIT_S), life: random(...LIFE_S),
         wobble: random(-40, 40)
      };
   });
   const GRAVITY = 300;
   const DRAG = 1.1;
   run(surface, element, (ctx, age, dt) =>
   {
      ctx.globalCompositeOperation = 'lighter';
      let alive = 0;
      for (const s of sparks)
      {
         const t = (age - s.born) / s.life;
         if (t < 0) { alive++; continue; }
         if (t >= 1) { continue; }
         alive++;
         const px = s.x;
         const py = s.y;
         s.vx += (s.wobble - s.vx * DRAG) * dt;
         s.vy += (GRAVITY - s.vy * DRAG) * dt;
         s.x += s.vx * dt;
         s.y += s.vy * dt;
         const alpha = (1 - t) * (0.55 + 0.45 * heat);
         // A short streak along its path, and a soft glow round its head.
         ctx.strokeStyle = sparkColour(t, alpha);
         ctx.lineWidth = s.size;
         ctx.lineCap = 'round';
         ctx.beginPath();
         ctx.moveTo(px - (s.x - px) * 1.5, py - (s.y - py) * 1.5);
         ctx.lineTo(s.x, s.y);
         ctx.stroke();
         ctx.fillStyle = sparkColour(t, alpha * 0.25);
         ctx.beginPath();
         ctx.arc(s.x, s.y, s.size * 2.5, 0, Math.PI * 2);
         ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      return alive;
   });
}

/**
 * Day's sun motes: dust caught in a sunbeam, lifting off the mark struck. Each rises at its own pace, quick off the
 * mark and then hanging in the air, sways as it goes and turns, catching the light about once a second (never more
 * than three flashes a second, rule 6); it fades in and out over its life. Fewer and fainter as HP falls (the light
 * lowering toward dusk).
 * @param {HTMLElement} element  The sheet's window element.
 * @param {HTMLElement} [mark]   Where the event shows.
 */
export function sunMotes(element, mark = null)
{
   if (!mayMove(element)) { return; }
   const surface = particleCanvas(element);
   if (!surface) { return; }
   const light = 0.45 + 0.55 * hpOf(element);
   const origin = originOf(mark, surface.box) ?? { x: surface.width / 2, y: 24 };
   const motes = Array.from({ length: Math.round(10 + 14 * light) }, () => ({
      x: origin.x + random(-8, 8), y: origin.y + random(-4, 6),
      rise: random(22, 48), drift: random(-26, 26), sway: random(4, 10), swayRate: random(1.2, 2.4), phase: random(0, Math.PI * 2),
      size: random(1, 2.4), born: random(0, 0.4), life: random(...MOTE_LIFE_S), turn: random(0.6, 1.2)
   }));
   run(surface, element, (ctx, age) =>
   {
      let alive = 0;
      for (const m of motes)
      {
         const t = (age - m.born) / m.life;
         if (t < 0) { alive++; continue; }
         if (t >= 1) { continue; }
         alive++;
         const s = age - m.born;
         const lift = m.rise * m.life * (1 - (1 - t) ** 2);
         const x = m.x + m.drift * t + Math.sin(m.phase + s * m.swayRate) * m.sway;
         const y = m.y - lift;
         const envelope = Math.min(1, t * 6) * (1 - t) ** 1.3;
         const glint = 0.65 + 0.35 * Math.sin(m.phase + s * Math.PI * 2 * m.turn);
         const alpha = envelope * glint * light;
         const glow = ctx.createRadialGradient(x, y, 0, x, y, m.size * 4);
         glow.addColorStop(0, `rgba(255, 200, 90, ${0.6 * alpha})`);
         glow.addColorStop(1, 'rgba(255, 214, 120, 0)');
         ctx.fillStyle = glow;
         ctx.beginPath();
         ctx.arc(x, y, m.size * 4, 0, Math.PI * 2);
         ctx.fill();
         ctx.fillStyle = `rgba(200, 132, 24, ${alpha})`;
         ctx.beginPath();
         ctx.arc(x, y, m.size, 0, Math.PI * 2);
         ctx.fill();
      }
      return alive;
   });
}

/**
 * Night's moonbeam: a shaft of moonlight slanting down from the upper right onto the mark struck, soft at its edges
 * and brightest where it lands, with a pool of light round the mark. It brightens quickly, holds, then fades (about
 * a second, once). Fainter as HP falls (the moon waning).
 * @param {HTMLElement} element  The sheet's window element.
 * @param {HTMLElement} [mark]   Where the event shows.
 */
export function moonbeam(element, mark = null)
{
   if (!mayMove(element)) { return; }
   const surface = particleCanvas(element);
   if (!surface) { return; }
   const light = 0.4 + 0.6 * hpOf(element);
   const to = originOf(mark, surface.box) ?? { x: surface.width - 48, y: 24 };
   // From above the window's top edge, 28° off the vertical, toward the upper right.
   const ANGLE = 28 * Math.PI / 180;
   const reach = to.y + 40;
   const from = { x: to.x + reach * Math.tan(ANGLE), y: to.y - reach };
   // Across the shaft, for its edges: narrow far off, wider where it lands.
   const across = { x: Math.cos(ANGLE), y: Math.sin(ANGLE) };
   const FAR = 8;
   const NEAR = 14;
   run(surface, element, (ctx, age) =>
   {
      const t = age / BEAM_S;
      if (t >= 1) { return 0; }
      // Up fast, a short hold, a slow fade.
      const envelope = t < 0.25 ? t / 0.25 : t < 0.45 ? 1 : 1 - (t - 0.45) / 0.55;
      const alpha = envelope * light;
      ctx.save();
      ctx.filter = 'blur(3px)';
      const shaft = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
      shaft.addColorStop(0, 'rgba(215, 228, 255, 0)');
      shaft.addColorStop(0.5, `rgba(215, 228, 255, ${0.2 * alpha})`);
      shaft.addColorStop(1, `rgba(228, 236, 255, ${0.4 * alpha})`);
      ctx.fillStyle = shaft;
      ctx.beginPath();
      ctx.moveTo(from.x - across.x * FAR, from.y - across.y * FAR);
      ctx.lineTo(from.x + across.x * FAR, from.y + across.y * FAR);
      ctx.lineTo(to.x + across.x * NEAR, to.y + across.y * NEAR);
      ctx.lineTo(to.x - across.x * NEAR, to.y - across.y * NEAR);
      ctx.closePath();
      ctx.fill();
      const pool = ctx.createRadialGradient(to.x, to.y, 0, to.x, to.y, 16);
      pool.addColorStop(0, `rgba(228, 236, 255, ${0.3 * alpha})`);
      pool.addColorStop(1, 'rgba(228, 236, 255, 0)');
      ctx.fillStyle = pool;
      ctx.beginPath();
      ctx.arc(to.x, to.y, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return 1;
   });
}

/**
 * Night's cloud: a soft bank of cloud drifting left to right across the mark spent, thick enough at its middle to hide
 * it, so the full moon can give way to its phase unseen (at half its crossing, as the styles' wipe does). A few
 * overlapping puffs, each its own soft disc, moving as one with a little lift.
 * @param {HTMLElement} element  The sheet's window element.
 * @param {HTMLElement} [mark]   The mark spent.
 */
export function cloudWipe(element, mark = null)
{
   if (!mayMove(element)) { return; }
   const surface = particleCanvas(element);
   if (!surface) { return; }
   const at = originOf(mark, surface.box);
   if (!at) { surface.done(); return; }
   const puffs = [[-9, 2, 8], [-2, -2, 10], [7, 1, 9], [13, 3, 6], [-14, 4, 5]].map(([dx, dy, r]) => ({ dx, dy, r: r * random(0.9, 1.1) }));
   const TRAVEL = 44;
   run(surface, element, (ctx, age) =>
   {
      const t = age / CLOUD_S;
      if (t >= 1) { return 0; }
      // Across at an even pace, thickest in the middle of its crossing.
      const x = at.x - TRAVEL / 2 + TRAVEL * t;
      const y = at.y - 2 * Math.sin(t * Math.PI);
      const alpha = Math.sin(t * Math.PI) ** 0.6;
      for (const puff of puffs)
      {
         const cx = x + puff.dx;
         const cy = y + puff.dy;
         const body = ctx.createRadialGradient(cx, cy, 0, cx, cy, puff.r * 1.6);
         body.addColorStop(0, `rgba(118, 126, 150, ${0.95 * alpha})`);
         body.addColorStop(0.6, `rgba(104, 112, 136, ${0.7 * alpha})`);
         body.addColorStop(1, 'rgba(96, 104, 128, 0)');
         ctx.fillStyle = body;
         ctx.beginPath();
         ctx.arc(cx, cy, puff.r * 1.6, 0, Math.PI * 2);
         ctx.fill();
      }
      return 1;
   });
}
