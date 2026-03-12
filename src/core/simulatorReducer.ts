import { v4 as uuidv4 } from 'uuid';
import {
  SimulatorState,
  SimulatorAction,
  DEFAULT_BLOCK_INVENTORY,
  BlockType,
  Position,
  Direction,
  ExecutionState,
} from './types';
import { placeBlock, removeBlock } from './inventory';
import { placeBlockOnBoard, removeBlockFromBoard, reorderBlock } from './controlBoard';
import { validateProgram } from './validator';

/**
 * Create the default initial execution state.
 */
function createInitialExecutionState(
  botPosition: Position,
  botDirection: Direction,
): ExecutionState {
  return {
    status: 'idle',
    currentLine: 0,
    currentBlockIndex: 0,
    botPosition: { ...botPosition },
    botDirection,
    collectedItems: [],
    loopCounters: new Map(),
    callStack: [],
    stepCount: 0,
  };
}

/**
 * Create the default initial simulator state.
 * 4x4 grid, bot at (0,0) facing east, default inventory, idle execution,
 * normal speed, zh language, timer disabled.
 */
export function createInitialState(): SimulatorState {
  const botPosition: Position = { row: 0, col: 0 };
  const botDirection: Direction = 'east';

  return {
    grid: {
      width: 4,
      height: 4,
      obstacles: [],
      goals: [],
      collectibles: [],
    },
    botPosition: { ...botPosition },
    botDirection,
    botStartPosition: { ...botPosition },
    botStartDirection: botDirection,
    controlBoard: { lines: [] },
    blockInventory: { ...DEFAULT_BLOCK_INVENTORY },
    execution: createInitialExecutionState(botPosition, botDirection),
    speed: 'normal',
    currentChallenge: null,
    collectedItems: [],
    timer: {
      enabled: false,
      duration: 0,
      remaining: 0,
      running: false,
    },
    language: 'zh',
  };
}

/**
 * Simulator reducer handling all SimulatorAction types.
 */
export function simulatorReducer(
  state: SimulatorState,
  action: SimulatorAction,
): SimulatorState {
  switch (action.type) {
    case 'PLACE_BLOCK': {
      // Decrement inventory
      const inventoryResult = placeBlock(state.blockInventory, action.blockType);
      if ('error' in inventoryResult) {
        return state;
      }

      // Create a new block instance
      const newBlock = {
        id: uuidv4(),
        type: action.blockType,
      };

      // Place on board
      const boardResult = placeBlockOnBoard(
        state.controlBoard,
        newBlock,
        action.line,
        action.position,
      );
      if ('error' in boardResult) {
        return state;
      }

      return {
        ...state,
        blockInventory: inventoryResult.inventory,
        controlBoard: boardResult,
      };
    }

    case 'REMOVE_BLOCK': {
      // Find the block on the board to get its type
      let blockType: BlockType | undefined;
      for (const line of state.controlBoard.lines) {
        const found = line.blocks.find((b) => b.id === action.blockId);
        if (found) {
          blockType = found.type;
          break;
        }
      }

      if (!blockType) {
        return state;
      }

      const updatedBoard = removeBlockFromBoard(state.controlBoard, action.blockId);
      const updatedInventory = removeBlock(state.blockInventory, blockType);

      return {
        ...state,
        controlBoard: updatedBoard,
        blockInventory: updatedInventory,
      };
    }

    case 'REORDER_BLOCK': {
      const updatedBoard = reorderBlock(
        state.controlBoard,
        action.blockId,
        action.newLine,
        action.newPosition,
      );
      return {
        ...state,
        controlBoard: updatedBoard,
      };
    }

    case 'RUN_PROGRAM': {
      const validationResult = validateProgram(state.controlBoard);
      if (!validationResult.valid) {
        return {
          ...state,
          execution: {
            ...state.execution,
            status: 'error',
            errorInfo: validationResult.errors[0],
          },
        };
      }

      return {
        ...state,
        execution: {
          ...createInitialExecutionState(state.botStartPosition, state.botStartDirection),
          status: 'running',
        },
      };
    }

    case 'EXECUTE_STEP': {
      return {
        ...state,
        execution: action.state,
        botPosition: { ...action.state.botPosition },
        botDirection: action.state.botDirection,
      };
    }

    case 'EXECUTION_COMPLETE': {
      return {
        ...state,
        execution: {
          ...state.execution,
          status: action.success ? 'completed' : 'error',
          goalReached: action.success,
          errorInfo: action.error,
        },
      };
    }

    case 'RESET': {
      return {
        ...state,
        botPosition: { ...state.botStartPosition },
        botDirection: state.botStartDirection,
        execution: createInitialExecutionState(
          state.botStartPosition,
          state.botStartDirection,
        ),
        collectedItems: [],
      };
    }

    case 'LOAD_CHALLENGE': {
      const config = action.config;
      const botPosition: Position = { row: config.start.row, col: config.start.col };
      const botDirection = config.start.direction;

      // Merge default inventory with challenge-specific overrides
      const mergedInventory: Record<BlockType, number> = {
        ...DEFAULT_BLOCK_INVENTORY,
        ...config.blockInventory,
      };

      return {
        ...state,
        grid: {
          width: config.grid.width,
          height: config.grid.height,
          obstacles: [...config.obstacles],
          goals: [...config.goals],
          collectibles: [...config.collectibles],
        },
        botPosition: { ...botPosition },
        botDirection,
        botStartPosition: { ...botPosition },
        botStartDirection: botDirection,
        controlBoard: { lines: [] },
        blockInventory: mergedInventory,
        execution: createInitialExecutionState(botPosition, botDirection),
        currentChallenge: config,
        collectedItems: [],
        timer: config.timeLimit
          ? {
              enabled: true,
              duration: config.timeLimit,
              remaining: config.timeLimit,
              running: false,
            }
          : {
              enabled: false,
              duration: 0,
              remaining: 0,
              running: false,
            },
      };
    }

    case 'LOAD_PROGRAM': {
      return {
        ...state,
        controlBoard: action.board,
      };
    }

    case 'SET_SPEED': {
      return {
        ...state,
        speed: action.speed,
      };
    }

    case 'SET_LANGUAGE': {
      return {
        ...state,
        language: action.language,
      };
    }

    case 'TIMER_TICK': {
      if (!state.timer.running || state.timer.remaining <= 0) {
        return state;
      }
      return {
        ...state,
        timer: {
          ...state.timer,
          remaining: state.timer.remaining - 1,
        },
      };
    }

    case 'TIMER_START': {
      return {
        ...state,
        timer: {
          enabled: true,
          duration: action.duration,
          remaining: action.duration,
          running: true,
        },
      };
    }

    case 'TIMER_STOP': {
      return {
        ...state,
        timer: {
          ...state.timer,
          running: false,
        },
      };
    }

    case 'TIMER_EXPIRED': {
      return {
        ...state,
        execution: {
          ...state.execution,
          status: 'error',
        },
        timer: {
          ...state.timer,
          running: false,
        },
      };
    }

    default:
      return state;
  }
}
