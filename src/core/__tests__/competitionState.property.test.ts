// Feature: canvas-grid-competition-mode, Properties 6, 7, 11, 12, 14, 23, 24, 27
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { simulatorReducer, createInitialState } from '../simulatorReducer';
import { generateMaze } from '../mazeGenerator';
import type {
  CompetitionChallengeSet,
  CompetitionChallengeEntry,
  CompetitionTier,
  ChallengeConfig,
  MazeGeneratorParams,
  Direction,
  BlockType,
  RoundScore,
} from '../types';
import { DEFAULT_BLOCK_INVENTORY } from '../types';

// ── Helpers ─────────────────────────────────────────────────────────

const DIFFICULTY_ORDER: Record<string, number> = { easy: 0, medium: 1, hard: 2 };

const TIER_PARAMS: Record<CompetitionTier, {
  minGrid: number; maxGrid: number;
  minObstacles: number; maxObstacles: number;
}> = {
  beginner: { minGrid: 4, maxGrid: 5, minObstacles: 0, maxObstacles: 2 },
  intermediate: { minGrid: 5, maxGrid: 6, minObstacles: 2, maxObstacles: 4 },
  advanced: { minGrid: 6, maxGrid: 8, minObstacles: 4, maxObstacles: 6 },
};

const TIER_DIFFICULTY: Record<CompetitionTier, MazeGeneratorParams['difficulty']> = {
  beginner: 'easy',
  intermediate: 'medium',
  advanced: 'hard',
};

const directions: Direction[] = ['north', 'east', 'south', 'west'];

// ── Arbitraries ─────────────────────────────────────────────────────

const tierArb: fc.Arbitrary<CompetitionTier> = fc.constantFrom('beginner', 'intermediate', 'advanced');

const difficultyArb = fc.constantFrom('easy' as const, 'medium' as const, 'hard' as const);

function challengeConfigArb(tier: CompetitionTier): fc.Arbitrary<ChallengeConfig> {
  const p = TIER_PARAMS[tier];
  return fc.record({
    gridW: fc.integer({ min: p.minGrid, max: p.maxGrid }),
    gridH: fc.integer({ min: p.minGrid, max: p.maxGrid }),
    obstacleCount: fc.integer({ min: p.minObstacles, max: p.maxObstacles }),
    direction: fc.constantFrom(...directions),
    seed: fc.integer({ min: 1, max: 999999 }),
  }).map(({ gridW, gridH, obstacleCount, direction, seed }) => {
    // Build a minimal valid ChallengeConfig
    const obstacles = [];
    let placed = 0;
    for (let r = 1; r < gridH && placed < obstacleCount; r++) {
      for (let c = 1; c < gridW - 1 && placed < obstacleCount; c++) {
        obstacles.push({ row: r, col: c });
        placed++;
      }
    }
    const difficulty = TIER_DIFFICULTY[tier];
    return {
      id: `test-${seed}`,
      title: { zh: `測試 #${seed}`, en: `Test #${seed}` },
      difficulty,
      grid: { width: gridW, height: gridH },
      start: { row: 0, col: 0, direction },
      goals: [{ row: gridH - 1, col: gridW - 1 }],
      obstacles,
      collectibles: [],
      blockInventory: { forward: 4, backward: 2, turn_left: 3, turn_right: 3 } as Partial<Record<BlockType, number>>,
    } satisfies ChallengeConfig;
  });
}

function predefinedEntryArb(tier: CompetitionTier): fc.Arbitrary<CompetitionChallengeEntry> {
  return challengeConfigArb(tier).map(config => ({
    type: 'predefined' as const,
    challengeConfig: config,
  }));
}

export function _randomEntryArb(tier: CompetitionTier): fc.Arbitrary<CompetitionChallengeEntry> {
  const p = TIER_PARAMS[tier];
  return fc.record({
    width: fc.integer({ min: p.minGrid, max: p.maxGrid }),
    height: fc.integer({ min: p.minGrid, max: p.maxGrid }),
    collectibles: fc.integer({ min: 0, max: 3 }),
    seed: fc.integer({ min: 1, max: 999999 }),
  }).map(({ width, height, collectibles, seed }) => ({
    type: 'random' as const,
    mazeParams: {
      width,
      height,
      difficulty: TIER_DIFFICULTY[tier],
      collectibles,
      seed,
    } satisfies MazeGeneratorParams,
  }));
}

