import { FRAME_DEFAULT, FRAME_ZOOM, frameStyle } from '../sheet/header.js';

/** How far one arrow press pans, in percent of the art; Shift pans finer. */
const PAN_STEP = 5;
const PAN_FINE = 1;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const tidy = (frame) => ({
   x: Math.round(clamp(frame.x, 0, 100)),
   y: Math.round(clamp(frame.y, 0, 100)),
   zoom: Math.round(clamp(frame.zoom, FRAME_ZOOM.min, FRAME_ZOOM.max) * 10) / 10
});

/**
 * Framing the portrait, in edit mode (user, 2026-10-27: a large portrait's subject isn't always at the top). The
 * other chips step aside; the player drags the art to pan, zooms on the strip, or uses the keys (arrows pan, + and −
 * zoom, Enter is Done, Escape cancels). Done saves; the redraw that follows ends the framing. Nothing is saved
 * while it moves, so a cancel leaves the character as it was.
 *
 * @param {HTMLElement} element  The sheet's element.
 * @param {(frame: {x: number, y: number, zoom: number}, src: string) => Promise} save
 */
export function startFraming(element, save)
{
   const portrait = element.querySelector('.fhcs-header .fhcs-portrait');
   const clip = portrait?.querySelector('.fhcs-portrait-clip');
   if (!clip || portrait.classList.contains('fhcs-framing')) { return; }
   const range = portrait.querySelector('[data-fhcs-zoom-range]');
   const start = tidy({ x: Number(portrait.dataset.fx), y: Number(portrait.dataset.fy), zoom: Number(portrait.dataset.zoom) });
   let frame = { ...start };
   const show = () =>
   {
      clip.setAttribute('style', frameStyle(frame));
      if (range) { range.value = String(Math.round(frame.zoom * 100)); }
   };
   const move = (change) => { frame = tidy({ ...frame, ...change }); show(); };

   const stop = new AbortController();
   const on = (target, type, handler) => target?.addEventListener(type, handler, { signal: stop.signal });
   const end = (keep) =>
   {
      stop.abort();
      portrait.classList.remove('fhcs-framing');
      clip.removeAttribute('tabindex');
      if (keep) { return save(frame, portrait.dataset.src); }
      frame = start;
      show();
      return null;
   };

   portrait.classList.add('fhcs-framing');
   clip.tabIndex = 0;
   clip.focus();
   show();

   // While framing, a click on the art doesn't open the file picker, and the tools act here, not as sheet actions.
   on(portrait, 'click', (event) =>
   {
      const tool = event.target.closest('[data-fhcs-zoom], [data-fhcs-frame-reset], [data-fhcs-frame-done]');
      if (!tool && !clip.contains(event.target)) { return; }
      event.stopPropagation();
      event.preventDefault();
      if (tool?.dataset.fhcsZoom) { move({ zoom: frame.zoom + Number(tool.dataset.fhcsZoom) * FRAME_ZOOM.step * 2 }); }
      else if (tool?.hasAttribute('data-fhcs-frame-reset')) { move(FRAME_DEFAULT); }
      else if (tool?.hasAttribute('data-fhcs-frame-done')) { end(true); }
   });
   on(range, 'input', () => { move({ zoom: Number(range.value) / 100 }); });
   on(range, 'change', (event) => { event.stopPropagation(); });

   // Drag: the art follows the pointer (moving it right shows more of its left).
   let drag = null;
   on(clip, 'pointerdown', (event) =>
   {
      if (event.button !== 0) { return; }
      drag = { px: event.clientX, py: event.clientY, x: frame.x, y: frame.y };
      clip.setPointerCapture(event.pointerId);
      event.preventDefault();
   });
   on(clip, 'pointermove', (event) =>
   {
      if (!drag) { return; }
      const w = clip.clientWidth || 1, h = clip.clientHeight || 1;
      move({ x: drag.x - ((event.clientX - drag.px) / w) * 100 / frame.zoom, y: drag.y - ((event.clientY - drag.py) / h) * 100 / frame.zoom });
   });
   on(clip, 'pointerup', () => { drag = null; });
   on(clip, 'pointercancel', () => { drag = null; });

   on(clip, 'keydown', (event) =>
   {
      const step = event.shiftKey ? PAN_FINE : PAN_STEP;
      const keys = {
         ArrowLeft: () => move({ x: frame.x - step }), ArrowRight: () => move({ x: frame.x + step }),
         ArrowUp: () => move({ y: frame.y - step }), ArrowDown: () => move({ y: frame.y + step }),
         '+': () => move({ zoom: frame.zoom + FRAME_ZOOM.step }), '=': () => move({ zoom: frame.zoom + FRAME_ZOOM.step }),
         '-': () => move({ zoom: frame.zoom - FRAME_ZOOM.step }),
         Enter: () => end(true), Escape: () => end(false)
      };
      if (!keys[event.key]) { return; }
      // Foundry would take Escape to close the window, and the arrows to scroll.
      event.preventDefault();
      event.stopPropagation();
      keys[event.key]();
   });
}
