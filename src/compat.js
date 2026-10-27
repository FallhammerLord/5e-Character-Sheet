/**
 * The only place for version-sensitive Foundry and dnd5e APIs. When dnd5e or Foundry moves something, fix it here.
 * Checked against dnd5e 6.0.6 and Foundry 14 rolls (`Roll#_evaluateTotal`, `Roll#resetFormula`, `Roll.fromData`) (module/applications/actor/character-sheet.mjs, dnd5e.mjs, documents/chat-message.mjs,
 * data/chat-message/, dice/d20-roll.mjs). Chat facts: docs/research/dnd5e-6.0-chat.md.
 */
import { countingDie, MAX_PER_SIDE, modeForSides } from './chat/d20.js';
import { diceMath } from './chat/math.js';
import { canCast, spellKind } from './sheet/spellbook.js';
import { PORTRAIT_FLAG } from './constants.js';

/** dnd5e's own character sheet, which ours extends so every mechanic keeps working. Set by dnd5e before init. */
export function systemCharacterSheet()
{
   return globalThis.dnd5e?.applications?.actor?.CharacterActorSheet;
}

/** Registers a sheet for character actors, offered beside dnd5e's own (not the default). */
export function registerCharacterSheet(sheetClass, label)
{
   foundry.applications.apps.DocumentSheetConfig.registerSheet(Actor, 'fhcs', sheetClass, {
      types: ['character'],
      makeDefault: false,
      label
   });
}

/**
 * Swaps dnd5e's data model for one chat message type with our subclass of it. Runs at init, after dnd5e's init set
 * CONFIG.ChatMessage.dataModels and before the world's messages are built.
 *
 * @param {string} type        Message type, e.g. 'usage'.
 * @param {Function} extend    (dnd5e's model class) => our subclass.
 * @returns {boolean} Whether dnd5e had that type.
 */
export function extendChatModel(type, extend)
{
   const models = CONFIG.ChatMessage?.dataModels;
   if (!models?.[type]) { return false; }
   models[type] = extend(models[type]);
   return true;
}

/** The actor's portrait for a chat card (dnd5e's choice of token or actor art), or ''. */
export async function actorArtwork(actor)
{
   if (!actor) { return ''; }
   const art = await actor.getPreferredArtwork?.();
   return (art && !art.isVideo ? art.src : actor.img) ?? '';
}

/** The module flag holding the order class levels were gained in, one class identifier per level. */
const LEVEL_ORDER_FLAG = 'levelOrder';

/**
 * Plain facts for the sheet header (src/sheet/header.js), from dnd5e's prepared data and the sheet's own helpers
 * (`_preparePortrait`, `_prepareAbilities`; character-sheet.mjs:478, base-actor-sheet.mjs:445, 502).
 */
/** Saves the portrait's framing, with the image it belongs to (user, 2026-10-27). */
export function savePortraitFrame(actor, moduleId, src, frame)
{
   return actor.setFlag(moduleId, PORTRAIT_FLAG, { src, x: frame.x, y: frame.y, zoom: frame.zoom });
}

/**
 * The HP tray's three changes, through dnd5e's own functions (actor.mjs:785, :1061): damage takes temp first and stops
 * at 0, and its hooks run (concentration saves); healing is negative damage, capped at the max; temp HP is set only
 * when higher than the temp already there (it doesn't stack). Healing from 0 clears the death saves (dnd5e's
 * `preUpdateHP`).
 * @param {Actor} actor
 * @param {'damage'|'heal'|'temp'} kind
 * @param {number} amount  Whole and above 0.
 */
export function changeHp(actor, kind, amount)
{
   if (kind === 'temp') { return actor.applyTempHP(amount); }
   return actor.applyDamage(kind === 'heal' ? -amount : amount);
}

export async function headerFacts(sheet, context, moduleId, emphasis)
{
   const actor = sheet.actor;
   const { attributes, details, traits, abilities } = actor.system;
   const config = CONFIG.DND5E;
   const classes = Object.entries(actor.classes ?? {}).map(([id, item]) => ({
      id, name: item.name, levels: item.system.levels, img: item.img, subclass: item.subclass?.name ?? ''
   }));
   const speeds = attributes.movement?.speeds ?? {};
   const walk = speeds.walk ?? Math.max(0, ...Object.values(speeds).filter(Number.isFinite));
   const units = attributes.movement?.units ?? config.defaultUnits?.length?.imperial ?? 'ft';
   const xp = details.xp ?? {};
   return {
      name: actor.name,
      nameSource: actor._source?.name ?? actor.name,
      portrait: await sheet._preparePortrait(context),
      frame: actor.getFlag(moduleId, PORTRAIT_FLAG) ?? null,
      editable: sheet.isEditable,
      classes,
      levelOrder: actor.getFlag(moduleId, LEVEL_ORDER_FLAG) ?? [],
      originalClass: actor.items.get(details.originalClass)?.identifier ?? '',
      level: details.level,
      leveling: game.settings.get('dnd5e', 'levelingMode'),
      xp: { value: xp.value ?? 0, max: Number.isFinite(xp.max) ? xp.max : xp.value ?? 0, pct: xp.pct ?? 0,
         valueLabel: (xp.value ?? 0).toLocaleString(game.i18n.lang),
         maxLabel: Number.isFinite(xp.max) ? xp.max.toLocaleString(game.i18n.lang) : '\u2014' },
      // Size and speed only (user, 2026-10-27): type and alignment were noise here; alignment is on the Biography.
      origin: [config.actorSizes?.[traits.size]?.label ?? traits.size],
      // Species and background are cards under the abilities now (SCOPE §4.1), not words in this line.
      originCards: originFacts(sheet),
      speed: `${walk} ${config.movementUnits?.[units]?.abbreviation ?? units}`,
      prof: attributes.prof,
      ac: attributes.ac?.value,
      init: attributes.init?.total ?? attributes.init?.mod ?? 0,
      hp: { value: attributes.hp.value ?? 0, max: attributes.hp.effectiveMax ?? attributes.hp.max ?? 0,
         temp: attributes.hp.temp ?? 0, tempmax: actor.system._source.attributes?.hp?.tempmax ?? 0 },
      inspiration: attributes.inspiration,
      death: { success: attributes.death?.success ?? 0, failure: attributes.death?.failure ?? 0 },
      exhaustion: { value: attributes.exhaustion ?? 0, max: config.conditionTypes?.exhaustion?.levels ?? 6 },
      hd: { value: attributes.hd?.value ?? 0, max: attributes.hd?.max ?? 0 },
      showRests: game.user.isGM || (actor.isOwner && game.settings.get('dnd5e', 'allowRests')),
      restTypes: Object.entries(config.restTypes ?? {}).map(([key, rest]) => ({ key, label: game.i18n.localize(rest.label) })),
      emphasis,
      abilities: sheet._prepareAbilities(context).map((a) => ({
         key: a.key, abbr: a.abbr, label: a.label, value: a.value, mod: a.mod,
         source: actor.system._source.abilities?.[a.key]?.value ?? a.value,
         save: a.save?.value ?? abilities[a.key]?.save?.value ?? a.mod, proficient: a.proficient ?? 0
      }))
   };
}

