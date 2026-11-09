/**
 * The Limited view's display values (SCOPE §4.15; user, 2026-11-08: "our frame, trimmed"): what dnd5e's limited parts
 * show (portrait, name, the biography), in our portrait card and Biography styling. Pure, like header.js.
 */
import { framedPortrait } from './header.js';

/** @returns {boolean} Whether enriched HTML holds any words. */
const hasText = (html) => !!String(html ?? '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

/**
 * @param {object} facts  From compat.limitedFacts (or a fixture): name, portrait, frame, shape, public, biography.
 * @param {{localize: Function}} i18n
 */
export function limitedView(facts, { localize })
{
   return {
      name: facts.name ?? '',
      portrait: framedPortrait(facts),
      public: hasText(facts.public) ? facts.public : '',
      biography: hasText(facts.biography) ? facts.biography : '',
      text: { biography: localize('DND5E.Biography'), empty: localize('FHCS.Biography.Empty') }
   };
}
