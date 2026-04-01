class_name Pusher
extends AIController

## Gets everything back — high consistency, no power, never lobs.
## Stays near the baseline and wears the opponent down with drives and dinks.

func _init() -> void:
	reaction_time      = 0.22   # fast reactions (defensive readiness)
	shot_accuracy      = 0.88
	kitchen_discipline = 0.92   # rarely enters kitchen
	lateral_spread     = 55.0   # spreads returns wide
	rest_depth         = 18.0   # hugs the baseline

	shot_weights = {
		ShotData.Type.DRIVE:     0.70,
		ShotData.Type.DINK:      0.25,
		ShotData.Type.LOB:       0.00,
		ShotData.Type.DROP_SHOT: 0.05,
		ShotData.Type.SMASH:     0.00,
	}
