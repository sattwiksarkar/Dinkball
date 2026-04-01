import AIController from '../AIController.js';
import { ShotType } from '../../core/ShotData.js';
import { COURT_TOP, NET_Y } from '../../core/Court.js';
import { Side } from '../../core/Player.js';

// Basher — drives and smashes, stays back, almost never dinks.
export default class Basher extends AIController {
  constructor(playerRef, difficulty) {
    super(playerRef, difficulty);
    this.shotWeights = {
      [ShotType.DRIVE]:     0.55,
      [ShotType.DINK]:      0.05,
      [ShotType.LOB]:       0.10,
      [ShotType.SMASH]:     0.25,
      [ShotType.DROP_SHOT]: 0.05,
    };
  }

  choosePosition(ball) {
    // Basher stays near baseline
    const baselineY = this.player.side === Side.TOP
      ? COURT_TOP + 15
      : 210 - 15;
    return { x: 160, y: baselineY };
  }
}
