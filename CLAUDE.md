# Fallhammer Character Sheet: working notes

A Foundry VTT **v14** character sheet module for dnd5e 6.x (ID `fhcs`, CSS prefix `fhcs-`), in the classic Tidy 5e layout with our ADHD-friendly rules. Plain ES modules, no build step. Sister project: `fallhammer_quest_log` (same conventions; attach it only when comparing).

This file holds how we work and the rules. Everything else lives in `docs/`:

| File | Holds |
|---|---|
| `docs/STATUS.md` | What's verified, what waits on the user, and **what the next session does**. Read first. |
| `docs/ROADMAP.md` | Phases and their checklists. |
| `docs/SCOPE.md` | The design and every decision, with who decided and when. §5.1 is the sheet's icon and color vocabulary. |
| `docs/BUILT.md` | How finished, verified parts work, for changing them later. |
| `docs/research/dnd5e-6.0-sheet.md`, `…-chat.md` | dnd5e internals we rely on (sheet; chat cards and rolls). |

Mockups: one Design canvas, https://claude.ai/artifact/PfrTrdDsbn3Wx7DCa2HDEf, a row of boards per phase (header, Attributes, Inventory, Spellbook). Add new boards there.

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

Learned over Phases 1–4; follow it unless the user says otherwise.

1. **Research dnd5e's source first,** before any design. Clone the matching release into the scratchpad (`git clone --depth 1 --branch release-6.0.6 https://github.com/foundryvtt/dnd5e.git`). Read how its part builds context, which actions and classes its code looks for, and its quirks. Tidy Classic's source: tag `v13.0.0` of `kgar/foundry-vtt-tidy-5e-sheets` (`src/sheets/classic/`; gone from later tags). Write findings into the research note.
2. **Ask the design questions,** then **mock up** on the canvas: light, dark, and the 644px minimum with a hard case. Record every answer in SCOPE with the date.
3. **Build in slices,** each with its fixtures, unit cases and Quench test (below). Commit and push each; keep ROADMAP and STATUS current in the same commit.
4. **Offline checks,** then **look at the layout screenshots yourself** (`tools/out/`): they catch what the checks can't (a name cut to "CL…").
5. **Quench in the user's world.** When a test fails, follow "When a Quench test fails" below.
6. **Play check:** the user opens a real character. Expect one styling pass after first play: size and comfort show only in Foundry (pips too big, details too tight).
7. Tick ROADMAP, write the BUILT entry, update STATUS's "Next session", ask before pushing to `main`.

## Commands

```sh
npm run check   # lint + load + unit. Hooks run it before every git push; CI runs it on push.
npm run load    # loads the module with Foundry and dnd5e mocked: sheet registration and parts, partials, overrides, chat hooks,
                # settings, manifest files, lang keys, and the Quench redraw rule
npm run unit    # pure view functions offline (roll outcomes, card bands, header, attributes, inventory, spellbook)
npm run layout  # renders templates (cases in tools/fixtures.mjs) in light and dark themes at sheet widths 644 (the minimum)–900 or chat widths 240–380;
                # fails on overflow, overlapping siblings, text below WCAG contrast or a fourth text style; self-tests first.
                # Imitates Foundry's button styles (min-height, centered content). Screenshots in tools/out/.
                # Set CHROMIUM_PATH (here: /opt/pw-browsers/chromium)
# In Foundry: install Quench, open it as GM, run "Fallhammer Character Sheet: core" and "…: chat cards". They open our sheet on a
# temporary character and click it, stopping each roll and use at dnd5e's pre-hook.
```

Hooks (`.claude/settings.json`, scripts in `.claude/hooks/`): dependencies install on session start; each edited JS file is linted; `git push` is blocked until `npm run check` passes.

## Rules

### Extending dnd5e

- **Extend dnd5e, don't rebuild it.** Our sheet subclasses `CharacterActorSheet`, built at init by `makeCharacterSheet(Base)` (a module can't import the system by path). dnd5e keeps every mechanic; we own layout, templates and CSS. Our tabs take dnd5e's part IDs (`details`, `inventory`, `spells`) so its tab handling and context still apply.
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
- **Three text styles, two spacing steps** (user, 2026-10-24): display (large bold), body (regular), label (small bold capitals), set once at the top of `styles/fhcs.css`; spacing only `--fhcs-s1` and `--fhcs-s2`; controls `--fhcs-control` tall. Emphasis comes from color or placement, not a fourth style. The layout check fails on a fourth style.
- **Colors only through tokens, and contrast in both themes** (user, 2026-10-24): every token has a light value and a dark one (the token blocks at the top of `styles/fhcs.css`); text meets WCAG 4.5:1 (3:1 large) against what it sits on. Don't fade text that carries information; mark it another way.
- **One meaning per icon and color, across the sheet** (SCOPE §5.1). Check the table before choosing a mark; add new ones to it. Never color alone: every tint has an icon, mark or word beside it.
- **Targets at least 24px**, even when the drawn mark is smaller (a 12px pip in a 24px button).
- **Text in a button reads from the left;** Foundry centers button content, so set `justify-content: flex-start` on text buttons.
- **Tooltips use `data-fhcs-tip`** (shown after a 1.5 s rest, above the button, cleared by a click), never `data-tooltip`, which shows at once and covered dice a click had just added (user, 2026-10-24). Two to four words.
- **At the 644px minimum with every column on,** lesser columns give way (`flex-shrink` with a `min-width`) before names do (96px floor).
- **Code style:** Allman braces, 3-space indent, single quotes (matches the quest log).

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

### Quest log rules not yet needed

Copy into the sections above when the first case comes up: no `container-type` around text fields; `<prose-mirror toggled>` without `open`; HTML in templates.
