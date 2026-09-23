# WFRP 4e Actor Library

A collection of generic NPCs and creatures for the official WFRP Foundry VTT system.


## Requirements

- **Foundry VTT 14**
- **WFRP system 10.0.0 or newer**
- **Warhammer Library 3.4.1 or newer**
- **WFRP4e Core Rulebook 8.0.0 or newer** (tested with 8.0.1)
- **WFRP4e Up in Arms 7.2.0 or newer**

Install and enable the required modules in the world. Core Rulebook and Up in Arms are paid content modules and must be owned separately. This library uses their installed compendium items; it does not include their content. Later versions have not all been tested.

## Install and update through Foundry

Open **Foundry Setup → Add-on Modules → Install Module**, paste this into **Manifest URL**, and click **Install**:

```text
https://github.com/Hendar23/WFRP-4e-Actor-Library/releases/latest/download/module.json
```

The GM's first login builds missing or outdated actors into the world compendium **WFRP4e Quick NPC Library**. Drag actors into the world or onto a scene. The module creates matching folders in the Actors directory for imported actors. Existing world copies are not automatically updated.

## Included actors (49)

| Group | Actors |
| --- | --- |
| Tavern (3) | Tavern Drunk, Tavern Gambler, Tavern Hardcase |
| Watch (3) | Rookie Watchman, Watchman, Watch Sergeant |
| Skaven (3) | Clanrat, Stormvermin, Clawleader |
| Orcs (16) | Orc Boy, Orc Warrior, Orc Big 'Un, Orc Boss, Orc Warboss, Orc Arrer Boy, Orc Boar Boy, Orc Boar Boy Big 'Un, Black Orc, Black Orc Veteran, Black Orc Big 'Un, Black Orc Boss, Savage Orc Boy, Savage Orc Warrior, Savage Orc Big 'Un, Savage Orc Boss |
| Goblins (6) | Goblin Spearman, Goblin Archer, Goblin Soldier, Goblin Elite, Goblin Boss, Goblin Wolf Rider |
| Forest Goblins (4) | Forest Goblin Warrior, Forest Goblin Archer, Forest Goblin Elite, Forest Goblin Spider Rider |
| Night Goblins (5) | Night Goblin Spear Carrier, Night Goblin Archer, Night Goblin Net Carrier, Night Goblin Elite, Night Goblin Boss |
| Gnoblars (2) | Gnoblar Scavenger, Gnoblar Slinger |
| Hobgoblins (4) | Hobgoblin Mercenary, Hobgoblin Archer, Hobgoblin Wolf Rider, Hobgoblin Boss |
| Mounts (3) | War Boar, Giant Wolf, Giant Spider |

Orcs and Goblin-kind use the creature profiles and applicable templates from *Tribes and Tribulations* (pp. 8-12, 16-17); mounts use p. 19. The Soldier and Elite templates include Resolute. The Night Goblin Net Carrier has a net and carried club, without a shield. You need the purchased book separately to consult its rules. See [proposed future actors](FUTURE_ACTORS.md) for shamans and specialists under consideration.

## Add an actor

See [CONTRIBUTING.md](CONTRIBUTING.md). Normally, copy an actor JSON file, change its mechanical values and rebuild. No module programming is needed.

- `actors/`: one JSON definition per actor, grouped by category.
- `catalogue/items.json`: shared readable identifiers and official compendium references.
- `tools/build.mjs`: validates definitions and generates the module data.
- `module/`: installable Foundry module.
- `.github/workflows/validate.yml`: contribution checks on pushes and pull requests.

Use Node.js 22 or newer. There are no npm dependencies:

```sh
npm run build
npm run check
```

Validation checks fields, unique IDs, references and skill totals. Runtime checks also verify Wounds, encumbrance conditions and equipped hand requirements. CI cannot verify that an official compendium UUID still resolves or that an actor works in Foundry; contributors must test those in their installed game.

## Project status

Unofficial community project. No affiliation with the publishers of Warhammer Fantasy Roleplay or Foundry VTT. The pilot's existing personal-use notice remains in the module manifest; a project-wide contribution and distribution licence has not yet been selected.

## Publishing an update

1. Make and test your changes. For actor changes, increment `BUILD_VERSION` in `module/scripts/main.js` as well.
2. Run `npm run build` and commit the generated data with the source definitions.
3. Increment the version in both `module/module.json` and `package.json`. Update the versioned ZIP `download` URL in the manifest and write `RELEASE_NOTES.md`.
4. Push to `main`. The **Publish Foundry release** workflow validates and packages the module, creates a draft release, uploads both assets, then publishes it. If any step fails, inspect the Actions log and rerun after correcting it.

The stable `manifest` URL stays unchanged. Published versions are not overwritten; use a new version for changes. The workflow can also be run manually from Actions on `main`.
