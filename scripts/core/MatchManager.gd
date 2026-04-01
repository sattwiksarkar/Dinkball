## MatchManager — root script for the Match scene.
##
## Phase 8: adds venue-specific environmental effects (sun glare, wind, shadow
## fade, crowd audio) and wires AudioManager for SFX + per-venue music.
extends Node2D

@onready var court:    Court   = $Court
@onready var player1:  Player  = $Player1
@onready var player2:  Player  = $Player2
@onready var ball:     Ball    = $Ball
@onready var hud:      HUD     = $HUD
@onready var serve_ui: ServeUI = $ServeUI

var rules: RulesEngine
var _ai:   AIController = null

# ── Serve state machine ────────────────────────────────────────────────────────
enum ServeState { NONE, AIM, POWER }

var _serve_state: ServeState = ServeState.NONE
var _aim_cursor:  Vector2    = Vector2.ZERO
var _target_box:  Rect2      = Rect2()
var _power:       float      = 0.0
var _power_dir:   float      = 1.0
const POWER_SPEED := 0.75

# ── Match stats (for star rating) ─────────────────────────────────────────────
var _fault_count:    int   = 0
var _rally_length:   int   = 0   # shots in current rally
var _max_rally:      int   = 0
var _kitchen_plays:  int   = 0
var _match_start_us: int   = 0   # Time.get_ticks_usec() at start

# ── General ────────────────────────────────────────────────────────────────────
var _handling_fault: bool = false

## Spread multiplier for human player shots (derived from Consistency stat).
## Values <1.0 tighten spread; >1.0 widen it. Set from CharacterData in _ready().
var _player_spread_mod: float = 1.0

# ── Environmental effects ──────────────────────────────────────────────────────
## Rooftop wind: horizontal drift added to lob target X.
var _wind_x: float = 0.0
## Sun glare: fires once per match in Garden to hide ball briefly.
var _sun_glare_used: bool = false


func _ready() -> void:
	rules = RulesEngine.new(court)

	# ── Spawn AI from character data ───────────────────────────────────────
	var ai_script := CharacterData.get_archetype_script(GameState.opponent_id)
	_ai = ai_script.new() as AIController
	_ai.difficulty = GameState.ai_difficulty
	player2.add_child(_ai)
	_ai.setup(ball, court)

	# ── Apply player character stats ───────────────────────────────────────
	player1.movement_speed = CharacterData.move_speed_for(GameState.player_id)
	_player_spread_mod     = CharacterData.spread_modifier_for(GameState.player_id)
	_ai.shot_accuracy      = clampf(
		_ai.shot_accuracy * CharacterData.spread_modifier_for(GameState.opponent_id),
		0.3, 1.0
	)

	player1.swung.connect(_on_player_swung.bind(1))
	player2.swung.connect(_on_player_swung.bind(-1))
	ball.landed.connect(_on_ball_landed)
	ball.at_rest.connect(_on_ball_at_rest)

	_match_start_us = Time.get_ticks_usec()
	_reset_serve()
	_refresh_hud()
	_run_zone_sanity_checks()
	_setup_venue_effects()


# ── Serve input ────────────────────────────────────────────────────────────────

func _process(delta: float) -> void:
	if _handling_fault:
		return
	match _serve_state:
		ServeState.AIM:   _process_aim(delta)
		ServeState.POWER: _process_power(delta)


func _process_aim(delta: float) -> void:
	var dir     := Input.get_vector("move_left", "move_right", "move_up", "move_down")
	var new_pos := _aim_cursor + dir * 45.0 * delta
	_aim_cursor = Vector2(
		clampf(new_pos.x, _target_box.position.x + 2.0, _target_box.end.x - 2.0),
		clampf(new_pos.y, _target_box.position.y + 2.0, _target_box.end.y - 2.0)
	)
	serve_ui.show_aim(_target_box, _aim_cursor)
	if Input.is_action_just_pressed("serve"):
		_serve_state = ServeState.POWER
		_power       = 0.0
		_power_dir   = 1.0


func _process_power(delta: float) -> void:
	_power += _power_dir * POWER_SPEED * delta
	if _power >= 1.0:
		_power = 1.0; _power_dir = -1.0
	elif _power <= 0.0:
		_power = 0.0; _power_dir = 1.0
	serve_ui.show_power(_aim_cursor, _power)
	if Input.is_action_just_pressed("serve"):
		_fire_serve()


