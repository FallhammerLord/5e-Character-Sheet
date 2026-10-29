# Fallhammer Character Sheet: working notes

A Foundry VTT **v14** character sheet module for dnd5e 6.x (ID `fhcs`, CSS prefix `fhcs-`), in the classic Tidy 5e layout with our ADHD-friendly rules. Plain ES modules, no build step. Sister project: `fallhammer_quest_log` (same conventions; attach it only when comparing).

This file holds how we work and the rules. Everything else lives in `docs/`:

| File | Holds |
|---|---|
| `docs/STATUS.md` | What's verified, what waits on the user, and **what the next session does**. Read first. |
| `docs/ROADMAP.md` | Phases and their checklists. |
| `docs/SCOPE.md` | The design and every decision, with who decided and when. §5.1 the icon and color vocabulary, §5.2 the styling rules, §5.3 the theme rules. |
| `docs/BUILT.md` | How finished, verified parts work, for changing them later. |
| `docs/research/dnd5e-6.0-sheet.md`, `…-chat.md`, `…-other-sheets.md`, `forge-theme.md` | dnd5e internals we rely on (character sheet; chat cards and rolls; NPC, item and the other sheets); the Forge theme's references. |

Mockups: one Design canvas, https://claude.ai/artifact/PfrTrdDsbn3Wx7DCa2HDEf, a row of boards per phase (header, Attributes, Inventory, Spellbook, Features, Effects, Biography, header cards). Add new boards there.

## Session start

1. **One chat at a time.** Two chats editing the docs drift apart.
2. `main` is the default branch, so a new chat starts from it. Check `git log origin/main` against your `claude/…` branch; if the branch is behind `main`, move onto `main`.
3. Read `docs/STATUS.md` ("Next session"), then the ROADMAP phase it names, then the SCOPE section for that phase.

## Working with the user

- The user has dyslexia: replies concise, plain, forward-stated. Lists for enumerable things, prose otherwise.
- Nothing here runs inside Foundry. The user tests in their v14 world and reports back with screenshots; ask for console errors (F12) when something breaks. Say what was verified and what wasn't, and how (offline check, Quench, play).
- **Small extensions are fine; name them.** When you carry a decision further than asked (a toggle onto a second tab, a wording change), do it and say so in one line, so the user can reverse it.
- **Recommend, don't survey.** For a design question give a pick with the trade-off, not a menu.
- **`main` moves only when the user is satisfied:** ask in chat, then `git push origin <branch>:main` (fast-forward only, never force). That push raises a permission prompt (`.claude/settings.json`), so the user approves each one. Commit and push the branch after each coherent slice. Don't open a PR unless asked.

## How a phase goes

Learned over Phases 1–5; follow it unless the user says otherwise.

1. **Research dnd5e's source first,** before any design. Clone the matching release into the scratchpad (`git clone --depth 1 --branch release-6.0.6 https://github.com/foundryvtt/dnd5e.git`). Read how its part builds context, which actions and classes its code looks for, and its quirks. Tidy Classic's source: tag `v13.0.0` of `kgar/foundry-vtt-tidy-5e-sheets` (`src/sheets/classic/`; gone from later tags). Write findings into the research note.
2. **Ask the design questions,** then **mock up** on the canvas: light, dark, and the 644px minimum with a hard case. Record every answer in SCOPE with the date. **Render the boards and look at them before presenting** (user, 2026-10-27): read the canvas's `artifact-type/dc-runtime.js`, serve the `project/*.dc.html` files beside it as `support.js`, screenshot with Playwright.
3. **Build in slices,** each with its fixtures, unit cases and Quench test (below). Commit and push each; keep ROADMAP and STATUS current in the same commit.
4. **Offline checks,** then **look at the layout screenshots yourself** (`tools/out/`): they catch what the checks can't (a name cut to "CL…").
5. **Quench in the user's world.** When a test fails, follow "When a Quench test fails" below.
6. **Play check:** the user opens a real character. Expect one styling pass after first play: size and comfort show only in Foundry (pips too big, details too tight).
7. Tick ROADMAP, write the BUILT entry, update STATUS's "Next session", ask before pushing to `main`.

