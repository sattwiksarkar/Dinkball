// MatchScene — thin wrapper around MatchManager for scene integration.
import MatchManager from '../core/MatchManager.js';
import GameState from '../data/GameState.js';

export default class MatchScene {
  constructor(sceneManager) {
    this._sm      = sceneManager;
    this._manager = null;
  }

  onEnter() {
    this._manager = new MatchManager(
      (result) => { this._sm.replace('results', result); },
      ()       => { this._sm.replace('mainmenu'); }
    );
    this._manager.init();
  }

  update(dt, keysDown, keysJustPressed) {
    if (this._manager) this._manager.update(dt, keysDown, keysJustPressed);
  }

  draw(ctx) {
    if (this._manager) this._manager.draw(ctx);
  }
}
