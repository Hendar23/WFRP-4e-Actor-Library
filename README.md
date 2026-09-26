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

## Included actors (154)

| Group | Actors |
| --- | --- |
| Tavern (10) | Tavern Patron, Tavern Drunk, Tavern Gambler, Tavern Hardcase, Tavern Server, Experienced Tavern Server, Cook, Innkeeper, Experienced Innkeeper, Prosperous Innkeeper |
| Town Workers (8) | Day Labourer, Work Gang Foreman, Household Servant, Head Servant, Beggar, Rat Catcher, Washer, Gravedigger |
| Trade (15) | Hawker, Market Trader, Apprentice Artisan, Artisan, Master Artisan, Smith's Apprentice, Blacksmith, Master Blacksmith, Shop Assistant, Shopkeeper, Established Shopkeeper, Trader, Merchant, Master Merchant, Guildmaster |
| Town Officials (7) | Clerk, Senior Clerk, Town Councillor, Burgomeister, Toll Keeper, Town Crier, Bailiff |
| Villagers (7) | Peasant, Farmer, Prosperous Farmer, Herder, Woodsman, Miller, Village Elder |
| Faith and Medicine (5) | Initiate, Priest, Herbalist, Physician, Apothecary |
| Road and River (4) | Coachman, Veteran Coachman, Boatman, Riverboat Captain |
| Watch (3) | Rookie Watchman, Watchman, Watch Sergeant |
| Skaven (3) | Clanrat, Stormvermin, Clawleader |
| Beastmen (20) | Ungor, Ungor Raider, Ungor Halfhorn, Gor, Gor Foe-render, Bestigor, Bestigor Gouge-horn, Wargor, Beastlord, Minotaur, Minotaur Bloodkine, Gorebull, Doombull, Bray-Shaman, Great Bray-Shaman, Chaos Warhound, Tuskgor, Razorgor, Centigor, Harpy |
| Orcs (16) | Orc Boy, Orc Warrior, Orc Big 'Un, Orc Boss, Orc Warboss, Orc Arrer Boy, Orc Boar Boy, Orc Boar Boy Big 'Un, Black Orc, Black Orc Veteran, Black Orc Big 'Un, Black Orc Boss, Savage Orc Boy, Savage Orc Warrior, Savage Orc Big 'Un, Savage Orc Boss |
| Goblins (6) | Goblin Spearman, Goblin Archer, Goblin Soldier, Goblin Elite, Goblin Boss, Goblin Wolf Rider |
| Forest Goblins (4) | Forest Goblin Warrior, Forest Goblin Archer, Forest Goblin Elite, Forest Goblin Spider Rider |
| Night Goblins (5) | Night Goblin Spear Carrier, Night Goblin Archer, Night Goblin Net Carrier, Night Goblin Elite, Night Goblin Boss |
| Gnoblars (2) | Gnoblar Scavenger, Gnoblar Slinger |
| Hobgoblins (4) | Hobgoblin Mercenary, Hobgoblin Archer, Hobgoblin Wolf Rider, Hobgoblin Boss |
| Mounts (3) | War Boar, Giant Wolf, Giant Spider |
| Skeletons (9) | Skeleton Warrior, Skeleton Spearman, Skeleton Archer, Veteran Skeleton, Grave Guard, Grave Guard Captain, Wight King, Black Knight, Skeletal Steed |
| Zombies (3) | Zombie, Plague Zombie, Armoured Zombie |
| Ghouls (2) | Crypt Ghoul, Crypt Ghast |
| Undead Beasts (6) | Dire Wolf, Doom Wolf, Fell Bat, Scuttling Hand, Varghulf, Nightmare |
| Spirits (3) | Ghost, Cairn Wraith, Tomb Banshee |
| Necromancers (2) | Necromancer, Master Necromancer |
| Vampires (7) | Fledgling Vampire, Von Carstein Noble, Blood Dragon Knight, Lahmian Agent, Necrarch Sorcerer, Strigoi Vampire, Vampire Lord |

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