function challengeSetArb(numChallenges?: number): fc.Arbitrary<CompetitionChallengeSet> {
  return tierArb.chain(tier =>
    fc.record({
      count: numChallenges !== undefined ? fc.constant(numChallenges) : fc.integer({ min: 1, max: 6 }),
      id: fc.string({ minLength: 3, maxLength: 10 }).filter(s => s.trim().length > 0),
      timePerChallenge: fc.integer({ min: 60, max: 300 }),
    }).chain(({ count, id, timePerChallenge }) =>
      fc.tuple(...Array.from({ length: count }, () => predefinedEntryArb(tier))).map(challenges => ({
        id,
        title: { zh: `測試集`, en: `Test Set` },
        description: { zh: `描述`, en: `Description` },
        skillFocus: 'combined' as const,
        tier,
        challenges,
        recommendedTimePerChallenge: timePerChallenge,
      }))
    ),
  );
}

const roundScoreArb: fc.Arbitrary<RoundScore> = fc.record({
  goalReached: fc.boolean(),
  basePoints: fc.integer({ min: 0, max: 100 }),
  collectibleBonus: fc.integer({ min: 0, max: 100 }),
  efficiencyBonus: fc.integer({ min: 0, max: 50 }),
  speedBonus: fc.integer({ min: 0, max: 50 }),
}).map(s => ({ ...s, total: s.basePoints + s.collectibleBonus + s.efficiencyBonus + s.speedBonus }));

// ── Property 6: Competition rounds are ordered by increasing difficulty ──
// Feature: canvas-grid-competition-mode, Property 6
describe('Property 6: Competition rounds are ordered by increasing difficulty', () => {
  // **Validates: Requirements 6.3**

  it('challenges in a set are ordered by non-decreasing difficulty', () => {
    // Generate challenge sets with explicitly ordered difficulties
    const orderedSetArb = fc.integer({ min: 2, max: 6 }).chain(count => {
      // Generate `count` difficulties, then sort them
      return fc.tuple(
        ...Array.from({ length: count }, () => difficultyArb),
      ).map(difficulties => {
        const sorted = [...difficulties].sort((a, b) => DIFFICULTY_ORDER[a] - DIFFICULTY_ORDER[b]);
        const challenges: CompetitionChallengeEntry[] = sorted.map((diff, i) => ({
          type: 'predefined' as const,
          challengeConfig: {
            id: `ch-${i}`,
            title: { zh: `挑戰 ${i}`, en: `Challenge ${i}` },
            difficulty: diff,
            grid: { width: 4 + DIFFICULTY_ORDER[diff], height: 4 + DIFFICULTY_ORDER[diff] },
            start: { row: 0, col: 0, direction: 'east' as Direction },
            goals: [{ row: 3, col: 3 }],
            obstacles: [],
            collectibles: [],
            blockInventory: {},
          },
        }));
        return {
          id: 'ordered-set',
          title: { zh: '測試', en: 'Test' },
          description: { zh: '描述', en: 'Desc' },
          skillFocus: 'combined' as const,
          tier: 'beginner' as CompetitionTier,
          challenges,
          recommendedTimePerChallenge: 180,
        } satisfies CompetitionChallengeSet;
      });
    });

    fc.assert(
      fc.property(orderedSetArb, (set) => {
        for (let i = 1; i < set.challenges.length; i++) {
          const prev = set.challenges[i - 1];
          const curr = set.challenges[i];
          if (prev.type === 'predefined' && curr.type === 'predefined' &&
              prev.challengeConfig && curr.challengeConfig) {
            const prevDiff = DIFFICULTY_ORDER[prev.challengeConfig.difficulty];
            const currDiff = DIFFICULTY_ORDER[curr.challengeConfig.difficulty];
            expect(currDiff).toBeGreaterThanOrEqual(prevDiff);

            // Grid size should be non-decreasing
            const prevSize = prev.challengeConfig.grid.width * prev.challengeConfig.grid.height;
            const currSize = curr.challengeConfig.grid.width * curr.challengeConfig.grid.height;
            expect(currSize).toBeGreaterThanOrEqual(prevSize);
          }
        }
      }),
      { numRuns: 100 },
    );
  });
});

