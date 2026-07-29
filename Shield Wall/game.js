"use strict";

const STORAGE_KEY = "shield-wall-save-v1";

const RANKS = [
  { id: "S", mod: 1 },
  { id: "A", mod: 2 },
  { id: "B", mod: 3 },
  { id: "C", mod: 4 },
  { id: "D", mod: 5 },
];

const CREW_TYPES = {
  Peasant: { baseCost: 5, combat: 0, skill: 0, unlock: 1, gear: false },
  Tradesman: { baseCost: 10, combat: 0, skill: 5, unlock: 1, gear: false },
  Mercenary: { baseCost: 20, combat: 10, skill: 0, unlock: 2, gear: true },
  Huskarl: { baseCost: 50, combat: 20, skill: 10, unlock: 5, gear: true },
};

const STAT_DEFS = {
  weapon: "Weapon skill",
  ranged: "Ranged skill",
  strength: "Strength",
  agility: "Agility",
  toughness: "Toughness",
  recovery: "Recovery",
  stamina: "Stamina",
  morale: "Morale",
  discipline: "Discipline",
  intelligence: "Intelligence",
  trainer: "Trainer",
  pillaging: "Pillaging",
  repair: "Repair",
  manhunting: "Manhunting",
  speed: "Speed",
  luck: "Luck",
command: "Command",
management: "Management",
sailing: "Sailing",
};

const COMBAT_STATS = [
  "weapon",
  "ranged",
  "strength",
  "agility",
  "toughness",
  "recovery",
  "stamina",
  "morale",
  "speed",
  "discipline"
];

const AUXILIARY_STATS = [
  "trainer",
  "repair",
  "pillaging",
  "manhunting",
  "luck",
  "intelligence"
];

const TYPE_SKILL_STATS = [
  "intelligence",
  "trainer",
  "repair",
  "pillaging",
  "manhunting",
  "luck"
];

const TRAINING_STATS = Object.keys(STAT_DEFS).filter(
  (key) => !["sailing", "command", "management"].includes(key)
);
const LEADER_TRAINING_STATS = TRAINING_STATS
  .filter((stat) => stat !== "discipline" && stat !== "luck")
  .concat(["command", "sailing", "management"]);
const LEADER_COMBAT_STATS = COMBAT_STATS.filter((stat) => stat !== "discipline");
const WEAPONS = ["spear", "axe", "sword", "daneAxe", "bow"];
const ARMORS = ["none", "hauberk"];
const HELMS = ["none", "helm"];

const EQUIPMENT = {
  supplies: { label: "Supplies", cost: 1, sell: 0 },
  shield: { label: "Shield", cost: 3, sell: 1,formationBonus: 1 }, // +1% formation success chance
  spear: { label: "Spear", cost: 4, sell: 2, attack: 0.02, hit: 0, damage: 0 },
  axe: { label: "Axe", cost: 4, sell: 2, attack: 0, hit: 0, damage: 2 },
  sword: { label: "Sword", cost: 8, sell: 4, attack: 0.01, hit: 0.03, damage: 1 },
  daneAxe: { label: "Dane Axe", cost: 6, sell: 3, attack: 0, hit: 0, damage: 4 },
  hauberk: { label: "Hauberk", cost: 40, sell: 20, armor: 2 },
  helm: { label: "Helm", cost: 16, sell: 8, armor: 1 },
  bow: { label: "Bow", cost: 4, sell: 2, attack: 0, hit: 0, damage: 0 },
  longship: { label: "Longship", cost: 60, sell: 30 },
};

const DESTINATIONS = {
  England: {
    note: "More archers and more bow loot.",
    supplyBonus: 0,
    spoils: 1,
    enemy: { bows: 0.25, spears: 0.08, swords: 0, toughness: 0 },
  },
  Ireland: {
    note: "More spears and a stronger enemy champion.",
    supplyBonus: 0,
    spoils: 1,
    enemy: { bows: 0, spears: 0.2, swords: 0, toughness: 3 },
  },
  France: {
    note: "Tougher foes, more swords and armor, 20% more spoils.",
    supplyBonus: 20,
    spoils: 1.2,
    enemy: { bows: 0, spears: 0, swords: 0.2, toughness: 8 },
  },
};

const TARGETS = [
  {
    id: "Hamlet",
    count: [5, 7],
    rank: "D",
    gold: [350, 450],
    xp: [30, 40],
    supplies: [5, 10],
    slaveRoll: () => (chance(0.2) ? 1 : 0),
    equipment: () => randomEquipmentDrop([1, 1, 2, 3], [0.4, 0.2, 0.3, 0.1], false),
  },
  {
    id: "Village",
    count: [9, 11],
    rank: "C",
    gold: [650, 750],
    xp: [60, 75],
    supplies: [8, 14],
    slaveRoll: () => randInt(0, 2),
    equipment: () => randomEquipmentDrop([2, 3, 4], [0.5, 0.3, 0.2], true),
  },
  {
    id: "Town",
    count: [16, 18],
    rank: "B",
    gold: [950, 1050],
    xp: [105, 125],
    supplies: [12, 22],
    slaveRoll: () => randInt(1, 4),
    equipment: () => randomEquipmentDrop([4, 5, 6], [0.5, 0.3, 0.2], true),
  },
  {
    id: "City",
    count: [35, 40],
    rank: "B",
    gold: [2000, 2200],
    xp: [440, 485],
    supplies: [25, 45],
    slaveRoll: () => randInt(3, 8),
    equipment: () => randomEquipmentDrop([8, 12, 16], [0.5, 0.3, 0.2], true),
  },
];

const FORMATIONS = {
  boarsSnout: {
    label: "Boars Snout",
    text: "Disrupt enemy morale by 10%, 15%, or 20%.",
  },
  reinforceCenter: {
    label: "Reinforce Center",
    text: "Boost shield wall morale by 10%, 15%, or 20%.",
  },
  reinforceEnds: {
    label: "Reinforce Ends",
    text: "Men at the ends gain +2.5%, +5%, or +7.5% action chance.",
  },
  takeField: {
    label: "Take the Field",
    text: "Gain +2, +3, or +4 total ranged attacks before the clash.",
  },
};

const NAMES = [
  "Asgeir", "Brand", "Eirik", "Finn", "Frode", "Geir", "Halfdan", "Ivar", "Kare", "Rune", "Tove", "Arvid", "Bjarne", "Dagfinn", "Einar", "Gunnar", "Harald", "Jorund",
  "Leif", "Magnus", "Njall", "Olaf", "Orri", "Ragnar", "Sigurd", "Skarde", "Sten", "Sigrid", "Gorm", "Haldor", "Ingrid", "Svend", "Torsten", "Ødger", "Alf", "Knud",
  "Toke", "Ulf", "Viggo", "Yngvar", "Arne", "Bersi", "Dag", "Egil", "Björn", "Hakon", "Jarl", "Ketil", "Loki", "Rolf", "Sven", "Thor", "Vidar", "Trygve", "Troels", "Vebjørn", "Åsmund", "Bodil", "Eydis", "Gudrun", "Sigrun", 
];

const LAST_NAMES = [
  "Ironhand", "Waveborn", "Ashcloak", "Redshield", "Keelson", "Oathkeeper", "Wolfmark",
  "Stormeye", "Broadbelt", "Farseer", "Hardrada", "Ravenhelm", "the Tall", "Ironside",
  "Berserk", "the Troll", "Bluetooth", "the Boneless", "Stoneguard", "Frostbeard", "Skullsplitter",
  "Thunderaxe", "Bloodfist", "Stonevein", "Grimbriar", "Frostwulf", "Steelheart", "Ironmane",
  "Hawkshield", "Mistwalker", "Stormhammer", "Dragonborn", "Bonebreaker", "Frostbrand", "Blackshield",
  "Oakenshield", "Bearclaw","Icevein","Whalebone","Longspear","Winterborn","Seawolf","Deepkeel","Blacksail","Graycloak","Ironwolf","Rimehammer","Skyraven","Firebeard","Boarsbane","Shattershield","Whitefang","Northwind","Darkfjord","Hammerfall"
  ,"Whalebane", "Coldwater","Seafoam","Goldbeard","Wolfbane","Stonefist","Grimwolf","Icebreaker","Stormborn","Longblade","Bearhide","Frostshield","Ravenscar","Deephelm","Wolfblood","Snowcloak","Ironoak","Battleborn","Grayshield","Thornaxe"
];

const TARGET_DIFFICULTY = {
  Hamlet: 0,
  Village: 1,
  Town: 2,
  City: 4,
};

let state = null;
let activeView = "home";
let toastTimer = null;
let pendingLeader = null;
let importAsOpponent = false;

const app = document.querySelector("#app");

let bgMusic = document.getElementById("bgMusic");
let raidMusic = document.getElementById("raidMusic");
let currentMusicTrack = null;
let musicFadeTimer = null;

function playMusic(track) {
  const next = track === "raid" ? raidMusic : bgMusic;
  const current = currentMusicTrack === "raid" ? raidMusic : currentMusicTrack === "home" ? bgMusic : null;

  if (!next) return;
  if (currentMusicTrack === track && !next.paused) return;

  clearInterval(musicFadeTimer);

  const startNext = () => {
    currentMusicTrack = track;
    next.volume = 0;
    next.play().catch(() => {});
    fadeVolume(next, 1);
  };

  if (current && !current.paused && current !== next) {
    fadeVolume(current, 0, () => {
      current.pause();
      startNext();
    });
  } else {
    startNext();
  }
}

function stopAllMusic() {
  clearInterval(musicFadeTimer);
  bgMusic.pause();
  raidMusic.pause();
  currentMusicTrack = null;
}

function fadeVolume(audio, targetVolume, onComplete) {
  const duration = 900;
  const stepMs = 50;
  const startVolume = audio.volume;
  const change = targetVolume - startVolume;
  let elapsed = 0;

  clearInterval(musicFadeTimer);
  musicFadeTimer = setInterval(() => {
    elapsed += stepMs;
    const progress = Math.min(1, elapsed / duration);
    audio.volume = clamp(startVolume + change * progress, 0, 1);
    if (progress >= 1) {
      clearInterval(musicFadeTimer);
      audio.volume = targetVolume;
      if (onComplete) onComplete();
    }
  }, stepMs);
}

function raidLocked() {
  return !!state.raid;
}

const IMAGE_SOURCES = {
  battleBackground: "Background.png",
  default: "Viking Sprite.png",
  spear: "Spearsman.png",
  axe: "Axeman.png",
  sword: "swordsman.png",
  daneAxe: "Dane axeman.png",
  Hamlet: "Hamlet.png",
  Village: "village.png",
  Town: "Town.png",
  City: "City.png",
};

const images = {};

function loadBattleImages() {
  Object.entries(IMAGE_SOURCES).forEach(([key, src]) => {
    const img = new Image();
    img.src = encodeURI(src);
    img.onload = () => render();
    images[key] = img;
  });
}

loadBattleImages();

function getManSprite(man) {
  const weapon = man?.equipment?.weapon;
  const meleeWeapons = ["spear", "axe", "sword", "daneAxe"];
  if (!weapon || !meleeWeapons.includes(weapon)) {
    if (images.spear && images.spear.complete && images.spear.naturalWidth) {
      return images.spear;
    }
    return images.default;
  }

  if (images[weapon] && images[weapon].complete && images[weapon].naturalWidth) {
    return images[weapon];
  }

  return images.default;
}

function getBattleBackground() {
  if (state?.raid?.importedOpponent && images.City?.complete && images.City.naturalWidth) {
    return images.City;
  }
  const location = state?.raid?.battle?.target || state?.raid?.destination;
  if (location && images[location] && images[location].complete && images[location].naturalWidth) {
    return images[location];
  }
  return images.battleBackground;
}

const importFileInput = document.createElement("input");
importFileInput.type = "file";
importFileInput.accept = "application/json";
importFileInput.style.display = "none";
importFileInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (file) {
    if (importAsOpponent) importOpponentFile(file);
    else importGameFile(file);
  }
  importAsOpponent = false;
  importFileInput.value = "";
});
document.body.appendChild(importFileInput);

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

