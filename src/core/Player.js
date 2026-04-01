// Player — movement, shot dispatch, animation state, drawing.
import { COURT_LEFT, COURT_RIGHT, COURT_TOP, NET_Y, COURT_BOTTOM, project } from './Court.js';
import { ShotType } from './ShotData.js';

export const Side = Object.freeze({ TOP: 'top', BOTTOM: 'bottom' });

// ---------------------------------------------------------------------------
// Module-level sprite caches — loaded once, shared across all Player instances.
// Paths are relative to index.html (the page root).
// ---------------------------------------------------------------------------
function _buildCache(dir) {
  const cache = {};
  for (const [key, file] of Object.entries({
    idle:        'Idle.png',
    forehand:    'forehand.png',
    backhand:    'backhand.png',
    facingRight: 'facing-right.png',
    facingLeft:  'facing-left.png',
  })) {
    const img = new Image();
    img.src = `${dir}/${file}`;
    cache[key] = img;
  }
  return cache;
}

const _playerImgs   = _buildCache('character/player');
const _opponentImgs = _buildCache('Opponent');

// Render height in canvas units; width is derived from each image's aspect ratio.
const SPRITE_H = 30;

export default class Player {
  constructor(side, color = '#4488ff') {
    this.side  = side;
    this.color = color;
    this.x = 160;
    this.y = side === Side.BOTTOM ? COURT_BOTTOM - 20 : COURT_TOP + 20;

    this.movementSpeed = 90;  // set from CharacterData
    this.movementLocked = false;

    // Shot cooldown — prevents re-swing while ball is still mid-flight
    this._swingCooldown = 0;
    this._swingAnim     = 0;   // 0→1 brief swing animation timer
    this._facingX       = 1;   // 1 = right, -1 = left
    this._movingH       = false; // true while moving horizontally this frame
    this._swingForehand = true;  // which swing sprite to show

    // Callback set by MatchManager: fn(shotType, aimDir)
    this.onSwing = null;
  }

  get isAI() { return false; }

  setStats(stats) {
    this.movementSpeed = 60 + (stats.speed || 5) * 4;
  }

  update(dt, keysDown) {
    if (this._swingCooldown > 0) this._swingCooldown -= dt;
    if (this._swingAnim > 0) this._swingAnim = Math.max(0, this._swingAnim - dt * 5);

    if (this.movementLocked) { this._movingH = false; return; }

    // 8-direction movement
    let dx = 0, dy = 0;
    if (keysDown.has('ArrowLeft')  || keysDown.has('KeyA')) dx -= 1;
    if (keysDown.has('ArrowRight') || keysDown.has('KeyD')) dx += 1;
    if (keysDown.has('ArrowUp')    || keysDown.has('KeyW')) dy -= 1;
    if (keysDown.has('ArrowDown')  || keysDown.has('KeyS')) dy += 1;

    if (dx !== 0 && dy !== 0) {
      const inv = 1 / Math.SQRT2;
      dx *= inv; dy *= inv;
    }

    this._movingH = dx !== 0;
    if (dx !== 0) this._facingX = dx > 0 ? 1 : -1;

    this.x += dx * this.movementSpeed * dt;
    this.y += dy * this.movementSpeed * dt;

    // Clamp to own court half
    this.x = Math.max(COURT_LEFT + 4,  Math.min(COURT_RIGHT - 4,  this.x));
    if (this.side === Side.BOTTOM) {
      this.y = Math.max(NET_Y + 2,      Math.min(COURT_BOTTOM - 4, this.y));
    } else {
      this.y = Math.max(COURT_TOP + 4,  Math.min(NET_Y - 2,        this.y));
    }
  }

  // Called by MatchManager when a shot input is received.
  swing(shotType, aimDir, quality = 1.0) {
    if (this._swingCooldown > 0) return false;
    this._swingCooldown = 0.3;
    this._swingAnim = 1.0;
    // Forehand when hitting to the same side as the facing direction, backhand otherwise
    if (aimDir) this._swingForehand = (aimDir.x >= 0) === (this._facingX > 0);
    if (this.onSwing) this.onSwing(shotType, aimDir, quality);
    return true;
  }

  draw(ctx) {
    this._drawSprite(ctx, this.side === Side.BOTTOM ? _playerImgs : _opponentImgs);
  }

  // --- Sprite-based draw (used for both player and opponent) ---
  _drawSprite(ctx, cache) {
    let key;
    if (this._swingAnim > 0) {
      key = this._swingForehand ? 'forehand' : 'backhand';
    } else if (this._movingH) {
      key = this._facingX > 0 ? 'facingRight' : 'facingLeft';
    } else {
      key = 'idle';
    }

    const img = cache[key];
    if (!img || !img.complete || img.naturalWidth === 0) {
      this._drawProcedural(ctx);
      return;
    }

    const { sx, sy, scale } = project(this.x, this.y);
    const drawH = SPRITE_H * scale * 1.6;
    const drawW = drawH * (img.naturalWidth / img.naturalHeight);
    ctx.drawImage(img, sx - drawW / 2, sy - drawH + 8 * scale, drawW, drawH);
  }

  // --- AI player (and fallback): procedural coloured rectangle ---
  _drawProcedural(ctx) {
    const { sx, sy, scale } = project(this.x, this.y);
    const swingScale = 1 + this._swingAnim * 0.2;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(swingScale * scale * 1.6 * this._facingX, swingScale * scale * 1.6);

    // Body
    ctx.fillStyle = this.color;
    ctx.fillRect(-6, -8, 12, 16);

    // Head
    ctx.fillStyle = '#ffddaa';
    ctx.beginPath();
    ctx.arc(0, -12, 5, 0, Math.PI * 2);
    ctx.fill();

    // Paddle arm hint during swing
    if (this._swingAnim > 0) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      const dir = this.side === Side.BOTTOM ? -1 : 1;
      ctx.beginPath();
      ctx.moveTo(6, -4);
      ctx.lineTo(12, -10 + dir * 4);
      ctx.stroke();
    }

    ctx.restore();
  }
}