# ── Serve fire ─────────────────────────────────────────────────────────────────

func _fire_serve() -> void:
	_serve_state = ServeState.NONE
	serve_ui.hide_serve()
	player1.movement_locked = false

	var server: Player = player1 if rules.serving_side == 1 else player2
	var fault := rules.check_serve(_aim_cursor, rules.serving_side, server.position.y)
	if fault != RulesEngine.Fault.NONE:
		_trigger_fault(fault, rules.serving_side)
		return

	var speed  := lerpf(110.0, 270.0, _power)
	var peak_h := lerpf(20.0,   8.0,  _power)
	var spread := lerpf(3.0, 10.0, _power)
	var target := _aim_cursor + Vector2(
		randf_range(-spread, spread),
		randf_range(-spread * 0.5, spread * 0.5)
	)
	target.x = clampf(target.x, _target_box.position.x, _target_box.end.x)
	target.y = clampf(target.y, _target_box.position.y, _target_box.end.y)
	ball.launch(server.position, target, peak_h, speed)


# ── Serve reset ────────────────────────────────────────────────────────────────

func _reset_serve() -> void:
	_handling_fault = false
	ball.in_flight  = false
	ball.height     = 0.0
	_rally_length   = 0
	if rules.serving_side == 1:
		_start_human_serve()
	else:
		_start_ai_serve()
	_refresh_hud()


func _start_human_serve() -> void:
	var service_side := _service_side_for(rules.serving_side)
	var srv_x := clampf(Court.CENTER_X + service_side * 30.0,
	                    Court.COURT_LEFT + 8.0, Court.COURT_RIGHT - 8.0)
	player1.position        = Vector2(srv_x, Court.COURT_BOTTOM - 8.0)
	player1.movement_locked = true
	ball.position           = player1.position + Vector2(0.0, -14.0)
	# Position opponent at their baseline on the far side
	player2.position        = Vector2(Court.CENTER_X, Court.COURT_TOP + 8.0)
	ball.queue_redraw()
	var tss              := -service_side
	_target_box          = court.get_service_box(-1, tss)
	_aim_cursor          = _target_box.get_center()
	_serve_state         = ServeState.AIM
	serve_ui.show_aim(_target_box, _aim_cursor)


func _start_ai_serve() -> void:
	var service_side := _service_side_for(rules.serving_side)
	player2.position = Vector2(Court.CENTER_X + service_side * 30.0, Court.COURT_TOP + 8.0)
	var tbox         := court.get_service_box(1, -service_side)
	var acc          := _ai.shot_accuracy if _ai else 0.75
	var sprd         := (1.0 - acc) * 20.0
	var target       := tbox.get_center() + Vector2(
		randf_range(-sprd, sprd), randf_range(-sprd * 0.5, sprd * 0.5)
	)
	ball.position = player2.position + Vector2(0.0, 14.0)
	ball.queue_redraw()
	var delay := clampf((_ai.reaction_time if _ai else 0.5) * 1.8, 0.5, 2.5)
	await get_tree().create_timer(delay).timeout
	if not _handling_fault:
		ball.launch(player2.position, target, 14.0, lerpf(130.0, 220.0, acc))


# ── Shot handling ──────────────────────────────────────────────────────────────

func _on_player_swung(shot_type: ShotData.Type, aim_dir: Vector2, shooter_side: int) -> void:
	if _handling_fault or _serve_state != ServeState.NONE:
		return

	var shooter: Player = player1 if shooter_side == 1 else player2
	var dist := shooter.position.distance_to(ball.position)
	if dist > Player.CONTACT_RADIUS:
		return

	var is_volley := ball.is_primary_flight
	var params    := ShotData.PARAMS[shot_type]
	if ball.height < params["min_ball_height"]:
		return

	var fault := rules.check_shot(shooter_side, shooter.position, is_volley)
	if fault != RulesEngine.Fault.NONE:
		_trigger_fault(fault, shooter_side)
		return

	var timing := clampf(
		1.0 - (dist - Player.OPTIMAL_RADIUS) / (Player.CONTACT_RADIUS - Player.OPTIMAL_RADIUS),
		0.0, 1.0
	)
	var target := _compute_target(shot_type, aim_dir, shooter_side, timing)

	if not rules.check_net_clearance(shooter.position, target, params["peak_height"]):
		_trigger_fault(RulesEngine.Fault.NET, shooter_side)
		return

	ball.launch(shooter.position, target, params["peak_height"], params["speed_px_per_sec"])
	AudioManager.play_shot_sfx(shot_type)

	# ── Stat tracking ──────────────────────────────────────────────────────
	_rally_length += 1
	_max_rally     = maxi(_max_rally, _rally_length)
	# Kitchen play: valid dink or drop shot from near NVZ (shooter side 1 only)
	if shooter_side == 1 and (shot_type == ShotData.Type.DINK or shot_type == ShotData.Type.DROP_SHOT):
		_kitchen_plays += 1
	# Crowd builds with rally length
	AudioManager.set_crowd_intensity(minf(_rally_length / 8.0, 1.0))


