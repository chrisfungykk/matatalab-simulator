import { describe, it, expect } from 'vitest';
import { createExecutor, checkGoalConditions } from '../executor';
import type { ControlBoardState, GridState, CodingBlock, ExecutionState } from '../types';

function makeBlock(type: CodingBlock['type'], id?: string): CodingBlock {
  return { id: id ?? type, type };
}

const defaultGrid: GridState = {
  width: 10,
  height: 10,
  obstacles: [],
  goals: [],
  collectibles: [],
};

function runToCompletion(executor: ReturnType<typeof createExecutor>, maxSteps = 200) {
  let state = executor.getState();
  let steps = 0;
  while (state.status !== 'completed' && state.status !== 'error' && steps < maxSteps) {
    state = executor.step();
    steps++;
  }
  return state;
}

describe('Executor - Loop execution', () => {
  it('executes a simple loop N times', () => {
    // loop_begin, number_3, forward, loop_end
    // Should execute forward 3 times → move 3 cells
    const board: ControlBoardState = {
      lines: [{
        lineIndex: 0,
        blocks: [
          makeBlock('loop_begin', 'lb1'),
          makeBlock('number_3', 'n3'),
          makeBlock('forward', 'f1'),
          makeBlock('loop_end', 'le1'),
        ],
      }],
    };

    const executor = createExecutor(board, defaultGrid, { row: 0, col: 0 }, 'south', 'normal');
    const state = runToCompletion(executor);

    expect(state.status).toBe('completed');
    expect(state.botPosition).toEqual({ row: 3, col: 0 });
    expect(state.stepCount).toBe(3);
  });

  it('executes a loop with number_2', () => {
    const board: ControlBoardState = {
      lines: [{
        lineIndex: 0,
        blocks: [
          makeBlock('loop_begin', 'lb1'),
          makeBlock('number_2', 'n2'),
          makeBlock('forward', 'f1'),
          makeBlock('loop_end', 'le1'),
        ],
      }],
    };

    const executor = createExecutor(board, defaultGrid, { row: 0, col: 0 }, 'east', 'normal');
    const state = runToCompletion(executor);

    expect(state.status).toBe('completed');
    expect(state.botPosition).toEqual({ row: 0, col: 2 });
    expect(state.stepCount).toBe(2);
  });

  it('executes a loop with multiple enclosed blocks', () => {
    // loop 2 times: forward, turn_right → should move forward then turn, twice
    const board: ControlBoardState = {
      lines: [{
        lineIndex: 0,
        blocks: [
          makeBlock('loop_begin', 'lb1'),
          makeBlock('number_2', 'n2'),
          makeBlock('forward', 'f1'),
          makeBlock('turn_right', 'tr1'),
          makeBlock('loop_end', 'le1'),
        ],
      }],
    };

    const executor = createExecutor(board, defaultGrid, { row: 5, col: 5 }, 'north', 'normal');
    const state = runToCompletion(executor);

    expect(state.status).toBe('completed');
    // Iteration 1: forward (north → row 4), turn_right (now east)
    // Iteration 2: forward (east → col 6), turn_right (now south)
    expect(state.botPosition).toEqual({ row: 4, col: 6 });
    expect(state.botDirection).toBe('south');
    expect(state.stepCount).toBe(4); // 2 iterations × 2 blocks
  });

  it('handles nested loops', () => {
    // outer loop 2x: inner loop 3x: forward
    // Total forwards = 2 * 3 = 6
    const board: ControlBoardState = {
      lines: [{
        lineIndex: 0,
        blocks: [
          makeBlock('loop_begin', 'lb_outer'),
          makeBlock('number_2', 'n2_outer'),
          makeBlock('loop_begin', 'lb_inner'),
          makeBlock('number_3', 'n3_inner'),
          makeBlock('forward', 'f1'),
          makeBlock('loop_end', 'le_inner'),
          makeBlock('loop_end', 'le_outer'),
        ],
      }],
    };

    const executor = createExecutor(board, defaultGrid, { row: 0, col: 0 }, 'east', 'normal');
    const state = runToCompletion(executor);

    expect(state.status).toBe('completed');
    expect(state.botPosition).toEqual({ row: 0, col: 6 });
    expect(state.stepCount).toBe(6);
  });

  it('handles blocks before and after a loop', () => {
    // forward, loop 2x: forward, forward (after loop)
    const board: ControlBoardState = {
      lines: [{
        lineIndex: 0,
        blocks: [
          makeBlock('forward', 'f_before'),
          makeBlock('loop_begin', 'lb1'),
          makeBlock('number_2', 'n2'),
          makeBlock('forward', 'f_loop'),
          makeBlock('loop_end', 'le1'),
          makeBlock('forward', 'f_after'),
        ],
      }],
    };

    const executor = createExecutor(board, defaultGrid, { row: 0, col: 0 }, 'east', 'normal');
    const state = runToCompletion(executor);

    expect(state.status).toBe('completed');
    // 1 + 2 + 1 = 4 forwards east
    expect(state.botPosition).toEqual({ row: 0, col: 4 });
    expect(state.stepCount).toBe(4);
  });

  it('cleans up loopCounters after loop completes', () => {
    const board: ControlBoardState = {
      lines: [{
        lineIndex: 0,
        blocks: [
          makeBlock('loop_begin', 'lb1'),
          makeBlock('number_2', 'n2'),
          makeBlock('forward', 'f1'),
          makeBlock('loop_end', 'le1'),
        ],
      }],
    };

    const executor = createExecutor(board, defaultGrid, { row: 0, col: 0 }, 'east', 'normal');
    const state = runToCompletion(executor);

    expect(state.status).toBe('completed');
    expect(state.loopCounters.size).toBe(0);
  });

  it('stops execution on boundary error inside a loop', () => {
    // Start at row 0, facing north. Loop 3x forward → first forward hits boundary
    const board: ControlBoardState = {
      lines: [{
        lineIndex: 0,
        blocks: [
          makeBlock('loop_begin', 'lb1'),
          makeBlock('number_3', 'n3'),
          makeBlock('forward', 'f1'),
          makeBlock('loop_end', 'le1'),
        ],
      }],
    };

    const executor = createExecutor(board, defaultGrid, { row: 0, col: 0 }, 'north', 'normal');
    const state = runToCompletion(executor);

    expect(state.status).toBe('error');
    expect(state.errorInfo?.type).toBe('BOUNDARY_VIOLATION');
  });
});

