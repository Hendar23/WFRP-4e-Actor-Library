import { MODULE_ID, PROFILES, UUID } from "./data.js";

const PACK_NAME = "wfrp4e-quick-npc-library";
const PACK_LABEL = "WFRP4e Quick NPC Library";
const BUILD_VERSION = 5;

// Dragging a generated actor into the world puts it in its library category.
// Leave deliberate placements in an existing world folder untouched.
Hooks.on("preCreateActor", (actor, data) => {
  if (actor.pack || !data.flags?.[MODULE_ID]?.profileId || !game.user?.isGM) return;
  if (data.folder && game.folders.get(data.folder)) return;
  const root = game.folders.find(folder => folder.type === "Actor" &&
    folder.name === PACK_LABEL && !folder.folder);
  const category = game.folders.find(folder => folder.type === "Actor" &&
    folder.folder?.id === root?.id && folder.name === data.flags[MODULE_ID].category);
  if (category) actor.updateSource({folder: category.id});
});

async function ensureWorldFolders() {
  let root = game.folders.find(folder => folder.type === "Actor" &&
    folder.name === PACK_LABEL && !folder.folder);
  if (!root) root = await Folder.create({name: PACK_LABEL, type: "Actor"});
  for (const name of new Set(PROFILES.map(profile => profile.folder))) {
    if (game.folders.some(folder => folder.type === "Actor" &&
      folder.folder?.id === root.id && folder.name === name)) continue;
    await Folder.create({name, type: "Actor", folder: root.id});
  }
}

Hooks.once("ready", async () => {
  if (!game.user?.isGM || game.system.id !== "wfrp4e") return;

  const firstActiveGM = game.users
    .filter(user => user.active && user.isGM)
    .sort((a, b) => a.id.localeCompare(b.id))[0];
  if (firstActiveGM?.id !== game.user.id) return;

  try {
    await ensureWorldFolders();
    let pack = game.packs.get(`world.${PACK_NAME}`);
    const newPack = !pack;
    if (!pack) {
      pack = await foundry.documents.collections.CompendiumCollection.createCompendium({
        name: PACK_NAME,
        label: PACK_LABEL,
        type: "Actor",
        package: "world",
        system: "wfrp4e"
      });
    }

    const documents = await pack.getDocuments();
    const generated = new Map(
      documents
        .filter(actor => actor.getFlag(MODULE_ID, "profileId"))
        .map(actor => [actor.getFlag(MODULE_ID, "profileId"), actor])
    );
    const pending = PROFILES.filter(profile => {
      const actor = generated.get(profile.id);
      return !actor || Number(actor.getFlag(MODULE_ID, "buildVersion")) < BUILD_VERSION;
    });
    if (!pending.length) return;

    ui.notifications.info(`Building ${pending.length} Quick NPC compendium actors...`);
    const wasLocked = pack.locked;
    if (wasLocked) await pack.configure({ locked: false });

    const report = { created: [], replaced: [], retired: [], failed: [] };
    try {
      for (const profile of pending) {
        try {
          const oldActor = generated.get(profile.id);
          // Build and validate first so a failed rebuild retains the previous actor.
          await createCompendiumActor(profile, pack.collection);
          if (oldActor) {
            await Actor.implementation.deleteDocuments([oldActor.id], { pack: pack.collection });
            report.replaced.push(profile.name);
          }
          report.created.push(profile.name);
        } catch (error) {
          console.error(`${MODULE_ID} failed to build ${profile.name}`, error);
          report.failed.push({ actor: profile.name, reason: error.message });
        }
      }
      // The old Veteran Orc profile has been superseded by Orc Big 'Un.
      // Delete only the module's tagged compendium original, never world copies.
      if (generated.has("veteran-orc") &&
          (report.created.includes("Orc Big 'Un") ||
            (await pack.getDocuments()).some(actor => actor.getFlag(MODULE_ID, "profileId") === "orc-big-un"))) {
        await Actor.implementation.deleteDocuments([generated.get("veteran-orc").id], {pack: pack.collection});
        report.retired.push("Veteran Orc");
      }
    } finally {
      if (wasLocked || newPack) await pack.configure({ locked: true });
    }

    console.group("WFRP4e Quick NPC Library build report");
    console.log("Created", report.created);
    if (report.replaced.length) console.log("Replaced", report.replaced);
    if (report.retired.length) console.log("Retired", report.retired);
    if (report.failed.length) console.table(report.failed);
    console.groupEnd();

    if (report.failed.length) {
      ui.notifications.warn(
        `Quick NPC Library built ${report.created.length} actors; ${report.failed.length} failed. Press F12 for details.`
      );
    } else {
      ui.notifications.info(`Quick NPC Library is ready with ${report.created.length} new actors.`);
    }
  } catch (error) {
    console.error(`${MODULE_ID} could not build its compendium`, error);
    ui.notifications.error("Quick NPC Library could not build its compendium. Press F12 for details.");
  }
});

