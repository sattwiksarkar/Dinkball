// MatchManager — score state, serve rotation, game/match progression, input dispatch.
import Ball from './Ball.js';
import Player, { Side } from './Player.js';
import { drawCourt, COURT_LEFT, COURT_RIGHT, COURT_TOP, COURT_BOTTOM,
         NET_Y, CENTER_X, getServiceBox, isInKitchen } from './Court.js';
import { ShotType, PARAMS } from './ShotData.js';
import RulesEngine, { Fault, BounceState } from './RulesEngine.js';
import HUD from '../ui/HUD.js';
import ServeUI from '../ui/ServeUI.js';
import VenueBackdrop from '../ui/VenueBackdrop.js';
import CharacterData from '../data/CharacterData.js';
import VenueData from '../data/VenueData.js';
import GameState from '../data/GameState.js';
import AudioManager from '../data/AudioManager.js';
import SaveManager from '../data/SaveManager.js';
import { calculate as calcStars } from './StarRating.js';

// Archetype map
import Pusher     from '../ai/archetypes/Pusher.js';
import Basher     from '../ai/archetypes/Basher.js';
import DinkMaster from '../ai/archetypes/DinkMaster.js';
import Lobber     from '../ai/archetypes/Lobber.js';
import AllRounder from '../ai/archetypes/AllRounder.js';

const ARCHETYPE_MAP = { Pusher, Basher, DinkMaster, Lobber, AllRounder };


export default class MatchManager {
  constructor(onMatchEnd, onQuit) {
    this.onMatchEnd = onMatchEnd; // fn(result) called when match finishes
    this.onQuit     = onQuit;     // fn() called when player quits to main menu

    this.ball    = new Ball();
    this.player1 = new Player(Side.BOTTOM, '#4488ff'); // human
    this.player2 = new Player(Side.TOP,    '#ff4444'); // AI

    this.rules   = new RulesEngine();
    this.hud     = new HUD();
    this.serveUI = new ServeUI();
    this.backdrop = new VenueBackdrop();

    this._ai = null;

    // Score state
    this.score   = { top: 0, bottom: 0 };
    this.games   = { top: 0, bottom: 0 };
    this.servingSide = 'bottom';
    this._servePhase = 'aim';  // 'aim' | 'power' | 'none'
    this._aimPos = { x: 0, y: 0 };
    this._aimBox = { x: 0, y: 0, w: 0, h: 0 };

    // Rally stats
    this._rallyCount   = 0;
    this._maxRally     = 0;
    this._totalFaults  = 0;
    this._kitchenPlays = 0;
    this._matchStart   = 0;

    // Environmental state
    this._windX           = 0;
    this._sunGlare        = false;
    this._sunGlareUsed    = false;
    this._shadowFade      = false;
    this._crowdRally      = false;

    // Freeze state (after fault / point)
    this._freezeTimer  = 0;
    this._pendingPoint = null; // 'top' | 'bottom' | 'sideout'

    // Miss detection — ball not returned after landing
    this._missTimer    = 0;
    this._landedSide   = null; // 'top' | 'bottom'

    this._time = 0;
    this._aiServeTimer = 0;

    this._paused       = false;
    this._showControls = false;
  }

  async init() {
    // Apply character stats
    const pChar = CharacterData.getById(GameState.playerId);
    const oChar = CharacterData.getById(GameState.opponentId);
    if (pChar) this.player1.setStats(pChar.stats || {});
    if (oChar) this.player2.setStats(oChar.stats || {});
    this._player1Name = pChar?.name || 'Player';
    this._player2Name = oChar?.name || 'CPU';

    // Both players move at the same speed — character stats affect other things
    // (power, consistency, serve) but movement speed must feel equal for fair play.
    const sharedSpeed = Math.max(this.player1.movementSpeed, this.player2.movementSpeed);
    this.player1.movementSpeed = sharedSpeed;
    this.player2.movementSpeed = sharedSpeed;

    // Create AI
    const archetype = oChar?.archetype || 'AllRounder';
    const AiClass   = ARCHETYPE_MAP[archetype] || AllRounder;
    this._ai = new AiClass(this.player2, GameState.aiDifficulty);

    // Environmental effects
    const venue = VenueData.getById(GameState.venueId);
    const effect = venue?.env_effect || '';
    if (effect === 'wind')         this._windX = (Math.random() - 0.5) * 40;
    if (effect === 'sun_glare')    this._sunGlare = true;
    if (effect === 'shadow_fade')  { this._shadowFade = true; this.ball.shadowFadeAtApex = true; }
    if (effect === 'crowd_volume') this._crowdRally = true;

    // Shot input handlers
    this.player1.onSwing = (type, dir, quality) => this._handleSwing(Side.BOTTOM, type, dir, quality);
    this.player2.onSwing = (type, dir, quality) => this._handleSwing(Side.TOP, type, dir, quality);

    this._matchStart = performance.now() / 1000;
    this._startServe();
    AudioManager.playMusic(GameState.venueId);
  }

