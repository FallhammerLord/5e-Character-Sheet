/**
 * What dnd5e 6.0.6 renders on a character's Inventory tab, written out by hand so the layout check can style-test
 * dnd5e's own markup offline (its templates need dnd5e's Handlebars helpers). Mirrors templates/inventory/inventory.hbs,
 * templates/inventory/columns/*.hbs and the `<search>` that item-list-controls builds (components/item-list-controls.mjs).
 * Keep in step with dnd5e when it changes; docs/research/dnd5e-6.0-sheet.md says which files.
 */

/** dnd5e's inventory columns (components/inventory.mjs COLUMNS): width and priority. */
const COLUMNS = {
   price: { width: 80, priority: 300, label: 'Price' },
   weight: { width: 60, priority: 400, label: 'Weight' },
   quantity: { width: 70, priority: 500, label: 'Quantity' },
   charges: { width: 70, priority: 600, label: 'Charges' },
   controls: { width: 70, priority: 1000, label: '' }
};

const ICON = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><rect width="8" height="8" fill="#887"/></svg>')}`;

function columns(item, { editMode })
{
   const price = item.price
      ? `<div class="item-detail item-price" data-column-id="price">${item.price} <i class="currency gp" aria-label="Gold"></i></div>`
      : '<div class="item-detail item-price empty" data-column-id="price"></div>';
   const weight = item.weight
      ? `<div class="item-detail item-weight" data-column-id="weight"><i class="fa-solid fa-weight-hanging" inert></i> ${item.weight}</div>`
      : '<div class="item-detail item-weight empty" data-column-id="weight"></div>';
   const quantity = `<div class="item-detail item-quantity" data-column-id="quantity">
      <a class="adjustment-button always-interactive" data-action="decrease" data-property="system.quantity"><i class="fa-solid fa-minus" inert></i></a>
      <input type="text" class="always-interactive" value="${item.quantity}" placeholder="0" data-dtype="Number" data-name="system.quantity" inputmode="numeric" aria-label="Quantity">
      <a class="adjustment-button always-interactive" data-action="increase" data-property="system.quantity"><i class="fa-solid fa-plus" inert></i></a></div>`;
   const charges = item.uses
      ? `<div class="item-detail item-uses" data-column-id="charges"><input class="always-interactive" type="text" value="${item.uses[0]}" placeholder="0" data-dtype="Number" inputmode="numeric" aria-label="Remaining"><span class="separator">/</span><span class="max">${item.uses[1]}</span></div>`
      : '<div class="item-detail item-uses empty" data-column-id="charges"></div>';
   const button = (action, icon, label, cls = '') => `<button type="button" class="unbutton config-button item-control item-action ${cls}" data-action="${action}" data-tooltip aria-label="${label}"><i class="fa-solid ${icon}" inert></i></button>`;
   const controls = `<div class="item-detail item-controls always-visible" data-column-id="controls">
      ${editMode
         ? button('edit', 'fa-pen-to-square', 'Edit Item') + button('delete', 'fa-trash', 'Delete Item')
         : (item.attune ? button('attune', 'fa-sun', 'Attuned', item.attune) : '') + (item.equip !== undefined ? button('equip', 'fa-shield-halved', 'Equipped', item.equip ? 'active' : '') : '')}
      <button type="button" class="unbutton config-button item-control item-action always-interactive" data-toggle-description data-action="toggleExpand" aria-label="Toggle Description"><i class="fa-solid fa-expand" inert></i></button>
      <button type="button" class="unbutton config-button item-control always-interactive" data-context-menu aria-label="Additional Controls"><i class="fa-solid fa-ellipsis-vertical" inert></i></button>
   </div>`;
   return price + weight + quantity + charges + controls;
}

function row(item, options)
{
   return `<li class="item collapsible ${item.expanded ? '' : 'collapsed'}" data-uuid="Actor.a.Item.${item.id}" data-item-id="${item.id}" data-entry-id="${item.id}" data-item-name="${item.name}">
      <div class="item-row draggable">
         <div class="item-name item-action item-tooltip rollable" role="button" data-action="use" aria-label="${item.name}">
            <img draggable="false" src="${ICON}" alt="${item.name}" class="item-image gold-icon">
            <div class="name name-stacked">
               <span class="title">${item.name}</span>
               ${item.subtitle ? `<span class="subtitle">${item.subtitle}</span>` : ''}
            </div>
            <div class="tags">${(item.tags ?? []).map((t) => `<span aria-label="${t}"><dnd5e-icon src="x.svg"></dnd5e-icon></span>`).join('')}</div>
         </div>
         ${columns(item, options)}
      </div>
      <div class="item-description collapsible-content"><div class="wrapper">
         ${item.expanded ? `<div class="item-summary"><p>${item.expanded}</p><div class="item-properties pills"><span class="tag pill transparent">Versatile</span><span class="tag pill transparent">Martial</span></div></div>` : ''}
      </div></div>
   </li>`;
}

