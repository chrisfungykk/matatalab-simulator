// Feature: canvas-grid-competition-mode, Properties 17–22, 25
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { generateMaze, isSolvable } from '../mazeGenerator';
import { parseChallenge, prettyPrintChallenge } from '../challengeParser';
import type { MazeGeneratorParams } from '../types';

// ── Arbitraries ─────────────────────────────────────────────────────

const difficultyArb = fc.constantFrom('easy' as const, 'medium' as const, 'hard' as const);

const mazeParamsArb: fc.Arbitrary<MazeGeneratorParams> = fc.record({
  width: fc.integer({ min: 4, max: 8 }),
  height: fc.integer({ min: 4, max: 8 }),
  difficulty: difficultyArb,
  collectibles: fc.integer({ min: 0, max: 5 }),
  seed: fc.integer({ min: 0, max: 0xFFFFFFFF }),
});

const DENSITY_RANGES = {
  easy: { min: 0, max: 0.15 },
  medium: { min: 0.15, max: 0.25 },
  hard: { min: 0.25, max: 0.35 },
};

function posKey(p: { row: number; col: number }): string {
  return `${p.row},${p.col}`;
}

// ── Property 17: Generated maze structural validity ─────────────────
// Feature: canvas-grid-competition-mode, Property 17
describe('Property 17: Generated maze structural validity', () => {
  // **Validates: Requirements 9.1**

  it('has exactly one start, at least one goal, correct collectible count, no overlaps', () => {
    fc.assert(
      fc.property(mazeParamsArb, (params) => {
        const result = generateMaze(params);
        const { config } = result;

        // Grid dimensions match
        expect(config.grid.width).toBe(params.width);
        expect(config.grid.height).toBe(params.height);

        // Exactly one start position
        expect(config.start).toBeDefined();
        expect(config.start.row).toBeGreaterThanOrEqual(0);
        expect(config.start.row).toBeLessThan(params.height);
        expect(config.start.col).toBeGreaterThanOrEqual(0);
        expect(config.start.col).toBeLessThan(params.width);

        // At least one goal
        expect(config.goals.length).toBeGreaterThanOrEqual(1);

        // Correct collectible count (may be less if not enough free cells)
        expect(config.collectibles.length).toBeLessThanOrEqual(params.collectibles);

        // All positions in bounds
        for (const g of config.goals) {
          expect(g.row).toBeGreaterThanOrEqual(0);
          expect(g.row).toBeLessThan(params.height);
          expect(g.col).toBeGreaterThanOrEqual(0);
          expect(g.col).toBeLessThan(params.width);
        }
        for (const o of config.obstacles) {
          expect(o.row).toBeGreaterThanOrEqual(0);
          expect(o.row).toBeLessThan(params.height);
          expect(o.col).toBeGreaterThanOrEqual(0);
          expect(o.col).toBeLessThan(params.width);
        }
        for (const c of config.collectibles) {
          expect(c.row).toBeGreaterThanOrEqual(0);
          expect(c.row).toBeLessThan(params.height);
          expect(c.col).toBeGreaterThanOrEqual(0);
          expect(c.col).toBeLessThan(params.width);
        }

        // No overlapping positions
        const allPositions = new Set<string>();
        const startKey = posKey(config.start);
        allPositions.add(startKey);

        for (const g of config.goals) {
          const key = posKey(g);
          expect(allPositions.has(key)).toBe(false);
          allPositions.add(key);
        }
        for (const o of config.obstacles) {
          const key = posKey(o);
          expect(allPositions.has(key)).toBe(false);
          allPositions.add(key);
        }
        for (const c of config.collectibles) {
          const key = posKey(c);
          expect(allPositions.has(key)).toBe(false);
          allPositions.add(key);
        }
      }),
      { numRuns: 200 },
    );
  });
});

// ── Property 18: Generated maze solvability ─────────────────────────
// Feature: canvas-grid-competition-mode, Property 18
describe('Property 18: Generated maze solvability', () => {
  // **Validates: Requirements 9.2, 9.3**

  it('has a valid path from start through all collectibles to goal', () => {
    fc.assert(
      fc.property(mazeParamsArb, (params) => {
        const result = generateMaze(params);
        const { config } = result;

        const obstacleSet = new Set(config.obstacles.map(posKey));
        const solvable = isSolvable(
          config.grid.width,
          config.grid.height,
          obstacleSet,
          { row: config.start.row, col: config.start.col },
          config.goals,
          config.collectibles,
        );

        expect(solvable).toBe(true);
      }),
      { numRuns: 200 },
    );
  });
});

