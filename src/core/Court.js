// Court — zone constants, query helpers, and 3/4-perspective drawing.

export const COURT_LEFT   = 20;
export const COURT_RIGHT  = 300;
export const COURT_TOP    = 30;
export const COURT_BOTTOM = 210;
export const COURT_W      = COURT_RIGHT - COURT_LEFT;  // 280
export const COURT_H      = COURT_BOTTOM - COURT_TOP;  // 180
export const CENTER_X     = (COURT_LEFT + COURT_RIGHT) / 2;  // 160
export const NET_Y        = (COURT_TOP + COURT_BOTTOM) / 2;  // 120

// Kitchen (non-volley zone) spans 40px either side of the net
export const KITCHEN_DEPTH  = 40;
export const KITCHEN_TOP    = NET_Y - KITCHEN_DEPTH;   // 80
export const KITCHEN_BOTTOM = NET_Y + KITCHEN_DEPTH;   // 160

// ---------------------------------------------------------------------------
// Perspective projection — maps world (x, y) to screen (sx, sy) with depth.
// The far end (y = COURT_TOP) is compressed toward CENTER_X; near end is full.
// ---------------------------------------------------------------------------
const SCREEN_TOP    = 58;    // screen Y of the far court edge
const SCREEN_BOTTOM = 218;   // screen Y of the near court edge
const FAR_SCALE     = 0.52;  // size/width multiplier at the far end

// Power > 1 compresses the far half more — t=0.5 (net) maps to ~0.4 screen,
// giving the player 60% of visible court depth and the opponent 40%.
const PERSP_POWER = 1.32;

export function project(worldX, worldY) {
  const t    = (worldY - COURT_TOP) / (COURT_BOTTOM - COURT_TOP); // 0=far, 1=near
  const tScr = Math.pow(t, PERSP_POWER);                           // non-linear screen t
  const scale = FAR_SCALE + tScr * (1 - FAR_SCALE);
  return {
    sx:    CENTER_X + (worldX - CENTER_X) * scale,
    sy:    SCREEN_TOP + tScr * (SCREEN_BOTTOM - SCREEN_TOP),
    scale,
  };
}

export function depthScale(worldY) {
  const t    = (worldY - COURT_TOP) / (COURT_BOTTOM - COURT_TOP);
  const tScr = Math.pow(t, PERSP_POWER);
  return FAR_SCALE + tScr * (1 - FAR_SCALE);
}

// --- Zone queries (operate on world coordinates — projection is purely visual) ---

export function isInKitchen(x, y) {
  return x >= COURT_LEFT && x <= COURT_RIGHT &&
         y >= KITCHEN_TOP && y <= KITCHEN_BOTTOM;
}

export function isOutOfBounds(x, y) {
  return x < COURT_LEFT || x > COURT_RIGHT ||
         y < COURT_TOP  || y > COURT_BOTTOM;
}

// side: 'top' (opponent) or 'bottom' (player)
export function getServiceBox(side, serverX) {
  const midX   = CENTER_X;
  const isLeft = serverX < midX;

  if (side === 'top') {
    return isLeft
      ? { x: midX,       y: COURT_TOP,    w: midX - COURT_LEFT, h: NET_Y - COURT_TOP - KITCHEN_DEPTH }
      : { x: COURT_LEFT, y: COURT_TOP,    w: midX - COURT_LEFT, h: NET_Y - COURT_TOP - KITCHEN_DEPTH };
  } else {
    return isLeft
      ? { x: midX,       y: NET_Y + KITCHEN_DEPTH, w: midX - COURT_LEFT, h: COURT_BOTTOM - NET_Y - KITCHEN_DEPTH }
      : { x: COURT_LEFT, y: NET_Y + KITCHEN_DEPTH, w: midX - COURT_LEFT, h: COURT_BOTTOM - NET_Y - KITCHEN_DEPTH };
  }
}

// ---------------------------------------------------------------------------
// Drawing — 3/4 perspective trapezoid court
// ---------------------------------------------------------------------------

function _fillTrap(ctx, leftX, rightX, topY, bottomY) {
  const tl = project(leftX,  topY);
  const tr = project(rightX, topY);
  const br = project(rightX, bottomY);
  const bl = project(leftX,  bottomY);
  ctx.beginPath();
  ctx.moveTo(tl.sx, tl.sy);
  ctx.lineTo(tr.sx, tr.sy);
  ctx.lineTo(br.sx, br.sy);
  ctx.lineTo(bl.sx, bl.sy);
  ctx.closePath();
  ctx.fill();
}

