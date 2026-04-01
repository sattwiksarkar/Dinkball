// HallOfFame — records display.
import SaveManager from '../data/SaveManager.js';

export default class HallOfFame {
  constructor(sceneManager) {
    this._sm  = sceneManager;
    this._hof = null;
  }

  onEnter() {
    this._hof = SaveManager.getHallOfFame();
  }

  update(dt, keysDown, keysJustPressed) {
    if (keysJustPressed.has('Space') || keysJustPressed.has('Enter') ||
        keysJustPressed.has('Escape') || keysJustPressed.has('KeyW')) {
      this._sm.replace('mainmenu');
    }
  }

  draw(ctx) {
    const hof = this._hof || {};
    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, 320, 240);

    ctx.fillStyle = '#ffd60a';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('HALL OF FAME', 160, 22);

    const records = [
      { label: 'LONGEST RALLY',   value: `${hof.longestRally || 0} shots` },
      { label: 'MOST DINKS',      value: `${hof.mostDinks || 0}` },
      { label: 'BIGGEST MARGIN',  value: `${hof.biggestMargin || 0} pts` },
      { label: 'FASTEST MATCH',   value: hof.fastestMatchSec ? `${Math.floor(hof.fastestMatchSec)}s` : '--' },
    ];

    for (let i = 0; i < records.length; i++) {
      const y = 55 + i * 40;
      ctx.fillStyle = '#aaaaaa';
      ctx.font = '7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(records[i].label, 160, y);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(records[i].value, 160, y + 18);
    }

    ctx.fillStyle = '#444';
    ctx.font = '6px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SPACE to return', 160, 228);
  }
}