# ── Ball events ────────────────────────────────────────────────────────────────

func _on_ball_landed(pos: Vector2) -> void:
	if _handling_fault:
		return
	AudioManager.play_sfx("bounce")
	var shooter_side := _last_shooter_side()
	var fault        := rules.check_landing(pos, shooter_side)
	if fault != RulesEngine.Fault.NONE:
		_trigger_fault(fault, shooter_side)
		return
	rules.on_ball_bounced(pos)


func _on_ball_at_rest(_pos: Vector2) -> void:
	pass   # AIController drives returns via swung signal


# ── Fault flow ─────────────────────────────────────────────────────────────────

func _trigger_fault(fault: RulesEngine.Fault, faulting_side: int) -> void:
	_handling_fault = true
	serve_ui.hide_serve()
	player1.movement_locked = false
	_rally_length = 0   # reset rally on each point
	AudioManager.play_sfx("fault")
	AudioManager.set_crowd_intensity(0.0)   # crowd hushes on fault

	if faulting_side == 1:
		_fault_count += 1   # only track player's own faults

	Engine.time_scale = 0.0
	await get_tree().create_timer(0.3, true, false, true).timeout
	Engine.time_scale = 1.0

	hud.show_fault(RulesEngine.FAULT_LABEL[fault])
	rules.resolve_fault(faulting_side)
	_refresh_hud()

	var game_winner := rules.check_game_win()
	if game_winner != 0:
		var match_winner := rules.advance_game(game_winner)
		_refresh_hud()
		if match_winner != 0:
			_on_match_over(match_winner)
			return

	await get_tree().create_timer(1.8).timeout
	_reset_serve()


# ── Match over ─────────────────────────────────────────────────────────────────

func _on_match_over(winner: int) -> void:
	_handling_fault = true
	AudioManager.stop_music()
	AudioManager.disable_crowd()

	var won       := winner == 1
	var score_diff := rules.p1_score - rules.p2_score if won else 0
	var stars      := StarRating.calculate(score_diff, _fault_count, _max_rally, _kitchen_plays) if won else 0

	# Write results to GameState
	GameState.result_winner        = winner
	GameState.result_p1_score      = rules.p1_score
	GameState.result_p2_score      = rules.p2_score
	GameState.result_p1_games      = rules.p1_games
	GameState.result_p2_games      = rules.p2_games
	GameState.result_faults        = _fault_count
	GameState.result_max_rally     = _max_rally
	GameState.result_kitchen_plays = _kitchen_plays
	GameState.result_stars         = stars
	GameState.result_unlocks       = []

	# Persist circuit progress
	if won and GameState.game_mode == "circuit":
		SaveManager.complete_tier(GameState.circuit_tier, stars)

	# Trigger character unlocks
	if won:
		var all_chars := CharacterData.get_all()
		for c in all_chars:
			var ut := c.get("unlock_tier", -1) as int
			if ut == GameState.circuit_tier and GameState.game_mode == "circuit":
				if SaveManager.unlock_character(c["id"]):
					GameState.result_unlocks.append(c["id"])

	# Hall of Fame
	var elapsed := (Time.get_ticks_usec() - _match_start_us) / 1_000_000.0
	SaveManager.update_hall_of_fame(_max_rally, _kitchen_plays, absi(score_diff), elapsed)

	hud.show_fault("%s WINS!" % ("PLAYER 1" if won else "PLAYER 2"))

	await get_tree().create_timer(2.2).timeout
	ScreenWipe.go("res://scenes/menus/Results.tscn")


# ── Helpers ────────────────────────────────────────────────────────────────────

func _service_side_for(serving_side: int) -> int:
	var score := rules.p1_score if serving_side == 1 else rules.p2_score
	return 1 if score % 2 == 0 else -1


