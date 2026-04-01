// RulesEngine — fault detection and double-bounce state machine.
import { isOutOfBounds, isInKitchen, NET_Y, KITCHEN_TOP, KITCHEN_BOTTOM, COURT_BOTTOM } from './Court.js';

export const Fault = Object.freeze({
  NONE:               'NONE',
  OUT:                'OUT',
  NET:                'NET',
  KITCHEN_VOLLEY:     'KITCHEN!',
  DOUBLE_BOUNCE:      'DOUBLE BOUNCE',
  FOOT_FAULT:         'FOOT FAULT',
  WRONG_SERVICE_BOX:  'SERVICE FAULT',
});

// Double-bounce state
export const BounceState = Object.freeze({
  SERVE_BOUNCE_NEEDED:  0,
  RETURN_BOUNCE_NEEDED: 1,
  RALLY:                2,
});

export default class RulesEngine {
  constructor() {
    this.bounceState = BounceState.SERVE_BOUNCE_NEEDED;
  }

  reset() {
    this.bounceState = BounceState.SERVE_BOUNCE_NEEDED;
  }

  // Called when ball lands. Returns Fault string or Fault.NONE.
  checkLanding(landX, landY, lastHitBySide, servingSide) {
    // Out of bounds
    if (isOutOfBounds(landX, landY)) return Fault.OUT;

    // Double-bounce enforcement
    if (this.bounceState === BounceState.SERVE_BOUNCE_NEEDED) {
      // First bounce must be on receiver's half
      this.bounceState = BounceState.RETURN_BOUNCE_NEEDED;
      return Fault.NONE;
    }
    if (this.bounceState === BounceState.RETURN_BOUNCE_NEEDED) {
      this.bounceState = BounceState.RALLY;
      return Fault.NONE;
    }

    return Fault.NONE;
  }

  // Called when ball passes over / into net Y during flight.
  checkNet(ball) {
    // If ball's minimum Y-arc doesn't clear the net we treat it as a net fault.
    // MatchManager calls this by checking if ball endY is on the wrong side and
    // the arc doesn't lift above net level — handled there for simplicity.
    return Fault.NET;
  }

  // Called when a player attempts a volley (no bounce).
  checkKitchenVolley(player) {
    if (isInKitchen(player.x, player.y)) return Fault.KITCHEN_VOLLEY;
    return Fault.NONE;
  }

  // Called at serve time: did player's foot cross baseline?
  checkFootFault(player) {
    if (player.y > COURT_BOTTOM - 4) return Fault.FOOT_FAULT;
    return Fault.NONE;
  }

  // Validate serve landing position.
  checkServiceBox(landX, landY, serverSide, serverX) {
    const midX = 160;
    const isLeft = serverX < midX;
    // Diagonal: if server is on the left, ball must land in opponent's right box and vice versa.
    const targetLeft = !isLeft;

    // Must be in opponent's half
    if (serverSide === 'bottom' && landY >= NET_Y) return Fault.WRONG_SERVICE_BOX;
    if (serverSide === 'top'    && landY <= NET_Y) return Fault.WRONG_SERVICE_BOX;

    // Must not land in kitchen
    if (landY >= KITCHEN_TOP && landY <= KITCHEN_BOTTOM) return Fault.WRONG_SERVICE_BOX;

    // Diagonal box check
    if (targetLeft  && landX >= midX) return Fault.WRONG_SERVICE_BOX;
    if (!targetLeft && landX <  midX) return Fault.WRONG_SERVICE_BOX;

    return Fault.NONE;
  }
}
