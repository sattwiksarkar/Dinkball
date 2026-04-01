extends Node2D

const C_BG      := Color("0d0d1a")
const C_WIN     := Color("ffd60a")
const C_LOSE    := Color("e74c3c")
const C_TEXT    := Color("ffffff")
const C_DIM     := Color("888888")
const C_STAR_ON := Color("ffd60a")
const C_STAR_OFF:= Color("333344")
const C_UNLOCK  := Color("44cf6c")

var _options := ["CONTINUE", "HALL OF FAME", "MAIN MENU"]
var _sel:    int  = 0
var _ready_for_input: bool = false

## Stars revealed so far (0→result_stars, animated one-by-one on win)
var _stars_shown: int = 0


func _ready() -> void:
	queue_redraw()
	var won := GameState.result_winner == 1
	if won and GameState.result_stars > 0:
		# Reveal stars one-by-one after a short entrance delay
		await get_tree().create_timer(0.6).timeout
		for i in GameState.result_stars:
			_stars_shown = i + 1
			queue_redraw()
			AudioManager.play_sfx("point_win")
			await get_tree().create_timer(0.4).timeout
	# Accept input only after stars finish
	await get_tree().create_timer(0.3).timeout
	_ready_for_input = true


func _input(event: InputEvent) -> void:
	if not _ready_for_input:
		return
	if event.is_action_pressed("move_left") or event.is_action_pressed("move_up"):
		_sel = (_sel - 1 + _options.size()) % _options.size()
		queue_redraw()
	elif event.is_action_pressed("move_right") or event.is_action_pressed("move_down"):
		_sel = (_sel + 1) % _options.size()
		queue_redraw()
	elif event.is_action_pressed("serve"):
		_confirm()


func _draw() -> void:
	var font   := ThemeDB.fallback_font
	var won    := GameState.result_winner == 1
	var stars  := GameState.result_stars

	draw_rect(Rect2(0, 0, 320, 240), C_BG)

	# Win / lose banner
	var banner := "YOU WIN!" if won else "DEFEATED"
	var banner_col := C_WIN if won else C_LOSE
	draw_string(font, Vector2(160, 22), banner,
			HORIZONTAL_ALIGNMENT_CENTER, -1, 16, banner_col)

	# Score
	var score_str := "%d — %d" % [GameState.result_p1_score, GameState.result_p2_score]
	draw_string(font, Vector2(160, 42), score_str,
			HORIZONTAL_ALIGNMENT_CENTER, -1, 10, C_TEXT)
	draw_string(font, Vector2(160, 54), "Games: %d — %d" % [GameState.result_p1_games, GameState.result_p2_games],
			HORIZONTAL_ALIGNMENT_CENTER, -1, 7, C_DIM)

	# Stars (only shown on win, revealed one by one)
	if won:
		_draw_stars(_stars_shown)

	# Stats recap
	var sy := 110.0
	_draw_stat_row(font, "FAULTS",        str(GameState.result_faults),        sy)
	_draw_stat_row(font, "LONGEST RALLY", str(GameState.result_max_rally),      sy + 14)
	_draw_stat_row(font, "KITCHEN PLAYS", str(GameState.result_kitchen_plays),  sy + 28)

	# Unlocks
	if GameState.result_unlocks.size() > 0:
		draw_string(font, Vector2(160, 158), "UNLOCKED!",
				HORIZONTAL_ALIGNMENT_CENTER, -1, 9, C_UNLOCK)
		for i in GameState.result_unlocks.size():
			var cd := CharacterData.get_character(GameState.result_unlocks[i])
			draw_string(font, Vector2(160, 172.0 + i * 12.0), cd.get("name","?"),
					HORIZONTAL_ALIGNMENT_CENTER, -1, 8, C_UNLOCK)

	# Navigation (3 options, evenly spaced)
	for i in _options.size():
		var ox := 60.0 + i * 100.0
		var col := C_WIN if i == _sel else C_DIM
		if i == _sel:
			draw_string(font, Vector2(ox - 10, 220), ">",
					HORIZONTAL_ALIGNMENT_LEFT, -1, 8, C_WIN)
		draw_string(font, Vector2(ox, 220), _options[i],
				HORIZONTAL_ALIGNMENT_LEFT, -1, 8, col)


func _draw_stars(count: int) -> void:
	var font := ThemeDB.fallback_font
	draw_string(font, Vector2(160, 72), "RATING",
			HORIZONTAL_ALIGNMENT_CENTER, -1, 7, C_DIM)
	for i in 3:
		var col := C_STAR_ON if i < count else C_STAR_OFF
		draw_string(font, Vector2(140.0 + i * 16.0, 86), "*",
				HORIZONTAL_ALIGNMENT_LEFT, -1, 14, col)


func _draw_stat_row(font: Font, label: String, value: String, y: float) -> void:
	draw_string(font, Vector2(80, y), label,
			HORIZONTAL_ALIGNMENT_LEFT, -1, 7, C_DIM)
	draw_string(font, Vector2(240, y), value,
			HORIZONTAL_ALIGNMENT_RIGHT, -1, 7, C_TEXT)


func _confirm() -> void:
	match _sel:
		0:  # Continue
			match GameState.game_mode:
				"circuit":
					if GameState.result_winner == 1:
						GameState.circuit_tier = mini(GameState.circuit_tier + 1, VenueData.tier_count())
					GameState.char_select_role = "player"
					ScreenWipe.go("res://scenes/circuit/CircuitMap.tscn")
				_:
					GameState.char_select_role = "player"
					ScreenWipe.go("res://scenes/menus/CharacterSelect.tscn")
		1:  # Hall of Fame
			ScreenWipe.go("res://scenes/menus/HallOfFame.tscn")
		2:  # Main Menu
			ScreenWipe.go("res://scenes/menus/MainMenu.tscn")