export function drawCourt(ctx) {
  const farLeft   = project(COURT_LEFT,  COURT_TOP);
  const farRight  = project(COURT_RIGHT, COURT_TOP);
  const nearLeft  = project(COURT_LEFT,  COURT_BOTTOM);
  const nearRight = project(COURT_RIGHT, COURT_BOTTOM);

  // --- 1. Court surface gradient fill ---
  const surfGrad = ctx.createLinearGradient(0, farLeft.sy, 0, nearLeft.sy);
  surfGrad.addColorStop(0,   '#022d59');  // slightly darker at far end
  surfGrad.addColorStop(0.5, '#03386a');
  surfGrad.addColorStop(1,   '#044280');  // slightly richer near end
  ctx.fillStyle = surfGrad;
  ctx.beginPath();
  ctx.moveTo(farLeft.sx,  farLeft.sy);
  ctx.lineTo(farRight.sx, farRight.sy);
  ctx.lineTo(nearRight.sx,nearRight.sy);
  ctx.lineTo(nearLeft.sx, nearLeft.sy);
  ctx.closePath();
  ctx.fill();

  // Subtle depth stripes
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let wy = COURT_TOP + 20; wy < COURT_BOTTOM; wy += 20) {
    const L = project(COURT_LEFT,  wy);
    const R = project(COURT_RIGHT, wy);
    ctx.beginPath();
    ctx.moveTo(L.sx, L.sy);
    ctx.lineTo(R.sx, R.sy);
    ctx.stroke();
  }

  // --- 2. Kitchen zones — solid #833036 fill ---
  ctx.fillStyle = '#833036';
  _fillTrap(ctx, COURT_LEFT, COURT_RIGHT, KITCHEN_TOP,   NET_Y);          // top kitchen
  _fillTrap(ctx, COURT_LEFT, COURT_RIGHT, NET_Y,         KITCHEN_BOTTOM); // bottom kitchen

  // --- 3. Court boundary + markings ---
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(farLeft.sx,  farLeft.sy);
  ctx.lineTo(farRight.sx, farRight.sy);
  ctx.lineTo(nearRight.sx,nearRight.sy);
  ctx.lineTo(nearLeft.sx, nearLeft.sy);
  ctx.closePath();
  ctx.stroke();

  // Sidelines thicker
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(farLeft.sx,  farLeft.sy);  ctx.lineTo(nearLeft.sx,  nearLeft.sy);
  ctx.moveTo(farRight.sx, farRight.sy); ctx.lineTo(nearRight.sx, nearRight.sy);
  ctx.stroke();

  // Kitchen boundary lines
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  const ktL = project(COURT_LEFT,  KITCHEN_TOP);
  const ktR = project(COURT_RIGHT, KITCHEN_TOP);
  const kbL = project(COURT_LEFT,  KITCHEN_BOTTOM);
  const kbR = project(COURT_RIGHT, KITCHEN_BOTTOM);
  ctx.beginPath();
  ctx.moveTo(ktL.sx, ktL.sy); ctx.lineTo(ktR.sx, ktR.sy);
  ctx.moveTo(kbL.sx, kbL.sy); ctx.lineTo(kbR.sx, kbR.sy);
  ctx.stroke();

  // Centre service line (skips kitchen)
  const cTop  = project(CENTER_X, COURT_TOP);
  const cKtop = project(CENTER_X, KITCHEN_TOP);
  const cKbot = project(CENTER_X, KITCHEN_BOTTOM);
  const cBot  = project(CENTER_X, COURT_BOTTOM);
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cTop.sx,  cTop.sy);  ctx.lineTo(cKtop.sx, cKtop.sy);
  ctx.moveTo(cKbot.sx, cKbot.sy); ctx.lineTo(cBot.sx,  cBot.sy);
  ctx.stroke();

  // --- 4. Net — 3-D band ---
  const netL  = project(COURT_LEFT,  NET_Y);
  const netR  = project(COURT_RIGHT, NET_Y);
  const netH  = 10 * depthScale(NET_Y);
  const netTop= netL.sy - netH;

  // Shadow below net
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(netL.sx, netL.sy, netR.sx - netL.sx, 2);

  // Net body
  const netGrad = ctx.createLinearGradient(0, netTop, 0, netL.sy);
  netGrad.addColorStop(0,    '#e8e8e8');
  netGrad.addColorStop(0.12, '#ffffff');
  netGrad.addColorStop(1,    '#aaaaaa');
  ctx.fillStyle = netGrad;
  ctx.fillRect(netL.sx, netTop, netR.sx - netL.sx, netH);

  // Mesh verticals
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 0.5;
  const meshStep = (netR.sx - netL.sx) / 14;
  for (let i = 1; i < 14; i++) {
    const nx = netL.sx + i * meshStep;
    ctx.beginPath();
    ctx.moveTo(nx, netTop);
    ctx.lineTo(nx, netL.sy);
    ctx.stroke();
  }

  // Top highlight tape
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(netL.sx, netTop);
  ctx.lineTo(netR.sx, netTop);
  ctx.stroke();

  // Posts
  const postW = 3;
  const postH = netH + 4;
  ctx.fillStyle = '#cccccc';
  ctx.fillRect(netL.sx - postW, netTop - 2, postW, postH + 2);
  ctx.fillRect(netR.sx,         netTop - 2, postW, postH + 2);
  ctx.strokeStyle = '#888888';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(netL.sx - postW, netTop - 2, postW, postH + 2);
  ctx.strokeRect(netR.sx,         netTop - 2, postW, postH + 2);
}
