## VenueData — Autoload that loads and exposes venue/circuit-tier definitions.
extends Node

var _tiers: Array = []


func _ready() -> void:
	_load()


# ── Public API ─────────────────────────────────────────────────────────────────

func get_all_tiers() -> Array:
	return _tiers


func get_tier(tier_number: int) -> Dictionary:
	for t in _tiers:
		if t["tier"] == tier_number:
			return t
	return {}


func tier_count() -> int:
	return _tiers.size()


# ── Internal ───────────────────────────────────────────────────────────────────

func _load() -> void:
	var file := FileAccess.open("res://data/venues.json", FileAccess.READ)
	if not file:
		push_error("VenueData: could not open venues.json")
		return
	var result: Variant = JSON.parse_string(file.get_as_text())
	if result is Dictionary and result.has("tiers"):
		_tiers = result["tiers"]
