// Feature: canvas-grid-competition-mode, Property 15
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import {
  saveSession, loadHistory,
  _setStorageAdapter, _resetStorageAdapter,
} from '../competitionPersistence';
import type { CompetitionSession, CompetitionRound, RoundScore, CompetitionTier } from '../types';

// ── Mock storage factory ────────────────────────────────────────────

function mockStore() {
  const s: Record<string, string> = {};
  return {
    s,
    adapter: {
      getItem: (k: string) => s[k] ?? null,
      setItem: (k: string, v: string) => { s[k] = v; },
      removeItem: (k: string) => { delete s[k]; },
    },
  };
}

// ── Arbitraries ─────────────────────────────────────────────────────

const roundScoreArb: fc.Arbitrary<RoundScore> = fc.record({
  goalReached: fc.boolean(),
  basePoints: fc.integer({ min: 0, max: 100 }),
  collectibleBonus: fc.integer({ min: 0, max: 100 }),
  efficiencyBonus: fc.integer({ min: 0, max: 50 }),
  speedBonus: fc.integer({ min: 0, max: 50 }),
  total: fc.integer({ min: 0, max: 300 }),
});

const competitionRoundArb: fc.Arbitrary<CompetitionRound> = fc.record({
  roundNumber: fc.integer({ min: 1, max: 10 }),
  challengeId: fc.stringMatching(/^[a-z0-9-]{1,30}$/),
  isRandom: fc.boolean(),
  score: roundScoreArb,
  completed: fc.boolean(),
  timeUsed: fc.integer({ min: 0, max: 600 }),
});

const tierArb: fc.Arbitrary<CompetitionTier> = fc.constantFrom('beginner', 'intermediate', 'advanced');

const competitionSessionArb: fc.Arbitrary<CompetitionSession> = fc.record({
  id: fc.uuid(),
  date: fc.integer({ min: 1577836800000, max: 1924905600000 }).map(ts => new Date(ts).toISOString()),
  challengeSetId: fc.stringMatching(/^[a-z0-9-]{1,30}$/),
  challengeSetName: fc.record({
    zh: fc.stringMatching(/^[\u4e00-\u9fff]{1,10}$/),
    en: fc.stringMatching(/^[A-Za-z ]{1,30}$/),
  }),
  tier: tierArb,
  rounds: fc.array(competitionRoundArb, { minLength: 1, maxLength: 8 }),
  totalScore: fc.integer({ min: 0, max: 3000 }),
  starRating: fc.constantFrom(1 as const, 2 as const, 3 as const),
});

// ── Property 15: Competition history persistence round-trip ─────────
// Feature: canvas-grid-competition-mode, Property 15
describe('Property 15: Competition history persistence round-trip', () => {
  // **Validates: Requirements 8.1, 8.2**

  let ms: ReturnType<typeof mockStore>;

  beforeEach(() => { ms = mockStore(); _setStorageAdapter(ms.adapter); });
  afterEach(() => { _resetStorageAdapter(); });

  it('persisting a session and loading produces an equivalent session object', () => {
    fc.assert(
      fc.property(competitionSessionArb, (session) => {
        // Clear store for each iteration
        for (const key of Object.keys(ms.s)) delete ms.s[key];

        const saved = saveSession(session);
        expect(saved).toBe(true);

        const history = loadHistory();
        expect(history).not.toBeNull();
        expect(history!.sessions).toHaveLength(1);

        const loaded = history!.sessions[0];
        expect(loaded.id).toBe(session.id);
        expect(loaded.date).toBe(session.date);
        expect(loaded.challengeSetId).toBe(session.challengeSetId);
        expect(loaded.challengeSetName).toEqual(session.challengeSetName);
        expect(loaded.tier).toBe(session.tier);
        expect(loaded.totalScore).toBe(session.totalScore);
        expect(loaded.starRating).toBe(session.starRating);
        expect(loaded.rounds).toEqual(session.rounds);
      }),
      { numRuns: 200 },
    );
  });
});
