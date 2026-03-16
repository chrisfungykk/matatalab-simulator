import { describe, it, expect } from 'vitest';
import {
  calculateRoundScore,
  calculateStarRating,
  calculateSessionSummary,
  calculateMaxRoundScore,
  isPersonalBest,
} from '../scoreCalculation';
import type { CompetitionRound } from '../types';

// ── calculateRoundScore ─────────────────────────────────────────────

describe('calculateRoundScore', () => {
  it('perfect score: goal reached, all collectibles, optimal steps, full time', () => {
    const result = calculateRoundScore({
      goalReached: true,
      collectiblesGathered: 3,
      stepCount: 5,
      optimalSteps: 5,
      timeRemaining: 180,
      timeLimit: 180,
    });

    expect(result.basePoints).toBe(100);
    expect(result.collectibleBonus).toBe(60);
    expect(result.efficiencyBonus).toBe(50);
    expect(result.speedBonus).toBe(50);
    expect(result.total).toBe(260);
    expect(result.goalReached).toBe(true);
  });

  it('zero score: goal not reached, no collectibles, many extra steps, no time left', () => {
    const result = calculateRoundScore({
      goalReached: false,
      collectiblesGathered: 0,
      stepCount: 20,
      optimalSteps: 5,
      timeRemaining: 0,
      timeLimit: 180,
    });

    expect(result.basePoints).toBe(0);
    expect(result.collectibleBonus).toBe(0);
    expect(result.efficiencyBonus).toBe(0); // 50 - (20-5)*5 = 50 - 75 = -25 → clamped to 0
    expect(result.speedBonus).toBe(0);
    expect(result.total).toBe(0);
  });

  it('efficiency bonus clamps to 0 when steps far exceed optimal', () => {
    const result = calculateRoundScore({
      goalReached: true,
      collectiblesGathered: 0,
      stepCount: 100,
      optimalSteps: 3,
      timeRemaining: 90,
      timeLimit: 180,
    });

    expect(result.efficiencyBonus).toBe(0);
  });

  it('efficiency bonus is exactly 50 when stepCount equals optimalSteps', () => {
    const result = calculateRoundScore({
      goalReached: true,
      collectiblesGathered: 0,
      stepCount: 7,
      optimalSteps: 7,
      timeRemaining: 0,
      timeLimit: 180,
    });

    expect(result.efficiencyBonus).toBe(50);
  });

  it('speed bonus floors correctly', () => {
    // timeRemaining/timeLimit = 1/3 ≈ 0.333, × 50 = 16.666 → floor = 16
    const result = calculateRoundScore({
      goalReached: false,
      collectiblesGathered: 0,
      stepCount: 0,
      optimalSteps: 0,
      timeRemaining: 60,
      timeLimit: 180,
    });

    expect(result.speedBonus).toBe(16);
  });

  it('handles timeLimit of 0 gracefully (speed bonus = 0)', () => {
    const result = calculateRoundScore({
      goalReached: true,
      collectiblesGathered: 1,
      stepCount: 3,
      optimalSteps: 3,
      timeRemaining: 50,
      timeLimit: 0,
    });

    expect(result.speedBonus).toBe(0);
    expect(result.total).toBe(100 + 20 + 50 + 0);
  });

  it('max collectibles (5) gives 100 bonus', () => {
    const result = calculateRoundScore({
      goalReached: true,
      collectiblesGathered: 5,
      stepCount: 10,
      optimalSteps: 10,
      timeRemaining: 180,
      timeLimit: 180,
    });

    expect(result.collectibleBonus).toBe(100);
    expect(result.total).toBe(100 + 100 + 50 + 50);
  });
});

// ── calculateStarRating ─────────────────────────────────────────────

