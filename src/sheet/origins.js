/**
 * The class, species and background cards in the header (SCOPE §4.1, §4.8), and the Level up choices in the level
 * pill's tray. Pure, like header.js: `compat.originFacts` gathers the facts from dnd5e.
 */

/** Class cards shown on the sheet; further classes fold into the class tray on the last card. */
export const MAX_CLASS_CARDS = 2;

/**
 * How many ability-grid columns each card spans (user, 2026-10-26): the cards sit on the ability row's grid, so they
 * line up with it and scale with it. Species and background take 2 columns each; the classes share the rest, 2 at
 * the least, and wrap to a further row when there are too many to share it.
 * @param {number} columns  The grid's columns (AC, Init and one per ability: 8 with six abilities).
 * @param {number} classes  How many class cards.
 * @returns {number[]} One span per class card.
 */
export function classSpans(columns, classes)
{
   if (!classes) { return []; }
   // Two class cards at most (user, 2026-10-27): the rest are in the class tray, so the cards always fit one row.
   classes = Math.min(classes, MAX_CLASS_CARDS);
   const room = Math.max(2, columns - 4);
   if (classes * 2 > room) { return Array(classes).fill(2); }
   const base = Math.floor(room / classes);
   // The first classes take any odd column left over, so the row is filled edge to edge.
   return Array.from({ length: classes }, (_, i) => base + (i < room - base * classes ? 1 : 0));
}

/**
 * The cards: each class, then species, then background, each alike (a kind label, then the name, which opens the
 * item) with the item's art as an underlay; a dashed Subclass or Choose where something is missing; in edit mode a
 * remove (dnd5e's delete, which asks first).
 * @param {object} facts  From compat.originFacts (or a fixture).
 * @param {number} columns  The ability grid's columns.
 */
export function originCards(facts, columns, { format, localize })
{
   const canEdit = !!facts.canEdit;
   const canClear = canEdit && !!facts.editing;
   const open = (doc) => ({ ...doc, openLabel: format('FHCS.Features.OpenLabel', { name: doc.name }) });
   const clear = (doc) => (canClear ? { uuid: doc.uuid, label: format('FHCS.Features.ClearLabel', { name: doc.name }) } : null);
   const classes = [...(facts.classes ?? [])].sort((a, b) => b.level - a.level);
   const spans = classSpans(columns, classes.length || (canEdit ? 1 : 0));
   const classCard = (k) => ({
      isClass: true,
      kind: localize('FHCS.Features.Class'),
      art: k.img,
      item: { ...open(k), clear: clear(k) },
      // The level beside the name ("Cleric 9"); Level up itself is in the level pill's tray.
      level: String(k.level),
      // The subclass takes its own line (user, 2026-10-27: the cards reach the portrait card's foot, so there's room).
      sub: k.subclass ? { ...open(k.subclass), clear: clear(k.subclass) } : null,
      // A subclass due: its Subclass advancement reached and none owned, dnd5e's own test (character-sheet.mjs:400).
      choose: !k.subclass && k.needsSubclass && canEdit ? {
         type: 'subclass', identifier: k.identifier, text: localize('FHCS.Features.Subclass'),
         label: format('FHCS.Features.ChooseSubclassLabel', { name: k.name })
      } : null
   });
   const shown = classes.slice(0, MAX_CLASS_CARDS);
   const folded = classes.slice(MAX_CLASS_CARDS).map(classCard);
   const cards = shown.map((k, i) => ({
      ...classCard(k),
      span: spans[i],
      // The last card carries a "+N" chip that opens the class tray (user, 2026-10-27).
      more: i === shown.length - 1 && folded.length ? {
         text: `+${folded.length}`, label: format('FHCS.Header.MoreClasses', { n: folded.length }),
         title: localize('FHCS.Header.MoreClassesTitle'), classes: folded
      } : null
   }));
   // No class yet: a card to choose one, as dnd5e offers in play too (`showClassDrop`, character-sheet.mjs:463).
   if (!classes.length && canEdit)
   {
      const kind = localize('FHCS.Features.Class');
      cards.push({ isClass: true, kind, span: spans[0], art: '', item: null, choose: {
         type: 'class', identifier: '', text: localize('FHCS.Features.Choose'), label: format('FHCS.Features.ChooseLabel', { kind })
      } });
   }
   for (const o of facts.origins ?? [])
   {
      const kind = localize(`FHCS.Features.Origin.${o.kind}`);
      cards.push({
         kind,
         span: 2,
         art: o.item?.img ?? '',
         item: o.item ? { ...open(o.item), clear: clear(o.item) } : null,
         // dnd5e allows one species and one background (`singleton`): to change one, remove it, then choose.
         choose: !o.item && canEdit ? {
            type: o.kind === 'species' ? 'race' : o.kind, identifier: '', text: localize('FHCS.Features.Choose'),
            label: format('FHCS.Features.ChooseLabel', { kind })
         } : null
      });
   }
   return cards;
}

/**
 * The Level up section of the level pill's tray (user, 2026-10-26): one button per class (dnd5e's level-up wizard)
 * and New class (dnd5e's class browser; adding a class runs its wizard). Null for a viewer, or at the top level.
 * In XP mode, `ready` marks the pill once the XP for the next level is reached.
 */
export function levelUpChoices(facts, { format, localize })
{
   const total = (facts.classes ?? []).reduce((n, k) => n + (Number(k.level) || 0), 0);
   if (!facts.canEdit || total >= (facts.maxLevel ?? 20)) { return null; }
   const xp = facts.xp;
   return {
      ready: !!xp && xp.max > 0 && xp.value >= xp.max,
      classes: [...(facts.classes ?? [])].sort((a, b) => b.level - a.level).map((k) => ({
         id: k.id,
         name: k.name,
         from: k.level,
         next: k.level + 1,
         label: format('FHCS.Header.LevelUpClass', { name: k.name, level: k.level + 1 })
      })),
      newClass: localize('FHCS.Header.NewClass'),
      title: localize('FHCS.Features.LevelUp')
   };
}
