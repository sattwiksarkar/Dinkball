## VenueBackdrop — procedural background drawn behind the court.
## Reads GameState.venue_id to select the correct visual theme.
## Rendered at z_index = -2 so the court always draws on top.
extends Node2D

# Colour palette per venue — matches venues.json bg_color / accent_color
const PALETTES: Dictionary = {
	"garden":          {"sky": "a8d8ea", "mid": "3d6b47", "acc": "a8d5a2"},
	"sports_hall":     {"sky": "d4a84b", "mid": "8b6914", "acc": "f5deb3"},
	"car_park":        {"sky": "888888", "mid": "4a4a4a", "acc": "ff6b35"},
	"rooftop":         {"sky": "1a3a5c", "mid": "2c5282", "acc": "87ceeb"},
	"beach":           {"sky": "87ceeb", "mid": "c2956c", "acc": "ffd700"},
	"indoor_arena":    {"sky": "0a0a1a", "mid": "1c1c2e", "acc": "9b59b6"},
	"national_stadium":{"sky": "050510", "mid": "0d0d1a", "acc": "ffd700"},
	"grand_final":     {"sky": "000005", "mid": "0a0a0f", "acc": "ff4500"},
}


func _draw() -> void:
	var id  := GameState.venue_id
	var pal: Dictionary = PALETTES.get(id, PALETTES["garden"])
	var sky := Color(pal["sky"])
	var mid := Color(pal["mid"])
	var acc := Color(pal["acc"])

	match id:
		"garden":           _draw_garden(sky, mid, acc)
		"sports_hall":      _draw_sports_hall(sky, mid, acc)
		"car_park":         _draw_car_park(sky, mid, acc)
		"rooftop":          _draw_rooftop(sky, mid, acc)
		"beach":            _draw_beach(sky, mid, acc)
		"indoor_arena":     _draw_indoor_arena(sky, mid, acc)
		"national_stadium": _draw_national_stadium(sky, mid, acc)
		"grand_final":      _draw_grand_final(sky, mid, acc)
		_:
			draw_rect(Rect2(0, 0, 320, 240), Color("111111"))


# ── Garden ──────────────────────────────────────────────────────────────────────

func _draw_garden(sky: Color, mid: Color, acc: Color) -> void:
	# Sky gradient bands
	draw_rect(Rect2(0, 0, 320, 140), sky)
	draw_rect(Rect2(0, 140, 320, 100), mid)
	# Sun
	draw_circle(Vector2(260, 28), 14, Color("fffde0"))
	# Rolling hills
	for i in range(5):
		var x := -20.0 + i * 80.0
		draw_circle(Vector2(x, 148), 48, mid.lightened(0.12))
	# Bushes
	draw_circle(Vector2(30,  160), 10, acc)
	draw_circle(Vector2(50,  162),  8, acc.darkened(0.1))
	draw_circle(Vector2(280, 160), 10, acc)
	draw_circle(Vector2(260, 163),  8, acc.darkened(0.1))
	# Fence posts (far side)
	for i in range(8):
		var fx := 40.0 + i * 35.0
		draw_rect(Rect2(fx, 130, 3, 18), Color("c8a96e"))
	# Dashed fence wire
	for i in range(28):
		draw_rect(Rect2(40.0 + i * 9.0, 134, 5, 1), Color("c8a96e", 0.6))


# ── Sports Hall ─────────────────────────────────────────────────────────────────

func _draw_sports_hall(sky: Color, mid: Color, acc: Color) -> void:
	# Wooden wall
	draw_rect(Rect2(0, 0, 320, 240), mid)
	# Horizontal planks
	for i in range(18):
		draw_rect(Rect2(0, i * 14, 320, 1), mid.lightened(0.18))
		draw_rect(Rect2(0, i * 14 + 1, 320, 12), mid.lightened(0.06 * (i % 2)))
	# Ceiling strip lights
	for i in range(4):
		draw_rect(Rect2(30.0 + i * 70.0, 0, 50, 6), acc.lightened(0.5))
		draw_rect(Rect2(30.0 + i * 70.0, 6, 50, 2), acc.darkened(0.3))
	# Wall scoreboard
	draw_rect(Rect2(110, 8, 100, 30), Color("1a1a1a"))
	draw_rect(Rect2(110, 8, 100, 30), acc, false, 1.0)
	var font := ThemeDB.fallback_font
	draw_string(font, Vector2(160, 28), "DINKBALL",
			HORIZONTAL_ALIGNMENT_CENTER, -1, 9, acc)


