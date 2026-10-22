/**
 * Our character sheet: dnd5e's own sheet class with our layout. Built from the class dnd5e provides at init,
 * since a module can't import from the system by path.
 *
 * Phase 0: dnd5e's parts unchanged, plus our class for styling. Later phases replace PARTS with our templates.
 */
export function makeCharacterSheet(Base)
{
   return class FHCSCharacterSheet extends Base
   {
      static DEFAULT_OPTIONS = {
         classes: ['fhcs-sheet']
      };
   };
}
