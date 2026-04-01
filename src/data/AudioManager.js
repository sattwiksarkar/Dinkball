// AudioManager — Web Audio SFX + <audio> music; graceful no-op when files missing.
let _ctx = null;
const _buffers = {};
let _menuEl  = null;   // #music-menu  <audio> element from HTML
let _matchEl = null;   // #music-match <audio> element from HTML
let _dinkEl  = null;   // #sfx-dink — player hit sound
let _donkEl  = null;   // #sfx-donk — AI hit sound
let _crowdGain = null;
let _crowdSource = null;
let _muted = false;

function _getCtx() {
  if (!_ctx) {
    _ctx = new (window.AudioContext || window.webkitAudioContext)();
    _crowdGain = _ctx.createGain();
    _crowdGain.gain.value = 0;
    _crowdGain.connect(_ctx.destination);
  }
  return _ctx;
}

const SFX_FILES = {
  hit_drive:  'assets/audio/sfx/hit_drive.wav',
  hit_dink:   'assets/audio/sfx/hit_dink.wav',
  hit_lob:    'assets/audio/sfx/hit_lob.wav',
  hit_smash:  'assets/audio/sfx/hit_smash.wav',
  hit_drop:   'assets/audio/sfx/hit_drop.wav',
  bounce:     'assets/audio/sfx/bounce.wav',
  fault:      'assets/audio/sfx/fault.wav',
  point_win:  'assets/audio/sfx/point_win.wav',
  crowd_loop: 'assets/audio/sfx/crowd_loop.wav',
};

const SHOT_SFX = [
  'hit_drive', 'hit_dink', 'hit_lob', 'hit_smash', 'hit_drop',
];

const AudioManager = {
  async init() {
    // Pre-load SFX; silently skip missing files.
    const ctx = _getCtx();
    for (const [name, url] of Object.entries(SFX_FILES)) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const buf = await res.arrayBuffer();
        _buffers[name] = await ctx.decodeAudioData(buf);
      } catch { /* asset missing — no-op */ }
    }
    // Crowd loop
    if (_buffers['crowd_loop']) {
      _crowdSource = ctx.createBufferSource();
      _crowdSource.buffer = _buffers['crowd_loop'];
      _crowdSource.loop = true;
      _crowdSource.connect(_crowdGain);
      _crowdSource.start();
    }
    // Grab the <audio> elements declared in index.html
    _menuEl  = document.getElementById('music-menu');
    _matchEl = document.getElementById('music-match');
    _dinkEl  = document.getElementById('sfx-dink');
    _donkEl  = document.getElementById('sfx-donk');
    if (_menuEl)  _menuEl.volume  = 0.5;
    if (_matchEl) _matchEl.volume = 0.5;
    if (_dinkEl)  _dinkEl.volume  = 0.8;
    if (_donkEl)  _donkEl.volume  = 0.8;
  },

  playSfx(name) {
    if (!_ctx || !_buffers[name]) return;
    const src = _ctx.createBufferSource();
    src.buffer = _buffers[name];
    src.connect(_ctx.destination);
    src.start();
  },

  playShotSfx(shotTypeIndex) {
    this.playSfx(SHOT_SFX[shotTypeIndex] || 'hit_drive');
  },

  setCrowdIntensity(value) {
    if (_crowdGain) _crowdGain.gain.value = Math.max(0, Math.min(1, value)) * 0.4;
  },

  _stopAll() {
    if (_menuEl  && !_menuEl.paused)  { _menuEl.pause();  _menuEl.currentTime  = 0; }
    if (_matchEl && !_matchEl.paused) { _matchEl.pause(); _matchEl.currentTime = 0; }
  },

  playMenuMusic() {
    if (!_menuEl) return;
    if (!_menuEl.paused) return;          // already playing
    this._stopAll();
    _menuEl.currentTime = 0;
    _menuEl.play().catch(() => {});
  },

  playMatchMusic() {
    if (!_matchEl) return;
    if (!_matchEl.paused) return;
    this._stopAll();
    _matchEl.currentTime = 0;
    _matchEl.play().catch(() => {});
  },

  // Legacy venue-based call — kept for compatibility.
  playMusic() {
    this.playMatchMusic();
  },

  stopMusic() {
    this._stopAll();
  },

  isMatchMusicPlaying() {
    return !!(_matchEl && !_matchEl.paused);
  },

  // side: 'bottom' = player (dink), 'top' = AI (donk)
  playHitSfx(side) {
    const el = side === 'bottom' ? _dinkEl : _donkEl;
    if (!el || _muted) return;
    el.currentTime = 0;
    el.play().catch(() => {});
  },

  isMuted() { return _muted; },

  toggleMute() {
    _muted = !_muted;
    const vol = _muted ? 0 : 0.5;
    if (_menuEl)  _menuEl.volume  = vol;
    if (_matchEl) _matchEl.volume = vol;
  },

  // Must be called on first user gesture to unlock AudioContext
  unlock() {
    _getCtx().resume().catch(() => {});
  },
};

export default AudioManager;