/** dnd5e's label keys for each trait on the Attributes tab (config.mjs `DND5E.traits`, plus senses and languages). */
const TRAIT_TITLES = { senses: 'FHCS.Attributes.Senses', languages: 'FHCS.Attributes.Languages' };

/** @returns {string} An HTML subtitle as plain text: dnd5e joins its parts with `&bull;`. */
const plainSubtitle = (html) => String(html ?? '').replace(/\s*&bull;\s*/g, ' \u00b7 ').replace(/<[^>]*>/g, '').trim();

/**
 * Plain facts for the Attributes tab (src/sheet/attributes.js), from dnd5e's prepared data and the sheet's own
 * helpers (`_prepareSenses`, `_prepareTraits`, `_prepareSkillsTools`, `_prepareFavorites`;
 * base-actor-sheet.mjs:541, 662; character-sheet.mjs:627).
 */
export async function attributesFacts(sheet, context, { passives, folded, open = new Set() })
{
   const actor = sheet.actor;
   const config = CONFIG.DND5E;
   const skills = Object.entries(actor.system.skills ?? {})
      .filter(([key]) => key in config.skills)
      .map(([key, skill]) => ({
         key, label: game.i18n.localize(config.skills[key].label),
         abbr: config.abilities[skill.ability]?.abbreviation ?? skill.ability,
         total: skill.total ?? skill.mod ?? 0, passive: skill.passive ?? '', prof: skill.value ?? skill.proficient ?? 0,
         // As stored, for edit mode's controls (effects may raise what's shown).
         source: actor.system._source.skills?.[key]?.value ?? 0, ability: actor.system._source.skills?.[key]?.ability ?? skill.ability
      }))
      .sort((a, b) => a.label.localeCompare(b.label, game.i18n.lang));

   const prepared = sheet._prepareTraits(context);
   const title = (key) => game.i18n.localize(TRAIT_TITLES[key] ?? config.traits?.[key]?.labels?.title ?? key);
   const traits = [
      { key: 'senses', title: title('senses'), values: sheet._prepareSenses(context).map((s) => [s.label, s.value].filter(Boolean).join(' ')) },
      ...['languages', 'di', 'dr', 'dv', 'dm', 'ci', 'weapon', 'armor'].map((key) => ({
         key, title: title(key), values: (prepared[key] ?? []).map((v) => [v.label, v.value].filter(Boolean).join(' '))
      })),
      { key: 'tool', title: title('tool'), values: sheet._prepareSkillsTools(context, 'tools').map((t) => t.label) }
   ];

   const favorites = [];
   const resources = [];
   for (const f of await sheet._prepareFavorites(context))
   {
      if (f.type === 'resource')
      {
         resources.push({ id: f.id, title: f.title, value: f.resource.value, max: f.resource.max });
         continue;
      }
      const item = f.itemId ? actor.items.get(f.itemId) : null;
      let group = 'other';
      let state = null;
      let kind = null;
      if (f.type === 'effect') { group = 'effects'; }
      else if (f.type === 'skill' || f.type === 'tool') { group = 'skills'; }
      else if (item?.type === 'spell')
      {
         group = 'spell';
         // The Spellbook's preparation kinds (SCOPE §4.7): the book and the kind's color, on Attributes too.
         kind = spellKind(spellFacts(actor, item));
         if (['prepared', 'always', 'pact'].includes(kind)) { state = 'prepared'; }
      }
      else if (item?.type === 'feat') { group = 'features'; }
      else if (item && 'quantity' in item.system)
      {
         group = 'inventory';
         if (item.system.equipped) { state = 'equipped'; }
      }
      // Name opens the item's details in place, as on its own tab (user, 2026-10-26); the picture uses it.
      const expanded = !!item && open.has(f.id);
      favorites.push({
         id: f.id, type: f.type, title: f.title, subtitle: plainSubtitle(f.subtitle), img: f.img,
         expandable: !!item, expanded,
         summary: expanded ? await renderTemplate(ITEM_SUMMARY, await item.getChatData({ secrets: item.isOwner })) : '',
         uses: f.uses?.max ? { value: f.uses.value, max: f.uses.max } : null, quantity: Number(f.quantity) || 0,
         itemId: f.itemId ?? '', activityId: f.activityId ?? '', effectId: f.effectId ?? '', key: f.key ?? '',
         rollableClass: f.rollableClass ?? '', group, level: item?.type === 'spell' ? item.system.level : null, state, kind
      });
   }

   const slots = {};
   for (let level = 1; level <= 9; level++)
   {
      const slot = actor.system.spells?.[`spell${level}`];
      if (slot?.max) { slots[level] = { value: slot.value ?? 0, max: slot.max }; }
   }
   const abilities = Object.entries(config.abilities ?? {}).map(([key, a]) => ({ key, abbr: a.abbreviation ?? key }));
   return { skills, abilities, traits, favorites, resources, slots, editing: sheet.isEditMode, passives, folded };
}

/** dnd5e's summary of an expanded item (inventory.mjs `_onToggleExpand`), drawn again when the sheet re-renders. */
const ITEM_SUMMARY = 'systems/dnd5e/templates/items/parts/item-summary.hbs';

/** @returns {string} A weight or capacity unit's abbreviation (`DND5E.weightUnits`), or the key itself. */
const weightUnit = (key) => game.i18n.localize(CONFIG.DND5E.weightUnits?.[key]?.abbreviation ?? key ?? '');

/** @returns {string} A number rounded to one decimal place, in the user's language. */
const tenths = (n) => (Math.round((Number(n) || 0) * 10) / 10).toLocaleString(game.i18n.lang);

/** Containers inside containers stop here, in case a bad import ever makes a loop. */
const MAX_DEPTH = 8;

/**
 * Row context for an item inside a container. dnd5e's `_prepareItems` skips contained items (base-actor-sheet.mjs:466),
 * so we run the same per-item steps it runs for loose ones.
 */
async function containedContext(sheet, item)
{
   const ctx = { clickAction: 'use' };
   sheet._prepareItem(item, ctx);
   if ('quantity' in item.system) { await sheet._prepareItemPhysical(item, ctx); }
   ctx.isExpanded = sheet.expandedSections?.get(`items.${item.id}`) === true;
   if (ctx.isExpanded) { ctx.expanded = await item.getChatData({ secrets: item.isOwner }); }
   if (item.type === 'container')
   {
      ctx.capacity = await item.system.computeCapacity();
      ctx.clickAction = 'view';
   }
   return ctx;
}

/** @returns {boolean} Whether an item is among the actor's favorites (`system.favorites`, relative UUIDs). */
function isFavorite(actor, item)
{
   const id = item.getRelativeUUID?.(actor) ?? `.Item.${item.id}`;
   return (actor.system.favorites ?? []).some((f) => f.type === 'item' && f.id === id);
}

