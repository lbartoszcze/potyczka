// What a player keeps between runs: gold, unlocked races, best rounds and
// experience, saved in this browser's storage, and the levels and unlock
// costs read from it.

const META_KEY = 'potyczka-meta-v2';
const LEGACY_META_KEY = 'simple-rts-meta-v2'; // saves from before the rename, migrated on load
const RACE_COST = { humans: 0, dwarves: 8, elves: 18, skeletons: 32 };

export function levelFor(xp) { return Math.floor(Math.sqrt((xp || 0) / 25)) + 1; }
export function xpForLevel(lv) { return Math.pow(Math.max(1, lv) - 1, 2) * 25; }

// Where saved progress that could not be read is kept, so the fresh start
// that replaces it does not overwrite the only copy.
const UNREADABLE_META_KEY = `${META_KEY}.unreadable`;

export function loadMeta() {
  let raw = null;
  try {
    raw = localStorage.getItem(META_KEY);
    if (!raw) raw = localStorage.getItem(LEGACY_META_KEY);
  } catch (e) {
    console.error(`Saved progress could not be read from this browser's storage (${e.message}); allow site storage for this page to keep progress, this run starts fresh.`);
  }
  if (raw) {
    try {
      const m = JSON.parse(raw);
      m.unlocked = m.unlocked || ['humans'];
      m.best = m.best || {};
      m.gold = m.gold || 0;
      m.lifetimeGold = m.lifetimeGold || 0;
      m.runs = m.runs || 0;
      m.userXp = m.userXp || 0;
      m.factionXp = m.factionXp || {};
      return m;
    } catch (e) {
      try {
        localStorage.setItem(UNREADABLE_META_KEY, raw);
        console.error(`Saved progress is not valid JSON (${e.message}); it is kept under ${UNREADABLE_META_KEY} and this run starts fresh.`);
      } catch (kept) {
        console.error(`Saved progress is not valid JSON (${e.message}) and could not be kept aside (${kept.message}); this run starts fresh.`);
      }
    }
  }
  return { gold: 0, lifetimeGold: 0, unlocked: ['humans'], best: {}, runs: 0, userXp: 0, factionXp: {} };
}

export function saveMeta(m) {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(m));
  } catch (e) {
    console.error(`Progress could not be saved in this browser's storage (${e.message}); free site storage or allow it, and the next save keeps it.`);
  }
}

export function awardRoundXp(meta, race, isBoss) {
  const gold = isBoss ? 5 : 1;
  const xp = isBoss ? 25 : 5;
  meta.gold += gold;
  meta.lifetimeGold += gold;
  meta.userXp += xp;
  meta.factionXp[race] = (meta.factionXp[race] || 0) + xp;
  return { gold, xp };
}

export function awardRunEndXp(meta, race) { meta.userXp += 10; meta.factionXp[race] = (meta.factionXp[race] || 0) + 10; }

export function factionLevel(meta, race) {
  return levelFor(meta.factionXp?.[race] || 0);
}

export function recordRunEnd(meta, race, round) {
  meta.runs += 1;
  if (!meta.best[race] || round > meta.best[race]) meta.best[race] = round;
}

export function unlockCost(race) { return RACE_COST[race] || 0; }
export function isUnlocked(meta, race) { return meta.unlocked.includes(race); }
export function tryUnlock(meta, race) {
  const cost = unlockCost(race);
  if (isUnlocked(meta, race) || meta.gold < cost) return false;
  meta.gold -= cost;
  meta.unlocked.push(race);
  return true;
}