## How a polish round goes

Play notes come as one message with many asks (seven to twelve). Learned 2026-10-28:

1. **Number the asks first** in ROADMAP's current phase, before any code; answer by number at the end. Ask one line about an unclear ask and carry on with the rest.
2. **Find the existing answer before designing one:** Foundry's or dnd5e's behaviour first (who may edit, their icons, resizable windows, middle-click), then our nearest pattern on another tab. "Foundry should have icons for this" and "the same styling as the other categories" both meant this (SCOPE §5.0).
3. **One ask, one slice, one commit** with its docs. Look at the screenshots of what changed.
4. **A rule said in passing is a rule:** record it in SCOPE, dated, in the same commit ("big effects answer events, never timers").
5. **One handover at the end:** which Quench tests are new, what to look at in play.

## How a theme goes

Learned building Fire and Forge (2026-10-28):

1. **Look up the real thing before drawing it** (forging heat, temper colours, Damascus patterns) and write it into the theme's research note. Drawn from memory, the first Damascus came out as wood grain.
2. **Preview a texture alone,** at 4× and on its bar, before the layout check: the check can judge contrast, not whether it reads as steel.
3. **Keep to SCOPE §5.3:** one look in both of Foundry's modes, no texture inside panels, effects that answer events where they happen, one CSS file plus its texture script.

## Commands

```sh
npm run check   # lint + load + unit. Hooks run it before every git push; CI runs it on push.
npm run load    # loads the module with Foundry and dnd5e mocked: sheet registration and parts, partials, overrides, chat hooks,
                # settings, manifest files, lang keys, and the Quench redraw rule
npm run unit    # pure view functions offline (roll outcomes, card bands, header and its cards, attributes, inventory, spellbook,
                # features, effects, biography)
npm run layout  # renders templates (cases in tools/fixtures.mjs) in light and dark themes at sheet widths 644 (the minimum)–900, item sheet 500–740 or chat widths 240–380;
                # fails on overflow, overlapping siblings, text below WCAG contrast or a fourth text style; self-tests first.
                # Imitates Foundry's button styles (min-height, centered content). Screenshots in tools/out/.
                # Set CHROMIUM_PATH (here: /opt/pw-browsers/chromium)
# In Foundry: install Quench, open it as GM, run "Fallhammer Character Sheet: core" and "…: chat cards". They open our sheet on a
# temporary character and click it, stopping each roll and use at dnd5e's pre-hook.
```

Hooks (`.claude/settings.json`, scripts in `.claude/hooks/`): dependencies install on session start; each edited JS file is linted; `git push` is blocked until `npm run check` passes.

## Rules

### Extending dnd5e

- **Extend dnd5e, don't rebuild it.** Our sheet subclasses `CharacterActorSheet`, built at init by `makeCharacterSheet(Base)` (a module can't import the system by path). dnd5e keeps every mechanic; we own layout, templates and CSS. Our tabs take dnd5e's part IDs (`details`, `inventory`, `spells`, `features`, `effects`, `biography`) so its tab handling and context still apply.
- **Keep dnd5e's hooks into the markup:** `data-action` names and the class names its code looks for (listed in the research note). Rename one and a mechanic silently stops.
- **Prefer dnd5e's custom elements** (`dnd5e-inventory`, `item-list-controls`, `dnd5e-effects`) over rebuilt lists: they bring context menus, drag, filters and item actions (`.item-action[data-action]`).
- **When dnd5e draws into its own markup after render** (`_renderAttunement`, `_renderSpellbook`), override the method: ours draws it, and theirs would throw or duplicate.
- **Rolls need `rollable`:** dnd5e's `roll` action ignores an element without that class; use `{{ @root.rollableClass }}`.
- **`SYSTEM_ACTIONS`** (`src/constants.js`) lists the dnd5e sheet actions our markup relies on; Quench fails if dnd5e drops one. Keep it in step with the research note.
- **`src/compat.js`** is the only place for version-sensitive Foundry and dnd5e APIs. It turns dnd5e's context into plain facts; `src/sheet/*.js` turns facts into display values, pure, so unit and layout checks use the same code.
- **Chat cards subclass dnd5e's chat models** (`compat.extendChatModel` at init) and swap templates; dnd5e keeps binding clicks (`data-action`, `data-index`) and its trays find their message by the nearest `data-message-id`. A roll drawn in another card hides its own card (`src/chat/rolls.js`). Template parts included by path must be in `CARD_PARTS`.
- **Imports:** one missing import stops the whole module in Foundry; ESLint won't see it. `npm run load` catches it.
- **Manifest changes need a world relaunch** (Return to Setup), not a browser refresh.

