import { MODULE_ID, PROFILES, UUID } from "./data.js";

const PACK_NAME = "wfrp4e-quick-npc-library";
const PACK_LABEL = "WFRP4e Quick NPC Library";
const BUILD_VERSION = 10;
const PREVIOUS_BUILD_VERSION = 7;
const SPECIALISATION_BUILD_VERSION = 8;
const PROMPT_FIX_BUILD_VERSION = 9;
const TALENT_UUIDS = new Set(Object.values(UUID.talent));
const REPAIR_IDS = new Set(PROFILES.filter(profile =>
  profile.id === "giant-spider" || profile.items.some(item =>
    item.specification && TALENT_UUIDS.has(item.uuid))).map(profile => profile.id));
const PROMPT_FIX_IDS = new Set(["bray-shaman", "great-bray-shaman", "giant-spider", "giant-wolf"]);
const REPAIR_IDS_10 = new Set([
  "giant-spider", "giant-wolf", "goblin-spearman", "goblin-wolf-rider",
  "orc-boar-boy", "orc-boar-boy-big-un", "night-goblin-spear-carrier",
  "ungor", "ungor-halfhorn", "hobgoblin-wolf-rider",
  "forest-goblin-spider-rider", "forest-goblin-warrior",
  "herbalist", "master-merchant"
]);

// Only sort actors created by this library. A folder explicitly chosen by the
// GM always takes precedence, including when an actor is dragged into it.
function libraryCategory(actor, data) {
  if (actor.pack || !game.user?.isGM) return null;
  const profileId = actor.getFlag(MODULE_ID, "profileId") ?? data?.flags?.[MODULE_ID]?.profileId;
  const profile = PROFILES.find(entry => entry.id === profileId);
  return profile?.folder ?? null;
}

function findCategoryFolder(name) {
  const root = game.folders.find(folder => folder.type === "Actor" &&
    folder.name === PACK_LABEL && !folder.folder);
  return game.folders.find(folder => folder.type === "Actor" &&
    folder.folder?.id === root?.id && folder.name === name);
}

Hooks.on("preCreateActor", (actor, data) => {
  const category = libraryCategory(actor, data);
  if (!category || data.folder || actor.folder) return;
  const folder = findCategoryFolder(category);
  if (folder) actor.updateSource({folder: folder.id});
});

let folderQueue = Promise.resolve();
function ensureWorldFolder(category) {
  // Serialise simultaneous imports so they cannot create duplicate roots.
  const result = folderQueue.then(() => createWorldFolder(category));
  folderQueue = result.catch(() => {});
  return result;
}

async function createWorldFolder(category) {
  let root = game.folders.find(folder => folder.type === "Actor" &&
    folder.name === PACK_LABEL && !folder.folder);
  if (!root) root = await Folder.create({name: PACK_LABEL, type: "Actor"});
  let folder = findCategoryFolder(category);
  if (!folder) folder = await Folder.create({name: category, type: "Actor", folder: root.id});
  return folder;
}

// Foundry may finish a compendium import without applying the pre-create
// folder. Sort that world copy as soon as it exists.
Hooks.on("createActor", async (actor, options, userId) => {
  const category = libraryCategory(actor);
  if (game.user.id !== userId || actor.folder || !category) return;
  try {
    const folder = await ensureWorldFolder(category);
    if (actor.folder) return;
    await actor.update({folder: folder.id});
  } catch (error) {
    console.error(`${MODULE_ID} could not file imported actor ${actor.name}`, error);
  }
});

async function organiseExistingWorldActors() {
  // Earlier versions filed the six inn and kitchen actors under Hospitality.
  // Move only tagged library actors out of that old category, and leave any
  // actors the GM deliberately placed in another folder alone.
  const root = game.folders.find(folder => folder.type === "Actor" &&
    folder.name === PACK_LABEL && !folder.folder);
  const oldHospitality = game.folders.find(folder => folder.type === "Actor" &&
    folder.name === "Hospitality" && folder.folder?.id === root?.id);
  const misplaced = game.actors.filter(actor => libraryCategory(actor) &&
    (!actor.folder || (actor.folder.id === oldHospitality?.id && libraryCategory(actor) === "Tavern")));
  const changes = [];
  for (const actor of misplaced) {
    const folder = await ensureWorldFolder(libraryCategory(actor));
    changes.push({_id: actor.id, folder: folder.id});
  }
  if (changes.length) await Actor.updateDocuments(changes);
  // Earlier versions made every category at startup. Remove only empty
  // library categories and an empty library root, including old Hospitality.
  const libraryRoot = game.folders.find(folder => folder.type === "Actor" &&
    folder.name === PACK_LABEL && !folder.folder);
  if (!libraryRoot) return;
  const knownCategories = new Set([...PROFILES.map(profile => profile.folder), "Hospitality"]);
  for (const folder of [...game.folders].filter(folder => folder.type === "Actor" &&
      folder.folder?.id === libraryRoot.id && knownCategories.has(folder.name))) {
    if (!game.actors.some(actor => actor.folder?.id === folder.id) &&
        !game.folders.some(child => child.folder?.id === folder.id)) await folder.delete();
  }
  if (!game.actors.some(actor => actor.folder?.id === libraryRoot.id) &&
      !game.folders.some(folder => folder.folder?.id === libraryRoot.id)) await libraryRoot.delete();
}

