## ScreenWipe — autoload CanvasLayer that plays a black-fade transition
## between every scene change in the game.
##
## Usage: call ScreenWipe.go("res://path/to/Scene.tscn") instead of
##        get_tree().change_scene_to_file().  The wipe-out plays automatically
##        after the new scene loads.
extends CanvasLayer

var _rect:  ColorRect = null
var _tween: Tween     = null


func _ready() -> void:
	layer                  = 100
	follow_viewport_enabled = true

	_rect          = ColorRect.new()
	_rect.color    = Color.BLACK
	_rect.position = Vector2.ZERO
	_rect.size     = Vector2(320, 240)
	_rect.modulate = Color(1, 1, 1, 0)
	# Prevent the rect from eating mouse/touch input
	_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_rect)


## Fade to black, change scene, then fade back in.
func go(scene_path: String) -> void:
	if _tween:
		_tween.kill()
	_tween = create_tween()
	# Fade out (cover screen)
	_tween.tween_property(_rect, "modulate:a", 1.0, 0.18).set_ease(Tween.EASE_IN)
	# Change scene while screen is black
	_tween.tween_callback(func(): get_tree().change_scene_to_file(scene_path))
	# Brief hold so the new scene can initialise
	_tween.tween_interval(0.08)
	# Fade back in (reveal new scene)
	_tween.tween_property(_rect, "modulate:a", 0.0, 0.28).set_ease(Tween.EASE_OUT)
