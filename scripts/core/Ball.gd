class_name Ball
extends Node2D

## Emitted the moment the ball first touches the ground after a shot.
signal landed(pos: Vector2)

## Emitted when the post-landing bounce arc finishes and the ball is at rest.
signal at_rest(pos: Vector2)

# ── Visual constants ───────────────────────────────────────────────────────────
const C_BALL   := Color("ffd60a")
const C_SHADOW := Color(0.0, 0.0, 0.0, 0.40)
const RADIUS   := 3.0

# ── Physics constants ──────────────────────────────────────────────────────────
const BOUNCE_RETAIN  := 0.45   # fraction of peak height kept on bounce
const MIN_BOUNCE_H   := 3.0    # below this, skip the bounce arc
const BOUNCE_DIST_FACTOR := 0.18   # bounce travels this fraction of the original distance
const BOUNCE_SPEED   := 60.0   # pixels / second for the short bounce roll-out

# ── State ──────────────────────────────────────────────────────────────────────
## True while the ball is travelling (primary arc or bounce arc).
var in_flight: bool = false

## True only during the primary shot arc (not the post-landing bounce).
## Use this to determine whether a hit is a volley.
var is_primary_flight: bool:
	get: return in_flight and not _bouncing

## Where the ball will land on the ground (the arc's end point).
## Used by AIController for intercept prediction.
## Returns current position when ball is at rest.
var predicted_landing: Vector2:
	get: return _end if in_flight else position

## Current visual height above the court surface (pixels).
## 0 = on the ground.  Updated every frame during flight.
var height: float = 0.0

## When true the shadow fades as the ball rises toward its apex (Car Park effect).
var shadow_fade_at_apex: bool = false

# Internal flight parameters
var _t:        float   = 0.0
var _duration: float   = 1.0
var _start:    Vector2 = Vector2.ZERO
var _end:      Vector2 = Vector2.ZERO
var _peak_h:   float   = 8.0
var _bouncing: bool    = false   # true = currently in post-landing bounce arc


# ── Public API ─────────────────────────────────────────────────────────────────

## Fire the ball along a parabolic arc.
##
##  from_pos    — ground origin  (screen px)
##  to_pos      — ground target  (screen px)
##  peak_height — maximum visual height of arc (px)
##  ground_speed — pixels / second of horizontal travel
func launch(from_pos: Vector2, to_pos: Vector2,
		peak_height: float, ground_speed: float) -> void:
	_start    = from_pos
	_end      = to_pos
	_peak_h   = peak_height
	_duration = from_pos.distance_to(to_pos) / maxf(ground_speed, 1.0)
	_t        = 0.0
	_bouncing = false
	in_flight = true
	position  = _start
	height    = 0.0


# ── Godot callbacks ────────────────────────────────────────────────────────────

func _process(delta: float) -> void:
	if not in_flight:
		return

	_t = minf(_t + delta / _duration, 1.0)
	position = _start.lerp(_end, _t)
	height   = _peak_h * 4.0 * _t * (1.0 - _t)
	queue_redraw()

	if _t >= 1.0:
		_finish_arc()


func _draw() -> void:
	# Shadow stays on the ground plane (node origin) when ball is airborne
	if height > 0.5:
		var s_alpha := 0.40
		if shadow_fade_at_apex and _peak_h > 0.0:
			# Fade shadow linearly with normalised height (0 = ground, 1 = apex)
			s_alpha *= maxf(0.0, 1.0 - height / _peak_h)
		draw_circle(Vector2(2.0, 3.0), RADIUS, Color(0.0, 0.0, 0.0, s_alpha))
	# Ball rises by `height` pixels (negative Y = upward on screen)
	draw_circle(Vector2(0.0, -height), RADIUS, C_BALL)


# ── Internal ───────────────────────────────────────────────────────────────────

func _finish_arc() -> void:
	height    = 0.0
	in_flight = false

	if _bouncing:
		# Bounce arc complete — ball is now at rest
		emit_signal("at_rest", position)
		return

	# Primary arc landed
	emit_signal("landed", position)
	_try_bounce()


func _try_bounce() -> void:
	var next_h := _peak_h * BOUNCE_RETAIN
	if next_h < MIN_BOUNCE_H:
		emit_signal("at_rest", position)
		return

	var dir         := (_end - _start).normalized()
	var bounce_dist := _start.distance_to(_end) * BOUNCE_DIST_FACTOR

	_start    = position
	_end      = position + dir * bounce_dist
	_peak_h   = next_h
	_duration = maxf(bounce_dist / BOUNCE_SPEED, 0.05)
	_t        = 0.0
	_bouncing = true
	in_flight = true
