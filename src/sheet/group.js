/**
 * The group sheet's display values (SCOPE §4.13, the group sheet), from plain facts. Pure, like header.js: the unit
 * check and the layout fixtures use the same code. `compat.groupHeaderFacts` gathers the facts from dnd5e.
 */

/** The travel types dnd5e paces, in its header's order (group/header.hbs). */
export const TRAVEL_TYPES = ['land', 'water', 'air'];

/**
 * Everything the group's header shows.
 * @param {object} facts  From compat.groupHeaderFacts (or a fixture).
 * @param {{format: Function, localize: Function}} i18n
 */
export function groupHeaderView(facts, { format, localize })
{
   const count = facts.members ?? 0;
   const people = format(count === 1 ? 'FHCS.Group.MemberOne' : 'FHCS.Group.MemberMany', { count });
   // "4 members · average level 6"; a group of vehicles or newcomers has no level to average.
   const summary = facts.level ? `${people} · ${format('FHCS.Group.AverageLevel', { level: facts.level })}` : people;
   const travel = facts.travel ?? {};
   const editing = !!facts.editing;
   return {
      name: facts.name,
      nameSource: facts.nameSource ?? facts.name,
      img: facts.img,
      editing,
      summary,
      rests: (facts.rests ?? []).map((r) => ({ key: r.key, label: r.label, short: r.key === 'short' })),
      travel: {
         pace: travel.pace ?? '',
         slowed: !!travel.slowed,
         // In play the pace steps with ‹ ›, when the group sets it (not a ship's); edit mode has dnd5e's gear instead.
         arrows: !editing && !!travel.available,
         gear: editing,
         slowedLabel: travel.slowed ? localize('FHCS.Group.Slowed') : '',
         speeds: TRAVEL_TYPES.map((key) =>
         {
            const value = travel.speeds?.[key];
            return { key, label: localize(`FHCS.Group.Travel.${key}`), value: value ? `${value} ${travel.units ?? ''}`.trim() : '—' };
         })
      },
      xp: facts.xp?.show ? { value: facts.xp.value ?? '', text: facts.xp.text ?? (facts.xp.value || '—') } : null,
      text: {
         name: localize('FHCS.Group.Name'),
         place: localize('FHCS.Group.Place'),
         travel: localize('FHCS.Group.TravelLabel'),
         slower: localize('FHCS.Group.Slower'),
         faster: localize('FHCS.Group.Faster'),
         travelConfig: localize('FHCS.Group.TravelConfig'),
         advancement: localize('FHCS.Group.Advancement'),
         award: localize('FHCS.Group.Award'),
         xpPool: localize('FHCS.Group.XpPool')
      }
   };
}