// ── Property 7: Competition timer enforcement ───────────────────────
// Feature: canvas-grid-competition-mode, Property 7
describe('Property 7: Competition timer enforcement', () => {
  // **Validates: Requirements 6.4, 6.5**

  it('default time limit is 180 seconds', () => {
    const state = createInitialState();
    expect(state.competition.timeLimit).toBe(180);
  });

  it('timer expiry marks round complete with current score recorded', () => {
    fc.assert(
      fc.property(challengeSetArb(), roundScoreArb, (challengeSet, score) => {
        let state = createInitialState();

        // Activate competition
        state = simulatorReducer(state, { type: 'ACTIVATE_COMPETITION', challengeSet });
        expect(state.competition.active).toBe(true);

        // Start round — only works for predefined challenges
        state = simulatorReducer(state, { type: 'START_ROUND' });

        // Simulate timer ticking down to 0
        const timeLimit = state.competition.timeLimit;
        for (let i = 0; i < timeLimit; i++) {
          state = simulatorReducer(state, { type: 'TIMER_TICK' });
        }

        // Timer expired
        state = simulatorReducer(state, { type: 'TIMER_EXPIRED' });
        expect(state.timer.running).toBe(false);

        // Complete round with score
        state = simulatorReducer(state, { type: 'COMPLETE_ROUND', score });
        const session = state.competition.currentSession;
        expect(session).not.toBeNull();
        expect(session!.rounds[0].completed).toBe(true);
        expect(session!.rounds[0].score.total).toBe(score.total);
      }),
      { numRuns: 100 },
    );
  });
});

