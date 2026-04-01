## GameState — Autoload that carries configuration between scenes.
##
## Set fields before calling get_tree().change_scene_to_file().
## MatchManager reads from here at startup.
extends Node

# ── Match configuration ────────────────────────────────────────────────────────
## "quick" | "circuit" | "tournament" | "practice"
var game_mode:       String = "quick"

var player_id:       String = "suki"
var opponent_id:     String = "colonel"
var ai_difficulty:   String = "Medium"
var circuit_tier:    int    = 1   # 1-based tier index
var venue_id:        String = "garden"   # set before entering Match scene

# ── Character-select context ───────────────────────────────────────────────────
## "player" = picking player character
## "opponent" = picking opponent (Quick Match only)
var char_select_role: String = "player"

# ── Post-match results (written by MatchManager) ──────────────────────────────
var result_winner:        int = 0    # 1=player1, -1=player2
var result_p1_score:      int = 0
var result_p2_score:      int = 0
var result_p1_games:      int = 0
var result_p2_games:      int = 0
var result_faults:        int = 0
var result_max_rally:     int = 0
var result_kitchen_plays: int = 0
var result_stars:         int = 0    # 0 = loss, 1-3 = win quality
var result_unlocks:       Array[String] = []   # character ids newly unlocked