Hooks.once("ready", async () => {
  if (!game.user?.isGM || game.system.id !== "wfrp4e") return;

  const firstActiveGM = game.users
    .filter(user => user.active && user.isGM)
    .sort((a, b) => a.id.localeCompare(b.id))[0];
  if (firstActiveGM?.id !== game.user.id) return;

  try {
    await organiseExistingWorldActors();
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
      const version = Number(actor?.getFlag(MODULE_ID, "buildVersion") ?? 0);
      return !actor || version < PREVIOUS_BUILD_VERSION ||
        (REPAIR_IDS.has(profile.id) && version < SPECIALISATION_BUILD_VERSION) ||
        (PROMPT_FIX_IDS.has(profile.id) && version < PROMPT_FIX_BUILD_VERSION) ||
        (REPAIR_IDS_10.has(profile.id) && version < BUILD_VERSION);
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

function silenceBrokenTrainingRoll(data, entry) {
  if (entry.uuid !== UUID.trait.trained ||
      !entry.specification?.split(/\s*,\s*/).includes("Broken")) return;

  // Broken training rolls a Fellowship bonus when the Trait is added. Keep
  // that roll and its effects, but prevent a compendium build from posting it.
  const messageCall = /\broll\.toMessage\s*\(\s*this\.script\.getChatData\s*\(\s*\)\s*\)\s*;?/;
  let modified = false;
  for (const effect of data.effects ?? []) {
    for (const scripts of [effect.system?.scriptData, effect.flags?.wfrp4e?.scriptData]) {
      if (!Array.isArray(scripts)) continue;
      for (const script of scripts) {
        if (typeof script?.script !== "string") continue;
        const scriptId = script.script.match(/\[Script\.([A-Za-z0-9]{16})\]/)?.[1];
        const body = scriptId ? game.wfrp4e.config.effectScripts[scriptId] : script.script;
        if (typeof body !== "string" || !body.includes('case "broken"') ||
            !messageCall.test(body)) continue;
        script.script = body.replace(messageCall, "");
        modified = true;
      }
    }
  }
  if (!modified) throw new Error("Could not silence the Broken training roll in the installed Trained Trait.");
}

async function cloneSourceItem(entry, profile, isSkill = false) {
  const sourceDocument = await fromUuid(entry.uuid);
  if (!sourceDocument) throw new Error(`Required compendium item did not resolve: ${entry.uuid}`);

  const data = sourceDocument.toObject();
  delete data._id;
  delete data.folder;
  delete data.ownership;

  if (entry.name) data.name = entry.name;
  // Talent specialisations live in the name. A specification field alone
  // does not stop Craftsman and similar item effects asking the GM to choose.
  if (data.type === "talent" && entry.specification && TALENT_UUIDS.has(entry.uuid)) {
    const baseName = data.name.replace(/\s*\([^()]*\)\s*$/, "").trim();
    data.name = `${baseName} (${entry.specification})`;
  }
  applySpecification(data, entry.specification);
  applyQuantity(data, entry.quantity);
  applyWorn(data, entry.worn);
  applyEquipped(data, entry.equipped);
  applyLoaded(data, entry.loaded);
  normaliseWeaponFormula(data);
  applyDamage(data, entry.damage);
  applyUgly(data, entry.ugly);
  silenceBrokenTrainingRoll(data, entry);

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

    actor = await saveCalculatedWounds(actor, profile.wounds);
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
    t: UUID.talent.veryResilient, int: UUID.talent.savvy,
    i: UUID.talent.sharp, dex: UUID.talent.nimbleFingered };
  return talents[characteristic] && profile.items.some(i => i.uuid === talents[characteristic]) ? 5 : 0;
}

function validateActor(actor, profile) {
  const source = actor.toObject();
  const wounds = profile.wounds ?? actor.system.computeWounds();
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
  // A role with two specialisations of the same Talent needs two distinct
  // embedded documents. Check every intended item survives Foundry creation.
  const unusedItems = [...actor.items];
  for (const entry of profile.items) {
    const index = unusedItems.findIndex(item => item.getFlag(MODULE_ID, "sourceUuid") === entry.uuid &&
      (!entry.specification || !TALENT_UUIDS.has(entry.uuid) ||
        item.name.endsWith(`(${entry.specification})`)));
    if (index < 0) throw new Error(`Missing item or Talent specialisation: ${entry.uuid}`);
    const [item] = unusedItems.splice(index, 1);
    if (item.type === "weapon" && entry.equipped !== undefined &&
        item.system.equipped.value !== entry.equipped) {
      throw new Error(`${item.name}: incorrect equipped state.`);
    }
    if (item.type === "armour" && entry.worn && !item.system.equipped.value) {
      throw new Error(`${item.name}: armour is not worn.`);
    }
  }
  for (const entry of profile.skills) {
    const skill = actor.items.find(i => i.getFlag(MODULE_ID, "sourceUuid") === entry.uuid);
    if (!skill) throw new Error(`Missing skill: ${entry.uuid}`);
    // Compare the unmodified total: encumbrance can legitimately penalise Agility.
    const characteristic = actor.system.characteristics[entry.characteristic];
    const actual = skill.system.advances.value + characteristic.initial + characteristic.advances;
    if (actual !== entry.total) throw new Error(`${skill.name}: expected ${entry.total}, got ${actual}.`);
  }
}

async function saveCalculatedWounds(actor, printedWounds) {
  // Creature mounts have printed Wounds that differ from the system formula.
  // Preserve the published number without enabling automatic recalculation.
  if (printedWounds !== undefined) {
    return await actor.update({
      "system.status.wounds.max": printedWounds,
      "system.status.wounds.value": printedWounds
    }, { diff: false });
  }
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
