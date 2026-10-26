/**
 * The Inventory tab's display values (SCOPE §4.6), from plain facts. Pure, like attributes.js: the unit check and the
 * layout fixtures use the same code. `compat.inventoryFacts` gathers the facts from dnd5e.
 */

/** The columns a player can show or hide, in Classic's order (user, 2026-10-26). */
export const INVENTORY_COLUMNS = ['weight', 'uses', 'usage', 'quantity', 'equipped', 'attuned'];

/** What shows before a player chooses: weight is off, since nothing at the table enforces it (user, 2026-10-26). */
export const DEFAULT_COLUMNS = { weight: false, uses: true, usage: true, quantity: true, equipped: true, attuned: true };

/** @returns {object} A player's saved choice laid over the defaults, so a column added later still shows. */
export function columnChoice(saved)
{
   const choice = { ...DEFAULT_COLUMNS };
   for (const key of INVENTORY_COLUMNS)
   {
      if (typeof saved?.[key] === 'boolean') { choice[key] = saved[key]; }
   }
   return choice;
}

/** @returns {number} A percentage clamped to 0–100. */
const pct = (n) => Math.max(0, Math.min(100, Number(n) || 0));

/**
 * Everything the Inventory tab shows.
 * @param {object} facts  From compat.inventoryFacts (or a fixture).
 * @param {{format: Function, localize: Function}} i18n
 */
export function inventoryView(facts, { format, localize })
{
   const columns = columnChoice(facts.columns);
   const sections = facts.sections
      .filter((s) => s.items.length)
      .map((s) => ({
         id: s.id,
         label: s.label,
         count: s.items.length,
         items: s.items.map((item) =>
         {
            const equipped = !!item.equip?.on;
            return {
               id: item.id,
               uuid: item.uuid,
               name: item.name,
               img: item.img,
               sub: item.sub ?? '',
               useAction: item.useAction ?? 'use',
               useLabel: format(item.useAction === 'view' ? 'FHCS.Inventory.ViewLabel' : 'FHCS.Inventory.UseLabel', { name: item.name }),
               detailsLabel: format('FHCS.Inventory.DetailsLabel', { name: item.name }),
               expanded: !!item.expanded,
               summary: item.summary ?? '',
               weight: item.weight ?? '',
               uses: item.uses?.max ? { value: item.uses.value, max: item.uses.max, prop: item.uses.prop,
                  label: format('FHCS.Inventory.UsesLabel', { name: item.name }) } : null,
               usage: item.usage ?? '',
               quantity: item.quantity ?? null,
               quantityLabel: format('FHCS.Inventory.QuantityLabel', { name: item.name }),
               equipped,
               equip: item.equip ? {
                  pressed: equipped,
                  disabled: !!item.equip.disabled,
                  label: localize(equipped ? 'FHCS.Inventory.Equipped' : 'FHCS.Inventory.NotEquipped')
               } : null,
               // Three states (user, 2026-10-26): attuned, needs attuning (click to attune), or no attunement at all.
               attune: item.attune ? {
                  pressed: !!item.attune.on,
                  disabled: !!item.attune.disabled,
                  label: item.attune.on ? localize('FHCS.Inventory.Attuned') : item.attune.need || localize('FHCS.Inventory.NotAttuned')
               } : null,
               editLabel: format('FHCS.Inventory.EditLabel', { name: item.name }),
               deleteLabel: format('FHCS.Inventory.DeleteLabel', { name: item.name })
            };
         })
      }));

   const enc = facts.encumbrance;
   const encumbrance = enc ? {
      pct: pct(enc.pct),
      low: pct(enc.stops?.encumbered),
      high: pct(enc.stops?.heavilyEncumbered),
      text: `${enc.value} / ${enc.max} ${enc.units}`.trim(),
      label: format('FHCS.Inventory.CarriedLabel', { value: enc.value, max: enc.max, units: enc.units })
   } : null;

   return {
      sections,
      columns,
      editing: !!facts.editing,
      filters: facts.filters ?? [],
      sorting: facts.sorting ?? [],
      // The column menu is a setting, so it shows only in edit mode, like dnd5e's gear icons (user, 2026-10-26).
      columnToggles: facts.editing ? INVENTORY_COLUMNS.map((key) => ({
         key, pressed: columns[key], label: localize(`FHCS.Inventory.Column.${key}`)
      })) : [],
      currency: facts.currency.map((c) => ({ ...c, label: format('FHCS.Inventory.CurrencyLabel', { name: c.name }) })),
      attunement: (facts.attunement?.max || facts.editing) ? {
         text: `${facts.attunement.value} / ${facts.attunement.max}`,
         value: facts.attunement.value,
         sourceMax: facts.attunement.sourceMax ?? facts.attunement.max,
         maxLabel: localize('FHCS.Inventory.AttunementMax'),
         label: format('FHCS.Inventory.AttunementLabel', facts.attunement),
         over: facts.attunement.value > facts.attunement.max
      } : null,
      encumbrance,
      empty: !sections.length,
      text: {
         search: localize('FHCS.Inventory.Search'),
         columns: localize('FHCS.Inventory.Columns'),
         attuned: localize('FHCS.Inventory.Attuned'),
         carried: localize('FHCS.Inventory.Carried'),
         empty: localize('FHCS.Inventory.Empty'),
         head: Object.fromEntries(INVENTORY_COLUMNS.map((key) => [key, localize(`FHCS.Inventory.Column.${key}`)]))
      }
   };
}