### Templates and styles

- **Templates use only core Handlebars helpers;** compute display values in the view functions. dnd5e's helpers don't exist in the layout check.
- **A partial included by a tab loads with its part** (`PART_OPTIONS` templates in `src/apps/CharacterSheet.js`); the load check fails otherwise.
- **The design rules live in SCOPE §5,** one copy, so they can't drift: §5.0 principles, §5.1 marks, §5.2 styling, §5.3 themes, §5.4 other sheets. Read the part you're touching. The ones most often broken:
  - three text styles (display, body, label) and spacing 4 or 8 only (`--fhcs-s1`, `--fhcs-s2`); the layout check fails a fourth style or any other gap;
  - colours only through tokens, each with its light and dark value; text 4.5:1 (3:1 large); don't fade text that carries information;
  - check §5.1 before choosing a mark, and look at the marks sharing its bar; add the new one;
  - targets 24px (§5.2 rule 20 for the exception);
  - text buttons `justify-content: flex-start` (Foundry centres them);
  - tooltips `data-fhcs-tip`, two to four words, never `data-tooltip` (user, 2026-10-24: it showed at once and covered dice);
  - at 644px lesser columns give way (`flex-shrink`, `min-width`); names keep 96px.
- **Code style:** Allman braces, 3-space indent, single quotes (matches the quest log).

### Traps we've hit (check here before debugging layout)

- **A subgrid's padding narrows its edge tracks** (a 24px gear column became 20px): inset the first cell, not the row.
- **The layout check takes over two minutes:** run it in the background with its output to a log, then read the log. `ONLY='<regex>'` checks just the matching cases (plus the self-test) while working.
- **Playwright scripts of our own** need `chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })` here; the bare launch looks for another version.