function sourceHas(source, path) {
  return foundry.utils.getProperty(source, path) !== undefined;
}

function setFirstExisting(update, source, paths, value, fallback = null) {
  const chosen = paths.find(path => sourceHas(source, path)) ?? fallback;
  if (chosen) foundry.utils.setProperty(update, chosen, value);
  return chosen;
}

function setOnItem(data, paths, value, fallback) {
  const chosen = paths.find(path => sourceHas(data, path)) ?? fallback;
  foundry.utils.setProperty(data, chosen, value);
}

function applySpecification(data, specification) {
  if (specification === null || specification === undefined) return;
  setOnItem(
    data,
    [
      "system.specification.value",
      "system.specification",
      "system.specialisation.value",
      "system.specialisation"
    ],
    specification,
    "system.specification.value"
  );
}

function applyQuantity(data, quantity) {
  if (quantity === null || quantity === undefined) return;
  setOnItem(data, ["system.quantity.value", "system.quantity"], quantity, "system.quantity.value");
}

function applyWorn(data, worn) {
  if (!worn || data.type !== "armour") return;
  setOnItem(data, ["system.equipped.value"], true, "system.equipped.value");
}

function applyEquipped(data, equipped) {
  if (equipped === null || equipped === undefined || data.type !== "weapon") return;
  setOnItem(data, ["system.equipped.value", "system.equipped"], Boolean(equipped), "system.equipped.value");
}

function applyLoaded(data, loaded) {
  if (loaded === null || loaded === undefined || data.type !== "weapon") return;
  setOnItem(data, ["system.loaded.value", "system.loaded"], loaded, "system.loaded.value");
}

function applyUgly(data, ugly) {
  if (!ugly || !["weapon", "armour"].includes(data.type)) return;
  const path = "system.flaws.value";
  const flaws = foundry.utils.getProperty(data, path) ?? [];
  if (!flaws.some(flaw => flaw?.name === "ugly")) {
    foundry.utils.setProperty(data, path, [...flaws, {name: "ugly"}]);
  }
}

function applyDamage(data, damage) {
  if (damage === undefined) return;
  if (data.type !== "weapon") throw new Error(`Cannot assign damage to ${data.type}`);
  foundry.utils.setProperty(data, "system.damage.value", damage);
}

function applySkillAdvances(data, advances) {
  setOnItem(
    data,
    ["system.advances.value", "system.advances"],
    Math.max(0, Number(advances) || 0),
    "system.advances.value"
  );
}

function normaliseWeaponFormula(data) {
  if (data.type !== "weapon") return;
  const formula = foundry.utils.getProperty(data, "system.damage.value");
  if (typeof formula === "string") {
    foundry.utils.setProperty(data, "system.damage.value", formula.replace(/^\s*\+\s*(?=[A-Za-z]+B)/, ""));
  }
}

