// main.js — game loop, input map, bootstrap.
import SceneManager from './ui/SceneManager.js';
import CharacterData from './data/CharacterData.js';
import VenueData     from './data/VenueData.js';
import AudioManager  from './data/AudioManager.js';

const canvas = document.getElementById('game');
const ctx    = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// Input state
const keysDown       = new Set();
const keysJustPressed = new Set();

canvas.addEventListener('click', e => {
  const rect   = canvas.getBoundingClientRect();
  const cx     = (e.clientX - rect.left) * (320 / rect.width);
  const cy     = (e.clientY - rect.top)  * (240 / rect.height);
  sm.onClick(cx, cy);
});

window.addEventListener('keydown', e => {
  if (!keysDown.has(e.code)) keysJustPressed.add(e.code);
  keysDown.add(e.code);
  e.preventDefault();

  // Unlock AudioContext on every keydown (safe to call repeatedly).
  // Only start menu music if match music is not currently playing —
  // prevents in-match keypresses from switching back to the menu track.
  AudioManager.unlock();
  if (!AudioManager.isMatchMusicPlaying()) {
    AudioManager.playMenuMusic();
  }
});
window.addEventListener('keyup', e => {
  keysDown.delete(e.code);
});

// Fixed timestep game loop
let lastTime = 0;
const TARGET_DT = 1 / 60;
let accumulator = 0;

const sm = new SceneManager();

function loop(ts) {
  requestAnimationFrame(loop);

  const now = ts / 1000;
  let dt = now - lastTime;
  lastTime = now;

  // Cap dt to avoid spiral of death on tab switch
  if (dt > 0.1) dt = 0.1;
  accumulator += dt;

  while (accumulator >= TARGET_DT) {
    sm.update(TARGET_DT, keysDown, keysJustPressed);
    keysJustPressed.clear();
    accumulator -= TARGET_DT;
  }

  // Clear and draw
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