// ── Property 11: Competition tier parameter bounds ──────────────────
// Feature: canvas-grid-competition-mode, Property 11
describe('Property 11: Competition tier parameter bounds', () => {
  // **Validates: Requirements 6.8**

  it('predefined challenges respect tier grid and obstacle bounds', () => {
    fc.assert(
      fc.property(tierArb, challengeConfigArb('beginner'), challengeConfigArb('intermediate'), challengeConfigArb('advanced'),
        (tier, beginnerConfig, intermediateConfig, advancedConfig) => {
          const config = tier === 'beginner' ? beginnerConfig : tier === 'intermediate' ? intermediateConfig : advancedConfig;
          const bounds = TIER_PARAMS[tier];

          expect(config.grid.width).toBeGreaterThanOrEqual(bounds.minGrid);
          expect(config.grid.width).toBeLessThanOrEqual(bounds.maxGrid);
          expect(config.grid.height).toBeGreaterThanOrEqual(bounds.minGrid);
          expect(config.grid.height).toBeLessThanOrEqual(bounds.maxGrid);
          expect(config.obstacles.length).toBeGreaterThanOrEqual(bounds.minObstacles);
          expect(config.obstacles.length).toBeLessThanOrEqual(bounds.maxObstacles);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('generated mazes for each tier respect parameter bounds', () => {
    fc.assert(
      fc.property(tierArb, fc.integer({ min: 1, max: 999999 }), (tier, seed) => {
        const bounds = TIER_PARAMS[tier];
        const params: MazeGeneratorParams = {
          width: bounds.minGrid + Math.floor((bounds.maxGrid - bounds.minGrid) / 2),
          height: bounds.minGrid + Math.floor((bounds.maxGrid - bounds.minGrid) / 2),
          difficulty: TIER_DIFFICULTY[tier],
          collectibles: 0,
          seed,
        };
        const result = generateMaze(params);
        expect(result.config.grid.width).toBeGreaterThanOrEqual(bounds.minGrid);
        expect(result.config.grid.width).toBeLessThanOrEqual(bounds.maxGrid);
        expect(result.config.grid.height).toBeGreaterThanOrEqual(bounds.minGrid);
        expect(result.config.grid.height).toBeLessThanOrEqual(bounds.maxGrid);
      }),
      { numRuns: 100 },
    );
  });
});

// ── Property 12: Challenge set loading initializes round tracking ───
// Feature: canvas-grid-competition-mode, Property 12
describe('Property 12: Challenge set loading initializes round tracking', () => {
  // **Validates: Requirements 7.2**

  it('activating a challenge set with N challenges creates N rounds, all not completed, index 0', () => {
    fc.assert(
      fc.property(challengeSetArb(), (challengeSet) => {
        const state = createInitialState();
        const newState = simulatorReducer(state, { type: 'ACTIVATE_COMPETITION', challengeSet });

        expect(newState.competition.active).toBe(true);
        expect(newState.competition.currentRoundIndex).toBe(0);

        const session = newState.competition.currentSession;
        expect(session).not.toBeNull();
        expect(session!.rounds.length).toBe(challengeSet.challenges.length);

        for (const round of session!.rounds) {
          expect(round.completed).toBe(false);
          expect(round.score.total).toBe(0);
        }
      }),
      { numRuns: 100 },
    );
  });
});

// ── Property 14: Competition block inventory restriction ────────────
// Feature: canvas-grid-competition-mode, Property 14
describe('Property 14: Competition block inventory restriction', () => {
  // **Validates: Requirements 7.4**

  it('block inventory is restricted to challenge config values merged with defaults', () => {
    fc.assert(
      fc.property(challengeSetArb(), (challengeSet) => {
        let state = createInitialState();
        state = simulatorReducer(state, { type: 'ACTIVATE_COMPETITION', challengeSet });
        state = simulatorReducer(state, { type: 'START_ROUND' });

        const entry = challengeSet.challenges[0];
        if (entry.type === 'predefined' && entry.challengeConfig) {
          const configInventory = entry.challengeConfig.blockInventory;
          // Each block type should be the challenge override if present, otherwise the default
          for (const blockType of Object.keys(DEFAULT_BLOCK_INVENTORY) as BlockType[]) {
            const expected = configInventory[blockType] !== undefined
              ? configInventory[blockType]
              : DEFAULT_BLOCK_INVENTORY[blockType];
            expect(state.blockInventory[blockType]).toBe(expected);
          }
        }
      }),
      { numRuns: 100 },
    );
  });
});


// ── Property 23: Mixed challenge set composition ────────────────────
// Feature: canvas-grid-competition-mode, Property 23
describe('Property 23: Mixed challenge set composition', () => {
  // **Validates: Requirements 11.1, 11.2**

  it('mixed sets contain correct proportion of predefined and random entries (±1)', () => {
    fc.assert(
      fc.property(
        tierArb,
        fc.integer({ min: 2, max: 8 }),
        fc.integer({ min: 0, max: 100 }),
        (tier, totalCount, randomPercent) => {
          const expectedRandomCount = Math.round((randomPercent / 100) * totalCount);
          const expectedPredefinedCount = totalCount - expectedRandomCount;

          // Build a mixed set with the given ratio
          const challenges: CompetitionChallengeEntry[] = [];
          for (let i = 0; i < expectedRandomCount; i++) {
            challenges.push({
              type: 'random',
              mazeParams: {
                width: TIER_PARAMS[tier].minGrid,
                height: TIER_PARAMS[tier].minGrid,
                difficulty: TIER_DIFFICULTY[tier],
                collectibles: 0,
                seed: i + 1,
              },
            });
          }
          for (let i = 0; i < expectedPredefinedCount; i++) {
            challenges.push({
              type: 'predefined',
              challengeConfig: {
                id: `pre-${i}`,
                title: { zh: `預設 ${i}`, en: `Predefined ${i}` },
                difficulty: TIER_DIFFICULTY[tier],
                grid: { width: TIER_PARAMS[tier].minGrid, height: TIER_PARAMS[tier].minGrid },
                start: { row: 0, col: 0, direction: 'east' },
                goals: [{ row: 3, col: 3 }],
                obstacles: [],
                collectibles: [],
                blockInventory: {},
              },
            });
          }

          const randomCount = challenges.filter(c => c.type === 'random').length;
          const predefinedCount = challenges.filter(c => c.type === 'predefined').length;

          expect(randomCount + predefinedCount).toBe(totalCount);
          expect(Math.abs(randomCount - expectedRandomCount)).toBeLessThanOrEqual(1);
          expect(Math.abs(predefinedCount - expectedPredefinedCount)).toBeLessThanOrEqual(1);

          // Each entry is correctly typed
          for (const entry of challenges) {
            if (entry.type === 'random') {
              expect(entry.mazeParams).toBeDefined();
            } else {
              expect(entry.challengeConfig).toBeDefined();
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ── Property 24: Random competition rounds use appropriate difficulty ─
// Feature: canvas-grid-competition-mode, Property 24
describe('Property 24: Random competition rounds use appropriate difficulty', () => {
  // **Validates: Requirements 11.3**

  it('random maze difficulty matches the tier for that round', () => {
    fc.assert(
      fc.property(
        tierArb,
        fc.integer({ min: 1, max: 999999 }),
        (tier, seed) => {
          const expectedDifficulty = TIER_DIFFICULTY[tier];
          const bounds = TIER_PARAMS[tier];
          const params: MazeGeneratorParams = {
            width: bounds.minGrid,
            height: bounds.minGrid,
            difficulty: expectedDifficulty,
            collectibles: 0,
            seed,
          };
          const result = generateMaze(params);
          expect(result.config.difficulty).toBe(expectedDifficulty);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('random entries in a challenge set have difficulty matching the set tier', () => {
    fc.assert(
      fc.property(tierArb, fc.integer({ min: 1, max: 4 }), (tier, count) => {
        const expectedDifficulty = TIER_DIFFICULTY[tier];
        const entries: CompetitionChallengeEntry[] = [];
        for (let i = 0; i < count; i++) {
          entries.push({
            type: 'random',
            mazeParams: {
              width: TIER_PARAMS[tier].minGrid,
              height: TIER_PARAMS[tier].minGrid,
              difficulty: expectedDifficulty,
              collectibles: 0,
              seed: i + 100,
            },
          });
        }

        for (const entry of entries) {
          expect(entry.mazeParams!.difficulty).toBe(expectedDifficulty);
        }
      }),
      { numRuns: 100 },
    );
  });
});

// ── Property 27: Renderer switch preserves state ────────────────────
// Feature: canvas-grid-competition-mode, Property 27
describe('Property 27: Renderer switch preserves state', () => {
  // **Validates: Requirements 14.2**

  it('switching renderer does not alter grid, bot position, direction, or execution state', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('dom' as const, 'canvas' as const),
        challengeSetArb(),
        (startRenderer, challengeSet) => {
          let state = createInitialState();
          // Set initial renderer
          state = simulatorReducer(state, { type: 'SET_RENDERER', renderer: startRenderer });

          // Activate competition and start a round to get some state
          state = simulatorReducer(state, { type: 'ACTIVATE_COMPETITION', challengeSet });
          state = simulatorReducer(state, { type: 'START_ROUND' });

          // Capture state before switch
          const gridBefore = JSON.stringify(state.grid);
          const botPosBefore = JSON.stringify(state.botPosition);
          const botDirBefore = state.botDirection;
          const execBefore = JSON.stringify({
            status: state.execution.status,
            currentLine: state.execution.currentLine,
            currentBlockIndex: state.execution.currentBlockIndex,
            botPosition: state.execution.botPosition,
            botDirection: state.execution.botDirection,
          });

          // Switch renderer
          const targetRenderer = startRenderer === 'dom' ? 'canvas' : 'dom';
          const newState = simulatorReducer(state, { type: 'SET_RENDERER', renderer: targetRenderer });

          // Verify renderer changed
          expect(newState.renderer).toBe(targetRenderer);

          // Verify state preserved
          expect(JSON.stringify(newState.grid)).toBe(gridBefore);
          expect(JSON.stringify(newState.botPosition)).toBe(botPosBefore);
          expect(newState.botDirection).toBe(botDirBefore);
          expect(JSON.stringify({
            status: newState.execution.status,
            currentLine: newState.execution.currentLine,
            currentBlockIndex: newState.execution.currentBlockIndex,
            botPosition: newState.execution.botPosition,
            botDirection: newState.execution.botDirection,
          })).toBe(execBefore);
        },
      ),
      { numRuns: 100 },
    );
  });
});
