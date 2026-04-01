class_name ShotData

## Shot types available in Dinkball.
enum Type { DRIVE, DINK, LOB, SMASH, DROP_SHOT }

## Per-shot parameters.
##
##  speed_px_per_sec  — ground travel speed (pixels / second)
##  peak_height       — maximum visual height of arc (pixels)
##  spread_optimal    — target-cone radius on perfect timing (px)
##  spread_late       — target-cone radius on worst timing  (px)
##  min_ball_height   — minimum ball height required to attempt this shot
##                      (SMASH needs an airborne ball; others need ball near ground)
const PARAMS: Dictionary = {
	Type.DRIVE: {
		"speed_px_per_sec": 280.0,
		"peak_height":       8.0,
		"spread_optimal":    8.0,
		"spread_late":      26.0,
		"min_ball_height":   0.0,
	},
	Type.DINK: {
		"speed_px_per_sec":  85.0,
		"peak_height":      14.0,
		"spread_optimal":   10.0,
		"spread_late":      24.0,
		"min_ball_height":   0.0,
	},
	Type.LOB: {
		"speed_px_per_sec": 130.0,
		"peak_height":      64.0,
		"spread_optimal":   16.0,
		"spread_late":      36.0,
		"min_ball_height":   0.0,
	},
	Type.SMASH: {
		"speed_px_per_sec": 340.0,
		"peak_height":       4.0,
		"spread_optimal":    6.0,
		"spread_late":      20.0,
		"min_ball_height":  28.0,   # must be a high ball
	},
	Type.DROP_SHOT: {
		"speed_px_per_sec":  90.0,
		"peak_height":      20.0,
		"spread_optimal":   12.0,
		"spread_late":      28.0,
		"min_ball_height":   0.0,
	},
}