function chance(value) {
  return Math.random() < value;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function round(value) {
  return Math.round(value);
}

function ceil(value) {
  return Math.ceil(value);
}

function formatStat(value) {
  return String(Math.round(value));
}

function getRank(rankId) {
  return RANKS.find((rank) => rank.id === rankId) || RANKS[RANKS.length - 1];
}

function rankCostMultiplier(rankId) {
  return 6 - getRank(rankId).mod;
}

function statRoll(rankId) {
  const raw = rand(0, 100);
  const mod = getRank(rankId).mod;
  return clamp(raw - raw * (0.12 * mod));
}

function rollStats(rankId, typeName = "Peasant", leader = false) {
  const type = CREW_TYPES[typeName] || CREW_TYPES.Peasant;
  const stats = {};

  Object.keys(STAT_DEFS).forEach((key) => {
    let value = statRoll(rankId);

    if (!leader && ["sailing", "command", "management"].includes(key)) {
      value = 0;
    } else {
      if (COMBAT_STATS.includes(key)) value += type.combat;
      if (TYPE_SKILL_STATS.includes(key)) value += type.skill;
    }

    stats[key] = clamp(value);
  });

  if (leader) {
    stats.sailing = clamp(statRoll("S"));
    stats.command = clamp(statRoll("S"));
    stats.management = clamp(statRoll("S"));
    stats.discipline = 0;
  }

  return stats;
}

function maxHp(man) {
  return Math.max(6, round(5 + effectiveStat(man, "toughness") * 0.2));
}

function maxStamina(man) {
  return Math.max(50, round(50 + effectiveStat(man, "stamina") * 0.7));
}

function effectiveStat(man, key) {
  const base = man.stats[key] || 0;

  if (!man.injuries || man.injuries.length === 0 || man.isLeader) {
    return base;
  }

  let multiplier = 1;

  man.injuries.forEach((injury) => {
    const effects = injury.permanent
      ? PERMANENT_INJURY_EFFECTS[injury.part]
      : INJURY_EFFECTS[injury.part];

    if (effects && effects[key]) {
      multiplier *= (100 - effects[key]) / 100;
    }
  });

  return clamp(Math.round(base * multiplier));
}

function createLeader() {
  const stats = rollStats("S", "Peasant", true);
  const firstName = NAMES[randInt(0, NAMES.length - 1)];
  const lastName = LAST_NAMES[randInt(0, LAST_NAMES.length - 1)];
  const leader = {
    id: "leader",
    name: `${firstName} ${lastName}`,
    rank: "S",
    type: "Leader",
    isLeader: true,
    level: 1,
    xp: 0,
    stats,
    hp: 1,
    staminaNow: 100,
     primary: "weapon",
    secondary: "morale",
    equipment: { weapon: "axe", shield: true, armor: "none", helm: "none", bow: false },
    battle: null,
  };
  leader.hp = maxHp(leader);
  leader.staminaNow = maxStamina(leader);
  return leader;
}

function createCrew(rankId, typeName) {
  const firstName = NAMES[randInt(0, NAMES.length - 1)];
  const lastName = LAST_NAMES[randInt(0, LAST_NAMES.length - 1)];
  const name = `${firstName} ${lastName}`;
  const man = {
    id: `crew-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name,
    rank: rankId,
    type: typeName,
    stats: rollStats(rankId, typeName),
    hp: 1,
    staminaNow: 100,
    active: true,
    scoutOut: false,
    injuries: [],
    primary: "weapon",
    secondary: "morale",
    equipment: { weapon: "none", shield: false, armor: "none", helm: "none", bow: false },
    battle: null,
  };
  man.hp = maxHp(man);
  man.staminaNow = maxStamina(man);
  return man;
}

function createEnemy(rankId, target, destination) {
  const man = createCrew(rankId, "Peasant");
  man.id = `enemy-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  man.name = `${target.id} Guard`;
  man.type = "Enemy";
  man.active = true;
  man.injuries = [];
  const dest = DESTINATIONS[destination];
  Object.keys(man.stats).forEach((key) => {
    man.stats[key] = clamp(man.stats[key] + (dest.enemy.toughness || 0));
  });
  man.equipment.weapon = rollEnemyWeapon(target.id, dest);
  man.equipment.shield = rollEnemyShield(target.id, man.equipment.weapon);
  man.equipment.armor = rollEnemyArmor(target.id);
  man.equipment.helm = rollEnemyHelm(target.id);
  man.equipment.bow = chance(dest.enemy.bows || 0);
  man.hp = maxHp(man);
  return man;
}

function rollEnemyWeapon(targetId, dest) {
  if (chance(dest.enemy.swords || 0)) return "sword";
  if (chance(dest.enemy.spears || 0)) return "spear";
  if (targetId === "Hamlet") return chance(0.5) ? "spear" : "axe";
  if (targetId === "Village") return chance(0.2) ? "sword" : chance(0.5) ? "spear" : "axe";
  const rollValue = Math.random();
  if (rollValue < 0.7) return "spear";
  if (rollValue < 0.9) return "axe";
  return "sword";
}

function rollEnemyShield(targetId, weapon) {
  if (weapon === "daneAxe") return false;
  if (targetId === "Hamlet") return chance(0.5);
  if (targetId === "Village") return chance(0.55);
  return true;
}

function rollEnemyArmor(targetId) {
  if (targetId === "Town" || targetId === "City") return chance(0.1) ? "hauberk" : "none";
  return "none";
}

function rollEnemyHelm(targetId) {
  if (targetId === "Village") return chance(0.35) ? "helm" : "none";
  if (targetId === "Town" || targetId === "City") return chance(0.2) ? "helm" : "none";
  return "none";
}

function recruitCost(recruit) {
  const type = CREW_TYPES[recruit.type];
  return type.baseCost * rankCostMultiplier(recruit.rank);
}

function availableRanks() {
  if (state.leader.level <= 1) return ["C", "D"];
  if (state.leader.level === 2) return ["B", "C", "D"];
  if (state.leader.level === 3) return ["A", "B", "C", "D"];
  return ["S", "A", "B", "C", "D"];
}

function rollRecruitRank() {
  const ranks = availableRanks();
  if (state.leader.level <= 1) return chance(0.5) ? "C" : "D";
  const middle = ranks[Math.floor(ranks.length / 2)];
  if (chance(0.5)) return middle;
  return chance(0.5) ? ranks[0] : ranks[ranks.length - 1];
}

function rollRecruitType() {
  const unlocked = Object.entries(CREW_TYPES)
    .filter(([, type]) => state.leader.level >= type.unlock)
    .map(([name]) => name);
  const rollValue = Math.random();
  if (unlocked.includes("Huskarl") && rollValue > 0.92) return "Huskarl";
  if (unlocked.includes("Mercenary") && rollValue > 0.7) return "Mercenary";
  if (rollValue > 0.48) return "Tradesman";
  return "Peasant";
}

function refreshRecruits(initial = false) {
  const baseCount = initial ? 10 : 5;
  const count = baseCount + state.recruitBonus;

  state.recruits = Array.from(
    { length: count },
    () => createCrew(rollRecruitRank(), rollRecruitType())
  );

  state.recruits.forEach((recruit) => {
    if (CREW_TYPES[recruit.type].gear) {
      recruit.equipment.weapon = chance(0.5) ? "spear" : "axe";
      recruit.equipment.shield = true;
    }
  });
}

function createState() {
  const leader = pendingLeader || createLeader();
  pendingLeader = null;
  const fresh = {
    started: true,
    gold: 250,
    supplies: 0,
    slaves: 0,
    longships: 1,
    land: 0,
    sowedFields: 0,
    recruitBonus: 0,
    voyageCount: 0,
    turn: 1,
    seaEvent: null,
    inventory: {
      shield: 0,
      spear: 0,
      axe: 0,
      sword: 0,
      daneAxe: 0,
      hauberk: 0,
      helm: 0,
      bow: 0,
    },
    leader,
    crew: [],
    recruits: [],
    log: [],
    raid: null,
  };
  state = fresh;
  refreshRecruits(true);
  addLog("Take up your axe, Viking lord. Recruit your men, stock the longship, and make the Gods proud.");
  playMusic("home");
  return fresh;
}

function addLog(text, kind = "info") {
  state.log.unshift({
    id: `${Date.now()}-${Math.random()}`,
    text,
    kind,
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  });
  state.log = state.log.slice(0, 150);
}

function notify(text) {
  const old = document.querySelector(".toast");
  if (old) old.remove();
  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = text;
  document.body.appendChild(node);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.remove(), 3200);
}

function saveGame() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  notify("Game saved.");
}

function exportGame() {
  if (!state) {
    notify("No game in progress to export.");
    return;
  }
  const exportData = {
    version: 1,
    timestamp: new Date().toISOString(),
    state,
  };
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `shield-wall-save-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  notify("Export file created.");
}

function parseImportedState(rawText) {
  const parsed = JSON.parse(rawText);
  return parsed?.state ?? parsed;
}

function cloneGameState(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildOpponentRoster(importedState) {
  const members = [importedState.leader, ...(importedState.crew || [])].filter(Boolean);
  const roster = members.map((member, index) => {
    const stats = { ...member.stats } || {};
    const enemy = {
      id: `opponent-${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
      name: member.name || `Opponent ${index + 1}`,
      rank: member.rank || "C",
      type: "Enemy",
      isLeader: false,
      stats,
      active: true,
      scoutOut: false,
      injuries: Array.isArray(member.injuries) ? member.injuries.map((injury) => ({ ...injury })) : [],
      primary: member.primary || "weapon",
      secondary: member.secondary || "morale",
      equipment: { ...member.equipment },
      battle: null,
    };
    enemy.hp = maxHp(enemy);
    enemy.staminaNow = 100;
    return enemy;
  });
  return roster.filter((enemy) => enemy.stats && Object.keys(enemy.stats).length);
}

function createImportedOpponentRaid(enemyRoster, importedName = "Imported Opponent") {
  const snapshot = cloneGameState(state);
  const snapshotView = activeView;
  state.raid = {
    destination: importedName,
    targetIndex: 0,
    carriedSupplies: state.supplies,
    suggested: 0,
    moraleMod: 0,
    formation: "reinforceCenter",
    scouted: true,
    scoutInfo: null,
    battle: null,
    report: null,
    complete: false,
    importedOpponent: true,
    preBattleState: snapshot,
    preBattleView: snapshotView,
  };
  state.raid.battle = {
    stage: "setup",
    target: importedName,
    round: 0,
    enemies: enemyRoster,
    enemyWall: enemyRoster.map((enemy) => enemy.id),
    playerWall: voyageParty().map((man) => man.id),
    reserves: [],
    enemyMorale: 0,
    enemyMaxMorale: 0,
    playerMorale: 0,
    playerMaxMorale: 0,
    formationDegree: 0,
    flankBonus: 0,
    rangedBonus: 0,
    rallyUsed: false,
    message: "A rival warband approaches. Choose your shield wall.",
    events: [],
    enemyFormation: "reinforceCenter",
  };
}

function importOpponentFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const importedState = parseImportedState(reader.result);
      if (!importedState || typeof importedState !== "object" || !importedState.leader) {
        throw new Error("Invalid save file.");
      }
      if (!state) createState();
      const enemyRoster = buildOpponentRoster(importedState);
      if (!enemyRoster.length) {
        throw new Error("No valid crew found in imported save.");
      }
      const importedName = importedState.leader?.name ? `${importedState.leader.name}'s Warband` : "Imported Opponent";
      createImportedOpponentRaid(enemyRoster, importedName);
      activeView = "raid";
      render();
      notify("Imported opponent roster. Prepare your wall.");
    } catch (error) {
      console.error(error);
      notify("Could not import opponent save file.");
    }
  };
  reader.onerror = () => {
    console.error(reader.error);
    notify("Failed to read opponent save file.");
  };
  reader.readAsText(file);
}

function triggerImport() {
  importAsOpponent = false;
  importFileInput.click();
}

function triggerOpponentImport() {
  importAsOpponent = true;
  importFileInput.click();
}

