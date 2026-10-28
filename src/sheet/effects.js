/**
 * The Effects tab's display values (SCOPE §4.8), from plain facts. Pure, like features.js: the unit check and the
 * layout fixtures use the same code. `compat.effectsFacts` gathers the facts from dnd5e.
 */

/**
 * Everything the Effects tab shows.
 * @param {object} facts  From compat.effectsFacts (or a fixture).
 * @param {{format: Function, localize: Function}} i18n
 */
export function effectsView(facts, { format, localize })
{
   const row = (e) => ({
      id: e.id,
      uuid: e.uuid,
      parentId: e.parentId ?? '',
      name: e.name,
      img: e.img,
      source: e.source ?? '',
      duration: e.duration ?? '',
      detailsLabel: format('FHCS.Inventory.DetailsLabel', { name: e.name }),
      expanded: !!e.expanded,
      summary: e.summary ?? '',
      // The switch (SCOPE §5.1): on or off; a concentration shows its C instead, since it ends on the Spellbook.
      toggle: e.toggleable ? {
         on: !e.disabled,
         label: format(e.disabled ? 'FHCS.Effects.TurnOn' : 'FHCS.Effects.TurnOff', { name: e.name })
      } : null,
      // In edit mode a concentration gets Break where other effects get Delete (user, 2026-10-28): it ends the
      // concentration through dnd5e, as the Spellbook's End does, rather than deleting the effect.
      concentration: e.concentration ? { label: localize('FHCS.Effects.Concentrating'), breakLabel: format('FHCS.Effects.BreakLabel', { name: e.name }) } : null,
      favorite: !!e.favorite,
      favoriteAction: e.favorite ? 'unfavorite' : 'favorite',
      favoriteLabel: localize(e.favorite ? 'FHCS.Favorite.On' : 'FHCS.Favorite.Off'),
      editLabel: format('FHCS.Inventory.EditLabel', { name: e.name }),
      deleteLabel: format('FHCS.Inventory.DeleteLabel', { name: e.name })
   });

   const sections = (facts.categories ?? [])
      .filter((c) => c.effects.length)
      .map((c) => ({ id: c.id, label: c.label, count: c.effects.length, items: c.effects.map(row) }));

   const conditions = (facts.conditions ?? []).map((c) =>
   {
      const leveled = c.level !== null && c.level !== undefined;
      const on = leveled ? c.level > 0 : !!c.on;
      return {
         id: c.id,
         name: c.name,
         img: c.img,
         on,
         level: leveled ? format('FHCS.Effects.Level', { level: c.level }) : '',
         label: leveled
            ? format('FHCS.Effects.LevelLabel', { name: c.name, level: c.level })
            : format(on ? 'FHCS.Effects.TurnOff' : 'FHCS.Effects.TurnOn', { name: c.name })
      };
   });

   return {
      sections,
      conditions,
      editing: !!facts.editing,
      empty: !sections.length,
      text: {
         search: localize('FHCS.Effects.Search'),
         source: localize('FHCS.Effects.Source'),
         duration: localize('FHCS.Effects.Duration'),
         on: localize('FHCS.Effects.On'),
         favorite: localize('FHCS.Inventory.Column.favorite'),
         conditions: localize('FHCS.Effects.Conditions'),
         empty: localize('FHCS.Effects.Empty')
      }
   };
}
