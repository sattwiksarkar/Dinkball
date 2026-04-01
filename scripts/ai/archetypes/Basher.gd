class_name Basher
extends AIController

## Aggressive driver — hammers every ball flat and fast.
## Weak kitchen game; rarely dinks and almost never lobs defensively.

func _init() -> void:
	reaction_time      = 0.40   # slightly slower to react (prefers power)
	shot_accuracy      = 0.72
	kitchen_discipline = 0.45   # often charges into kitchen for volleys
	lateral_spread     = 35.0   # aims more centrally — power over placement
	rest_depth         = 32.0   # positions mid-court to close on ball

	shot_weights = {
		ShotData.Type.DRIVE:     0.85,
		ShotData.Type.DINK:      0.04,
		ShotData.Type.LOB:       0.08,
		ShotData.Type.DROP_SHOT: 0.00,
		ShotData.Type.SMASH:     0.03,
	}