/** One Inventory row's facts; a container's carries its contents, unless dnd5e hides them from this user. */
async function rowFacts(sheet, item, ctx, depth = 0)
{
   const uses = ctx.uses?.hasUses ? { value: ctx.uses.value ?? 0, max: ctx.uses.max, prop: ctx.uses.prop } : null;
   let sub = '';
   if (ctx.capacity && !ctx.capacity.hidden)
   {
      const max = Number.isFinite(ctx.capacity.max) ? tenths(ctx.capacity.max) : '\u221e';
      // dnd5e's units are a full label ("Pounds"); by weight we show the short one ("lb"), by count its "Items".
      const units = item.system.capacity?.count ? ctx.capacity.units ?? '' : weightUnit(item.system.capacity?.weight?.units);
      sub = `${tenths(ctx.capacity.value)} / ${max} ${units}`.trim();
   }
   let contents = null;
   if (item.type === 'container')
   {
      contents = [];
      if (item.system.canViewContents !== false && depth < MAX_DEPTH)
      {
         const inside = sheet.actor.items.filter((i) => i.system.container === item.id && (sheet._isItemVisible?.(i) ?? true))
            .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
         for (const child of inside) { contents.push(await rowFacts(sheet, child, await containedContext(sheet, child), depth + 1)); }
      }
   }
   return {
      id: item.id,
      uuid: item.uuid,
      name: item.name,
      img: item.img,
      sub,
      useAction: ctx.clickAction === 'view' ? 'view' : 'use',
      expanded: !!ctx.isExpanded,
      summary: ctx.isExpanded && ctx.expanded ? await renderTemplate(ITEM_SUMMARY, ctx.expanded) : '',
      weight: ctx.totalWeight ? `${tenths(ctx.totalWeight)} ${weightUnit(item.system.weight?.units)}`.trim() : '',
      uses,
      usage: item.isActive ? (item.labels?.activation ?? '') : '',
      quantity: item.system.quantity ?? null,
      favorite: isFavorite(sheet.actor, item),
      equip: ctx.equip?.applicable ? { on: !!item.system.equipped, disabled: !!ctx.equip.disabled } : null,
      attune: ctx.attunement?.applicable ? {
         on: !!item.system.attuned,
         disabled: !!ctx.attunement.disabled,
         need: game.i18n.localize(ctx.attunement.title ?? '')
      } : null,
      contents
   };
}

/**
 * Plain facts for the Inventory tab (src/sheet/inventory.js), from what dnd5e's `_prepareInventoryContext` and
 * `_prepareItems` put on the context (base-actor-sheet.mjs:311, 463; character-sheet.mjs:506, 874). dnd5e renders
 * every item into one hidden list and moves rows into sections in the browser; we place them here instead, by the
 * item type each section groups (`inventorySection.groups.type`).
 */
export async function inventoryFacts(sheet, context, { columns, openContainers })
{
   const actor = sheet.actor;
   const config = CONFIG.DND5E;
   const ctxs = context.itemContext ?? {};
   const sections = (context.sections ?? [])
      .filter((s) => s.groups?.type)
      .map((s) => ({ id: s.id, type: s.groups.type, label: game.i18n.localize(s.label), items: [] }));
   const other = { id: 'other', type: null, label: game.i18n.localize('FHCS.Inventory.Other'), items: [] };

   // dnd5e keeps containers out of the character's inventory list (they head its tab); here they are rows too.
   const items = [...(context.itemCategories?.inventory ?? []), ...(context.containers ?? [])]
      .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
   for (const item of items)
   {
      (sections.find((s) => s.type === item.type) ?? other).items.push(await rowFacts(sheet, item, ctxs[item.id] ?? {}));
   }

   const encumbrance = game.settings.get('dnd5e', 'encumbrance') === 'none' ? null : (() =>
   {
      const enc = actor.system.attributes?.encumbrance ?? {};
      return { value: tenths(enc.value), max: Number.isFinite(enc.max) ? tenths(enc.max) : '∞',
         pct: enc.pct ?? 0, stops: enc.stops ?? {}, units: weightUnit(enc.units) };
   })();
   const controls = context.listControls ?? {};
   return {
      sections: [...sections, other],
      columns,
      openContainers,
      editing: sheet.isEditMode,
      activeFilters: listFilters(sheet, 'inventory'),
      filters: (controls.filters ?? []).map((f) => ({ key: f.key, group: f.group ?? '', label: game.i18n.localize(f.label) })),
      sorting: (controls.sorting ?? []).map((s) => ({ key: s.key, icon: s.dataset?.icon ?? '', label: game.i18n.localize(s.label) })),
      currency: Object.entries(context.currency ?? {}).map(([key, value]) => ({
         key, value, prop: `system.currency.${key}`,
         abbr: game.i18n.localize(config.currencies?.[key]?.abbreviation ?? key),
         name: game.i18n.localize(config.currencies?.[key]?.label ?? key)
      })),
      attunement: {
         value: actor.system.attributes?.attunement?.value ?? 0,
         max: actor.system.attributes?.attunement?.max ?? 0,
         // The stored maximum, which edit mode lets the player change, as dnd5e's own counter does.
         sourceMax: actor.system._source?.attributes?.attunement?.max ?? actor.system.attributes?.attunement?.max ?? 0
      },
      encumbrance
   };
}

/** @returns {string[]} The filters set on one of the sheet's lists (dnd5e keeps them on the sheet, item-list-controls.mjs:198). */
export function listFilters(sheet, list)
{
   return [...(sheet._filters?.[list]?.properties ?? [])];
}

/**
 * Turns one of dnd5e's list filters on or off, as its filter menu does (filter-menu.mjs:15): an included or excluded
 * key is cleared, otherwise it is included. Then the list is filtered again.
 * @param {HTMLElement} controls  The list's `item-list-controls` element.
 */
export function toggleListFilter(controls, key)
{
   const properties = controls?.state?.properties;
   if (!properties) { return; }
   const active = properties.has(key) || properties.has(`!${key}`);
   properties.delete(key);
   properties.delete(`!${key}`);
   if (!active) { properties.add(key); }
   controls._applyFilters();
}

/**
 * Calls `onChange` with the filter set after every pass of dnd5e's list filter, whether our pinned buttons or its
 * own menu started it, so the pins show the menu's changes too.
 */
export function watchListFilters(controls, onChange)
{
   if (!controls || controls.fhcsWatched || typeof controls._applyFilters !== 'function') { return; }
   controls.fhcsWatched = true;
   const apply = controls._applyFilters.bind(controls);
   controls._applyFilters = () =>
   {
      apply();
      onChange([...(controls.state?.properties ?? [])]);
   };
}

/** @returns {{level: number, value: number}[]} Every spell slot pool with its level and the slots left. */
function slotPools(actor)
{
   return Object.entries(actor.system.spells ?? {})
      .filter(([, slot]) => (slot?.max ?? 0) > 0 || (slot?.value ?? 0) > 0)
      .map(([key, slot]) => ({ level: slot.level ?? (Number(key.replace(/\D/g, '')) || 0), value: slot.value ?? 0 }));
}

