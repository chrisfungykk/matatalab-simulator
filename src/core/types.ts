// ── Direction & Block Types ──────────────────────────────────────────

export type Direction = 'north' | 'east' | 'south' | 'west';

export type BlockType =
  | 'forward'
  | 'backward'
  | 'turn_left'
  | 'turn_right'
  | 'loop_begin'
  | 'loop_end'
  | 'function_define'
  | 'function_call'
  | 'number_2'
  | 'number_3'
  | 'number_4'
  | 'number_5'
  | 'number_random'
  | 'fun_random_move'
  | 'fun_music'
  | 'fun_dance';

// ── Block & Position ────────────────────────────────────────────────

export interface CodingBlock {
  id: string;
  type: BlockType;
  parameter?: number | 'random';
}

export interface Position {
  row: number;
  col: number;
}

// ── Program & Control Board ─────────────────────────────────────────

export interface ProgramLine {
  lineIndex: number;
  blocks: CodingBlock[];
}

export interface ControlBoardState {
  lines: ProgramLine[];
}

// ── Grid ────────────────────────────────────────────────────────────

export interface GridState {
  width: number;
  height: number;
  obstacles: Position[];
  goals: Position[];
  collectibles: Position[];
}

// ── Speed ───────────────────────────────────────────────────────────

export type SpeedSetting = 'slow' | 'normal' | 'fast';

export const SPEED_DELAYS: Record<SpeedSetting, number> = {
  slow: 1500,
  normal: 800,
  fast: 300,
};

// ── Execution ───────────────────────────────────────────────────────

export interface StackFrame {
  line: number;
  blockIndex: number;
  returnLine: number;
  returnBlockIndex: number;
}

export interface ExecutionState {
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  currentLine: number;
  currentBlockIndex: number;
  botPosition: Position;
  botDirection: Direction;
  collectedItems: string[];
  loopCounters: Map<number, number>;
  callStack: StackFrame[];
  stepCount: number;
  errorInfo?: ValidationError;
  animationType?: 'music' | 'dance';
  goalReached?: boolean;
}

// ── Validation ──────────────────────────────────────────────────────

export interface ValidationError {
  type:
    | 'UNMATCHED_LOOP_BEGIN'
    | 'UNMATCHED_LOOP_END'
    | 'MISSING_LOOP_NUMBER'
    | 'FUNCTION_CALL_NO_DEFINITION'
    | 'FUNCTION_ON_MAIN_LINE'
    | 'NUMBER_ON_TURN'
    | 'BOUNDARY_VIOLATION'
    | 'OBSTACLE_COLLISION';
  blockIndex: number;
  line: number;
  messageKey: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// ── Serialization ───────────────────────────────────────────────────

export interface SerializedBlock {
  type: BlockType;
  parameter?: number | 'random';
}

export interface SerializedLine {
  lineIndex: number;
  blocks: SerializedBlock[];
}

export interface SerializedProgram {
  version: 1;
  lines: SerializedLine[];
}

// ── Challenge Configuration ─────────────────────────────────────────

export interface ChallengeConfig {
  id: string;
  title: Record<'zh' | 'en', string>;
  difficulty: 'easy' | 'medium' | 'hard';
  grid: { width: number; height: number };
  start: { row: number; col: number; direction: Direction };
  goals: Position[];
  obstacles: Position[];
  collectibles: Position[];
  blockInventory: Partial<Record<BlockType, number>>;
  timeLimit?: number;
}

// ── Simulator State ─────────────────────────────────────────────────

export interface SimulatorState {
  grid: GridState;
  botPosition: Position;
  botDirection: Direction;
  botStartPosition: Position;
  botStartDirection: Direction;
  controlBoard: ControlBoardState;
  blockInventory: Record<BlockType, number>;
  execution: ExecutionState;
  speed: SpeedSetting;
  currentChallenge: ChallengeConfig | null;
  collectedItems: Position[];
  timer: {
    enabled: boolean;
    duration: number;
    remaining: number;
    running: boolean;
  };
  language: 'zh' | 'en';
}

// ── Default Block Inventory (Physical Set Limits) ───────────────────

export const DEFAULT_BLOCK_INVENTORY: Record<BlockType, number> = {
  forward: 4,
  backward: 4,
  turn_left: 4,
  turn_right: 4,
  loop_begin: 2,
  loop_end: 2,
  function_define: 1,
  function_call: 3,
  number_2: 2,
  number_3: 2,
  number_4: 2,
  number_5: 2,
  number_random: 2,
  fun_random_move: 1,
  fun_music: 1,
  fun_dance: 1,
};

// ── Reducer Actions ─────────────────────────────────────────────────

export type SimulatorAction =
  | { type: 'PLACE_BLOCK'; blockType: BlockType; line: number; position: number }
  | { type: 'REMOVE_BLOCK'; blockId: string }
  | { type: 'REORDER_BLOCK'; blockId: string; newLine: number; newPosition: number }
  | { type: 'RUN_PROGRAM' }
  | { type: 'EXECUTE_STEP'; state: ExecutionState }
  | { type: 'EXECUTION_COMPLETE'; success: boolean; error?: ValidationError }
  | { type: 'RESET' }
  | { type: 'LOAD_CHALLENGE'; config: ChallengeConfig }
  | { type: 'LOAD_PROGRAM'; board: ControlBoardState }
  | { type: 'SET_SPEED'; speed: SpeedSetting }
  | { type: 'SET_LANGUAGE'; language: 'zh' | 'en' }
  | { type: 'TIMER_TICK' }
  | { type: 'TIMER_START'; duration: number }
  | { type: 'TIMER_STOP' }
  | { type: 'TIMER_EXPIRED' };