# ── Car Park ────────────────────────────────────────────────────────────────────

func _draw_car_park(sky: Color, mid: Color, acc: Color) -> void:
	# Overcast sky
	draw_rect(Rect2(0, 0, 320, 90), sky)
	# Concrete ground
	draw_rect(Rect2(0, 90, 320, 150), mid)
	# Concrete lines/cracks
	for i in range(6):
		draw_line(Vector2(0, 100.0 + i * 24.0), Vector2(320, 104.0 + i * 20.0),
				  mid.lightened(0.15), 1)
	# Parked cars (simplified rectangles)
	_draw_pixel_car(Vector2(20, 108), acc)
	_draw_pixel_car(Vector2(250, 108), acc.darkened(0.3))
	# Streetlamps
	for i in range(2):
		var lx := 60.0 + i * 200.0
		draw_rect(Rect2(lx, 60, 4, 60), Color("aaaaaa"))
		draw_rect(Rect2(lx - 10, 58, 24, 6), Color("aaaaaa"))
		draw_circle(Vector2(lx + 2, 60), 5, Color("fffde0", 0.9))


func _draw_pixel_car(pos: Vector2, col: Color) -> void:
	draw_rect(Rect2(pos.x,      pos.y + 8,  50, 14), col)
	draw_rect(Rect2(pos.x + 8,  pos.y,      32, 12), col.lightened(0.15))
	draw_circle(Vector2(pos.x + 10, pos.y + 22), 5, Color("222222"))
	draw_circle(Vector2(pos.x + 40, pos.y + 22), 5, Color("222222"))


# ── Rooftop ─────────────────────────────────────────────────────────────────────

func _draw_rooftop(sky: Color, mid: Color, acc: Color) -> void:
	# Night sky gradient
	draw_rect(Rect2(0, 0, 320, 240), sky)
	draw_rect(Rect2(0, 80, 320, 160), mid)
	# Stars
	var rng := RandomNumberGenerator.new()
	rng.seed = 42
	for i in range(40):
		var sx := rng.randf_range(0, 320)
		var sy := rng.randf_range(0, 70)
		draw_circle(Vector2(sx, sy), rng.randf_range(0.5, 1.5), Color(1,1,1, rng.randf_range(0.4,1.0)))
	# City skyline silhouette
	var buildings := [
		[10,  55, 28, 80], [45,  40, 20, 80], [72,  62, 18, 80],
		[96,  30, 30, 80], [133, 50, 22, 80], [162, 20, 26, 80],
		[195, 45, 18, 80], [220, 35, 32, 80], [260, 52, 24, 80],
		[291, 38, 30, 80],
	]
	for b in buildings:
		draw_rect(Rect2(b[0], b[1], b[2], b[3]), Color("0a1a2e"))
	# Building windows
	for b in buildings:
		for wy in range(3):
			for wx in range(b[2] / 8):
				if rng.randf() > 0.45:
					draw_rect(Rect2(b[0] + 2 + wx * 8, b[1] + 4 + wy * 10, 4, 5), acc.lightened(0.3))
	# Rooftop railing
	for i in range(40):
		draw_rect(Rect2(i * 8.0, 76, 2, 8), Color("5a7a9a"))
	draw_rect(Rect2(0, 75, 320, 2), Color("5a7a9a"))


# ── Beach ───────────────────────────────────────────────────────────────────────

func _draw_beach(sky: Color, mid: Color, acc: Color) -> void:
	# Sky
	draw_rect(Rect2(0, 0, 320, 100), sky)
	# Ocean band
	draw_rect(Rect2(0, 85, 320, 40), Color("2980b9"))
	# Wave lines
	for i in range(3):
		draw_line(Vector2(0, 90.0 + i * 12.0), Vector2(320, 92.0 + i * 12.0),
				  Color("5dade2", 0.6), 1)
	# Sand
	draw_rect(Rect2(0, 120, 320, 120), mid)
	# Sand texture (dithered dots)
	var rng2 := RandomNumberGenerator.new()
	rng2.seed = 77
	for i in range(80):
		draw_circle(
			Vector2(rng2.randf_range(0, 320), rng2.randf_range(122, 240)),
			rng2.randf_range(0.5, 2.0),
			mid.lightened(rng2.randf_range(0.05, 0.25))
		)
	# Sun
	draw_circle(Vector2(40, 25), 16, acc)
	# Palm tree (left)
	draw_rect(Rect2(18, 80, 5, 60), Color("8b6914"))
	draw_circle(Vector2(22, 75), 18, Color("2ecc71", 0.7))
	draw_circle(Vector2(12, 68), 12, Color("27ae60", 0.7))
	draw_circle(Vector2(34, 70), 14, Color("27ae60", 0.7))


