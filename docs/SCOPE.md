# Scope

The design and every decision. Skeleton: sections fill in as decisions are made.

## 1. What this is

A Foundry VTT v14 module (ID `fhcs`, CSS prefix `fhcs-`) adding a character sheet for dnd5e 6.x. It extends dnd5e's own sheet class: the system keeps doing every mechanic; we own layout, templates and styles.

## 2. Who it's for

The user's table first: players used to Tidy 5e's classic layout. Public release later.

## 3. Decisions

- **Extend, don't rebuild** (2026-10-22): subclass `CharacterActorSheet`; reuse dnd5e's custom elements (`dnd5e-inventory` and others) where they fit.
- **Characters only** to start; NPCs and vehicles keep dnd5e's sheets.
- **Offered beside dnd5e's sheet**, never forced as the default.
- **Track R (rolls and chat cards) before Phase 1** (2026-10-23, user deferred to our call): it's used by every player and the GM every session whatever sheet they use, it's mostly presentation over dnd5e's own buttons, and it ends the table's reliance on an experimental Ready Set Roll fork. The sheet header follows.

## 4. Layout

Target: Tidy 5e Classic, as in `docs/reference/` (screenshots) and its source at Tidy commit `54fdbad4` (the last before Classic was removed, 2026-09-01; `src/sheets/classic/character/`). Default window 740 × 810.

### 4.1 Header

- **Portrait** (round, about 150px) down the left edge. On it: exhaustion (top left), inspiration (top right), rest button (bottom left), HP bar (bottom center), hit dice left (bottom right). Under it: Temp and Max HP.
- **Beside it, in rows:**
  1. Name (large small caps); on the right: XP bar with current / next, level badge, ⋮ menu.
  2. Classes and subclasses ("Cleric 12 Life Domain").
  3. Origin line: size • creature type • species • background • alignment; on the right: Proficiency bonus.
  4. Speed.
  5. AC shield badge, then Initiative, then six ability columns. Each column: abbreviation, score (large), boxed modifier and save, save proficiency.

### 4.2 Tabs

Across the top, under the header: Actions, Attributes, Inventory, Spellbook, Features, Effects; Biography and Journal optional. Players choose and order them (Classic's tab selection window). Sheet lock at the far right of the tab row.

### 4.3 Attributes tab

- **Side panel** (about 240px, left): skills list (proficiency, name, ability, modifier, passive), then traits (senses, languages, damage immunities, resistances and vulnerabilities, condition immunities, weapon, armor and tool proficiencies).
- **Main panel:** pinned and favorite items, grouped (Inventory, Spell Level N with slots used / total). Columns: name, uses, spell components, activation (1 Action, 1 Bonus Action).

### 4.4 Actions tab

Everything usable, grouped by Action, Bonus Action, Reaction, Other. Each row: icon, name with a small subtitle (type, spell level and school), uses, range and target, hit or DC, damage, roll.

### 4.5 Where we change Classic (ADHD rules)

Keep the layout players know; fix what costs attention:

- **Gear and pencil icons only in edit mode.** Classic shows about 30 of them in play; each is a target under 24px.
- **Equipped and prepared** get an icon or label as well as the green and blue row color (color alone fails the colorblind player).
- **Actions tab is the "Now" home** (Phase 7): it's already grouped by action type, so turn economy fits there. Make it the default tab in play.
- **Targets at least 24px**, three text sizes, tooltips two to four words. On chat cards, our tooltips wait 1.5 s, open above the button and clear on a click (user, 2026-10-24).
- **Pinned header:** HP, AC and conditions never scroll away.

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
