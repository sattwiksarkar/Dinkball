extends Node2D

const C_BG     := Color("0d0d1a")
const C_TITLE  := Color("ffd60a")
const C_SELECT := Color("ffffff")
const C_DIM    := Color("888888")
const C_CURSOR := Color("ffd60a")
const C_PADDLE := Color("f1faee")
const C_BALL   := Color("ffd60a")

const OPTIONS := ["QUICK MATCH", "CIRCUIT MODE", "TOURNAMENT", "PRACTICE"]

var _sel:  int   = 0
var _time: float = 0.0   # for title pulse animation


func _ready() -> void:
	queue_redraw()


func _process(delta: float) -> void:
	_time += delta
	queue_redraw()


func _input(event: InputEvent) -> void:
	if event.is_action_pressed("move_up"):
		_sel = (_sel - 1 + OPTIONS.size()) % OPTIONS.size()
	elif event.is_action_pressed("move_down"):
		_sel = (_sel + 1) % OPTIONS.size()
	elif event.is_action_pressed("serve"):
		_confirm()


func _draw() -> void:
	var font := ThemeDB.fallback_font

	draw_rect(Rect2(0, 0, 320, 240), C_BG)

	# Animated decorative ball bouncing across top
	var bx := fmod(_time * 55.0, 340.0) - 10.0
	var by := 52.0 + sin(_time * 4.0) * 6.0
	draw_circle(Vector2(bx, by), 4.0, C_BALL)

	# Title with gentle vertical pulse
	var title_y := 30.0 + sin(_time * 2.2) * 1.5
	draw_string(font, Vector2(160, title_y), "DINKBALL",
			HORIZONTAL_ALIGNMENT_CENTER, -1, 20, C_TITLE)
	draw_string(font, Vector2(160, title_y + 18), "16-BIT PICKLEBALL",
			HORIZONTAL_ALIGNMENT_CENTER, -1, 7, C_DIM)

	# Decorative net line
	draw_line(Vector2(40, 66), Vector2(280, 66), C_DIM, 1.0)
	# Net posts
	draw_rect(Rect2(38, 60, 3, 10), C_DIM)
	draw_rect(Rect2(279, 60, 3, 10), C_DIM)

	# Menu items
	for i in OPTIONS.size():
		var y := 92.0 + i * 24.0
		var col := C_SELECT if i == _sel else C_DIM

		if i == _sel:
			# Paddle cursor drawn as a small rect + handle
			_draw_paddle_cursor(Vector2(82, y - 4))

		draw_string(font, Vector2(100, y + 8), OPTIONS[i],
				HORIZONTAL_ALIGNMENT_LEFT, -1, 9, col)

	# Footer
	draw_string(font, Vector2(160, 228), "SPACE to select   ARROWS to navigate",
			HORIZONTAL_ALIGNMENT_CENTER, -1, 6, C_DIM)


func _draw_paddle_cursor(pos: Vector2) -> void:
	# Paddle head (small rect)
	draw_rect(Rect2(pos.x,     pos.y,     12, 9), C_PADDLE)
	# Handle
	draw_rect(Rect2(pos.x + 4, pos.y + 9,  4, 5), Color("c8a96e"))


func _confirm() -> void:
	match _sel:
		0:  # Quick Match — player picks their character, then opponent
			GameState.game_mode       = "quick"
			GameState.char_select_role = "player"
			ScreenWipe.go("res://scenes/menus/CharacterSelect.tscn")
		1:  # Circuit Mode — player picks their character, opponent from tier
			GameState.game_mode       = "circuit"
			GameState.char_select_role = "player"
			ScreenWipe.go("res://scenes/circuit/CircuitMap.tscn")
		2:  # Tournament — stub: goes to Quick Match for now
			GameState.game_mode       = "quick"
			GameState.char_select_role = "player"
			ScreenWipe.go("res://scenes/menus/CharacterSelect.tscn")
		3:  # Practice
			GameState.game_mode    = "practice"
			GameState.player_id    = "suki"
			GameState.opponent_id  = "colonel"
			GameState.ai_difficulty = "Easy"
			GameState.venue_id     = "garden"
			ScreenWipe.go("res://scenes/match/Match.tscn")