  _startServe() {
    this._missTimer  = 0;
    this._landedSide = null;
    this._aiServeTimer = 0;
    this.rules.reset();

    // Official rule: even score → serve from right court, odd → left court.
    // Bottom player's "right" is visual right (higher x).
    // Top player's "right" is visual left (lower x) because they face the opposite direction.
    const serverScore = this.servingSide === 'bottom' ? this.score.bottom : this.score.top;
    const serveRight  = (serverScore % 2 === 0);
    let serverStartX;
    if (this.servingSide === 'bottom') {
      serverStartX = serveRight ? CENTER_X + 20 : CENTER_X - 20;
    } else {
      serverStartX = serveRight ? CENTER_X - 20 : CENTER_X + 20; // mirrored for top player
    }

    const box = getServiceBox(
      this.servingSide === 'bottom' ? 'top' : 'bottom',
      serverStartX
    );
    this._aimBox = box;
    this._aimPos = { x: box.x + box.w / 2, y: box.y + box.h / 2 };
    this.serveUI.targetBox = this._aimBox;
    this.serveUI.aimPos    = this._aimPos;
    this.serveUI.state     = 'aim';
    this._servePhase = 'aim';

    // Receiver is placed at the center of the diagonal service box they need to cover
    const receiverX = box.x + box.w / 2;

    if (this.servingSide === 'bottom') {
      // Human serves from bottom baseline; AI receives diagonally in top half
      this.player1.x = serverStartX; this.player1.y = COURT_BOTTOM - 10;
      this.player2.x = receiverX;    this.player2.y = COURT_TOP + 20;
    } else {
      // AI serves from top baseline; human receives diagonally in bottom half
      this.player2.x = serverStartX; this.player2.y = COURT_TOP + 2;
      this.player1.x = receiverX;    this.player1.y = COURT_BOTTOM - 20;
    }

    // Human can always move freely; AI is locked unless it's serving
    this.player1.movementLocked = false;
    this.player2.movementLocked = this.servingSide !== 'top';
    this.ball.inFlight = false;
    this.ball.x = this.servingSide === 'bottom' ? this.player1.x : this.player2.x;
    this.ball.y = this.servingSide === 'bottom' ? this.player1.y : this.player2.y;
  }

