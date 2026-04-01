extends Node2D

const C_BG       := Color("0d0d1a")
const C_TITLE    := Color("ffd60a")
const C_AVAIL    := Color("ffffff")
const C_DONE     := Color("44cf6c")
const C_LOCKED   := Color("444455")
const C_CURSOR   := Color("ffd60a")
const C_DIM      := Color("666677")
const C_STAR_ON  := Color("ffd60a")
const C_STAR_OFF := Color("333344")

var _tiers: Array = []
var _sel:   int   = 0


func _ready() -> void:
	_tiers = VenueData.get_all_tiers()
	# Start selection on the highest available tier
	for i in _tiers.size():
		if SaveManager.is_tier_unlocked(_tiers[i]["tier"]):
			_sel = i
	queue_redraw()


func _input(event: InputEvent) -> void:
	if event.is_action_pressed("move_up"):
		_sel = (_sel - 1 + _tiers.size()) % _tiers.size()
		queue_redraw()
	elif event.is_action_pressed("move_down"):
		_sel = (_sel + 1) % _tiers.size()
		queue_redraw()
	elif event.is_action_pressed("serve"):
		_confirm()
	elif event.is_action_pressed("move_left"):
		ScreenWipe.go("res://scenes/menus/MainMenu.tscn")


func _draw() -> void:
	var font := ThemeDB.fallback_font

	draw_rect(Rect2(0, 0, 320, 240), C_BG)

	draw_string(font, Vector2(160, 14), "CIRCUIT MODE",
			HORIZONTAL_ALIGNMENT_CENTER, -1, 10, C_TITLE)

	for i in _tiers.size():
		var t:        Dictionary = _tiers[i]
		var tier_n:   int        = t["tier"] as int
		var unlocked: bool       = SaveManager.is_tier_unlocked(tier_n)
		var stars:    int        = SaveManager.get_tier_stars(tier_n)
		var y        := 30.0 + i * 24.0

		# Selection cursor
		if i == _sel:
			draw_rect(Rect2(18, y - 2, 284, 20), Color(1,1,1,0.06))
			draw_string(font, Vector2(22, y + 11), ">",
					HORIZONTAL_ALIGNMENT_LEFT, -1, 8, C_CURSOR)

		# Tier number
		var col := C_LOCKED if not unlocked else (C_DONE if stars > 0 else C_AVAIL)
		draw_string(font, Vector2(36, y + 11), "%d." % tier_n,
				HORIZONTAL_ALIGNMENT_LEFT, -1, 8, col)

		# Venue name
		draw_string(font, Vector2(54, y + 11), t.get("name",""),
				HORIZONTAL_ALIGNMENT_LEFT, -1, 8, col)

		# Difficulty badge
		if unlocked:
			var diff := t.get("ai_difficulty","")
			draw_string(font, Vector2(210, y + 11), diff,
					HORIZONTAL_ALIGNMENT_LEFT, -1, 7, C_DIM)

		# Stars
		for s in 3:
			var sc := C_STAR_ON if s < stars else C_STAR_OFF
			draw_string(font, Vector2(263.0 + s * 9.0, y + 11), "*",
					HORIZONTAL_ALIGNMENT_LEFT, -1, 8, sc)

	draw_string(font, Vector2(160, 228), "ARROWS to browse   SPACE to enter   A to menu",
			HORIZONTAL_ALIGNMENT_CENTER, -1, 6, C_DIM)


func _confirm() -> void:
	if _tiers.is_empty():
		return
	var t:      Dictionary = _tiers[_sel]
	var tier_n: int = t["tier"] as int
	if not SaveManager.is_tier_unlocked(tier_n):
		return   # locked

	GameState.circuit_tier  = tier_n
	GameState.game_mode     = "circuit"
	GameState.char_select_role = "player"
	ScreenWipe.go("res://scenes/menus/CharacterSelect.tscn")