function loadGame() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  try {
    state = JSON.parse(raw);
    state.turn = state.turn || 1;
    activeView = "home";
    render();
    notify("Game loaded.");
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

function resetGame() {
  localStorage.removeItem(STORAGE_KEY);
  state = null;
  pendingLeader = createLeader();
  renderStart();
}

function capacity() {
  return state.longships * 10;
}

function activeCrew() {
  return state.crew.filter((man) => man.active);
}

function voyageParty() {
  return [state.leader, ...activeCrew().filter((man) => !man.scoutOut)];
}

function suggestedSupplies(destination = "England") {
  const men = Math.max(1, 1 + activeCrew().length);
  return men * 30 + DESTINATIONS[destination].supplyBonus;
}

function minimumSupplies(destination = "England") {
  return ceil(suggestedSupplies(destination) * 0.75);
}
function surplusSupplies(destination = "England") {
  return ceil(suggestedSupplies(destination) * 1.15);
}

function goldNeededForMinimumSupplies() {
  const neededSupplies = Math.max(0, minimumSupplies() - state.supplies);
  return neededSupplies;
}

function confirmSupplyWarning(amount) {
  const remainingGold = state.gold - amount;
  const neededGold = goldNeededForMinimumSupplies();
  if (remainingGold < neededGold && !state.supplyWarningAcknowledged) {
    const proceed = confirm(
      `Spending that gold would leave you with less than ${neededGold} gold needed to buy the minimum supplies for a raid with your active crew. Continue?`
    );
    if (!proceed) return false;
    state.supplyWarningAcknowledged = true;
  }
  return true;
}

function passiveIncome() {
  const base = 45 + state.land * 25 + state.slaves * 5 + state.sowedFields * 40;
  return ceil(base * (1 + (state.leader.stats.management || 0) * 0.003));
}

function spendGold(amount) {
  if (state.gold < amount) {
    notify("Not enough gold.");
    return false;
  }
  state.gold -= amount;
  return true;
}

function buySupplies(amount) {
  if (raidLocked()) {
  notify("You cannot do that while away on a raid.");
  return;
}
  if (!spendGold(amount)) return;
  state.supplies += amount;
  addLog(`Bought ${amount} supplies.`);
  render();
}

function buyMaxSupplies() {
  if (raidLocked()) {
    notify("You cannot do that while away on a raid.");
    return;
  }

  if (state.gold <= 0) {
    notify("You do not have any gold.");
    return;
  }

  const amount = state.gold;

  state.supplies += amount;
  state.gold = 0;

  addLog(`Bought ${amount} supplies.`);
  render();
}

function buyItem(item, amount = 1) {
  if (raidLocked()) {
  notify("You cannot do that while away on a raid.");
  return;
}
  const cost = EQUIPMENT[item].cost * amount;
  if (!confirmSupplyWarning(cost)) return;
  if (!spendGold(cost)) return;
  if (item === "longship") {
    state.longships += amount;
  } else {
    state.inventory[item] += amount;
  }
  addLog(`Bought ${amount} ${EQUIPMENT[item].label}${amount > 1 ? "s" : ""}.`);
  render();
}

function sellItem(item) {
  if (raidLocked()) {
  notify("You cannot do that while away on a raid.");
  return;
}
  if ((state.inventory[item] || 0) < 1) return;
  state.inventory[item] -= 1;
  state.gold += EQUIPMENT[item].sell;
  addLog(`Sold one ${EQUIPMENT[item].label}.`);
  render();
}

function landCost() {
  return 100 + state.land * 50;
}

function buyLand() {
  if (raidLocked()) {
  notify("You cannot do that while away on a raid.");
  return;
}
  const cost = landCost();

  if (!confirmSupplyWarning(cost)) return;
  if (!spendGold(cost)) return;

  state.land += 1;

  addLog(
    `Improved the home fields for ${cost} gold. Passive income rose by 25 gold per voyage.`
  );

  render();
}

function sowField() {
  if (raidLocked()) {
  notify("You cannot do that while away on a raid.");
  return;
}
  const maxSown = 1 + state.land;
  if (state.sowedFields >= maxSown) {
    notify("No more prepared fields can be sown before the next voyage.");
    return;
  }
  if (!confirmSupplyWarning(20)) return;
  if (!spendGold(20)) return;
  state.sowedFields += 1;
  addLog("Sowed a field. It will add 40 gold when the next voyage ends.");
  render();
}

function slaveCost() {
  return 20 + state.slaves * 5
}

function buySlave() {
  if (raidLocked()) {
    notify("You cannot do that while away on a raid.");
    return;
  }

  const cost = slaveCost();

  if (!confirmSupplyWarning(cost)) return;
  if (!spendGold(cost)) return;

  state.slaves += 1;
  addLog(`Bought one slave for ${cost} gold. Passive income rose by 5 gold.`);
  render();
}

function skipTurn() {
  if (raidLocked()) {
    notify("You cannot skip time while away on a raid.");
    return;
  }

  const income = passiveIncome();
  state.gold += income;

  state.voyageCount += 1;
  state.turn = (state.turn || 1) + 1;
  state.sowedFields = 0;

  healInjuries();
  refreshRecruits(false);

  addLog(`The crew stayed at the Home Fjord. Farms, fields, and slaves produced ${income} gold.`);

  render();
}

function tentCost() {
  if (raidLocked()) {
  notify("You cannot do that while away on a raid.");
  return;
}
  return 20 + (state.recruitBonus / 10) * 20;
}

function enlargeTent() {
  if (raidLocked()) {
  notify("You cannot do that while away on a raid.");
  return;
}
  const cost = tentCost();

  if (!confirmSupplyWarning(cost)) return;
  if (!spendGold(cost)) return;

  state.recruitBonus += 1;

  // Add exactly one new recruit immediately.
  const recruit = createCrew(rollRecruitRank(), rollRecruitType());

  if (CREW_TYPES[recruit.type].gear) {
    recruit.equipment.weapon = chance(0.5) ? "spear" : "axe";
    recruit.equipment.shield = true;
  }

  state.recruits.push(recruit);

  addLog(`Expanded the recruitment tent for ${cost} gold.`);

  render();
}

function hireRecruit(id) {
  if (raidLocked()) {
  notify("You cannot do that while away on a raid.");
  return;
}
  const recruit = state.recruits.find((candidate) => candidate.id === id);
  if (!recruit) return;
  const cost = recruitCost(recruit);
  if (!confirmSupplyWarning(cost)) return;
  if (!spendGold(cost)) return;
  state.recruits = state.recruits.filter((candidate) => candidate.id !== id);
  state.crew.push(recruit);
  addLog(`${recruit.name}, ${recruit.rank}-rank ${recruit.type}, joined the crew for ${cost} gold.`);
  render();
}

function fireCrew(id) {
  if (raidLocked()) {
  notify("You cannot do that while away on a raid.");
  return;
}
  const man = state.crew.find((candidate) => candidate.id === id);
  if (!man) return;
  unequipAll(man);
  state.crew = state.crew.filter((candidate) => candidate.id !== id);
  addLog(`${man.name} was sent away from the crew.`);
  render();
}

function toggleCrewActive(id) {
  if (raidLocked()) {
  notify("You cannot do that while away on a raid.");
  return;
}
  const man = state.crew.find((candidate) => candidate.id === id);
  if (!man) return;
  man.active = !man.active;
  addLog(`${man.name} will ${man.active ? "sail on the next voyage" : "stay at the Home Fjord"}.`);
  render();
}

function shouldAutoEquipBow(man) {
  return !man.equipment.bow && state.inventory.bow > 0 && effectiveStat(man, "ranged") >= 0;
}

function equipMan(id, slot, value) {
  if (raidLocked()) {
  notify("You cannot do that while away on a raid.");
  return;
}
  const man = findMan(id);
  if (!man) return;
  if (slot === "weapon") {
    if (value !== "none" && value !== man.equipment.weapon && state.inventory[value] < 1) {
      notify(`No ${EQUIPMENT[value].label} is available.`);
      render();
      return;
    }
    if (man.equipment.weapon && man.equipment.weapon !== "none") state.inventory[man.equipment.weapon] += 1;
    man.equipment.weapon = "none";
    if (value !== "none") {
      state.inventory[value] -= 1;
      man.equipment.weapon = value;
      if (value === "daneAxe" && man.equipment.shield) {
        state.inventory.shield += 1;
        man.equipment.shield = false;
      }
    }
  }
  if (slot === "shield") {
    const wantsShield = value === "yes";
    if (man.equipment.weapon === "daneAxe" && wantsShield) {
      notify("Dane axes cannot be used with shields.");
      return;
    }
    if (!man.equipment.shield && wantsShield && state.inventory.shield < 1) {
      notify("No shield is available.");
      render();
      return;
    }
    if (man.equipment.shield && !wantsShield) {
      state.inventory.shield += 1;
      man.equipment.shield = false;
    } else if (!man.equipment.shield && wantsShield && state.inventory.shield > 0) {
      state.inventory.shield -= 1;
      man.equipment.shield = true;
    }
  }
  if (slot === "armor") {
    if (value === "hauberk" && man.equipment.armor !== "hauberk" && state.inventory.hauberk < 1) {
      notify("No hauberk is available.");
      render();
      return;
    }
    if (man.equipment.armor === "hauberk") state.inventory.hauberk += 1;
    man.equipment.armor = "none";
    if (value === "hauberk" && state.inventory.hauberk > 0) {
      state.inventory.hauberk -= 1;
      man.equipment.armor = "hauberk";
    }
  }
  if (slot === "helm") {
    if (value === "helm" && man.equipment.helm !== "helm" && state.inventory.helm < 1) {
      notify("No helm is available.");
      render();
      return;
    }
    if (man.equipment.helm === "helm") state.inventory.helm += 1;
    man.equipment.helm = "none";
    if (value === "helm" && state.inventory.helm > 0) {
      state.inventory.helm -= 1;
      man.equipment.helm = "helm";
    }
  }
  if (slot === "bow") {
    const wantsBow = value === "yes";
    if (!man.equipment.bow && wantsBow && state.inventory.bow < 1) {
      notify("No bow is available.");
      render();
      return;
    }
    if (man.equipment.bow && !wantsBow) {
      state.inventory.bow += 1;
      man.equipment.bow = false;
    } else if (!man.equipment.bow && wantsBow && state.inventory.bow > 0) {
      state.inventory.bow -= 1;
      man.equipment.bow = true;
    }
  }
  render();
}

function unequipAll(man) {
  if (raidLocked()) {
  notify("You cannot do that while away on a raid.");
  return;
}
  if (man.equipment.weapon && man.equipment.weapon !== "none") state.inventory[man.equipment.weapon] += 1;
  if (man.equipment.shield) state.inventory.shield += 1;
  if (man.equipment.armor === "hauberk") state.inventory.hauberk += 1;
  if (man.equipment.helm === "helm") state.inventory.helm += 1;
  if (man.equipment.bow) state.inventory.bow += 1;
  man.equipment = { weapon: "none", shield: false, armor: "none", helm: "none", bow: false };
}

function autoEquip() {
  if (raidLocked()) {
  notify("You cannot do that while away on a raid.");
  return;
}
  const sorted = [...state.crew, state.leader].sort((a, b) => effectiveStat(b, "weapon") - effectiveStat(a, "weapon"));
  sorted.forEach((man) => {
    if (man.equipment.weapon === "none") {
      const weapon = ["sword", "axe", "spear", "daneAxe"].find((item) => state.inventory[item] > 0);
      if (weapon) equipMan(man.id, "weapon", weapon);
    }
    if (!man.equipment.shield && man.equipment.weapon !== "daneAxe" && state.inventory.shield > 0) equipMan(man.id, "shield", "yes");
    if (man.equipment.armor === "none" && state.inventory.hauberk > 0) equipMan(man.id, "armor", "hauberk");
    if (man.equipment.helm === "none" && state.inventory.helm > 0) equipMan(man.id, "helm", "helm");
  });

  const bowCandidates = [...state.crew, state.leader]
    .filter((man) => effectiveStat(man, "ranged") >= 0)
    .sort((a, b) => effectiveStat(b, "ranged") - effectiveStat(a, "ranged"));

  let bowCount = state.inventory.bow;
  bowCandidates.forEach((man) => {
    if (bowCount <= 0) return;
    if (shouldAutoEquipBow(man)) {
      equipMan(man.id, "bow", "yes");
      bowCount -= 1;
    }
  });

  addLog("Auto-equipped the crew from the best available gear.");
  render();
}

function applyAutoEquip() {                                                            
  if (raidLocked()) {
  notify("You cannot do that while away on a raid.");
  return;
}                                                                                         
                                                                                                                                                                                
  const crew = [...activeCrew(), state.leader];                                                                                                                                 
                                                                                                                                                                                
  crew.forEach(autoEquip);                                                                                                                                                      
                                                                                                                                                                                
}                       

function setTraining(id, slot, stat) {
  if (raidLocked()) {
  notify("You cannot do that while away on a raid.");
  return;
}
  const man = findMan(id);
  if (!man) return;
  if (man.isLeader && ["discipline", "luck"].includes(stat)) return;

  const options = man.isLeader ? LEADER_TRAINING_STATS : TRAINING_STATS;
  if (!options.includes(stat)) return;

  applyTraining(man, slot, stat, options);
  render();
}

function setAllCrewTraining(slot, stat) {
  if (raidLocked()) {
  notify("You cannot do that while away on a raid.");
  return;
}
  if (!["primary", "secondary"].includes(slot) || !TRAINING_STATS.includes(stat)) return;

  state.crew.forEach((man) => {
    applyTraining(man, slot, stat, TRAINING_STATS);
  });
  render();
}

function applyTraining(man, slot, stat, options) {
  if (slot === "primary") {
    if (stat === man.secondary) {
      man.secondary = man.primary;
    }
    man.primary = stat;
  } else if (slot === "secondary") {
    if (stat === man.primary) {
      man.primary = man.secondary;
    }
    man.secondary = stat;
  }
  if (man.primary === man.secondary) {
    const other = options.find((candidate) => candidate !== man.primary);
    if (slot === "primary") {
      man.secondary = other;
    } else {
      man.primary = other;
    }
  }
}

function findMan(id) {
  if (state.leader.id === id) return state.leader;
  return state.crew.find((man) => man.id === id) || null;
}

function startRaid(destination) {
  if (state.raid) {
    notify("A raid is already underway.");
    activeView = "raid";
    render();
    return;
  }
  if (activeCrew().length < 1) {
    notify("Recruit at least one crew member before sailing.");
    return;
  }
  const voyagers = 1 + activeCrew().length;
  if (voyagers > capacity()) {
    notify("Not enough longship space for the selected crew.");
    return;
  }
  const min = minimumSupplies(destination);
  const suggested = suggestedSupplies(destination);
  if (state.supplies < min) {
    notify(`Need at least ${min} supplies for this voyage.`);
    return;
  }
  const carried = Math.min(state.supplies, suggested);
  state.supplies -= carried;
  state.raid = {
    destination,
    targetIndex: 0,
    carriedSupplies: carried,
    suggested,
    moraleMod:
      carried < suggested
        ? -10
        : carried >= suggested * 1.25
          ? 15
          : 0,
    formation: "reinforceCenter",
    scouted: false,
    scoutInfo: null,
    battle: null,
    report: null,
    complete: false,
  };
  state.crew.forEach((man) => {
    man.scoutOut = false;
  });
  addLog(`The longship left for ${destination} with ${voyagers} fighting men and ${carried} supplies.`);
  runSeaEvent("outbound");
  activeView = "raid";
  render();
}

function runSeaEvent(direction) {
  const chanceGood = clamp(45 + (state.leader.stats.sailing || 0) * 0.5, 5, 90) / 100;

  const text = chance(chanceGood)
    ? goodSeaEvent(direction)
    : badSeaEvent(direction);

  state.seaEvent = {
    direction,
    text
  };
}

function seaEventPopup() {
  if (!state.seaEvent) return "";

  return `
    <div class="modalOverlay">
      <div class="modal">
        <h2>Sailing Event</h2>

        <p>${state.seaEvent.text}</p>

        <button data-action="continueSeaEvent">
          Continue
        </button>
      </div>
    </div>
  `;
}

function goodSeaEvent(direction) {
  const rollValue = randInt(1, 100);

  if (rollValue <= 20) {
    const gain = 7 * (1 + activeCrew().length);
    if (direction === "return") state.supplies += gain;
    else state.raid.carriedSupplies += gain;

    const message = `Favorable winds on the ${direction} voyage saved food and time. +${gain} supplies.`;
    addLog(message);
    return message;

  } else if (rollValue <= 40) {
    state.raid.moraleMod += 15;

    const message = "A good omen lit the sky. The crew gained +15% morale for the raid.";
    addLog(message);
    return message;

  } else if (rollValue <= 60) {
    const gain = randInt(1, 3);

    if (direction === "return") {
      const openSpace = Math.max(0, capacity() - (1 + activeCrew().length));
      const kept = Math.min(gain, openSpace);
      state.slaves += kept;

      const message = `A foreign fishing boat was taken. +${kept} captives${gain > kept ? "; the rest could not fit" : ""}.`;
      addLog(message);
      return message;
    } else {
      state.raid.pendingSlaves = (state.raid.pendingSlaves || 0) + gain;

      const message = `A foreign fishing boat was taken. +${gain} captives if there is space on return.`;
      addLog(message);
      return message;
    }

  } else if (rollValue <= 80) {
    const gain = randInt(20, 40);
    state.gold += gain;

    const message = `A pearl was found in a clam meal. +${gain} gold.`;
    addLog(message);
    return message;

  } else {
    const drops = randomEquipmentDrop([3, 4, 5], [0.34, 0.33, 0.33], true);
    addDropsToInventory(drops);

    const message = `An abandoned ship drifted by. Gained ${describeDrops(drops)}.`;
    addLog(message);
    return message;
  }
}

function badSeaEvent(direction) {
  const rollValue = randInt(1, 100);

  if (rollValue <= 20) {
    const pool = direction === "return" ? state.supplies : state.raid.carriedSupplies;
    const loss = Math.min(pool, randInt(10, 20));

    if (direction === "return") state.supplies -= loss;
    else state.raid.carriedSupplies -= loss;

    const message = `Sea water ruined stores on the ${direction} voyage. -${loss} supplies.`;
    addLog(message, "bad");
    return message;

  } else if (rollValue <= 40) {
    state.raid.moraleMod -= 10;

    const message = "A fight over an insult spread through the crew. -10% morale.";
    addLog(message, "bad");
    return message;

  } else if (rollValue <= 60) {
    const broken = breakRandomInventory(randInt(1, 2));

    const message = `Rough handling broke equipment: ${broken || "nothing worth naming"}.`;
    addLog(message, "bad");
    return message;

  } else if (rollValue <= 80) {
    const loss = Math.min(state.gold, randInt(10, 30));
    state.gold -= loss;

    const message = `Gold was lost to rough waves. -${loss} gold.`;
    addLog(message, "bad");
    return message;

  } else {
    const victim = activeCrew()[randInt(0, Math.max(0, activeCrew().length - 1))];

    if (victim) {
      const damage = randInt(2, 4);
      victim.hp = Math.max(1, victim.hp - damage);

      const message = `${victim.name} was hurt in a working incident. -${damage} hit points.`;
      addLog(message, "bad");
      return message;
    }

    const message = "A dangerous incident occurred, but no one was injured.";
    addLog(message, "bad");
    return message;
  }
}

function breakRandomInventory(count) {
  const broken = [];
  for (let i = 0; i < count; i += 1) {
    const items = Object.keys(state.inventory).filter((item) => state.inventory[item] > 0);
    if (!items.length) break;
    const item = items[randInt(0, items.length - 1)];
    state.inventory[item] -= 1;
    broken.push(EQUIPMENT[item].label);
  }
  return broken.join(", ");
}

function prepareBattle() {
  const target = TARGETS[state.raid.targetIndex];
  const enemies = Array.from({ length: randInt(target.count[0], target.count[1]) }, () =>
    createEnemy(target.rank, target, state.raid.destination),
  );
  state.raid.battle = {
    stage: "setup",
    target: target.id,
    round: 0,
    enemies,
    enemyWall: enemies.map((enemy) => enemy.id),
    playerWall: voyageParty().map((man) => man.id),
    reserves: [],
    enemyMorale: 0,
    enemyMaxMorale: 0,
    playerMorale: 0,
    playerMaxMorale: 0,
    formationDegree: 0,
    flankBonus: 0,
    rangedBonus: 0,
    rallyUsed: false,
    message: `${target.id} sighted. Decide who stands in the shield wall and choose a formation.`,
    events: [],
  };
}

function scoutEnemy() {
  if (!state.raid || !state.raid.battle || state.raid.scouted) return;
  const candidates = activeCrew().filter((man) => !man.scoutOut);
  if (!candidates.length) {
    notify("No crew member can scout.");
    return;
  }
  const scout = candidates.sort((a, b) => effectiveStat(b, "speed") + effectiveStat(b, "intelligence") - effectiveStat(a, "speed") - effectiveStat(a, "intelligence"))[0];
  const info = [0, 25, 50, 75][randInt(0, 3)];
  const missesBattle = chance(0.5);
  scout.scoutOut = missesBattle;
  state.raid.scouted = true;

  state.raid.scoutInfo = {
  scout: scout.name,
  info,
  missesBattle,
  formation: state.raid.battle.enemyFormation
};
  if (missesBattle) {
    state.raid.battle.playerWall = state.raid.battle.playerWall.filter((id) => id !== scout.id);
    state.raid.battle.reserves = state.raid.battle.reserves.filter((id) => id !== scout.id);
  }
  addLog(`${scout.name} scouted the enemy and returned with ${info}% of the picture${missesBattle ? ", but cannot join the battle" : ""}.`);
  render();
}

function toggleWall(id) {
  const battle = state.raid.battle;
  if (battle.stage !== "setup") return;
  if (battle.playerWall.includes(id)) {
    battle.playerWall = battle.playerWall.filter((candidate) => candidate !== id);
    battle.reserves.push(id);
  } else {
    battle.reserves = battle.reserves.filter((candidate) => candidate !== id);
    battle.playerWall.push(id);
  }
  render();
}

function setFormation(formation) {
  if (!state.raid || !state.raid.battle) return;
  state.raid.formation = formation;
  render();
}

function beginBattle() {
  const battle = state.raid.battle;
  if (!battle.playerWall.length) {
    notify("At least one fighter must stand in the shield wall.");
    return;
  }
  prioritizeDaneAxesOnEnds(battle);
  initializeBattleStats(battle);
  battle.stage = "combat";
  battle.round = 0;
  applyFormation(battle);
  doRangedVolley(battle);
  battle.message = battle.events.join("<br>") || "The shield walls close.";
  drawSoon();
  render();
}

function prioritizeDaneAxesOnEnds(battle) {
  if (state.raid.formation !== "reinforceEnds") return;
  const wall = battle.playerWall.slice();
  if (wall.length < 2) return;

  const daneIds = wall.filter((id) => {
    const man = findMan(id);
    return man && man.equipment.weapon === "daneAxe";
  });
  if (!daneIds.length) return;

  const placeAt = (id, index) => {
    const currentIndex = wall.indexOf(id);
    if (currentIndex === -1 || currentIndex === index) return;
    wall.splice(currentIndex, 1);
    wall.splice(index, 0, id);
  };

  let remaining = daneIds.slice();
  const leftId = wall[0];
  if (remaining.includes(leftId)) {
    remaining = remaining.filter((id) => id !== leftId);
  } else {
    placeAt(remaining.shift(), 0);
  }

  const rightId = wall[wall.length - 1];
  if (remaining.length > 0 && !remaining.includes(rightId)) {
    placeAt(remaining.shift(), wall.length - 1);
  }

  battle.playerWall = wall;
}

function initializeBattleStats(battle) {
  [...battle.playerWall, ...battle.reserves].forEach((id) => {
    const man = findMan(id);
    if (!man) return;
    man.hp = Math.min(man.hp, maxHp(man));
    man.staminaNow = clamp(man.staminaNow || maxStamina(man), 0, maxStamina(man));
    man.battle = { damageDealt: 0, damageTaken: 0, kills: 0, injuries: 0, gains: [] };
  });
  battle.enemies.forEach((enemy) => {
    enemy.hp = maxHp(enemy);
    enemy.staminaNow = maxStamina(enemy);
    enemy.battle = { damageDealt: 0, damageTaken: 0, kills: 0, injuries: 0, gains: [] };
  });
  battle.playerMaxMorale = computeMorale("player", battle);
  battle.enemyMaxMorale = computeMorale("enemy", battle);
  battle.playerMorale = round(battle.playerMaxMorale * (1 + (state.raid.moraleMod || 0) / 100));
  battle.enemyMorale = battle.enemyMaxMorale;
  applyCoherency(battle);
}

function computeMorale(side, battle) {
  const men = side === "player"
    ? [...battle.playerWall, ...battle.reserves]
        .map(findMan)
        .filter(Boolean)
    : battle.enemyWall
        .map(id => battle.enemies.find(enemy => enemy.id === id))
        .filter(Boolean);

  const avg = average(
    men.map(man => effectiveStat(man, "morale"))
  );

  if (side === "player") {
    const leaderMorale = effectiveStat(state.leader, "morale");
    return round(100 + avg + leaderMorale);
  }

  const difficulty = TARGET_DIFFICULTY[battle.target] || 0;
  return round(100 + 50 * difficulty + avg);
}

function average(values) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) return 0;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function applyFormation(battle) {
  const wallMen = battle.playerWall.map(findMan).filter(Boolean);
  const shields = wallMen.filter((man) => man.equipment.shield).length;
  if (shields < 5) {
    battle.formationDegree = 0;
    battle.events.push("The shield wall lacks five shields. The formation fails before it begins.");
    return;
  }
  const command = effectiveStat(state.leader, "command");
  const discipline = average(wallMen.map((man) => effectiveStat(man, "discipline")));
  const morale = average(wallMen.map((man) => effectiveStat(man, "morale")));
  const score =
  randInt(1, 100) +
  command * 0.35 +
  discipline * 0.2 +
  morale * 0.1 +
  shields;
  let degree = 0;
  if (score >= 135) degree = 3;
  else if (score >= 105) degree = 2;
  else if (score >= 75) degree = 1;
  battle.formationDegree = degree;
  if (!degree) {
    battle.events.push(`${FORMATIONS[state.raid.formation].label} failed.`);
    return;
  }
  const bonus = [0, 0.1, 0.15, 0.2][degree];
  if (state.raid.formation === "boarsSnout") {
    battle.enemyMorale = round(battle.enemyMorale * (1 - bonus));
  }
  if (state.raid.formation === "reinforceCenter") {
    battle.playerMorale = round(battle.playerMorale * (1 + bonus));
  }
  if (state.raid.formation === "reinforceEnds") {
    battle.flankBonus = [0, 0.025, 0.05, 0.075][degree];
  }
  if (state.raid.formation === "takeField") {
    battle.rangedBonus = [0, 2, 3, 4][degree];
  }
  battle.events.push(`${FORMATIONS[state.raid.formation].label} succeeded at degree ${degree}.`);
}

