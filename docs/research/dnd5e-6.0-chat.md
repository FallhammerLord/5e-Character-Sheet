# dnd5e 6.0 chat cards and rolls: what Track R builds on

Read from the dnd5e repository at tag `release-6.0.6` (commit `87e94db`), 2026-10-23. SCOPE §6 holds the decisions; this note holds the facts.

## Message types

6.0 gives each roll message its own data model (`module/data/chat-message/`), picked by `message.type`:

| Type | Model | Template | Notes |
|---|---|---|---|
| `check` | `CheckMessageData` | `chat/check-card.hbs` | `system.ability`, `skill`, `tool`, `type` (`ability` or `initiative`) |
| `save` | `SaveMessageData` | `chat/save-card.hbs` | `system.type` = `ability`, `concentration`, `death`; `canCrit` only for death saves; Break concentration and Legendary resistance buttons |
| `attack` | `AttackMessageData` | `chat/attack-card.hbs` | `canCrit` true; `evaluatedTargets` gives `isMiss` per target; `displayResult` follows `attackRollVisibility` |
| `damage` | `DamageMessageData` | `chat/damage-card.hbs` | apply tray (`damage-application`) |
| `usage` | `UsageMessageData` | `chat/usage-card.hbs` | the item card; renders its descendents as summaries |
| `request` | `RequestMessageData` | `chat/request-card.hbs` | "roll a save" requests |

