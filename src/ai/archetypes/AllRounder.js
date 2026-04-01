import AIController from '../AIController.js';
import { ShotType } from '../../core/ShotData.js';

// AllRounder — balanced weights, adapts slightly to opponent.
export default class AllRounder extends AIController {
  constructor(playerRef, difficulty) {
    super(playerRef, difficulty);
    this.shotWeights = {
      [ShotType.DRIVE]:     0.30,
      [ShotType.DINK]:      0.25,
      [ShotType.LOB]:       0.15,
      [ShotType.SMASH]:     0.15,
      [ShotType.DROP_SHOT]: 0.15,
    };
  }
}
