extends Node2D

const C_BG       := Color("0d0d1a")
const C_TITLE    := Color("ffd60a")
const C_NAME     := Color("ffffff")
const C_DESC     := Color("aaaaaa")
const C_LOCKED   := Color("555555")
const C_STAT_FG  := Color("44cf6c")
const C_STAT_BG  := Color("1a3a2a")
const C_CURSOR   := Color("ffd60a")
const C_DIM      := Color("666666")

var _characters: Array = []
var _sel: int = 0

## Stat bar animation: 0.0 = no bars drawn, 1.0 = full width.
## Resets to 0.0 on every card switch and lerps to 1.0 in _process.
var _bar_anim: float = 1.0


func _ready() -> void:
	_build_list()
	queue_redraw()


func _process(delta: float) -> void:
	if _bar_anim < 1.0:
		_bar_anim = minf(_bar_anim + delta * 5.0, 1.0)
		queue_redraw()


## Rebuild _characters based on the current char_select_role.
## Player selection: playable characters only.
## Opponent selection: all characters (locked ones shown greyed out).
func _build_list() -> void:
	_characters = []
	var all := CharacterData.get_all()
	if GameState.char_select_role == "player":
		for c in all:
			if c.get("playable", false):
				_characters.append(c)
	else:
		# Opponent selection — show all; locked displayed greyed out
		_characters = all.duplicate()


func _input(event: InputEvent) -> void:
	if event.is_action_pressed("move_left"):
		_sel = (_sel - 1 + _characters.size()) % _characters.size()
		_bar_anim = 0.0
		queue_redraw()
	elif event.is_action_pressed("move_right"):
		_sel = (_sel + 1) % _characters.size()
		_bar_anim = 0.0
		queue_redraw()
	elif event.is_action_pressed("serve"):
		_confirm()
	elif event.is_action_pressed("move_up"):
		# Back
		ScreenWipe.go("res://scenes/menus/MainMenu.tscn")


func _draw() -> void:
	var font  := ThemeDB.fallback_font
	var char:   Dictionary = _characters[_sel] if _characters.size() > 0 else {}
	var locked: bool = not SaveManager.is_character_unlocked(char.get("id","")) and not char.get("playable", false)

	draw_rect(Rect2(0, 0, 320, 240), C_BG)

	# Title
	var role_label := "CHOOSE YOUR CHARACTER" if GameState.char_select_role == "player" \
	                  else "CHOOSE OPPONENT"
	draw_string(font, Vector2(160, 14), role_label,
			HORIZONTAL_ALIGNMENT_CENTER, -1, 8, C_TITLE)

	# Navigation arrows
	draw_string(font, Vector2(20, 128), "<",  HORIZONTAL_ALIGNMENT_LEFT, -1, 12, C_CURSOR)
	draw_string(font, Vector2(300, 128), ">", HORIZONTAL_ALIGNMENT_LEFT, -1, 12, C_CURSOR)

	# Character card (centred)
	var card_x := 70.0
	var card_y := 28.0
	draw_rect(Rect2(card_x, card_y, 180, 170), Color("111122"))
	draw_rect(Rect2(card_x, card_y, 180, 170), C_DIM, false, 1.0)

	if not char.is_empty():
		var name_col := C_LOCKED if locked else C_NAME

		# Character name — centred within the 180 px card
		draw_string(font, Vector2(card_x, card_y + 16), char.get("name","???"),
				HORIZONTAL_ALIGNMENT_CENTER, 180, 11, name_col)

		# Lock indicator
		if locked:
			draw_string(font, Vector2(card_x, card_y + 90), "LOCKED",
					HORIZONTAL_ALIGNMENT_CENTER, 180, 9, C_LOCKED)
			var ut := char.get("unlock_tier", 0) as int
			draw_string(font, Vector2(card_x, card_y + 104),
					"Unlock: Circuit Tier %d" % ut,
					HORIZONTAL_ALIGNMENT_CENTER, 180, 7, C_LOCKED)
		else:
			# Description — centred within the card
			draw_string(font, Vector2(card_x, card_y + 32), char.get("description",""),
					HORIZONTAL_ALIGNMENT_CENTER, 180, 7, C_DESC)

			# Stat bars
			var stats: Dictionary = char.get("stats", {})
			var stat_keys := ["power","speed","kitchen","consistency","serve"]
			var stat_labels := ["PWR","SPD","KIT","CON","SRV"]
			for si in stat_keys.size():
				var val := stats.get(stat_keys[si], 5) as int
				var sy  := card_y + 52.0 + si * 18.0
				draw_string(font, Vector2(card_x + 6, sy + 8), stat_labels[si],
						HORIZONTAL_ALIGNMENT_LEFT, -1, 7, C_DESC)
				# Background bar
				draw_rect(Rect2(card_x + 36, sy, 128, 8), C_STAT_BG)
				# Fill bar — width animated via _bar_anim
				draw_rect(Rect2(card_x + 36, sy, val * 12.8 * _bar_anim, 8), C_STAT_FG)

	# Dot indicator row
	var total := _characters.size()
	var dot_start := 160.0 - total * 5.0
	for i in total:
		var col := C_CURSOR if i == _sel else C_DIM
		draw_circle(Vector2(dot_start + i * 10.0, 210.0), 2.0, col)

	# Footer
	draw_string(font, Vector2(160, 228), "ARROWS to browse   SPACE to select   W to back",
			HORIZONTAL_ALIGNMENT_CENTER, -1, 6, C_DIM)


func _confirm() -> void:
	var char:   Dictionary = _characters[_sel]
	var locked: bool = not SaveManager.is_character_unlocked(char.get("id","")) and not char.get("playable", false)
	if locked:
		return  # can't select a locked character

	if GameState.char_select_role == "player":
		GameState.player_id = char["id"]

		match GameState.game_mode:
			"quick":
				# Now pick opponent — default venue for quick play
				GameState.venue_id = "garden"
				GameState.char_select_role = "opponent"
				_sel = 0
				_build_list()
				queue_redraw()
			"circuit":
				# Opponent and venue determined by tier
				var tier_data := VenueData.get_tier(GameState.circuit_tier)
				GameState.opponent_id   = tier_data.get("opponent_id", "colonel")
				GameState.ai_difficulty = tier_data.get("ai_difficulty", "Medium")
				GameState.venue_id      = tier_data.get("id", "garden")
				ScreenWipe.go("res://scenes/match/Match.tscn")
			_:
				ScreenWipe.go("res://scenes/match/Match.tscn")

	elif GameState.char_select_role == "opponent":
		GameState.opponent_id   = char["id"]
		GameState.ai_difficulty = "Medium"
		ScreenWipe.go("res://scenes/match/Match.tscn")
