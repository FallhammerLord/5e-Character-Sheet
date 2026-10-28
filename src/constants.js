export const MODULE_ID = 'fhcs';
export const MODULE_PATH = `modules/${MODULE_ID}`;

/** Our sheet class's name; Foundry files the sheet under `${scope}.${class name}`. */
export const SHEET_CLASS_NAME = 'FHCSCharacterSheet';
export const SHEET_ID = `${MODULE_ID}.${SHEET_CLASS_NAME}`;

/**
 * dnd5e 6.0's character sheet actions (`DEFAULT_OPTIONS.actions`), which our markup relies on. The Quench tests
 * fail if dnd5e drops one. See docs/research/dnd5e-6.0-sheet.md.
 */
export const SYSTEM_ACTIONS = [
   'changeMode', 'rest', 'restoreTransformation', 'roll', 'showArtwork', 'showConfiguration', 'togglePip', 'toggleSidebar',
   'deleteFavorite', 'deleteOccupant', 'findItem', 'setSpellcastingAbility', 'showDocument', 'deleteDocument', 'toggleDeathTray', 'toggleInspiration',
   'useFacility', 'useFavorite'
];

/** The actor flag holding the portrait's framing (user, 2026-10-27): { src, x, y, zoom }, x and y in percent. */
export const PORTRAIT_FLAG = 'portrait';

/** The actor flag holding the portrait's shape (user, 2026-10-27): 'round' or 'square'; unset, a token is round. */
export const SHAPE_FLAG = 'portraitShape';

/** Actor flag: which item, by id, each resource panel shows in place of dnd5e's own resource ({ primary: id }). */
export const RESOURCES_FLAG = 'resources';

/** The sheet's themes (SCOPE §4.11), by key; `plain` is today's look. Actor flag `flags.fhcs.theme` picks one per
    character; without it, the world setting `fhcs.theme` applies. */
export const THEMES = ['plain', 'forge', 'wind', 'sand', 'valley'];
export const THEME_FLAG = 'theme';

/** Message flag: what a card's Apply did, one entry per target and click (`compat.watchApplications`). */
export const APPLIED_FLAG = 'applied';
