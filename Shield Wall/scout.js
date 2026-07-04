function scoutEnemy() {
  if (!state.raid || !state.raid.battle || state.raid.scouted) return;
  const candidates = activeCrew().filter((man) => !man.scoutOut);
  if (!candidates.length) {
    notify("No crew member can scout.");
    return;
  }
  const scout = candidates.sort((a, b) => effectiveStat(b, "speed") + effectiveStat(b, "intelligence")
    - (effectiveStat(a, "speed") + effectiveStat(a, "intelligence")))[0];
  const info = [0, 25, 50, 75][randInt(0, 3)];
  const missesBattle = chance(0.5);
  state.raid.scouted = true;
  state.raid.scoutInfo = {
    scoutName: scout.name,
    scoutSpeed: effectiveStat(scout, "speed"),
    scoutIntelligence: effectiveStat(scout, "intelligence"),
    enemyStrength: randInt(target.count[0], target.count[1]) * target.rank,
    lootPotential: info,
  };
  notify(`${scout.name} has scouted the enemy. They have ${info}% chance of finding valuable loot.`);
}