func _compute_target(shot_type: ShotData.Type, aim_dir: Vector2,
		shooter_side: int, timing: float) -> Vector2:
	var p      := ShotData.PARAMS[shot_type]
	var spread := lerpf(p["spread_late"], p["spread_optimal"], timing)
	# Apply character consistency stat for human player
	if shooter_side == 1:
		spread *= _player_spread_mod

	var deep_y: float
	var kitch_y: float
	if shooter_side == 1:
		deep_y  = Court.COURT_TOP    + 22.0
		kitch_y = Court.KITCHEN_FAR  +  8.0
	else:
		deep_y  = Court.COURT_BOTTOM - 22.0
		kitch_y = Court.KITCHEN_NEAR -  8.0

	var base_y: float
	match shot_type:
		ShotData.Type.DINK, ShotData.Type.DROP_SHOT: base_y = kitch_y
		_:                                            base_y = deep_y

	var base_x := Court.CENTER_X + aim_dir.x * 50.0
	# Rooftop wind drifts lob targets horizontally
	var wind_drift := _wind_x if shot_type == ShotData.Type.LOB else 0.0
	return Vector2(
		clampf(base_x + wind_drift + randf_range(-spread,       spread      ), Court.COURT_LEFT + 4.0, Court.COURT_RIGHT  - 4.0),
		clampf(base_y             + randf_range(-spread * 0.4, spread * 0.4), Court.COURT_TOP  + 4.0, Court.COURT_BOTTOM - 4.0)
	)


func _last_shooter_side() -> int:
	return 1 if ball.position.y <= Court.NET_Y else -1


func _refresh_hud() -> void:
	hud.update_score(rules.p1_score, rules.p2_score,
	                 rules.p1_games, rules.p2_games,
	                 rules.current_game, rules.serving_side)


func _run_zone_sanity_checks() -> void:
	assert(court.is_in_kitchen(Vector2(Court.CENTER_X, Court.NET_Y)),            "FAIL: net centre in kitchen")
	assert(not court.is_in_kitchen(Vector2(Court.CENTER_X, Court.COURT_BOTTOM)), "FAIL: baseline not in kitchen")
	assert(court.is_out_of_bounds(Vector2(0.0, 0.0)),                            "FAIL: (0,0) OOB")
	assert(not court.is_out_of_bounds(Vector2(Court.CENTER_X, Court.NET_Y)),     "FAIL: court centre in bounds")
	print("[MatchManager] Zone sanity checks passed.")


# ── Venue environmental effects ────────────────────────────────────────────────

func _setup_venue_effects() -> void:
	var venue_id := GameState.venue_id
	var tier     := VenueData.get_tier(GameState.circuit_tier)
	# For Quick Match (no circuit tier) derive effect from venue_id directly
	var effect   := tier.get("env_effect", "none") if GameState.game_mode == "circuit" \
	                else _effect_for_venue(venue_id)

	match effect:
		"sun_glare":
			# Schedule a one-shot glare 10–40 seconds into the match
			var delay := randf_range(10.0, 40.0)
			get_tree().create_timer(delay).timeout.connect(_trigger_sun_glare)

		"wind":
			# Random left/right wind of ±12–22 px applied to lob targets
			_wind_x = randf_range(12.0, 22.0) * (1.0 if randf() > 0.5 else -1.0)
			print("[Venue] Wind enabled: %.1f px" % _wind_x)

		"reduced_lob_vis":
			# Car Park — ball shadow fades at apex
			ball.shadow_fade_at_apex = true

		"crowd":
			# Indoor/Stadium venues — start crowd ambience
			AudioManager.enable_crowd()

	# Start venue music
	AudioManager.play_music(venue_id)


func _effect_for_venue(vid: String) -> String:
	# Maps venue id → effect for non-circuit (Quick Match) games
	match vid:
		"garden":           return "sun_glare"
		"car_park":         return "reduced_lob_vis"
		"rooftop":          return "wind"
		"indoor_arena", "national_stadium", "grand_final": return "crowd"
	return "none"


func _trigger_sun_glare() -> void:
	if _sun_glare_used or _handling_fault:
		return
	_sun_glare_used = true
	ball.visible    = false
	hud.show_fault("SUN GLARE!")
	await get_tree().create_timer(0.5).timeout
	ball.visible = true
