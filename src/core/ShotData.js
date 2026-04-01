// ShotData — shot type enum and per-type parameter table.

export const ShotType = Object.freeze({
  DRIVE:     0,
  DINK:      1,
  LOB:       2,
  SMASH:     3,
  DROP_SHOT: 4,
});

// speed: pixels/sec for the ball to travel 280px (full court width)
// peakHeight: max visual height offset in pixels at arc midpoint
// spreadOptimal: radius (px) of accuracy cone on a perfect timing hit
// spreadLate: radius on an early/late hit
// minBallHeight: minimum height offset — keeps Dink/Drop visually low

export const PARAMS = {
  [ShotType.DRIVE]: {
    speed: 420,
    peakHeight: 10,
    spreadOptimal: 12,
    spreadLate: 28,
    minBallHeight: 0,
  },
  [ShotType.DINK]: {
    speed: 160,
    peakHeight: 20,
    spreadOptimal: 8,
    spreadLate: 18,
    minBallHeight: 5,
  },
  [ShotType.LOB]: {
    speed: 200,
    peakHeight: 80,
    spreadOptimal: 20,
    spreadLate: 40,
    minBallHeight: 0,
  },
  [ShotType.SMASH]: {
    speed: 500,
    peakHeight: 5,
    spreadOptimal: 14,
    spreadLate: 30,
    minBallHeight: 0,
  },
  [ShotType.DROP_SHOT]: {
    speed: 140,
    peakHeight: 18,
    spreadOptimal: 10,
    spreadLate: 22,
    minBallHeight: 3,
  },
};