async function cloneSourceItem(entry, profile, isSkill = false) {
  const sourceDocument = await fromUuid(entry.uuid);
  if (!sourceDocument) throw new Error(`Required compendium item did not resolve: ${entry.uuid}`);

  const data = sourceDocument.toObject();
  delete data._id;
  delete data.folder;
  delete data.ownership;

  if (entry.name) data.name = entry.name;
  applySpecification(data, entry.specification);
  applyQuantity(data, entry.quantity);
  applyWorn(data, entry.worn);
  applyEquipped(data, entry.equipped);
  applyLoaded(data, entry.loaded);
  normaliseWeaponFormula(data);
  applyDamage(data, entry.damage);
  applyUgly(data, entry.ugly);

  data.flags ??= {};
  data.flags[MODULE_ID] = {
    desiredEquipped: Boolean(entry.equipped),
    desiredWorn: Boolean(entry.worn),
    sourceUuid: entry.uuid,
    ...(entry.ammoUuid ? { ammoUuid: entry.ammoUuid } : {})
  };

  if (isSkill) {
    const characteristic = Number(profile.stats[entry.characteristic] ?? 0);
    applySkillAdvances(data, Number(entry.total) - characteristic);
  }

  return data;
}

async function createCompendiumActor(profile, packId) {
  const embedded = [];
  for (const entry of profile.skills) embedded.push(await cloneSourceItem(entry, profile, true));
  for (const entry of profile.items) embedded.push(await cloneSourceItem(entry, profile, false));

  let actor;
  try {
    [actor] = await Actor.implementation.createDocuments(
      [{
        name: profile.name,
        type: profile.type,
        system: { settings: { autoCalc: { wounds: false } } },
        flags: {
          [MODULE_ID]: {
            profileId: profile.id,
            category: profile.folder,
            buildVersion: BUILD_VERSION
          }
        }
      }],
      { pack: packId, skipItems: true }
    );

    if (!actor) throw new Error("Foundry did not return the created Actor.");

    const source = actor.toObject();
    const update = {};
    for (const key of ["ws", "bs", "s", "t", "i", "ag", "dex", "int", "wp", "fel"]) {
      setFirstExisting(
        update,
        source,
        [`system.characteristics.${key}.initial`, `system.characteristics.${key}.value`],
        profile.stats[key] - characteristicTalentBonus(profile, key),
        `system.characteristics.${key}.initial`
      );
    }

    setFirstExisting(
      update,
      source,
      ["system.details.move.value", "system.details.move", "system.status.movement.value"],
      profile.stats.m,
      "system.details.move.value"
    );
    // Schema fields may be empty objects until assigned. Do not replace the
    // species object with a string just because its value is initially absent.
    foundry.utils.setProperty(update, "system.details.species.value", profile.species);

    await actor.update(update);
    const initialItems = await actor.system.getInitialItems(false);
    const skillNames = new Set(embedded.filter(i => i.type === "skill").map(i => i.name));
    for (const initial of initialItems) {
      if (initial.type !== "skill" || skillNames.has(initial.name)) continue;
      const data = foundry.utils.deepClone(initial);
      delete data._id;
      applySkillAdvances(data, 0);
      embedded.push(data);
      skillNames.add(data.name);
    }
    const createdItems = await actor.createEmbeddedDocuments("Item", embedded, { skipSpecialisationChoice: true });
    for (const createdItem of createdItems) {
      const desiredEquipped = createdItem.getFlag(MODULE_ID, "desiredEquipped");
      const desiredWorn = createdItem.getFlag(MODULE_ID, "desiredWorn");
      if (createdItem.type === "weapon") {
        await createdItem.update({ "system.equipped.value": Boolean(desiredEquipped) });
      } else if (createdItem.type === "armour" && desiredWorn) {
        await createdItem.update({ "system.equipped.value": true });
      }
    }

    for (const weapon of createdItems.filter(i => i.type === "weapon")) {
      const ammoUuid = weapon.getFlag(MODULE_ID, "ammoUuid") ??
        (weapon.getFlag(MODULE_ID, "sourceUuid") === UUID.gear.crossbow ? UUID.gear.bolt : null);
      if (!ammoUuid) continue;
      const ammunition = createdItems.find(i => i.getFlag(MODULE_ID, "sourceUuid") === ammoUuid);
      if (!ammunition) throw new Error(`Missing ammunition for ${weapon.name}`);
      await weapon.update({ "system.currentAmmo.value": ammunition.id });
    }

    actor = await saveCalculatedWounds(actor);
    // Persist the system's encumbrance condition too. Otherwise prepareData
    // requests a new embedded effect as soon as the actor enters the world.
    await actor.checkSystemEffects();
    validateActor(actor, profile);
    return actor;
  } catch (error) {
    if (actor?.id) {
      try {
        await Actor.implementation.deleteDocuments([actor.id], { pack: packId });
      } catch (rollbackError) {
        console.error(`${MODULE_ID} could not remove incomplete actor ${profile.name}`, rollbackError);
      }
    }
    throw error;
  }
}

