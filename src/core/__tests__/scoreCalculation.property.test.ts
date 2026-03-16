// Feature: canvas-grid-competition-mode, Properties 8, 9, 10, 16
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateRoundScore,
  calculateStarRating,
  calculateSessionSummary,
  calculateMaxRoundScore,
  isPersonalBest,
} from '../scoreCalculation';
import type { CompetitionRound } from '../types';

// ── Arbitraries ─────────────────────────────────────────────────────

const roundScoreParamsArb = fc.record({
  goalReached: fc.boolean(),
  collectiblesGathered: fc.integer({ min: 0, max: 5 }),
  stepCount: fc.integer({ min: 0, max: 100 }),
  optimalSteps: fc.integer({ min: 0, max: 100 }),
  timeRemaining: fc.integer({ min: 0, max: 600 }),
  timeLimit: fc.integer({ min: 1, max: 600 }),
});

function competitionRoundArb(roundNumber: number): fc.Arbitrary<{ round: CompetitionRound; collectibleCount: number }> {
  return fc.record({
    collectiblesGathered: fc.integer({ min: 0, max: 5 }),
    totalCollectibles: fc.integer({ min: 0, max: 5 }),
    stepCount: fc.integer({ min: 0, max: 100 }),
    optimalSteps: fc.integer({ min: 0, max: 100 }),
    timeRemaining: fc.integer({ min: 0, max: 600 }),
    timeLimit: fc.integer({ min: 1, max: 600 }),
    goalReached: fc.boolean(),
  }).filter(p => p.collectiblesGathered <= p.totalCollectibles)
    .map(p => {
      const score = calculateRoundScore({
        goalReached: p.goalReached,
        collectiblesGathered: p.collectiblesGathered,
        stepCount: p.stepCount,
        optimalSteps: p.optimalSteps,
        timeRemaining: p.timeRemaining,
        timeLimit: p.timeLimit,
      });
      const round: CompetitionRound = {
        roundNumber,
        challengeId: `challenge-${roundNumber}`,
        isRandom: false,
        score,
        completed: true,
        timeUsed: p.timeLimit - p.timeRemaining,
      };
      return { round, collectibleCount: p.totalCollectibles };
    });
}

// ── Property 8: Score calculation correctness ───────────────────────
// Feature: canvas-grid-competition-mode, Property 8
describe('Property 8: Score calculation correctness', () => {
  // **Validates: Requirements 6.6**

  it('produces correct components and total for any valid inputs', () => {
    fc.assert(
      fc.property(roundScoreParamsArb, (params) => {
        const result = calculateRoundScore(params);

        // Base points
        const expectedBase = params.goalReached ? 100 : 0;
        expect(result.basePoints).toBe(expectedBase);

        // Collectible bonus
        const expectedCollectible = params.collectiblesGathered * 20;
        expect(result.collectibleBonus).toBe(expectedCollectible);

        // Efficiency bonus
        const expectedEfficiency = Math.max(0, 50 - (params.stepCount - params.optimalSteps) * 5);
        expect(result.efficiencyBonus).toBe(expectedEfficiency);

        // Speed bonus
        const expectedSpeed = Math.max(0, Math.floor((params.timeRemaining / params.timeLimit) * 50));
        expect(result.speedBonus).toBe(expectedSpeed);

        // Total is sum of all components
        expect(result.total).toBe(
          result.basePoints + result.collectibleBonus + result.efficiencyBonus + result.speedBonus,
        );

        // goalReached flag preserved
        expect(result.goalReached).toBe(params.goalReached);
      }),
      { numRuns: 200 },
    );
  });
});

// ── Property 9: Star rating calculation ─────────────────────────────
// Feature: canvas-grid-competition-mode, Property 9
describe('Property 9: Star rating calculation', () => {
  // **Validates: Requirements 8.4**

  it('returns correct star rating for any total/max score pair', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }),
        fc.integer({ min: 1, max: 10000 }),
        (totalScore, maxPossibleScore) => {
          const rating = calculateStarRating(totalScore, maxPossibleScore);
          const ratio = totalScore / maxPossibleScore;

          if (ratio >= 0.85) {
            expect(rating).toBe(3);
          } else if (ratio >= 0.60) {
            expect(rating).toBe(2);
          } else {
            expect(rating).toBe(1);
          }
        },
      ),
      { numRuns: 200 },
    );
  });
});


// ── Property 10: Competition session summary correctness ────────────
// Feature: canvas-grid-competition-mode, Property 10
describe('Property 10: Competition session summary correctness', () => {
  // **Validates: Requirements 6.7**

  it('per-round scores sum to total and star rating matches', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 8 }).chain(numRounds =>
          fc.tuple(
            ...Array.from({ length: numRounds }, (_, i) => competitionRoundArb(i + 1)),
          ),
        ),
        (roundData) => {
          const rounds = roundData.map(d => d.round);
          const collectibleCounts = roundData.map(d => d.collectibleCount);

          const summary = calculateSessionSummary(rounds, collectibleCounts);

          // Total equals sum of per-round scores
          const expectedTotal = rounds.reduce((sum, r) => sum + r.score.total, 0);
          expect(summary.totalScore).toBe(expectedTotal);

          // Star rating matches independent calculation
          const maxPossible = collectibleCounts.reduce(
            (sum, c) => sum + calculateMaxRoundScore(c),
            0,
          );
          const expectedRating = calculateStarRating(expectedTotal, maxPossible);
          expect(summary.starRating).toBe(expectedRating);
        },
      ),
      { numRuns: 200 },
    );
  });
});

// ── Property 16: Personal best detection ────────────────────────────
// Feature: canvas-grid-competition-mode, Property 16
describe('Property 16: Personal best detection', () => {
  // **Validates: Requirements 8.3**

  it('flags as personal best when score exceeds stored best', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }),
        fc.integer({ min: 0, max: 10000 }),
        (sessionScore, storedBest) => {
          const result = isPersonalBest(sessionScore, storedBest);

          if (sessionScore > storedBest) {
            expect(result).toBe(true);
          } else {
            expect(result).toBe(false);
          }
        },
      ),
      { numRuns: 200 },
    );
  });

  it('flags as personal best when no stored best exists', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }),
        (sessionScore) => {
          expect(isPersonalBest(sessionScore, undefined)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});
