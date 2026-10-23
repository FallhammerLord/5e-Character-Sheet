/**
 * Death saves on our sheet (user, 2026-10-24): three successes stay shown until HP rises above 0, and rising above
 * 0 clears both rows. dnd5e itself resets the pips to 0 on the third success and leaves them when healed.
 */

/**
 * `dnd5e.rollDeathSaveV2`, before dnd5e applies the result: on the third success keep the three successes (and the
 * failures so far) instead of dnd5e's reset. dnd5e won't roll again while successes are at 3, as the rules want.
 */
export function keepStable(rolls, details)
{
   if (details?.outcome !== 'stable' || !details.updates) { return; }
   details.updates['system.attributes.death.success'] = 3;
   delete details.updates['system.attributes.death.failure'];
}

/**
 * The death save changes to add when HP goes from 0 to above 0: both rows cleared. Pure, for the unit check.
 * @returns {object|null}
 */
export function healUpdates(oldHp, newHp, death)
{
   if (!(oldHp <= 0) || !(newHp > 0) || !(death?.success || death?.failure)) { return null; }
   return { 'system.attributes.death.success': 0, 'system.attributes.death.failure': 0 };
}

/** `preUpdateActor`: folds the clearing into the same update that heals the character. */
export function clearOnHeal(actor, change)
{
   if (actor?.type !== 'character') { return; }
   const newHp = foundry.utils.getProperty(change, 'system.attributes.hp.value');
   if (newHp === undefined) { return; }
   const updates = healUpdates(actor.system.attributes.hp.value, newHp, actor.system.attributes.death);
   if (updates) { foundry.utils.mergeObject(change, foundry.utils.expandObject(updates)); }
}