describe('Executor - Function call execution', () => {
  it('executes a simple function call with one forward in the subroutine', () => {
    // Main line: function_call
    // Function line: function_define, forward
    // Bot should move 1 cell forward
    const board: ControlBoardState = {
      lines: [
        {
          lineIndex: 0,
          blocks: [makeBlock('function_call', 'fc1')],
        },
        {
          lineIndex: 1,
          blocks: [
            makeBlock('function_define', 'fd1'),
            makeBlock('forward', 'f1'),
          ],
        },
      ],
    };

    const executor = createExecutor(board, defaultGrid, { row: 5, col: 5 }, 'east', 'normal');
    const state = runToCompletion(executor);

    expect(state.status).toBe('completed');
    expect(state.botPosition).toEqual({ row: 5, col: 6 });
    expect(state.stepCount).toBe(1);
  });

  it('executes multiple function calls in sequence', () => {
    // Main line: function_call, function_call, function_call
    // Function line: function_define, forward
    // Bot should move 3 cells forward (one per call)
    const board: ControlBoardState = {
      lines: [
        {
          lineIndex: 0,
          blocks: [
            makeBlock('function_call', 'fc1'),
            makeBlock('function_call', 'fc2'),
            makeBlock('function_call', 'fc3'),
          ],
        },
        {
          lineIndex: 1,
          blocks: [
            makeBlock('function_define', 'fd1'),
            makeBlock('forward', 'f1'),
          ],
        },
      ],
    };

    const executor = createExecutor(board, defaultGrid, { row: 5, col: 5 }, 'east', 'normal');
    const state = runToCompletion(executor);

    expect(state.status).toBe('completed');
    expect(state.botPosition).toEqual({ row: 5, col: 8 });
    expect(state.stepCount).toBe(3);
  });

  it('executes function call with multiple blocks in subroutine', () => {
    // Main line: function_call
    // Function line: function_define, forward, turn_right, forward
    const board: ControlBoardState = {
      lines: [
        {
          lineIndex: 0,
          blocks: [makeBlock('function_call', 'fc1')],
        },
        {
          lineIndex: 1,
          blocks: [
            makeBlock('function_define', 'fd1'),
            makeBlock('forward', 'f1'),
            makeBlock('turn_right', 'tr1'),
            makeBlock('forward', 'f2'),
          ],
        },
      ],
    };

    const executor = createExecutor(board, defaultGrid, { row: 5, col: 5 }, 'north', 'normal');
    const state = runToCompletion(executor);

    expect(state.status).toBe('completed');
    // forward north → (4,5), turn_right → east, forward east → (4,6)
    expect(state.botPosition).toEqual({ row: 4, col: 6 });
    expect(state.botDirection).toBe('east');
    expect(state.stepCount).toBe(3);
  });

  it('executes function call with blocks before and after on main line', () => {
    // Main line: forward, function_call, forward
    // Function line: function_define, turn_right
    const board: ControlBoardState = {
      lines: [
        {
          lineIndex: 0,
          blocks: [
            makeBlock('forward', 'f_before'),
            makeBlock('function_call', 'fc1'),
            makeBlock('forward', 'f_after'),
          ],
        },
        {
          lineIndex: 1,
          blocks: [
            makeBlock('function_define', 'fd1'),
            makeBlock('turn_right', 'tr1'),
          ],
        },
      ],
    };

    const executor = createExecutor(board, defaultGrid, { row: 5, col: 5 }, 'north', 'normal');
    const state = runToCompletion(executor);

    expect(state.status).toBe('completed');
    // forward north → (4,5), call function → turn_right → east, forward east → (4,6)
    expect(state.botPosition).toEqual({ row: 4, col: 6 });
    expect(state.botDirection).toBe('east');
    expect(state.stepCount).toBe(3);
  });

  it('executes function_define with number block repeat count', () => {
    // Main line: function_call
    // Function line: function_define, number_3, forward
    // Subroutine should execute 3 times → 3 forwards
    const board: ControlBoardState = {
      lines: [
        {
          lineIndex: 0,
          blocks: [makeBlock('function_call', 'fc1')],
        },
        {
          lineIndex: 1,
          blocks: [
            makeBlock('function_define', 'fd1'),
            makeBlock('number_3', 'n3'),
            makeBlock('forward', 'f1'),
          ],
        },
      ],
    };

    const executor = createExecutor(board, defaultGrid, { row: 5, col: 5 }, 'east', 'normal');
    const state = runToCompletion(executor);

    expect(state.status).toBe('completed');
    expect(state.botPosition).toEqual({ row: 5, col: 8 });
    expect(state.stepCount).toBe(3);
  });

  it('executes function_define with number_2 repeat and multiple blocks', () => {
    // Main line: function_call
    // Function line: function_define, number_2, forward, turn_right
    // Subroutine executes 2 times: forward+turn_right, forward+turn_right
    const board: ControlBoardState = {
      lines: [
        {
          lineIndex: 0,
          blocks: [makeBlock('function_call', 'fc1')],
        },
        {
          lineIndex: 1,
          blocks: [
            makeBlock('function_define', 'fd1'),
            makeBlock('number_2', 'n2'),
            makeBlock('forward', 'f1'),
            makeBlock('turn_right', 'tr1'),
          ],
        },
      ],
    };

    const executor = createExecutor(board, defaultGrid, { row: 5, col: 5 }, 'north', 'normal');
    const state = runToCompletion(executor);

    expect(state.status).toBe('completed');
    // Iter 1: forward north → (4,5), turn_right → east
    // Iter 2: forward east → (4,6), turn_right → south
    expect(state.botPosition).toEqual({ row: 4, col: 6 });
    expect(state.botDirection).toBe('south');
    expect(state.stepCount).toBe(4);
  });

  it('handles boundary error inside a function call', () => {
    // Main line: function_call
    // Function line: function_define, forward
    // Start at row 0 facing north → boundary error
    const board: ControlBoardState = {
      lines: [
        {
          lineIndex: 0,
          blocks: [makeBlock('function_call', 'fc1')],
        },
        {
          lineIndex: 1,
          blocks: [
            makeBlock('function_define', 'fd1'),
            makeBlock('forward', 'f1'),
          ],
        },
      ],
    };

    const executor = createExecutor(board, defaultGrid, { row: 0, col: 0 }, 'north', 'normal');
    const state = runToCompletion(executor);

    expect(state.status).toBe('error');
    expect(state.errorInfo?.type).toBe('BOUNDARY_VIOLATION');
  });

  it('cleans up callStack after function completes', () => {
    const board: ControlBoardState = {
      lines: [
        {
          lineIndex: 0,
          blocks: [makeBlock('function_call', 'fc1')],
        },
        {
          lineIndex: 1,
          blocks: [
            makeBlock('function_define', 'fd1'),
            makeBlock('forward', 'f1'),
          ],
        },
      ],
    };

    const executor = createExecutor(board, defaultGrid, { row: 5, col: 5 }, 'east', 'normal');
    const state = runToCompletion(executor);

    expect(state.status).toBe('completed');
    expect(state.callStack.length).toBe(0);
  });

  it('handles function call with loop inside subroutine', () => {
    // Main line: function_call
    // Function line: function_define, loop_begin, number_2, forward, loop_end
    // Subroutine loops forward 2 times
    const board: ControlBoardState = {
      lines: [
        {
          lineIndex: 0,
          blocks: [makeBlock('function_call', 'fc1')],
        },
        {
          lineIndex: 1,
          blocks: [
            makeBlock('function_define', 'fd1'),
            makeBlock('loop_begin', 'lb1'),
            makeBlock('number_2', 'n2'),
            makeBlock('forward', 'f1'),
            makeBlock('loop_end', 'le1'),
          ],
        },
      ],
    };

    const executor = createExecutor(board, defaultGrid, { row: 5, col: 5 }, 'east', 'normal');
    const state = runToCompletion(executor);

    expect(state.status).toBe('completed');
    expect(state.botPosition).toEqual({ row: 5, col: 7 });
    expect(state.stepCount).toBe(2);
  });

  it('handles function define on a line other than 1', () => {
    // Main line (0): function_call
    // Line 2: function_define, forward
    const board: ControlBoardState = {
      lines: [
        {
          lineIndex: 0,
          blocks: [makeBlock('function_call', 'fc1')],
        },
        {
          lineIndex: 2,
          blocks: [
            makeBlock('function_define', 'fd1'),
            makeBlock('forward', 'f1'),
          ],
        },
      ],
    };

    const executor = createExecutor(board, defaultGrid, { row: 5, col: 5 }, 'east', 'normal');
    const state = runToCompletion(executor);

    expect(state.status).toBe('completed');
    expect(state.botPosition).toEqual({ row: 5, col: 6 });
    expect(state.stepCount).toBe(1);
  });
});

