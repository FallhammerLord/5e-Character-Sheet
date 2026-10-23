# Status

What's verified, what's waiting. Read when picking up work; CLAUDE.md holds only the rules.

## Verified in Foundry by the user

Nothing yet.

## Verified offline

- Hooks fire (2026-10-23): session start runs `npm ci`; editing a JS file lints it and returns errors; `git push` is blocked when `npm run check` fails and passes on a clean tree.

## Waiting on the user

- Copy this branch into your Data/modules folder as `fhcs` (the folder name must match the ID), relaunch the world, and check "Fallhammer Character Sheet" appears in a character's Sheet configuration. It should look exactly like dnd5e's sheet for now. Startup console line: `fhcs | Character sheet registered (dnd5e 6.x)`.
- With Quench installed, run "Fallhammer Character Sheet: core" as GM. All six should pass. It makes and deletes a character named "FHCS test (safe to delete)".

## Next session

1. Track R first (SCOPE §6): read dnd5e's chat card templates (`templates/chat/`) and `chat-message.mjs`, then build clear cards and late advantage. Then Phase 1, header: SCOPE §4.1 and `docs/reference/tidy-classic-attributes.png`. Replace dnd5e's `header` part with ours (same part ID, so `_prepareHeaderContext` still feeds it), add a layout case, and extend Quench with the header's rolls and pips.
