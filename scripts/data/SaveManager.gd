## SaveManager — Autoload for persistent save data.
##
## Persists circuit progress, character unlocks, and Hall of Fame records.
## Call SaveManager.save() after any state change that should survive restart.
extends Node

const SAVE_PATH := "user://dinkball_save.json"

# ── Live data ──────────────────────────────────────────────────────────────────
var circuit_tier_reached: int  = 0
var completed_tiers:      Array = []           # Array of { tier, stars }
var unlocked_characters:  Array[String] = ["rex", "manda", "big_clive", "suki"]

var hall_of_fame: Dictionary = {
	"longest_rally":     0,
	"most_dinks":        0,
	"biggest_win_margin":0,
	"fastest_match_sec": 999999,
}


func _ready() -> void:
	_load()


# ── Public API ─────────────────────────────────────────────────────────────────

func is_tier_unlocked(tier: int) -> bool:
	return tier <= circuit_tier_reached + 1


func get_tier_stars(tier: int) -> int:
	for entry in completed_tiers:
		if entry["tier"] == tier:
			return entry["stars"]
	return 0


func complete_tier(tier: int, stars: int) -> void:
	# Update or insert stars record
	for entry in completed_tiers:
		if entry["tier"] == tier:
			entry["stars"] = maxi(entry["stars"], stars)
			save()
			return
	completed_tiers.append({"tier": tier, "stars": stars})
	circuit_tier_reached = maxi(circuit_tier_reached, tier)
	save()


func unlock_character(char_id: String) -> bool:
	if char_id in unlocked_characters:
		return false
	unlocked_characters.append(char_id)
	save()
	return true


func is_character_unlocked(char_id: String) -> bool:
	return char_id in unlocked_characters


func update_hall_of_fame(rally: int, dinks: int, margin: int, seconds: float) -> void:
	var changed := false
	if rally > hall_of_fame["longest_rally"]:
		hall_of_fame["longest_rally"] = rally
		changed = true
	if dinks > hall_of_fame["most_dinks"]:
		hall_of_fame["most_dinks"] = dinks
		changed = true
	if margin > hall_of_fame["biggest_win_margin"]:
		hall_of_fame["biggest_win_margin"] = margin
		changed = true
	if seconds < hall_of_fame["fastest_match_sec"] and seconds > 0:
		hall_of_fame["fastest_match_sec"] = seconds
		changed = true
	if changed:
		save()


func save() -> void:
	var payload := {
		"circuit_tier_reached": circuit_tier_reached,
		"completed_tiers":      completed_tiers,
		"unlocked_characters":  unlocked_characters,
		"hall_of_fame":         hall_of_fame,
	}
	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(payload, "\t"))


func reset_save() -> void:
	circuit_tier_reached = 0
	completed_tiers      = []
	unlocked_characters  = ["rex", "manda", "big_clive", "suki"]
	hall_of_fame         = {"longest_rally":0,"most_dinks":0,"biggest_win_margin":0,"fastest_match_sec":999999}
	save()


# ── Internal ───────────────────────────────────────────────────────────────────

func _load() -> void:
	if not FileAccess.file_exists(SAVE_PATH):
		return
	var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if not file:
		return
	var result: Variant = JSON.parse_string(file.get_as_text())
	if not result is Dictionary:
		return
	if result.has("circuit_tier_reached"):
		circuit_tier_reached = result["circuit_tier_reached"]
	if result.has("completed_tiers"):
		completed_tiers = result["completed_tiers"]
	if result.has("unlocked_characters"):
		unlocked_characters = result["unlocked_characters"]
	if result.has("hall_of_fame"):
		hall_of_fame.merge(result["hall_of_fame"], true)
