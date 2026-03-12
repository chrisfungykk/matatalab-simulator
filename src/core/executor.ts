import type {
  ControlBoardState,
  GridState,
  Position,
  Direction,
  SpeedSetting,
  ExecutionState,
  CodingBlock,
  BlockType,
} from './types';

// ── Direction helpers ───────────────────────────────────────────────

const DIRECTION_DELTAS: Record<Direction, { dRow: number; dCol: number }> = {
  north: { dRow: -1, dCol: 0 },
  south: { dRow: 1, dCol: 0 },
  east: { dRow: 0, dCol: 1 },
  west: { dRow: 0, dCol: -1 },
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

const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  north: 'south',
  south: 'north',
  east: 'west',
  west: 'east',
};

// ── Number block helpers ────────────────────────────────────────────

function isNumberBlock(type: BlockType): boolean {
  return (
    type === 'number_2' ||
    type === 'number_3' ||
    type === 'number_4' ||
    type === 'number_5' ||
    type === 'number_random'
  );
}

function resolveNumberBlock(type: BlockType): number {
  switch (type) {
    case 'number_2': return 2;
    case 'number_3': return 3;
    case 'number_4': return 4;
    case 'number_5': return 5;
    case 'number_random': return Math.floor(Math.random() * 6) + 1;
    default: return 1;
  }
}

// ── Grid helpers ────────────────────────────────────────────────────

function isInBounds(pos: Position, grid: GridState): boolean {
  return pos.row >= 0 && pos.row < grid.height && pos.col >= 0 && pos.col < grid.width;
}

function isObstacle(pos: Position, grid: GridState): boolean {
  return grid.obstacles.some((o) => o.row === pos.row && o.col === pos.col);
}

function isCollectible(pos: Position, grid: GridState): boolean {
  return grid.collectibles.some((c) => c.row === pos.row && c.col === pos.col);
}

function positionKey(pos: Position): string {
  return `${pos.row},${pos.col}`;
}

// ── Goal checking ───────────────────────────────────────────────────

export function checkGoalConditions(state: ExecutionState, grid: GridState): boolean {
  // Bot's final position must be on a goal cell
  const onGoal = grid.goals.some(
    (g) => g.row === state.botPosition.row && g.col === state.botPosition.col,
  );
  if (!onGoal) return false;

  // All collectible items must have been collected
  const allCollected = grid.collectibles.every((c) =>
    state.collectedItems.includes(positionKey(c)),
  );
  return allCollected;
}

// ── ProgramExecutor interface ───────────────────────────────────────

export interface ProgramExecutor {
  step(): ExecutionState;
  run(): void;
  reset(): ExecutionState;
  setSpeed(speed: SpeedSetting): void;
  getState(): ExecutionState;
}

// ── createExecutor ──────────────────────────────────────────────────

