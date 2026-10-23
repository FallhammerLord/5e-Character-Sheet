# Fallhammer Character Sheet: working notes

A Foundry VTT **v14** character sheet module for dnd5e 6.x (ID `fhcs`, CSS prefix `fhcs-`), in the classic Tidy 5e layout with our ADHD-friendly rules. Plain ES modules, no build step. Sister project: `fallhammer_quest_log` (same conventions; attach it only when comparing).

This file holds rules only. Plan: `docs/ROADMAP.md`. Decisions: `docs/SCOPE.md`. What's verified or waiting: `docs/STATUS.md`. dnd5e internals: `docs/research/dnd5e-6.0-sheet.md` (sheet), `docs/research/dnd5e-6.0-chat.md` (chat cards and rolls).

## Working with the user

- The user has dyslexia: keep replies concise, plain, and forward-stated.
- Nothing here runs inside Foundry. The user tests in their v14 world and reports back with screenshots; ask for console errors (F12) when something breaks. Say what was verified and what wasn't.
- Commit and push after each coherent slice. Don't open a PR unless asked. Update `docs/STATUS.md` and tick `docs/ROADMAP.md` as things land and get verified.

## Commands

```sh
npm run check   # lint + load + unit. Hooks run it before every git push; CI runs it on push.
npm run load    # loads the module with Foundry and dnd5e mocked, checks the sheet registration, chat hook, settings and manifest files
npm run unit    # pure functions offline (roll outcomes, usage card bands)
npm run layout  # renders templates (cases in tools/fixtures.mjs) at sheet widths 560–900 or chat widths 240–380, fails on overflow or overlapping siblings; self-tests first
                # set CHROMIUM_PATH (here: /opt/pw-browsers/chromium)
# In Foundry: install Quench, open it as GM, run "Fallhammer Character Sheet: core" and "…: chat cards". It opens our sheet on a
# temporary character and clicks a roll, a rest and an item use, stopping each at dnd5e's pre-hook.
```

Hooks (`.claude/settings.json`, scripts in `.claude/hooks/`): dependencies install on session start; each edited JS file is linted; `git push` is blocked until `npm run check` passes.

## Rules

- **Extend dnd5e, don't rebuild it.** Our sheet subclasses `CharacterActorSheet`, built at init by `makeCharacterSheet(Base)` (a module can't import the system by path). dnd5e keeps every mechanic; we own layout, templates and CSS.
- **Keep dnd5e's hooks into the markup:** `data-action` names and the class names its code looks for (listed in the research note). Rename one and a mechanic silently stops.
- **Rolls need `rollable`:** dnd5e's `roll` action ignores an element without that class; use `{{ @root.rollableClass }}`.
- **Templates use only core Handlebars helpers;** compute display values in our context methods. dnd5e's helpers don't exist in the layout check.
- **New template part → a case in `tools/fixtures.mjs`,** and a Quench click test if it holds an action.
- **`SYSTEM_ACTIONS`** (`src/constants.js`) lists the dnd5e actions our markup relies on; Quench fails if dnd5e drops one. Keep it in step with the research note.
- **Prefer dnd5e's custom elements** (`dnd5e-inventory`, `dnd5e-effects`, and others) over rebuilt lists: they bring context menus, drag and filters.
- **`src/compat.js`** is the only place for version-sensitive Foundry and dnd5e APIs.
- **Chat cards subclass dnd5e's chat models** (`compat.extendChatModel` at init) and swap templates; dnd5e keeps binding clicks (`data-action`, `data-index`) and its trays find their message by the nearest `data-message-id`. A roll drawn in another card hides its own card (`src/chat/rolls.js`). Template parts included by path must be in `CARD_PARTS` (the load check fails otherwise).
- **Imports:** one missing import stops the whole module in Foundry; ESLint won't see it. `npm run load` catches it.
- **Manifest changes need a world relaunch** (Return to Setup), not a browser refresh.
- **Code style:** Allman braces, 3-space indent, single quotes (matches the quest log).
- **See each new check fail once** before trusting it.
- Quest log rules that will apply as we build (copy them here when the first case comes up): three text sizes, 24px targets, tooltips two to four words, colors only through tokens, no `container-type` around text fields, `<prose-mirror toggled>` without `open`, HTML in templates, layout tests at many widths.
