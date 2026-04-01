class_name Lobber
extends AIController

## Counter-puncher — lobs frequently to reset net-rushers, drops to trap.
## Weak at the net; punished by consistent smashers.

func _init() -> void:
	reaction_time      = 0.45   # slower, more defensive read
	shot_accuracy      = 0.70
	kitchen_discipline = 0.85   # stays out of kitchen — prefers baseline
	lateral_spread     = 60.0   # lobs land anywhere deep
	rest_depth         = 15.0   # deep baseline position

	shot_weights = {
		ShotData.Type.DRIVE:     0.28,
		ShotData.Type.DINK:      0.12,
		ShotData.Type.LOB:       0.42,
		ShotData.Type.DROP_SHOT: 0.16,
		ShotData.Type.SMASH:     0.02,
	}


## Override aim to bias toward deep corners for lob variety.
func _compute_aim_dir() -> Vector2:
	# Aim toward deep corners with a heavy lateral bias
	var corner_x := Court.COURT_LEFT + 10.0 if randf() < 0.5 \
	                else Court.COURT_RIGHT - 10.0
	var ty := Court.COURT_BOTTOM - 15.0 if _player.player_side == -1 \
	          else Court.COURT_TOP + 15.0
	return (Vector2(corner_x, ty) - _player.position).normalized()
