class_name ServeUI
extends Node2D

## Drawn above the court during serve states (z_index set in Match.tscn).
## Shows the target service-box highlight, the aim cursor, and the power meter.

# ── Palette ────────────────────────────────────────────────────────────────────
const C_BOX_TINT  := Color(1.0, 1.0, 0.0, 0.12)   # yellow tint over target box
const C_BOX_EDGE  := Color(1.0, 1.0, 0.0, 0.55)   # bright yellow box outline
const C_CURSOR    := Color("ffffff")
const C_CURSOR_BG := Color(0.0, 0.0, 0.0, 0.45)
const C_METER_BG  := Color(0.0, 0.0, 0.0, 0.65)
const C_METER_LO  := Color("44cf6c")   # green
const C_METER_MID := Color("f4d03f")   # yellow
const C_METER_HI  := Color("e74c3c")   # red
const C_LABEL     := Color("ffffff")

# ── Meter geometry (left edge of screen, alongside court) ─────────────────────
const METER_X:     float = 6.0
const METER_Y_TOP: float = 30.0    # Court.COURT_TOP
const METER_H:     float = 180.0   # Court.COURT_BOTTOM - Court.COURT_TOP
const METER_W:     float = 6.0

# ── State (set by MatchManager each frame) ────────────────────────────────────
enum State { HIDDEN, AIM, POWER }

var state:      State   = State.HIDDEN
var target_box: Rect2   = Rect2()
var aim_pos:    Vector2 = Vector2.ZERO
var power:      float   = 0.0   # 0.0 → 1.0


# ── Public API ─────────────────────────────────────────────────────────────────

func show_aim(box: Rect2, cursor: Vector2) -> void:
	state      = State.AIM
	target_box = box
	aim_pos    = cursor
	visible    = true
	queue_redraw()


func show_power(cursor: Vector2, pwr: float) -> void:
	state   = State.POWER
	aim_pos = cursor
	power   = pwr
	visible = true
	queue_redraw()


func hide_serve() -> void:
	state   = State.HIDDEN
	visible = false


# ── Draw ───────────────────────────────────────────────────────────────────────

func _draw() -> void:
	if state == State.HIDDEN:
		return

	_draw_target_box()
	_draw_cursor()
	if state == State.POWER:
		_draw_power_meter()


func _draw_target_box() -> void:
	# Filled tint
	draw_rect(target_box, C_BOX_TINT)
	# Dashed-style outline using four lines (Godot 4 has no built-in dashed line)
	var r := target_box
	draw_line(r.position,                      Vector2(r.end.x,    r.position.y), C_BOX_EDGE, 1.0)
	draw_line(Vector2(r.end.x, r.position.y),  r.end,                             C_BOX_EDGE, 1.0)
	draw_line(r.end,                           Vector2(r.position.x, r.end.y),   C_BOX_EDGE, 1.0)
	draw_line(Vector2(r.position.x, r.end.y),  r.position,                        C_BOX_EDGE, 1.0)


func _draw_cursor() -> void:
	const HALF := 5.0
	const GAP  := 2.0
	# Tiny dark circle behind crosshair for contrast
	draw_circle(aim_pos, HALF + 1.0, C_CURSOR_BG)
	# Crosshair arms (horizontal + vertical)
	draw_line(aim_pos + Vector2(-HALF, 0),  aim_pos + Vector2(-GAP, 0),  C_CURSOR, 1.0)
	draw_line(aim_pos + Vector2(GAP, 0),    aim_pos + Vector2(HALF, 0),  C_CURSOR, 1.0)
	draw_line(aim_pos + Vector2(0, -HALF),  aim_pos + Vector2(0, -GAP),  C_CURSOR, 1.0)
	draw_line(aim_pos + Vector2(0, GAP),    aim_pos + Vector2(0, HALF),  C_CURSOR, 1.0)
	# Centre dot
	draw_circle(aim_pos, 1.0, C_CURSOR)


func _draw_power_meter() -> void:
	var font := ThemeDB.fallback_font

	# Background track
	draw_rect(Rect2(METER_X, METER_Y_TOP, METER_W, METER_H), C_METER_BG)

	# Filled bar (grows upward from bottom)
	var fill_h := power * METER_H
	var fill_y := METER_Y_TOP + METER_H - fill_h
	var bar_color: Color
	if power < 0.5:
		bar_color = C_METER_LO.lerp(C_METER_MID, power * 2.0)
	else:
		bar_color = C_METER_MID.lerp(C_METER_HI, (power - 0.5) * 2.0)

	draw_rect(Rect2(METER_X, fill_y, METER_W, fill_h), bar_color)

	# Border
	draw_rect(Rect2(METER_X, METER_Y_TOP, METER_W, METER_H), C_LABEL, false, 1.0)

	# "PWR" label above meter
	draw_string(font, Vector2(METER_X + 3.0, METER_Y_TOP - 2.0), "PWR",
			HORIZONTAL_ALIGNMENT_CENTER, -1, 6, C_LABEL)
