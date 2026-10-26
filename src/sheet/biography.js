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
 * Everything the Biography tab shows. Whoever may edit the character sees every field, each editable where it stands,
 * locked sheet or not (user, 2026-10-26): dnd5e's inputs under dnd5e's names, so text carries over between sheets. A
 * viewer without edit rights reads, with empty fields hidden, as Traits on Attributes are.
 * @param {object} facts  From compat.biographyFacts (or a fixture).
 * @param {{format: Function, localize: Function}} i18n
 */
export function biographyView(facts, { localize })
{
   const editable = !!facts.editable;
   const characteristics = (facts.characteristics ?? [])
      .filter((c) => editable || c.value.trim())
      .map((c) => ({ ...c }));
   const box = (b) => ({ ...b, paragraphs: paragraphs(b.value) });
   const boxes = (facts.boxes ?? []).filter((b) => editable || b.value.trim()).map(box);
   const bio = facts.biography ?? {};
   const hasBio = !!String(bio.enriched ?? '').replace(/<[^>]*>/g, '').trim();
   return {
      editable,
      uuid: facts.uuid ?? '',
      characteristics,
      left: boxes.filter((b) => LEFT.includes(b.key)),
      right: boxes.filter((b) => !LEFT.includes(b.key)),
      biography: editable || hasBio ? { ...bio } : null,
      empty: !editable && !characteristics.length && !boxes.length && !hasBio,
      text: { empty: localize('FHCS.Biography.Empty') }
   };
}
