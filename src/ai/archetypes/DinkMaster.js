import AIController from '../AIController.js';
import { ShotType } from '../../core/ShotData.js';
import { NET_Y } from '../../core/Court.js';
import { Side } from '../../core/Player.js';

// DinkMaster — almost always dinks, rushes kitchen after every shot.
export default class DinkMaster extends AIController {
  constructor(playerRef, difficulty) {
    super(playerRef, difficulty);
    this.shotWeights = {
      [ShotType.DRIVE]:     0.05,
      [ShotType.DINK]:      0.75,
      [ShotType.LOB]:       0.05,
      [ShotType.SMASH]:     0.05,
      [ShotType.DROP_SHOT]: 0.10,
    };
  }

  choosePosition(ball) {
    // Always at the kitchen line
    const y = this.player.side === Side.TOP ? NET_Y - 42 : NET_Y + 42;
    return { x: 160 + (ball.x - 160) * 0.5, y };
  }
}
