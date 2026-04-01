// StarRating — pure calculation, no side effects.
export function calculate(scoreDiff, faultCount, maxRally, kitchenPlays) {
  let score = 0;
  if (scoreDiff >= 3)   score += 3;
  else if (scoreDiff >= 1) score += 2;
  else score += 1;

  if (faultCount === 0)      score += 2;
  else if (faultCount <= 2)  score += 1;

  if (maxRally >= 10)        score += 2;
  else if (maxRally >= 5)    score += 1;

  if (kitchenPlays >= 5)     score += 1;

  if (score >= 7) return 3;
  if (score >= 4) return 2;
  return 1;
}