  update(dt, keysDown, keysJustPressed) {
    // Pause toggle — Escape or P
    if (keysJustPressed.has('Escape') || keysJustPressed.has('KeyP')) {
      this._paused = !this._paused;
      if (!this._paused) this._showControls = false;
      return;
    }
    if (this._paused) {
      if (keysJustPressed.has('KeyC')) this._showControls = !this._showControls;
      if (!this._showControls) {
        if (keysJustPressed.has('KeyM')) AudioManager.toggleMute();
        if (keysJustPressed.has('KeyQ')) {
          AudioManager.stopMusic();
          AudioManager.playMenuMusic();
          if (this.onQuit) this.onQuit();
        }
      }
      return;
    }

    this._time += dt;

    // Ball always updates (even during freeze for visual continuity)
    if (this.ball.inFlight) {
      this.ball.update(dt);
    }
    // justLanded is set for exactly one frame on first court contact
    if (this.ball.justLanded) {
      this.ball.justLanded = false;
      this._onBallLanded();
    }

    // During freeze: only tick the timer, nothing else
    if (this._freezeTimer > 0) {
      this._freezeTimer -= dt;
      this.hud.update(dt);
      if (this._freezeTimer <= 0) this._resolvePendingPoint();
      return;
    }

    // Miss detection: ticks from first landing regardless of bounce state
    if (this._missTimer > 0) {
      this._missTimer -= dt;
      if (this._missTimer <= 0) { this._handleMiss(); return; }
    }

    // Serve input (human server)
    if (this._servePhase !== 'none' && this.servingSide === 'bottom') {
      this._handleServeInput(dt, keysDown, keysJustPressed);
    } else if (this._servePhase !== 'none' && this.servingSide === 'top') {
      // AI serves automatically after short delay
      this._aiServe(dt);
    }

    // Player movement and shot input
    this.player1.update(dt, keysDown);
    // Tick player2 timers (swing cooldown, anim) — AI movement is handled by AIController,
    // but Player.update() must run so _swingCooldown actually decrements.
    this.player2.update(dt, new Set());

    // Ball sticks to server during serve phases
    if (this._servePhase === 'aim' || this._servePhase === 'power') {
      const server = this.servingSide === 'bottom' ? this.player1 : this.player2;
      this.ball.x = server.x;
      this.ball.y = server.y;
    }

    // Allow shot input: ball has touched court at least once (bounced or isBouncing)
    // and is on the player's side.
    if (this._servePhase === 'none' && (this.ball.isBouncing || !this.ball.inFlight)) {
      this._checkShotInput(keysJustPressed, keysDown);
    }

    // AI update — skip during serve phase so AI stays at its starting position
    if (this._ai && this._servePhase === 'none') this._ai.update(dt, this.ball, [this.player1]);

    // Sun glare
    if (this._sunGlare && !this._sunGlareUsed && this._rallyCount > 3 && Math.random() < 0.001) {
      this._triggerSunGlare();
    }

    // Crowd intensity
    if (this._crowdRally) {
      AudioManager.setCrowdIntensity(this._rallyCount / 20);
    }

    this.hud.update(dt);

    // Rally counter
    this.serveUI.aimPos = this._aimPos;
    this.serveUI.targetBox = this._aimBox;
  }

  _aiServe(dt) {
    this._aiServeTimer = (this._aiServeTimer || 0) + dt;
    if (this._aiServeTimer > 3.0) {
      this._aiServeTimer = 0;
      this._fireServe(false, 0.7);
    }
  }

  _handleServeInput(dt, keysDown, keysJustPressed) {
    if (this._servePhase === 'aim') {
      const spd = 60;
      if (keysDown.has('ArrowLeft'))  this._aimPos.x = Math.max(this._aimBox.x + 2,             this._aimPos.x - spd * dt);
      if (keysDown.has('ArrowRight')) this._aimPos.x = Math.min(this._aimBox.x + this._aimBox.w - 2, this._aimPos.x + spd * dt);
      if (keysDown.has('ArrowUp'))    this._aimPos.y = Math.max(this._aimBox.y + 2,             this._aimPos.y - spd * dt);
      if (keysDown.has('ArrowDown'))  this._aimPos.y = Math.min(this._aimBox.y + this._aimBox.h - 2, this._aimPos.y + spd * dt);

      if (keysJustPressed.has('Space')) {
        this._servePhase = 'power';
        this.serveUI.state = 'power';
      }
    } else if (this._servePhase === 'power') {
      if (keysJustPressed.has('Space')) {
        this._fireServe(true, this.serveUI.power);
      }
    }
  }

  _fireServe(isHuman, power) {
    const server = this.servingSide === 'bottom' ? this.player1 : this.player2;

    // Foot fault check
    if (isHuman) {
      const ff = this.rules.checkFootFault(server);
      if (ff !== Fault.NONE) {
        this._registerFault(ff, 'sideout');
        return;
      }
    }

    const speed = PARAMS[ShotType.DRIVE].speed * (0.6 + power * 0.4);
    const peakH = 20;

    // Slight random aim deviation based on power
    const aimX = this._aimPos.x + (Math.random() - 0.5) * (1 - power) * 20;
    const aimY = this._aimPos.y;

    // Service box validation
    const ff2 = this.rules.checkServiceBox(aimX, aimY, this.servingSide, server.x);
    if (ff2 !== Fault.NONE) {
      this._registerFault(ff2, 'sideout');
      return;
    }

    this.ball.windX = this._windX;
    this.ball.launch(server.x, server.y, aimX, aimY, peakH, speed);
    this.serveUI.state = 'hidden';
    this._servePhase   = 'none';
    this.player1.movementLocked = false;
    this.player2.movementLocked = false;
    AudioManager.playShotSfx(ShotType.DRIVE);
  }

