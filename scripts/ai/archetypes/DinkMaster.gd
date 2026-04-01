class_name DinkMaster
extends AIController

## Kitchen specialist — dinks and drop shots constantly, draws opponent to net.
## Weak lob defense; has no power to fall back on.

func _init() -> void:
	reaction_time      = 0.30
	shot_accuracy      = 0.82
	kitchen_discipline = 0.30   # deliberately positions IN kitchen to dink
	lateral_spread     = 30.0   # precise, narrow placement
	rest_depth         = 55.0   # pushes forward toward kitchen line

	shot_weights = {
		ShotData.Type.DRIVE:     0.20,
		ShotData.Type.DINK:      0.55,
		ShotData.Type.LOB:       0.05,
		ShotData.Type.DROP_SHOT: 0.18,
		ShotData.Type.SMASH:     0.02,
	}


## Override aim to always favour the kitchen zone target.
func _compute_aim_dir() -> Vector2:
	# Target near the opponent's kitchen line regardless of shot type
	var tx := Court.CENTER_X + randf_range(-lateral_spread, lateral_spread)
	var ty := Court.KITCHEN_NEAR - 6.0 if _player.player_side == -1 \
	          else Court.KITCHEN_FAR + 6.0
	return (Vector2(tx, ty) - _player.position).normalized()