function applyCoherency(battle) {
  const wallMen = livePlayerWall(battle);
  const shields = wallMen.filter((man) => man.equipment.shield).length;
  if (shields < 5) {
    battle.playerMorale = round(battle.playerMorale * 0.75);
  }
}

function livePlayerWall(battle) {
  return battle.playerWall.map(findMan).filter((man) => man && man.hp > 0);
}

function liveEnemyWall(battle) {
  return battle.enemyWall.map((id) => battle.enemies.find((enemy) => enemy.id === id)).filter((man) => man && man.hp > 0);
}

function doRangedVolley(battle) {
  const playerArchers = livePlayerWall(battle).filter(man => man.equipment.bow);
  const enemyArchers = liveEnemyWall(battle).filter(man => man.equipment.bow);

  let playerShots = playerArchers.length + battle.rangedBonus;
  let enemyShots = enemyArchers.length;

  while (playerShots > 0 && liveEnemyWall(battle).length) {
    const shooter =
      playerArchers[playerShots % Math.max(1, playerArchers.length)] ||
      livePlayerWall(battle)[0];

    const target = pick(liveEnemyWall(battle));

    const message = resolveAttack(shooter, target, battle, true, "player");
    if (message) battle.events.push(message);

    playerShots--;
  }

  while (enemyShots > 0 && livePlayerWall(battle).length) {
    const shooter =
      enemyArchers[enemyShots % Math.max(1, enemyArchers.length)] ||
      liveEnemyWall(battle)[0];

    const target = pick(livePlayerWall(battle));

    const message = resolveAttack(shooter, target, battle, true, "enemy");
    if (message) battle.events.push(message);

    enemyShots--;
  }
}

function pick(items) {
  return items[randInt(0, items.length - 1)];
}

function continueRound() {
  const battle = state.raid.battle;
  if (!battle || battle.stage !== "combat") return;
  battle.round += 1;
  const playerSpeed = randInt(1, 100) * (1 + average(voyageParty().map((man) => effectiveStat(man, "speed"))) * 0.0035);
  const enemySpeed = randInt(1, 100) * (1 + average(liveEnemyWall(battle).map((man) => effectiveStat(man, "speed"))) * 0.0035);
  const order = playerSpeed >= enemySpeed ? ["player", "enemy"] : ["enemy", "player"];
  const messages = [];
  order.forEach((side) => {
    const result = sideAttacks(side, battle);
    if (result) messages.push(result);
  });
  recoverReserves(battle);
  degradeRound(battle);
  applyCoherency(battle);
  breakEquipmentRound(battle);
  battle.message = messages.join(" ") || "Both walls held, shields grinding in the mud.";
  if (battle.playerMorale <= 0 || !livePlayerWall(battle).length) endBattle(false);
  else if (battle.enemyMorale <= 0 || !liveEnemyWall(battle).length) endBattle(true);
  render();
}

function sideAttacks(side, battle) {
  const attackers = side === "player" ? livePlayerWall(battle) : liveEnemyWall(battle);
  const defenders = side === "player" ? liveEnemyWall(battle) : livePlayerWall(battle);

  if (!attackers.length || !defenders.length) return "";

  const attackingMen = attackers.filter((attacker, index) =>
  chance(attackChance(attacker, battle, side, index))
);

if (!attackingMen.length) {
  attackingMen.push(pick(attackers));
}

  const messages = [];

  for (const attacker of attackingMen) {

    const attacker = pick(attackers);
    const defender = pick(defenders);

    const message = resolveAttack(attacker, defender, battle, false, side);

    if (message) {
      messages.push(message);
    }
  }

  return messages.join("<br>");
}

function attackChance(attacker, battle, side, index) {
  const weapon = EQUIPMENT[attacker.equipment.weapon] || {};
  const staminaPenalty = attacker.staminaNow < 20 ? 0.5 : 1;
  let value = 0.1 + effectiveStat(attacker, "agility") * 0.001 * staminaPenalty + (weapon.attack || 0);
  if (side === "player" && state.raid.formation === "reinforceEnds" && (index === 0 || index === livePlayerWall(battle).length - 1)) {
    value += battle.flankBonus;
  }
  return clamp(value, 0.02, 0.55);
}