  _checkShotInput(keysJustPressed, keysDown) {
    // Ball must be on player's side
    if (this.ball.y < NET_Y) return;

    // Distance gate: player must be within reach of the ball.
    // Use landing position when bouncing (ball._startX/Y) for a stable target.
    const ballCheckX = this.ball.isBouncing ? this.ball._startX : this.ball.x;
    const ballCheckY = this.ball.isBouncing ? this.ball._startY : this.ball.y;
    const distToBall = Math.hypot(this.player1.x - ballCheckX, this.player1.y - ballCheckY);
    if (distToBall > 50) return;

    let shotType = null;
    if (keysJustPressed.has('KeyJ')) shotType = ShotType.DRIVE;
    if (keysJustPressed.has('KeyK')) shotType = ShotType.DINK;
    if (keysJustPressed.has('KeyI')) shotType = ShotType.LOB;
    if (keysJustPressed.has('KeyU')) shotType = ShotType.SMASH;
    if (keysJustPressed.has('KeyL')) shotType = ShotType.DROP_SHOT;

    if (shotType === null) return;

    // Kitchen volley check
    if (!this.ball.bounced && this.rules.bounceState === BounceState.RALLY) {
      const kf = this.rules.checkKitchenVolley(this.player1);
      if (kf !== Fault.NONE) { this._registerFault(kf, 'sideout'); return; }
    }

    // Shot direction driven by the player's movement at the moment of the hit.
    // Holding left → ball goes to the left side of opponent's court.
    // Holding right → ball goes to the right side.
    // No horizontal key → ball aimed at the centre area.
    const movingLeft  = keysDown.has('ArrowLeft')  || keysDown.has('KeyA');
    const movingRight = keysDown.has('ArrowRight') || keysDown.has('KeyD');

    let targetX;
    if (movingLeft) {
      // Aim left half of opponent's court
      targetX = COURT_LEFT + 20 + Math.random() * (CENTER_X - COURT_LEFT - 40);
    } else if (movingRight) {
      // Aim right half
      targetX = CENTER_X + 20 + Math.random() * (COURT_RIGHT - CENTER_X - 40);
    } else {
      // Centre area with moderate spread
      targetX = CENTER_X + (Math.random() - 0.5) * 80;
    }

    const aimDir = {
      x: targetX - this.player1.x,
      y: COURT_TOP + 30 - this.player1.y,  // consistent depth in opponent's court
    };

    this.player1.swing(shotType, aimDir, 1.0);
  }

  _handleSwing(side, shotType, aimDir, quality) {
    if (this._pendingPoint !== null) return; // point already resolving
    const p    = side === Side.BOTTOM ? this.player1 : this.player2;
    const par  = PARAMS[shotType];

    const spread = quality >= 0.9 ? par.spreadOptimal : par.spreadLate;
    const tx = Math.max(COURT_LEFT + 4, Math.min(COURT_RIGHT - 4,
      p.x + aimDir.x + (Math.random() - 0.5) * spread));
    const ty = side === Side.BOTTOM
      ? Math.max(COURT_TOP + 4, Math.min(NET_Y - 2, p.y + aimDir.y + (Math.random() - 0.5) * spread))
      : Math.max(NET_Y + 2, Math.min(COURT_BOTTOM - 4, p.y - aimDir.y + (Math.random() - 0.5) * spread));

    // Wind for lobs
    const windDrift = (shotType === ShotType.LOB) ? this._windX : 0;

    this._missTimer  = 0;
    this._landedSide = null;
    this.ball.launch(p.x, p.y, tx + windDrift, ty, par.peakHeight, par.speed);
    this._rallyCount++;
    if (this._rallyCount > this._maxRally) this._maxRally = this._rallyCount;
    if (isInKitchen(p.x, p.y)) this._kitchenPlays++;

    AudioManager.playHitSfx(side);
  }

  _onBallLanded() {
    // Guard: a point is already resolving (e.g. ball bouncing out after a miss)
    if (this._pendingPoint !== null) return;

    AudioManager.playSfx('bounce');
    this.ball.bounced = true;

    // After justLanded fires, Ball has already re-initialised _endX/_endY to the
    // bounce-arc destination.  The actual landing spot is now stored in _startX/_startY.
    const lx = this.ball._startX;
    const ly = this.ball._startY;

    const fault = this.rules.checkLanding(lx, ly, null, this.servingSide);
    if (fault !== Fault.NONE) {
      this._registerFault(fault, ly < NET_Y ? 'bottom' : 'top');
      return;
    }

    // Ball landed in-bounds — the player on that side must return within 0.8 s.
    // This covers every state: serve bounce, return bounce, and open rally.
    this._landedSide = ly < NET_Y ? 'top' : 'bottom';
    this._missTimer  = 0.8;
  }

