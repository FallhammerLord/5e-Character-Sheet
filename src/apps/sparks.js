/**
 * Fire and Forge's sparks (SCOPE §4.11, user 2026-10-28: "a nice 'forge sparks' animation spray ... rendered fresh
 * each time"). A burst sprays from the mark that was struck (user, 2026-10-28: the rule for a theme's effects is to
 * start where the event shows; before, the window's bottom-left corner), fanning up and out, each spark with its own
 * speed, angle, size and life, falling under gravity and cooling from white-gold to red as it goes; drawn on a canvas
 * over the content that never takes a click.
 *
 * When (user, 2026-10-28, replacing a burst every 70 to 120 seconds): only when inspiration is gained, and that is the
 * rule for a theme's big effects (SCOPE §5.3 rule 6): they answer an event, never a timer. No burst while the
 * player's Motion setting or the system's reduced motion says keep still, or at 0 HP; fewer and dimmer sparks as HP
 * falls (the hearth's heat).
 *
 * Plain DOM and canvas, no Foundry: the theme viewer (tools/theme-mockup.mjs) runs the same code.
 */

/** How long a burst emits, and the longest a spark lives. */
const EMIT_S = 0.35;
const LIFE_S = [1.0, 2.2];

/** A theme's answer to inspiration gained: Forge sprays sparks from the mark that was struck. */
export function inspirationGained(element, mark)
{
   if (element.dataset.fhcsTheme === 'forge') { sparkBurst(element, mark); }
}

/** Whether the sheet may move now. */
function mayMove(element)
{
   if (element.dataset.fhcsMotion === 'off' || element.dataset.fhcsHp === 'down') { return false; }
   return !globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
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
   const content = element.querySelector('.window-content') ?? element;
   let canvas = content.querySelector(':scope > canvas.fhcs-sparks');
   if (!canvas)
   {
      canvas = document.createElement('canvas');
      canvas.className = 'fhcs-sparks';
      canvas.setAttribute('aria-hidden', 'true');
      // Placed by itself, not by a theme's styles: left behind when the theme changed, it stood in the window's
      // column and pushed the tabs out of sight (user, 2026-10-29).
      Object.assign(canvas.style, { position: 'absolute', inset: '0', zIndex: '3', width: '100%', height: '100%', pointerEvents: 'none' });
      content.append(canvas);
   }
   const scale = globalThis.devicePixelRatio || 1;
   const width = content.clientWidth;
   const height = content.clientHeight;
   canvas.width = Math.round(width * scale);
   canvas.height = Math.round(height * scale);
   const ctx = canvas.getContext('2d');
   if (!ctx) { if (!canvas.fhcsBursts) { canvas.remove(); } return; }
   canvas.fhcsBursts = (canvas.fhcsBursts ?? 0) + 1;
   ctx.setTransform(scale, 0, 0, scale, 0, 0);

   // The hearth's heat sets how many sparks and how bright: a full forge throws a spray, a cooling one a few.
   const heat = Math.min(1, Math.max(0, Number(getComputedStyle(element).getPropertyValue('--fhcs-hp')) || 1));
   const count = Math.round(14 + 30 * heat);
   const random = (lo, hi) => lo + Math.random() * (hi - lo);
   const box = content.getBoundingClientRect();
   const at = mark?.getBoundingClientRect();
   const origin = at ? { x: at.left + at.width / 2 - box.left, y: at.top + at.height / 2 - box.top } : null;
   const sparks = Array.from({ length: count }, () =>
   {
      // From a mark: a fan from up-left to up-right, slower, as it starts high on the sheet; else the corner's spray.
      const angle = (origin ? random(20, 160) : random(25, 78)) * Math.PI / 180;
      const speed = origin ? random(120, 300) : random(220, 520);
      return {
         x: origin ? origin.x + random(-4, 4) : random(6, 34), y: origin ? origin.y + random(-4, 4) : height - random(10, 18),
         vx: Math.cos(angle) * speed, vy: -Math.sin(angle) * speed,
         size: random(0.8, 2.2), born: random(0, EMIT_S), life: random(...LIFE_S),
         wobble: random(-40, 40)
      };
   });

   const GRAVITY = 300;
   const DRAG = 1.1;
   const start = performance.now();
   let last = start;
   const frame = (now) =>
   {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const age = (now - start) / 1000;
      ctx.clearRect(0, 0, width, height);
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
      if (alive && element.isConnected) { requestAnimationFrame(frame); }
      // The last burst is over: the canvas goes with it, so nothing of a theme stays in the window.
      else if (--canvas.fhcsBursts <= 0) { canvas.remove(); }
   };
   requestAnimationFrame(frame);
}