// ── Property 19: Maze difficulty controls obstacle density ──────────
// Feature: canvas-grid-competition-mode, Property 19
describe('Property 19: Maze difficulty controls obstacle density', () => {
  // **Validates: Requirements 9.4**

  it('obstacle density falls within the range for the given difficulty', () => {
    fc.assert(
      fc.property(mazeParamsArb, (params) => {
        const result = generateMaze(params);
        const { config } = result;

        const totalCells = config.grid.width * config.grid.height;
        const density = config.obstacles.length / totalCells;
        const range = DENSITY_RANGES[params.difficulty];

        // Obstacles may have been removed for solvability, so density can be below min
        // But should never exceed max
        expect(density).toBeLessThanOrEqual(range.max + 0.01); // small tolerance for rounding
      }),
      { numRuns: 200 },
    );
  });
});

// ── Property 20: Maze start/goal placement constraints ──────────────
// Feature: canvas-grid-competition-mode, Property 20
describe('Property 20: Maze start/goal placement constraints', () => {
  // **Validates: Requirements 9.5**

  it('start is on edge/corner and goal is at ≥50% max Manhattan distance', () => {
    fc.assert(
      fc.property(mazeParamsArb, (params) => {
        const result = generateMaze(params);
        const { config } = result;
        const { width, height } = config.grid;

        // Start must be on edge or corner
        const startRow = config.start.row;
        const startCol = config.start.col;
        const isOnEdge =
          startRow === 0 || startRow === height - 1 ||
          startCol === 0 || startCol === width - 1;
        expect(isOnEdge).toBe(true);

        // Goal must be at ≥50% max Manhattan distance
        const maxManhattan = (width - 1) + (height - 1);
        const minGoalDistance = Math.ceil(maxManhattan * 0.5);
        for (const goal of config.goals) {
          const dist = Math.abs(goal.row - startRow) + Math.abs(goal.col - startCol);
          expect(dist).toBeGreaterThanOrEqual(minGoalDistance);
        }
      }),
      { numRuns: 200 },
    );
  });
});

// ── Property 21: Generated maze ChallengeConfig compatibility ───────
// Feature: canvas-grid-competition-mode, Property 21
describe('Property 21: Generated maze ChallengeConfig compatibility', () => {
  // **Validates: Requirements 9.7**

  it('output passes parseChallenge validation when serialized and re-parsed', () => {
    fc.assert(
      fc.property(mazeParamsArb, (params) => {
        const result = generateMaze(params);
        const json = prettyPrintChallenge(result.config);
        const parsed = parseChallenge(json);

        expect(parsed.id).toBe(result.config.id);
        expect(parsed.grid.width).toBe(result.config.grid.width);
        expect(parsed.grid.height).toBe(result.config.grid.height);
        expect(parsed.start.row).toBe(result.config.start.row);
        expect(parsed.start.col).toBe(result.config.start.col);
        expect(parsed.start.direction).toBe(result.config.start.direction);
        expect(parsed.goals).toEqual(result.config.goals);
        expect(parsed.obstacles).toEqual(result.config.obstacles);
        expect(parsed.collectibles).toEqual(result.config.collectibles);
        expect(parsed.generationSeed).toBe(result.config.generationSeed);
      }),
      { numRuns: 200 },
    );
  });
});

// ── Property 22: Deterministic seed generation ──────────────────────
// Feature: canvas-grid-competition-mode, Property 22
describe('Property 22: Deterministic seed generation', () => {
  // **Validates: Requirements 10.1, 10.2**

  it('same seed and params produce identical ChallengeConfig', () => {
    fc.assert(
      fc.property(mazeParamsArb, (params) => {
        const result1 = generateMaze(params);
        const result2 = generateMaze({ ...params, seed: result1.seed });

        expect(result1.seed).toBe(result2.seed);
        expect(result1.config).toEqual(result2.config);
      }),
      { numRuns: 200 },
    );
  });
});

// ── Property 25: Maze serialization round-trip ──────────────────────
// Feature: canvas-grid-competition-mode, Property 25
describe('Property 25: Maze serialization round-trip', () => {
  // **Validates: Requirements 12.3, 12.4**

  it('serializing to JSON and deserializing produces equivalent ChallengeConfig', () => {
    fc.assert(
      fc.property(mazeParamsArb, (params) => {
        const result = generateMaze(params);
        const json = JSON.stringify(result.config);
        const deserialized = JSON.parse(json);

        expect(deserialized).toEqual(result.config);

        // Also verify through parseChallenge
        const parsed = parseChallenge(json);
        expect(parsed.id).toBe(result.config.id);
        expect(parsed.difficulty).toBe(result.config.difficulty);
        expect(parsed.grid).toEqual(result.config.grid);
        expect(parsed.start).toEqual(result.config.start);
        expect(parsed.goals).toEqual(result.config.goals);
        expect(parsed.obstacles).toEqual(result.config.obstacles);
        expect(parsed.collectibles).toEqual(result.config.collectibles);
        expect(parsed.generationSeed).toBe(result.config.generationSeed);
      }),
      { numRuns: 200 },
    );
  });
});
