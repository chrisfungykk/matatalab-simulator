// Feature: matatalab-simulator, Property 4: Motion block moves bot by correct distance
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { createExecutor, checkGoalConditions } from '../executor';
import type { ControlBoardState, GridState, Position, Direction, CodingBlock, ExecutionState } from '../types';

// ── Helpers ─────────────────────────────────────────────────────────

const ALL_DIRECTIONS: Direction[] = ['north', 'east', 'south', 'west'];

const DIRECTION_DELTAS: Record<Direction, { dRow: number; dCol: number }> = {
  north: { dRow: -1, dCol: 0 },
  south: { dRow: 1, dCol: 0 },
  east: { dRow: 0, dCol: 1 },
  west: { dRow: 0, dCol: -1 },
};

const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  north: 'south',
  south: 'north',
  east: 'west',
  west: 'east',
};

const TURN_LEFT_MAP: Record<Direction, Direction> = {
  north: 'west',
  west: 'south',
  south: 'east',
  east: 'north',
};

const TURN_RIGHT_MAP: Record<Direction, Direction> = {
  north: 'east',
  east: 'south',
  south: 'west',
  west: 'north',
};

let blockIdCounter = 0;
function makeBlock(type: CodingBlock['type']): CodingBlock {
  return { id: `pb_${type}_${blockIdCounter++}`, type };
}

function makeGrid(overrides: Partial<GridState> = {}): GridState {
  return {
    width: 10,
    height: 10,
    obstacles: [],
    goals: [],
    collectibles: [],
    ...overrides,
  };
}

function runToCompletion(executor: ReturnType<typeof createExecutor>, maxSteps = 500) {
  let state = executor.getState();
  let steps = 0;
  while (state.status !== 'completed' && state.status !== 'error' && steps < maxSteps) {
    state = executor.step();
    steps++;
  }
  return state;
}

// ── Arbitraries ─────────────────────────────────────────────────────

const directionArb = fc.constantFrom<Direction>(...ALL_DIRECTIONS);

