# Fire and Forge: references (2026-10-28)

Research for the Forge theme (SCOPE §4.11): forge-themed sheets and game UIs, and the smith's craft as a source of
colour, texture and motion. Web searches only; foundryvtt.com and foundryvtt-hub.com were outside this session's
network, so package pages weren't read. Several "chart" results were low-quality pages: treat their numbers as rough.

## What exists

- **Forge-themed 5e sheets:** none found. Nearest printable sets: a fire-themed set (black and white), a "clockwork"
  set for artificers and warforged with metallic accents, an artificer sheet with a worn-paper, pencil-sketch look.
  All are static print; none ties art to the character's state.
- **Foundry themes:** Fantasy RPG UI (a classic RPG overhaul on licensed Blackhammer assets), Dracula and Twilight
  (dark palettes; Twilight recommends Tidy in dark mode), PF2e Dorako UI (Pathfinder only), Darker Dungeons styling
  (a choice of sheet styles). All are whole-UI skins or palette swaps; none is a forge, none reacts to state. The
  state art is our own ground.

## Game UIs

- **Diablo IV** (a designer's community critique, and Blizzard's art notes): stone panels with carved text and
  metal ornament forming a grid; dark metal trim round the tabs "fits the tone", but "overdone" round the focal
  pieces (cursor, health globe); skill icons read as stained glass that could light up when active; background
  diagrams behind panels read as filler. Art direction moved away from saturated high fantasy to grounded, gothic
  relief.
  *For us:* ornament at frame corners and on tabs, never crowding the readouts (HP, AC, totals); an active control
  lit from within like hot metal; no filler art behind panels for its own sake.
- **Total War** (series wiki, Warhammer lore): parchment, marble and iron frames for immersion, brass outlines;
  Dwarf runes are made to be carved in stone or stamped in metal; players asked that the Dwarfs' Rune Forge screen
  be "thematic and unique".
  *For us:* stamped runes and a maker's mark as decals, cut into metal rather than printed on it.
- **Forged of Blood** (its UI overhaul notes): the most important information belongs where the eye rests first;
  they moved key readouts there after playtests. *For us:* the north star again: art frames the readouts, never
  competes with them.
- **Indie smithing games** (Village Smithy, Blacksmith Lineage): glow, embers and sparks are the polish layer,
  readability the first thing testers are asked about.

## The craft as a design system

- **Heat colours** (forging): iron glows dull red, cherry, orange, yellow (forging heat; "work it yellow, put it back
  when it cools to red"), then white. Charts are rough (about ±110°C) and light washes the colour out.
  *For us:* a physical HP ramp the eye already knows: full HP at yellow-orange forging heat, cooling through cherry
  to dull red as HP falls, black iron at 0.
- **Temper colours** (oxide on polished steel): straw, gold, bronze, then purple and blue as it gets hotter.
  *For us:* a straw-to-bronze sheen along frame rims, a gleam on hover. Stop before purple and blue: those mean
  Pact Magic and prepared spells on our sheet (§5.1).
- **Pattern-welded (Damascus) steel:** two steels folded and etched, light and dark layers in ladder, raindrop or
  twist patterns. *For us:* a ladder pattern etched into the steel heading bars: smooth vector lines bunched at folds (first built with SVG turbulence and displacement, replaced 2026-10-28: textures are vectors).
- **Moradin's marks:** a hammer, an anvil wreathed in flame, a hammer whose heads are carved as dwarves' heads.
  *For us:* the emblem family, and a maker's mark stamped into the nameplate.

Sources: dropbear-games.itch.io/5e-character-sheet-redesign; liath.gumroad.com/l/fireballstandardbnw;
sillustrations.gumroad.com/l/clockwork; lexiyoonkim.gumroad.com/l/artificercharactersheet;
foundryvtt.com/packages/fantasy-rpg-ui, …/dracula-foundry, …/darksheet-style (search summaries);
rayuaz.itch.io/twilight-ui; us.forums.blizzard.com/en/d3/t/diablo-iv-ui-ux-feedback-from-a-graphic-designer/9549;
newsroom.activisionblizzard.com/p/the-real-life-inspiration-for-this; totalwar.fandom.com/wiki/User_interface;
community.creative-assembly.com (Dwarf Rune Forge thread); gamebanshee.com/k8rd6 (Forged of Blood);
villagesmithydev.itch.io devlog 1; stormthecastle.com/blacksmithing/the-changing-color-of-forging-steel.htm;
beautifuliron.com/usingthefire.htm; anvilfire.com colors of the forge; en.wikipedia.org/wiki/Moradin;
forgottenrealms.fandom.com (Moradin symbol).