/** Plain facts about one spell, for its row and for our filters. */
function spellFacts(actor, item)
{
   const sys = item.system;
   const uses = sys.uses?.max ? { value: sys.uses.value ?? 0, max: sys.uses.max } : null;
   return {
      level: sys.level ?? 0,
      method: sys.method,
      prepares: !!sys.canPrepare,
      prepared: sys.prepared ?? 0,
      linked: !!sys.linkedActivity?.item || !!item.getFlag?.('dnd5e', 'cachedFor'),
      ritual: !!sys.properties?.has('ritual'),
      concentration: !!sys.properties?.has('concentration'),
      uses
   };
}

/**
 * Our extra Spellbook filters (SCOPE §4.7), for the sheet's `_filterItem`: Can cast and the components. Returns
 * false to hide the item, undefined to leave it to dnd5e's own filters.
 */
export function passesExtraFilters(actor, item, filters, keys)
{
   if (item.type !== 'spell') { return undefined; }
   const included = new Set();
   const excluded = new Set();
   for (const f of filters ?? [])
   {
      const key = f[0] === '!' ? f.slice(1) : f;
      if (!keys.includes(key)) { continue; }
      (f[0] === '!' ? excluded : included).add(key);
   }
   if (!included.size && !excluded.size) { return undefined; }
   const has = (key) => (key === 'canCast' ? canCast(spellFacts(actor, item), slotPools(actor)) : !!item.system.properties?.has(key));
   for (const key of included) { if (!has(key)) { return false; } }
   for (const key of excluded) { if (has(key)) { return false; } }
   return undefined;
}

/** Ends one concentration (dnd5e's `endConcentration`, actor.mjs:1130), which also removes what it holds up. */
export function endConcentration(actor, effectId)
{
   const effect = actor.effects.get(effectId);
   return effect ? actor.endConcentration(effect) : null;
}

/** @returns {string} A distance or other range label, as dnd5e's spell row shows it (base-actor-sheet.mjs:946). */
function rangeLabel(ctx, item)
{
   if (ctx.range?.distance) { return `${ctx.range.value ?? ''} ${game.i18n.localize(ctx.range.unit ?? '')}`.trim(); }
   return item.labels?.range ?? '';
}

/**
 * Plain facts for the Spellbook tab (src/sheet/spellbook.js), from what dnd5e's `_prepareSpellbook` and
 * `_prepareSpellsContext` put on the context (base-actor-sheet.mjs:411, 570; character-sheet.mjs:590), its spell
 * row context (`_prepareItemSpell`, :921) and the actor's concentration (actor.mjs:247).
 */
export async function spellbookFacts(sheet, context, { columns })
{
   const actor = sheet.actor;
   const config = CONFIG.DND5E;
   const ctxs = context.itemContext ?? {};

   const sections = [];
   for (const section of Object.values(context.spellbook ?? {}))
   {
      const level = section.dataset?.level ?? null;
      const slot = section.usesSlots ? foundry.utils.getProperty(actor.system.spells, section.slot) : null;
      const items = [];
      for (const item of [...section.items].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)))
      {
         const ctx = ctxs[item.id] ?? {};
         const facts = spellFacts(actor, item);
         items.push({
            ...facts,
            id: item.id,
            uuid: item.uuid,
            name: item.name,
            img: item.img,
            // dnd5e's subtitle is the granting item and the components (base-actor-sheet.mjs:990); components have a column.
            sub: String(ctx.subtitle ?? '').split('\u2022').map((part) => part.trim())
               .filter((part) => part && part !== item.labels?.components?.vsm).join(' \u00b7 '),
            favorite: isFavorite(actor, item),
            expanded: !!ctx.isExpanded,
            summary: ctx.isExpanded && ctx.expanded ? await renderTemplate(ITEM_SUMMARY, ctx.expanded) : '',
            components: item.labels?.components?.vsm ?? '',
            // Words, not dnd5e's abbreviations ("1BA"): read at a glance (SCOPE §4.5).
            time: item.labels?.activation ?? ctx.activation ?? '',
            range: rangeLabel(ctx, item),
            school: game.i18n.localize(config.spellSchools?.[item.system.school]?.label ?? ''),
            target: item.labels?.target ?? '',
            uses: ctx.uses?.hasUses ? { value: ctx.uses.value ?? 0, max: ctx.uses.max, prop: ctx.uses.prop } : null
         });
      }
      sections.push({
         id: section.slot,
         method: section.dataset?.method ?? section.id,
         level: level === null || level === '' ? null : Number(level),
         label: game.i18n.localize(section.label),
         slots: slot ? { value: slot.value ?? 0, max: slot.override ?? slot.max ?? 0 } : null,
         items
      });
   }

   const concentration = { save: actor.system.attributes?.concentration?.save ?? 0, spells: [] };
   for (const effect of actor.concentration?.effects ?? [])
   {
      const data = effect.getFlag('dnd5e', 'item');
      const item = data?.id ? actor.items.get(data.id) : null;
      const spellLevel = data?.data?.system?.level ?? item?.system.level;
      concentration.spells.push({
         effectId: effect.id,
         itemId: item?.id ?? '',
         name: item?.name ?? effect.name,
         img: item?.img ?? effect.img,
         sub: spellLevel ? (config.spellLevels?.[spellLevel] ? game.i18n.localize(config.spellLevels[spellLevel]) : '') : ''
      });
   }

   const controls = context.listControls ?? {};
   const extra = [
      { key: 'canCast', group: 'property', label: 'FHCS.Filter.canCast' },
      ...['vocal', 'somatic', 'material'].map((key) => ({ key, group: 'components', label: config.itemProperties?.[key]?.label ?? key }))
   ];
   return {
      classes: (context.spellcasting ?? []).map((k) => ({
         label: k.label,
         abbr: game.i18n.localize(config.abilities?.[k.ability?.ability]?.abbreviation ?? k.ability?.ability ?? ''),
         mod: k.ability?.mod ?? 0,
         attack: k.attack ?? 0,
         save: k.save ?? '',
         prepared: { value: k.preparation?.value ?? 0, max: k.preparation?.max ?? 0 },
         primary: !!k.primary
      })),
      concentration,
      sections,
      columns,
      editing: sheet.isEditMode,
      activeFilters: listFilters(sheet, 'spells'),
      filters: [...(controls.filters ?? []), ...extra].map((f) => ({ key: f.key, group: f.group ?? '', label: game.i18n.localize(f.label) })),
      sorting: (controls.sorting ?? []).map((s) => ({ key: s.key, icon: s.dataset?.icon ?? '', label: game.i18n.localize(s.label) }))
   };
}

/** @returns {string} How an item's uses come back, in words (dnd5e keeps abbreviations, uses-field.mjs:62). */
function recoveryWords(item)
{
   const periods = CONFIG.DND5E.limitedUsePeriods ?? {};
   return (item.system.uses?.recovery ?? []).map((r) =>
   {
      if (r.period === 'recharge') { return item.labels?.recharge ?? ''; }
      return periods[r.period] ? game.i18n.localize(periods[r.period].label) : '';
   }).filter(Boolean).join(', ');
}

