/**
 * The item sheet's header and Description tab (SCOPE §4.13, user 2026-10-28): display values from the plain facts
 * `compat.itemSheetFacts` gathers. Pure, so unit and layout checks use the same code.
 */

/** Each header toggle's mark, by key (SCOPE §5.1: the check, the star, an eye, the book). */
const TOGGLE_MARKS = {
   equipped: 'M5 12l5 5 9-11',
   attuned: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
   identified: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 1 0 0-6z',
   prepared: 'M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6'
};

/**
 * @param {object} facts  From `compat.itemSheetFacts`.
 * @param {{localize: Function, format: Function}} i18n
 */
export function itemSheetView(facts, { localize, format })
{
   const spell = facts.spell;
   const subtitle = spell ? [spell.level, spell.school, spell.components].filter(Boolean).join(' · ')
      : (facts.subtitles?.length ? facts.subtitles : [facts.typeLabel]).filter(Boolean).join(' · ');
   const marks = spell ? [
      spell.concentration && { concentration: true, word: localize('FHCS.Item.Concentration') },
      spell.ritual && { ritual: true, word: localize('FHCS.Item.Ritual') }
   ].filter(Boolean) : [];
   const toggles = (facts.toggles ?? []).map((t) => ({
      key: t.key,
      on: !!t.on,
      can: facts.editable && !t.locked,
      path: TOGGLE_MARKS[t.key] ?? '',
      label: localize(`FHCS.Item.Toggle.${t.key}`)
   }));

   // The properties column: a field in edit mode, the value in play; rows with nothing to say are left out in play.
   const props = [];
   const row = (key, value, field = '', unit = '') => props.push({ key, label: localize(`FHCS.Item.Prop.${key}`), value: String(value ?? ''), field, unit,
      number: ['quantity', 'weight', 'price'].includes(key) });
   if (facts.physical)
   {
      row('quantity', facts.physical.quantity, 'system.quantity');
      row('weight', facts.physical.weight, 'system.weight.value', facts.physical.weightUnit);
      if (facts.physical.price) { row('price', facts.physical.price.value, 'system.price.value', facts.physical.price.unit); }
   }
   if (facts.uses)
   {
      row('uses', format('FHCS.Item.UsesOf', { value: facts.uses.value, max: facts.uses.max }));
      if (facts.uses.recovery) { row('recovery', facts.uses.recovery); }
   }
   if (spell)
   {
      for (const key of ['time', 'range', 'duration', 'target', 'materials']) { if (spell[key]) { row(key, spell[key]); } }
   }
   // The category of the player's own (SCOPE §4.13), the same name the character's tabs file it by.
   row('category', facts.category, facts.categoryField);
   // The category shows in both modes, "—" when unset, so the column keeps its rows on the lock (rule 6).
   const shown = props.filter((p) => facts.editing || p.value !== '' || p.key === 'quantity' || p.key === 'category');

   return {
      name: facts.name,
      nameField: facts.nameField,
      img: facts.img,
      editable: !!facts.editable,
      editing: !!facts.editing,
      fields: !!(facts.editable && facts.editing),
      subtitle,
      marks,
      toggles,
      props: shown.map((p) => ({ ...p, value: !facts.editing && p.key === 'category' && !p.value ? '—' : p.value,
         unitText: p.unit ? ` ${p.unit}` : '', placeholder: p.key === 'category' ? localize('FHCS.Item.CategoryNone') : '' })),
      tags: facts.tags ?? [],
      description: { ...facts.description, empty: !String(facts.description?.enriched ?? '').replace(/<[^>]*>/g, '').trim() },
      uuid: facts.uuid,
      text: {
         icon: format('FHCS.Item.Icon', { name: facts.name }),
         name: localize('FHCS.Item.Name'),
         properties: localize('FHCS.Item.Properties'),
         description: localize('FHCS.Item.Description'),
         empty: localize('FHCS.Item.Empty')
      }
   };
}
