class_name AIController
extends Node2D

## Base AI controller.  Attach as a child of a Player node with is_human=false.
## Archetype subclasses override _init() to set shot weights and positioning params.
## MatchManager calls setup() after adding the controller to the scene.

# ── Difficulty multipliers ─────────────────────────────────────────────────────
const DIFFICULTY_MULT: Dictionary = {
	"Easy":   {"reaction_time": 2.6, "accuracy": 0.45},
	"Medium": {"reaction_time": 1.5, "accuracy": 0.72},
	"Hard":   {"reaction_time": 0.7, "accuracy": 0.90},
	"Expert": {"reaction_time": 0.35,"accuracy": 1.00},
}

@export var difficulty: String = "Medium"

# ── Tunable parameters (set per archetype) ─────────────────────────────────────
## Seconds before AI begins reacting to an incoming ball.
var reaction_time:      float = 0.35
## 0–1 overall shot quality; scales intercept-position noise.
var shot_accuracy:      float = 0.75
## 0–1 chance AI backs off instead of volleying from the kitchen.
var kitchen_discipline: float = 0.80
## How far left/right AI varies its shot targets (px).
var lateral_spread:     float = 45.0
## Y distance from baseline the AI rests at between shots.
var rest_depth:         float = 28.0

## Weighted shot-selection table.  Subclasses replace this dict in _init().
var shot_weights: Dictionary = {
	ShotData.Type.DRIVE:     0.45,
	ShotData.Type.DINK:      0.20,
	ShotData.Type.LOB:       0.15,
	ShotData.Type.DROP_SHOT: 0.15,
	ShotData.Type.SMASH:     0.05,
}

# ── References (set by setup()) ────────────────────────────────────────────────
var _ball:   Ball   = null
var _court:  Court  = null
var _player: Player = null

# ── Internal state ─────────────────────────────────────────────────────────────
var _reaction_timer: float = 0.0
var _has_acted:      bool  = false   # prevent double-hitting per rally exchange


# ── Public API ─────────────────────────────────────────────────────────────────

func setup(ball_ref: Ball, court_ref: Court) -> void:
	_ball   = ball_ref
	_court  = court_ref
	_player = get_parent() as Player

	# Scale base params by difficulty
	var mult := DIFFICULTY_MULT.get(difficulty, DIFFICULTY_MULT["Medium"])
	reaction_time = reaction_time * mult["reaction_time"]
	shot_accuracy = clampf(shot_accuracy * mult["accuracy"], 0.0, 1.0)


# ── Godot callbacks ────────────────────────────────────────────────────────────

func _process(delta: float) -> void:
	if _ball == null or _player == null:
		return

	if not _ball_incoming():
		# Ball going away — reset for next exchange, drift back to rest
		_reaction_timer = 0.0
		_has_acted      = false
		_move_to_rest(delta)
		return

	_reaction_timer += delta
	if _reaction_timer < reaction_time:
		return   # still processing reaction delay

	_move_to_intercept(delta)

	if not _has_acted:
		_try_hit()


# ── Movement ───────────────────────────────────────────────────────────────────

func _move_to_intercept(delta: float) -> void:
	var landing := _ball.predicted_landing
	# Add positional noise scaled by (1 − accuracy)
	var err := (1.0 - shot_accuracy)
	var dest := landing + Vector2(
		randf_range(-1.0, 1.0) * err * 20.0,
		randf_range(-1.0, 1.0) * err *  8.0
	)
	dest = _clamp_to_own_half(dest)

	var dir := dest - _player.position
	if dir.length() > 2.0:
		_player.position += dir.normalized() * Player.MOVE_SPEED * delta


func _move_to_rest(delta: float) -> void:
	var rest_y := Court.COURT_TOP + rest_depth if _player.player_side == -1 \
	              else Court.COURT_BOTTOM - rest_depth
	var rest := Vector2(Court.CENTER_X, rest_y)
	var dir  := rest - _player.position
	if dir.length() > 3.0:
		_player.position += dir.normalized() * Player.MOVE_SPEED * 0.55 * delta


# ── Shot decision ──────────────────────────────────────────────────────────────

func _try_hit() -> void:
	var dist := _player.position.distance_to(_ball.position)
	if dist > Player.CONTACT_RADIUS:
		return

	# Kitchen discipline: refuse to volley from NVZ with some probability
	if _ball.is_primary_flight and _court.is_in_kitchen(_player.position):
		if randf() < kitchen_discipline:
			return

	var shot := _choose_shot()
	_has_acted = true
	_player.emit_signal("swung", shot, _compute_aim_dir())


func _choose_shot() -> ShotData.Type:
	# Smash opportunity check first
	if _ball.height >= ShotData.PARAMS[ShotData.Type.SMASH]["min_ball_height"]:
		if randf() < shot_weights.get(ShotData.Type.SMASH, 0.0):
			return ShotData.Type.SMASH

	# Weighted random from all non-smash shots
	var pool: Array = []
	var total := 0.0
	for t: ShotData.Type in shot_weights:
		if t == ShotData.Type.SMASH:
			continue
		pool.append(t)
		total += shot_weights[t]

	var roll := randf() * total
	var acc  := 0.0
	for t: ShotData.Type in pool:
		acc += shot_weights[t]
		if roll <= acc:
			return t
	return ShotData.Type.DRIVE   # fallback


func _compute_aim_dir() -> Vector2:
	# Lateral aim varies within lateral_spread; depth targets opponent's deep zone
	var tx := Court.CENTER_X + randf_range(-lateral_spread, lateral_spread)
	var ty := Court.COURT_BOTTOM - 30.0 if _player.player_side == -1 \
	          else Court.COURT_TOP + 30.0
	return (Vector2(tx, ty) - _player.position).normalized()


# ── Helpers ────────────────────────────────────────────────────────────────────

func _ball_incoming() -> bool:
	if not _ball.is_primary_flight:
		return false
	var landing := _ball.predicted_landing
	return landing.y < Court.NET_Y if _player.player_side == -1 \
	       else landing.y > Court.NET_Y


func _clamp_to_own_half(pos: Vector2) -> Vector2:
	var min_y := Court.COURT_TOP + 6.0
	var max_y := Court.NET_Y - 4.0
	if _player.player_side == 1:
		min_y = Court.NET_Y + 4.0
		max_y = Court.COURT_BOTTOM - 6.0
	return Vector2(
		clampf(pos.x, Court.COURT_LEFT + 6.0, Court.COURT_RIGHT - 6.0),
		clampf(pos.y, min_y, max_y)
	)
