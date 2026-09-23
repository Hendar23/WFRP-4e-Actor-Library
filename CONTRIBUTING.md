# Contributing an actor

1. Copy a similar JSON file from `actors/` into the appropriate category directory.
2. Give it a unique lowercase, hyphenated `id`, and use the same filename: `id.json`.
3. Set `name`, `folder`, `type` (`npc` or `creature`), `species` and characteristics.
4. Add skills and items using catalogue references.
5. Run `npm run build` and `npm run check`. Commit both the JSON changes and regenerated `module/scripts/data.js`.
6. Test the actor in Foundry with the stated supplements and open a pull request.

## Values and equipment

Characteristics are final intended values. The current builder accounts for Warrior Born, Very Strong, Very Resilient and Savvy once. Skill `total` means characteristic plus advances before situational penalties. Do not enter advances as the total.

Wounds are calculated by the installed system. Do not add a Wounds stat.

A skill entry looks like:

```json
{ "ref": "skill.meleeBasic", "total": 55, "characteristic": "ws" }
```

Equipment entries look like:

```json
{ "ref": "gear.sword", "equipped": true }
```

```json
{ "ref": "gear.crossbow", "equipped": false }
```

```json
{ "ref": "gear.leatherJack", "worn": true }
```

Use normal names for ordinary human equipment. Cosmetic monster names are allowed with `name`. Equipped weapons must fit two hands; carried alternatives remain unequipped. Check encumbrance and weapon skill coverage. Use real weapon and armour items, not duplicate abstract Weapon/Armour traits. Mechanical species traits remain appropriate.

For a monster-made weapon or armour item, `"ugly": true` adds the standard Ugly item flaw. When adapting a creature's abstract Weapon or Armour entry into equipment, specify the intended weapon formula explicitly if necessary, for example `"damage": "SB+5"`. For a ranged weapon, `"ammoRef": "gear.arrow"` selects ammunition carried by that actor. Skills with specialisations can use `"name"`, for example `"name": "Ride (War Boar)"`. Innate attacks and natural armour on actual creatures can still use the system's Weapon and Armour traits.

Keep contributions mechanical. No art, biographies, roll tables or custom rules. Specialists are welcome when their mechanics are supported by installed official items. Spellcaster support beyond the pilot needs a reviewed extension to the catalogue and builder first.

## Catalogue additions

Use a key such as `gear.sword`, with `uuid` set to the actual Item compendium UUID and `requires` set to its source package ID. Obtain the UUID from the installed compendium. Do not invent identifiers or paste official descriptions or scripts into the repository.

The current pilot requires Core Rulebook and Up in Arms globally. Discuss additional module requirements before adding them; per-actor optional dependency handling is planned.

## Foundry checks

Confirm actor creation without prompts, scene placement without console errors, appropriate skills, full Wounds, correct weapon damage and range, legal equipped loadout, armour coverage, and no undefined properties. Check talent effects are applied once. State your Foundry, system and supplement versions in the pull request.

Maintainers must increment `BUILD_VERSION` in `module/scripts/main.js` when releasing changes to generated actors, and update the module/package versions together. Existing world actors are not rebuilt. The internal module ID must remain stable unless an explicit migration is implemented.
