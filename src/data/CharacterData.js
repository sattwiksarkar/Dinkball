// CharacterData — loads characters.json, provides getAll() / getById().
let _cache = null;

async function _load() {
  if (_cache) return _cache;
  const res  = await fetch('data/characters.json');
  const json = await res.json();
  _cache = json.characters || json;
  return _cache;
}

const CharacterData = {
  async init() {
    await _load();
  },

  getAll() {
    return _cache || [];
  },

  getById(id) {
    return (_cache || []).find(c => c.id === id) || null;
  },
};

export default CharacterData;