describe('Executor - Fun block execution', () => {
  it('fun_music sets animationType to music without moving', () => {
    const board: ControlBoardState = {
      lines: [{
        lineIndex: 0,
        blocks: [makeBlock('fun_music', 'fm1')],
      }],
    };

    const executor = createExecutor(board, defaultGrid, { row: 5, col: 5 }, 'north', 'normal');
    const state = executor.step();

    expect(state.botPosition).toEqual({ row: 5, col: 5 });
    expect(state.botDirection).toBe('north');
    expect(state.animationType).toBe('music');
    expect(state.stepCount).toBe(1);
  });

  it('fun_dance sets animationType to dance without moving', () => {
    const board: ControlBoardState = {
      lines: [{
        lineIndex: 0,
        blocks: [makeBlock('fun_dance', 'fd1')],
      }],
    };

    const executor = createExecutor(board, defaultGrid, { row: 3, col: 3 }, 'east', 'normal');
    const state = executor.step();

    expect(state.botPosition).toEqual({ row: 3, col: 3 });
    expect(state.botDirection).toBe('east');
    expect(state.animationType).toBe('dance');
    expect(state.stepCount).toBe(1);
  });

  it('fun_random_move moves bot exactly 1 cell in a valid direction', () => {
    const board: ControlBoardState = {
      lines: [{
        lineIndex: 0,
        blocks: [makeBlock('fun_random_move', 'frm1')],
      }],
    };

    const executor = createExecutor(board, defaultGrid, { row: 5, col: 5 }, 'north', 'normal');
    const state = runToCompletion(executor);

    expect(state.status).toBe('completed');
    // Should have moved exactly 1 cell from (5,5)
    const dist = Math.abs(state.botPosition.row - 5) + Math.abs(state.botPosition.col - 5);
    expect(dist).toBe(1);
    expect(state.stepCount).toBe(1);
  });

  it('fun_random_move stays in place when completely surrounded by obstacles', () => {
    const grid: GridState = {
      width: 3,
      height: 3,
      obstacles: [
        { row: 0, col: 1 }, // north
        { row: 2, col: 1 }, // south
        { row: 1, col: 2 }, // east
        { row: 1, col: 0 }, // west
      ],
      goals: [],
      collectibles: [],
    };

    const board: ControlBoardState = {
      lines: [{
        lineIndex: 0,
        blocks: [makeBlock('fun_random_move', 'frm1')],
      }],
    };

    const executor = createExecutor(board, grid, { row: 1, col: 1 }, 'north', 'normal');
    const state = runToCompletion(executor);

    expect(state.status).toBe('completed');
    expect(state.botPosition).toEqual({ row: 1, col: 1 });
  });

  it('fun_random_move stays in place when on corner with no valid moves', () => {
    const grid: GridState = {
      width: 2,
      height: 2,
      obstacles: [
        { row: 0, col: 1 }, // east
        { row: 1, col: 0 }, // south (from 0,0 perspective: south is row+1)
      ],
      goals: [],
      collectibles: [],
    };

    // At (0,0): north is out of bounds, west is out of bounds, east is obstacle, south is obstacle
    const board: ControlBoardState = {
      lines: [{
        lineIndex: 0,
        blocks: [makeBlock('fun_random_move', 'frm1')],
      }],
    };

    const executor = createExecutor(board, grid, { row: 0, col: 0 }, 'north', 'normal');
    const state = runToCompletion(executor);

    expect(state.status).toBe('completed');
    expect(state.botPosition).toEqual({ row: 0, col: 0 });
  });

  it('fun_random_move collects items at the new position', () => {
    // Place collectibles in all 4 directions so whichever way the bot moves, it collects
    const grid: GridState = {
      width: 10,
      height: 10,
      obstacles: [],
      goals: [],
      collectibles: [
        { row: 4, col: 5 },
        { row: 6, col: 5 },
        { row: 5, col: 4 },
        { row: 5, col: 6 },
      ],
    };

    const board: ControlBoardState = {
      lines: [{
        lineIndex: 0,
        blocks: [makeBlock('fun_random_move', 'frm1')],
      }],
    };

    const executor = createExecutor(board, grid, { row: 5, col: 5 }, 'north', 'normal');
    const state = runToCompletion(executor);

    expect(state.status).toBe('completed');
    expect(state.collectedItems.length).toBe(1);
  });

  it('animationType is cleared on non-fun block step', () => {
    const board: ControlBoardState = {
      lines: [{
        lineIndex: 0,
        blocks: [
          makeBlock('fun_music', 'fm1'),
          makeBlock('forward', 'f1'),
        ],
      }],
    };

    const executor = createExecutor(board, defaultGrid, { row: 5, col: 5 }, 'east', 'normal');
    const state1 = executor.step();
    expect(state1.animationType).toBe('music');

    const state2 = executor.step();
    expect(state2.animationType).toBeUndefined();
  });
});