/** @returns {{id, uuid, name, img}} What our cards need of an item. */
const docFacts = (item) => ({ id: item.id, uuid: item.uuid, name: item.name, img: item.img });

/** @returns {object|null} The actor's species or background item; dnd5e keeps a plain string there without one. */
const originItem = (value) => (value && typeof value === 'object' && value.id ? docFacts(value) : null);

/** The grouping a player chose for a list tab, as dnd5e's list controls store it (item-list-controls.mjs:174). */
export function listGrouping(actor, tab)
{
   return game.user.getFlag('dnd5e', `sheetPrefs.${actor.type}.tabs.${tab}.group`);
}

/**
 * Switches a list to its next grouping, as dnd5e's own group button does (`_onCycleMode`, item-list-controls.mjs:479),
 * which saves the choice and moves the rows. Returns the grouping now in force.
 * @param {HTMLElement} controls  The list's `item-list-controls` element.
 */
export async function cycleListGrouping(controls)
{
   const button = controls?._controls?.group;
   if (!button || typeof controls._onCycleMode !== 'function') { return null; }
   await controls._onCycleMode({ currentTarget: button });
   return controls.prefs?.group ?? null;
}

/**
 * Levels a class up by one, as dnd5e's level dropdown does (`#changeLevel`, base-actor-sheet.mjs:1232): through its
 * advancement manager (the level-up wizard), or a plain level change when the world turns advancements off.
 */
export async function levelUpClass(sheet, classId)
{
   const actor = sheet.actor;
   const item = actor.items.get(classId);
   if (!item || item.type !== 'class') { return null; }
   const Manager = globalThis.dnd5e?.applications?.advancement?.AdvancementManager;
   if (Manager && !game.settings.get('dnd5e', 'disableAdvancements'))
   {
      const manager = Manager.forLevelChange(actor, classId, 1);
      if (manager.steps.length) { return sheet._renderChild ? sheet._renderChild(manager) : manager.render({ force: true }); }
   }
   return item.update({ 'system.levels': item.system.levels + 1 });
}

/**
 * Plain facts for the class, species and background cards in the header (src/sheet/origins.js): each class with its
 * subclass, whether a subclass is due (dnd5e's own test, character-sheet.mjs:400), and the species and background
 * items (dnd5e keeps a plain string there when there is none).
 */
export function originFacts(sheet)
{
   const actor = sheet.actor;
   const classes = Object.values(actor.classes ?? {}).map((cls) =>
   {
      const step = cls.advancement?.byType?.Subclass?.[0];
      return {
         ...docFacts(cls),
         identifier: cls.identifier,
         level: cls.system.levels,
         subclass: cls.subclass ? docFacts(cls.subclass) : null,
         needsSubclass: !cls.subclass && !!step && step.level <= cls.system.levels
      };
   });
   const xp = actor.system.details?.xp ?? {};
   return {
      classes,
      origins: [
         { kind: 'species', item: originItem(actor.system.details?.race) },
         { kind: 'background', item: originItem(actor.system.details?.background) }
      ],
      maxLevel: CONFIG.DND5E.maxLevel ?? 20,
      xp: game.settings.get('dnd5e', 'levelingMode') === 'noxp' ? null : { value: xp.value ?? 0, max: Number.isFinite(xp.max) ? xp.max : 0 },
      canEdit: sheet.isEditable,
      editing: sheet.isEditMode
   };
}

/**
 * Plain facts for the Features tab (src/sheet/features.js), from what dnd5e's `_prepareFeaturesContext` puts on the
 * context (character-sheet.mjs:394: classes, sections with their groups, list controls) and its feature row context
 * (`_prepareItemFeature`, :850: each row's origin and activation group).
 */
export async function featuresFacts(sheet, context, { columns })
{
   const actor = sheet.actor;
   const ctxs = context.itemContext ?? {};
   const sections = (context.sections ?? []).map((s) =>
   {
      const [group, value] = Object.entries(s.groups ?? {})[0] ?? ['origin', 'other'];
      return { id: s.id, label: game.i18n.localize(s.label), group, value };
   });

   const features = [];
   const items = [...(context.itemCategories?.features ?? []), ...(context.subclasses ?? [])]
      .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
   for (const item of items)
   {
      const ctx = ctxs[item.id] ?? {};
      const uses = ctx.uses ?? {};
      features.push({
         ...docFacts(item),
         origin: ctx.groups?.origin ?? 'other',
         activation: ctx.groups?.activation ?? 'passive',
         expanded: !!ctx.isExpanded,
         summary: ctx.isExpanded && ctx.expanded ? await renderTemplate(ITEM_SUMMARY, ctx.expanded) : '',
         uses: uses.hasUses && !uses.hasRecharge ? { value: uses.value ?? 0, max: uses.max, prop: uses.prop } : null,
         recharge: uses.hasRecharge ? { cooldown: !!uses.isOnCooldown, label: item.labels?.recharge ?? '' } : null,
         usage: item.system.activities?.size ? (item.labels?.activation ?? '') : '',
         recovery: recoveryWords(item),
         favorite: isFavorite(actor, item)
      });
   }

   const controls = context.listControls ?? {};
   return {
      sections,
      features,
      columns,
      grouping: listGrouping(actor, 'features'),
      editing: sheet.isEditMode,
      activeFilters: listFilters(sheet, 'features'),
      filters: (controls.filters ?? []).map((f) => ({ key: f.key, group: f.group ?? '', label: game.i18n.localize(f.label) })),
      sorting: (controls.sorting ?? []).map((s) => ({ key: s.key, icon: s.dataset?.icon ?? '', label: game.i18n.localize(s.label) }))
   };
}

/** dnd5e's summary of an expanded effect (effects.mjs `_onToggleExpand`), drawn again when the sheet re-renders. */
const EFFECT_SUMMARY = 'systems/dnd5e/templates/effects/parts/effect-summary.hbs';

/**
 * The effect categories a character shows. dnd5e files a switched-off effect under Inactive (effects.mjs:188), so a
 * click would move its row; we keep each effect where its kind puts it, Temporary or Passive, and the switch shows
 * whether it is on (user, 2026-10-26). Suppressed stays apart: its effects can't be switched from the sheet.
 */
const EFFECT_CATEGORIES = { temporary: 'temporary', passive: 'passive', inactive: null, suppressed: 'suppressed' };

/**
 * Plain facts for the Effects tab (src/sheet/effects.js), from what dnd5e's `_prepareEffectsContext` puts on the
 * context (base-actor-sheet.mjs:250): effect categories with each effect's sheet context, and the conditions list.
 */
