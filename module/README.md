# WFRP4e Quick NPC Library 0.3.1

Twelve generic pilot actors: Tavern Drunk, Tavern Gambler, Tavern Hardcase, Rookie Watchman, Watchman, Watch Sergeant, Orc Boy, Orc Warrior, Veteran Orc, Clanrat, Stormvermin and Clawleader.

## Requirements

Foundry VTT 14, WFRP system 10.0.0, Core Rulebook 8.0.1 and Up in Arms 7.2.0. Source review targets Warhammer Library 3.4.1. Uses content already installed in your world; no official content is bundled.

## Update and use

1. Close Foundry and replace the old `Data/modules/wfrp4e-quick-npc-library` folder with the folder from this ZIP.
2. Restart Foundry and open the world as GM, with the module enabled.
3. Wait for the build notification. The module rebuilds its twelve compendium entries automatically.
4. Test a fresh Watch Sergeant or Veteran Orc dragged from **Compendium Packs > WFRP4e Quick NPC Library** onto a scene.

Existing world actors and placed tokens are not updated. Test fresh compendium entries, rather than old world copies. No importer macro is needed. If a build fails, its old entry is retained and the console reports the cause.

## Fix in 0.3.1

Fixes the 0.3.0 rebuild failure: WFRP's `computeWounds()` returns the existing maximum when automatic Wounds calculation is disabled. The builder now enables calculation on the compendium actor first, then explicitly saves both current and maximum Wounds. The validation remains in place and now reports the actual values if it fails. Failed 0.3.0 builds retained the old actors, which explains the unchanged adventure armour.

## Changes

- Enables automatic recalculation after talents are applied, then saves system-calculated current and maximum Wounds. Previous manually assigned Wounds disagreed with the system for nine of the twelve actors, potentially causing database updates during import.
- Saves any system-generated encumbrance condition into the compendium entry, avoiding a missing-condition creation request on import.
- Restores the Watch Sergeant's crossbow, Crossbow skill and ten bolts. The crossbow is carried, unequipped, with its ammunition selected; sword and shield are equipped.
- Uses ordinary core plate for the Veteran Orc, cosmetically named spiky. Removes the adventure-specific armour and its malformed property. Ubersreik Adventures I is no longer required.
- Adds the Veteran Orc's Two-Handed skill for the Massive Choppa.
- Accounts for +5 characteristic talents once, preserving intended skill totals.
- Adds missing basic skills at zero advances without prompting. Fixes the species field assignment.
- Validates saved Wounds, trained skill totals, equipment hand requirements and unnamed weapon/armour properties during building.

No art, narrative details or roll tables. Real weapons and armour replace abstract Weapon/Armour traits.

## Verification limits

Syntax, compendium UUID references and WFRP 10.0.0 wound-recalculation behaviour were checked outside Foundry. This release has not been run in a live Foundry world. The corrected Wounds address a concrete import-time update trigger; resolution of the reported server `semaphore` error still needs a fresh-actor scene-drop test. The separate Warhammer Library `keepId` warning is not patched by this module.
