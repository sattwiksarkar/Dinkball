// CircuitMap — tier progression map with lock/star state.
import VenueData from '../data/VenueData.js';
import SaveManager from '../data/SaveManager.js';
import GameState from '../data/GameState.js';

export default class CircuitMap {
  constructor(sceneManager) {
    this._sm   = sceneManager;
    this._tiers = [];
    this._sel  = 0;
  }

  onEnter() {
    this._tiers = (VenueData.getAll() || []).sort((a, b) => (a.tier || 0) - (b.tier || 0));
    // Default to first unlocked-but-not-completed tier
    this._sel = 0;
    for (let i = 0; i < this._tiers.length; i++) {
      if (SaveManager.isTierUnlocked(this._tiers[i].tier) && SaveManager.getTierStars(this._tiers[i].tier) === 0) {
        this._sel = i;
        break;
      }
    }
  }

  update(dt, keysDown, keysJustPressed) {
    if (keysJustPressed.has('ArrowLeft') || keysJustPressed.has('KeyA')) {
      this._sel = Math.max(0, this._sel - 1);
    }
    if (keysJustPressed.has('ArrowRight') || keysJustPressed.has('KeyD')) {
      this._sel = Math.min(this._tiers.length - 1, this._sel + 1);
    }
    if (keysJustPressed.has('Space') || keysJustPressed.has('Enter')) {
      const tier = this._tiers[this._sel];
      if (tier && SaveManager.isTierUnlocked(tier.tier)) {
        GameState.circuitTier  = tier.tier;
        GameState.charSelectRole = 'player';
        this._sm.replace('charselect');
      }
    }
    if (keysJustPressed.has('Escape') || keysJustPressed.has('KeyW')) {
      this._sm.replace('mainmenu');
    }
  }

  draw(ctx) {
    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, 320, 240);

    ctx.fillStyle = '#ffd60a';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CIRCUIT MODE', 160, 16);

    const tiers = this._tiers;
    if (!tiers.length) {
      ctx.fillStyle = '#666'; ctx.fillText('Loading...', 160, 120);
      return;
    }

    // Lay nodes out horizontally (wrap to 2 rows if >5)
    const cols = Math.min(tiers.length, 5);
    const rows = Math.ceil(tiers.length / cols);
    const startX = 160 - (cols - 1) * 35 / 2;

    for (let i = 0; i < tiers.length; i++) {
      const t = tiers[i];
      const col  = i % cols;
      const row  = Math.floor(i / cols);
      const nx   = startX + col * 35;
      const ny   = 70 + row * 70;
      const unlocked = SaveManager.isTierUnlocked(t.tier);
      const stars    = SaveManager.getTierStars(t.tier);

      // Connector line to next
      if (col < cols - 1) {
        ctx.strokeStyle = unlocked ? '#446644' : '#333';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(nx + 14, ny); ctx.lineTo(nx + 35 - 14, ny); ctx.stroke();
      }

      // Node circle
      ctx.beginPath(); ctx.arc(nx, ny, 13, 0, Math.PI * 2);
      ctx.fillStyle = i === this._sel ? '#ffd60a' : (unlocked ? '#224422' : '#1a1a2a');
      ctx.fill();
      ctx.strokeStyle = i === this._sel ? '#ffffff' : (unlocked ? '#44cf6c' : '#333');
      ctx.lineWidth = 1;
      ctx.stroke();

      // Tier number
      ctx.fillStyle = unlocked ? (i === this._sel ? '#000' : '#ffffff') : '#444';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(t.tier, nx, ny + 3);

      // Stars below node
      for (let s = 0; s < 3; s++) {
        ctx.fillStyle = s < stars ? '#ffd60a' : '#333';
        ctx.beginPath(); ctx.arc(nx - 7 + s * 7, ny + 20, 2.5, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Selected tier info
    const sel = tiers[this._sel];
    if (sel) {
      const unlocked = SaveManager.isTierUnlocked(sel.tier);
      ctx.fillStyle = '#aaaaaa';
      ctx.font = '7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(sel.name || sel.id, 160, 195);
      ctx.fillText(unlocked ? (sel.ai_difficulty || '') : 'LOCKED', 160, 206);
    }

    ctx.fillStyle = '#444';
    ctx.font = '6px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ARROWS to browse   SPACE to play   W to back', 160, 228);
  }
}
