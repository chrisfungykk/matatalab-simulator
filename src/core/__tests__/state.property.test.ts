// Feature: matatalab-simulator, Property 15: Reset preserves program but restores bot state
// Feature: matatalab-simulator, Property 18: Challenge loading initializes state correctly
// Feature: matatalab-simulator, Property 26: Timer expiry stops execution
// Feature: matatalab-simulator, Property 27: Speed change applies to next step
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { simulatorReducer, createInitialState } from '../simulatorReducer';
import type {
  ChallengeConfig,
  Direction,
  Position,
  BlockType,
  SpeedSetting,
} from '../types';
import { DEFAULT_BLOCK_INVENTORY, SPEED_DELAYS } from '../types';

// ── Helpers ─────────────────────────────────────────────────────────

const ALL_DIRECTIONS: Direction[] = ['north', 'east', 'south', 'west'];

const PLACEABLE_BLOCK_TYPES: BlockType[] = [
  'forward', 'backward', 'turn_left', 'turn_right',
  'loop_begin', 'loop_end', 'function_call',
  'number_2', 'number_3', 'number_4', 'number_5', 'number_random',
  'fun_random_move', 'fun_music', 'fun_dance',
];

const ALL_BLOCK_TYPES: BlockType[] = [
  'forward', 'backward', 'turn_left', 'turn_right',
  'loop_begin', 'loop_end', 'function_define', 'function_call',
  'number_2', 'number_3', 'number_4', 'number_5', 'number_random',
  'fun_random_move', 'fun_music', 'fun_dance',
];

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

// ── Arbitraries ─────────────────────────────────────────────────────

const directionArb = fc.constantFrom<Direction>(...ALL_DIRECTIONS);
const difficultyArb = fc.constantFrom<'easy' | 'medium' | 'hard'>(...DIFFICULTIES);

function positionArb(width: number, height: number): fc.Arbitrary<Position> {
  return fc.record({
    row: fc.integer({ min: 0, max: height - 1 }),
    col: fc.integer({ min: 0, max: width - 1 }),
  });
}

// Arbitrary for a block type that can be placed on the main line (line 0)
const mainLineBlockTypeArb = fc.constantFrom<BlockType>(...PLACEABLE_BLOCK_TYPES);


// ── Property 15: Reset preserves program but restores bot state ─────
// Feature: matatalab-simulator, Property 15
describe('Property 15: Reset preserves program but restores bot state', () => {
  // **Validates: Requirements 7.5**

  it('RESET restores bot to start position/direction, clears execution, preserves controlBoard', () => {
    // Generate: number of blocks to place (1-4), a modified bot position, direction, execution status
    const scenarioArb = fc.record({
      blocksToPlace: fc.array(mainLineBlockTypeArb, { minLength: 1, maxLength: 4 }),
      modifiedBotPos: fc.record({
        row: fc.integer({ min: 0, max: 3 }),
        col: fc.integer({ min: 0, max: 3 }),
      }),
      modifiedBotDir: directionArb,
      executionStatus: fc.constantFrom<'running' | 'completed' | 'error'>('running', 'completed', 'error'),
    });

    fc.assert(
      fc.property(scenarioArb, ({ blocksToPlace, modifiedBotPos, modifiedBotDir, executionStatus }) => {
        // Start from initial state
        let state = createInitialState();

        // Place blocks on the board via reducer
        for (const blockType of blocksToPlace) {
          const nextState = simulatorReducer(state, {
            type: 'PLACE_BLOCK',
            blockType,
            line: 0,
            position: state.controlBoard.lines[0]?.blocks.length ?? 0,
          });
          // Only update if placement succeeded (inventory might run out)
          if (nextState !== state) {
            state = nextState;
          }
        }

        // Capture the control board state before reset
        const boardBeforeReset = JSON.parse(JSON.stringify(state.controlBoard));

        // Simulate a modified bot state (as if execution happened)
        state = {
          ...state,
          botPosition: { ...modifiedBotPos },
          botDirection: modifiedBotDir,
          execution: {
            ...state.execution,
            status: executionStatus,
            botPosition: { ...modifiedBotPos },
            botDirection: modifiedBotDir,
            stepCount: 5,
            collectedItems: ['0,1', '2,3'],
          },
          collectedItems: [{ row: 0, col: 1 }, { row: 2, col: 3 }],
        };

        // Dispatch RESET
        const resetState = simulatorReducer(state, { type: 'RESET' });

        // Bot position restored to start
        expect(resetState.botPosition).toEqual(state.botStartPosition);
        // Bot direction restored to start
        expect(resetState.botDirection).toBe(state.botStartDirection);
        // Execution state is idle
        expect(resetState.execution.status).toBe('idle');
        expect(resetState.execution.stepCount).toBe(0);
        expect(resetState.execution.collectedItems).toEqual([]);
        // Collected items cleared
        expect(resetState.collectedItems).toEqual([]);
        // Control board blocks preserved
        expect(JSON.parse(JSON.stringify(resetState.controlBoard))).toEqual(boardBeforeReset);
      }),
      { numRuns: 100 },
    );
  });
});


