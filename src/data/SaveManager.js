// SaveManager — localStorage persistence for circuit progress, unlocks, Hall of Fame.
const SAVE_KEY = 'dinkball_save';

function _load() {
  try {
    return JSON.parse(localStorage.getItem(SAVE_KEY)) || _defaults();
  } catch {
    return _defaults();
  }
}

function _defaults() {
  return {
    unlockedCharacters: ['rex', 'manda', 'big_clive', 'suki'],
    unlockedTiers: [1],
    tierStars: {},
    hallOfFame: {
      longestRally: 0,
      mostDinks: 0,
      biggestMargin: 0,
      fastestMatchSec: 0,
    },
  };
}

function _save(data) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

const SaveManager = {
  isUnlocked(characterId) {
    return _load().unlockedCharacters.includes(characterId);
  },

  unlockCharacter(characterId) {
    const d = _load();
    if (!d.unlockedCharacters.includes(characterId)) {
      d.unlockedCharacters.push(characterId);
      _save(d);
    }
  },

  isTierUnlocked(tier) {
    return _load().unlockedTiers.includes(tier);
  },

  unlockTier(tier) {
    const d = _load();
    if (!d.unlockedTiers.includes(tier)) {
      d.unlockedTiers.push(tier);
      _save(d);
    }
  },

  getTierStars(tier) {
    return _load().tierStars[tier] || 0;
  },

  setTierStars(tier, stars) {
    const d = _load();
    if ((d.tierStars[tier] || 0) < stars) {
      d.tierStars[tier] = stars;
      _save(d);
    }
  },

  getHallOfFame() {
    return _load().hallOfFame;
  },

  updateHallOfFame(updates) {
    const d = _load();
    const hof = d.hallOfFame;
    if (updates.longestRally > hof.longestRally) hof.longestRally = updates.longestRally;
    if (updates.mostDinks > hof.mostDinks) hof.mostDinks = updates.mostDinks;
    if (updates.biggestMargin > hof.biggestMargin) hof.biggestMargin = updates.biggestMargin;
    if (updates.fastestMatchSec && (hof.fastestMatchSec === 0 || updates.fastestMatchSec < hof.fastestMatchSec)) {
      hof.fastestMatchSec = updates.fastestMatchSec;
    }
    _save(d);
  },

  reset() {
    _save(_defaults());
  },
};

export default SaveManager;