function section(label, items, options)
{
   const headers = Object.entries(COLUMNS).map(([id, c]) => `<div class="item-header item-${id}" data-column-id="${id}" data-column-width="${c.width}" data-column-priority="${c.priority}">${c.label}</div>`).join('');
   return `<div class="items-section card" data-type="${label.toLowerCase()}">
      <div class="items-header header"><h3 class="item-name">${label}</h3>${headers}</div>
      <ol class="item-list unlist">${items.map((i) => row(i, options)).join('')}</ol>
   </div>`;
}

const SECTIONS = [
   ['Weapons', [
      { id: 'w1', name: 'Longsword', subtitle: 'Martial Weapon', price: 15, weight: 3, quantity: 1, equip: true, tags: ['Versatile'], expanded: 'Proficiency with a longsword allows you to add your proficiency bonus to the attack roll.' },
      { id: 'w2', name: 'Handaxe of the Unreasonably Long Name', subtitle: 'Simple Weapon', price: 5, weight: 4, quantity: 2, equip: false, tags: ['Light', 'Thrown'] }
   ]],
   ['Equipment', [
      { id: 'e1', name: 'Chain Mail', subtitle: 'Heavy Armor', price: 75, weight: 55, quantity: 1, equip: true },
      { id: 'e2', name: 'Cloak of Protection', subtitle: 'Wondrous Item', quantity: 1, equip: true, attune: 'attuned' }
   ]],
   ['Consumables', [
      { id: 'c1', name: 'Potion of Healing', subtitle: 'Potion', price: 50, weight: 0.5, quantity: 3, uses: [1, 1] }
   ]]
];

/** Encumbrance as templates/inventory/encumbrance.hbs draws it, with breakpoints. */
const encumbrance = (value, max, pct) => `<div class="meter progress" role="meter" aria-valuemin="0" aria-valuenow="${pct}" aria-valuetext="${value}" aria-valuemax="${max}"
   style="--bar-percentage: ${pct}%; --breakpoint-low: 33.3%; --breakpoint-high: 66.6%;">
   <div class="label"><i class="fa-solid fa-weight-hanging" inert></i><span class="value">${value}</span><span class="separator">/</span><span class="max">${max}</span></div>
   <i class="breakpoint breakpoint-low arrow-up" role="presentation"></i><i class="breakpoint breakpoint-low arrow-down" role="presentation"></i>
   <i class="breakpoint breakpoint-high arrow-up" role="presentation"></i><i class="breakpoint breakpoint-high arrow-down" role="presentation"></i>
</div>`;

/** Inventory's top block (tabs/character-inventory.hbs) and currency (inventory.hbs), for an owner. */
function top()
{
   const container = (id, name, pct, equipped) => `<li class="container draggable" data-item-id="${id}" data-uuid="Actor.a.Item.${id}">
      <a class="item-action" data-action="showDocument" data-tooltip aria-label="${name}">
         <div class="meter progress" role="meter" aria-valuemin="0" aria-valuenow="${pct}" aria-valuetext="${pct}" aria-valuemax="100" style="--bar-percentage: ${pct}%"></div>
         <img src="${ICON}" alt="${name}" draggable="false">
         ${equipped ? '<i class="equipped fa-solid fa-shield-halved" data-tooltip aria-label="Equipped"></i>' : ''}
      </a></li>`;
   return `<div class="top">
      <div class="encumbrance card">
         ${encumbrance(87.5, 180, 48.6)}
         <div class="info">
            <div class="strength"><span class="label">Strength</span><span class="value">12</span></div>
            <div class="size"><span class="label">Size</span><span class="value" aria-label="Medium">Med</span></div>
            <div class="multiplier"><span class="label">Multiplier</span><span class="value"><span class="sign">×</span> 1</span></div>
         </div>
      </div>
      <ul class="containers unlist">${container('k1', 'Backpack', 40, true)}${container('k2', 'Bag of Holding', 5, false)}</ul>
   </div>`;
}

const CURRENCY = { pp: 0, gp: 152, ep: 0, sp: 31, cp: 1250 };

function currency({ editMode })
{
   return `<section class="currency">
      ${editMode ? '' : '<button type="button" class="item-action unbutton always-interactive" data-action="currency" aria-label="Manage Currency"><i class="fa-solid fa-coins" inert></i></button>'}
      ${Object.entries(CURRENCY).map(([key, value]) => `<label aria-label="${key}"><i class="currency ${key}" data-tooltip="${key}"></i>
         <input type="text" class="uninput always-interactive" name="system.currency.${key}" value="${value}" data-dtype="Number" inputmode="numeric"></label>`).join('')}
   </section>`;
}

