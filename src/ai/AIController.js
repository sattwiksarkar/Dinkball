// AIController — base AI: reaction timer, position prediction, shot selection.
import { ShotType } from '../core/ShotData.js';
import { COURT_LEFT, COURT_RIGHT, COURT_TOP, NET_Y, CENTER_X } from '../core/Court.js';
import { Side } from '../core/Player.js';

const DIFFICULTY_MULT = { Easy: 3.0, Medium: 1.5, Hard: 0.8, Expert: 0.4 };

// How far (px) the AI's target position can be off from the true landing spot.
const POSITION_ERROR = { Easy: 40, Medium: 22, Hard: 10, Expert: 3 };
// Probability per swing attempt that the AI simply doesn't swing (fumbles).
const MISS_CHANCE    = { Easy: 0.30, Medium: 0.14, Hard: 0.05, Expert: 0.01 };

export default class AIController {
  constructor(playerRef, difficulty = 'Medium') {
    this.player = playerRef;
    this.difficulty = difficulty;
    this._reactionBase = 0.15;  // seconds before reacting
    this._pendingAction = null;
    this._reactionTimer = 0;
    this._idleTimer = 0;
    this._targetError = { x: 0, y: 0 }; // per-shot positional error baked in at queue time

    // Shot weight table — overridden by archetypes
    this.shotWeights = {
      [ShotType.DRIVE]:     0.3,
      [ShotType.DINK]:      0.25,
      [ShotType.LOB]:       0.2,
      [ShotType.SMASH]:     0.15,
      [ShotType.DROP_SHOT]: 0.1,
    };
  }

  get reactionTime() {
    return this._reactionBase * (DIFFICULTY_MULT[this.difficulty] || 1.5);
  }

  // Predict where ball will land based on current trajectory.
  // During the bounce arc _endX/_endY is the bounce destination (often out-of-court);
  // the real landing spot is stored in _startX/_startY after the first arc completes.
  predictLanding(ball) {
    if (ball.isBouncing) return { x: ball._startX, y: ball._startY };
    return { x: ball._endX, y: ball._endY };
  }

  // Choose shot type via weighted random.
  chooseShot(ball, player) {
    const total = Object.values(this.shotWeights).reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (const [type, w] of Object.entries(this.shotWeights)) {
      r -= w;
      if (r <= 0) return parseInt(type);
    }
    return ShotType.DRIVE;
  }

  // Choose defensive position when ball is not coming at us.
  choosePosition(ball) {
    const halfY = this.player.side === Side.TOP
      ? (COURT_TOP + NET_Y) / 2
      : (NET_Y + 160 + 50) / 2;
    return { x: CENTER_X, y: halfY };
  }

  // Aim direction toward opponent's court.
  // _handleSwing uses:  ty = p.y + aimDir.y  for BOTTOM,  ty = p.y - aimDir.y  for TOP.
  // So aimDir.y must be NEGATIVE for both sides (pointing "away" from the server's baseline).
  chooseAimDir(player) {
    const targetY = player.side === Side.BOTTOM ? COURT_TOP + 30 : 160 + 30;
    const targetX = CENTER_X + (Math.random() - 0.5) * 80;
    // For BOTTOM: aimDir.y = targetY - player.y  (negative, since target is above player)
    // For TOP:    aimDir.y = player.y - targetY  (negative, since target is below player)
    const dy = player.side === Side.BOTTOM
      ? targetY - player.y
      : player.y - targetY;
    return {
      x: targetX - player.x,
      y: dy,
    };
  }

  update(dt, ball, opponents) {
    this._reactionTimer -= dt;
    this._idleTimer     -= dt;

    const landing = this.predictLanding(ball);

    // Is ball heading toward us?
    const ballComingToUs = ball.inFlight && (
      (this.player.side === Side.TOP    && ball._endY < NET_Y) ||
      (this.player.side === Side.BOTTOM && ball._endY > NET_Y)
    );

    if (ballComingToUs) {
      // Move toward predicted landing, offset by a per-difficulty position error
      // that is decided once when the action is queued (stored in _targetError).
      const err = POSITION_ERROR[this.difficulty] || 22;
      const targetX = landing.x + this._targetError.x;
      const targetY = this.player.side === Side.TOP
        ? Math.max(COURT_TOP + 10, Math.min(NET_Y - 5, landing.y - 5 + this._targetError.y))
        : Math.min(210 - 10,       Math.max(NET_Y + 5, landing.y + 5 + this._targetError.y));
      this._moveTo(targetX, targetY, dt);

      // Queue a reaction shot; bake in position error at queue time so the AI
      // commits to a (possibly wrong) destination for the whole approach.
      if (this._pendingAction === null) {
        this._targetError = {
          x: (Math.random() - 0.5) * 2 * err,
          y: (Math.random() - 0.5) * 2 * err,
        };
        this._pendingAction = {
          shotType: this.chooseShot(ball, this.player),
          aimDir:   this.chooseAimDir(this.player),
        };
        this._reactionTimer = this.reactionTime;
      }
    } else {
      // Drift to default position
      const def = this.choosePosition(ball);
      this._moveTo(def.x, def.y, dt);
    }

    // Fire pending shot when ball has touched down (bouncing or stopped) and timer expired.
    // Only clear _pendingAction on a successful swing so that a miss due to distance
    // doesn't discard the action — AI will keep trying each frame until it connects.
    if (this._pendingAction && this._reactionTimer <= 0 && (ball.isBouncing || !ball.inFlight)) {
      const dist = Math.hypot(this.player.x - ball.x, this.player.y - ball.y);
      if (dist < 50) {
        const action = this._pendingAction;
        this._pendingAction = null;
        this._targetError = { x: 0, y: 0 };
        // Difficulty-scaled miss chance: AI fumbles and doesn't swing
        const missP = MISS_CHANCE[this.difficulty] ?? 0.14;
        if (Math.random() >= missP) {
          this.player.swing(action.shotType, action.aimDir, this._qualityForDifficulty());
        }
      }
    }
  }

  _moveTo(tx, ty, dt) {
    const dx = tx - this.player.x;
    const dy = ty - this.player.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return;
    const spd = this.player.movementSpeed;
    const step = Math.min(dist, spd * dt);
    this.player.x += (dx / dist) * step;
    this.player.y += (dy / dist) * step;
    if (Math.abs(dx) > 1) {
      this.player._facingX = dx > 0 ? 1 : -1;
      this.player._movingH = true;
    } else {
      this.player._movingH = false;
    }
  }

  _qualityForDifficulty() {
    const mult = DIFFICULTY_MULT[this.difficulty] || 1.5;
    // Expert = near-perfect quality; Easy = often bad timing
    return Math.max(0.4, Math.min(1.0, 1.0 - (mult - 0.4) * 0.15));
  }
}