  _handleMiss() {
    const side = this._landedSide;
    this._landedSide = null;
    this._missTimer  = 0;

    // Launch ball further out past the boundary for a visual bounce
    const endX = Math.max(5, Math.min(315, this.ball.x + (Math.random() - 0.5) * 40));
    const endY = side === 'top' ? COURT_TOP - 18 : COURT_BOTTOM + 18;
    this.ball.launch(this.ball.x, this.ball.y, endX, endY, 12, 180);

    // Award point — the side that missed loses
    this._pendingPoint = side;
    this._freezeTimer  = 1.0;
  }

  _registerFault(faultType, loser) {
    this._missTimer   = 0;
    this._landedSide  = null;
    this._totalFaults++;
    this.hud.showFault(faultType);
    AudioManager.playSfx('fault');

    this._freezeTimer  = 1.0;
    this._pendingPoint = loser;
  }

  _resolvePendingPoint() {
    const loser = this._pendingPoint;
    this._pendingPoint = null;

    if (loser === 'sideout') {
      // Server committed a fault — side-out, no point awarded, serve transfers.
      this.servingSide = this.servingSide === 'bottom' ? 'top' : 'bottom';
    } else if (loser === 'top') {
      // Top (AI) player lost the rally.
      if (this.servingSide === 'bottom') {
        this.score.bottom++;           // human was serving: they score a point
      } else {
        this.servingSide = 'bottom';   // AI was serving: side-out, human gets serve
      }
    } else {
      // Bottom (human) player lost the rally.
      if (this.servingSide === 'top') {
        this.score.top++;              // AI was serving: they score a point
      } else {
        this.servingSide = 'top';      // human was serving: side-out, AI gets serve
      }
    }

    this._rallyCount = 0;
    this._checkGameOver();
  }

  _checkGameOver() {
    const s = this.score;
    const isWin = (a, b) => a >= 11 && a - b >= 2;

    if (isWin(s.bottom, s.top) || isWin(s.top, s.bottom)) {
      const winner = isWin(s.bottom, s.top) ? 'bottom' : 'top';
      this.games[winner]++;
      this.score = { top: 0, bottom: 0 };

      if (this.games.bottom >= 2 || this.games.top >= 2) {
        this._endMatch(this.games.bottom >= 2 ? 'player' : 'opponent');
        return;
      }
    }

    this._startServe();
  }

  _endMatch(winner) {
    const elapsed = performance.now() / 1000 - this._matchStart;
    const scoreDiff = Math.abs(this.games.bottom - this.games.top) * 2 + Math.abs(this.score.bottom - this.score.top);
    const stars = calcStars(scoreDiff, this._totalFaults, this._maxRally, this._kitchenPlays);

    SaveManager.updateHallOfFame({
      longestRally:     this._maxRally,
      mostDinks:        this._kitchenPlays,
      biggestMargin:    scoreDiff,
      fastestMatchSec:  elapsed,
    });

    if (winner === 'player' && GameState.mode === 'circuit') {
      SaveManager.setTierStars(GameState.circuitTier, stars);
      SaveManager.unlockTier(GameState.circuitTier + 1);
      SaveManager.unlockCharacter(GameState.opponentId);
    }

    AudioManager.stopMusic();
    AudioManager.playMenuMusic();
    if (this.onMatchEnd) this.onMatchEnd({ winner, stars, games: this.games });
  }

  _triggerSunGlare() {
    this._sunGlareUsed = true;
    this.ball.visible = false;
    setTimeout(() => { this.ball.visible = true; }, 500);
  }

  draw(ctx) {
    // 1. Outside-court surround
    ctx.fillStyle = '#006938';
    ctx.fillRect(0, 0, 320, 240);

    // 2. Court (draws over the blue background)
    drawCourt(ctx);

    // 3. Players + ball in depth order (painter's algorithm: far first)
    const drawOrder = [this.player1, this.player2].sort((a, b) => a.y - b.y);
    drawOrder.forEach(p => p.draw(ctx));
    this.ball.draw(ctx);

    // 5. Serve UI (on top of court)
    this.serveUI.draw(ctx, this._time);

    // 6. HUD (always on top)
    this.hud.draw(ctx, this.score, this.games, this.servingSide, this._rallyCount,
                  this._player1Name || 'Player', this._player2Name || 'CPU');

    // Shot controls hint (bottom)
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '6px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('J:Drive  K:Dink  I:Lob  U:Smash  L:Drop', 160, 238);
    ctx.restore();

    // Pause overlay
    if (this._paused) {
      this._drawPause(ctx);
      if (this._showControls) this._drawControls(ctx);
    }
  }

