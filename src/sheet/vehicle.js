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

/**
 * Everything the Stations tab shows (SCOPE §4.13): the Traits panel beside the action stations, the features (as rows
 * of the Inventory list, drawn by the caller with `inventoryView`), the draft animals, and edit mode's add buttons.
 * @param {object} facts  From compat.vehicleStationsFacts (or a fixture).
 * @param {{format: Function, localize: Function}} i18n
 */
export function vehicleStationsView(facts, { format, localize })
{
   const editing = !!facts.editing;
   // A reader sees only what's set (dnd5e's sidebar rule); edit mode every row, with its field or gear.
   const traits = (facts.traits ?? []).filter((t) => editing || t.text).map((t) => ({
      key: t.key,
      title: t.title,
      text: t.text || '—',
      empty: !t.text,
      input: editing ? t.input ?? '' : '',
      trait: editing ? t.trait ?? '' : '',
      configLabel: t.trait ? format('FHCS.Vehicle.TraitConfig', { trait: t.title }) : ''
   }));
   const stations = (facts.stations ?? []).map((s) => ({
      id: s.id,
      uuid: s.uuid,
      name: s.name,
      img: s.img,
      sub: s.sub ?? '',
      useLabel: format('FHCS.Vehicle.UseStation', { name: s.name }),
      attack: s.attack ?? '',
      damage: s.damage ?? '',
      hp: s.hp?.max ? { value: s.hp.value ?? 0, max: s.hp.max, pct: pct(s.hp.value, s.hp.max),
         label: format('FHCS.Vehicle.StationHp', { name: s.name, value: s.hp.value ?? 0, max: s.hp.max }) } : null,
      uses: s.uses?.max ? { value: s.uses.value ?? 0, max: s.uses.max, prop: s.uses.prop ?? 'system.uses.value',
         label: format('FHCS.Vehicle.StationUses', { name: s.name }) } : null,
      speed: s.speed ?? '',
      crew: (s.crew ?? []).map((c, index) => (c ? { index, uuid: c.uuid, name: c.name, img: c.img,
         removeLabel: format('FHCS.Vehicle.Uncrew', { name: c.name }) } : { index, empty: true })),
      crewLabel: format('FHCS.Vehicle.CrewOf', { name: s.name })
   }));
   const draft = (facts.draft ?? []).map((d) => ({ uuid: d.uuid, name: d.name, img: d.img, sub: d.sub ?? '',
      openLabel: format('FHCS.Group.OpenLabel', { name: d.name }), removeLabel: format('FHCS.Group.RemoveLabel', { name: d.name }) }));
   return {
      editing,
      traits,
      stations,
      draft,
      adds: editing ? [
         { action: 'createItem', type: 'feat', label: localize('FHCS.Vehicle.Add.feat') },
         { action: 'createItem', type: 'equipment', label: localize('FHCS.Vehicle.Add.equipment') },
         { action: 'createItem', type: 'weapon', label: localize('FHCS.Vehicle.Add.weapon') },
         { action: 'browseActors', type: '', label: localize('FHCS.Vehicle.Add.draft') }
      ] : [],
      empty: !editing && !stations.length && !draft.length && !facts.hasFeatures,
      text: {
         traits: localize('FHCS.Vehicle.Traits'),
         stations: localize('FHCS.Vehicle.Stations'),
         draft: localize('FHCS.Vehicle.Draft'),
         hp: localize('FHCS.Group.Hp'),
         uses: localize('FHCS.Vehicle.Uses'),
         crew: localize('FHCS.Vehicle.Crew'),
         empty: localize('FHCS.Vehicle.EmptyStations'),
         emptySlot: localize('FHCS.Vehicle.EmptySlot')
      }
   };
}

/**
 * Everything Crew & Passengers shows (SCOPE §4.13): the areas Unassigned crew (or Crew, when none is assigned),
 * Assigned crew and Passengers, each a list of creatures with their counts, or a drop hint while empty.
 * @param {object} facts  From compat.vehicleCrewFacts (or a fixture): `areas` of `rows`, `editing`.
 * @param {{format: Function, localize: Function}} i18n
 */
export function vehicleCrewView(facts, { format, localize })
{
   const editing = !!facts.editing;
   const areas = (facts.areas ?? []).filter((a) => a.rows?.length || a.hint).map((a) => ({
      key: a.key,
      area: a.area,
      label: localize(`FHCS.Vehicle.Area.${a.key}`),
      total: a.total ?? 0,
      // Assigned crew are counted by their stations; the rest take − count + in edit mode (dnd5e's adjustCrew).
      adjustable: editing && a.key !== 'assigned',
      draggable: a.key !== 'assigned',
      hint: a.rows?.length ? '' : localize(`FHCS.Vehicle.Drop.${a.area}`),
      rows: (a.rows ?? []).map((r) => ({
         uuid: r.uuid, name: r.name, img: r.img, sub: r.sub ?? '', quantity: r.quantity ?? 1, diff: r.diff ?? 0,
         openLabel: format('FHCS.Group.OpenLabel', { name: r.name }),
         countLabel: format('FHCS.Encounter.CountLabel', { name: r.name }),
         fewerLabel: format('FHCS.Encounter.Fewer', { name: r.name }),
         moreLabel: format('FHCS.Encounter.More', { name: r.name })
      }))
   }));
   return { editing, areas, text: { count: localize('FHCS.Encounter.Count') } };
}