function resolveAttack(attacker, defender, battle, ranged = false, side = "player") {
  if (!attacker || !defender || attacker.hp <= 0 || defender.hp <= 0) return null;

  const weapon = EQUIPMENT[attacker.equipment.weapon] || {};
  const statKey = ranged ? "ranged" : "weapon";
  const staminaPenalty = attacker.staminaNow < 20 ? 0.5 : 1;
  const moraleRoll = moraleModifier(side, battle);

  const hitChance = clamp(
    (ranged ? 0.15 : 0.6) +
      effectiveStat(attacker, statKey) * (ranged ? 0.006 : 0.003) * staminaPenalty +
      (weapon.hit || 0) +
      moraleRoll -
      effectiveStat(defender, "agility") * 0.001,
    0.05,
    0.95
  );

  attacker.staminaNow = clamp((attacker.staminaNow || 100) - (ranged ? 4 : 8));

  // Miss
  if (!chance(hitChance)) {
    return ranged
      ? `${attacker.name} shot at ${defender.name} but missed.`
      : `${attacker.name} attacked ${defender.name} but missed.`;
  }

  const armor =
    (defender.equipment.armor === "hauberk" ? 2 : 0) +
    (defender.equipment.helm === "helm" ? 1 : 0);

  const base = randInt(1, 5);

  const strengthBonus = ranged
    ? 0
    : effectiveStat(attacker, "strength") * 0.1 * staminaPenalty;

  const damage = Math.max(
    0,
    round(base + strengthBonus + (weapon.damage || 0) - armor)
  );

  if (damage <= 0) {
    return `${attacker.name}'s attack failed to penetrate ${defender.name}'s armor.`;
  }

  defender.hp = Math.max(0, defender.hp - damage);
  defender.staminaNow = clamp((defender.staminaNow || 100) - 4);

  attacker.battle.damageDealt += damage;
  defender.battle.damageTaken += damage;

  if (side === "player") battle.enemyMorale -= 5;
  else battle.playerMorale -= 5;

  if (damage > 2 && chance((damage - 2) * 0.05)) {
    inflictInjury(defender, attacker, battle, side);
  }

  if (defender.hp <= 0) {
    attacker.battle.kills += 1;

    if (side === "player") battle.enemyMorale -= 10;
    else battle.playerMorale -= 10;

    incapacitate(defender);

    return ranged
      ? `${attacker.name} shot ${defender.name} for ${damage} damage, killing him.`
      : `${attacker.name} struck ${defender.name} for ${damage} damage, killing him.`;
  }

  return ranged
    ? `${attacker.name} shot ${defender.name} for ${damage} damage.`
    : `${attacker.name} struck ${defender.name} for ${damage} damage.`;
}

function moraleModifier(side, battle) {
  const current = side === "player" ? battle.playerMorale : battle.enemyMorale;
  const max = side === "player" ? battle.playerMaxMorale : battle.enemyMaxMorale;
  const pct = max ? current / max : 0;
  if (pct >= 1) return 0.1;
  if (pct >= 0.8) return 0;
  if (pct >= 0.6) return -0.1;
  if (pct > 0) return -0.2;
  return -0.3;
}

function inflictInjury(defender, attacker, battle, side) {
  attacker.battle.injuries += 1;

  if (defender.isLeader || defender.type === "Enemy") return;

  const part = ["Arm", "Leg", "Abdomen", "Head"][randInt(0, 3)];

  defender.injuries.push({
    part,
    months: randInt(1, 3),
    permanent: false,
    stats: { ...INJURY_EFFECTS[part] }
  });

  if (side === "player") battle.enemyMorale -= 5;
  else battle.playerMorale -= 5;
}

const INJURY_EFFECTS = {
  Arm: {
    weapon: 50,
    ranged: 50,
    strength: 50
  },

  Leg: {
    agility: 50,
    speed: 50,
    pillaging: 50,
    manhunting: 50
  },

  Abdomen: {
    stamina: 50,
    recovery: 50,
    toughness: 50
  },

  Head: {
    discipline: 50,
    intelligence: 50,
    repair: 50
  }
};

const PERMANENT_INJURY_EFFECTS = {
  Arm: {
    weapon: 20,
    ranged: 20,
    strength: 20
  },

  Leg: {
    agility: 20,
    speed: 20,
    pillaging: 20,
    manhunting: 20
  },

  Abdomen: {
    stamina: 20,
    recovery: 20,
    toughness: 20
  },

  Head: {
    discipline: 20,
    intelligence: 20,
    repair: 20
  }
};

function incapacitate(man) {
  if (man.isLeader) {
    man.hp = 1;
    man.staminaNow = 0;
    return;
  }
  if (man.type === "Enemy") return;
  const deathChance = clamp(0.5 - effectiveStat(man, "luck") * 0.0025, 0.12, 0.5);
  if (chance(deathChance)) {
    man.dead = true;
    addLog(`${man.name} fell in the shield wall.`, "bad");
    addLog(`${man.name} was killed.`);
  } else {
    const part = ["Arm", "Leg", "Abdomen", "Head"][randInt(0, 3)];
    man.injuries.push({ part, months: randInt(1, 3), permanent: false });
  }
}

function recoverReserves(battle) {
  battle.reserves.map(findMan).filter(Boolean).forEach((man) => {
    man.staminaNow = clamp((man.staminaNow || 100) + 5 + effectiveStat(man, "recovery") * 0.2);
  });
}

function degradeRound(battle) {
  livePlayerWall(battle).forEach((man) => {
    man.staminaNow = clamp((man.staminaNow || 100) - 10);
    if (!man.zeroStaminaHit && man.staminaNow <= 0) {
      battle.playerMorale -= 5;
      man.zeroStaminaHit = true;
    }
  });
  liveEnemyWall(battle).forEach((man) => {
    man.staminaNow = clamp((man.staminaNow || 100) - 10);
    if (!man.zeroStaminaHit && man.staminaNow <= 0) {
      battle.enemyMorale -= 5;
      man.zeroStaminaHit = true;
    }
  });
  battle.playerMorale -= 10;
  battle.enemyMorale -= 10;
}

function breakEquipmentRound(battle) {
  const all = [...livePlayerWall(battle), ...liveEnemyWall(battle)];
  all.forEach((man) => {
    if (man.equipment.weapon && man.equipment.weapon !== "none" && chance(0.005)) {
      battle.events.push(`${man.name}'s ${EQUIPMENT[man.equipment.weapon].label} broke.`);
      man.equipment.weapon = "none";
    }
    if (man.equipment.shield && chance(0.005)) {
      battle.events.push(`${man.name}'s shield split.`);
      man.equipment.shield = false;
    }
  });
}

function swapFighters() {
  const battle = state.raid.battle;
  const outId = document.querySelector("#swapOut")?.value;
  const inId = document.querySelector("#swapIn")?.value;
  if (!outId || !inId || outId === inId) return;
  battle.playerWall = battle.playerWall.filter((id) => id !== outId);
  battle.reserves = battle.reserves.filter((id) => id !== inId);
  battle.playerWall.push(inId);
  battle.reserves.push(outId);
  addLog(`${findMan(inId).name} swapped into the shield wall for ${findMan(outId).name}.`);
  render();
}

function rally() {
  const battle = state.raid.battle;
  if (!battle || battle.rallyUsed) return;
  if (battle.playerMorale >= battle.playerMaxMorale) {
    notify("Rally cannot be used when morale is already at or above its base value.");
    return;
  }
  battle.rallyUsed = true;
  const recovery = randInt(1, 10) + effectiveStat(state.leader, "command") * 0.1;
  battle.playerMorale = Math.min(battle.playerMaxMorale, round(battle.playerMorale + battle.playerMaxMorale * (recovery / 100)));
  battle.message = `The Jarl rallied the line, restoring ${round(recovery)}% morale.`;
  addLog(battle.message);
  render();
}

function endBattle(playerWon) {
  const battle = state.raid.battle;
  const importedOpponent = state.raid.importedOpponent;
  battle.stage = "ended";
  rout(playerWon, battle);
  if (!importedOpponent) trainAfterBattle(playerWon);

  const deadCrew = state.crew.filter((man) => man.dead);
  const casualtySummary = !importedOpponent && deadCrew.length
    ? ` ${deadCrew.length} crew member${deadCrew.length === 1 ? "" : "s"} died: ${deadCrew.map((man) => man.name).join(", ")}.`
    : "";

  if (playerWon) {
    const moraleRecovery = randInt(20, 30);

battle.playerMorale = Math.min(
  battle.playerMaxMorale,
  battle.playerMorale +
  round(battle.playerMaxMorale * (moraleRecovery / 100))
);
const report = grantSpoils(battle);
    state.raid.report = { ...report, casualties: casualtySummary };
    battle.message = report.noSpoils
      ? `The rival warband routs. This was a contest of shield walls, not a raid for spoils.${casualtySummary}`
      : `The enemy routs. Spoils taken: ${report.playerGold} gold share, ${report.supplies} supplies, ${report.slaves} captives, ${describeDrops(report.equipment)}.${casualtySummary}`;
    addLog(`Victory at the ${battle.target}. ${battle.message}`);
  } else {
    battle.message = `Your shield wall broke. The crew dragged itself back to the ships.${casualtySummary}`;
    state.raid.report = { defeat: true, lines: battleReportLines(battle), casualties: casualtySummary };
    addLog(`Defeat at the ${battle.target}.`, "bad");
  }
  removeDeadCrew();
  if (importedOpponent) restoreAfterImportedOpponentBattle(battle);
  render();
}

function restoreAfterImportedOpponentBattle(battle) {
  const snapshot = state.raid.preBattleState;
  const snapshotView = state.raid.preBattleView;
  const report = state.raid.report;
  if (!snapshot) return;

  state = cloneGameState(snapshot);
  state.raid = {
    destination: battle.target,
    targetIndex: 0,
    carriedSupplies: state.supplies,
    suggested: 0,
    moraleMod: 0,
    formation: "reinforceCenter",
    scouted: true,
    scoutInfo: null,
    battle: {
      stage: "ended",
      target: battle.target,
      round: battle.round,
      message: battle.message,
      events: [...(battle.events || [])],
      enemies: [],
      enemyWall: [],
      playerWall: [],
      reserves: [],
    },
    report,
    complete: true,
    importedOpponent: true,
    preBattleState: cloneGameState(snapshot),
    preBattleView: snapshotView,
  };
}

function rout(playerWon, battle) {
  const winners = playerWon ? [...livePlayerWall(battle), ...battle.reserves.map(findMan).filter((man) => man && man.hp > 0)] : liveEnemyWall(battle);
  const losers = playerWon ? liveEnemyWall(battle) : [...livePlayerWall(battle), ...battle.reserves.map(findMan).filter((man) => man && man.hp > 0)];
  let kills = 0;
  winners.forEach(() => {
    if (losers.length && chance(0.4)) {
      const available = losers.filter((man) => man.hp > 0);
      const victim = available.length ? pick(available) : null;
      if (victim) {
        victim.hp = 0;
        kills += 1;
      }
    }
  });
  battle.events.push(`${kills} foes were cut down in the rout.`);
}

function grantSpoils(battle) {
  if (state.raid.importedOpponent) {
    return {
      rawGold: 0,
      playerGold: 0,
      xp: 0,
      supplies: 0,
      equipment: {},
      slaves: 0,
      lostSlaves: 0,
      noSpoils: true,
      lines: battleReportLines(battle),
    };
  }

  const target = TARGETS[state.raid.targetIndex];
  const dest = DESTINATIONS[state.raid.destination];
  if (!target || !dest) {
    return {
      rawGold: 0,
      playerGold: 0,
      xp: 0,
      supplies: 0,
      equipment: {},
      slaves: 0,
      lostSlaves: 0,
      noSpoils: true,
      lines: battleReportLines(battle),
    };
  }

  const rawGold = ceil(randInt(target.gold[0], target.gold[1]) * dest.spoils);
  const shares = activeCrew().length + 3;
  const playerGold = ceil(rawGold * (3 / shares));
  const xp = randInt(target.xp[0], target.xp[1]);
  const supplies = randInt(target.supplies[0], target.supplies[1]);
  const equipment = target.equipment();
  if (state.raid.destination === "England" && chance(0.5)) equipment.bow = (equipment.bow || 0) + 1;
  if (state.raid.destination === "France" && chance(0.5)) equipment.sword = (equipment.sword || 0) + 1;
  const possibleSlaves = (target.slaveRoll() || 0) + (state.raid.pendingSlaves || 0);
  state.raid.pendingSlaves = 0;
  const openSpace = Math.max(0, capacity() - (1 + activeCrew().length));
  const slaves = Math.min(possibleSlaves, openSpace);
  state.gold += playerGold;
  state.supplies += supplies;
  state.slaves += slaves;
  addDropsToInventory(equipment);
  state.leader.xp += xp;
  checkLeaderLevel();
  return {
    rawGold,
    playerGold,
    xp,
    supplies,
    equipment,
    slaves,
    lostSlaves: possibleSlaves - slaves,
    lines: battleReportLines(battle),
  };
}

function addDropsToInventory(drops) {
  Object.entries(drops).forEach(([item, count]) => {
    if (state.inventory[item] !== undefined) state.inventory[item] += count;
  });
}

function randomEquipmentDrop(counts, weights, armorAllowed) {
  const count = weightedPick(counts, weights);
  const drops = {};
  const pool = armorAllowed
    ? ["shield", "spear", "axe", "sword", "helm", "hauberk", "bow"]
    : ["shield", "spear", "axe", "bow"];
  for (let i = 0; i < count; i += 1) {
    const item = pick(pool);
    drops[item] = (drops[item] || 0) + 1;
  }
  return drops;
}

function weightedPick(values, weights) {
  const total = weights.reduce((sum, value) => sum + value, 0);
  let rollValue = Math.random() * total;
  for (let i = 0; i < values.length; i += 1) {
    rollValue -= weights[i];
    if (rollValue <= 0) return values[i];
  }
  return values[values.length - 1];
}

function describeDrops(drops) {
  const text = Object.entries(drops || {})
    .filter(([, count]) => count > 0)
    .map(([item, count]) => `${count} ${EQUIPMENT[item].label}${count > 1 ? "s" : ""}`);
  return text.length ? text.join(", ") : "no equipment";
}

function battleReportLines(battle) {
  return voyageParty().map((man) => {
    const report = man.battle || { damageDealt: 0, damageTaken: 0, kills: 0, injuries: 0, gains: [] };
    return `${man.name}: ${report.damageDealt} dealt, ${report.damageTaken} taken, ${report.kills} kills, ${report.injuries} injuries inflicted${report.gains.length ? `, gains ${report.gains.join(", ")}` : ""}.`;
  });
}