describe('calculateStarRating', () => {
  it('returns 3 stars at exactly 85% threshold', () => {
    expect(calculateStarRating(85, 100)).toBe(3);
  });

  it('returns 2 stars just below 85% threshold', () => {
    expect(calculateStarRating(84, 100)).toBe(2);
  });

  it('returns 2 stars at exactly 60% threshold', () => {
    expect(calculateStarRating(60, 100)).toBe(2);
  });

  it('returns 1 star just below 60% threshold', () => {
    expect(calculateStarRating(59, 100)).toBe(1);
  });

  it('returns 3 stars for perfect score', () => {
    expect(calculateStarRating(1000, 1000)).toBe(3);
  });

  it('returns 1 star for zero score', () => {
    expect(calculateStarRating(0, 1000)).toBe(1);
  });

  it('returns 1 star when maxPossibleScore is 0', () => {
    expect(calculateStarRating(0, 0)).toBe(1);
  });

  it('returns 3 stars when score exceeds max (edge case)', () => {
    expect(calculateStarRating(200, 100)).toBe(3);
  });
});

// ── calculateMaxRoundScore ──────────────────────────────────────────

describe('calculateMaxRoundScore', () => {
  it('returns 200 for 0 collectibles', () => {
    expect(calculateMaxRoundScore(0)).toBe(200);
  });

  it('returns 300 for 5 collectibles', () => {
    expect(calculateMaxRoundScore(5)).toBe(300);
  });
});

// ── calculateSessionSummary ─────────────────────────────────────────

describe('calculateSessionSummary', () => {
  function makeRound(roundNumber: number, score: Partial<CompetitionRound['score']>): CompetitionRound {
    const defaultScore = { goalReached: false, basePoints: 0, collectibleBonus: 0, efficiencyBonus: 0, speedBonus: 0, total: 0 };
    const fullScore = { ...defaultScore, ...score };
    return {
      roundNumber,
      challengeId: `c-${roundNumber}`,
      isRandom: false,
      score: fullScore,
      completed: true,
      timeUsed: 60,
    };
  }

  it('aggregates scores correctly across rounds', () => {
    const rounds = [
      makeRound(1, { total: 200 }),
      makeRound(2, { total: 150 }),
      makeRound(3, { total: 100 }),
    ];
    const collectibleCounts = [2, 1, 0];

    const summary = calculateSessionSummary(rounds, collectibleCounts);

    expect(summary.totalScore).toBe(450);
    // max = (200+40+50+50) + (200+20+50+50) + (200+0+50+50) = 240+220+200 = 660 (using calculateMaxRoundScore)
    // Actually: 100+40+50+50=240, 100+20+50+50=220, 100+0+50+50=200 → 660
    // 450/660 ≈ 0.6818 → 2 stars
    expect(summary.starRating).toBe(2);
  });

  it('returns 1 star for all-zero scores', () => {
    const rounds = [makeRound(1, { total: 0 }), makeRound(2, { total: 0 })];
    const summary = calculateSessionSummary(rounds, [0, 0]);

    expect(summary.totalScore).toBe(0);
    expect(summary.starRating).toBe(1);
  });

  it('returns 3 stars for perfect scores', () => {
    const rounds = [
      makeRound(1, { total: 300 }), // max for 5 collectibles
    ];
    const summary = calculateSessionSummary(rounds, [5]);

    expect(summary.totalScore).toBe(300);
    expect(summary.starRating).toBe(3);
  });

  it('handles empty rounds array', () => {
    const summary = calculateSessionSummary([], []);
    expect(summary.totalScore).toBe(0);
    expect(summary.starRating).toBe(1);
  });
});

// ── isPersonalBest ──────────────────────────────────────────────────

describe('isPersonalBest', () => {
  it('returns true when no stored best exists', () => {
    expect(isPersonalBest(100, undefined)).toBe(true);
  });

  it('returns true when score exceeds stored best', () => {
    expect(isPersonalBest(500, 400)).toBe(true);
  });

  it('returns false when score equals stored best', () => {
    expect(isPersonalBest(400, 400)).toBe(false);
  });

  it('returns false when score is below stored best', () => {
    expect(isPersonalBest(300, 400)).toBe(false);
  });

  it('returns true for zero score when no stored best', () => {
    expect(isPersonalBest(0, undefined)).toBe(true);
  });

  it('returns false for zero score when stored best is zero', () => {
    expect(isPersonalBest(0, 0)).toBe(false);
  });
});
