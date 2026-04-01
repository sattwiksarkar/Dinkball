## CharacterData — Autoload that loads and exposes character definitions.
extends Node

const ARCHETYPE_SCRIPTS: Dictionary = {
	"Pusher":     "res://scripts/ai/archetypes/Pusher.gd",
	"Basher":     "res://scripts/ai/archetypes/Basher.gd",
	"DinkMaster": "res://scripts/ai/archetypes/DinkMaster.gd",
	"Lobber":     "res://scripts/ai/archetypes/Lobber.gd",
	"AllRounder": "res://scripts/ai/archetypes/AllRounder.gd",
}

## Stat influence on gameplay: multipliers applied in MatchManager / Player.
## Each stat is 1-10 in the JSON; these scale to actual game values.
const STAT_SPEED_SCALE:    float = 10.0   # extra px/s per point above 5
const STAT_POWER_SPREAD:   float = 3.0    # px spread reduction per point above 5

var _characters: Array = []


func _ready() -> void:
	_load()


# ── Public API ─────────────────────────────────────────────────────────────────

func get_all() -> Array:
	return _characters


func get_playable() -> Array:
	return _characters.filter(func(c): return c["playable"])


func get_character(id: String) -> Dictionary:
	for c in _characters:
		if c["id"] == id:
			return c
	return {}


func get_archetype_script(char_id: String) -> GDScript:
	var c := get_character(char_id)
	if c.is_empty():
		return load(ARCHETYPE_SCRIPTS["AllRounder"])
	var key: String = c.get("archetype", "AllRounder")
	return load(ARCHETYPE_SCRIPTS.get(key, ARCHETYPE_SCRIPTS["AllRounder"]))


## Player move speed (px/s) based on Speed stat.
func move_speed_for(char_id: String) -> float:
	var c := get_character(char_id)
	var spd := c.get("stats", {}).get("speed", 5) as int
	return 90.0 + (spd - 5) * STAT_SPEED_SCALE


## Shot accuracy spread modifier based on Consistency + Power stats.
func spread_modifier_for(char_id: String) -> float:
	var c    := get_character(char_id)
	var cons := c.get("stats", {}).get("consistency", 5) as int
	return 1.0 - (cons - 5) * 0.04   # higher consistency → tighter spread


# ── Internal ───────────────────────────────────────────────────────────────────

func _load() -> void:
	var file := FileAccess.open("res://data/characters.json", FileAccess.READ)
	if not file:
		push_error("CharacterData: could not open characters.json")
		return
	var result: Variant = JSON.parse_string(file.get_as_text())
	if result is Dictionary and result.has("characters"):
		_characters = result["characters"]
