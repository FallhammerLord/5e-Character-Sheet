# Scope

The design and every decision. Skeleton: sections fill in as decisions are made.

## 1. What this is

A Foundry VTT v14 module (ID `fhcs`, CSS prefix `fhcs-`) adding a character sheet for dnd5e 6.x. It extends dnd5e's own sheet class: the system keeps doing every mechanic; we own layout, templates and styles.

## 2. Who it's for

The user's table: players used to Tidy 5e's classic layout. Private use for now (user, 2026-10-24); a public release is not planned.

## 3. Decisions

- **Extend, don't rebuild** (2026-10-22): subclass `CharacterActorSheet`; reuse dnd5e's custom elements (`dnd5e-inventory` and others) where they fit.
- **Characters only** to start; NPCs and vehicles keep dnd5e's sheets.
- **Offered beside dnd5e's sheet**, never forced as the default.
- **Replaces Ready Set Roll; private use for now** (user, 2026-10-24): no compatibility layer for RSR or its forks; the module is for the user's table, public release later if ever.
- **Track R (rolls and chat cards) went first** (2026-10-23, user deferred to our call): it's used by every player and the GM every session whatever sheet they use, and it ends the table's reliance on an experimental Ready Set Roll fork. Done and verified 2026-10-24; the sheet phases lead from here, in ROADMAP order.

## 4. Layout

Target: Tidy 5e Classic, as in `docs/reference/` (screenshots) and its source at Tidy commit `54fdbad4` (the last before Classic was removed, 2026-09-01; `src/sheets/classic/character/`). Default window 740 × 810.

**Skeleton, our style** (user, 2026-10-24): every part sits where Classic puts it, so muscle memory carries over; type, spacing, contrast and controls follow our rules (§5, CLAUDE.md). Everything visual goes through tokens, so themes beyond light and dark can follow the first working sheet.

### 4.1 Header

- **Portrait** (round, about 150px) down the left edge. On it: exhaustion (top left), inspiration (top right), rest button (bottom left), HP bar (bottom center), hit dice left (bottom right). Under it: Temp and Max HP.
- **Beside it, in rows:**
  1. Name (large small caps); on the right: XP bar with current / next, level badge, ⋮ menu.
  2. Classes and subclasses ("Cleric 12 Life Domain").
  3. Origin line: size • creature type • species • background • alignment; on the right: Proficiency bonus.
  4. Speed.
  5. AC shield badge, then Initiative, then six ability columns. Each column: abbreviation, score (large), boxed modifier and save, save proficiency.

Header decisions (user, 2026-10-24; mockup https://claude.ai/artifact/PfrTrdDsbn3Wx7DCa2HDEf):
- **Portrait frame 160 wide, up to 240 tall:** round, square and tall art all fit; the header grows with tall art and nothing else moves. HP, its bar and Temp sit under the frame.
- **Corner chips on the frame:** exhaustion, inspiration, rest, hit dice.
- **Ability emphasis is a per-player choice** (client setting): modifier large with the score small (our default), or Classic's large score.
- **Leveling follows dnd5e's `levelingMode` world setting** (the GM's choice; we add no setting of our own). XP modes show the usual XP bar. Milestone mode (`noxp`) puts a Level button where the bar was; it folds out a tray of 20 pips (4 rows of 5). Each class level fills the next pip with that class's icon, in the order the levels were gained; empty pips show levels not reached. A pip fills when the player levels up through dnd5e, after its advancement finishes. Nothing to add by hand.
  - To research: dnd5e stores levels per class, not their order. We record the order in an actor flag at each level-up; characters from before that fill class by class, original class first. Icons: the class item's own image, so any source's classes work.
- **Pinned strip** when scrolled (§4.5): portrait thumbnail, name, HP and bar, AC, conditions, inspiration.
- **The ability row never wraps** (user, 2026-10-24): AC, Init and the abilities stay in one row; columns stretch between 52 and 88px, and the sheet stops shrinking at the width that row needs (644px with six abilities; `headerMinWidth`). Text sizes stay the three styles; only the columns scale.
- Saves show as a proficiency dot and the modifier, without the word "Save": at the default width a column is about 62px, too narrow for "Save +10". The button's tooltip and label name it.

### 4.2 Tabs

