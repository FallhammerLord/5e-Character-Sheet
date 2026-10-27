/**
 * Death saves on our sheet (user, 2026-10-24): three successes stay shown until HP rises above 0. dnd5e itself
 * resets the pips to 0 on the third success; rising above 0 clears both rows, which dnd5e 6.0 does itself
 * (`preUpdateHP`, data/actor/templates/attributes.mjs:664), so we no longer add it (user, 2026-10-27).
 */

/** @returns {boolean} Whether a character's sheet is ours (it carries our class). */
const usesOurSheet = (actor) => !!actor?.sheet?.options?.classes?.includes('fhcs-sheet');

/**
 * `dnd5e.rollDeathSaveV2`, before dnd5e applies the result: on the third success keep the three successes (and the
 * failures so far) instead of dnd5e's reset. dnd5e won't roll again while successes are at 3, as the rules want.
 */
export function keepStable(rolls, details)
{
   if (details?.outcome !== 'stable' || !details.updates) { return; }
   // Our sheet's rule only (user, 2026-10-27): a character on dnd5e's own sheet, or any other, keeps dnd5e's reset.
   if (!usesOurSheet(details.subject)) { return; }
   details.updates['system.attributes.death.success'] = 3;
   delete details.updates['system.attributes.death.failure'];
}