// Profile characteristics describe final values, including these one-time +5 talents.
function characteristicTalentBonus(profile, characteristic) {
  const talents = { ws: UUID.talent.warriorBorn, s: UUID.talent.veryStrong,
    t: UUID.talent.veryResilient, int: UUID.talent.savvy };
  return talents[characteristic] && profile.items.some(i => i.uuid === talents[characteristic]) ? 5 : 0;
}

function validateActor(actor, profile) {
  const source = actor.toObject();
  const wounds = actor.system.computeWounds();
  if (source.system.status.wounds.max !== wounds || source.system.status.wounds.value !== wounds) {
    throw new Error(`Saved Wounds differ: current=${source.system.status.wounds.value}, max=${source.system.status.wounds.max}, calculated=${wounds}.`);
  }
  const ratio = actor.system.status.encumbrance.state;
  const expectedEncumbrance = ratio > 3 ? "enc3" : ratio > 2 ? "enc2" : ratio > 1 ? "enc1" : null;
  for (const key of ["enc1", "enc2", "enc3"]) {
    if (Boolean(actor.hasSystemEffect(key)) !== (key === expectedEncumbrance)) {
      throw new Error("Saved encumbrance conditions differ from calculated encumbrance.");
    }
  }
  let hands = 0;
  for (const item of actor.items) {
    if (item.type === "weapon" && item.system.equipped.value) {
      hands += item.system.twohanded.value ? 2 : 1;
    }
    if (["weapon", "armour"].includes(item.type)) {
      for (const kind of ["qualities", "flaws"]) {
        if (item.system[kind]?.value?.some(p => !p.name)) {
          throw new Error(`${item.name} contains an unnamed ${kind} entry.`);
        }
      }
    }
  }
  if (hands > 2) throw new Error("Equipped weapons require more than two hands.");
  for (const entry of profile.skills) {
    const skill = actor.items.find(i => i.getFlag(MODULE_ID, "sourceUuid") === entry.uuid);
    if (!skill) throw new Error(`Missing skill: ${entry.uuid}`);
    // Compare the unmodified total: encumbrance can legitimately penalise Agility.
    const characteristic = actor.system.characteristics[entry.characteristic];
    const actual = skill.system.advances.value + characteristic.initial + characteristic.advances;
    if (actual !== entry.total) throw new Error(`${skill.name}: expected ${entry.total}, got ${actual}.`);
  }
}

async function saveCalculatedWounds(actor) {
  // computeWounds returns the existing maximum while autoCalc is disabled.
  // Compendium preparation can safely calculate without a world-actor update.
  actor = await actor.update({ "system.settings.autoCalc.wounds": true });
  const wounds = actor.system.computeWounds();
  if (!Number.isFinite(wounds) || wounds <= 0) throw new Error("Invalid calculated Wounds.");
  // Force both fields into the update, even if prepared values already match.
  // WFRP's pre-update clamp must see the new maximum with the current value.
  return await actor.update({
    "system.status.wounds.max": wounds,
    "system.status.wounds.value": wounds
  }, { diff: false });
}
