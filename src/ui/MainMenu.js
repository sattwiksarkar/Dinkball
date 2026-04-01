// MainMenu — home screen with custom artwork backdrop and arcade mode select.
import GameState from '../data/GameState.js';
import AudioManager from '../data/AudioManager.js';

// Mute button — top-right corner
const MUTE_BTN = { x: 298, y: 4, w: 18, h: 13 };

const MODES = [
  { id: 'quick',      label: 'QUICK MATCH' },
  { id: 'circuit',    label: 'CIRCUIT MODE' },
  { id: 'tournament', label: 'TOURNAMENT'   },
  { id: 'practice',   label: 'PRACTICE'     },
];

// Preload the home screen artwork
const _bg = new Image();
_bg.src = 'home screen.jpg';

export default class MainMenu {
  constructor(sceneManager) {
    this._sm   = sceneManager;
    this._sel  = 0;
    this._time = 0;

    // Cursor blink
    this._blink = 0;

    // Press-start flash state
    this._titlePhase  = 'press'; // 'press' | 'waiting' | 'menu'
    this._waitTimer   = 0;
  }

  update(dt, keysDown, keysJustPressed) {
    this._time  += dt;
    this._blink  = (this._time * 2) % 1; // 0–1 cycle, 2 Hz

    if (this._titlePhase === 'press') {
      // Music starts on first keypress; title screen stays visible briefly so
      // the user can hear the track before the mode-select panel appears.
      if (keysJustPressed.size > 0) {
        this._titlePhase = 'waiting';
        this._waitTimer  = 0.6;
      }
      return;
    }

    if (this._titlePhase === 'waiting') {
      this._waitTimer -= dt;
      if (this._waitTimer <= 0) this._titlePhase = 'menu';
      return;
    }

    // Mode navigation
    if (keysJustPressed.has('ArrowDown') || keysJustPressed.has('KeyS')) {
      this._sel = (this._sel + 1) % MODES.length;
    }
    if (keysJustPressed.has('ArrowUp') || keysJustPressed.has('KeyW')) {
      this._sel = (this._sel - 1 + MODES.length) % MODES.length;
    }
    if (keysJustPressed.has('Space') || keysJustPressed.has('Enter')) {
      GameState.mode = MODES[this._sel].id;
      GameState.charSelectRole = 'player';
      this._sm.replace('charselect');
    }
  }

  onClick(x, y) {
    // Mute button
    const b = MUTE_BTN;
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
      AudioManager.toggleMute();
      return;
    }

    // Press-any-key phase — tap anywhere advances
    if (this._titlePhase === 'press') {
      this._titlePhase = 'waiting';
      this._waitTimer  = 0.6;
      return;
    }

    // Mode select phase — tap a mode row to select it, double-tap (same row) to confirm
    if (this._titlePhase === 'menu') {
      for (let i = 0; i < MODES.length; i++) {
        const rowY = 178 + i * 14;
        if (y >= rowY - 10 && y < rowY + 5) {
          if (this._sel === i) {
            // Already selected — confirm
            GameState.mode = MODES[i].id;
            GameState.charSelectRole = 'player';
            this._sm.replace('charselect');
          } else {
            this._sel = i;
          }
          return;
        }
      }
    }
  }

  draw(ctx) {
    // --- 1. Background artwork ---
    if (_bg.complete && _bg.naturalWidth > 0) {
      ctx.drawImage(_bg, 0, 0, 320, 240);
    } else {
      ctx.fillStyle = '#0d1a2e';
      ctx.fillRect(0, 0, 320, 240);
    }

    // --- 2. Gradient overlay — darkens bottom half for readability ---
    const grad = ctx.createLinearGradient(0, 100, 0, 240);
    grad.addColorStop(0,   'rgba(0,0,0,0)');
    grad.addColorStop(0.4, 'rgba(0,0,0,0.55)');
    grad.addColorStop(1,   'rgba(0,0,0,0.88)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 320, 240);

    // --- 3. Scanline texture (every other row, very subtle) ---
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    for (let y = 0; y < 240; y += 2) {
      ctx.fillRect(0, y, 320, 1);
    }

    if (this._titlePhase === 'press') {
      this._drawPressStart(ctx);
    } else {
      this._drawModeSelect(ctx);
    }

    this._drawMuteBtn(ctx);
  }

  _drawMuteBtn(ctx) {
    const { x, y, w, h } = MUTE_BTN;
    const muted = AudioManager.isMuted();

    ctx.save();
    // Background pill
    ctx.fillStyle = muted ? 'rgba(180,40,40,0.85)' : 'rgba(0,0,0,0.65)';
    ctx.strokeStyle = muted ? '#ff6666' : 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 3);
    ctx.fill();
    ctx.stroke();

    // Icon: speaker symbol
    ctx.fillStyle = '#ffffff';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(muted ? '🔇' : '🔊', x + w / 2, y + h / 2);
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }

  _drawPressStart(ctx) {
    // Subtitle under the artwork title
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(60, 195, 200, 14);

    ctx.fillStyle = '#aaccff';
    ctx.font = '7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('16-BIT ARCADE PICKLEBALL', 160, 205);

    // Blinking "PRESS ANY KEY"
    if (this._blink < 0.6) {
      ctx.fillStyle = '#ffd60a';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PRESS ANY KEY TO START', 160, 226);
    }
  }

  _drawModeSelect(ctx) {
    // Panel background
    ctx.fillStyle = 'rgba(0,0,8,0.72)';
    ctx.fillRect(55, 148, 210, 82);
    ctx.strokeStyle = '#ffd60a';
    ctx.lineWidth = 1;
    ctx.strokeRect(55.5, 148.5, 210, 82);

    // Panel title
    ctx.fillStyle = '#ffd60a';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SELECT MODE', 160, 162);

    // Divider
    ctx.strokeStyle = 'rgba(255,214,10,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(65, 167); ctx.lineTo(255, 167);
    ctx.stroke();

    // Mode entries
    for (let i = 0; i < MODES.length; i++) {
      const y = 178 + i * 14;
      const selected = i === this._sel;

      if (selected) {
        // Highlight row
        ctx.fillStyle = 'rgba(255,214,10,0.15)';
        ctx.fillRect(58, y - 9, 204, 13);

        // Paddle cursor (left)
        ctx.fillStyle = '#ffd60a';
        ctx.fillRect(64, y - 7, 7, 10);   // paddle face
        ctx.fillRect(71, y - 2, 4, 2);    // handle

        ctx.fillStyle = '#ffd60a';
        ctx.font = 'bold 8px monospace';
      } else {
        ctx.fillStyle = '#778899';
        ctx.font = '8px monospace';
      }

      ctx.textAlign = 'left';
      ctx.fillText(MODES[i].label, 82, y + 1);

      // Arrow on right for selected
      if (selected) {
        ctx.fillStyle = '#ffd60a';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('▶', 250, y + 1);
      }
    }

    // Footer hint
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('W/S · ARROWS  navigate     SPACE · ENTER  select', 160, 237);
  }
}
