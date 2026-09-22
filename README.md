# WFRP 4e Actor Library

A collection of generic NPCs and creatures for the official WFRP Foundry VTT system.


## Requirements

- **Foundry VTT 14**
- **WFRP system 10.0.0 or newer**
- **Warhammer Library 3.4.1 or newer**
- **WFRP4e Core Rulebook 8.0.0 or newer** (tested with 8.0.1)
- **WFRP4e Up in Arms 7.2.0 or newer**

Install and enable the required modules in the world. Core Rulebook and Up in Arms are paid content modules and must be owned separately. This library uses their installed compendium items; it does not include their content. Later versions have not all been tested.

## Install the development version

Copy the contents of `module/` into `Data/modules/wfrp4e-quick-npc-library/`, restart Foundry and enable **WFRP 4e Actor Library**. The internal module ID and existing compendium name are retained to preserve compatibility with pilot installations.

The GM's first login builds missing or outdated actors into the world compendium **WFRP4e Quick NPC Library**. Drag actors into the world or onto a scene. Existing world copies are not automatically updated.

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