export async function effectsFacts(sheet, context)
{
   const actor = sheet.actor;
   const filed = { temporary: [], passive: [], suppressed: [] };
   for (const [key, target] of Object.entries(EFFECT_CATEGORIES))
   {
      for (const ctx of context.effects?.[key]?.effects ?? [])
      {
         const effect = ctx.effect;
         const relative = effect ? foundry.utils.buildRelativeUuid(effect, actor) : '';
         filed[target ?? (effect?.isTemporary ? 'temporary' : 'passive')].push({
            id: ctx.id,
            uuid: effect?.uuid ?? '',
            parentId: ctx.parentId ?? '',
            sort: effect?.sort ?? 0,
            name: ctx.name,
            img: ctx.img,
            source: ctx.source?.name ?? '',
            duration: ctx.showDuration ? (ctx.durationParts ?? []).filter(Boolean).join(' ') : '',
            disabled: !!ctx.disabled,
            // dnd5e lets the sheet switch any effect but a concentration (which ends on the Spellbook).
            toggleable: ctx.toggleable !== false,
            concentration: ctx.toggleable === false,
            expanded: !!ctx.isExpanded,
            summary: ctx.isExpanded && ctx.expanded ? await renderTemplate(EFFECT_SUMMARY, ctx.expanded) : '',
            favorite: relative ? !!actor.system.hasFavorite?.(relative) : false
         });
      }
   }
   // One order whatever the switches say: the effects' own sort, then name.
   const lang = game.i18n.lang;
   const categories = Object.entries(filed).map(([key, effects]) => ({
      id: key,
      label: game.i18n.localize(context.effects?.[key]?.label ?? key),
      effects: effects.sort((a, b) => (a.sort - b.sort) || a.name.localeCompare(b.name, lang))
   }));
   return {
      categories,
      conditions: (context.conditions ?? []).map((c) => ({
         id: c.id,
         name: game.i18n.localize(c.name),
         img: c.img,
         on: !c.disabled,
         level: c.level ?? null
      })),
      editing: sheet.isEditMode,
      canEdit: sheet.isEditable
   };
}

/** The five text boxes of dnd5e's Biography, by field: Classic's order, personality first (character-biography.hbs). */
const BIOGRAPHY_BOXES = [
   ['trait', 'DND5E.PersonalityTraits'], ['ideal', 'DND5E.Ideals'], ['bond', 'DND5E.Bonds'], ['flaw', 'DND5E.Flaws'],
   ['appearance', 'DND5E.Appearance']
];

/**
 * Plain facts for the Biography tab (src/sheet/biography.js), from dnd5e's own fields (SCOPE §4.8: text carries over
 * between sheets): `_prepareBiographyContext`'s characteristics and enriched biography (character-sheet.mjs:290),
 * and the five text boxes at `system.details.*`.
 */
export function biographyFacts(sheet, context)
{
   const details = sheet.actor.system.details ?? {};
   return {
      characteristics: (context.characteristics ?? []).map((c) => ({
         name: c.name, label: game.i18n.localize(c.label ?? ''), value: String(c.value ?? ''), source: String(c.source ?? '')
      })),
      boxes: BIOGRAPHY_BOXES.map(([key, label]) => ({
         key, name: `system.details.${key}`, label: game.i18n.localize(label), value: String(details[key] ?? '')
      })),
      biography: {
         name: 'system.details.biography.value',
         label: game.i18n.localize('DND5E.Biography'),
         enriched: context.enriched?.value ?? '',
         source: details.biography?.value ?? ''
      },
      uuid: sheet.actor.uuid,
      // Each field edits in place, locked sheet or not (user, 2026-10-26); only a viewer without rights just reads.
      editable: sheet.isEditable
   };
}

/**
 * After dnd5e's advancement finishes (`dnd5e.advancementManagerComplete`), records the order of class levels: the
 * recorded order, brought up to date by `reconcile` (src/sheet/header.js levelOrder).
 */
export async function recordLevelOrder(manager, moduleId, reconcile)
{
   const actor = manager?.actor;
   if (!actor?.isOwner || actor.type !== 'character') { return; }
   const classes = Object.entries(actor.classes ?? {}).map(([id, item]) => ({ id, levels: item.system.levels }));
   const recorded = actor.getFlag(moduleId, LEVEL_ORDER_FLAG) ?? [];
   const original = actor.items.get(actor.system.details.originalClass)?.identifier ?? '';
   const order = reconcile(recorded, classes, original);
   if (order.join() !== recorded.join()) { await actor.setFlag(moduleId, LEVEL_ORDER_FLAG, order); }
}

/** Re-renders every open sheet of ours, after a client setting it reads changes. */
export function rerenderSheets(className)
{
   for (const app of foundry.applications.instances?.values() ?? [])
   {
      if (app.constructor.name === className) { app.render(); }
   }
}

/** Registers template parts as Handlebars partials named by their paths, so card templates can include them. */
export function preloadTemplates(paths)
{
   return foundry.applications.handlebars.loadTemplates(paths);
}

/** Renders one of our templates by its Foundry path. */
export function renderTemplate(path, data)
{
   return foundry.applications.handlebars.renderTemplate(path, data);
}

/**
 * The facts our outcome line needs from a dnd5e chat message with a d20 roll, or null for any other message (and
 * for rolls the viewer may not see). Respects dnd5e's visibility settings: no verdict or hit list unless the
 * system would show them to this user.
 *
 * @param {ChatMessage} message
 * @returns {object|null} See chat/outcome.js describeRoll.
 */
export function rollFacts(message)
{
   const roll = message.rolls?.[0];
   const D20Roll = CONFIG.Dice.D20Roll;
   if (!D20Roll || !(roll instanceof D20Roll) || !roll._evaluated || !roll.validD20Roll) { return null; }
   if (!message.isContentVisible) { return null; }

   const system = message.system ?? {};
   const kind = message.type;
   const showResult = Boolean(system.displayResult ?? message.shouldDisplayChallenge);
   const target = Number.isFinite(roll.options.target) ? roll.options.target : null;
   const flavor = document.createElement('div');
   flavor.innerHTML = message.flavor ?? '';
   const d20 = roll.d20;
   return {
      messageId: message.id,
      kind,
      who: message.getAssociatedToken?.()?.name ?? message.alias ?? '',
      what: flavor.textContent.trim(),
      total: roll.total,
      natural: roll.d20.total,
      target,
      showResult,
      success: target === null ? null : Boolean(roll.isSuccess || system.forceSuccess),
      isCritical: Boolean(system.canCrit && roll.isCritical),
      targets: (kind === 'attack') && showResult
         ? (system.evaluatedTargets ?? []).map((t) => ({ name: t.name, isMiss: t.isMiss }))
         : [],
      dice: d20.results.map((r) => ({ result: r.result, active: r.active !== false, discarded: Boolean(r.discarded),
         rerolled: Boolean(r.rerolled) })),
      advantageMode: roll.options.advantageMode ?? 0,
      sides: roll.options.fhcs?.sides ?? [],
      spare: roll.options.fhcs?.spare ?? null,
      formula: roll.formula,
      math: diceMath(mathTerms(roll)).sum,
      canResist: Boolean(system.canResist),
      canEdit: canEdit(message),
      bonuses: roll.options.fhcs?.bonuses ?? []
   };
}

/** Whether this user may change a roll message: its author or the GM (Foundry's rule for updating messages). */
export function canEdit(message)
{
   return Boolean(message.isAuthor || game.user.isGM);
}

/** Whether a save or check message answers a card's save or check button (by skill, tool or ability). */
export function answersButton(message, match)
{
   if (!match) { return true; }
   const { skill, tool, ability } = message.system ?? {};
   return [skill, tool, ability].includes(match);
}

