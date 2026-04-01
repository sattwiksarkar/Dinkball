class_name Court
extends Node2D

# ── Court dimensions (screen pixels on a 320×240 canvas) ──────────────────────
#
#  The court is drawn as a flat top-down rectangle.
#  Physical proportions: 44 ft long × 20 ft wide (official pickleball).
#
#  Screen mapping:
#    x  60 → 260  (200 px = 20 ft  →  10 px / ft)
#    y  30 → 210  (180 px = 44 ft  →  ~4.09 px / ft)
#
#  Y convention:  y=210 = player baseline (near / bottom)
#                 y=30  = opponent baseline (far / top)
#  Game-world Y:  0 = player baseline,  44 = opponent baseline

const COURT_LEFT   := 60.0
const COURT_RIGHT  := 260.0
const COURT_TOP    := 30.0
const COURT_BOTTOM := 210.0

const COURT_WIDTH  := COURT_RIGHT - COURT_LEFT    # 200 px
const COURT_HEIGHT := COURT_BOTTOM - COURT_TOP    # 180 px

const CENTER_X     := (COURT_LEFT + COURT_RIGHT) * 0.5    # 160 px
const NET_Y        := (COURT_TOP + COURT_BOTTOM) * 0.5    # 120 px

# 7 ft kitchen  →  7 × (180 / 44) ≈ 28.6 px, rounded to 29
const KITCHEN_PX   := 29.0
const KITCHEN_NEAR := NET_Y + KITCHEN_PX    # 149 px  — player-side kitchen line
const KITCHEN_FAR  := NET_Y - KITCHEN_PX    # 91 px   — opponent-side kitchen line

# ── Palette (Amiga OCS/ECS-inspired) ──────────────────────────────────────────
const C_BG      := Color("1a1a2e")   # deep navy background
const C_COURT   := Color("2d6a4f")   # mid green court surface
const C_KITCHEN := Color("1b4332")   # darker green NVZ shading
const C_LINE    := Color("ffffff")   # crisp white lines
const C_NET     := Color("c0c0c0")   # light grey net


func _draw() -> void:
	# ── Background ──────────────────────────────────────────────────────────
	draw_rect(Rect2(0.0, 0.0, 320.0, 240.0), C_BG)

	# ── Court surface ────────────────────────────────────────────────────────
	draw_rect(Rect2(COURT_LEFT, COURT_TOP, COURT_WIDTH, COURT_HEIGHT), C_COURT)

	# ── NVZ (kitchen) shading — both sides of net ────────────────────────────
	draw_rect(
		Rect2(COURT_LEFT, KITCHEN_FAR, COURT_WIDTH, KITCHEN_NEAR - KITCHEN_FAR),
		C_KITCHEN
	)

	# ── Court boundary ───────────────────────────────────────────────────────
	draw_rect(Rect2(COURT_LEFT, COURT_TOP, COURT_WIDTH, COURT_HEIGHT), C_LINE, false, 1.0)

	# ── Kitchen lines ────────────────────────────────────────────────────────
	draw_line(Vector2(COURT_LEFT, KITCHEN_NEAR), Vector2(COURT_RIGHT, KITCHEN_NEAR), C_LINE, 1.0)
	draw_line(Vector2(COURT_LEFT, KITCHEN_FAR),  Vector2(COURT_RIGHT, KITCHEN_FAR),  C_LINE, 1.0)

	# ── Centre service line (between the two kitchen lines only) ─────────────
	draw_line(Vector2(CENTER_X, KITCHEN_FAR), Vector2(CENTER_X, KITCHEN_NEAR), C_LINE, 1.0)

	# ── Net (2 px, drawn last so it sits on top) ─────────────────────────────
	draw_line(Vector2(COURT_LEFT, NET_Y), Vector2(COURT_RIGHT, NET_Y), C_NET, 2.0)


# ── Zone queries ───────────────────────────────────────────────────────────────

## Returns true if pos is inside the Non-Volley Zone on either side of the net.
func is_in_kitchen(pos: Vector2) -> bool:
	return (
		pos.x >= COURT_LEFT  and pos.x <= COURT_RIGHT and
		pos.y >= KITCHEN_FAR and pos.y <= KITCHEN_NEAR
	)


## Returns true if pos has landed outside the court boundary.
func is_out_of_bounds(pos: Vector2) -> bool:
	return (
		pos.x < COURT_LEFT  or pos.x > COURT_RIGHT or
		pos.y < COURT_TOP   or pos.y > COURT_BOTTOM
	)


## Returns the Rect2 of a service box.
##   side         1 = player (bottom)   -1 = opponent (top)
##   service_side -1 = left box          1 = right box  (from server's POV)
func get_service_box(side: int, service_side: int) -> Rect2:
	var box_y:      float
	var box_height: float
	if side == 1:   # player side: kitchen line → player baseline
		box_y      = KITCHEN_NEAR
		box_height = COURT_BOTTOM - KITCHEN_NEAR
	else:           # opponent side: opponent baseline → opponent kitchen line
		box_y      = COURT_TOP
		box_height = KITCHEN_FAR - COURT_TOP

	var half_w := COURT_WIDTH * 0.5
	var box_x  := COURT_LEFT if service_side == -1 else CENTER_X
	return Rect2(box_x, box_y, half_w, box_height)


## Convenience wrapper: is pos inside the given service box?
func is_in_service_box(pos: Vector2, side: int, service_side: int) -> bool:
	return get_service_box(side, service_side).has_point(pos)


# ── Coordinate helpers ─────────────────────────────────────────────────────────

## Game-world feet  →  screen pixels.
## Game coords: x ∈ [0, 20], y ∈ [0, 44] where y=0 is the player baseline.
func game_to_screen(gp: Vector2) -> Vector2:
	return Vector2(
		COURT_LEFT   + (gp.x / 20.0) * COURT_WIDTH,
		COURT_BOTTOM - (gp.y / 44.0) * COURT_HEIGHT
	)


## Screen pixels  →  game-world feet.
func screen_to_game(sp: Vector2) -> Vector2:
	return Vector2(
		(sp.x - COURT_LEFT)   / COURT_WIDTH  * 20.0,
		(COURT_BOTTOM - sp.y) / COURT_HEIGHT * 44.0
	)
