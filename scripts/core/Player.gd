class_name Player
extends Node2D

## Emitted when the player presses a shot key.
## MatchManager decides whether the ball is in range and fires it.
signal swung(shot_type: ShotData.Type, aim_dir: Vector2)

# ── Tunable constants ──────────────────────────────────────────────────────────
## Base move speed — overridden at runtime by MatchManager from CharacterData.
var movement_speed: float = 90.0
## Ball must be within this radius for a shot attempt to register.
const CONTACT_RADIUS := 20.0
## Within this inner radius the timing is perfect (quality = 1.0).
const OPTIMAL_RADIUS :=  8.0

# ── Export properties ──────────────────────────────────────────────────────────
@export var player_side: int  = 1      # 1 = bottom (near), -1 = top (far)
@export var is_human:    bool = true

## Set to true by MatchManager during serve states to freeze player movement.
var movement_locked: bool = false

# ── Placeholder palette ────────────────────────────────────────────────────────
const C_PLAYER   := Color("e63946")
const C_OPPONENT := Color("457b9d")
const C_PADDLE   := Color("f1faee")


# ── Godot callbacks ────────────────────────────────────────────────────────────

func _process(delta: float) -> void:
	if not is_human:
		return
	_handle_movement(delta)
	_handle_shot_input()


func _draw() -> void:
	var col := C_PLAYER if player_side == 1 else C_OPPONENT
	draw_rect(Rect2(-6.0, -14.0, 12.0, 18.0), col)
	draw_rect(Rect2(-8.0, -22.0, 16.0,  6.0), C_PADDLE)


# ── Private ────────────────────────────────────────────────────────────────────

func _handle_movement(delta: float) -> void:
	if movement_locked:
		return
	var dir := Input.get_vector("move_left", "move_right", "move_up", "move_down")
	if dir == Vector2.ZERO:
		return

	var new_pos := position + dir * movement_speed * delta

	# Clamp to own half of the court (with a small body margin)
	new_pos.x = clampf(new_pos.x, Court.COURT_LEFT + 6.0, Court.COURT_RIGHT - 6.0)
	if player_side == 1:   # bottom half
		new_pos.y = clampf(new_pos.y, Court.NET_Y + 4.0, Court.COURT_BOTTOM - 6.0)
	else:                  # top half
		new_pos.y = clampf(new_pos.y, Court.COURT_TOP + 6.0, Court.NET_Y - 4.0)

	position = new_pos


func _handle_shot_input() -> void:
	# Capture current aim direction from movement keys at the moment of swing
	var aim := Input.get_vector("move_left", "move_right", "move_up", "move_down")

	if Input.is_action_just_pressed("shot_drive"):
		emit_signal("swung", ShotData.Type.DRIVE, aim)
	elif Input.is_action_just_pressed("shot_dink"):
		emit_signal("swung", ShotData.Type.DINK, aim)
	elif Input.is_action_just_pressed("shot_lob"):
		emit_signal("swung", ShotData.Type.LOB, aim)
	elif Input.is_action_just_pressed("shot_drop"):
		emit_signal("swung", ShotData.Type.DROP_SHOT, aim)
	elif Input.is_action_just_pressed("shot_smash"):
		emit_signal("swung", ShotData.Type.SMASH, aim)
