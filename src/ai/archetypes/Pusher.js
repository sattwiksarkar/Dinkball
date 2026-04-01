import AIController from '../AIController.js';
import { ShotType } from '../../core/ShotData.js';
import { NET_Y } from '../../core/Court.js';
import { Side } from '../../core/Player.js';

// Pusher — high kitchen discipline, dinks and resets, rarely smashes.
export default class Pusher extends AIController {
  constructor(playerRef, difficulty) {
    super(playerRef, difficulty);
    this.shotWeights = {
      [ShotType.DRIVE]:     0.15,
      [ShotType.DINK]:      0.45,
      [ShotType.LOB]:       0.15,
      [ShotType.SMASH]:     0.05,
      [ShotType.DROP_SHOT]: 0.20,
    };
  }

  choosePosition(ball) {
    // Pushers hug the kitchen line
    const kitchenY = this.player.side === Side.TOP ? NET_Y - 44 : NET_Y + 44;
    return { x: 160, y: kitchenY };
  }
}
