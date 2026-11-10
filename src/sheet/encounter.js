/**
 * The encounter sheet's display values (SCOPE §4.13, the encounter sheet), from plain facts. Pure, like group.js: the
 * unit check and the layout fixtures use the same code. `compat.encounterHeaderFacts` and `compat.encounterMembersFacts`
 * gather the facts from dnd5e.
 */

/** @returns {number} A percentage clamped to 0–100. */
const pct = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));

/**
 * Everything the encounter's header shows: the name, the encounter's chips, and one line ("8 creatures · 1,800 XP ·
 * High"; the difficulty a word, no colour).
 * @param {object} facts  From compat.encounterHeaderFacts (or a fixture).
 * @param {{format: Function, localize: Function}} i18n
 */
export function encounterHeaderView(facts, { format, localize })
{
   const count = facts.creatures ?? 0;
   const parts = [format(count === 1 ? 'FHCS.Encounter.CreatureOne' : 'FHCS.Encounter.CreatureMany', { count })];
   if (facts.xp) { parts.push(format('FHCS.Encounter.Xp', { xp: facts.xp })); }
   if (facts.difficulty) { parts.push(localize(`FHCS.Encounter.Difficulty.${facts.difficulty}`)); }
   return {
      name: facts.name,
      nameSource: facts.nameSource ?? facts.name,
      img: facts.img,
      editing: !!facts.editing,
      summary: parts.join(' · '),
      text: {
         name: localize('FHCS.Encounter.Name'),
         roll: localize('FHCS.Encounter.RollAll'),
         place: localize('FHCS.Group.Place'),
         award: localize('FHCS.Encounter.Award')
      }
   };
}

/**
 * Everything the encounter's Members tab shows (SCOPE §4.13): one row per creature, the Add creature button, and the
 * difficulty bar in the foot.
 * @param {object} facts  From compat.encounterMembersFacts (or a fixture): `members`, `editing`, `difficulty`.
 * @param {{format: Function, localize: Function}} i18n
 */
export function encounterMembersView(facts, { format, localize })
{
   const editing = !!facts.editing;
   const members = (facts.members ?? []).map((m) =>
   {
      const counted = m.quantity?.value !== null && m.quantity?.value !== undefined;
      const formula = m.quantity?.formula ?? '';
      return {
         uuid: m.uuid,
         index: m.index,
         name: m.name,
         img: m.img,
         isVideo: !!m.isVideo,
         sub: m.sub ?? '',
         cr: m.cr ?? '—',
         crLabel: format('FHCS.Encounter.CrLabel', { cr: m.cr ?? '—' }),
         xp: m.xp ?? '',
         count: counted ? m.quantity.value : '',
         // In play, a formula shows only while no count is rolled, with its d20 to roll it (dnd5e's own rule).
         rollFormula: !editing && !!formula && !counted ? { formula, label: format('FHCS.Encounter.RollOne', { name: m.name, formula }) } : null,
         formula,
         openLabel: format('FHCS.Group.OpenLabel', { name: m.name }),
         countLabel: format('FHCS.Encounter.CountLabel', { name: m.name }),
         formulaLabel: format('FHCS.Encounter.FormulaLabel', { name: m.name }),
         fewerLabel: format('FHCS.Encounter.Fewer', { name: m.name }),
         moreLabel: format('FHCS.Encounter.More', { name: m.name }),
         removeLabel: format('FHCS.Group.RemoveLabel', { name: m.name })
      };
   });
   const d = facts.difficulty;
   const difficulty = d ? {
      pct: pct(d.pct),
      low: d.stops?.low ? pct(d.stops.low) : 0,
      high: d.stops?.high ? pct(d.stops.high) : 0,
      bar: !!d.max,
      text: format('FHCS.Encounter.Xp', { xp: d.xpText ?? d.value ?? 0 }),
      word: d.word ? localize(`FHCS.Encounter.Difficulty.${d.word}`) : '',
      label: format('FHCS.Encounter.DifficultyLabel', { xp: d.xpText ?? d.value ?? 0 })
   } : null;
   return {
      editing,
      members,
      difficulty,
      // Add creature ends the list in edit mode, or whenever there's none yet (dnd5e's rule).
      add: editing || !members.length,
      text: {
         cr: localize('FHCS.Encounter.Cr'),
         xpEach: localize('FHCS.Encounter.XpEach'),
         count: localize('FHCS.Encounter.Count'),
         creatures: localize('FHCS.Encounter.Creatures'),
         add: localize('FHCS.Encounter.Add'),
         difficulty: localize('FHCS.Encounter.DifficultyHead')
      }
   };
}
