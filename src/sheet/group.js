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

/** The three skills a member row rolls, dnd5e's own (group/member.hbs): Perception, Stealth, Survival. */
export const MEMBER_SKILLS = ['prc', 'ste', 'sur'];

/** @returns {number} A percentage clamped to 0–100. */
const pct = (value, max) => (max ? Math.max(0, Math.min(100, Math.round((Number(value) || 0) / max * 100))) : 0);

/**
 * Everything the Members tab shows (SCOPE §4.13, the group sheet): rows in sections Characters, NPCs, Vehicles.
 * @param {object} facts  From compat.groupMembersFacts (or a fixture): `sections` of `members`, `editing`.
 * @param {{format: Function, localize: Function}} i18n
 */
export function groupMembersView(facts, { format, localize })
{
   const editing = !!facts.editing;
   const row = (m, vehicle) =>
   {
      const hidden = !!m.hidden;
      const hp = !hidden && m.hp?.max ? { pct: pct(m.hp.value, m.hp.max), text: `${m.hp.value} / ${m.hp.max}`,
         label: format('FHCS.Group.HpLabel', { name: m.name, value: m.hp.value, max: m.hp.max }) } : null;
      const hd = !hidden && !vehicle && m.hd?.max ? { text: `${m.hd.value} / ${m.hd.max}` } : null;
      const skills = vehicle ? [] : MEMBER_SKILLS.map((key) =>
      {
         const s = m.skills?.[key];
         if (hidden || !s) { return { key, dash: true }; }
         const total = `${s.total >= 0 ? '+' : '−'}${Math.abs(s.total)}`;
         return { key, total, passive: s.passive, rollable: !!s.rollable,
            label: format('FHCS.Group.SkillLabel', { skill: localize(`FHCS.Group.Skill.${key}`), name: m.name, passive: s.passive }) };
      });
      return {
         uuid: m.uuid,
         name: m.name,
         img: m.img,
         isVideo: !!m.isVideo,
         canView: !!m.canView,
         openLabel: format('FHCS.Group.OpenLabel', { name: m.name }),
         hidden,
         hp,
         hd,
         primary: !!m.primary,
         ac: hidden ? '—' : (m.ac ?? '—'),
         speed: hidden ? '—' : (m.speed || '—'),
         slowed: !hidden && !!m.slowed,
         // A vehicle's damage threshold sits in the first skill column (the board, 2026-11-10).
         dt: vehicle ? (hidden ? '—' : (m.dt || '—')) : null,
         skills,
         removeLabel: format('FHCS.Group.RemoveLabel', { name: m.name })
      };
   };
   const sections = (facts.sections ?? []).filter((s) => s.members?.length).map((s) =>
   {
      const vehicle = s.id === 'vehicle';
      return {
         id: s.id,
         vehicle,
         label: localize(`FHCS.Group.Section.${s.id}`),
         count: s.members.length,
         speedHead: localize(vehicle ? 'FHCS.Group.TravelLabel' : 'FHCS.Group.Speed'),
         heads: vehicle ? [localize('FHCS.Group.Dt')] : MEMBER_SKILLS.map((key) => localize(`FHCS.Group.Skill.${key}`)),
         members: s.members.map((m) => row(m, vehicle))
      };
   });
   return {
      editing,
      sections,
      empty: !sections.length,
      text: {
         ac: localize('FHCS.Group.Ac'),
         hp: localize('FHCS.Group.Hp'),
         hd: localize('FHCS.Group.Hd'),
         hidden: localize('FHCS.Group.Hidden'),
         primary: localize('FHCS.Group.Primary'),
         slowed: localize('FHCS.Group.MemberSlowed'),
         empty: localize('FHCS.Group.Empty')
      }
   };
}