Across the top, under the header: Actions, Attributes, Inventory, Spellbook, Features, Effects; Biography and Journal optional. Players choose and order them (Classic's tab selection window). Sheet lock at the far right of the tab row.

### 4.3 Attributes tab

- **Side panel** (about 240px, left): skills list (proficiency, name, ability, modifier, passive), then traits (senses, languages, damage immunities, resistances and vulnerabilities, condition immunities, weapon, armor and tool proficiencies).
- **Main panel:** pinned and favorite items, grouped (Inventory, Spell Level N with slots used / total). Columns: name, uses, spell components, activation (1 Action, 1 Bonus Action).

Attributes decisions (user, 2026-10-24; mockup https://claude.ai/artifact/PfrTrdDsbn3Wx7DCa2HDEf, Attributes boards):
- **Skills:** one 28px roll button per skill. Proficiency is a mark, not bold text: empty circle none, half-filled half (Jack of All Trades), filled proficient, ringed expertise.
- **Passive scores:** a toggle in the Skills heading switches between every skill's passive and only Perception, Insight and Investigation; each player's choice is remembered.
- **Traits:** empty ones hidden in play, all shown in edit mode.
- **Favorites:** grouped as dnd5e groups them; each group folds, and stays as the player left it. Equipped rows green, prepared blue, each with a left edge and an icon as well. Spell slots as 24px pips with "used / total".
- **Resources:** counters above the favorites, only when the character has any.
- **Death saves** go in the header, shown only at 0 HP.

### 4.4 Actions tab

Everything usable, grouped by Action, Bonus Action, Reaction, Other. Each row: icon, name with a small subtitle (type, spell level and school), uses, range and target, hit or DC, damage, roll.

### 4.5 Where we change Classic (ADHD rules)

Keep the layout players know; fix what costs attention:

- **Gear and pencil icons only in edit mode.** Classic shows about 30 of them in play; each is a target under 24px.
- **Equipped and prepared** get an icon or label as well as the green and blue row color (color alone fails the colorblind player).
- **Actions tab is the "Now" home** (Phase 7): it's already grouped by action type, so turn economy fits there. Make it the default tab in play.
- **Targets at least 24px**, three text sizes, tooltips two to four words. On chat cards, our tooltips wait 1.5 s, open above the button and clear on a click (user, 2026-10-24).
- **Pinned header:** HP, AC and conditions never scroll away.

### 4.6 Inventory tab

Classic's layout (Tidy source, `src/sheets/classic/actor/tabs/ActorInventoryTab.svelte`, `InventoryList.svelte`): a search bar, then one section per item type (Weapons, Equipment, Consumables, Tools, Containers, Loot), each a table with a count; attunement, currency and carried weight in a footer.

Inventory decisions (user, 2026-10-26; mockup https://claude.ai/artifact/PfrTrdDsbn3Wx7DCa2HDEf, Inventory boards):
- **What matters at the table:** uses, usage, equipped, and attunement. Weight is mostly unimportant: nothing enforces 5e weight rules, and this isn't a video game.
- **Players choose the columns:** Weight, Uses, Usage, Qty, Equipped, Attuned. Default: all but Weight. A client setting, so the choice follows the player to every character. The Columns menu shows only in edit mode, since it's a setting.
- **Attunement has three states:** filled star (attuned), outline star (needs attuning; click to attune), blank (not required). Its own column, like the equip toggle.
- **Equipped:** a 28px toggle per row, plus the green tint and left edge. Edit and delete show only in edit mode.
- **The carried-weight bar follows dnd5e's encumbrance world setting:** hidden when the GM has it off. We add no setting of our own.
- **The picture uses the item; the name opens its details** (Classic's split).
- **Containers** (user, 2026-10-26): a container is a row like any other, and a drop anywhere on it puts the item inside (dnd5e's own drop handling). Its contents fold open under it, indented, with a count on the fold button; each player's open containers are remembered. Containers nest. No container panel at the top. dnd5e's container window (from the picture) keeps dnd5e's look for now.

### 4.7 Spellbook tab

Built on dnd5e's spells part and `dnd5e-inventory`, like Inventory (research note, "Spellbook").

Spellbook decisions (user, 2026-10-26):
- **Unprepared spells show.** No hiding by default; a Prepared filter narrows the list. Unprepared rows are marked, not faded (contrast rule).
- **Preparation follows dnd5e's class math:** "prepared / max" per casting class, from dnd5e's counts. We compute nothing ourselves.
- **Default columns:** components, activation, range, a concentration mark, and a prepare mark on spells that need preparing. The prepare mark has three states, like attunement: filled (prepared; click to unprepare), outline (unprepared; click to prepare), locked (always prepared; no click). Spells that need no preparation (cantrips, pact, innate, at will) show none.
- **Filters of its own,** after Tidy Classic: pinned Action, Bonus, Reaction, Concentration, plus Prepared; the menu adds Ritual, Can cast, components, schools and casting class.
- **Concentration space** (proposed, 2026-10-26; waits on the mockup): a fixed slot in the spellcasting strip showing the spell's icon and name, or "Not concentrating". Name opens the spell; an End button ends it (dnd5e's `endConcentration`); the concentration save rolls from the slot. One entry per concentration when the limit is above 1. Phase 7 may mirror it in the header beside the conditions.

## 5. ADHD rules carried over

Typography and spacing (user, 2026-10-24): three text styles across the module (display, body, label), two spacing steps, one control height; every panel uses space economically, folded and open: a band's heading, total and open mark share one line; the card header is one label line (actor · details) over the title.


From the quest log and Initiative: three text sizes; buttons at least 24px; tooltips two to four words, details in a tips panel; play and edit modes; one main action per area; plain words, no blame or counters; reduced motion; colors only through tokens.

## 6. Rolls and chat cards

### 6.1 What's wrong with dnd5e 6.0's cards (user's screenshot, 2026-10-23)

The roll type ("Intelligence Saving Throw") is the faintest text; the natural die is a small grey circle; success or failure is never written; a concentration request and its save are separate cards; Apply damage hides behind a `>` chevron; dice, play and undo are about 16px unlabelled icons; item tags outweigh the item name; every card repeats speaker, time and ⋮.

### 6.2 Ready Set Roll (to recapitulate)

Ready Set Roll for D&D5e (MangoFVTT) is verified only to Foundry 13; issues report it broken on v14 (April 2026). A community fork, RSReforged, carries it on; its dnd5e 6 release (6.0.0) is labelled experimental, and several forks disagree on which is canonical. Same story as Forien's Quest Log and Tidy Classic.

What the table uses (user, 2026-10-23), and where dnd5e 6.0 already has it (checked in its source):

| Need | dnd5e 6.0 | Our work |
|---|---|---|
| Quick roll with advantage or disadvantage | Yes: Shift skips the dialog, Alt advantage, Ctrl disadvantage (`module/settings.mjs`, rebindable) | Make it visible: say the keys in the tips panel; consider Adv / Dis buttons on the sheet |
| Late advantage or disadvantage on the card | **No** | **Build it:** Advantage / Disadvantage buttons on a d20 card roll one more d20 and update the same card, both dice shown, the dropped one struck through |
| Roll damage button | Yes: `rollDamage` on activity cards | Label and size it |
| Roll save for selected | Yes: `rollSave` button; the targets tray switches between selected and targeted tokens (`recorded-targets.mjs`) | Label it, open the tray in "selected" mode (§6.6) |
| Apply damage or effects to selected | Yes: damage and effect application trays, same selected / targeted switch | Unhide them (today behind a `>` chevron), "selected" mode, labelled buttons at least 24px |

So Track R is mostly presentation over dnd5e's own buttons; late advantage is the one new mechanic. How RSR built its cards and why it broke on 6.0: `docs/research/ready-set-roll.md`.

### 6.3 Table feel

The user's principle (2026-10-23): keep a pencil-and-paper feel. A card should read like what someone says at the table, and actions stay in the players' and GM's hands. Show the dice; never auto-apply damage, saves or effects; every step is a button someone chooses to press.

### 6.4 Fewest clicks: no held keys, no pop-up windows

The user's rule (2026-10-23): the chat card holds everything; nobody holds a key or answers a Foundry dialog. How, against dnd5e 6.0 (checked in its source):

- **Roll dialogs:** every roll fires the generic `dnd5e.preRoll` hook first (`dice/basic-roll.mjs`); setting `dialog.configure = false` there skips the dialog for all rolls. Advantage moves to the card (late advantage), so Alt and Ctrl are never needed.
- **Damage on the same card:** Roll damage adds the damage to the attack's card instead of posting a new one; a critical hit doubles the dice without asking. Apply buttons sit under it.
- **Saves on the same card:** Roll save for selected lists each token's result on the card that asked, with success or failure against the DC in words; concentration requests and their saves the same. dnd5e 6.0 already does the listing (its "summarize chat" setting, on by default, `docs/research/dnd5e-6.0-chat.md`); we add the words.
- **Activity dialogs stay** (user, 2026-10-23): the spellcasting window (slot level, concentration, consumption; `_requiresConfigurationDialog`, `documents/activity/mixin.mjs`) and the chooser for items with several activities are expected. We don't skip them.
- **Late bonuses on the card** (user, 2026-10-23): a "+ bonus" control on any roll on the card adds a flat number or a die roll (a late Bless d4, a Bardic Inspiration d8) to that roll's total. The added part shows as its own term, so everyone can see what changed. Same for damage rolls.

### 6.5 The card: one card per action (user, 2026-10-23)

Ready Set Roll's format is the target, rebuilt on dnd5e 6.0's model: every roll stays a real message linked to the item's usage card (`system.origin`), drawn as a band inside that card, its own card hidden. The first slice (an outcome line added to dnd5e's cards) changed too little; the card's layout must carry the meaning.

Top to bottom, each part only when the action has it:

1. **Header:** the acting actor's portrait, large; the action's title (item name, activity under it).
2. **Description:** folded; click to unfold.
3. **d20 band**, full width: the total, both d20s (the dropped one struck through), natural 1 or 20 and hit or miss in words. Click to open the dice math and late adds: Advantage, Disadvantage, + Bonus.
4. **Damage band**, full width: the total by damage type. Click to open the dice math, every die shown ("(3 + 2) + 0 = 5", never "5 + 0"; user 2026-10-24) and any die rerolled or dropped named. A critical hit doubles the dice without asking; "Roll as normal" undoes it.
5. **Save / check band**, full width: "Dexterity save, DC 15" and a button to roll for selected tokens; one row per token with its result in words, filling in as rolls arrive. On-hit riders (a Topple save, an opposed check) sit here inside the attack's card.
6. **Apply:** a folded panel (user, 2026-10-24) holding damage and attached effects through dnd5e's own trays, labelled, at least 24px.

Buttons and band contents are centered (user, 2026-10-23). A band's heading sits on its own top line, left, with the open/closed mark right; side columns squeezed the words to a few letters per line at 240px.

Panels the player opened stay open when the card re-renders (a re-roll, a late die, a bonus; user 2026-10-24). Buttons keep one size and one place on every band and every roll (user, 2026-10-24): a two-column grid (bonus field and + Bonus; Roll again and a Critical switch with a check box, or an empty cell), a band's words always two lines tall, notes below the buttons. Inside an open band the buttons sit right under the current roll's math, and earlier rolls follow in their own scrolling box, newest first, about five lines tall, so repeated re-rolls never move the buttons. A save band's token rows scroll the same way past about five.

The same frame serves every roll: a skill check from the sheet is header plus d20 band; a GM request is header plus the check band. The card updates in place when a later roll arrives.

### 6.6 Settings, selection and targets (user, 2026-10-23)

- **Roll on use:** using an item rolls its attack and its damage into the card at once. Each is a world setting, on by default; off makes it a button in its band. Damage follows every attack made from the card (doubled on a critical), and a save spell's damage rolls right after it is cast.
- **No roll dialogs:** world setting, on by default. Holding dnd5e's skip-dialog key (Shift) brings the window back for a one-off bonus; the spellcasting and activity-choice windows still ask.
- **Always roll two d20s:** world setting, on by default. The next d20 is rolled in advance; the first side die added uses it, later ones roll fresh.
- **The d20 row** (user, 2026-10-23; revised 2026-10-24): the primary die in the center, a black d20; disadvantage dice to its left, outlined red; advantage dice to its right, outlined blue. Every die and add slot is a d20 silhouette of one size. In dark themes the default die is white and numbers on filled dice dark (contrast, user 2026-10-24); dropped dice keep full color, marked by a dashed outline and strike-through. Each side's cell, right beside the primary die, starts as a dashed d20 marked − or +; once a die lands there, that side's newest die takes the cell and is the add button (a small − or + badge on it), so the latest result sits next to the primary and the button never moves (user, 2026-10-24). Older dice move to a tray below, disadvantage left and advantage right. A side with five dice shows its newest die, no longer a button. **Click order decides:** each die added is compared with the die counting at that moment; advantage keeps the higher, disadvantage the lower. Nothing cancels, so the table makes the call and the card doesn't adjudicate. Elven Accuracy is two clicks on the advantage side. The die that counts is filled; the rest are struck through.
- **Who can click:** a card's author uses its rolls, late adds and saves; the GM uses every card. Foundry lets a player control and change only what they own, so a player's Apply reaches their own tokens (healing themselves); damage to enemies is the GM's click.
- **Selected tokens, not targets.** Player targeting is too unreliable to drive anything. Apply buttons and "roll for" buttons act on selected tokens: in practice the GM's selection. A player's targets may show as information (the hit or miss against each); nothing happens automatically because of them. dnd5e's trays open in "selected" mode, said in words.

## 7. Open questions

- Shared themes with the quest log, or Light and Dark first?
- Which sheet-changing modules matter at the user's table?
- Does the "Now" strip live in the header, a tab, or both?
