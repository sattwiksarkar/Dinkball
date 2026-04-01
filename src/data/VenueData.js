// VenueData — loads venues.json, provides getAll() / getById() / getTier().
let _cache = null;

async function _load() {
  if (_cache) return _cache;
  const res  = await fetch('data/venues.json');
  const json = await res.json();
  _cache = json.tiers || json;
  return _cache;
}

const VenueData = {
  async init() {
    await _load();
  },

  getAll() {
    return _cache || [];
  },

  getById(id) {
    return (_cache || []).find(v => v.id === id) || null;
  },

  getTier(tier) {
    return (_cache || []).find(v => v.tier === tier) || null;
  },
};

export default VenueData;