- **Foundry drags the window from any press in the title bar except on a button,** and keeps the pointer, so a `summary` there never opens: title-bar controls are buttons, and their trays hang from the window, outside the bar.
- **dnd5e's item sheet disables every button and field in play mode** except those with `always-interactive` (application-v2-mixin.mjs:301): our lock, tabs and toggles carry it, or the sheet can never be unlocked.
- **Foundry switches tabs through the tab row's buttons:** a tab opened from elsewhere (Special Traits' gear) keeps a hidden button in the row.
- **Foundry's control height** (2rem `min-height`) reaches every `button`, `summary` and `select`; the reset at the top of `styles/fhcs.css` covers them, and the layout harness imitates Foundry on each. A new kind of control goes in both, or the row it sits in grows in one mode (rows dropped on the lock twice).
- **A scrollbar that comes and goes** narrows its column: scrolling areas keep `scrollbar-gutter: stable` (checked).
- **`:is()` after `>` matches children only:** `.a > :is(details > summary)` never reaches the `summary`. Write `:is(.a > details > summary)`.
- **A type selector adds weight:** the Attributes tab's `.fhcs-attributes dl` reset outweighed `.fhcs-sheet .fhcs-traits`'s padding (labels on the panel's edge). The layout check now fails text within 4px of its panel's side.
- **A later base rule of equal weight wins:** `.fhcs-tray { left: 0 }` comes late in the file, so a tray placed right needs a more specific selector.
- **A filter on a masked element is masked away** (filter, then clip, then mask): put a glow on its parent.
- **A blurred, translucent plate is its own layer:** its open tray hides under the next plate unless the plate rises (`:has(details[open] > .fhcs-tray)`).
- **`getFlag` throws for a module that isn't active:** read another module's flag as `actor.flags['tidy5e-sheet']?.[key]`.
- **A form that depends on a row's room** (inspiration's stars or count) uses a container query on that row, not the window's width.
- **The 644px edit-mode tab row is full** (Bastion, inspiration's gear and five marks; Special Traits left it for a gear): measure in the layout check before adding anything to it.
- **Two writes for one click draw twice:** the first redraw shows half the change (inspiration's moment started on the wrong star). Write the first with `{ render: false }`, the last one draws.
- **Data URIs:** encode `#` once (`%23`); `%2523` draws nothing.
- **Custom properties inherit:** a check keyed on one (`--fhcs-art`) must count only the element where it starts.
- **Sideways moves pass the parity check** by design (rule 6 lets columns slide left); only heights and vertical places fail it.
- **The layout check's last line counts layouts; it doesn't say they passed.** Read its whole output (failures print above it), or grep for lines that start with a case name.
- **A theme's light token block reaches dark mode too** unless its dark block sets the same token (Forge's darker success green showed on dark iron).
- **Headless Chromium has no hyphenation dictionary:** "Dragonbo / rn" in a screenshot is the harness, not the sheet.

### Checks and tests

- **See each new check fail once** before trusting it (break the code, run, restore).
- **New template part → a case in `tools/fixtures.mjs`,** and a Quench click test if it holds an action.
- **When the user's screenshot shows something the layout check passed,** teach the check (as with Foundry's centered buttons), so it can't return.
- **Quench clicks wait for redraws** (user, 2026-10-26): any data change (create, update, delete, a flag or setting) redraws the sheet, and a click on markup that redraw replaces is lost. In the sheet batch, click and type only through `click()`, `enter()` or `clickReaches()`: each waits via `settled()` (lets redraws start, then `await sheet.render()`) and finds its element fresh by selector. Never hold an element across an `await` and click it; read results with `until()`. The load check fails on a bare `.click()` or `dispatchEvent(` there.
- **Create several items with `createItems()`,** which matches them by name: Foundry doesn't promise to return them in the order sent.
- **Before handing over new Quench tests,** reread them for: an element held across an `await`; an assumed order; a failure message that says only "expected true". Messages should name what was found (the row's actions, the spell's stored level and section).

### When a Quench test fails

- **A failure that moves between runs is the test,** not the sheet: timing or test data. In Phase 4, four failed runs were all test faults.
- **Diagnose before fixing:** if dnd5e's source doesn't explain it, add what dnd5e actually holds to the failure message and ask for one more run, rather than guessing a fix.
- Say plainly which it is ("a test bug", "a real bug", "not yet known").

### Docs

- **Keep ROADMAP and STATUS current, every slice, in the same commit as the work.** Nothing may describe a state that's no longer true (a "waits on the user" that's verified, a "next" that's done). Before ending a session, reread both and fix what's drifted; the next chat trusts them.
- **STATUS holds the current state, short.** One entry per thing; the run-by-run story belongs in commit messages. When a part is verified, its entry moves to "Verified" and its how-it-works goes to BUILT.
- **SCOPE records decisions with who and when** ("user, 2026-10-26"). Replace a superseded decision in place and say what changed; don't leave both.

### Quest log rules, carried over

Taken in with the Biography tab (2026-10-26), the first text fields: no `container-type` around text fields; `<prose-mirror toggled>` without `open` (the text shows until the player chooses to edit); enriched HTML goes into templates with `{{{ }}}`, computed in the view, never built from strings in the template.
