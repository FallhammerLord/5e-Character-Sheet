import { MODULE_ID, MODULE_PATH, THEME_FLAG } from '../constants.js';
import { extraHeaderControls, itemSheetFacts, toggleItemField } from '../compat.js';
import { comfortWidth, tabRow } from '../sheet/header.js';
import { itemSheetView } from '../sheet/item.js';
import { delayTips } from '../chat/card.js';

/** Our item sheet's own parts, by dnd5e's part ID: the header, the tab row and the Description tab (SCOPE §4.13). */
export const ITEM_PARTS = {
   header: `${MODULE_PATH}/templates/item/header.hbs`,
   tabs: `${MODULE_PATH}/templates/sheet/tabs.hbs`,
   description: `${MODULE_PATH}/templates/item/description.hbs`
};

/** Partials our parts include, loaded with them. */
const ITEM_PART_OPTIONS = {
   header: { templates: [`${MODULE_PATH}/templates/sheet/conc-c.hbs`] },
   tabs: { templates: [`${MODULE_PATH}/templates/sheet/gear.hbs`] }
};

/** The narrowest an item sheet may be (SCOPE §4.13: dnd5e's own width). */
const ITEM_MIN_WIDTH = 500;

/** dnd5e's parts with ours swapped in; the rest (Details, Activities, Effects, Advancement) keep dnd5e's forms. */
function itemParts(baseParts)
{
   return Object.fromEntries(Object.entries(baseParts ?? {}).map(([id, part]) =>
   {
      if (!ITEM_PARTS[id]) { return [id, part]; }
      const kept = { ...part, template: ITEM_PARTS[id] };
      delete kept.templates;
      return [id, { ...kept, ...ITEM_PART_OPTIONS[id] }];
   }));
}

/**
 * An item wears its owner's theme, else the world's (SCOPE §4.13); and the player's Motion switch, as a sheet does.
 * @param {HTMLElement} element
 * @param {Item} item
 */
function itemTheme(element, item)
{
   const owner = item.actor;
   const theme = owner?.getFlag(MODULE_ID, THEME_FLAG) || game.settings.get(MODULE_ID, 'theme');
   if (theme && theme !== 'plain') { element.dataset.fhcsTheme = theme; }
   else { delete element.dataset.fhcsTheme; }
   if (game.settings.get(MODULE_ID, 'motion')) { delete element.dataset.fhcsMotion; }
   else { element.dataset.fhcsMotion = 'off'; }
}

/** A header toggle: equipped, attuned, identified or prepared. */
function itemToggle(event, target)
{
   return toggleItemField(this.item, target.dataset.key);
}

/**
 * Our item sheet (SCOPE §4.13, user 2026-10-28): dnd5e's own item sheet class with our header, tab row and Description
 * tab, built from the class dnd5e provides at init. Details, Activities, Effects and Advancement keep dnd5e's forms,
 * so the window keeps dnd5e's `dnd5e2` look for them; ours sit on top in our tokens.
 */
export function makeItemSheet(Base)
{
   return class FHCSItemSheet extends Base
   {
      // Resizable the usual way (user, 2026-10-28; dnd5e's own item sheet is not), a height to start from.
      static DEFAULT_OPTIONS = {
         classes: ['fhcs-sheet', 'fhcs-item-sheet'],
         position: { width: 560, height: 640 },
         window: { resizable: true },
         actions: { fhcsItemToggle: itemToggle }
      };

      /**
       * No lock: an item sheet is editable whenever Foundry says it is (the owner, outside a locked compendium:
       * `DocumentSheetV2#isEditable`), as Foundry's own sheets are (user, 2026-10-28: "presumed editable"). dnd5e's
       * play mode would disable every field; ours always opens in its edit mode for whoever may edit.
       */
      _configureRenderOptions(options)
      {
         if (this.isEditable) { options.mode = this.constructor.MODES?.EDIT ?? options.mode; }
         super._configureRenderOptions(options);
      }

      static PARTS = itemParts(Base.PARTS);

      /** dnd5e's ⋮ menu, with every other title-bar button added (SCOPE §5.2 rule 14). */
      * _getHeaderControlContextEntries()
      {
         yield* super._getHeaderControlContextEntries();
         yield* extraHeaderControls(this.element);
      }

      /** @inheritDoc */
      async _preparePartContext(partId, context, options)
      {
         context = await super._preparePartContext(partId, context, options);
         const i18n = { localize: (key) => game.i18n.localize(key), format: (key, data) => game.i18n.format(key, data) };
         if (partId === 'header' || partId === 'description')
         {
            context.fhcsItem = itemSheetView(itemSheetFacts(this, context), i18n);
         }
         if (partId === 'tabs')
         {
            // dnd5e's own tab names (an item's Details is not the character's Attributes); the lock at the row's end.
            // No lock (`canEdit: false` draws none): see `_configureRenderOptions`.
            context.fhcsTabs = tabRow(context.tabs, { canEdit: false, editing: this.isEditMode }, i18n.localize, {}, []);
         }
         return context;
      }

      /** Never narrower than dnd5e's own width; held at the comfort stops while dragged (SCOPE §4.1). */
      _updatePosition(position)
      {
         if (typeof position.width === 'number') { position.width = comfortWidth(position.width, ITEM_MIN_WIDTH); }
         return super._updatePosition(position);
      }

      /** @inheritDoc */
      async _onRender(context, options)
      {
         await super._onRender(context, options);
         itemTheme(this.element, this.item);
         delayTips(this.element);
      }
   };
}
