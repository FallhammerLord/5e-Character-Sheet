/**
 * The item sheet's header and Description tab (SCOPE §4.13, user 2026-10-28): display values from the plain facts
 * `compat.itemSheetFacts` gathers. Pure, so unit and layout checks use the same code.
 */

/**
 * Each header toggle's mark, by key (SCOPE §5.1): Foundry's Font Awesome icons where dnd5e has one for the state
 * (user, 2026-10-28: "foundry should have appropriate icons"; equipped its halved shield, identified its wand with
 * sparkles), else ours (the attunement star of the inventory rows, the prepared book).
 */
const TOGGLE_ICONS = { equipped: 'fa-solid fa-shield-halved', identified: 'fa-solid fa-wand-sparkles' };
const TOGGLE_MARKS = {
   attuned: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
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
      icon: TOGGLE_ICONS[t.key] ?? '',
      path: TOGGLE_ICONS[t.key] ? '' : TOGGLE_MARKS[t.key] ?? '',
      label: localize(`FHCS.Item.Toggle.${t.key}`)
   }));

   // The properties column: a field in edit mode, the value in play; rows with nothing to say are left out in play.
   const props = [];
   // `unitInput` and `input` are dnd5e's own inputs as HTML (compat draws them); a row with `input` is that field.
   const row = (key, value, field = '', unit = '', { label, unitInput = '', input = '' } = {}) => props.push({ key,
      label: label ?? localize(`FHCS.Item.Prop.${key}`), value: String(value ?? ''), field, unit, unitInput, input,
      number: ['quantity', 'weight', 'price'].includes(key) });
   if (facts.physical)
   {
      row('quantity', facts.physical.quantity, 'system.quantity');
      row('weight', facts.physical.weight, 'system.weight.value', facts.physical.weightUnit, { unitInput: facts.physical.weightUnitInput });
      if (facts.physical.price) { row('price', facts.physical.price.value, 'system.price.value', facts.physical.price.unit, { unitInput: facts.physical.price.unitInput }); }
   }
   // Fields dnd5e keeps in its header (rarity, a feature's requirements), which ours doesn't draw.
   for (const f of facts.headerFields ?? []) { row(f.key, f.value, '', '', { label: f.label, input: f.input }); }
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
   // A reader sees only what's set (no lock, so no rows to hold in place: SCOPE §5.4 rule 3); quantity always.
   const shown = props.filter((p) => facts.editing || p.value !== '' || p.key === 'quantity');

   // Classes, species and backgrounds hold long texts and nothing for the column but the category: their properties
   // run as a row above the description, which takes the full width (user, 2026-10-29: the Cleric's table).
   const wide = !facts.physical && !facts.uses && !spell && !(facts.headerFields ?? []).length;
   const levelLabel = facts.levels ? format('FHCS.Item.Level', { level: facts.levels }) : '';

   const hasProps = shown.length > 0 || (facts.tags ?? []).length > 0;

   return {
      name: facts.name,
      // Nothing for the column, or only the category of a long-text item: the description takes the full width.
      wide: wide || !hasProps,
      hasProps,
      level: facts.levels || 0,
      levelLabel,
      info: (facts.info ?? []).map((i) => ({ ...i, canConfigure: !!(i.config && facts.editable && facts.editing) })),
      nameField: facts.nameField,
      img: facts.img,
      editable: !!facts.editable,
      editing: !!facts.editing,
      fields: !!(facts.editable && facts.editing),
      subtitle,
      marks,
      toggles,
      props: shown.map((p) => ({ ...p,
         unitText: p.unit ? ` ${p.unit}` : '', placeholder: p.key === 'category' ? localize('FHCS.Item.CategoryNone') : '' })),
      tags: facts.tags ?? [],
      // The description first, then the others dnd5e shows (unidentified for the GM, chat), each its own panel.
      descriptions: [{ key: 'description', label: localize('FHCS.Item.Description'), ...facts.description }, ...(facts.descriptions ?? [])]
         .map((d) => ({ ...d, empty: !String(d.enriched ?? '').replace(/<[^>]*>/g, '').trim() })),
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
