/**
 * The Inventory tab's display values (SCOPE §4.6), from plain facts. Pure, like attributes.js: the unit check and the
 * layout fixtures use the same code. `compat.inventoryFacts` gathers the facts from dnd5e.
 */
import { arrangeSections, INVENTORY_PINS, pinView, sectionFold } from './lists.js';

/** The columns a player can show or hide, in Classic's order (user, 2026-10-26). */
export const INVENTORY_COLUMNS = ['weight', 'uses', 'usage', 'quantity', 'equipped', 'attuned', 'favorite'];

/** What shows before a player chooses: weight is off, since nothing at the table enforces it (user, 2026-10-26). */
export const DEFAULT_COLUMNS = { weight: false, uses: true, usage: true, quantity: true, equipped: true, attuned: true, favorite: true };

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

/**
 * A container's columns (SCOPE §4.13, user 2026-11-10): weight, uses and quantity; weight shows by default, since
 * filling a bag is the point. Equipped, attuned and favorite don't apply to an item packed away.
 */
export const CONTAINER_COLUMNS = ['weight', 'uses', 'quantity'];

/** @returns {object} Every Inventory column, on only where the player's container choice has it. */
export function containerColumnChoice(saved)
{
   const choice = Object.fromEntries(INVENTORY_COLUMNS.map((key) => [key, false]));
   for (const key of CONTAINER_COLUMNS) { choice[key] = typeof saved?.[key] === 'boolean' ? saved[key] : true; }
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
   // A container (facts.container) has its own columns, no section arrows and no attunement; its bar is its capacity.
   // A group's stash (facts.group, SCOPE §4.13) takes the container's columns too, but has a lock, so its arrows and
   // Columns menu are edit mode's, as the character's.
   const isContainer = !!facts.container;
   const stash = isContainer || !!facts.group;
   const columns = stash ? containerColumnChoice(facts.columns) : columnChoice(facts.columns);
   const columnKeys = stash ? CONTAINER_COLUMNS : INVENTORY_COLUMNS;
   const menu = isContainer ? !!facts.canEdit : !!facts.editing;
   const open = new Set(facts.openContainers ?? []);

   /** One row, and for a container its contents, at any depth. */
   const row = (item) =>
   {
      // Packed away or in a group's stash, nothing is worn, attuned or at hand (SCOPE §4.13).
      const equipped = !stash && !!item.equip?.on;
      const contents = item.contents ? item.contents.map(row) : null;
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
         equip: !stash && item.equip ? {
            pressed: equipped,
            disabled: !!item.equip.disabled,
            label: localize(equipped ? 'FHCS.Inventory.Equipped' : 'FHCS.Inventory.NotEquipped')
         } : null,
         // Three states (user, 2026-10-26): attuned, needs attuning (click to attune), or no attunement at all.
         attune: !stash && item.attune ? {
            pressed: !!item.attune.on,
            disabled: !!item.attune.disabled,
            label: item.attune.on ? localize('FHCS.Inventory.Attuned') : item.attune.need || localize('FHCS.Inventory.NotAttuned')
         } : null,
         // A container folds its contents open under its row (user, 2026-10-26), as each player last left it.
         container: contents ? {
            count: contents.length,
            open: open.has(item.id),
            label: format('FHCS.Inventory.ContentsLabel', { name: item.name, count: contents.length }),
            contents
         } : null,
         favorite: !stash && !!item.favorite,
         favoriteLabel: localize(item.favorite ? 'FHCS.Favorite.On' : 'FHCS.Favorite.Off'),
         editLabel: format('FHCS.Inventory.EditLabel', { name: item.name }),
         deleteLabel: format('FHCS.Inventory.DeleteLabel', { name: item.name })
      };
   };

   // In the player's order, with edit mode's arrows (SCOPE §4.13).
   const sections = arrangeSections(facts.sections
      .filter((s) => s.items.length)
      .map((s) => ({ id: s.id, label: s.label, count: s.items.length, items: s.items.map(row), fold: sectionFold(isContainer ? 'contents' : 'inventory', s.id, facts.folded) })),
   facts.order, { tab: 'inventory', editing: !isContainer && !!facts.editing, format });

   const enc = facts.encumbrance;
   const encumbrance = enc ? {
      pct: pct(enc.pct),
      low: pct(enc.stops?.encumbered),
      high: pct(enc.stops?.heavilyEncumbered),
      text: `${enc.value} / ${enc.max} ${enc.units}`.trim(),
      label: format(stash ? 'FHCS.Container.CapacityLabel' : 'FHCS.Inventory.CarriedLabel', { value: enc.value, max: enc.max, units: enc.units })
   } : null;

   return {
      sections,
      columns,
      editing: !isContainer && !!facts.editing,
      filters: facts.filters ?? [],
      sorting: facts.sorting ?? [],
      // A container pins no filters (the board, 2026-11-10): dnd5e's menu holds them.
      pins: stash ? [] : pinView(INVENTORY_PINS, facts.activeFilters, localize),
      // The column menu is a setting, so it shows only in edit mode, like dnd5e's gear icons (user, 2026-10-26).
      // The Columns menu is edit mode's; play mode keeps its place, so the search field keeps one width (SCOPE §5.2 rule 6).
      hasColumns: true,
      // A container's menu shows for whoever may edit it (no lock), and keeps its own setting.
      columnToggles: menu ? columnKeys.map((key) => ({
         key, pressed: columns[key], label: localize(`FHCS.Inventory.Column.${key}`)
      })) : [],
      columnsList: stash ? 'container' : '',
      currency: facts.currency.map((c) => ({ ...c, label: format('FHCS.Inventory.CurrencyLabel', { name: c.name }) })),
      attunement: !stash && (facts.attunement?.max || facts.editing) ? {
         text: `${facts.attunement.value} / ${facts.attunement.max}`,
         value: facts.attunement.value,
         sourceMax: facts.attunement.sourceMax ?? facts.attunement.max,
         maxLabel: localize('FHCS.Inventory.AttunementMax'),
         label: format('FHCS.Inventory.AttunementLabel', facts.attunement),
         over: facts.attunement.value > facts.attunement.max
      } : null,
      encumbrance,
      // A group's members above its list, each with what they carry and their coins; a member this user can't observe
      // shows its name only (dnd5e's rule). Dropping an item on a line gives it to that member (dnd5e's own).
      carriers: facts.carriers?.length ? {
         count: facts.carriers.length,
         fold: sectionFold('inventory', 'members', facts.folded),
         lines: facts.carriers.map((m) => ({
            uuid: m.uuid, name: m.name, img: m.img, hidden: !!m.hidden, coins: m.hidden ? '' : m.coins,
            carried: m.hidden ? null : { pct: pct(m.carried.pct), text: `${m.carried.value} / ${m.carried.max} ${m.carried.units}`.trim(),
               label: format('FHCS.Inventory.CarriedLabel', { value: m.carried.value, max: m.carried.max, units: m.carried.units }) },
            openLabel: format('FHCS.Group.OpenLabel', { name: m.name })
         }))
      } : null,
      // Whose inventory shows: the group's or its primary vehicle's (dnd5e's toggleInventory); the coins write there.
      sources: facts.sources ? { onVehicle: !!facts.sources.onVehicle, vehicle: facts.sources.vehicle, group: localize('FHCS.Group.Inventory'),
         label: localize('FHCS.Group.Whose') } : null,
      currencyElsewhere: !!facts.currencyElsewhere,
      empty: !sections.length,
      text: {
         search: localize('FHCS.Inventory.Search'),
         columns: localize('FHCS.Inventory.Columns'),
         attuned: localize('FHCS.Inventory.Attuned'),
         carried: localize(stash ? 'FHCS.Container.Capacity' : 'FHCS.Inventory.Carried'),
         empty: localize(isContainer ? 'FHCS.Container.Empty' : 'FHCS.Inventory.Empty'),
         members: localize('FHCS.Group.Section.members'),
         head: Object.fromEntries(INVENTORY_COLUMNS.map((key) => [key, localize(`FHCS.Inventory.Column.${key}`)]))
      }
   };
}
