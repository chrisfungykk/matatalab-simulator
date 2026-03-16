import type { RoundScore, CompetitionRound } from './types';

// ── Score Calculation ───────────────────────────────────────────────

/**
 * Calculate the score for a single competition round.
 *
 * Formula:
 * - Base points: 100 if goal reached, 0 otherwise
 * - Collectible bonus: 20 × items collected
 * - Efficiency bonus: max(0, 50 - (stepCount - optimalSteps) × 5)
 * - Speed bonus: max(0, floor(timeRemaining / timeLimit × 50))
 */
export function calculateRoundScore(params: {
  goalReached: boolean;
  collectiblesGathered: number;
  stepCount: number;
  optimalSteps: number;
  timeRemaining: number;
  timeLimit: number;
}): RoundScore {
  const { goalReached, collectiblesGathered, stepCount, optimalSteps, timeRemaining, timeLimit } = params;

  const basePoints = goalReached ? 100 : 0;
  const collectibleBonus = collectiblesGathered * 20;
  const efficiencyBonus = Math.max(0, 50 - (stepCount - optimalSteps) * 5);
  const speedBonus = timeLimit > 0
    ? Math.max(0, Math.floor((timeRemaining / timeLimit) * 50))
    : 0;

  return {
    goalReached,
    basePoints,
    collectibleBonus,
    efficiencyBonus,
    speedBonus,
    total: basePoints + collectibleBonus + efficiencyBonus + speedBonus,
  };
}

// ── Star Rating ─────────────────────────────────────────────────────

/**
 * Calculate star rating based on total score vs maximum possible.
 *
 * - 3 stars: total ≥ 85% of max
 * - 2 stars: total ≥ 60% of max
 * - 1 star:  session completed (fallback)
 */
export function calculateStarRating(totalScore: number, maxPossibleScore: number): 1 | 2 | 3 {
  if (maxPossibleScore <= 0) return 1;
  const ratio = totalScore / maxPossibleScore;
  if (ratio >= 0.85) return 3;
  if (ratio >= 0.60) return 2;
  return 1;
}

// ── Session Summary ─────────────────────────────────────────────────

/**
 * Calculate the maximum possible score for a single round.
 * max = 100 + (collectibleCount × 20) + 50 + 50
 */
export function calculateMaxRoundScore(collectibleCount: number): number {
  return 100 + collectibleCount * 20 + 50 + 50;
}

/**
 * Aggregate per-round scores into a session summary.
 * Returns totalScore and starRating.
 */
export function calculateSessionSummary(
  rounds: CompetitionRound[],
  collectibleCounts: number[],
): { totalScore: number; starRating: 1 | 2 | 3 } {
  const totalScore = rounds.reduce((sum, r) => sum + r.score.total, 0);
  const maxPossibleScore = collectibleCounts.reduce(
    (sum, count) => sum + calculateMaxRoundScore(count),
    0,
  );
  const starRating = calculateStarRating(totalScore, maxPossibleScore);
  return { totalScore, starRating };
}

// ── Personal Best ───────────────────────────────────────────────────

/**
 * Determine if a session's total score is a new personal best
 * for the given challenge set.
 */
export function isPersonalBest(
  sessionScore: number,
  storedBest: number | undefined,
): boolean {
  if (storedBest === undefined) return true;
  return sessionScore > storedBest;
}
