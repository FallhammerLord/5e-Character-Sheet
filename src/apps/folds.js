/**
 * Folds and trays open and close smoothly (play round 2026-11-08, ask 3): a fold's box grows from nothing to its height
 * and shrinks back as its rows fade; a tray fades and drops in, and rises and fades out. Both ways, every theme, under
 * 300ms (SCOPE §5.3 rule 6). Still under Motion off and reduced motion: the change then lands at once.
 */

/** How long a fold or a tray takes, open or closed; the toggles' curve (styles: --fhcs-toggle-ease). */
export const FOLD_MS = 220;
export const TRAY_MS = 160;
const EASE = 'cubic-bezier(0.3, 0, 0.2, 1)';

/** Whether this sheet keeps still: the "Sheet motion" setting off, or the system's reduced motion. */
export function keepsStill(element)
{
   return element?.closest?.('.fhcs-sheet')?.dataset.fhcsMotion === 'off'
      || !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** Each box's running animation and the change it ends with. */
const running = new WeakMap();

/** Ends a box's running fold or tray animation at once, its pending change landing, so the next begins clean. */
function settle(box)
{
   const run = running.get(box);
   if (!run) { return; }
   running.delete(box);
   run.animation.cancel();
   run.done();
}

/** Plays keyframes on a box, then `done()`; a later animation on the same box settles this one first. */
function play(box, keyframes, duration, done)
{
   settle(box);
   const animation = box.animate(keyframes, { duration, easing: EASE, fill: 'forwards' });
   const run = { animation, done };
   running.set(box, run);
   animation.onfinish = () =>
   {
      if (running.get(box) !== run) { return; }
      running.delete(box);
      done();
      animation.cancel();
   };
}

/**
 * Opens or closes a fold. `apply(open)` shows or hides the box (a class, `hidden`); it runs first on opening, last on
 * closing, so the box is measured while it shows.
 * @param {HTMLElement} box    The part that folds away (a section's list, a favorites group's rows, a container's).
 * @param {boolean} open
 * @param {(open: boolean) => void} apply
 */
export function animateFold(box, open, apply)
{
   if (box) { settle(box); }
   if (!box || keepsStill(box)) { apply(open); return; }
   if (open) { apply(true); }
   const height = box.getBoundingClientRect().height;
   if (!height) { if (!open) { apply(false); } return; }
   const style = getComputedStyle(box);
   const shut = { height: '0px', opacity: 0, paddingTop: '0px', paddingBottom: '0px' };
   const full = { height: `${height}px`, opacity: 1, paddingTop: style.paddingTop, paddingBottom: style.paddingBottom };
   box.style.overflow = 'clip';
   box.style.boxSizing = 'border-box';
   play(box, open ? [shut, full] : [full, shut], FOLD_MS, () =>
   {
      box.style.overflow = '';
      box.style.boxSizing = '';
      if (!open) { apply(false); }
   });
}

/** A tray's motion: in, it fades and drops 4px; out, the same in reverse. */
const TRAY_SHUT = { opacity: 0, transform: 'translateY(-4px)' };
const TRAY_SHOWN = { opacity: 1, transform: 'none' };

/** Fades a tray in (the tray just shown). */
export function trayIn(tray)
{
   if (!tray || keepsStill(tray)) { return; }
   play(tray, [TRAY_SHUT, TRAY_SHOWN], TRAY_MS, () => {});
}

/** Fades a tray out, then `apply()` hides it (closes its `details`, sets `hidden`). */
export function trayOut(tray, apply)
{
   if (!tray || keepsStill(tray)) { apply(); return; }
   play(tray, [TRAY_SHOWN, TRAY_SHUT], TRAY_MS, apply);
}

/**
 * Opens a `details` whose child is a tray, its fade starting in the same frame: left to the browser's own toggle, the
 * tray painted whole for a frame before its fade began at nothing (a flicker, user 2026-11-08: "jittery").
 */
export function openTrayFold(details)
{
   if (!details || details.open) { return; }
   details.open = true;
   trayIn(details.querySelector(':scope > .fhcs-tray'));
}

/** Closes a `details` whose child is a tray, the tray fading out first. A second close while it fades does nothing. */
export function closeTrayFold(details)
{
   if (!details?.open) { return; }
   const tray = details.querySelector(':scope > .fhcs-tray');
   if (!tray) { details.open = false; return; }
   if (details.dataset.fhcsClosing) { return; }
   details.dataset.fhcsClosing = 'true';
   trayOut(tray, () =>
   {
      details.open = false;
      delete details.dataset.fhcsClosing;
   });
}
