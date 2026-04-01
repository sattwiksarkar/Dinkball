// MobileControls — virtual gamepad for touch devices.
// Draws the D-pad + shot buttons on the canvas and exposes zone detection.

let _matchActive = false;
let _servePhase  = 'none';  // 'aim' | 'power' | 'none'

// Set by MatchScene on enter/exit
export function setMatchActive(active) { _matchActive = active; }

// Called each frame by MatchManager so the draw reflects current serve state
export function setServePhase(phase) { _servePhase = phase; }

// ---------------------------------------------------------------------------
// Zone definitions (all in 320×240 canvas space)
// ---------------------------------------------------------------------------

// D-pad: polar detection around a centre point
const DPAD = { cx: 34, cy: 212, outerR: 23, innerR: 5 };

// Shot buttons: circular
const SHOTS = [
  { key: 'KeyI', label: 'LOB',  cx: 262, cy: 198, r: 10, color: '#4488ff' },
  { key: 'KeyU', label: 'SMS',  cx: 286, cy: 198, r: 10, color: '#ff4444' },
  { key: 'KeyJ', label: 'DRV',  cx: 262, cy: 216, r: 10, color: '#44cc66' },
  { key: 'KeyK', label: 'DNK',  cx: 286, cy: 216, r: 10, color: '#ffaa00' },
  { key: 'KeyL', label: 'DRP',  cx: 274, cy: 234, r: 10, color: '#cc66ff' },
];

// Serve button (shown when serve phase is active)
const SERVE = { key: 'Space', x: 118, y: 226, w: 84, h: 12 };

// Pause button (always visible in match)
const PAUSE = { key: 'KeyP', x: 150, y: 2, w: 20, h: 10 };

// Track which keys are currently touch-held (for visual feedback)
const _pressedKeys = new Set();
export function pressKey(key)   { _pressedKeys.add(key); }
export function releaseKey(key) { _pressedKeys.delete(key); }

// ---------------------------------------------------------------------------
// Hit testing — called by main.js on touchstart/touchmove
// ---------------------------------------------------------------------------
export function getKeyAt(cx, cy) {
  if (!_matchActive) return null;

  // Pause
  if (_inRect(cx, cy, PAUSE)) return PAUSE.key;

  // Serve button
  if (_servePhase !== 'none' && _inRect(cx, cy, SERVE)) return SERVE.key;

  // D-pad
  const dk = _dpadKey(cx, cy);
  if (dk) return dk;

  // Shot buttons
  for (const s of SHOTS) {
    const dx = cx - s.cx, dy = cy - s.cy;
    if (dx * dx + dy * dy <= s.r * s.r) return s.key;
  }

  return null;
}

function _dpadKey(x, y) {
  const dx = x - DPAD.cx, dy = y - DPAD.cy;
  const d2 = dx * dx + dy * dy;
  if (d2 > DPAD.outerR * DPAD.outerR) return null;
  if (d2 < DPAD.innerR * DPAD.innerR) return null;
  const a = Math.atan2(dy, dx);
  if (a > -Math.PI / 4 && a <= Math.PI / 4)              return 'ArrowRight';
  if (a > Math.PI / 4  && a <= 3 * Math.PI / 4)          return 'ArrowDown';
  if (a > 3 * Math.PI / 4 || a <= -3 * Math.PI / 4)      return 'ArrowLeft';
  return 'ArrowUp';
}

function _inRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

// ---------------------------------------------------------------------------
// Drawing — called at end of MatchManager.draw()
// ---------------------------------------------------------------------------
export function draw(ctx) {
  if (!_matchActive) return;

  ctx.save();

  // --- D-pad ---
  // Outer ring
  ctx.globalAlpha = 0.30;
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(DPAD.cx, DPAD.cy, DPAD.outerR, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.55;
  const dpadDirs = [
    { key: 'ArrowUp',    dx:  0, dy: -1, label: '▲' },
    { key: 'ArrowDown',  dx:  0, dy:  1, label: '▼' },
    { key: 'ArrowLeft',  dx: -1, dy:  0, label: '◀' },
    { key: 'ArrowRight', dx:  1, dy:  0, label: '▶' },
  ];
  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const d of dpadDirs) {
    const pressed = _pressedKeys.has(d.key);
    const tx = DPAD.cx + d.dx * (DPAD.outerR - 6);
    const ty = DPAD.cy + d.dy * (DPAD.outerR - 6);
    ctx.globalAlpha = pressed ? 1.0 : 0.55;
    ctx.fillStyle = pressed ? '#ffd60a' : '#ffffff';
    ctx.fillText(d.label, tx, ty);
  }

  // --- Shot buttons ---
  for (const s of SHOTS) {
    const pressed = _pressedKeys.has(s.key);
    ctx.globalAlpha = pressed ? 0.92 : 0.50;
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(s.cx, s.cy, s.r, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.globalAlpha = pressed ? 1.0 : 0.70;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Label
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = '#ffffff';
    ctx.font = '5px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(s.label, s.cx, s.cy);
  }

  // --- Serve button ---
  if (_servePhase !== 'none') {
    const pressed = _pressedKeys.has('Space');
    ctx.globalAlpha = pressed ? 0.95 : 0.72;
    ctx.fillStyle = '#ffd60a';
    ctx.beginPath();
    ctx.roundRect(SERVE.x, SERVE.y, SERVE.w, SERVE.h, 4);
    ctx.fill();

    ctx.globalAlpha = 1.0;
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const label = _servePhase === 'aim' ? 'TAP TO SERVE' : 'TAP TO RELEASE';
    ctx.fillText(label, SERVE.x + SERVE.w / 2, SERVE.y + SERVE.h / 2);
  }

  // --- Pause button ---
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.roundRect(PAUSE.x, PAUSE.y, PAUSE.w, PAUSE.h, 2);
  ctx.fill();
  ctx.globalAlpha = 0.80;
  ctx.fillStyle = '#ffffff';
  ctx.font = '7px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⏸', PAUSE.x + PAUSE.w / 2, PAUSE.y + PAUSE.h / 2);

  ctx.restore();
}