  _drawPause(ctx) {
    ctx.save();

    // Dim the court
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, 320, 240);

    // Panel
    const pw = 160, ph = 118;
    const px = (320 - pw) / 2, py = (240 - ph) / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = '#ffd60a';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, py + 0.5, pw, ph);

    // Title
    ctx.fillStyle = '#ffd60a';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', 160, py + 22);

    // Score reminder
    ctx.fillStyle = '#ffffff';
    ctx.font = '8px monospace';
    ctx.fillText(
      `${this._player1Name || 'PLAYER'}  ${this.score.bottom} - ${this.score.top}  ${this._player2Name || 'CPU'}`,
      160, py + 40
    );

    // Resume hint
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '6px monospace';
    ctx.fillText('ESC / P  —  Resume', 160, py + 58);

    // Mute toggle
    const muteLabel = AudioManager.isMuted() ? 'M  —  Unmute Music' : 'M  —  Mute Music';
    ctx.fillStyle = AudioManager.isMuted() ? '#ff9966' : 'rgba(255,255,255,0.6)';
    ctx.fillText(muteLabel, 160, py + 70);

    // Controls option
    ctx.fillStyle = this._showControls ? '#ffd60a' : 'rgba(255,255,255,0.6)';
    ctx.fillText('C  —  Controls', 160, py + 82);

    // Divider
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 12, py + 90);
    ctx.lineTo(px + pw - 12, py + 90);
    ctx.stroke();

    // End game option
    ctx.fillStyle = '#ff6666';
    ctx.font = '6px monospace';
    ctx.fillText('Q  —  End Game (Main Menu)', 160, py + 101);

    ctx.restore();
  }

  _drawControls(ctx) {
    ctx.save();

    // Full-screen dim behind the panel
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, 320, 240);

    // Panel
    const pw = 220, ph = 190;
    const px = (320 - pw) / 2, py = (240 - ph) / 2;
    ctx.fillStyle = 'rgba(5,5,20,0.96)';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = '#ffd60a';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, py + 0.5, pw, ph);

    // Title
    ctx.fillStyle = '#ffd60a';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CONTROLS', 160, py + 14);

    // Divider under title
    ctx.strokeStyle = 'rgba(255,214,10,0.35)';
    ctx.beginPath();
    ctx.moveTo(px + 10, py + 19); ctx.lineTo(px + pw - 10, py + 19);
    ctx.stroke();

    const col1 = px + 14;   // key label x (left-aligned)
    const col2 = px + 75;   // description x (left-aligned)
    const sections = [
      { heading: 'MOVEMENT', items: [
        ['W / ↑',        'Move up'],
        ['S / ↓',        'Move down'],
        ['A / ←',        'Move left'],
        ['D / →',        'Move right'],
      ]},
      { heading: 'SHOTS', items: [
        ['J',            'Drive'],
        ['K',            'Dink'],
        ['I',            'Lob'],
        ['U',            'Smash'],
        ['L',            'Drop shot'],
      ]},
      { heading: 'SERVE', items: [
        ['↑↓←→',         'Aim cursor'],
        ['Space',        'Lock aim / release power'],
      ]},
    ];

    ctx.font = '6px monospace';
    let y = py + 30;

    for (const sec of sections) {
      // Section heading
      ctx.fillStyle = '#aaccff';
      ctx.font = 'bold 6px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(sec.heading, col1, y);
      y += 10;

      ctx.font = '6px monospace';
      for (const [key, desc] of sec.items) {
        // Key chip background
        const kw = ctx.measureText(key).width + 6;
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(col1 - 1, y - 6, kw, 8);
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(col1 - 1, y - 6, kw, 8);

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(key, col1 + 2, y);

        ctx.fillStyle = 'rgba(255,255,255,0.65)';
        ctx.fillText(desc, col2, y);
        y += 11;
      }
      y += 4; // gap between sections
    }

    // Close hint
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '6px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('C  —  Close', 160, py + ph - 7);

    ctx.restore();
  }
}