function trainAfterBattle(playerWon) {
  const trainees = voyageParty();

  trainees.forEach((man) => {
    const gains = [];

    const trainerBonus = effectiveTrainerBonus();
    const intelligenceBonus =
      effectiveStat(man, "intelligence") * 0.025;

    const improvedStats = new Set();

    function improveStat(stat, force = false) {
      if (improvedStats.size >= 5 && !force) return;
      if (improvedStats.has(stat)) return;

console.log("Training stat:", stat);

      let boost = rand(1, 3);

      if (stat === man.primary || stat === man.secondary) {
        boost += intelligenceBonus;
      }

      boost += trainerBonus;

      man.stats[stat] = clamp(
        (man.stats[stat] || 0) + boost
      );

      improvedStats.add(stat);

      gains.push(
        `${STAT_DEFS[stat] || stat} +${boost.toFixed(1)}`
      );
    }

    improveStat(man.primary, true);

    if (man.secondary !== man.primary) {
      improveStat(man.secondary, true);
    }

    TRAINING_STATS.forEach((stat) => {
      if (
        stat !== man.primary &&
        stat !== man.secondary &&
        chance(0.15)
      ) {
        improveStat(stat);
      }
    });

    if (man.isLeader) {
      ["sailing", "command", "management"].forEach((stat) => {
        if (
          improvedStats.size < 5 &&
          chance(0.15)
        ) {
          improveStat(stat);
        }
      });
    }

    if (man.battle) {
      man.battle.gains = gains;
    }
  });

  if (playerWon) {
    addLog(
      "The surviving crew learned from battle."
    );
  }
}
function effectiveTrainerBonus() {
  const best = Math.max(0, ...activeCrew().map((man) => effectiveStat(man, "trainer")));
  return best * 0.0025;
}
function checkLeaderLevel() {
  while (state.leader.xp >= state.leader.level * 100) {
    state.leader.xp -= state.leader.level * 100;
    state.leader.level += 1;
    state.leader.stats.morale = clamp(state.leader.stats.morale + 2);
    state.leader.stats.command = clamp(state.leader.stats.command + 2);
    addLog(`The Jarl reached level ${state.leader.level}. Morale and command rose by 2.`);
  }
}

function removeDeadCrew() {
  const dead = state.crew.filter((man) => man.dead);
  dead.forEach(unequipAll);
  state.crew = state.crew.filter((man) => !man.dead);
}

function continueRaid() {
  if (!state.raid || !state.raid.report || state.raid.report.defeat) return;
  if (state.raid.importedOpponent) {
    returnHome();
    return;
  }
  if (state.raid.targetIndex >= TARGETS.length - 1) {
    returnHome();
    return;
  }
  const cost = ceil(state.raid.suggested * 0.25);
  if (state.supplies < cost) {
    notify(`Need ${cost} supplies to press on.`);
    return;
  }
  state.supplies -= cost;
  state.raid.targetIndex += 1;
  state.raid.report = null;
  state.raid.scouted = false;
  state.raid.scoutInfo = null;
  prepareBattle();
  addLog(`The crew pressed on to the ${TARGETS[state.raid.targetIndex].id}, spending ${cost} supplies.`);
  render();
}

function returnHome() {
  if (!state.raid) return;

  if (state.raid.importedOpponent) {
    const snapshot = state.raid.preBattleState;
    const snapshotView = state.raid.preBattleView;
    if (snapshot) {
      state = cloneGameState(snapshot);
      activeView = snapshotView || "home";
    } else {
      state.raid = null;
      activeView = "home";
    }
    render();
    playMusic(state.raid ? "raid" : "home");
    return;
  }
  runSeaEvent("return");

  render();
}

function finishReturnHome() {
  const income = passiveIncome();

  state.gold += income;
  state.voyageCount += 1;
  state.turn = (state.turn || 1) + 1;
  state.sowedFields = 0;

  healInjuries();
  refreshRecruits(false);

  state.raid = null;
  activeView = "home";

  addLog(
    `Returned to the Home Fjord. Farms, fields, and slaves produced ${income} gold.`
  );

  playMusic("home");
  render();
}

function healInjuries() {
  state.crew.forEach((man) => {
    man.hp = maxHp(man);
    man.staminaNow = maxStamina(man);
    man.scoutOut = false;
    man.injuries.forEach((injury) => {
      injury.months -= 1;
    });
    man.injuries = man.injuries.flatMap((injury) => {
      if (injury.months > 0) return [injury];
      const becomesPermanent = chance(
  clamp(0.5 - effectiveStat(man, "luck") * 0.0025, 0.1, 0.5)
);

if (becomesPermanent) {
  return [{
    ...injury,
    permanent: true,
    months: 999,
    stats: { ...PERMANENT_INJURY_EFFECTS[injury.part] }
  }];
}

return [];
    });
  });
  state.leader.hp = maxHp(state.leader);
  state.leader.staminaNow = maxStamina(state.leader);
}

function renderStart() {
  const leader = pendingLeader || createLeader();
  pendingLeader = leader;
  app.innerHTML = `
    <section class="start-screen">
      <div class="start-panel">
        <div class="start-hero">
          <div class="start-copy">
            <h1>Shield Wall</h1>
            <p>Take up your axe, Viking lord. Recruit your men, harden them through raids, seize enemy gold, bring captives back to the fjord, and conquer every land the sea touches.</p>
            <div class="actions">
              <button class="gold" data-action="begin">Begin with this Jarl</button>
              <button class="secondary" data-action="reroll">Reroll leader (${leader.rerollsLeft ?? 5} left)</button>
              <button class="secondary" data-action="load">Load saved game</button>
              <button class="secondary" data-action="import">Import own save</button>
              <button class="secondary" data-action="importOpponent">Import opponent save</button>
            </div>
          </div>
          <aside class="leader-card">
            <h2>Your Jarl</h2>
            <p class="muted">S-rank peasant roll. The leader cannot die, but can be driven from the wall.</p>
            <div class="stat-grid">
              ${leaderStatPills(leader)}
            </div>
          </aside>
        </div>
      </div>
    </section>
  `;
}

function leaderStatPills(leader) {
  return `
    <h4>Combat Stats</h4>
    <div class="stat-grid">
      ${LEADER_COMBAT_STATS.map(key =>
        `<span class="stat-pill">
          <span>${STAT_DEFS[key]}</span>
          <strong>${formatStat(leader.stats[key] || 0)}</strong>
        </span>`
      ).join("")}
    </div>

    <h4>Auxiliary Stats</h4>
    <div class="stat-grid">
      ${AUXILIARY_STATS.map(key =>
        `<span class="stat-pill">
          <span>${STAT_DEFS[key]}</span>
          <strong>${formatStat(leader.stats[key] || 0)}</strong>
        </span>`
      ).join("")}
    </div>

    <h4>Leader Stats</h4>
    <div class="stat-grid">
      ${["command", "sailing", "management"].map((key) =>
        `<span class="stat-pill">
          <span>${STAT_DEFS[key]}</span>
          <strong>${formatStat(leader.stats[key] || 0)}</strong>
        </span>`
      ).join("")}
    </div>
  `;
}

function render() {
  if (!state) {
    renderStart();
    return;
  }
  app.innerHTML = `
    <div class="game">
      <aside class="side">
        <div class="brand">
          <h1>Shield Wall</h1>
        </div>
        <nav class="nav">
          ${navButton("home", "Home Fjord")}
          ${navButton("recruit", "Recruitment")}
          ${navButton("store", "Store")}
          ${navButton("raid", "Raid")}
          ${navButton("crew", "Crew")}
          ${navButton("log", "Log")}
          ${navButton("help", "Help")}
        </nav>
        <div class="save-row">
          <button data-action="save">Save</button>
          <button data-action="export">Export</button>
          <button data-action="import">Import own save</button>
          <button data-action="importOpponent">Import opponent save</button>
          <button data-action="reset">Reset</button>
        </div>
      </aside>
      <main class="content">
        ${topbar()}
        ${viewHtml()}
      </main>
    </div>
    ${seaEventPopup()}
  `;
  drawSoon();
}

