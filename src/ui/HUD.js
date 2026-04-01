// HUD — in-match score display, server indicator, fault callout banner.

export default class HUD {
  constructor() {
    this._faultText  = '';
    this._faultTimer = 0;
    this._faultScale = 0;
  }

  showFault(text) {
    this._faultText  = text;
    this._faultTimer = 1.5;
    this._faultScale = 0.5;
  }

  update(dt) {
    if (this._faultTimer > 0) {
      this._faultTimer -= dt;
      this._faultScale = Math.min(1.0, this._faultScale + dt * 6);
    }
  }

  // Layout (320px wide, bar height 16px):
  //
  //  [▶] P1NAME  ●●●   5 - 3   ●●●  P2NAME [▶]
  //   3   10      68   160     244   270     314
  //
  // ▶ only shown beside the currently serving player.

  draw(ctx, score, games, servingSide, rallyCount, p1Name, p2Name) {
    ctx.save();

    // Score bar background — full width
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, 320, 16);

    // Truncate names to 7 chars so they fit
    const name1 = (p1Name || 'PLAYER').substring(0, 7).toUpperCase();
    const name2 = (p2Name || 'CPU').substring(0, 7).toUpperCase();

    // --- Serve indicator: bright yellow ball beside the serving player ---
    ctx.fillStyle = '#ffd60a';
    ctx.strokeStyle = '#cc9900';
    ctx.lineWidth = 1;
    if (servingSide === 'bottom') {
      ctx.beginPath();
      ctx.arc(5, 8, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    if (servingSide === 'top') {
      ctx.beginPath();
      ctx.arc(315, 8, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // --- P1 name (human / bottom) ---
    ctx.fillStyle = '#ffffff';
    ctx.font = '6px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(name1, 12, 11);

    // --- P1 game pips (bottom player) ---
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = games.bottom > i ? '#ffd60a' : '#555555';
      ctx.beginPath();
      ctx.arc(68 + i * 8, 8, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- Centre score ---
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    // Show human score first (bottom), then AI (top)
    ctx.fillText(`${score.bottom} - ${score.top}`, 160, 11);

    // --- P2 game pips (top / AI player) ---
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = games.top > i ? '#ffd60a' : '#555555';
      ctx.beginPath();
      ctx.arc(244 + i * 8, 8, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- P2 name (AI / top) ---
    ctx.fillStyle = '#ffffff';
    ctx.font = '6px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(name2, 308, 11);

    // --- Rally counter (small, below bar right) ---
    if (rallyCount > 0) {
      ctx.fillStyle = '#888888';
      ctx.font = '5px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`rally:${rallyCount}`, 318, 24);
    }

    // --- Fault callout ---
    if (this._faultTimer > 0) {
      const alpha = Math.min(1, this._faultTimer / 0.4);
      ctx.globalAlpha = alpha;
      ctx.save();
      ctx.translate(160, 120);
      ctx.scale(this._faultScale, this._faultScale);
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(-70, -14, 140, 22);
      ctx.strokeStyle = '#ffd60a';
      ctx.lineWidth = 1;
      ctx.strokeRect(-70, -14, 140, 22);
      ctx.fillStyle = '#ffd60a';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(this._faultText, 0, 4);
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }
}
