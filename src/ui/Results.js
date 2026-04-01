// Results — star award animation, win/loss message, unlock reveal.
import SaveManager from '../data/SaveManager.js';
import AudioManager from '../data/AudioManager.js';
import GameState from '../data/GameState.js';

export default class Results {
  constructor(sceneManager) {
    this._sm         = sceneManager;
    this._result     = null;
    this._starsShown = 0;
    this._starTimer  = 0;
    this._sel        = 0; // 0=continue, 1=hof, 2=menu
    this._time       = 0;
  }

  onEnter(result) {
    this._result     = result || { winner: 'player', stars: 1, games: { bottom: 0, top: 0 } };
    this._starsShown = 0;
    this._starTimer  = 0.6;
    this._sel        = 0;
    this._time       = 0;
  }

  update(dt, keysDown, keysJustPressed) {
    this._time += dt;

    // Reveal stars one by one
    if (this._starsShown < (this._result?.stars || 0)) {
      this._starTimer -= dt;
      if (this._starTimer <= 0) {
        this._starsShown++;
        this._starTimer = 0.4;
        AudioManager.playSfx('point_win');
      }
    }

    if (keysJustPressed.has('ArrowDown') || keysJustPressed.has('KeyS')) {
      this._sel = (this._sel + 1) % 3;
    }
    if (keysJustPressed.has('ArrowUp') || keysJustPressed.has('KeyW')) {
      this._sel = (this._sel - 1 + 3) % 3;
    }
    if (keysJustPressed.has('Space') || keysJustPressed.has('Enter')) {
      if (this._sel === 0) {
        if (GameState.mode === 'circuit') this._sm.replace('circuit');
        else this._sm.replace('charselect');
      } else if (this._sel === 1) {
        this._sm.replace('halloffame');
      } else {
        this._sm.replace('mainmenu');
      }
    }
  }

  draw(ctx) {
    const r = this._result;
    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, 320, 240);

    const won = r?.winner === 'player';
    ctx.fillStyle = won ? '#ffd60a' : '#ff4444';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(won ? 'YOU WIN!' : 'GAME OVER', 160, 40);

    // Games score
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px monospace';
    ctx.fillText(`${r?.games?.bottom || 0} - ${r?.games?.top || 0}`, 160, 60);

    // Stars
    for (let i = 0; i < 3; i++) {
      const lit = i < this._starsShown;
      const scale = lit ? 1 + Math.abs(Math.sin(this._time * 3 + i)) * 0.05 : 1;
      ctx.save();
      ctx.translate(130 + i * 30, 90);
      ctx.scale(scale, scale);
      ctx.fillStyle = lit ? '#ffd60a' : '#333333';
      ctx.font = '20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('★', 0, 8);
      ctx.restore();
    }

    // Unlock reveal
    if (r?.winner === 'player' && GameState.mode === 'circuit') {
      ctx.fillStyle = '#44cf6c';
      ctx.font = '7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NEW CHARACTER UNLOCKED!', 160, 122);
    }

    // Nav options
    const opts = ['CONTINUE', 'HALL OF FAME', 'MAIN MENU'];
    for (let i = 0; i < opts.length; i++) {
      ctx.fillStyle = i === this._sel ? '#ffd60a' : '#666666';
      ctx.font = i === this._sel ? 'bold 9px monospace' : '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText((i === this._sel ? '> ' : '  ') + opts[i], 160, 150 + i * 18);
    }

    ctx.fillStyle = '#444';
    ctx.font = '6px monospace';
    ctx.fillText('W/S to navigate   SPACE to select', 160, 228);
  }
}
