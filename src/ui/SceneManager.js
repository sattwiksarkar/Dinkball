// SceneManager — scene stack with fade-black screen-wipe transitions.
import MainMenu      from './MainMenu.js';
import CharacterSelect from './CharacterSelect.js';
import CircuitMap    from './CircuitMap.js';
import Results       from './Results.js';
import HallOfFame    from './HallOfFame.js';
import MatchScene    from './MatchScene.js';

export default class SceneManager {
  constructor() {
    this._current    = null;
    this._fadeAlpha  = 0;
    this._fading     = false;
    this._nextKey    = null;
    this._nextArg    = null;

    // Instantiate all scenes (share single instances)
    this._scenes = {
      mainmenu:    new MainMenu(this),
      charselect:  new CharacterSelect(this),
      circuit:     new CircuitMap(this),
      results:     new Results(this),
      halloffame:  new HallOfFame(this),
      match:       new MatchScene(this),
    };
  }

  // Replace current scene with a fade wipe transition.
  replace(key, arg) {
    if (this._fading) return;
    this._fading   = true;
    this._nextKey  = key;
    this._nextArg  = arg;
  }

  start(key, arg) {
    this._current = this._scenes[key];
    if (this._current?.onEnter) this._current.onEnter(arg);
    this._fadeAlpha = 0;
    this._fading = false;
  }

  update(dt, keysDown, keysJustPressed) {
    if (this._fading) {
      this._fadeAlpha += dt * (1 / 0.18);
      if (this._fadeAlpha >= 1.0) {
        this._fadeAlpha = 1.0;
        this._fading    = false;
        this.start(this._nextKey, this._nextArg);
        // Brief hold at black then reveal
        this._revealTimer = 0.08;
        this._revealing   = true;
      }
      return;
    }

    if (this._revealing) {
      this._revealTimer -= dt;
      if (this._revealTimer <= 0) {
        this._revealing = false;
        this._revealAlpha = 1.0;
      }
      return;
    }

    if (this._revealAlpha > 0) {
      this._revealAlpha = Math.max(0, (this._revealAlpha || 0) - dt * (1 / 0.28));
    }

    if (this._current?.update) {
      this._current.update(dt, keysDown, keysJustPressed);
    }
  }

  onClick(x, y) {
    if (this._current?.onClick) this._current.onClick(x, y);
  }

  draw(ctx) {
    if (this._current?.draw) {
      this._current.draw(ctx);
    }

    // Fade overlay
    const alpha = this._fading
      ? this._fadeAlpha
      : (this._revealAlpha || 0);

    if (alpha > 0) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = '#000000';
      ctx.fillRect(0, 0, 320, 240);
      ctx.restore();
    }
  }
}
