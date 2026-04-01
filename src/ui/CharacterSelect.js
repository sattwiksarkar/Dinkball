// CharacterSelect — stat bars with animation, locked/unlocked, role-aware.
import CharacterData from '../data/CharacterData.js';
import SaveManager from '../data/SaveManager.js';
import GameState from '../data/GameState.js';
import VenueData from '../data/VenueData.js';

const STAT_KEYS   = ['power','speed','kitchen','consistency','serve'];
const STAT_LABELS = ['PWR','SPD','KIT','CON','SRV'];

export default class CharacterSelect {
  constructor(sceneManager) {
    this._sm       = sceneManager;
    this._chars    = [];
    this._sel      = 0;
    this._barAnim  = 1.0;
  }

  onEnter() {
    const all = CharacterData.getAll();
    if (GameState.charSelectRole === 'player') {
      this._chars = all.filter(c => c.playable);
    } else {
      this._chars = [...all];
    }
    this._sel = 0;
    this._barAnim = 0;
  }

  onClick(x, y) {
    // Left arrow zone → previous character
    if (x < 40) { this._sel = (this._sel - 1 + this._chars.length) % this._chars.length; this._barAnim = 0; return; }
    // Right arrow zone → next character
    if (x > 280) { this._sel = (this._sel + 1) % this._chars.length; this._barAnim = 0; return; }
    // Card area → confirm
    if (x >= 70 && x <= 250 && y >= 28 && y <= 198) { this._confirm(); return; }
    // Dot indicators → jump to character
    const total = this._chars.length;
    const dotStart = 160 - total * 5;
    for (let i = 0; i < total; i++) {
      const dx = x - (dotStart + i * 10), dy = y - 210;
      if (dx * dx + dy * dy < 36) { this._sel = i; this._barAnim = 0; return; }
    }
  }

  update(dt, keysDown, keysJustPressed) {
    if (this._barAnim < 1.0) this._barAnim = Math.min(1.0, this._barAnim + dt * 5);

    if (keysJustPressed.has('ArrowLeft') || keysJustPressed.has('KeyA')) {
      this._sel = (this._sel - 1 + this._chars.length) % this._chars.length;
      this._barAnim = 0;
    }
    if (keysJustPressed.has('ArrowRight') || keysJustPressed.has('KeyD')) {
      this._sel = (this._sel + 1) % this._chars.length;
      this._barAnim = 0;
    }

    if (keysJustPressed.has('Space') || keysJustPressed.has('Enter')) {
      this._confirm();
    }
    if (keysJustPressed.has('KeyW') || keysJustPressed.has('Escape')) {
      this._sm.replace('mainmenu');
    }
  }

  _confirm() {
    const char   = this._chars[this._sel];
    if (!char) return;
    const locked = !SaveManager.isUnlocked(char.id) && !char.playable;
    if (locked) return;

    if (GameState.charSelectRole === 'player') {
      GameState.playerId = char.id;

      if (GameState.mode === 'quick') {
        GameState.venueId = 'garden';
        GameState.charSelectRole = 'opponent';
        this.onEnter(); // rebuild opponent list
      } else if (GameState.mode === 'circuit') {
        const tier = VenueData.getTier(GameState.circuitTier);
        if (tier) {
          GameState.opponentId   = tier.opponent_id || 'colonel';
          GameState.aiDifficulty = tier.ai_difficulty || 'Medium';
          GameState.venueId      = tier.id || 'garden';
        }
        this._sm.replace('match');
      } else {
        this._sm.replace('match');
      }
    } else {
      GameState.opponentId = char.id;
      GameState.aiDifficulty = 'Medium';
      this._sm.replace('match');
    }
  }

  draw(ctx) {
    const char   = this._chars[this._sel] || {};
    const locked = char.id && !SaveManager.isUnlocked(char.id) && !char.playable;

    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, 320, 240);

    // Title
    const title = GameState.charSelectRole === 'player' ? 'CHOOSE YOUR CHARACTER' : 'CHOOSE OPPONENT';
    ctx.fillStyle = '#ffd60a';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(title, 160, 14);

    // Arrows
    ctx.fillStyle = '#ffd60a';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('<', 20, 130);
    ctx.textAlign = 'right';
    ctx.fillText('>', 300, 130);

    // Card
    const cx = 70, cy = 28;
    ctx.fillStyle = '#111122';
    ctx.fillRect(cx, cy, 180, 170);
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx + 0.5, cy + 0.5, 180, 170);

    if (char.name) {
      const nameCol = locked ? '#555555' : '#ffffff';
      ctx.fillStyle = nameCol;
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(char.name, 160, cy + 16);

      if (locked) {
        ctx.fillStyle = '#555555';
        ctx.font = '9px monospace';
        ctx.fillText('LOCKED', 160, cy + 90);
        ctx.font = '7px monospace';
        ctx.fillText(`Unlock: Circuit Tier ${char.unlock_tier || '?'}`, 160, cy + 104);
      } else {
        ctx.fillStyle = '#aaaaaa';
        ctx.font = '7px monospace';
        ctx.fillText(char.description || '', 160, cy + 32);

        // Stat bars
        const stats = char.stats || {};
        for (let i = 0; i < STAT_KEYS.length; i++) {
          const val = stats[STAT_KEYS[i]] || 5;
          const sy  = cy + 52 + i * 18;
          ctx.fillStyle = '#aaaaaa';
          ctx.font = '7px monospace';
          ctx.textAlign = 'left';
          ctx.fillText(STAT_LABELS[i], cx + 6, sy + 8);
          // BG bar
          ctx.fillStyle = '#1a3a2a';
          ctx.fillRect(cx + 36, sy, 128, 8);
          // Fill bar (animated)
          ctx.fillStyle = '#44cf6c';
          ctx.fillRect(cx + 36, sy, val * 12.8 * this._barAnim, 8);
        }
      }
    }

    // Dot indicators
    const total = this._chars.length;
    const dotStart = 160 - total * 5;
    for (let i = 0; i < total; i++) {
      ctx.fillStyle = i === this._sel ? '#ffd60a' : '#666666';
      ctx.beginPath(); ctx.arc(dotStart + i * 10, 210, 2, 0, Math.PI * 2); ctx.fill();
    }

    ctx.fillStyle = '#666666';
    ctx.font = '6px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ARROWS to browse   SPACE to select   W to back', 160, 228);
  }
}
