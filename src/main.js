// main.js — game loop, input map, bootstrap.
import SceneManager    from './ui/SceneManager.js';
import CharacterData   from './data/CharacterData.js';
import VenueData       from './data/VenueData.js';
import AudioManager    from './data/AudioManager.js';
import * as Mobile     from './ui/MobileControls.js';

const canvas = document.getElementById('game');
const ctx    = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// Input state
const keysDown        = new Set();
const keysJustPressed = new Set();

// ---------------------------------------------------------------------------
// Keyboard input (desktop)
// ---------------------------------------------------------------------------
window.addEventListener('keydown', e => {
  if (!keysDown.has(e.code)) keysJustPressed.add(e.code);
  keysDown.add(e.code);
  e.preventDefault();

  AudioManager.unlock();
  if (!AudioManager.isMatchMusicPlaying()) AudioManager.playMenuMusic();
});
window.addEventListener('keyup', e => {
  keysDown.delete(e.code);
});

// ---------------------------------------------------------------------------
// Touch input (mobile)
// ---------------------------------------------------------------------------
// Map from touch.identifier → virtual key currently held by that finger
const _touchMap = new Map();

function _canvasXY(touch) {
  const rect = canvas.getBoundingClientRect();
  return {
    cx: (touch.clientX - rect.left) * (320 / rect.width),
    cy: (touch.clientY - rect.top)  * (240 / rect.height),
  };
}

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  AudioManager.unlock();
  if (!AudioManager.isMatchMusicPlaying()) AudioManager.playMenuMusic();

  for (const touch of e.changedTouches) {
    const { cx, cy } = _canvasXY(touch);
    const key = Mobile.getKeyAt(cx, cy);

    if (key) {
      // Virtual gamepad button pressed
      _touchMap.set(touch.identifier, key);
      Mobile.pressKey(key);
      if (!keysDown.has(key)) keysJustPressed.add(key);
      keysDown.add(key);
    } else {
      // Pass through to scene click handler (menus, mute button, etc.)
      sm.onClick(cx, cy);
      // Also counts as "any key" for press-to-start screens
      keysJustPressed.add('Touch');
    }
  }
}, { passive: false });

canvas.addEventListener('touchend', e => {
  e.preventDefault();
  for (const touch of e.changedTouches) {
    const key = _touchMap.get(touch.identifier);
    if (key !== undefined) {
      _touchMap.delete(touch.identifier);
      Mobile.releaseKey(key);
      // Only remove from keysDown if no other finger is holding the same key
      const stillHeld = [..._touchMap.values()].includes(key);
      if (!stillHeld) keysDown.delete(key);
    }
  }
}, { passive: false });

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  for (const touch of e.changedTouches) {
    const { cx, cy } = _canvasXY(touch);
    const newKey = Mobile.getKeyAt(cx, cy);
    const oldKey = _touchMap.get(touch.identifier);

    if (newKey === oldKey) continue; // no change

    // Release old key (if any)
    if (oldKey !== undefined) {
      Mobile.releaseKey(oldKey);
      const stillHeld = [..._touchMap.values()].some((k, id) =>
        k === oldKey && id !== touch.identifier
      );
      if (!stillHeld) keysDown.delete(oldKey);
    }

    // Press new key (if any)
    if (newKey) {
      _touchMap.set(touch.identifier, newKey);
      Mobile.pressKey(newKey);
      if (!keysDown.has(newKey)) keysJustPressed.add(newKey);
      keysDown.add(newKey);
    } else {
      _touchMap.delete(touch.identifier);
    }
  }
}, { passive: false });

// Click handler (desktop mouse clicks + touch fallthrough above)
canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const cx   = (e.clientX - rect.left) * (320 / rect.width);
  const cy   = (e.clientY - rect.top)  * (240 / rect.height);
  sm.onClick(cx, cy);
});

// ---------------------------------------------------------------------------
// Fixed timestep game loop
// ---------------------------------------------------------------------------
let lastTime    = 0;
const TARGET_DT = 1 / 60;
let accumulator = 0;

const sm = new SceneManager();

function loop(ts) {
  requestAnimationFrame(loop);

  const now = ts / 1000;
  let dt     = now - lastTime;
  lastTime   = now;

  if (dt > 0.1) dt = 0.1;
  accumulator += dt;

  while (accumulator >= TARGET_DT) {
    sm.update(TARGET_DT, keysDown, keysJustPressed);
    keysJustPressed.clear();
    accumulator -= TARGET_DT;
  }

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 320, 240);
  sm.draw(ctx);
}

async function boot() {
  await Promise.all([
    CharacterData.init(),
    VenueData.init(),
    AudioManager.init(),
  ]);

  sm.start('mainmenu');
  requestAnimationFrame(ts => {
    lastTime = ts / 1000;
    requestAnimationFrame(loop);
  });
}

boot();