describe('checkGoalConditions', () => {
  const makeState = (overrides: Partial<ExecutionState> = {}): ExecutionState => ({
    status: 'completed',
    currentLine: 0,
    currentBlockIndex: 0,
    botPosition: { row: 0, col: 0 },
    botDirection: 'north',
    collectedItems: [],
    loopCounters: new Map(),
    callStack: [],
    stepCount: 0,
    ...overrides,
  });

  it('returns true when bot is on goal and all collectibles collected', () => {
    const grid: GridState = {
      width: 5, height: 5,
      obstacles: [],
      goals: [{ row: 3, col: 3 }],
      collectibles: [{ row: 1, col: 1 }, { row: 2, col: 2 }],
    };
    const state = makeState({
      botPosition: { row: 3, col: 3 },
      collectedItems: ['1,1', '2,2'],
    });
    expect(checkGoalConditions(state, grid)).toBe(true);
  });

  it('returns false when bot is not on goal', () => {
    const grid: GridState = {
      width: 5, height: 5,
      obstacles: [],
      goals: [{ row: 3, col: 3 }],
      collectibles: [],
    };
    const state = makeState({ botPosition: { row: 0, col: 0 } });
    expect(checkGoalConditions(state, grid)).toBe(false);
  });

  it('returns false when not all collectibles are collected', () => {
    const grid: GridState = {
      width: 5, height: 5,
      obstacles: [],
      goals: [{ row: 3, col: 3 }],
      collectibles: [{ row: 1, col: 1 }, { row: 2, col: 2 }],
    };
    const state = makeState({
      botPosition: { row: 3, col: 3 },
      collectedItems: ['1,1'], // missing 2,2
    });
    expect(checkGoalConditions(state, grid)).toBe(false);
  });

  it('returns true when on goal with no collectibles defined', () => {
    const grid: GridState = {
      width: 5, height: 5,
      obstacles: [],
      goals: [{ row: 4, col: 4 }],
      collectibles: [],
    };
    const state = makeState({ botPosition: { row: 4, col: 4 } });
    expect(checkGoalConditions(state, grid)).toBe(true);
  });

  it('returns true when bot is on any of multiple goals', () => {
    const grid: GridState = {
      width: 5, height: 5,
      obstacles: [],
      goals: [{ row: 1, col: 1 }, { row: 3, col: 3 }],
      collectibles: [],
    };
    const state = makeState({ botPosition: { row: 3, col: 3 } });
    expect(checkGoalConditions(state, grid)).toBe(true);
  });
});

