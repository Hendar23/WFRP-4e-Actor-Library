## 0.3.10: Actor build corrections

- Resolve the Trained Trait script reference before suppressing its automatic chat cards. Its roll and bonuses remain intact.
- Carry shields unequipped when wielding two-handed spears, and account for Sharp and Nimble Fingered in skill totals.
- Rebuild the affected compendium actors while preserving imported world copies.

## 0.3.9: Shaman imports

- Remove the Spellcaster Trait from both Bray-Shamans to prevent the lore selection dialog. Their magic skills and Arcane Magic (Beasts) Talent remain, ready for the GM to add spells.
- Keep Broken training on the Giant Spider and Giant Wolf while preventing its automatic bonus roll from posting to chat during compendium builds.

## 0.3.8: Quiet imports and on-demand folders

- Preset Talent specialisations and spider venom strength so actors build without choice dialogs.
- Create only the world folder needed for an imported actor. Remove empty folders made by earlier versions.

## 0.3.7: Beastmen warherd

- Add 20 Beastmen actors: Ungors, Gors, Bestigors, leaders, Minotaurs, Bray-Shamans and common herd beasts, for 122 actors total.
- Give armed Beastmen real equipped weapons and worn armour, marking appropriate gear Ugly. Shamans have Channelling (Ghur), Language (Magick), Lore (Magick) and Arcane Magic (Beasts), with no assigned spells.
- Existing world actors are not automatically rebuilt.

## 0.3.6: Actor folders and tavern patrons

- File imported library actors under the library folder and their category, including imports that bypass the pre-create folder assignment. Move earlier library imports left at the Actors root into the right category without moving actors deliberately placed elsewhere.
- Put all six hospitality actors in the Tavern category and move tagged library copies from the former Hospitality folder. Remove that former folder if it is empty.
- Add an ordinary Tavern Patron with everyday skills and basic trappings, for 102 actors total. Existing world actor statistics are not changed.

## 0.3.5: Townsfolk

- Add 52 ready-to-use humans across town workers, trade, hospitality, town officials, villages, faith and medicine, and road and river, for 101 actors in total.
- Higher tiers keep lower tiers' skills and occupational talents.
- Make the generic Tavern Gambler and Hardcase less personality-specific. Add Watch Recruit uniform and talents, and update Watchman and Watch Sergeant career skills and trappings.
- Add an item-level build check for missing compendium items and incorrect equipped states. Existing world copies are not automatically updated; generated compendium originals rebuild on GM login.

## 0.3.4: Goblins and mounts

- Add 21 Common, Forest and Night Goblin, Gnoblar and Hobgoblin actors.
- Add separate Giant Wolf and Giant Spider mounts with Wounds and natural traits.
- Keep Resolute on Soldier and Elite variants; the Night Goblin Net Carrier carries no shield.
- Equip real weapons and armour, mark Goblin-made gear Ugly, supply ammunition and leave incompatible backup weapons unequipped.
- List all 49 actors in the README. Existing world copies are not automatically changed; generated compendium originals rebuild on GM login.

## 0.3.3: Orcs

- Rebuild Orc Boy and Orc Warrior with Die Hard and Infected.
- Replace Veteran Orc with Orc Big 'Un and add Orc bosses, archers, boar riders, Black Orcs, Savage Orcs and a War Boar, for 26 actors in total.
- Equip actual weapons and armour on Orcs; apply Ugly to appropriate Orc-made gear.
- Create category folders in the world Actors directory for imported library actors.
- List every included actor in the README.

Existing copies in the world Actors directory are not updated. On GM login, the module rebuilds generated compendium originals. The old generated Veteran Orc is retired once Orc Big 'Un exists.

Requires Foundry 14, WFRP 10.0.0+, Warhammer Library 3.4.1+, Core Rulebook 8.0.0+ and Up in Arms 7.2.0+.
