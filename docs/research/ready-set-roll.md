# Ready Set Roll: what its chat cards did, and why it broke

Read from MangoFVTT/fvtt-ready-set-roll-5e at `f20ba46` (3.5.0, 2025-06-21; Foundry 13 only), 2026-10-23. The user's table used it; its card format is what Track R recreates (SCOPE §6.5). It is GPL-3.0 and this repository is MIT: we reproduce the behavior, never its code.

## The card

- **One card per use.** dnd5e's item card on top (portrait, title, folding description, Save DC button), then titled sections injected below it (`rsr-section.html`).
- **Attack section** ("Attack", ammunition as subtitle): the total large, the natural d20 in a die icon, a check or cross against the DC. With advantage or disadvantage, both d20 totals sit side by side and the dropped one fades (`rsr-multiroll.html`). A setting rolls two d20s every time. Clicking opens the formula and dice.
- **Damage section** ("Damage", "Critical Hit!" subtitle): one row per damage type, each with apply buttons (heal, temp, ×2, ×½, ×¼, ×1); a total row applies all.
- **Retroactive edits**: hover overlays on the attack (advantage, disadvantage) add d20s and update the card in place; on damage, "roll crit" re-rolls as a critical keeping the original dice.
- **Quick roll**: using an item rolls attack and damage straight into the card, no dialog. A setting makes damage a button (always, or only for attacks). Holding dnd5e's skip-dialog key gets the dialog back.
- Standalone checks and saves get the same side-by-side d20 display.

## How it worked

- `dnd5e.preUseActivity` and `dnd5e.preRoll*V2`: set `dialog.configure = false` and flag the message as a quick roll.
- `dnd5e.renderChatMessage`: hide the card until processed, then call `activity.rollAttack` / `rollDamage` with `create: false` and push the rolls into the usage message's own `rolls`, then `message.update`.
- When dnd5e posted a separate attack or damage message anyway, RSR copied its rolls into the parent and **deleted the child**.
- Late advantage (`roll.js` `upgradeRoll`): add d20 results to the term, `keep('kh'|'kl')`, push the modifier, set `advantageMode`, recompute `_total`, update the message. Same shape as our plan in `dnd5e-6.0-chat.md`.

## Why it broke on dnd5e 6.0

1. It finds its cards through dnd5e 5.x flags (`flags.dnd5e.messageType`, `flags.dnd5e.roll.type`). 6.0 replaced them with typed messages (`message.type`, `system`), so its type check returns null and nothing happens.
2. It extends `activity-card.hbs` (the `.activation-card`), deprecated in 6.0 and removed in 6.2.
3. Merging rolls into one message and deleting the rest fights 6.0's model, where rolls stay linked messages (`system.origin`) that the usage card gathers. Every dnd5e release that touches that model breaks it.

## What we do differently

- Keep every roll a real message linked to the usage card; draw it as a band inside the card and hide its own card. dnd5e's registry, summaries, damage tray and Dice So Nice keep working.
- Apply through dnd5e's `damage-application` and `effect-application` (resistances per token, half on a save), set to selected tokens.
- Every control visible and labelled once a band is open, at least 24px; no hover-only overlays.
