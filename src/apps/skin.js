/**
 * The skin over dnd5e's smaller windows (SCOPE §4.13, §5.4 rule 2; user 2026-11-12): a dnd5e window opened for a document
 * on one of our sheets is marked `fhcs-skin`, wearing its owner's theme, else the world's; styles/fhcs.css does the rest.
 * A window for a document on dnd5e's own sheet keeps dnd5e's look, so each window matches the sheet it came from.
 */
import { MODULE_ID, THEME_FLAG } from '../constants.js';
import { skinOwner } from '../compat.js';

/** The kinds of dnd5e window the skin takes, by a class each carries (research note, "The smaller windows, closer"). */
export const SKINNED_CLASSES = ['config-sheet', 'rest', 'activity', 'activity-usage', 'activity-choice', 'advancement', 'award', 'currency-manager'];

/** Windows never skinned: dnd5e's browser and dialogs that aren't about one document, and our own sheets. */
const NEVER = ['fhcs-sheet', 'compendium-browser', 'roll-configuration', 'welcome'];

/**
 * Whether a window is one the skin takes, from its classes and the kind of document it edits. Pure, for the unit check.
 * @param {string[]} classes      The window's classes.
 * @param {string} [documentName] Its document's kind (an active effect's sheet is Foundry's, with dnd5e's classes).
 */
export function skinsWindow(classes, documentName)
{
   const list = new Set(classes);
   if (!list.has('dnd5e2') || NEVER.some((c) => list.has(c))) { return false; }
   return SKINNED_CLASSES.some((c) => list.has(c)) || documentName === 'ActiveEffect';
}

/** @returns {boolean} Whether a document is shown in one of our sheets (their classes are all named FHCS…). */
const onOurSheet = (doc) => String(doc?.sheet?.constructor?.name ?? '').startsWith('FHCS');

/**
 * Marks a window for the skin, or unmarks it (its owner may have changed sheets since it last drew).
 * @param {ApplicationV2} app
 * @param {HTMLElement} element
 */
export function skinWindow(app, element)
{
   const root = app?.element ?? element;
   if (!root?.classList) { return; }
   // Every window passes through here, our own sheets too: one the skin never takes is left exactly as it is (Quench,
   // 2026-11-12: clearing the theme here stripped our sheets' own after each render).
   if (!skinsWindow([...root.classList], app.document?.documentName ?? app.options?.document?.documentName)) { return; }
   const { actor, item } = skinOwner(app);
   const ours = actor ? onOurSheet(actor) : onOurSheet(item);
   root.classList.toggle('fhcs-skin', ours);
   if (!ours) { delete root.dataset.fhcsTheme; return; }
   const theme = actor?.getFlag?.(MODULE_ID, THEME_FLAG) || game.settings.get(MODULE_ID, 'theme');
   if (theme && theme !== 'plain') { root.dataset.fhcsTheme = theme; }
   else { delete root.dataset.fhcsTheme; }
}

/** Skins every matching window as it draws (Foundry calls `renderApplicationV2` for each AppV2 window). */
export function watchWindows()
{
   Hooks.on('renderApplicationV2', skinWindow);
}