function navButton(id, label) {
  return `<button class="${activeView === id ? "active" : ""}" data-view="${id}">${label}</button>`;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getGameDate(turn) {
  const startMonthIndex = 4; // May is month 5, index 4
  const totalMonths = startMonthIndex + (turn - 1);
  const month = MONTHS[totalMonths % 12];
  const year = 826 + Math.floor(totalMonths / 12);
  return `${month} ${year}`;
}

function topbar() {
  const active = activeCrew().length;
  return `
    <section class="topbar">
      ${statTile("Gold", state.gold)}
      ${statTile("Supplies", state.supplies)}
      ${statTile("Turn", `${state.turn} — ${getGameDate(state.turn)}`)}
      ${statTile("Crew Sailing", `${active}/${state.crew.length}`)}
      ${statTile("Longship Space", `${1 + active}/${capacity()}`)}
      ${statTile("Slaves", state.slaves)}
      ${statTile("Jarl Level", `${state.leader.level} (${state.leader.xp}/${state.leader.level * 100})`)}
    </section>
  `;
}

function statTile(label, value) {
  return `<div class="stat-tile"><span>${label}</span><strong>${value}</strong></div>`;
}

function viewHtml() {
  if (activeView === "home") return homeView();
  if (activeView === "recruit") return recruitView();
  if (activeView === "store") return storeView();
  if (activeView === "raid") return raidView();
  if (activeView === "crew") return crewView();
  if (activeView === "help") return helpView();
  return logView();
}

function homeView() {
  const income = passiveIncome();
  return `
    <section class="panel">
      <div class="panel-head">
        <h2>Home Fjord</h2>
        <span class="muted">Passive income pays out when a voyage ends.</span>
      </div>
      <div class="panel-body grid three">
        <div class="card">
          <h3>Farmstead</h3>
          <p>Base farm income: 45 gold per voyage.</p>
          <p>Current payout: <strong>${income} gold</strong></p>
          <button data-action="buyLand">Improve land (${landCost()} gold)</button>
        </div>
        <div class="card">
          <h3>Fields</h3>
          <p>Sown fields add 40 gold for 1 month. Limit: ${1 + state.land} before each voyage.</p>
          <p>Sowed now: <strong>${state.sowedFields}</strong></p>
          <button data-action="sowField">Sow fields (20 gold)</button>
        </div>
        <div class="card">
          <h3>Slaves</h3>
          <p>Each slave adds 5 gold per voyage and requires longship space only when first brought home.</p>
          <button data-action="buySlave">Buy slave (${slaveCost()} gold)</button>
        </div>
      </div>
      <div class="card">
  <h3>Pass the Month</h3>
  <p>Remain at the fjord and let one month pass without raiding.</p>
  <button data-action="skipTurn">Pass Month</button>
</div>
    </section>
    <section class="panel">
      <div class="panel-head">
        <h3>Jarl</h3>
        <span class="muted">Leader stats improve in battle like the crew.</span>
      </div>
      <div class="panel-body">
        <div class="grid four">
          ${leaderStatPills(state.leader)}
        </div>
      </div>
    </section>
  `;
}

function helpView() {
  return `
    <div class="helpBox">

      <h2>Help</h2>

      <h3>Combat Stats</h3>

      <p><b>Weapon Skill</b> - +0.3% chance to hit per point.</p>
      <p><b>Ranged Skill</b> - +0.6% chance to hit per point.</p>
      <p><b>Strength</b> - +0.1 damage per point.</p>
      <p><b>Agility</b> - +0.1% chance to act per point.</p>
      <p><b>Toughness</b> - +0.2 maximum hit points per point.</p>
      <p><b>Recovery</b> - +0.2 stamina recovered per point.</p>
      <p><b>Stamina</b> - Low stamina reduces combat effectiveness.</p>
      <p><b>Morale</b> - When morale runs out your shield wall breaks and flees.</p>
      <p><b>Discipline</b> - Higher discipline improves formation success.</p>
      <p><b>Speed</b> - +0.35% initiative per point.</p>

      <h3>Auxiliary Stats</h3>

      <p><b>Intelligence</b> - Increases training gains.</p>
      <p><b>Trainer</b> - Improves training for the crew.</p>
      <p><b>Pillaging</b> - Increases loot gained from raids.</p>
      <p><b>Repair</b> - Improves repair efficiency.</p>
      <p><b>Manhunting</b> - Increases slave capture chance.</p>
      <p><b>Luck</b> - Reduces chance of injury.</p>

      <h3>Leader Stats</h3>

      <p><b>Command</b> - Improves formation success.</p>
      <p><b>Management</b> - Improves passive gold income.</p>
      <p><b>Sailing</b> - Improves chance of positive random events.</p>

      <h3>Shield Wall</h3>

      <p>A shield wall requires at least <b>5 shields</b>.</p>

      <p>Every shield equipped grants <b>+1 formation score</b>.</p>

      <h3>Combat</h3>
      <p>Battles are fought one round at a time. Before combat begins, any warriors with bows fire a volley. Each round, both shield walls make attack rolls based on Agility and equipment, with the faster side acting first. Successful attacks deal damage based on Strength and weapon quality, while armor reduces incoming damage. Every hit lowers enemy morale, and slain warriors cause additional morale loss. Fighters can be swapped with reserves between rounds, and the Jarl may Rally once per battle to restore morale. The battle ends when one shield wall is destroyed or its morale breaks. Victory earns spoils, experience, and training, while defeat forces the crew to retreat with no loot.

      <h3>Injuries</h3>
      <p>Powerful hits may inflict injuries to the arms, legs, abdomen, or head. Injuries reduce the effectiveness of the related stats by 50% until they heal. When an injury heals, it has a 50% chance (reduced by Luck) to become permanent, leaving a lasting 20% penalty instead.

      <h3>Formations</h3>

      <p><b>Boar's Snout</b> - Lowers enemy morale.</p>
      <p><b>Reinforce Center</b> - Raises your morale.</p>
      <p><b>Reinforce Ends</b> - Strengthens both flanks.</p>
      <p><b>Take the Field</b> - Improves ranged combat.</p>

      <h3>Training</h3>

      <p>Training after battle depends on Intelligence and Trainer.</p>

      <h3>Gold & Spoils</h3>
      <p>After a victorious raid, the crew divides the plunder into equal shares. The Jarl receives three shares, while each active crew member receives one. Only the Jarl's share is added to your gold.

    </div>
  `;
}

function recruitView() {
  return `
    <section class="panel">
      <div class="panel-head">
        <h2>Recruitments</h2>
        <div class="actions">
          <button data-action="enlargeTent">Enlarge (${tentCost()} gold)</button>
        </div>
      </div>
      <div class="panel-body">
        <div class="grid three">
          ${state.recruits.map(recruitCard).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderStatGroup(recruit, stats) {
  return Object.entries(STAT_DEFS)
    .filter(([key]) => stats.includes(key))
    .map(([key, label]) =>
      `<span class="stat-pill"><span>${label}</span><strong>${formatStat(recruit.stats[key] || 0)}</strong></span>`
    )
    .join("");
}

function recruitCard(recruit) {
  return `
    <div class="card">
      <h3>${recruit.name}</h3>
      <div class="badge-row">
        <span class="badge">${recruit.rank} rank</span>
        <span class="badge">${recruit.type}</span>
        <span class="badge">${recruitCost(recruit)} gold</span>
      </div>
      <p class="tiny muted">${gearText(recruit)}</p>
      <h4>Combat Stats</h4>
<div class="stat-grid">
  ${Object.entries(STAT_DEFS)
    .filter(([key]) => COMBAT_STATS.includes(key))
    .map(([key, label]) =>
      `<span class="stat-pill"><span>${label}</span><strong>${formatStat(recruit.stats[key] || 0)}</strong></span>`
    )
    .join("")}
</div>

<h4>Auxiliary Stats</h4>
<div class="stat-grid">
  ${Object.entries(STAT_DEFS)
    .filter(([key]) => AUXILIARY_STATS.includes(key))
    .map(([key, label]) =>
      `<span class="stat-pill"><span>${label}</span><strong>${formatStat(recruit.stats[key] || 0)}</strong></span>`
    )
    .join("")}
</div>
      <p><button data-action="hire" data-id="${recruit.id}">Hire</button></p>
    </div>
  `;
}

function storeView() {
  return `
    <section class="panel">
      <div class="panel-head">
        <h2>Store</h2>
        <span class="muted">Equipment sells for half value rounded down.</span>
      </div>
      <div class="panel-body">

        <div class="card">
          <h3>Equipment Guide</h3>

          <p><strong>Shield</strong> – Required for shield wall formations. Bring at least 5 men with shields to avoid a 25% morale penalty. Each shield in the wall gives <strong>+1 formation score</strong>.</p>

          <p><strong>Spear</strong> – One-handed weapon, +2% chance to attack.</p>

          <p><strong>Axe</strong> – One-handed weapon, +2 damage.</p>

          <p><strong>Sword</strong> – High quality one-handed weapon +1% chance to attack, +1% damage and +1% chance to hit.</p>

          <p><strong>Dane Axe</strong> – Powerful two-handed weapon that deals +3 damage but cannot be used with a shield.</p>

          <p><strong>Hauberk</strong> – Mail armor that reduces incoming damage by 2.</p>

          <p><strong>Helm</strong> – Head protection that reduces incoming damage by 1.</p>

          <p><strong>Bow</strong> – Allows a warrior to make a single ranged attack before melee begins. Does not restrict melee equipment.</p>
        </div>

        <div class="grid three">
          <div class="card">
            <h3>Supplies</h3>
            <p>Cost: 1 gold. One supply feeds one man for one day.</p>
            <div class="actions">
              ${[1, 5, 20, 50, 100].map((amount) =>
  `<button data-action="buySupplies" data-amount="${amount}">Buy ${amount}</button>`
).join("")}

<button data-action="buyMaxSupplies">Buy Max</button>
            </div>
          </div>

          ${storeItem("shield")}
          ${storeItem("spear")}
          ${storeItem("axe")}
          ${storeItem("sword")}
          ${storeItem("daneAxe")}
          ${storeItem("hauberk")}
          ${storeItem("helm")}
          ${storeItem("bow")}

          <div class="card">
            <h3>Longship</h3>
            <p>Cost: 60 gold. Carries 10 men.</p>
            <p>Owned: <strong>${state.longships}</strong></p>
            <button data-action="buyItem" data-item="longship">Buy longship</button>
          </div>
        </div>

      </div>
    </section>
  `;
}

function storeItem(item) {
  return `
    <div class="card">
      <h3>${EQUIPMENT[item].label}</h3>
      <p>Cost: ${EQUIPMENT[item].cost} gold. In storehouse: <strong>${state.inventory[item]}</strong></p>
      <div class="actions">
        <button data-action="buyItem" data-item="${item}">Buy</button>
        <button class="secondary" data-action="sellItem" data-item="${item}" ${state.inventory[item] < 1 ? "disabled" : ""}>Sell</button>
      </div>
    </div>
  `;
}

function raidView() {
  if (!state.raid) return raidSetupView();
  const battle = state.raid.battle;
  if (!battle) {
    return `
      <section class="panel">
        <div class="panel-body">
          <p class="muted">The longship is underway.</p>
        </div>
      </section>
    `;
  }
  if (state.raid.report) return reportView();
  if (battle.stage === "setup") return battleSetupView();
  return combatView();
}

function raidSetupView() {
  return `
    <section class="panel">
      <div class="panel-head">
        <h2>Raid</h2>
        <span class="muted">Suggested supplies are 30 per fighting man. Minimum is 75%.</span> Surplus is 110%.</span>
      </div>
      <div class="panel-body grid three">
        ${Object.entries(DESTINATIONS).map(([name, dest]) => {
          const suggested = suggestedSupplies(name);
          const minimum = minimumSupplies(name);
          const surplus = surplusSupplies(name);
          return `
            <div class="card">
              <h3>${name}</h3>
              <p>${dest.note}</p>
              <div class="badge-row">
                <span class="badge">Suggested ${suggested}</span>
                <span class="badge">Minimum ${minimum}</span>
                <span class="badge">Surplus ${surplus}</span>
              </div>
              <p><button class="sea" data-action="startRaid" data-destination="${name}">Embark</button></p>
            </div>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function battleSetupView() {
  const battle = state.raid.battle;
  const target = TARGETS[state.raid.targetIndex];
  return `
    <section class="panel">
      <div class="panel-head">
        <h2>${state.raid.destination}: ${target.id}</h2>
        <div class="actions">
          <button class="secondary" data-action="scout" ${state.raid.scouted ? "disabled" : ""}>Spy</button>
          <button class="secondary" data-action="sortRaidCrew" data-sort="hp">Sort HP</button>
          <button class="secondary" data-action="sortRaidCrew" data-sort="stamina">Sort Stamina</button>
          <button class="secondary" data-action="sortRaidCrew" data-sort="injury">Sort Injuries</button>
          <button class="gold" data-action="beginBattle">Begin Battle</button>
        </div>
      </div>
      <div class="panel-body battle-layout">
        <div>
          <div class="grid two">
            <div class="card">
              <h3>Enemy Force</h3>
              <p>${battle.enemies.length} opponents. ${scoutText()}</p>
            </div>
            <div class="card">
              <h3>Formation</h3>
              <p>${FORMATIONS[state.raid.formation].text}</p>
              <select data-action="formation">
                ${Object.entries(FORMATIONS).map(([id, formation]) => `<option value="${id}" ${state.raid.formation === id ? "selected" : ""}>${formation.label}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="panel" style="margin-top:14px">
            <div class="panel-head"><h3>Shield Wall and Reserves</h3></div>
            <div class="panel-body fighter-list">
              ${sortCrewList(voyageParty(), state.raid?.sortBy).map((man) => setupFighter(man, battle)).join("")}
            </div>
          </div>
        </div>
        <div class="card">
          <h3>Raid Rules</h3>
          <p>The shield wall must have at least one fighter. Five shields are required for formation success and full coherency.</p>
          <p>Morale and hit points do not recover until the voyage ends. Pressing on after a victory costs 25% more supplies.</p>
          <p class="muted">${battle.message}</p>
        </div>
      </div>
    </section>
  `;
}

function scoutText() {
  if (!state.raid.scouted) {
    return "Use the spy option to reveal enemy information.";
  }

  const battle = state.raid.battle;

  const wall = battle.enemyWall
    .map(id => battle.enemies.find(enemy => enemy.id === id))
    .filter(Boolean);

  const avgWeapon = round(
    average(wall.map(man => man.stats.weapon))
  );

  const shields = wall.filter(man => man.equipment.shield).length;

  return `
    Enemy shield wall: ${wall.length} men.
    Shields: ${shields}.
    Average weapon skill: ${avgWeapon}.
    Formation: ${FORMATIONS[battle.enemyFormation]?.label || "Unknown"}.
  `;
}

function setupFighter(man, battle) {
  const inWall = battle.playerWall.includes(man.id);
  const locked = man.scoutOut;
  return `
    <div class="fighter">
      <div>
        <strong>${man.name}${man.isLeader ? " (Jarl)" : ""}</strong>
        <span class="tiny muted">${gearText(man)} | HP ${man.hp}/${maxHp(man)} | Stamina ${round(man.staminaNow || 100)}</span>
      </div>
      <button data-action="toggleWall" data-id="${man.id}" ${locked ? "disabled" : ""}>${man.scoutOut ? "Scouting" : inWall ? "Wall" : "Reserve"}</button>
    </div>
  `;
}

function combatView() {
  const battle = state.raid.battle;
  return `
    <section class="panel">
      <div class="panel-head">
        <h2>${battle.target} Battle: Round ${battle.round}</h2>
        <span class="muted">${FORMATIONS[state.raid.formation].label}</span>
      </div>
      <div class="panel-body battle-layout">
        <div>
          <div class="battle-canvas-wrap"><canvas id="battleCanvas" width="900" height="420"></canvas></div>
          <div class="battle-message">${battle.message}</div>
        </div>
        <div class="grid">
          <div class="card">
            <h3>Morale</h3>
            ${moraleMeter("Your wall", battle.playerMorale, battle.playerMaxMorale)}
            ${moraleMeter("Enemy wall", battle.enemyMorale, battle.enemyMaxMorale, true)}
          </div>
          <div class="card">
            <h3>Battle Pause</h3>
            <div class="actions">
              <select id="swapOut">
                ${livePlayerWall(battle).filter((man) => !man.isLeader).map((man) => `<option value="${man.id}">${man.name}</option>`).join("")}
              </select>
              <select id="swapIn">
                ${battle.reserves.map(findMan).filter((man) => man && man.hp > 0).map((man) => `<option value="${man.id}">${man.name}</option>`).join("")}
              </select>
              <button class="secondary" data-action="swap" ${!battle.reserves.length ? "disabled" : ""}>Swap</button>
              <button class="moss" data-action="rally" ${battle.rallyUsed || battle.playerMorale >= battle.playerMaxMorale ? "disabled" : ""}>Rally</button>
              <button class="gold" data-action="continueRound">Continue</button>
            </div>
          </div>
          <div class="card">
  <h3>Line & Reserves</h3>

  <div class="fighter-list">

    <h4>Shield Wall</h4>
    ${livePlayerWall(battle).map(combatFighter).join("")}

    <hr>

    <h4>Reserves</h4>
    ${battle.reserves
      .map(findMan)
      .filter(Boolean)
      .map(combatFighter)
      .join("")}

  </div>
</div>
        </div>
      </div>
    </section>
  `;
}

function moraleMeter(label, value, max, danger = false) {
  const pct = clamp(max ? (value / max) * 100 : 0);
  return `
    <p class="tiny">${label}: ${Math.max(0, round(value))}/${max}</p>
    <div class="meter ${danger ? "danger" : "gold"}"><span style="width:${pct}%"></span></div>
  `;
}

function combatFighter(man) {
  return `
    <div class="fighter">
      <div>
        <strong>${man.name}</strong>
        <span class="tiny muted">${gearText(man)}</span>
        <div class="tiny muted">HP ${man.hp}/${maxHp(man)} • Stamina ${round(man.staminaNow || 100)}</div>
        <div class="meter"><span style="width:${clamp((man.hp / maxHp(man)) * 100)}%"></span></div>
        <div class="meter gold" style="margin-top:4px"><span style="width:${clamp(man.staminaNow || 0)}%"></span></div>
      </div>
    </div>
  `;
}

function reportView() {
  const battle = state.raid.battle;
  const report = state.raid.report;
  const canContinue = !report.defeat && !state.raid.importedOpponent && state.raid.targetIndex < TARGETS.length - 1;
  const cost = ceil(state.raid.suggested * 0.25);
  return `
    <section class="panel">
      <div class="panel-head">
        <h2>${report.defeat ? "Raid Broken" : "Spoils and Rout"}</h2>
        <div class="actions">
          ${canContinue ? `<button class="danger" data-action="continueRaid" ${state.supplies < cost ? "disabled" : ""}>Continue to ${TARGETS[state.raid.targetIndex + 1].id} (${cost} supplies)</button>` : ""}
          <button class="sea" data-action="returnHome">Return to Home Fjord</button>
        </div>
      </div>
      <div class="panel-body grid two">
        <div class="card">
          <h3>Outcome</h3>
          <p>${battle.message}</p>
          ${report.casualties ? `<p class="muted">${report.casualties}</p>` : ""}
          ${report.defeat ? "" : report.noSpoils ? `
            <p class="muted">Imported opponent battles do not award raid spoils.</p>
          ` : `
            <div class="badge-row">
              <span class="badge">Total gold ${report.rawGold}</span>
              <span class="badge">Jarl share ${report.playerGold}</span>
              <span class="badge">XP ${report.xp}</span>
              <span class="badge">Supplies ${report.supplies}</span>
              <span class="badge">Captives ${report.slaves}</span>
            </div>
            ${report.lostSlaves > 0 ? `<p class="muted">${report.lostSlaves} captives could not fit on the longships.</p>` : ""}
          `}
        </div>
        <div class="card">
          <h3>Crew Report</h3>
          <div class="log">
            ${(report.lines || []).map((line) => `<div class="log-entry">${line}</div>`).join("")}
          </div>
        </div>
      </div>
    </section>
  `;
}

function sortCrewList(men, sortBy) {
  if (!sortBy) return men;
  const sorted = [...men];
  if (sortBy === "hp") {
    sorted.sort((a, b) => (b.hp / maxHp(b) || 0) - (a.hp / maxHp(a) || 0) || b.hp - a.hp);
  } else if (sortBy === "stamina") {
    sorted.sort((a, b) => (b.staminaNow || 0) - (a.staminaNow || 0));
  } else if (sortBy === "injury") {
    sorted.sort((a, b) => {
      const aInjured = (a.injuries?.length || 0) > 0 ? 0 : 1;
      const bInjured = (b.injuries?.length || 0) > 0 ? 0 : 1;
      if (aInjured !== bInjured) return aInjured - bInjured;
      return (b.injuries?.length || 0) - (a.injuries?.length || 0);
    });
  }
  return sorted;
}

function crewView() {
  const crew = sortCrewList([state.leader, ...state.crew], state.crewSort);
  return `
    <section class="panel">
      <div class="panel-head">
        <h2>Crew</h2>
        <div class="actions">
          <button data-action="autoEquip">Auto Equip</button>
          <select data-role="crewTrainingStat">
            ${TRAINING_STATS.map((stat) => `<option value="${stat}">${STAT_DEFS[stat]}</option>`).join("")}
          </select>
          <button class="secondary" data-action="bulkTraining" data-slot="primary">All Primary</button>
          <button class="secondary" data-action="bulkTraining" data-slot="secondary">All Secondary</button>
          <button class="secondary" data-action="sortCrew" data-sort="hp">Sort HP</button>
          <button class="secondary" data-action="sortCrew" data-sort="stamina">Sort Stamina</button>
          <button class="secondary" data-action="sortCrew" data-sort="injury">Sort Injuries</button>
        </div>
      </div>
      <div class="panel-body">
        <table class="table">
          <thead>
            <tr>
  <th style="width:10%">Name</th>
  <th style="width:50%">Stats</th>
  <th style="width:15%">Equipment</th>
  <th style="width:15%">Training</th>
  <th style="width:5%">Voyage</th>
  <th style="width:5%"></th>
</tr>
          </thead>
          <tbody>
           ${crew.map(crewRow).join("") || `<tr><td colspan="6">No crew yet. Visit the recruitment tent.</td></tr>`}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function crewRow(man) {
  return `
    <tr>
<td>
  <strong>${man.name}</strong><br>
  <span class="tiny muted">${man.rank}-rank ${man.type}</span>
</td>
      <td>
  HP ${man.hp}/${maxHp(man)}<br>
  <span class="tiny muted">${injuryText(man)}</span>
  <h4>Combat Stats</h4>
<div class="stat-grid">
  ${(man.isLeader ? LEADER_COMBAT_STATS : COMBAT_STATS).map(key => {
  const penalty = injuryPenalty(man, key);

  return `
    <span class="stat-pill">
      <span>${STAT_DEFS[key]}</span>
      <strong>
        ${formatStat(man.stats[key] || 0)}
        ${penalty > 0 ? `<span style="color:#d44;">(-${formatStat(penalty)})</span>` : ""}
      </strong>
    </span>
  `;
}).join("")}
</div>

<h4>Auxiliary Stats</h4>
<div class="stat-grid">
  ${AUXILIARY_STATS.map(key => {
  const penalty = injuryPenalty(man, key);

  return `
    <span class="stat-pill">
      <span>${STAT_DEFS[key]}</span>
      <strong>
        ${formatStat(man.stats[key] || 0)}
        ${penalty > 0 ? `<span style="color:#d44;">(-${formatStat(penalty)})</span>` : ""}
      </strong>
    </span>
  `;
}).join("")}
</div>
${man.isLeader ? `
<h4>Leader Stats</h4>
<div class="stat-grid">
  ${["command", "sailing", "management"].map((key) =>
    `<span class="stat-pill">
      <span>${STAT_DEFS[key]}</span>
      <strong>
  ${formatStat(effectiveStat(man, key))}
  ${
    injuryPenalty(man, key)
      ? `<span class="injuryPenalty">(-${injuryPenalty(man, key)})</span>`
      : ""
  }
</strong>
    </span>`
  ).join("")}
</div>
` : ""}
</td>
      <td>
        <div class="actions">
          ${equipmentSelect(man, "weapon", ["none", ...WEAPONS], man.equipment.weapon)}
          ${equipmentSelect(man, "shield", ["no", "yes"], man.equipment.shield ? "yes" : "no")}
          ${equipmentSelect(man, "armor", ARMORS, man.equipment.armor)}
          ${equipmentSelect(man, "helm", HELMS, man.equipment.helm)}
          ${equipmentSelect(man, "bow", ["no", "yes"], man.equipment.bow ? "yes" : "no")}
        </div>
      </td>
      <td>
        ${trainingSelect(man, "primary")}
        ${trainingSelect(man, "secondary")}
      </td>
      <td>
        <button class="${man.active ? "moss" : "secondary"}" data-action="toggleActive" data-id="${man.id}">${man.active ? "Sailing" : "Home"}</button>
      </td>
      <td>${man.isLeader ? "Jarl" : `<button class="danger" data-action="fire" data-id="${man.id}">Fire</button>`}</td>
    </tr>
  `;
}

function injuryPenalty(man, key) {
  const base = man.stats[key] || 0;
  const current = effectiveStat(man, key);
  return Math.max(0, base - current);
}

function equipmentSelect(man, slot, options, current) {
  return `
    <select data-action="equip" data-id="${man.id}" data-slot="${slot}">
      ${options.map((item) => `<option value="${item}" ${current === item ? "selected" : ""}>${equipmentLabel(item, slot)}</option>`).join("")}
    </select>
  `;
}

function equipmentLabel(item, slot) {
  if (slot === "shield" || slot === "bow") return item === "yes" ? (slot === "bow" ? "Bow" : "Shield") : `No ${slot}`;
  if (item === "none") return `No ${slot}`;
  return EQUIPMENT[item]?.label || item;
}

function trainingSelect(man, slot) {
  const options = man.isLeader ? LEADER_TRAINING_STATS : TRAINING_STATS;
  return `
    <select data-action="training" data-id="${man.id}" data-slot="${slot}">
      ${options.map((stat) => `<option value="${stat}" ${man[slot] === stat ? "selected" : ""}>${slot}: ${STAT_DEFS[stat]}</option>`).join("")}
    </select>
  `;
}

function gearText(man) {
  const gear = [];
  if (man.equipment.weapon && man.equipment.weapon !== "none") gear.push(EQUIPMENT[man.equipment.weapon].label);
  if (man.equipment.shield) gear.push("Shield");
  if (man.equipment.armor === "hauberk") gear.push("Hauberk");
  if (man.equipment.helm === "helm") gear.push("Helm");
  if (man.equipment.bow) gear.push("Bow");
  return gear.length ? gear.join(", ") : "No equipment";
}

function injuryText(man) {
  if (!man.injuries || !man.injuries.length) return "Healthy";
  return man.injuries.map((injury) => `${injury.part}${injury.permanent ? " permanent" : ` ${injury.months} mo.`}`).join(", ");
}

function logView() {
  return `
    <section class="panel">
      <div class="panel-head">
        <h2>Log</h2>
        <span class="muted">All player actions and events.</span>
      </div>
      <div class="panel-body">
        <div class="log">
          ${state.log.map((entry) => `<div class="log-entry"><strong>${entry.time}</strong> ${entry.text}</div>`).join("")}
        </div>
      </div>
    </section>
  `;
}

function drawSoon() {
  requestAnimationFrame(drawBattle);
}

function drawBattle() {
  const canvas = document.querySelector("#battleCanvas");
  if (!canvas || !state?.raid?.battle) return;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  const backgroundImg = getBattleBackground();
  if (backgroundImg?.complete && backgroundImg.naturalWidth) {
    ctx.drawImage(backgroundImg, 0, 0, width, height);
  } else {
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#cde5df");
    sky.addColorStop(0.5, "#d7c38b");
    sky.addColorStop(1, "#6f7b4d");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.fillStyle = "rgba(91, 53, 34, 0.35)";
  for (let i = 0; i < 8; i += 1) {
    ctx.fillRect(i * 130 - 30, 260 + (i % 2) * 18, 90, 8);
  }
  const battle = state.raid.battle;
  const players = livePlayerWall(battle);
  const enemies = liveEnemyWall(battle);
  drawLine(ctx, players, 185, 285, "#2c7a7b", true);
  drawLine(ctx, enemies, 715, 285, "#9f2f2f", false);
  drawReserves(ctx, battle.reserves.map(findMan).filter(Boolean), 170, 360, "#607744");
}

function drawLine(ctx, men, xCenter, yBase, color, facingRight) {
  const spacing = Math.min(54, 340 / Math.max(1, men.length));
  const start = xCenter - ((men.length - 1) * spacing) / 2;
  men.forEach((man, index) => {
    const x = start + index * spacing;
    const y = yBase - (index % 2) * 10;
    drawMan(ctx, x, y, color, man, facingRight);
  });
}

function drawReserves(ctx, men, xCenter, yBase, color) {
  const spacing = Math.min(34, 240 / Math.max(1, men.length));
  const start = xCenter - ((men.length - 1) * spacing) / 2;
  men.forEach((man, index) => drawMan(ctx, start + index * spacing, yBase, color, man, true, 0.72));
}

function drawMan(ctx, x, y, color, man, facingRight, scale = 1) {
  const img = getManSprite(man);
  const width = 42 * scale;
  const height = 60 * scale;
  ctx.save();
  if (img?.complete && img.naturalWidth) {
    ctx.translate(x, y);
    ctx.scale(facingRight ? 1 : -1, 1);
    ctx.drawImage(img, -width / 2, -height, width, height);
    ctx.restore();
    return;
  }

  const hpPct = clamp(man.hp / maxHp(man), 0, 1);
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.ellipse(0, 30, 18, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.fillRect(-9, -18, 18, 36);
  ctx.fillStyle = "#d4b16a";
  ctx.beginPath();
  ctx.arc(0, -28, 10, 0, Math.PI * 2);
  ctx.fill();
  if (man.equipment.shield) {
    ctx.fillStyle = "#f0e4c2";
    ctx.strokeStyle = "#5b3522";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(facingRight ? 13 : -13, -4, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.strokeStyle = "#2f1d17";
  ctx.lineWidth = 3;
  const weaponLength = man.equipment.weapon === "spear" ? 34 : man.equipment.weapon === "daneAxe" ? 30 : 23;
  ctx.beginPath();
  ctx.moveTo(facingRight ? 8 : -8, -10);
  ctx.lineTo(facingRight ? weaponLength : -weaponLength, -24);
  ctx.stroke();
  if (man.equipment.helm === "helm") {
    ctx.fillStyle = "#6c757d";
    ctx.fillRect(-9, -36, 18, 7);
  }
  ctx.fillStyle = "#2f1d17";
  ctx.fillRect(-16, 42, 32, 5);
  ctx.fillStyle = hpPct > 0.5 ? "#607744" : "#9f2f2f";
  ctx.fillRect(-16, 42, 32 * hpPct, 5);
  ctx.restore();
}

app.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const action = button.dataset.action;
  if (button.dataset.view) {
    activeView = button.dataset.view;
    render();
    return;
  }
  if (action === "begin") {
    createState();
    render();
  }
  if (action === "reroll") {
    const left = pendingLeader?.rerollsLeft ?? 5;
    if (left > 0) {
      pendingLeader = createLeader();
      pendingLeader.rerollsLeft = left - 1;
      renderStart();
    }
  }
  if (action === "load") loadGame();
  if (action === "export") exportGame();
  if (action === "import") triggerImport();
  if (action === "importOpponent") triggerOpponentImport();
  if (!state) return;
  if (action === "save") saveGame();
  if (action === "reset") resetGame();
  if (action === "buySupplies") buySupplies(Number(button.dataset.amount));
  if (action === "buyMaxSupplies") buyMaxSupplies();
  if (action === "buyItem") buyItem(button.dataset.item);
  if (action === "sellItem") sellItem(button.dataset.item);
  if (action === "buyLand") buyLand();
  if (action === "sowField") sowField();
  if (action === "buySlave") buySlave();
  if (action === "skipTurn") skipTurn();
  if (action === "enlargeTent") enlargeTent();
  if (action === "refreshRecruits") {
    refreshRecruits(false);
    render();
  }
  if (action === "hire") hireRecruit(button.dataset.id);
  if (action === "fire") fireCrew(button.dataset.id);
  if (action === "toggleActive") toggleCrewActive(button.dataset.id);
  if (action === "bulkTraining") {
    const selected = app.querySelector('[data-role="crewTrainingStat"]')?.value;
    setAllCrewTraining(button.dataset.slot, selected);
  }
  if (action === "sortCrew") {
    state.crewSort = button.dataset.sort;
    render();
  }
  if (action === "autoEquip") autoEquip();
  if (action === "startRaid") {
  startRaid(button.dataset.destination);
  return;
}
  if (action === "scout") scoutEnemy();
  if (action === "sortRaidCrew") {
    if (state.raid) {
      state.raid.sortBy = button.dataset.sort;
      render();
    }
  }
  if (action === "toggleWall") toggleWall(button.dataset.id);
  if (action === "beginBattle") beginBattle();
  if (action === "continueRound") continueRound();
  if (action === "swap") swapFighters();
  if (action === "rally") rally();
  if (action === "continueRaid") continueRaid();
  if (action === "continueSeaEvent") {
  const direction = state.seaEvent.direction;

  state.seaEvent = null;

  if (direction === "outbound") {
    playMusic("raid");
    prepareBattle();
    activeView = "raid";
    render();
  } else {
    finishReturnHome();
  }

  return;
}
  if (action === "returnHome") returnHome();
});

app.addEventListener("change", (event) => {
  const target = event.target;
  const action = target.dataset.action;
  if (!state) return;
  if (action === "formation") setFormation(target.value);
  if (action === "equip") equipMan(target.dataset.id, target.dataset.slot, target.value);
  if (action === "training") setTraining(target.dataset.id, target.dataset.slot, target.value);
});

pendingLeader = createLeader();
loadGame() || renderStart();
