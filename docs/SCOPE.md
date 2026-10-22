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

## 4. Layout

Waiting on screenshots of classic Tidy from the user's world.

## 5. ADHD rules carried over

From the quest log and Initiative: three text sizes; buttons at least 24px; tooltips two to four words, details in a tips panel; play and edit modes; one main action per area; plain words, no blame or counters; reduced motion; colors only through tokens.

## 6. Open questions

- Shared themes with the quest log, or Light and Dark first?
- Which sheet-changing modules matter at the user's table?
- Does the "Now" strip live in the header, a tab, or both?
