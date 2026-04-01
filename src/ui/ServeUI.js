// ServeUI — target box highlight and power meter during serve.
import { project } from '../core/Court.js';

// Optimal power zone: 60 % – 85 %
const GOOD_LO = 0.60;
const GOOD_HI = 0.85;

export default class ServeUI {
  constructor() {
    this.state      = 'hidden'; // 'hidden' | 'aim' | 'power'
    this.targetBox  = { x: 0, y: 0, w: 0, h: 0 };
    this.aimPos     = { x: 160, y: 60 };
    this.power      = 0;
  }

  draw(ctx, time) {
    if (this.state === 'hidden') return;

    // Just highlight the target zone — no aim cursor
    this._drawTargetBox(ctx);

    if (this.state === 'power') {
      this._drawPowerMeter(ctx, time);
    }

    // Hint text
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '6px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(this.state === 'aim' ? 'SPACE: serve' : 'SPACE: release', 160, 228);
    ctx.restore();
  }

  _drawTargetBox(ctx) {
    const r  = this.targetBox;
    const tl = project(r.x,       r.y);
    const tr = project(r.x + r.w, r.y);
    const br = project(r.x + r.w, r.y + r.h);
    const bl = project(r.x,       r.y + r.h);

    ctx.beginPath();
    ctx.moveTo(tl.sx, tl.sy);
    ctx.lineTo(tr.sx, tr.sy);
    ctx.lineTo(br.sx, br.sy);
    ctx.lineTo(bl.sx, bl.sy);
    ctx.closePath();

    ctx.fillStyle = 'rgba(255,255,0,0.14)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,0,0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  _drawPowerMeter(ctx, time) {
    const pwr = (Math.sin(time * Math.PI * 0.844) + 1) / 2;
    this.power = pwr;

    const MX = 6, MY = 30, MW = 6, MH = 180;

    // Background track
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(MX, MY, MW, MH);

    // Good-zone band (drawn behind the fill bar so it shows through at low power)
    const goodY  = MY + MH - GOOD_HI * MH;
    const goodH  = (GOOD_HI - GOOD_LO) * MH;
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(MX, goodY, MW, goodH);

    // Fill bar (grows upward)
    const fillH = pwr * MH;
    const fillY = MY + MH - fillH;
    let r, g;
    if (pwr < 0.5) { r = Math.floor(pwr * 2 * 200); g = 207; }
    else           { r = 200; g = Math.floor((1 - (pwr - 0.5) * 2) * 207); }
    ctx.fillStyle = `rgb(${r},${g},50)`;
    ctx.fillRect(MX, fillY, MW, fillH);

    // Border
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1;
    ctx.strokeRect(MX, MY, MW, MH);

    // Optimal-zone bracket markers on the right side of the bar
    const bracketX = MX + MW + 2;
    const loY = MY + MH - GOOD_LO * MH;  // bottom of good zone
    const hiY = MY + MH - GOOD_HI * MH;  // top of good zone
    ctx.strokeStyle = '#ffd60a';
    ctx.lineWidth = 1;
    // Top bracket tick
    ctx.beginPath();
    ctx.moveTo(bracketX,     hiY);
    ctx.lineTo(bracketX + 3, hiY);
    ctx.stroke();
    // Bottom bracket tick
    ctx.beginPath();
    ctx.moveTo(bracketX,     loY);
    ctx.lineTo(bracketX + 3, loY);
    ctx.stroke();
    // Vertical connecting line
    ctx.beginPath();
    ctx.moveTo(bracketX + 3, hiY);
    ctx.lineTo(bracketX + 3, loY);
    ctx.stroke();

    // "GOOD" label beside bracket midpoint
    const midBracketY = (hiY + loY) / 2 + 2;
    ctx.fillStyle = '#ffd60a';
    ctx.font = '5px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('OK', bracketX + 5, midBracketY);

    // PWR label above
    ctx.fillStyle = '#ffffff';
    ctx.font = '6px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PWR', MX + MW / 2, MY - 2);
  }
}
