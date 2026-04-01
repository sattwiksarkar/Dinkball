class_name HUD
extends Node2D

## Drawn above the court (z_index set in Match.tscn).
## Uses _draw() so it scales with the 320×240 pixel-art canvas.
## A bitmap font will replace the fallback font in Phase 9.

# ── Palette ────────────────────────────────────────────────────────────────────
const C_TEXT        := Color("ffffff")
const C_FAULT       := Color("ffcc00")
const C_SCORE_BG    := Color(0.0, 0.0, 0.0, 0.55)
const C_SERVER_ICON := Color("ffd60a")   # matches ball colour

const SCORE_FONT_SIZE := 8
const FAULT_FONT_SIZE := 12

# ── State (set by MatchManager) ────────────────────────────────────────────────
var p1_score:     int    = 0
var p2_score:     int    = 0
var p1_games:     int    = 0
var p2_games:     int    = 0
var current_game: int    = 1
var serving_side: int    = 1   # 1 = player1 (bottom), -1 = player2 (top)

var _fault_text:  String = ""
var _fault_alpha: float  = 0.0
var _fault_scale: float  = 0.5   # animates 0.5→1.0 on show
var _fault_tween: Tween  = null


# ── Public API ─────────────────────────────────────────────────────────────────

func show_fault(text: String) -> void:
	_fault_text  = text
	_fault_alpha = 1.0
	_fault_scale = 0.5
	queue_redraw()
	if _fault_tween:
		_fault_tween.kill()
	_fault_tween = create_tween()
	# Scale in quickly
	_fault_tween.tween_method(_set_fault_scale, 0.5, 1.0, 0.12).set_ease(Tween.EASE_OUT)
	# Hold
	_fault_tween.tween_interval(1.1)
	# Fade out
	_fault_tween.tween_method(_set_fault_alpha, 1.0, 0.0, 0.3)


func update_score(p1: int, p2: int, p1g: int, p2g: int, game: int, serving: int) -> void:
	p1_score     = p1
	p2_score     = p2
	p1_games     = p1g
	p2_games     = p2g
	current_game = game
	serving_side = serving
	queue_redraw()


# ── Draw ───────────────────────────────────────────────────────────────────────

func _draw() -> void:
	var font := ThemeDB.fallback_font

	# ── Score strip at top ──────────────────────────────────────────────────
	draw_rect(Rect2(0.0, 0.0, 320.0, 14.0), C_SCORE_BG)

	# Player 1 score (left)
	var p1_text := "P1  %d (%d)" % [p1_score, p1_games]
	draw_string(font, Vector2(4.0, 10.0), p1_text,
			HORIZONTAL_ALIGNMENT_LEFT, -1, SCORE_FONT_SIZE, C_TEXT)

	# Player 2 score (right)
	var p2_text := "(%d) %d  P2" % [p2_games, p2_score]
	draw_string(font, Vector2(316.0, 10.0), p2_text,
			HORIZONTAL_ALIGNMENT_RIGHT, -1, SCORE_FONT_SIZE, C_TEXT)

	# Game number (centre)
	draw_string(font, Vector2(160.0, 10.0), "GAME %d" % current_game,
			HORIZONTAL_ALIGNMENT_CENTER, -1, SCORE_FONT_SIZE, C_TEXT)

	# ── Serve indicator ─────────────────────────────────────────────────────
	# Small filled circle on the serving player's side
	var srv_y := 220.0 if serving_side == 1 else 20.0
	draw_circle(Vector2(160.0, srv_y), 3.0, C_SERVER_ICON)
	draw_string(font, Vector2(160.0, srv_y - 6.0), "SERVE",
			HORIZONTAL_ALIGNMENT_CENTER, -1, SCORE_FONT_SIZE, C_SERVER_ICON)

	# ── Fault callout (scale-in then fade) ───────────────────────────────────
	if _fault_alpha > 0.01:
		var fc       := Color(C_FAULT.r, C_FAULT.g, C_FAULT.b, _fault_alpha)
		var fs       := int(FAULT_FONT_SIZE * _fault_scale)
		var text_w   := 90.0 * _fault_scale
		var pill_h   := 18.0 * _fault_scale
		var pill_y   := 110.0 - pill_h * 0.5
		draw_rect(
			Rect2(160.0 - text_w * 0.5 - 4.0, pill_y, text_w + 8.0, pill_h),
			Color(0.0, 0.0, 0.0, _fault_alpha * 0.75)
		)
		draw_string(font, Vector2(160.0, 110.0 + fs * 0.5), _fault_text,
				HORIZONTAL_ALIGNMENT_CENTER, -1, fs, fc)


# ── Internal ───────────────────────────────────────────────────────────────────

func _set_fault_alpha(v: float) -> void:
	_fault_alpha = v
	queue_redraw()


func _set_fault_scale(v: float) -> void:
	_fault_scale = v
	queue_redraw()
