/**
 * The vehicle sheet's display values (SCOPE §4.13, the vehicle sheet), from plain facts. Pure, like group.js: the unit
 * check and the layout fixtures use the same code. `compat.vehicleHeaderFacts` and its siblings gather the facts.
 */
import { abilityView } from './header.js';

/** @returns {number} A percentage clamped to 0–100. */
const pct = (value, max) => (max ? Math.max(0, Math.min(100, Math.round((Number(value) || 0) / max * 100))) : 0);

/**
 * Everything the vehicle's header shows: the name, its line, action pips, the card row (Hull, AC, Speed, and Initiative
 * and Quality when shown), the ability row when shown, and edit mode's tray of display options.
 * @param {object} facts  From compat.vehicleHeaderFacts (or a fixture).
 * @param {{format: Function, localize: Function}} i18n
 */
export function vehicleHeaderView(facts, { format, localize })
{
   const editing = !!facts.editing;
   const hp = facts.hp ?? {};
   const thresholds = [];
   if (hp.dt) { thresholds.push(format('FHCS.Vehicle.Dt', { value: hp.dt })); }
   if (hp.mt) { thresholds.push(format('FHCS.Vehicle.Mishap', { value: hp.mt })); }
   const actions = facts.actions ?? {};
   // Pips when actions are a count (dnd5e's `togglePip` on what's spent): the left ones filled first (sidebar.hbs).
   const pips = !actions.byStations && actions.max ? Array.from({ length: actions.max }, (_, i) =>
   {
      const n = i + 1;
      const filled = (actions.value ?? 0) >= n;
      return { n: actions.max - n, filled, label: format(filled ? 'FHCS.Vehicle.ActionLeft' : 'FHCS.Vehicle.ActionSpent', { n }) };
   }) : [];
   const speeds = (facts.speeds ?? []).filter(Boolean);
   const options = facts.options ?? {};
   return {
      name: facts.name,
      nameSource: facts.nameSource ?? facts.name,
      img: facts.img,
      editing,
      line: [facts.size, facts.type, facts.cost].filter(Boolean).join(' · '),
      pips,
      pipsLabel: localize('FHCS.Vehicle.Actions'),
      hull: {
         value: hp.value ?? 0,
         max: hp.max ?? 0,
         pct: pct(hp.value, hp.max),
         text: `${hp.value ?? 0} / ${hp.max ?? 0}`,
         label: format('FHCS.Vehicle.HullLabel', { value: hp.value ?? 0, max: hp.max ?? 0 }),
         thresholds: thresholds.join(' · ')
      },
      ac: facts.ac ?? '—',
      speeds: speeds.length ? speeds : ['—'],
      init: options.initiative ? { text: facts.init ?? '+0', label: format('FHCS.Vehicle.InitLabel', { init: facts.init ?? '+0' }) } : null,
      quality: options.quality ? { value: facts.quality ?? '', text: facts.quality ?? '—' } : null,
      abilities: options.abilities ? (facts.abilities ?? []).map((a) => abilityView(a, format)) : null,
      abilityCount: (facts.abilities ?? []).length || 6,
      // Edit mode's tray (dnd5e's sidebar switches): what the sheet shows, and how actions are counted.
      tray: editing ? {
         toggles: [
            ['flags.dnd5e.showVehicleAbilities', options.abilities, 'FHCS.Vehicle.Option.abilities'],
            ['flags.dnd5e.showVehicleInitiative', options.initiative, 'FHCS.Vehicle.Option.initiative'],
            ['flags.dnd5e.showVehicleQuality', options.quality, 'FHCS.Vehicle.Option.quality'],
            ['system.attributes.actions.stations', actions.byStations, 'FHCS.Vehicle.Option.stations']
         ].map(([name, on, label]) => ({ name, on: !!on, label: localize(label) })),
         count: actions.byStations ? null : { max: actions.sourceMax ?? '', thresholds: [0, 1, 2].map((i) => ({
            name: `system.attributes.actions.thresholds.${i}`, value: actions.thresholds?.[i] ?? '',
            label: localize(`FHCS.Vehicle.Threshold.${i}`) })) }
      } : null,
      text: {
         name: localize('FHCS.Vehicle.Name'),
         hull: localize('FHCS.Vehicle.Hull'),
         ac: localize('FHCS.Vehicle.Ac'),
         speed: localize('FHCS.Vehicle.Speed'),
         init: localize('FHCS.Vehicle.Init'),
         quality: localize('FHCS.Vehicle.Quality'),
         options: localize('FHCS.Vehicle.OptionsLabel'),
         count: localize('FHCS.Vehicle.Count'),
         thresholds: localize('FHCS.Vehicle.Thresholds'),
         hpConfig: localize('FHCS.Vehicle.HpConfig'),
         acConfig: localize('FHCS.Vehicle.AcConfig'),
         speedConfig: localize('FHCS.Vehicle.SpeedConfig'),
         initConfig: localize('FHCS.Vehicle.InitConfig'),
         hpField: localize('FHCS.Vehicle.HpField')
      }
   };
}
