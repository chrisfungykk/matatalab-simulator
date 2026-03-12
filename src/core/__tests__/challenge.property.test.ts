// Feature: matatalab-simulator, Property 21: Challenge configuration round-trip
// Feature: matatalab-simulator, Property 22: Invalid challenge configuration JSON is rejected
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { parseChallenge, prettyPrintChallenge } from '../challengeParser';
import type { ChallengeConfig, Direction, Position, BlockType } from '../types';

// ── Helpers ─────────────────────────────────────────────────────────

const ALL_DIRECTIONS: Direction[] = ['north', 'east', 'south', 'west'];
const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

const ALL_BLOCK_TYPES: BlockType[] = [
  'forward', 'backward', 'turn_left', 'turn_right',
  'loop_begin', 'loop_end', 'function_define', 'function_call',
  'number_2', 'number_3', 'number_4', 'number_5', 'number_random',
  'fun_random_move', 'fun_music', 'fun_dance',
];

// ── Arbitraries ─────────────────────────────────────────────────────

const directionArb = fc.constantFrom<Direction>(...ALL_DIRECTIONS);
const difficultyArb = fc.constantFrom<'easy' | 'medium' | 'hard'>(...DIFFICULTIES);

function positionArb(width: number, height: number): fc.Arbitrary<Position> {
  return fc.record({
    row: fc.integer({ min: 0, max: height - 1 }),
    col: fc.integer({ min: 0, max: width - 1 }),
  });
}

const blockInventoryArb = fc.dictionary(
  fc.constantFrom(...ALL_BLOCK_TYPES),
  fc.integer({ min: 0, max: 10 }),
).map(dict => {
  const result: Partial<Record<BlockType, number>> = {};
  for (const [k, v] of Object.entries(dict)) {
    result[k as BlockType] = v;
  }
  return result;
});

const challengeConfigArb: fc.Arbitrary<ChallengeConfig> =
  fc.integer({ min: 4, max: 10 }).chain(width =>
    fc.integer({ min: 4, max: 10 }).chain(height =>
      fc.record({
        id: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
        title: fc.record({
          zh: fc.string({ minLength: 1, maxLength: 30 }),
          en: fc.string({ minLength: 1, maxLength: 30 }),
        }),
        difficulty: difficultyArb,
        grid: fc.constant({ width, height }),
        start: fc.record({
          row: fc.integer({ min: 0, max: height - 1 }),
          col: fc.integer({ min: 0, max: width - 1 }),
          direction: directionArb,
        }),
        goals: fc.array(positionArb(width, height), { minLength: 0, maxLength: 3 }),
        obstacles: fc.array(positionArb(width, height), { minLength: 0, maxLength: 5 }),
        collectibles: fc.array(positionArb(width, height), { minLength: 0, maxLength: 3 }),
        blockInventory: blockInventoryArb,
      })
    )
  );

const challengeConfigWithTimeLimitArb: fc.Arbitrary<ChallengeConfig> =
  fc.tuple(challengeConfigArb, fc.oneof(
    fc.constant(undefined),
    fc.integer({ min: 1, max: 600 }),
  )).map(([config, timeLimit]) => {
    if (timeLimit !== undefined) {
      return { ...config, timeLimit };
    }
    return config;
  });

// ── Property 21: Challenge config round-trip ────────────────────────
// Feature: matatalab-simulator, Property 21
describe('Property 21: Challenge configuration round-trip', () => {
  // **Validates: Requirements 14.1, 14.3, 14.4**

  it('parseChallenge(prettyPrintChallenge(config)) produces equivalent config', () => {
    fc.assert(
      fc.property(challengeConfigWithTimeLimitArb, (config) => {
        const json = prettyPrintChallenge(config);
        const restored = parseChallenge(json);

        expect(restored.id).toBe(config.id);
        expect(restored.title).toEqual(config.title);
        expect(restored.difficulty).toBe(config.difficulty);
        expect(restored.grid).toEqual(config.grid);
        expect(restored.start).toEqual(config.start);
        expect(restored.goals).toEqual(config.goals);
        expect(restored.obstacles).toEqual(config.obstacles);
        expect(restored.collectibles).toEqual(config.collectibles);
        expect(restored.blockInventory).toEqual(config.blockInventory);

        if (config.timeLimit !== undefined) {
          expect(restored.timeLimit).toBe(config.timeLimit);
        } else {
          expect(restored.timeLimit).toBeUndefined();
        }
      }),
      { numRuns: 150 }
    );
  });
});

