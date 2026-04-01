## AudioManager — autoload for all SFX and music playback.
##
## Gracefully skips playback if audio files are not present — the game
## runs silently until .ogg assets are dropped into assets/audio/.
extends Node

const SFX_DIR   := "res://assets/audio/sfx/"
const MUSIC_DIR := "res://assets/audio/music/"

# SFX name → relative path suffix (under SFX_DIR)
const SFX_FILES: Dictionary = {
	"hit_drive":  "hit_drive.ogg",
	"hit_dink":   "hit_dink.ogg",
	"hit_lob":    "hit_lob.ogg",
	"hit_smash":  "hit_smash.ogg",
	"hit_drop":   "hit_drop.ogg",
	"bounce":     "bounce.ogg",
	"fault":      "fault.ogg",
	"point_win":  "point_win.ogg",
	"crowd_cheer":"crowd_cheer.ogg",
}

# Map ShotData.Type int → sfx name (filled in _ready once ShotData available)
const SHOT_SFX: Dictionary = {
	0: "hit_drive",   # DRIVE
	1: "hit_dink",    # DINK
	2: "hit_lob",     # LOB
	3: "hit_smash",   # SMASH
	4: "hit_drop",    # DROP_SHOT
}

var _music:       AudioStreamPlayer = null
var _crowd:       AudioStreamPlayer = null
var _crowd_enabled: bool = false
var _sfx_cache:   Dictionary = {}   # path → AudioStream (null = not found)


func _ready() -> void:
	_music        = AudioStreamPlayer.new()
	_music.volume_db = -6.0
	add_child(_music)

	_crowd        = AudioStreamPlayer.new()
	_crowd.volume_db = -80.0
	add_child(_crowd)

	# Pre-cache SFX that exist on disk
	for key: String in SFX_FILES:
		var path: String = SFX_DIR + (SFX_FILES[key] as String)
		if ResourceLoader.exists(path):
			_sfx_cache[path] = load(path)
		else:
			_sfx_cache[path] = null

	# Try loading crowd ambient
	var crowd_path := SFX_DIR + "crowd_ambient.ogg"
	if ResourceLoader.exists(crowd_path):
		_crowd.stream = load(crowd_path)
		_crowd.autoplay = false


# ── Music ───────────────────────────────────────────────────────────────────────

func play_music(venue_id: String) -> void:
	var path := MUSIC_DIR + venue_id + ".ogg"
	if not ResourceLoader.exists(path):
		_music.stop()
		return
	_music.stream = load(path)
	_music.play()


func stop_music() -> void:
	_music.stop()


# ── Crowd ───────────────────────────────────────────────────────────────────────

## Enable crowd ambience for crowd-enabled venues.
func enable_crowd() -> void:
	if _crowd.stream:
		_crowd.volume_db = -40.0
		_crowd.play()
		_crowd_enabled = true


## Set crowd intensity (0.0 = quiet, 1.0 = roaring) based on rally length.
func set_crowd_intensity(ratio: float) -> void:
	if not _crowd_enabled:
		return
	_crowd.volume_db = lerpf(-40.0, -6.0, clampf(ratio, 0.0, 1.0))


func disable_crowd() -> void:
	_crowd.stop()
	_crowd_enabled = false


# ── SFX ────────────────────────────────────────────────────────────────────────

## Play a named sound effect. Silently ignored if the file is missing.
func play_sfx(sfx_name: String) -> void:
	var suffix: String = SFX_FILES.get(sfx_name, "") as String
	if suffix.is_empty():
		return
	var path: String = SFX_DIR + suffix
	var stream: AudioStream = _sfx_cache.get(path) as AudioStream
	if stream == null:
		return
	var p := AudioStreamPlayer.new()
	p.stream    = stream
	p.volume_db = 0.0
	add_child(p)
	p.play()
	p.finished.connect(p.queue_free)


## Convenience: play the correct hit SFX for a given ShotData.Type int value.
func play_shot_sfx(shot_type_int: int) -> void:
	var name: String = SHOT_SFX.get(shot_type_int, "hit_drive") as String
	play_sfx(name)
