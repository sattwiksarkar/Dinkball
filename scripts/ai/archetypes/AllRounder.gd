class_name AllRounder
extends AIController

## Balanced and adaptive — no obvious weakness, no dominant strength.
## Used for Circuit Pro opponents and as the default opponent in Phase 5.

func _init() -> void:
	reaction_time      = 0.32
	shot_accuracy      = 0.80
	kitchen_discipline = 0.70
	lateral_spread     = 42.0
	rest_depth         = 28.0

	shot_weights = {
		ShotData.Type.DRIVE:     0.45,
		ShotData.Type.DINK:      0.22,
		ShotData.Type.LOB:       0.14,
		ShotData.Type.DROP_SHOT: 0.14,
		ShotData.Type.SMASH:     0.05,
	}
