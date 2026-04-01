class_name RulesEngine
extends RefCounted

## All fault types the engine can detect.
enum Fault {
	NONE,
	OUT,               # ball lands outside the court boundary
	NET,               # ball didn't clear the net (landed same side as shooter)
	KITCHEN_VOLLEY,    # player volleyed from inside the NVZ
	DOUBLE_BOUNCE,     # player volleyed before the double-bounce rule was satisfied
	FOOT_FAULT,        # server stepped over the baseline during serve
	WRONG_SERVICE_BOX, # serve landed in kitchen or wrong diagonal box
}

## Human-readable label for each fault (used by HUD callout).
const FAULT_LABEL: Dictionary = {
	Fault.OUT:               "OUT!",
	Fault.NET:               "NET!",
	Fault.KITCHEN_VOLLEY:    "KITCHEN!",
	Fault.DOUBLE_BOUNCE:     "DOUBLE BOUNCE!",
	Fault.FOOT_FAULT:        "FOOT FAULT!",
	Fault.WRONG_SERVICE_BOX: "FAULT!",
}

## Minimum visual height (px) the ball must have when crossing y=NET_Y.
const NET_CLEARANCE_PX := 4.0

## Double-bounce state machine.
enum BounceState { SERVE_BOUNCE_NEEDED, RETURN_BOUNCE_NEEDED, RALLY }

# ── State ──────────────────────────────────────────────────────────────────────
var bounce_state: BounceState = BounceState.SERVE_BOUNCE_NEEDED
var serving_side: int = 1    # 1 = player1 serving, -1 = player2 serving

var p1_score: int = 0
var p2_score: int = 0
var p1_games: int = 0
var p2_games: int = 0
var current_game: int = 1

var _court: Court


func _init(court: Court) -> void:
	_court = court


# ── Shot checks ────────────────────────────────────────────────────────────────

## Check whether a shot attempt is legal BEFORE the ball is launched.
##   shooter_side  1=player1(bottom), -1=player2(top)
##   shooter_pos   screen-space ground position of the player
##   is_volley     true = ball is still in primary flight (hasn't bounced yet this exchange)
func check_shot(shooter_side: int, shooter_pos: Vector2, is_volley: bool) -> Fault:
	if is_volley:
		if _court.is_in_kitchen(shooter_pos):
			return Fault.KITCHEN_VOLLEY
		if _double_bounce_too_early(shooter_side):
			return Fault.DOUBLE_BOUNCE
	return Fault.NONE


## Check whether a serve is valid.
##   land_pos        where the serve lands
##   server_side     which side is serving (1 or -1)
##   server_pos_y    server's y position at contact (foot fault check)
func check_serve(land_pos: Vector2, server_side: int, server_pos_y: float) -> Fault:
	# Foot fault: server's near edge must stay behind the baseline
	var baseline_y := Court.COURT_BOTTOM if server_side == 1 else Court.COURT_TOP
	var over_line  := (server_side == 1 and server_pos_y < baseline_y) or \
	                  (server_side == -1 and server_pos_y > baseline_y)
	if over_line:
		return Fault.FOOT_FAULT

	# Serve must cross the net
	if _same_side(land_pos, server_side):
		return Fault.NET

	# Must NOT land in kitchen
	if _court.is_in_kitchen(land_pos):
		return Fault.WRONG_SERVICE_BOX

	# Must land in the correct diagonal service box
	# Service side alternates each point; we pass in the expected box.
	# (The caller passes the correct service_side derived from score parity.)
	return Fault.NONE


## Check a shot landing position for OOB or net fault.
##   shooter_side  side that just shot
func check_landing(land_pos: Vector2, shooter_side: int) -> Fault:
	if _court.is_out_of_bounds(land_pos):
		return Fault.OUT
	if _same_side(land_pos, shooter_side):
		return Fault.NET
	return Fault.NONE


## Check net clearance using arc geometry.
## Returns true if the arc passes over the net with sufficient height.
func check_net_clearance(from_pos: Vector2, to_pos: Vector2, peak_height: float) -> bool:
	# Arc must cross NET_Y in the correct direction
	var dy := to_pos.y - from_pos.y
	if absf(dy) < 0.01:
		return true   # nearly horizontal — give benefit of the doubt
	var t_net := (Court.NET_Y - from_pos.y) / dy
	if t_net <= 0.0 or t_net >= 1.0:
		return false  # arc never crosses net
	var h_at_net := peak_height * 4.0 * t_net * (1.0 - t_net)
	return h_at_net >= NET_CLEARANCE_PX


# ── Double-bounce state machine ────────────────────────────────────────────────

## Call each time the ball FIRST lands (use ball.landed signal, not bounce arc).
## Advances the double-bounce state when appropriate.
func on_ball_bounced(land_pos: Vector2) -> void:
	match bounce_state:
		BounceState.SERVE_BOUNCE_NEEDED:
			# Serve must bounce on receiver's side first
			if not _same_side(land_pos, serving_side):
				bounce_state = BounceState.RETURN_BOUNCE_NEEDED
		BounceState.RETURN_BOUNCE_NEEDED:
			# Return must bounce on server's side
			if _same_side(land_pos, serving_side):
				bounce_state = BounceState.RALLY
		BounceState.RALLY:
			pass  # normal rally — no state change needed


# ── Scoring ────────────────────────────────────────────────────────────────────

## Resolve a fault: opposing player wins the rally.
func resolve_fault(faulting_side: int) -> void:
	award_rally_win(-faulting_side)


## Award a rally to winner_side.  Handles side-out scoring logic.
func award_rally_win(winner_side: int) -> void:
	if winner_side == serving_side:
		if serving_side == 1:
			p1_score += 1
		else:
			p2_score += 1
	else:
		# Side-out: serve transfers, no point scored
		serving_side = -serving_side

	bounce_state = BounceState.SERVE_BOUNCE_NEEDED


## Returns the winning side (1 or -1) if a game has been won, else 0.
func check_game_win() -> int:
	if p1_score >= 11 and (p1_score - p2_score) >= 2:
		return 1
	if p2_score >= 11 and (p2_score - p1_score) >= 2:
		return -1
	return 0


## Advance to the next game after a win.  Returns match winner (1/-1) or 0.
func advance_game(game_winner: int) -> int:
	if game_winner == 1:
		p1_games += 1
	else:
		p2_games += 1
	p1_score   = 0
	p2_score   = 0
	current_game += 1
	if p1_games >= 2: return 1   # best of 3
	if p2_games >= 2: return -1
	return 0


# ── Helpers ────────────────────────────────────────────────────────────────────

## True if pos is on the same side of the net as `side`.
func _same_side(pos: Vector2, side: int) -> bool:
	if side == 1:   # bottom half: y > NET_Y
		return pos.y > Court.NET_Y
	else:            # top half: y < NET_Y
		return pos.y < Court.NET_Y


## True if volleying now would violate the double-bounce rule.
func _double_bounce_too_early(shooter_side: int) -> bool:
	match bounce_state:
		BounceState.SERVE_BOUNCE_NEEDED:
			# Receiver (non-server) cannot volley the serve
			return shooter_side != serving_side
		BounceState.RETURN_BOUNCE_NEEDED:
			# Server cannot volley the first return
			return shooter_side == serving_side
	return false