# ── Indoor Arena ────────────────────────────────────────────────────────────────

func _draw_indoor_arena(sky: Color, mid: Color, acc: Color) -> void:
	# Dark background
	draw_rect(Rect2(0, 0, 320, 240), sky)
	draw_rect(Rect2(0, 150, 320, 90), mid)
	# Crowd silhouettes (rows of heads)
	for row in range(4):
		var row_y := 20.0 + row * 28.0
		var rng3  := RandomNumberGenerator.new()
		rng3.seed = row * 13 + 7
		for i in range(24):
			var hx := i * 14.0 + rng3.randf_range(-3, 3)
			draw_circle(Vector2(hx, row_y + rng3.randf_range(-3, 3)), 5,
						Color("1a0a2e").lightened(row * 0.05))
	# Spot lights
	for i in range(3):
		var lx := 60.0 + i * 100.0
		draw_line(Vector2(lx, 0), Vector2(lx - 30 + i * 30, 140),
				  Color(1, 1, 0.8, 0.15), 8)
		draw_circle(Vector2(lx, 4), 6, Color("fffde0"))
	# Arena floor shine
	draw_rect(Rect2(0, 150, 320, 2), acc.lightened(0.4))
	# Score banner
	draw_rect(Rect2(90, 2, 140, 16), Color("0d0d1a"))
	draw_rect(Rect2(90, 2, 140, 16), acc, false, 1.0)
	var font := ThemeDB.fallback_font
	draw_string(font, Vector2(160, 14), "DINKBALL ARENA",
			HORIZONTAL_ALIGNMENT_CENTER, -1, 7, acc)


# ── National Stadium ────────────────────────────────────────────────────────────

func _draw_national_stadium(sky: Color, mid: Color, acc: Color) -> void:
	draw_rect(Rect2(0, 0, 320, 240), sky)
	draw_rect(Rect2(0, 130, 320, 110), mid)
	# Packed crowd — solid rows with colour variation
	for row in range(5):
		var row_y := 10.0 + row * 22.0
		for i in range(40):
			var rng4 := RandomNumberGenerator.new()
			rng4.seed = row * 100 + i
			var crowd_col := Color(rng4.randf_range(0.1, 0.6),
								   rng4.randf_range(0.0, 0.2),
								   rng4.randf_range(0.3, 0.8))
			draw_rect(Rect2(i * 8.0, row_y, 7, 14), crowd_col)
	# Stadium arch
	draw_arc(Vector2(160, 0), 200, 0, PI, 32, Color("2c3e50"), 8)
	# Gold trim
	draw_arc(Vector2(160, 0), 205, 0, PI, 32, acc, 2)
	# Floodlights
	for i in range(4):
		var fx := 40.0 + i * 80.0
		draw_rect(Rect2(fx - 1, 0, 3, 30), Color("cccccc"))
		draw_circle(Vector2(fx, 30), 5, Color("fffde0", 0.95))
		draw_line(Vector2(fx, 30), Vector2(fx + randf_range(-20, 20), 140),
				  Color(1, 1, 0.8, 0.08), 10)


# ── Grand Final ─────────────────────────────────────────────────────────────────

func _draw_grand_final(sky: Color, mid: Color, acc: Color) -> void:
	draw_rect(Rect2(0, 0, 320, 240), sky)
	# Pulsing crowd bands
	for row in range(6):
		draw_rect(Rect2(0, 8.0 + row * 18.0, 320, 14),
				  Color(acc.r * 0.4, acc.g * 0.1, acc.b * 0.1, 0.5 - row * 0.06))
	# Grand Final banner
	draw_rect(Rect2(40, 120, 240, 20), Color("1a0000"))
	draw_rect(Rect2(40, 120, 240, 20), acc, false, 1.0)
	var font := ThemeDB.fallback_font
	draw_string(font, Vector2(160, 134), "GRAND FINAL",
			HORIZONTAL_ALIGNMENT_CENTER, -1, 9, acc)
	# Spotlights — more dramatic
	for i in range(5):
		var lx := 30.0 + i * 65.0
		draw_line(Vector2(lx, 0), Vector2(160, 200),
				  Color(acc.r, acc.g * 0.3, 0.0, 0.07 + i * 0.01), 12)
		draw_circle(Vector2(lx, 3), 5, Color("fffde0"))
	# Floor glow
	draw_rect(Rect2(0, 198, 320, 2), acc)