/** What dnd5e's _renderAttunement appends to `.middle` (base-actor-sheet.mjs). */
const attunement = ({ editMode }) => `<div class="attunement"><i class="fa-solid fa-sun" data-tooltip="DND5E.Attunement" aria-label="Attunement"></i>
   <span class="value">1</span><span class="separator">/</span>${editMode ? '<input type="number" name="system.attributes.attunement.max" class="max" min="0" step="1" value="3">' : '<span class="max">3</span>'}</div>`;

/** The inventory element with its controls and sections, as dnd5e renders it for an owner. */
export function inventoryMarkup({ editMode = false } = {})
{
   return `<div class="tab-body"><section class="tab inventory active" data-tab="inventory" data-group="primary">
   ${top()}
   <dnd5e-inventory class="inventory-element">
      ${currency({ editMode })}
      <div class="middle">
         <item-list-controls for="inventory" collection="items" label="Search inventory">
            <search aria-label="Search inventory">
               <input type="text" class="always-interactive" placeholder="Search inventory">
               <ul class="unlist controls">
                  <li><button type="button" class="unbutton filter-control always-interactive" data-action="clear" data-tooltip aria-label="Clear Filters"><i class="fas fa-xmark"></i></button></li>
                  <li><button type="button" class="unbutton filter-control filter always-interactive" data-action="filter" aria-label="Filter"><i class="fa-solid fa-filter" inert></i></button></li>
                  <li><button type="button" class="unbutton filter-control active always-interactive" data-action="sort" aria-label="Sort Manually"><i inert class="fa-solid fa-arrow-down-short-wide"></i></button></li>
                  <li><button type="button" class="unbutton filter-control active always-interactive" data-action="group" aria-label="Group by Category"><i inert class="fa-solid fa-layer-group"></i></button></li>
               </ul>
            </search>
         </item-list-controls>
         ${attunement({ editMode })}
      </div>
      <section class="items-list inventory-list" data-item-list="inventory">
         ${SECTIONS.map(([label, items]) => section(label, items, { editMode })).join('')}
      </section>
   </dnd5e-inventory>
</section></div>`;
}

/** The Features tab (tabs/character-features.hbs): class pills (parts/actor-classes.hbs) over the item list. */
export function featuresMarkup({ editMode = false } = {})
{
   const pill = (id, name, subclass, level) => `<div class="class pill-lg" data-item-id="${id}">
      <img class="underlay" src="${ICON}" alt="" inert>
      <div class="icons ${subclass ? 'subclass' : ''}">
         <img class="draggable gold-icon item-tooltip" src="${ICON}" alt="${name}" data-action="showDocument" data-uuid="Actor.a.Item.${id}" data-item-id="${id}">
         ${subclass ? `<img class="draggable gold-icon item-tooltip" src="${ICON}" alt="${subclass}" data-action="showDocument" data-uuid="Actor.a.Item.${id}s" data-item-id="${id}s">`
            : '<a class="gold-icon subclass-icon" data-action="findItem" data-item-type="subclass" data-tooltip="DND5E.SubclassAdd" aria-label="Add Subclass"><i class="fa-solid fa-circle-plus" inert></i></a>'}
         ${editMode ? `<div class="controls"><a class="deletion-control item-control item-action" data-action="deleteDocument" data-uuid="Actor.a.Item.${id}" data-item-id="${id}" aria-label="Delete Item"><i class="fas fa-circle-xmark" inert></i></a></div>` : ''}
      </div>
      <div class="name-stacked"><div class="title">${name}</div>${subclass ? `<div class="subtitle">${subclass}</div>` : ''}</div>
      <div class="level">${editMode ? `<select class="level-selector"><option value="0" selected>${level}</option><option value="1">+1</option></select>` : `<span>${level}</span>`}</div>
   </div>`;
   return `<div class="tab-body"><section class="tab features active" data-tab="features" data-group="primary">
   <section class="classes pills-lg ${editMode ? 'editing' : ''}">
      ${pill('b1', 'Barbarian', 'Path of the Unreasonably Long Subclass Name', 5)}${pill('f1', 'Fighter', null, 2)}
      <div class="pill-lg empty roboto-upper" data-action="findItem" data-item-type="class">Add Class</div>
   </section>
   <dnd5e-inventory class="inventory-element">
      <section class="items-list features-list" data-item-list="features">
         ${section('Barbarian Features', [
            { id: 'r1', name: 'Rage', subtitle: 'Bonus Action', quantity: 1, uses: [2, 3] },
            { id: 'r2', name: 'Unarmored Defense', subtitle: 'Passive', quantity: 1 }
         ], { editMode })}
      </section>
   </dnd5e-inventory>
</section></div>`;
}
