// Ball — arc trajectory, natural auto-bounce, shadow rendering.
import { project } from './Court.js';

export default class Ball {
  constructor() {
    this.x = 160;
    this.y = 120;
    this.inFlight  = false;
    this.bounced   = false;
    this.visible   = true;

    // Signals read & cleared by MatchManager each frame
    this.justLanded  = false;  // true for exactly one frame on first court contact
    this.isBouncing  = false;  // true while executing the auto-bounce arc

    // Trajectory
    this._startX = 0; this._startY = 0;
    this._endX   = 0; this._endY   = 0;
    this._peakH  = 0;
    this._speed  = 0;
    this._t      = 0;
    this._dur    = 0;
    this._elapsed = 0;
    this._isSecondArc = false; // true during the auto-bounce arc

    this.shadowFadeAtApex = false;
    this.windX = 0;
  }

  launch(sx, sy, ex, ey, peakH, speed) {
    this._startX = sx; this._startY = sy;
    this._endX   = ex; this._endY   = ey;
    this._peakH  = peakH;
    this._speed  = speed;
    const dist   = Math.hypot(ex - sx, ey - sy);
    this._dur    = dist / Math.max(speed, 1);
    this._t      = 0;
    this._elapsed = 0;
    this.inFlight     = true;
    this.bounced      = false;
    this.justLanded   = false;
    this.isBouncing   = false;
    this._isSecondArc = false;
    this.x = sx;
    this.y = sy;
  }

  update(dt) {
    if (!this.inFlight) return;

    this._elapsed += dt;
    this._t = Math.min(this._elapsed / Math.max(this._dur, 0.001), 1.0);

    this.x = this._startX + (this._endX - this._startX) * this._t;
    const groundY = this._startY + (this._endY - this._startY) * this._t;
    this._heightOffset = this._peakH * 4 * this._t * (1 - this._t);
    this.y = groundY - this._heightOffset;

    if (this._t >= 1.0) {
      this.x = this._endX;
      this.y = this._endY;
      this._heightOffset = 0;

      if (!this._isSecondArc) {
        // First landing: signal MatchManager, then immediately continue
        // with a reduced-energy bounce arc in the same direction.
        this.justLanded   = true;
        this.isBouncing   = true;
        this._isSecondArc = true;

        const dx = this._endX - this._startX;
        const dy = this._endY - this._startY;
        const dist = Math.hypot(dx, dy);

        if (dist > 0.5) {
          // Bounce travels ~35% of original distance at ~55% speed, 30% height
          const scale      = 0.35;
          const bounceEndX = this._endX + dx * scale;
          const bounceEndY = this._endY + dy * scale;
          const bounceH    = Math.max(5, this._peakH * 0.3);
          const bounceSpd  = this._speed * 0.55;
          const bounceDist = Math.hypot(bounceEndX - this._endX, bounceEndY - this._endY);

          this._startX  = this._endX;
          this._startY  = this._endY;
          this._endX    = bounceEndX;
          this._endY    = bounceEndY;
          this._peakH   = bounceH;
          this._speed   = bounceSpd;
          this._dur     = bounceDist / Math.max(bounceSpd, 1);
          this._t       = 0;
          this._elapsed = 0;
        } else {
          // Negligible distance — just stop
          this.inFlight   = false;
          this.isBouncing = false;
        }
      } else {
        // Second landing: ball comes to rest
        this.inFlight   = false;
        this.isBouncing = false;
      }
    }
  }

  get landY() { return this._endY; }
  get heightOffset() { return this._heightOffset || 0; }

  draw(ctx) {
    if (!this.visible) return;

    const groundX = this._startX + (this._endX - this._startX) * this._t;
    const groundY = this._startY + (this._endY - this._startY) * this._t;
    const h = this._heightOffset || 0;

    // Project shadow to screen space
    const { sx: gx, sy: gy, scale: gScale } = project(groundX, groundY);

    // Shadow — shrinks as ball rises and when at apex
    let shadowAlpha = 0.35;
    if (this.shadowFadeAtApex && this._peakH > 0) {
      shadowAlpha *= Math.max(0, 1 - h / this._peakH);
    }
    ctx.save();
    ctx.globalAlpha = shadowAlpha;
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(gx, gy, 4 * gScale, 2 * gScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Project ball visual position — height offset is scaled by depth
    const { sx: bx, sy: byGround, scale: bScale } = project(this.x, groundY);
    const by = byGround - h * bScale;
    const r  = 4 * bScale;

    // Ball with depth shading
    ctx.fillStyle = '#ffff88';
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ccaa00';
    ctx.lineWidth = Math.max(0.5, bScale);
    ctx.stroke();

    // Specular highlight
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(bx - r * 0.3, by - r * 0.3, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}