// ── Property 22: Invalid challenge JSON rejected ────────────────────
// Feature: matatalab-simulator, Property 22
describe('Property 22: Invalid challenge configuration JSON is rejected', () => {
  // **Validates: Requirements 14.2**

  it('rejects invalid JSON strings', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => {
          try { JSON.parse(s); return false; } catch { return true; }
        }),
        (invalidJson) => {
          expect(() => parseChallenge(invalidJson)).toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects JSON missing required fields', () => {
    const requiredFields = ['id', 'title', 'difficulty', 'grid', 'start', 'goals', 'obstacles', 'collectibles'];
    fc.assert(
      fc.property(
        fc.constantFrom(...requiredFields),
        (fieldToOmit) => {
          const validConfig: Record<string, unknown> = {
            id: 'test',
            title: { zh: '測試', en: 'Test' },
            difficulty: 'easy',
            grid: { width: 4, height: 4 },
            start: { row: 0, col: 0, direction: 'north' },
            goals: [{ row: 3, col: 3 }],
            obstacles: [],
            collectibles: [],
          };
          delete validConfig[fieldToOmit];
          const json = JSON.stringify(validConfig);
          expect(() => parseChallenge(json)).toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects grid dimensions out of range', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer({ min: -100, max: 3 }),
          fc.integer({ min: 11, max: 100 }),
        ),
        (badDim) => {
          const json = JSON.stringify({
            id: 'test',
            title: { zh: '測試', en: 'Test' },
            difficulty: 'easy',
            grid: { width: badDim, height: 4 },
            start: { row: 0, col: 0, direction: 'north' },
            goals: [],
            obstacles: [],
            collectibles: [],
          });
          expect(() => parseChallenge(json)).toThrow(/grid width/i);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects positions out of grid bounds', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 4, max: 6 }),
        fc.integer({ min: 4, max: 6 }),
        (width, height) => {
          // Goal position out of bounds
          const json = JSON.stringify({
            id: 'test',
            title: { zh: '測試', en: 'Test' },
            difficulty: 'easy',
            grid: { width, height },
            start: { row: 0, col: 0, direction: 'north' },
            goals: [{ row: height, col: 0 }], // row == height is out of bounds
            obstacles: [],
            collectibles: [],
          });
          expect(() => parseChallenge(json)).toThrow(/outside grid bounds/i);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects non-object JSON values', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.array(fc.anything()).map(v => JSON.stringify(v)),
          fc.double().map(v => JSON.stringify(v)),
          fc.boolean().map(v => JSON.stringify(v)),
          fc.constant('null'),
          fc.constant('"hello"'),
        ),
        (json) => {
          expect(() => parseChallenge(json)).toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects invalid difficulty values', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => !['easy', 'medium', 'hard'].includes(s)),
        (badDifficulty) => {
          const json = JSON.stringify({
            id: 'test',
            title: { zh: '測試', en: 'Test' },
            difficulty: badDifficulty,
            grid: { width: 4, height: 4 },
            start: { row: 0, col: 0, direction: 'north' },
            goals: [],
            obstacles: [],
            collectibles: [],
          });
          expect(() => parseChallenge(json)).toThrow(/difficulty/i);
        }
      ),
      { numRuns: 100 }
    );
  });
});