export function createExecutor(
  board: ControlBoardState,
  grid: GridState,
  startPosition: Position,
  startDirection: Direction,
  speed: SpeedSetting,
): ProgramExecutor {
  let currentSpeed = speed;

  // Track how many remaining repeats a function definition line has.
  // Keyed by the lineIndex of the function_define line.
  let functionRepeatCounters: Map<number, number> = new Map();

  function makeInitialState(): ExecutionState {
    return {
      status: 'idle',
      currentLine: 0,
      currentBlockIndex: 0,
      botPosition: { ...startPosition },
      botDirection: startDirection,
      collectedItems: [],
      loopCounters: new Map(),
      callStack: [],
      stepCount: 0,
    };
  }

  let state: ExecutionState = makeInitialState();

  /** Mark execution as completed and check goal conditions. */
  function markCompleted(): void {
    state.status = 'completed';
    state.goalReached = checkGoalConditions(state, grid);
  }

  function getBlocks(): CodingBlock[] {
    const line = board.lines.find((l) => l.lineIndex === state.currentLine);
    return line ? line.blocks : [];
  }

  /**
   * Find the line that contains a function_define block.
   * Returns the lineIndex, or -1 if not found.
   */
  function findFunctionDefineLine(): number {
    for (const line of board.lines) {
      if (line.lineIndex > 0 && line.blocks.length > 0 && line.blocks[0].type === 'function_define') {
        return line.lineIndex;
      }
    }
    return -1;
  }

  /**
   * Get the starting block index for a function definition line,
   * skipping the function_define block and its optional number block parameter.
   * Also initializes the repeat counter if a number block is present.
   * Returns the index of the first executable block in the subroutine.
   */
  function enterFunctionLine(lineIndex: number): number {
    const line = board.lines.find((l) => l.lineIndex === lineIndex);
    if (!line || line.blocks.length === 0) return 0;

    // Skip the function_define block itself
    let startIdx = 1;

    // Check if the next block is a number block (repeat count parameter)
    if (startIdx < line.blocks.length && isNumberBlock(line.blocks[startIdx].type)) {
      const repeatCount = resolveNumberBlock(line.blocks[startIdx].type);
      functionRepeatCounters.set(lineIndex, repeatCount);
      startIdx++; // skip the number block too
    } else {
      // No repeat parameter — execute once
      functionRepeatCounters.set(lineIndex, 1);
    }

    return startIdx;
  }

  /**
   * Get the starting block index of the function body (for repeat iterations).
   * Same as enterFunctionLine but does NOT re-resolve the repeat counter.
   */
  function enterFunctionLineBody(lineIndex: number): number {
    const line = board.lines.find((l) => l.lineIndex === lineIndex);
    if (!line || line.blocks.length === 0) return 0;

    let startIdx = 1;
    if (startIdx < line.blocks.length && isNumberBlock(line.blocks[startIdx].type)) {
      startIdx++;
    }
    return startIdx;
  }

  /**
   * Try to move the bot `steps` cells in `dir`. Moves one cell at a time,
   * checking boundaries and obstacles at each intermediate position.
   * Returns an error-state if any check fails, otherwise the final position
   * with any collected items.
   */
  function moveBot(
    dir: Direction,
    steps: number,
    causingBlockIndex: number,
  ): { error: boolean; position: Position; collected: string[] } {
    const delta = DIRECTION_DELTAS[dir];
    let pos = { ...state.botPosition };
    const collected: string[] = [];

    for (let i = 0; i < steps; i++) {
      const next: Position = { row: pos.row + delta.dRow, col: pos.col + delta.dCol };

      if (!isInBounds(next, grid)) {
        // Stay at current pos, report boundary error
        state.status = 'error';
        state.botPosition = pos;
        state.collectedItems = [...state.collectedItems, ...collected];
        state.errorInfo = {
          type: 'BOUNDARY_VIOLATION',
          blockIndex: causingBlockIndex,
          line: state.currentLine,
          messageKey: 'error.boundary',
        };
        return { error: true, position: pos, collected };
      }

      if (isObstacle(next, grid)) {
        state.status = 'error';
        state.botPosition = pos;
        state.collectedItems = [...state.collectedItems, ...collected];
        state.errorInfo = {
          type: 'OBSTACLE_COLLISION',
          blockIndex: causingBlockIndex,
          line: state.currentLine,
          messageKey: 'error.obstacle',
        };
        return { error: true, position: pos, collected };
      }

      pos = next;

      // Collect items at the new position
      if (isCollectible(pos, grid)) {
        const key = positionKey(pos);
        if (
          !state.collectedItems.includes(key) &&
          !collected.includes(key)
        ) {
          collected.push(key);
        }
      }
    }

    return { error: false, position: pos, collected };
  }

  function step(): ExecutionState {
    // If already completed or errored, return current state
    if (state.status === 'completed' || state.status === 'error') {
      return { ...state, loopCounters: new Map(state.loopCounters) };
    }

    // Mark as running on first step
    if (state.status === 'idle') {
      state.status = 'running';
    }

    // Clear animation indicator from previous step
    state.animationType = undefined;

    const blocks = getBlocks();

    // If no blocks or past end of line, mark completed
    if (blocks.length === 0 || state.currentBlockIndex >= blocks.length) {
      markCompleted();
      return { ...state, loopCounters: new Map(state.loopCounters) };
    }

    const block = blocks[state.currentBlockIndex];
    const blockIdx = state.currentBlockIndex;

    switch (block.type) {
      case 'forward':
      case 'backward': {
        // Check if next block is a number block for multiplier
        let steps = 1;
        let skipNext = false;
        const nextIdx = state.currentBlockIndex + 1;
        if (nextIdx < blocks.length && isNumberBlock(blocks[nextIdx].type)) {
          steps = resolveNumberBlock(blocks[nextIdx].type);
          skipNext = true;
        }

        const dir =
          block.type === 'forward'
            ? state.botDirection
            : OPPOSITE_DIRECTION[state.botDirection];

        const result = moveBot(dir, steps, blockIdx);
        if (result.error) {
          // state already updated by moveBot
          return { ...state, loopCounters: new Map(state.loopCounters) };
        }

        state.botPosition = result.position;
        state.collectedItems = [...state.collectedItems, ...result.collected];
        state.stepCount++;

        // Advance past the number block if we consumed it
        state.currentBlockIndex += skipNext ? 2 : 1;
        break;
      }

      case 'turn_left': {
        state.botDirection = TURN_LEFT_MAP[state.botDirection];
        state.stepCount++;
        state.currentBlockIndex++;
        break;
      }

      case 'turn_right': {
        state.botDirection = TURN_RIGHT_MAP[state.botDirection];
        state.stepCount++;
        state.currentBlockIndex++;
        break;
      }

      case 'loop_begin': {
        // The next block should be a number block specifying iteration count
        const numIdx = state.currentBlockIndex + 1;
        if (numIdx < blocks.length && isNumberBlock(blocks[numIdx].type)) {
          const iterations = resolveNumberBlock(blocks[numIdx].type);
          // Store remaining iterations keyed by the loop_begin blockIndex
          state.loopCounters.set(blockIdx, iterations);
          // Skip past loop_begin and the number block to the first enclosed block
          state.currentBlockIndex = numIdx + 1;
        } else {
          // No number block — shouldn't happen if validator ran, but skip past
          state.currentBlockIndex++;
        }
        break;
      }

      case 'loop_end': {
        // Find the matching loop_begin by scanning backwards for the nearest
        // loop_begin that has an active counter in loopCounters
        let matchingBeginIdx = -1;
        for (let i = blockIdx - 1; i >= 0; i--) {
          if (blocks[i].type === 'loop_begin' && state.loopCounters.has(i)) {
            matchingBeginIdx = i;
            break;
          }
        }

        if (matchingBeginIdx >= 0) {
          const remaining = state.loopCounters.get(matchingBeginIdx)!;
          if (remaining > 1) {
            // Decrement counter and jump back to first enclosed block
            // (the block after loop_begin's number block)
            state.loopCounters.set(matchingBeginIdx, remaining - 1);
            // First enclosed block is at matchingBeginIdx + 2 (skip loop_begin + number block)
            state.currentBlockIndex = matchingBeginIdx + 2;
          } else {
            // Loop finished — remove counter and advance past loop_end
            state.loopCounters.delete(matchingBeginIdx);
            state.currentBlockIndex++;
          }
        } else {
          // No matching loop_begin found — skip (shouldn't happen after validation)
          state.currentBlockIndex++;
        }
        break;
      }

      case 'function_call': {
        // Find the function definition line
        const funcLine = findFunctionDefineLine();
        if (funcLine < 0) {
          // No function definition found — shouldn't happen after validation
          state.currentBlockIndex++;
          break;
        }

        // Push return point onto callStack.
        // When the function finishes, we return to the block after this function_call.
        state.callStack.push({
          line: state.currentLine,
          blockIndex: state.currentBlockIndex,
          returnLine: state.currentLine,
          returnBlockIndex: state.currentBlockIndex + 1,
        });

        // Jump to the function definition line
        state.currentLine = funcLine;
        state.currentBlockIndex = enterFunctionLine(funcLine);
        break;
      }

      case 'function_define': {
        // If we encounter function_define during execution (e.g., at the start of a
        // function line), skip it and its optional number block parameter.
        // This case handles re-entry for repeat iterations.
        state.currentBlockIndex++;
        // Skip number block if present
        const fnBlocks = getBlocks();
        if (state.currentBlockIndex < fnBlocks.length && isNumberBlock(fnBlocks[state.currentBlockIndex].type)) {
          state.currentBlockIndex++;
        }
        break;
      }

      case 'fun_random_move': {
        // Move bot 1 cell in a random valid direction
        const directions: Direction[] = ['north', 'south', 'east', 'west'];
        // Shuffle directions randomly
        const shuffled = [...directions].sort(() => Math.random() - 0.5);
        let moved = false;

        for (const dir of shuffled) {
          const delta = DIRECTION_DELTAS[dir];
          const next: Position = {
            row: state.botPosition.row + delta.dRow,
            col: state.botPosition.col + delta.dCol,
          };
          if (isInBounds(next, grid) && !isObstacle(next, grid)) {
            state.botPosition = next;
            // Collect items at the new position
            if (isCollectible(next, grid)) {
              const key = positionKey(next);
              if (!state.collectedItems.includes(key)) {
                state.collectedItems = [...state.collectedItems, key];
              }
            }
            moved = true;
            break;
          }
        }
        // If no valid direction exists, stay in place (moved remains false)
        void moved;
        state.animationType = undefined;
        state.stepCount++;
        state.currentBlockIndex++;
        break;
      }

      case 'fun_music': {
        state.animationType = 'music';
        state.stepCount++;
        state.currentBlockIndex++;
        break;
      }

      case 'fun_dance': {
        state.animationType = 'dance';
        state.stepCount++;
        state.currentBlockIndex++;
        break;
      }

      default: {
        // For blocks not yet handled (e.g., standalone number blocks),
        // just skip them
        state.stepCount++;
        state.currentBlockIndex++;
        break;
      }
    }

    // Check if we've reached the end of the current line
    if (state.currentBlockIndex >= getBlocks().length) {
      // If we're on a function definition line and have a callStack, handle repeat and return
      if (state.callStack.length > 0) {
        const funcLineIdx = state.currentLine;
        const remaining = functionRepeatCounters.get(funcLineIdx) ?? 0;

        if (remaining > 1) {
          // More iterations to go — decrement counter and restart the function body
          functionRepeatCounters.set(funcLineIdx, remaining - 1);
          state.currentBlockIndex = enterFunctionLineBody(funcLineIdx);
        } else {
          // Function execution complete — clean up and return to caller
          functionRepeatCounters.delete(funcLineIdx);
          const frame = state.callStack.pop()!;
          state.currentLine = frame.returnLine;
          state.currentBlockIndex = frame.returnBlockIndex;

          // Check if we've now reached the end of the return line too
          const returnBlocks = getBlocks();
          if (state.currentBlockIndex >= returnBlocks.length) {
            // If there's still a callStack frame, we'd handle it on the next step.
            // Otherwise, we're done.
            if (state.callStack.length === 0) {
              markCompleted();
            }
          }
        }
      } else {
        markCompleted();
      }
    }

    return { ...state, loopCounters: new Map(state.loopCounters) };
  }

  function run(): void {
    // No-op for now — animation loop will be wired in the UI layer.
    // Speed is tracked via currentSpeed for use by the animation loop.
    void currentSpeed;
  }

  function reset(): ExecutionState {
    state = makeInitialState();
    functionRepeatCounters = new Map();
    return { ...state, loopCounters: new Map(state.loopCounters) };
  }

  function setSpeed(newSpeed: SpeedSetting): void {
    currentSpeed = newSpeed;
  }

  function getState(): ExecutionState {
    return { ...state, loopCounters: new Map(state.loopCounters) };
  }

  return { step, run, reset, setSpeed, getState };
}