/** Whether this user may use dnd5e's apply-damage tray (the GM, or players when the world allows it). */
export function canApplyDamage()
{
   return game.user.isGM || Boolean(game.settings.get('dnd5e', 'allowPlayerDamageTray'));
}

/** dnd5e's chat trays (apply damage, apply effects) inside an element, opened: SCOPE §6.5 keeps them unfolded. */
export function openTrays(element)
{
   for (const tray of element.querySelectorAll('damage-application, effect-application')) { tray.open = true; }
}

/**
 * Points a card's "roll for" buttons at selected tokens (SCOPE §6.6): dnd5e's save and check buttons roll for
 * `message.system.evaluatedTargets`, which follows the message's targeting mode; its default is the player's targets.
 */
export function preferSelected(message)
{
   if (message._targetState && !message._targetState.mode) { message._targetState.mode = 'selected'; }
}

/**
 * The facts our damage band needs from a dnd5e damage or healing message, or null (none, or not visible).
 *
 * @param {ChatMessage} message
 * @returns {object|null} See chat/card.js damageBand.
 */
export function damageFacts(message)
{
   const DamageRoll = CONFIG.Dice.DamageRoll;
   const rolls = (message.rolls ?? []).filter((r) => DamageRoll && (r instanceof DamageRoll) && r._evaluated);
   if (!rolls.length || !message.isContentVisible) { return null; }
   const types = { ...CONFIG.DND5E.damageTypes, ...CONFIG.DND5E.healingTypes };
   const label = (type) => game.i18n.localize(types[type]?.label ?? '');
   const parts = new Map();
   for (const roll of rolls)
   {
      const type = roll.options.type ?? '';
      parts.set(type, (parts.get(type) ?? 0) + Math.max(0, roll.total));
   }
   const onSave = message.system?.onSave;
   return {
      messageId: message.id,
      canEdit: canEdit(message),
      bonuses: rolls.flatMap((r) => r.options.fhcs?.bonuses ?? []),
      healing: message.type === 'healing',
      critical: rolls.some((r) => r.isCritical),
      total: rolls.reduce((sum, r) => sum + Math.max(0, r.total), 0),
      parts: [...parts].map(([type, total]) => ({ type, label: label(type), total })),
      math: rolls.map((r) =>
      {
         const { sum, dropped } = diceMath(mathTerms(r));
         return { formula: r.formula, result: `${sum} = ${r.total}`, label: label(r.options.type), dropped };
      }),
      onSave: onSave
         ? game.i18n.localize(`DND5E.SAVE.FIELDS.damage.onSave.${onSave[0].toUpperCase()}${onSave.slice(1)}`)
         : ''
   };
}

/**
 * A Foundry roll's terms as the plain terms chat/math.js writes out: every die's value and whether it counts.
 *
 * @param {Roll} roll
 * @returns {object[]}
 */
export function mathTerms(roll)
{
   const { DiceTerm, OperatorTerm, ParentheticalTerm } = foundry.dice.terms;
   return roll.terms.map((term) =>
   {
      if (term instanceof OperatorTerm) { return { op: term.operator }; }
      if (term instanceof DiceTerm)
      {
         return { dice: term.results.map((r) => ({ value: r.result, counts: (r.active !== false) && !r.discarded })) };
      }
      if ((term instanceof ParentheticalTerm) && term.roll) { return { group: mathTerms(term.roll) }; }
      return { value: term.total ?? term.expression };
   });
}

/**
 * Roll messages of the given types made from a usage card's buttons, oldest first, that this user may see.
 *
 * @param {ChatMessage} usage   The usage card's message.
 * @param {string[]} types      'attack', 'damage', 'healing', 'save', 'check'.
 */
