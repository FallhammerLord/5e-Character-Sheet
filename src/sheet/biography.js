/**
 * The Biography tab's display values (SCOPE §4.8), from plain facts. Pure, like effects.js: the unit check and the
 * layout fixtures use the same code. `compat.biographyFacts` gathers the facts from dnd5e's own fields.
 */

/** @returns {string[]} A text box's paragraphs: its lines, blank ones dropped. */
export function paragraphs(text)
{
   return String(text ?? '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

/** Which boxes stand in the left column; the rest (appearance) go right, above the biography. */
const LEFT = ['trait', 'ideal', 'bond', 'flaw'];

/**
 * Everything the Biography tab shows. In play it reads, and empty fields are hidden, as Traits on Attributes are; in
 * edit mode every field shows, as dnd5e's inputs under dnd5e's names, so text carries over between sheets.
 * @param {object} facts  From compat.biographyFacts (or a fixture).
 * @param {{format: Function, localize: Function}} i18n
 */
export function biographyView(facts, { localize })
{
   const editing = !!facts.editing;
   const characteristics = (facts.characteristics ?? [])
      .filter((c) => editing || c.value.trim())
      .map((c) => ({ ...c }));
   const box = (b) => ({ ...b, paragraphs: paragraphs(b.value) });
   const boxes = (facts.boxes ?? []).filter((b) => editing || b.value.trim()).map(box);
   const bio = facts.biography ?? {};
   const hasBio = !!String(bio.enriched ?? '').replace(/<[^>]*>/g, '').trim();
   return {
      editing,
      uuid: facts.uuid ?? '',
      characteristics,
      left: boxes.filter((b) => LEFT.includes(b.key)),
      right: boxes.filter((b) => !LEFT.includes(b.key)),
      biography: editing || hasBio ? { ...bio } : null,
      empty: !editing && !characteristics.length && !boxes.length && !hasBio,
      text: { empty: localize('FHCS.Biography.Empty') }
   };
}
