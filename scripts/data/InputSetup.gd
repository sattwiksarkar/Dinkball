## InputSetup — Autoload that registers all input actions at startup.
##
## Each action supports both WASD and arrow keys so menus work with either.
extends Node

# ── Action → [primary key, secondary key] ─────────────────────────────────────
const _BINDINGS: Dictionary = {
	# Movement — WASD primary, arrow keys secondary
	"move_up":    [KEY_W, KEY_UP],
	"move_down":  [KEY_S, KEY_DOWN],
	"move_left":  [KEY_A, KEY_LEFT],
	"move_right": [KEY_D, KEY_RIGHT],

	# Shots  (hold aim direction while pressing to influence placement)
	"shot_drive":  [KEY_J, KEY_NONE],
	"shot_dink":   [KEY_K, KEY_NONE],
	"shot_lob":    [KEY_I, KEY_NONE],
	"shot_drop":   [KEY_L, KEY_NONE],
	"shot_smash":  [KEY_U, KEY_NONE],

	# Serve / confirm
	"serve":       [KEY_SPACE, KEY_ENTER],
}


func _ready() -> void:
	for action: String in _BINDINGS:
		if not InputMap.has_action(action):
			InputMap.add_action(action)
		else:
			InputMap.action_erase_events(action)

		var keys: Array = _BINDINGS[action]
		for keycode: int in keys:
			if keycode == KEY_NONE:
				continue
			var ev := InputEventKey.new()
			ev.physical_keycode = keycode
			InputMap.action_add_event(action, ev)
