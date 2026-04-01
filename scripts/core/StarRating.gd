class_name StarRating

## Calculates a 1–3 star rating for a won match.
## Returns 0 if the player did not win.
##
## Scoring rubric (max 8 points → maps to stars):
##   Score differential  0-2 pts
##   Fault discipline    0-3 pts
##   Longest rally       0-2 pts
##   Kitchen plays       0-1 pt
##
##   ≥ 7 pts = 3 stars
##   ≥ 4 pts = 2 stars
##   < 4 pts = 1 star

static func calculate(
		score_diff:    int,
		fault_count:   int,
		max_rally:     int,
		kitchen_plays: int
) -> int:
	var pts := 0

	# Score differential
	if score_diff >= 6:
		pts += 2
	elif score_diff >= 3:
		pts += 1

	# Fault discipline
	if fault_count == 0:
		pts += 3
	elif fault_count <= 2:
		pts += 2
	elif fault_count <= 5:
		pts += 1

	# Rally length
	if max_rally >= 14:
		pts += 2
	elif max_rally >= 7:
		pts += 1

	# Kitchen plays
	if kitchen_plays >= 5:
		pts += 1

	if pts >= 7: return 3
	if pts >= 4: return 2
	return 1