// ── Property 4: Motion block moves bot by correct distance ──────────
// Feature: matatalab-simulator, Property 4
describe('Property 4: Motion block moves bot by correct distance', () => {
  // **Validates: Requirements 4.1, 4.2, 4.3**

  const numberBlockTypes = ['number_2', 'number_3', 'number_4', 'number_5'] as const;
  const numberBlockValues: Record<string, number> = {
    number_2: 2,
    number_3: 3,
    number_4: 4,
    number_5: 5,
  };

  const motionTypeArb = fc.constantFrom<'forward' | 'backward'>('forward', 'backward');
  const numberBlockArb = fc.constantFrom(...numberBlockTypes);

  it('motion block with optional number N moves bot exactly N cells in the correct direction', () => {
    fc.assert(
      fc.property(
        directionArb,
        motionTypeArb,
        fc.option(numberBlockArb, { nil: undefined }),
        (direction, motionType, numberBlock) => {
          const steps = numberBlock ? numberBlockValues[numberBlock] : 1;

          // Compute the effective movement direction
          const moveDir = motionType === 'forward' ? direction : OPPOSITE_DIRECTION[direction];
          const delta = DIRECTION_DELTAS[moveDir];

          // Choose a start position with enough room to move without hitting boundary
          // On a 10x10 grid (rows/cols 0-9), ensure we have `steps` cells of room
          const minRow = moveDir === 'north' ? steps : 0;
          const maxRow = moveDir === 'south' ? 9 - steps : 9;
          const minCol = moveDir === 'west' ? steps : 0;
          const maxCol = moveDir === 'east' ? 9 - steps : 9;

          // Skip if no valid position exists (shouldn't happen with 10x10 and max 5 steps)
          fc.pre(minRow <= maxRow && minCol <= maxCol);

          // Pick a deterministic position in the valid range
          const startPos: Position = { row: minRow, col: minCol };

          const blocks: CodingBlock[] = [makeBlock(motionType)];
          if (numberBlock) {
            blocks.push(makeBlock(numberBlock));
          }

          const board: ControlBoardState = {
            lines: [{ lineIndex: 0, blocks }],
          };

          const executor = createExecutor(board, makeGrid(), startPos, direction, 'normal');
          const state = runToCompletion(executor);

          expect(state.status).toBe('completed');
          expect(state.botPosition).toEqual({
            row: startPos.row + delta.dRow * steps,
            col: startPos.col + delta.dCol * steps,
          });
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ── Property 5: Random number in [1, 6] ─────────────────────────────
// Feature: matatalab-simulator, Property 5
describe('Property 5: Random number block produces value in [1, 6]', () => {
  // **Validates: Requirements 4.4, 5.2**

  it('forward + number_random moves bot 1-6 cells', () => {
    fc.assert(
      fc.property(directionArb, (direction) => {
        // Start in the middle of a 10x10 grid facing the direction
        // With enough room for up to 6 cells of movement
        // Use a grid large enough that 6 steps in any direction won't hit boundary
        // 20x20 grid, starting at (10,10) gives 10 cells of room in every direction
        const grid = makeGrid({ width: 20, height: 20 });
        const safeStart: Position = { row: 10, col: 10 };

        const board: ControlBoardState = {
          lines: [{
            lineIndex: 0,
            blocks: [makeBlock('forward'), makeBlock('number_random')],
          }],
        };

        const executor = createExecutor(board, grid, safeStart, direction, 'normal');
        const state = runToCompletion(executor);

        expect(state.status).toBe('completed');

        const delta = DIRECTION_DELTAS[direction];
        const movedRow = state.botPosition.row - safeStart.row;
        const movedCol = state.botPosition.col - safeStart.col;

        // The movement should be along the direction axis only
        if (delta.dRow !== 0) {
          expect(movedCol).toBe(0);
          const cellsMoved = movedRow / delta.dRow;
          expect(cellsMoved).toBeGreaterThanOrEqual(1);
          expect(cellsMoved).toBeLessThanOrEqual(6);
          expect(Number.isInteger(cellsMoved)).toBe(true);
        } else {
          expect(movedRow).toBe(0);
          const cellsMoved = movedCol / delta.dCol;
          expect(cellsMoved).toBeGreaterThanOrEqual(1);
          expect(cellsMoved).toBeLessThanOrEqual(6);
          expect(Number.isInteger(cellsMoved)).toBe(true);
        }
      }),
      { numRuns: 100 },
    );
  });
});

// ── Property 6: Turn blocks rotate without moving ────────────────────
// Feature: matatalab-simulator, Property 6
describe('Property 6: Turn blocks rotate direction without moving', () => {
  // **Validates: Requirements 4.5, 4.6**

  it('turn_left rotates 90° CCW and turn_right rotates 90° CW, position unchanged', () => {
    const turnTypeArb = fc.constantFrom<'turn_left' | 'turn_right'>('turn_left', 'turn_right');
    const posArb = fc.record({
      row: fc.integer({ min: 0, max: 9 }),
      col: fc.integer({ min: 0, max: 9 }),
    });

    fc.assert(
      fc.property(posArb, directionArb, turnTypeArb, (pos, direction, turnType) => {
        const board: ControlBoardState = {
          lines: [{ lineIndex: 0, blocks: [makeBlock(turnType)] }],
        };

        const executor = createExecutor(board, makeGrid(), pos, direction, 'normal');
        const state = runToCompletion(executor);

        expect(state.status).toBe('completed');
        // Position must not change
        expect(state.botPosition).toEqual(pos);

        // Direction must rotate correctly
        const expectedDir = turnType === 'turn_left'
          ? TURN_LEFT_MAP[direction]
          : TURN_RIGHT_MAP[direction];
        expect(state.botDirection).toBe(expectedDir);
      }),
      { numRuns: 100 },
    );
  });
});

// ── Property 8: Loop executes N times ────────────────────────────────
// Feature: matatalab-simulator, Property 8
describe('Property 8: Loop executes enclosed sequence exactly N times', () => {
  // **Validates: Requirements 5.1**

  const loopCountArb = fc.constantFrom(
    { block: 'number_2' as const, n: 2 },
    { block: 'number_3' as const, n: 3 },
    { block: 'number_4' as const, n: 4 },
    { block: 'number_5' as const, n: 5 },
  );

  it('loop_begin + number N + forward + loop_end executes forward exactly N times', () => {
    fc.assert(
      fc.property(loopCountArb, directionArb, ({ block, n }, direction) => {
        // Ensure enough room: start far enough from edge for N forward moves
        const delta = DIRECTION_DELTAS[direction];
        const startRow = delta.dRow < 0 ? n : (delta.dRow > 0 ? 0 : 0);
        const startCol = delta.dCol < 0 ? n : (delta.dCol > 0 ? 0 : 0);
        const startPos: Position = { row: startRow, col: startCol };

        const board: ControlBoardState = {
          lines: [{
            lineIndex: 0,
            blocks: [
              makeBlock('loop_begin'),
              makeBlock(block),
              makeBlock('forward'),
              makeBlock('loop_end'),
            ],
          }],
        };

        const executor = createExecutor(board, makeGrid(), startPos, direction, 'normal');
        const state = runToCompletion(executor);

        expect(state.status).toBe('completed');
        expect(state.stepCount).toBe(n);
        expect(state.botPosition).toEqual({
          row: startPos.row + delta.dRow * n,
          col: startPos.col + delta.dCol * n,
        });
      }),
      { numRuns: 100 },
    );
  });
});

// ── Property 10: Function call executes subroutine ───────────────────
// Feature: matatalab-simulator, Property 10
describe('Property 10: Function call executes the defined subroutine', () => {
  // **Validates: Requirements 6.1, 6.4**

  it('N function_call blocks on main line execute the subroutine N times', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }),
        directionArb,
        (numCalls, direction) => {
          // Each function call executes 1 forward, so total movement = numCalls cells
          const delta = DIRECTION_DELTAS[direction];
          const startRow = delta.dRow < 0 ? numCalls : (delta.dRow > 0 ? 0 : 5);
          const startCol = delta.dCol < 0 ? numCalls : (delta.dCol > 0 ? 0 : 5);
          const startPos: Position = { row: startRow, col: startCol };

          const mainBlocks: CodingBlock[] = [];
          for (let i = 0; i < numCalls; i++) {
            mainBlocks.push(makeBlock('function_call'));
          }

          const board: ControlBoardState = {
            lines: [
              { lineIndex: 0, blocks: mainBlocks },
              {
                lineIndex: 1,
                blocks: [makeBlock('function_define'), makeBlock('forward')],
              },
            ],
          };

          const executor = createExecutor(board, makeGrid(), startPos, direction, 'normal');
          const state = runToCompletion(executor);

          expect(state.status).toBe('completed');
          expect(state.stepCount).toBe(numCalls);
          expect(state.botPosition).toEqual({
            row: startPos.row + delta.dRow * numCalls,
            col: startPos.col + delta.dCol * numCalls,
          });
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ── Property 16: Boundary violation stops execution ──────────────────
// Feature: matatalab-simulator, Property 16
describe('Property 16: Boundary violation stops execution', () => {
  // **Validates: Requirements 7.6, 8.1**

  // Generate edge positions facing outward
  const edgeFacingOutwardArb = fc.oneof(
    // Top edge (row=0) facing north
    fc.integer({ min: 0, max: 9 }).map((col) => ({
      pos: { row: 0, col } as Position,
      dir: 'north' as Direction,
    })),
    // Bottom edge (row=9) facing south
    fc.integer({ min: 0, max: 9 }).map((col) => ({
      pos: { row: 9, col } as Position,
      dir: 'south' as Direction,
    })),
    // Left edge (col=0) facing west
    fc.integer({ min: 0, max: 9 }).map((row) => ({
      pos: { row, col: 0 } as Position,
      dir: 'west' as Direction,
    })),
    // Right edge (col=9) facing east
    fc.integer({ min: 0, max: 9 }).map((row) => ({
      pos: { row, col: 9 } as Position,
      dir: 'east' as Direction,
    })),
  );

  it('forward on grid edge facing outward stops with boundary error', () => {
    fc.assert(
      fc.property(edgeFacingOutwardArb, ({ pos, dir }) => {
        const board: ControlBoardState = {
          lines: [{ lineIndex: 0, blocks: [makeBlock('forward')] }],
        };

        const executor = createExecutor(board, makeGrid(), pos, dir, 'normal');
        const state = runToCompletion(executor);

        expect(state.status).toBe('error');
        expect(state.errorInfo?.type).toBe('BOUNDARY_VIOLATION');
        // Bot should remain at original position
        expect(state.botPosition).toEqual(pos);
      }),
      { numRuns: 100 },
    );
  });
});

// ── Property 17: Obstacle collision stops execution ──────────────────
// Feature: matatalab-simulator, Property 17
describe('Property 17: Obstacle collision stops execution', () => {
  // **Validates: Requirements 7.7, 8.2**

  it('moving into an adjacent obstacle stops with collision error', () => {
    fc.assert(
      fc.property(directionArb, (direction) => {
        // Place bot in center, obstacle in the direction it faces
        const startPos: Position = { row: 5, col: 5 };
        const delta = DIRECTION_DELTAS[direction];
        const obstaclePos: Position = {
          row: startPos.row + delta.dRow,
          col: startPos.col + delta.dCol,
        };

        const grid = makeGrid({ obstacles: [obstaclePos] });

        const board: ControlBoardState = {
          lines: [{ lineIndex: 0, blocks: [makeBlock('forward')] }],
        };

        const executor = createExecutor(board, grid, startPos, direction, 'normal');
        const state = runToCompletion(executor);

        expect(state.status).toBe('error');
        expect(state.errorInfo?.type).toBe('OBSTACLE_COLLISION');
        // Bot should remain at original position
        expect(state.botPosition).toEqual(startPos);
      }),
      { numRuns: 100 },
    );
  });
});

// ── Property 24: Non-movement fun blocks preserve position ───────────
// Feature: matatalab-simulator, Property 24
describe('Property 24: Non-movement fun blocks preserve position', () => {
  // **Validates: Requirements 12.2, 12.3**

  it('fun_music and fun_dance do not change position or direction', () => {
    const funBlockArb = fc.constantFrom<'fun_music' | 'fun_dance'>('fun_music', 'fun_dance');
    const posArb = fc.record({
      row: fc.integer({ min: 0, max: 9 }),
      col: fc.integer({ min: 0, max: 9 }),
    });

    fc.assert(
      fc.property(posArb, directionArb, funBlockArb, (pos, direction, funType) => {
        const board: ControlBoardState = {
          lines: [{ lineIndex: 0, blocks: [makeBlock(funType)] }],
        };

        const executor = createExecutor(board, makeGrid(), pos, direction, 'normal');
        const state = runToCompletion(executor);

        expect(state.status).toBe('completed');
        expect(state.botPosition).toEqual(pos);
        expect(state.botDirection).toBe(direction);
      }),
      { numRuns: 100 },
    );
  });
});

// ── Property 25: Random movement fun block moves 1 cell ──────────────
// Feature: matatalab-simulator, Property 25
describe('Property 25: Random movement fun block moves exactly 1 cell', () => {
  // **Validates: Requirements 12.1**

  it('fun_random_move moves exactly 1 cell (Manhattan distance) when valid moves exist', () => {
    // Use interior positions (1-8) to guarantee at least one valid adjacent cell
    const posArb = fc.record({
      row: fc.integer({ min: 1, max: 8 }),
      col: fc.integer({ min: 1, max: 8 }),
    });

    fc.assert(
      fc.property(posArb, directionArb, (pos, direction) => {
        const board: ControlBoardState = {
          lines: [{ lineIndex: 0, blocks: [makeBlock('fun_random_move')] }],
        };

        const executor = createExecutor(board, makeGrid(), pos, direction, 'normal');
        const state = runToCompletion(executor);

        expect(state.status).toBe('completed');
        const manhattan = Math.abs(state.botPosition.row - pos.row) + Math.abs(state.botPosition.col - pos.col);
        expect(manhattan).toBe(1);
      }),
      { numRuns: 100 },
    );
  });
});

// ── Property 14: Goal checking on completion ─────────────────────────
// Feature: matatalab-simulator, Property 14
describe('Property 14: Goal checking on execution completion', () => {
  // **Validates: Requirements 7.4, 9.4**

  it('checkGoalConditions returns true iff bot on goal AND all collectibles collected', () => {
    // Generate a grid with random goals and collectibles
    const posArb = fc.record({
      row: fc.integer({ min: 0, max: 9 }),
      col: fc.integer({ min: 0, max: 9 }),
    });

    const scenarioArb = fc.record({
      botPos: posArb,
      goals: fc.array(posArb, { minLength: 1, maxLength: 3 }),
      collectibles: fc.array(posArb, { minLength: 0, maxLength: 4 }),
      collectAll: fc.boolean(),
    });

    fc.assert(
      fc.property(scenarioArb, ({ botPos, goals, collectibles, collectAll }) => {
        const grid: GridState = {
          width: 10,
          height: 10,
          obstacles: [],
          goals,
          collectibles,
        };

        const onGoal = goals.some((g) => g.row === botPos.row && g.col === botPos.col);

        // Build collected items list
        const collectedItems = collectAll
          ? collectibles.map((c) => `${c.row},${c.col}`)
          : []; // collect none

        const allCollected = collectibles.every((c) =>
          collectedItems.includes(`${c.row},${c.col}`),
        );

        const state: ExecutionState = {
          status: 'completed',
          currentLine: 0,
          currentBlockIndex: 0,
          botPosition: botPos,
          botDirection: 'north',
          collectedItems,
          loopCounters: new Map(),
          callStack: [],
          stepCount: 0,
        };

        const result = checkGoalConditions(state, grid);
        const expected = onGoal && allCollected;
        expect(result).toBe(expected);
      }),
      { numRuns: 100 },
    );
  });
});
