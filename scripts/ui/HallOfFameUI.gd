## HallOfFameUI — displays all-time records from SaveManager.hall_of_fame.
extends Node2D

const C_BG      := Color("0d0d1a")
const C_GOLD    := Color("ffd60a")
const C_TEXT    := Color("ffffff")
const C_DIM     := Color("888888")
const C_ACCENT  := Color("44cf6c")

var _ready_for_input: bool = false


func _ready() -> void:
	queue_redraw()
	await get_tree().create_timer(0.4).timeout
	_ready_for_input = true


func _input(event: InputEvent) -> void:
	if not _ready_for_input:
		return
	if event.is_action_pressed("serve") or event.is_action_pressed("shot_drive"):
		ScreenWipe.go("res://scenes/menus/MainMenu.tscn")


func _draw() -> void:
	var font := ThemeDB.fallback_font
	var hof  := SaveManager.hall_of_fame

	draw_rect(Rect2(0, 0, 320, 240), C_BG)

	# Title
	draw_string(font, Vector2(160, 22), "HALL OF FAME",
			HORIZONTAL_ALIGNMENT_CENTER, -1, 14, C_GOLD)
	draw_line(Vector2(40, 32), Vector2(280, 32), C_GOLD, 1)

	# Records
	var rows := [
		["LONGEST RALLY",      "%d shots"  % hof.get("longest_rally",     0)],
		["MOST KITCHEN PLAYS", "%d dinks"  % hof.get("most_dinks",         0)],
		["BIGGEST WIN MARGIN", "%d points" % hof.get("biggest_win_margin", 0)],
		["FASTEST MATCH",      _fmt_time(hof.get("fastest_match_sec", 999999))],
	]

	var sy := 60.0
	for row in rows:
		_draw_record(font, row[0], row[1], sy)
		sy += 36.0

	# Circuit tier reached
	var tier := SaveManager.circuit_tier_reached
	var tier_label := "Tier %d" % tier if tier > 0 else "None"
	draw_string(font, Vector2(160, 200), "CIRCUIT PROGRESS: " + tier_label,
			HORIZONTAL_ALIGNMENT_CENTER, -1, 7, C_DIM)

	# Prompt
	draw_string(font, Vector2(160, 224), "PRESS SPACE TO RETURN",
			HORIZONTAL_ALIGNMENT_CENTER, -1, 7, C_DIM)


func _draw_record(font: Font, label: String, value: String, y: float) -> void:
	# Category label
	draw_string(font, Vector2(160, y), label,
			HORIZONTAL_ALIGNMENT_CENTER, -1, 7, C_DIM)
	# Value highlighted below
	draw_string(font, Vector2(160, y + 14), value,
			HORIZONTAL_ALIGNMENT_CENTER, -1, 10, C_ACCENT)


func _fmt_time(seconds: float) -> String:
	if seconds >= 999998:
		return "---"
	var m := int(seconds) / 60
	var s := int(seconds) % 60
	return "%d:%02d" % [m, s]