All roll types extend `RollMessageData`: `canCrit`, `displayResult` (from the originating message's `shouldDisplayChallenge`, which reads the world setting `challengeVisibility`), `forceSuccess` (a resisted save).

## Rendering path

`ChatMessage5e#renderHTML` (`documents/chat-message.mjs:139`) → `system.getHTML(html)` renders the type's template into `.message-content`, enriches the header (avatar, name), binds `[data-action]` clicks to `system.metadata.actions` → then **`Hooks.callAll("dnd5e.renderChatMessage", message, html)`**, synchronous, after everything else. That hook is our way in: the markup is final and the message document is at hand.

Each roll renders through `chat/parts/roll-compact.hbs`: a `button.dice-roll` with classes `success` / `failure` / `critical` / `fumble` (only when a target exists and `displayResult` allows), `fa-check` / `fa-xmark` icons, the total, and the kept d20 in a small hexagon (`.d20die .roll`). The breakdown is a `popover` beside it.

The roll's label ("Intelligence Saving Throw") is `message.flavor`, shown in the header's `.flavor-text`; `RollMessageData#_onRender` removes it when the card has an item header. Advantage adds " (Advantage)" to the flavor (`D20Roll._prepareMessageData`).

## Summaries: results on the card that asked

With the client setting `dnd5e.chatCardSummary` (on by default), a usage card renders each descendent roll (its saves and checks) as a `.card-summary[data-message-id]` row inside itself (`save-summary.hbs`, `check-summary.hbs`), and hides the descendent's own card (`html.hidden = true`). Rolls made from a card's button link back through `system.origin`; `#refreshOrigin` re-renders the origin when a descendent is created, updated or deleted.

So SCOPE §6.4's "saves on the same card" exists already; our work there is wording (success or failure, DC) on those summary rows.

## D20 rolls

- `D20Roll` (`dice/d20-roll.mjs`): `d20` is the first term, a `D20Die`. `isCritical` / `isFumble` from the die's `criticalSuccess` / `criticalFailure` (20 and 1 by default, configurable). `isSuccess` / `isFailure` compare `total` with `options.target` (the DC). `options.advantageMode`: 1 advantage, −1 disadvantage, 0 normal.
- Advantage is a die modifier: `adv` / `dis` (`adv2` for Elven Accuracy). `BasicDie#expandAdvantage` multiplies the die count before rolling; `advantage()` then marks the lower (or higher) results `discarded: true, active: false`. Halfling Lucky is `r1=1`, Reliable Talent `min10`.
- **Late advantage** therefore means: take the evaluated roll, add one more d20 result to its `d20.results`, set the `adv` or `dis` modifier and `options.advantageMode`, mark the dropped result discarded, recompute the total, and update the message's `rolls`. A message's author (or a GM) may update it.

## Roll pipeline hooks

`BasicRoll.buildConfigure` fires `dnd5e.preRoll{Type}` and the generic `dnd5e.preRoll` (and V2 variants) with `(config, dialog, message)`; returning `false` stops the roll. `applyKeybindings` then sets `dialog.configure` from Shift / Alt / Ctrl unless it's already set, so `dialog.configure = false` in `dnd5e.preRoll` skips the dialog. `dnd5e.post{Type}RollConfiguration` fires before evaluation.

## Settings that shape cards

`chatCardSummary` (client), `autoCollapseChatTrays` (client: always, never, older, manual), `autoCollapseItemCards` (client), `challengeVisibility` (world, hidden: all, player, none), `attackRollVisibility` (world), `allowPlayerDamageTray`, `allowPlayerEffectsTray`.

## Usage card buttons (checked for the card frame, 2026-10-23)

- Each activity lists its chat buttons in `_usageChatButtons` (stored on the message as `system.buttons`): attack `rollAttack`, `rollDamage`; save `rollSave` (one per ability, `canGroup`, dataset `{ dc, ability }`), `rollDamage`; check `rollCheck`; damage `rollDamage`; heal `rollHealing`; utility `rollFormula`; any activity `placeTemplate`, `consumeResource`, `refundResource`.
- `UsageMessageData#_prepareButtons` resolves `hidden` (visibility `all` / `creator` / `gm`) and the label for the viewer.
- A click on any `[data-action]` in the message runs `metadata.actions[action]` (`showDocument`, `toggleDescription`, `use`) or else `activity.onChatAction(event, target, message)`, which reads `target.dataset.action` and, for saves, `message.system.getButton(target)` by `data-index`. So a band needs only `data-action` and `data-index`.
- `recorded-targets`, `effect-application` and `damage-application` find their message through `closest("[data-message-id]")`; they work inside any markup.
- `CONFIG.ChatMessage.dataModels` is set in dnd5e's init; swapping `usage` for a subclass in our init (later) applies to every message, since the world's messages are built after init. The subclass keeps `metadata`, schema and migrations; we override `template` and extend `_prepareContext`.
- `activity.use(usage, dialog, { create: false })` returns the message data without posting; `usage.subsequentActions: false` skips the automatic follow-up roll. **dnd5e already rolls the attack after an attack activity is used** (`AttackActivity#_triggerSubsequentActions`), and a damage activity's damage likewise.

## Requests (checked for standalone rolls, 2026-10-23)

- `RequestMessageData` (`type: "request"`): `system.targets` = `{ actor (uuid), result (message), user }`; `system.handler` names a function in `CONFIG.DND5E.requests`; `system.button` its label and icon. The template's per-target button is `data-action="handleRequest"` inside `[data-uuid]`.
- A result message gets `flags.dnd5e.requestResult = { actorUuid, requestId }`; the active GM then writes the result's id into the request's `system.targets` (`onCreateMessage`, `onUpdateResultMessage`), which re-renders the request.
- Late adds change a result's rolls, not the request; we re-render the request ourselves (`compat.refreshCard`).

## Applying damage and effects (checked 2026-10-28)

- **Damage types inside one roll:** a die flavored `[radiant]` in a slashing roll is radiant. `dnd5e.dice.aggregateDamageRolls(rolls)` splits rolls into one per type (aggregate-damage-rolls.mjs); the damage tray and `ChatMessage#_prepareDamageContext` both use it.
- **Apply damage:** the tray calls `actor.applyDamage(damages, { ...options, isDelta: true, origin: this.chatMessage })` per selected or targeted token it owns (damage-application.mjs:601). `applyDamage` hands the same options to `calculateDamage`, which fires `dnd5e.calculateDamage(actor, damages, options)` with each type's value after resistances (`damages.temp` and `.tempMax` beside them); then `dnd5e.preApplyDamage` and, after the update, `dnd5e.applyDamage(actor, amount, options)`.
- **Apply effects:** `_onApplyEffects` prepares each checked effect for each target with `_prepareEffectData(effect, actor)`, then creates or updates them in one `foundry.documents.modifyBatch`. No hook; we wrap the two methods on `customElements.get('effect-application')`.
- **Attack targets** are a `TargetsField` on the attack message, recorded at the roll; `evaluatedTargets` compares them with the roll.

## Trays follow tokens only while marked on screen (found 2026-10-29)

`damage-application`, `effect-application` and `recorded-targets` rebuild their token lists only while `visible`
(an attribute) and not `suspended` (`recorded-targets.mjs` `shouldBuildTargetList`; suspended while the tray isn't
`open`). The chat log marks `visible` with an IntersectionObserver it attaches to each message's element as it enters
the log (`chat-log.mjs` `#onLogMutated`, `#onCardIntersects`), so a tray drawn into a message after that first look
stays unmarked: its list never follows selected or targeted tokens, and the Selected/Targeted switch (which only asks
for a rebuild) looks dead. Ours: `compat.openTrays` also watches each card and marks its trays (`watchTrays`), a guard:
it was written for a report whose real cause was the next point.

**Selected mode lists only tokens with an actor** (`buildTargetsList`: `if ( t.actor )`): a token with no actor has
no HP to apply to and no save to roll, so it never shows in a tray (user, 2026-10-29, testing with such tokens).
