import AIController from '../AIController.js';
import { ShotType } from '../../core/ShotData.js';
import { COURT_TOP, COURT_BOTTOM, NET_Y } from '../../core/Court.js';
import { Side } from '../../core/Player.js';

// Lobber — high lob frequency, retreats to baseline.
export default class Lobber extends AIController {
  constructor(playerRef, difficulty) {
    super(playerRef, difficulty);
    this.shotWeights = {
      [ShotType.DRIVE]:     0.10,
      [ShotType.DINK]:      0.10,
      [ShotType.LOB]:       0.60,
      [ShotType.SMASH]:     0.05,
      [ShotType.DROP_SHOT]: 0.15,
    };
  }

  choosePosition(ball) {
    const y = this.player.side === Side.TOP
      ? COURT_TOP + 20
      : COURT_BOTTOM - 20;
    return { x: 160, y };
  }
}