export function rollsFrom(usage, types)
{
   if (!usage.id) { return []; }
   return types.flatMap((type) => usage.getAssociatedRolls?.(type) ?? [])
      .filter((m) => m.visible)
      .sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Rolls a card's damage the way dnd5e's Damage button does (last attack's ability, ammunition and mode; the card's
 * scaling and targets), as a critical or not, without the damage dialog, linked to the card (`system.origin`).
 *
 * @param {ChatMessage} usage
 * @param {object} options
 * @param {boolean} options.isCritical
 * @param {Event} [options.event]   The click, when there is one.
 */
export async function rollCardDamage(usage, { isCritical, event = null })
{
   const activity = usage.getAssociatedActivity?.({ scaled: true });
   if (!activity?.rollDamage || !activity.damage?.parts?.length) { return; }
   const lastAttack = usage.getAssociatedRolls('attack').at(-1);
   const { ability, ammunitionItem: ammunition, mode: attackMode } = lastAttack?.system ?? {};
   await activity.rollDamage({ event, ability, ammunition, attackMode, isCritical }, { configure: false },
      { data: { system: { origin: usage.id, targets: usage.system.targets } } });
}

/** Whether dnd5e's "skip dialog" key (Shift by default, rebindable) is held for this event. */
export function skipKeyHeld(event)
{
   return Boolean(event && globalThis.dnd5e?.utils?.areKeysPressed?.(event, 'skipDialogNormal'));
}

/** The usage card a roll message was made from, if it is one. */
export function usageOrigin(message)
{
   const origin = message.system?.origin;
   return origin?.type === 'usage' ? origin : null;
}

/** The request card a roll answers (dnd5e flags each result `requestResult`), if it is still there. */
export function requestOf(message)
{
   const requestId = message.getFlag?.('dnd5e', 'requestResult')?.requestId;
   return requestId ? (game.messages.get(requestId) ?? null) : null;
}

/** One d20 rolled now, from Foundry's random source (synchronous, for roll hooks that can't wait). */
export function d20Now()
{
   return Math.ceil(CONFIG.Dice.randomUniform() * 20);
}

/** Whether a roll is one of dnd5e's d20 rolls (checks, saves, attacks). */
export function isD20Roll(roll)
{
   const D20Roll = CONFIG.Dice.D20Roll;
   return Boolean(D20Roll) && (roll instanceof D20Roll);
}

/** One d20 rolled now, with Dice So Nice's animation when it is active. */
async function freshD20()
{
   const roll = await new Roll('1d20').evaluate();
   await game.dice3d?.showForRoll?.(roll, game.user, true);
   return roll.total;
}

/** A roll's copy to change, and the message update that saves it in place of the original. */
function editable(message, index)
{
   const roll = message.rolls?.[index];
   if (!roll) { return null; }
   const copy = roll.constructor.fromData(roll.toJSON());
   copy.options.fhcs = { ...copy.options.fhcs };
   const save = () =>
   {
      copy._total = copy._evaluateTotal();
      copy.resetFormula();
      return message.update({ rolls: message.rolls.map((r, i) => (i === index ? copy : r)) });
   };
   return { copy, save };
}

/**
 * Late advantage or disadvantage (SCOPE §6.6): adds a d20 on one side of a d20 roll (at most five a side), keeps
 * every die already there, recomputes which die counts by click order, and saves the roll in place. The first die
 * added is the spare rolled in advance.
 *
 * @param {ChatMessage} message   A check, save or attack message.
 * @param {'adv'|'dis'} side
 */
export async function addD20(message, side)
{
   if (!isD20Roll(message.rolls?.[0]) || !canEdit(message)) { return; }
   const { copy, save } = editable(message, 0);
   const d20 = copy.d20;
   const live = d20.results.filter((r) => !r.rerolled);
   const mode = copy.options.advantageMode ?? 0;
   const sides = copy.options.fhcs.sides ?? live.slice(1).map(() => (mode === -1 ? 'dis' : 'adv'));
   if (sides.filter((s) => s === side).length >= MAX_PER_SIDE) { return; }
   const value = copy.options.fhcs.spare ?? await freshD20();
   const added = { result: value, active: true };
   d20.results.push(added);
   const all = [...live, added];
   sides.push(side);
   const keep = countingDie(all.map((r) => r.result), sides);
   all.forEach((r, i) => { r.active = i === keep; r.discarded = i !== keep; });
   d20.modifiers = d20.modifiers.filter((m) => !/^(adv|dis|kh|kl)/i.test(m));
   copy.options.advantageMode = modeForSides(sides);
   d20.options.advantageMode = copy.options.advantageMode;
   copy.options.fhcs.sides = sides;
   copy.options.fhcs.spare = null;
   await save();
}

/**
 * A late bonus or penalty (SCOPE §6.4): rolls a number or dice formula ("2", "1d4", "-1d4") and adds it to a roll as
 * its own term, then saves the roll in place.
 *
 * @param {ChatMessage} message
 * @param {string} formula
 * @param {number} [index]   Which of the message's rolls (damage messages may hold several).
 * @returns {Promise<boolean>} False when the formula isn't a roll.
 */
export async function addBonus(message, formula, index = 0)
{
   const text = formula.trim();
   if (!text || !Roll.validate(text) || !canEdit(message)) { return false; }
   const target = editable(message, index);
   if (!target) { return false; }
   const bonus = await new Roll(text, target.copy.data).evaluate();
   if (!bonus.isDeterministic) { await game.dice3d?.showForRoll?.(bonus, game.user, true); }
   const terms = bonus.terms;
   if (!(terms[0] instanceof foundry.dice.terms.OperatorTerm))
   {
      target.copy.terms.push(new foundry.dice.terms.OperatorTerm({ operator: '+' }));
   }
   target.copy.terms.push(...terms);
   target.copy.options.fhcs.bonuses = [...(target.copy.options.fhcs.bonuses ?? []), { formula: bonus.formula, total: bonus.total }];
   await target.save();
   return true;
}

/**
 * Re-renders the usage card a roll belongs to, on every client, when the roll changes in place. dnd5e refreshes the
 * card only when a roll's `system` data changes (`ChatMessage5e#_onUpdate`); late adds change its rolls.
 *
 * @param {ChatMessage} message
 */
export async function refreshCard(message)
{
   const request = requestOf(message);
   if (request) { ui.chat?.updateMessage(request); }
   const origin = usageOrigin(message);
   if (!origin) { return; }
   await origin.system?.onDescendentRefresh?.(message);
   ui.chat?.updateMessage(origin);
}

/** How long after posting a card the log keeps following it down as its rolls fill in. */
const FOLLOW_MS = 8000;

/**
 * Keeps the chat log where the player wants it (user, 2026-10-24). Checked against Foundry 14's ChatLog
 * (`postOne(message, { notify, scroll })`: scroll true always scrolls, false never, omitted is Foundry's own choice;
 * `updateMessage`, `scrollBottom`).
 *
 * - A roll drawn inside a card (folded) posts with no scroll and no notification: re-rolling on a card higher up
 *   the log doesn't move the log.
 * - A new card this player makes always scrolls the log to the bottom, then follows it down for a few seconds while
 *   its attack and damage fold in and it grows (each redraw, and any change in its size). Scrolling, clicking or
 *   typing in the log ends the follow at once.
 *
 * Logs and leaves chat alone if Foundry renames these methods.
 *
 * @param {Function} isQuiet   (message) => true for a folded roll.
 * @returns {boolean} Whether the chat log was wrapped.
 */
export function quietPosts(isQuiet)
{
   const proto = ui.chat?.constructor?.prototype;
   if (!proto || !['postOne', 'scrollBottom', 'updateMessage'].every((m) => typeof proto[m] === 'function'))
   {
      console.warn('fhcs | ChatLog#postOne, #scrollBottom or #updateMessage not found; the chat log scrolls as Foundry decides.');
      return false;
   }
   if (proto.postOne.fhcsQuiet) { return true; }
   const { postOne, updateMessage } = proto;
   const follow = { id: null, until: 0, observer: null };
   const following = (id) => Boolean(id) && (id === follow.id) && (Date.now() < follow.until);
   const stopFollowing = () => { follow.id = null; follow.observer?.disconnect(); follow.observer = null; };
   // A card keeps growing after it is placed (dnd5e builds its trays' lists, images load); watch its size while
   // following and scroll again each time it changes.
   const watchCard = (log, id) =>
   {
      follow.observer?.disconnect();
      const card = log.element?.querySelector?.(`[data-message-id="${id}"]`);
      if (!card || (typeof ResizeObserver !== 'function')) { return; }
      follow.observer = new ResizeObserver(() => { if (following(id)) { log.scrollBottom(); } else { stopFollowing(); } });
      follow.observer.observe(card);
   };

   proto.postOne = async function (message, options = {})
   {
      if (isQuiet(message)) { return postOne.call(this, message, { ...options, notify: false, scroll: false }); }
      if (!message.isAuthor) { return postOne.call(this, message, options); }
      watchForPlayer(this, stopFollowing);
      Object.assign(follow, { id: message.id, until: Date.now() + FOLLOW_MS });
      const result = await postOne.call(this, message, { ...options, scroll: true });
      watchCard(this, message.id);
      return result;
   };
   proto.postOne.fhcsQuiet = true;

   proto.updateMessage = async function (message, ...rest)
   {
      const result = await updateMessage.call(this, message, ...rest);
      if (following(message?.id))
      {
         watchCard(this, message.id);
         await this.scrollBottom({ waitImages: true });
      }
      return result;
   };
   return true;
}

/** Ends a follow the moment the player scrolls, clicks or types in the chat log themselves. */
function watchForPlayer(log, stop)
{
   const element = log.element;
   if (!element || element.dataset.fhcsWatched) { return; }
   element.dataset.fhcsWatched = 'true';
   for (const type of ['wheel', 'touchmove', 'pointerdown', 'keydown'])
   {
      element.addEventListener(type, stop, { passive: true, capture: true });
   }
}

/** Shows Foundry's tooltip on an element, above it (our delayed tooltips; chat/card.js). */
export function showTooltip(element, text)
{
   game.tooltip?.activate?.(element, { text, direction: 'UP' });
}

/** Hides Foundry's tooltip. */
export function hideTooltip()
{
   game.tooltip?.deactivate?.();
}