describe('Executor - goalReached on completion', () => {
  it('sets goalReached to true when bot ends on goal with all collectibles', () => {
    const grid: GridState = {
      width: 5, height: 5,
      obstacles: [],
      goals: [{ row: 0, col: 1 }],
      collectibles: [],
    };
    const board: ControlBoardState = {
      lines: [{
        lineIndex: 0,
        blocks: [makeBlock('forward', 'f1')],
      }],
    };

    const executor = createExecutor(board, grid, { row: 0, col: 0 }, 'east', 'normal');
    const state = runToCompletion(executor);

    expect(state.status).toBe('completed');
    expect(state.goalReached).toBe(true);
  });

  it('sets goalReached to false when bot does not end on goal', () => {
    const grid: GridState = {
      width: 5, height: 5,
      obstacles: [],
      goals: [{ row: 4, col: 4 }],
      collectibles: [],
    };
    const board: ControlBoardState = {
      lines: [{
        lineIndex: 0,
        blocks: [makeBlock('forward', 'f1')],
      }],
    };

    const executor = createExecutor(board, grid, { row: 0, col: 0 }, 'east', 'normal');
    const state = runToCompletion(executor);

    expect(state.status).toBe('completed');
    expect(state.goalReached).toBe(false);
  });

  it('sets goalReached to false when collectibles remain uncollected', () => {
    const grid: GridState = {
      width: 5, height: 5,
      obstacles: [],
      goals: [{ row: 0, col: 1 }],
      collectibles: [{ row: 2, col: 2 }],
    };
    const board: ControlBoardState = {
      lines: [{
        lineIndex: 0,
        blocks: [makeBlock('forward', 'f1')],
      }],
    };

    const executor = createExecutor(board, grid, { row: 0, col: 0 }, 'east', 'normal');
    const state = runToCompletion(executor);

    expect(state.status).toBe('completed');
    expect(state.goalReached).toBe(false);
  });
});