// ── Property 18: Challenge loading initializes state correctly ───────
// Feature: matatalab-simulator, Property 18
describe('Property 18: Challenge loading initializes state correctly', () => {
  // **Validates: Requirements 1.1, 1.3, 9.2**

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

  it('LOAD_CHALLENGE sets grid, bot, obstacles, goals, collectibles, inventory, and clears board/execution', () => {
    fc.assert(
      fc.property(challengeConfigWithTimeLimitArb, (config) => {
        // Start from a state that has some blocks on the board
        let state = createInitialState();
        state = simulatorReducer(state, {
          type: 'PLACE_BLOCK',
          blockType: 'forward',
          line: 0,
          position: 0,
        });

        // Dispatch LOAD_CHALLENGE
        const loaded = simulatorReducer(state, { type: 'LOAD_CHALLENGE', config });

        // Grid dimensions match config
        expect(loaded.grid.width).toBe(config.grid.width);
        expect(loaded.grid.height).toBe(config.grid.height);

        // Obstacles, goals, collectibles placed at specified positions
        expect(loaded.grid.obstacles).toEqual(config.obstacles);
        expect(loaded.grid.goals).toEqual(config.goals);
        expect(loaded.grid.collectibles).toEqual(config.collectibles);

        // Bot at start position with start direction
        expect(loaded.botPosition).toEqual({ row: config.start.row, col: config.start.col });
        expect(loaded.botDirection).toBe(config.start.direction);
        expect(loaded.botStartPosition).toEqual({ row: config.start.row, col: config.start.col });
        expect(loaded.botStartDirection).toBe(config.start.direction);

        // Block inventory: DEFAULT merged with challenge overrides
        const expectedInventory = { ...DEFAULT_BLOCK_INVENTORY, ...config.blockInventory };
        expect(loaded.blockInventory).toEqual(expectedInventory);

        // Control board cleared
        expect(loaded.controlBoard.lines).toEqual([]);

        // Execution state is idle
        expect(loaded.execution.status).toBe('idle');
        expect(loaded.execution.stepCount).toBe(0);
        expect(loaded.execution.collectedItems).toEqual([]);

        // Collected items cleared
        expect(loaded.collectedItems).toEqual([]);

        // Current challenge set
        expect(loaded.currentChallenge).toBe(config);
      }),
      { numRuns: 100 },
    );
  });
});


// ── Property 26: Timer expiry stops execution ───────────────────────
// Feature: matatalab-simulator, Property 26: Timer expiry stops execution
describe('Property 26: Timer expiry stops execution', () => {
  // **Validates: Requirements 10.3**

  it('TIMER_EXPIRED sets execution status to error and stops the timer', () => {
    const scenarioArb = fc.record({
      botPos: fc.record({
        row: fc.integer({ min: 0, max: 3 }),
        col: fc.integer({ min: 0, max: 3 }),
      }),
      botDir: directionArb,
      timerDuration: fc.integer({ min: 1, max: 600 }),
      timerRemaining: fc.integer({ min: 0, max: 600 }),
      stepCount: fc.integer({ min: 0, max: 100 }),
    });

    fc.assert(
      fc.property(scenarioArb, ({ botPos, botDir, timerDuration, timerRemaining, stepCount }) => {
        // Build a state with running execution and an active timer
        let state = createInitialState();
        state = {
          ...state,
          botPosition: { ...botPos },
          botDirection: botDir,
          execution: {
            ...state.execution,
            status: 'running',
            botPosition: { ...botPos },
            botDirection: botDir,
            stepCount,
          },
          timer: {
            enabled: true,
            duration: timerDuration,
            remaining: timerRemaining,
            running: true,
          },
        };

        // Dispatch TIMER_EXPIRED
        const result = simulatorReducer(state, { type: 'TIMER_EXPIRED' });

        // Execution status should be 'error' (timeout)
        expect(result.execution.status).toBe('error');
        // Timer should stop running
        expect(result.timer.running).toBe(false);
      }),
      { numRuns: 100 },
    );
  });
});


// ── Property 27: Speed change applies to next step ──────────────────
// Feature: matatalab-simulator, Property 27: Speed change applies to next step
describe('Property 27: Speed change applies to next step', () => {
  // **Validates: Requirements 16.2**

  const speedSettingArb = fc.constantFrom<SpeedSetting>('slow', 'normal', 'fast');

  // Generate a pair of different speed settings (initial, new)
  const speedPairArb = speedSettingArb.chain(initial =>
    fc.constantFrom<SpeedSetting>(
      ...(['slow', 'normal', 'fast'] as const).filter(s => s !== initial)
    ).map(newSpeed => ({ initial, newSpeed }))
  );

  it('SET_SPEED updates state.speed and SPEED_DELAYS[state.speed] matches the new speed delay', () => {
    fc.assert(
      fc.property(speedPairArb, ({ initial, newSpeed }) => {
        // Create state with the initial speed
        let state = createInitialState();
        state = { ...state, speed: initial };

        // Verify initial speed is set
        expect(state.speed).toBe(initial);
        expect(SPEED_DELAYS[state.speed]).toBe(SPEED_DELAYS[initial]);

        // Dispatch SET_SPEED with the new speed
        const updatedState = simulatorReducer(state, { type: 'SET_SPEED', speed: newSpeed });

        // state.speed equals the new speed
        expect(updatedState.speed).toBe(newSpeed);

        // SPEED_DELAYS[state.speed] equals the expected delay for the new speed, not the old one
        expect(SPEED_DELAYS[updatedState.speed]).toBe(SPEED_DELAYS[newSpeed]);
        expect(SPEED_DELAYS[updatedState.speed]).not.toBe(SPEED_DELAYS[initial]);
      }),
      { numRuns: 100 },
    );
  });
});
