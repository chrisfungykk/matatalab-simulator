import type { ChallengeConfig, Direction, Position, BlockType } from './types';

const VALID_DIRECTIONS: Direction[] = ['north', 'east', 'south', 'west'];

const VALID_BLOCK_TYPES: BlockType[] = [
  'forward', 'backward', 'turn_left', 'turn_right',
  'loop_begin', 'loop_end', 'function_define', 'function_call',
  'number_2', 'number_3', 'number_4', 'number_5', 'number_random',
  'fun_random_move', 'fun_music', 'fun_dance',
];

function isPosition(val: unknown): val is Position {
  return (
    typeof val === 'object' &&
    val !== null &&
    !Array.isArray(val) &&
    typeof (val as Record<string, unknown>).row === 'number' &&
    typeof (val as Record<string, unknown>).col === 'number'
  );
}

function validatePositionInBounds(
  pos: Position, width: number, height: number, label: string
): void {
  if (pos.row < 0 || pos.row >= height || pos.col < 0 || pos.col >= width) {
    throw new Error(
      `Invalid challenge: ${label} position (${pos.row}, ${pos.col}) is outside grid bounds (${width}x${height})`
    );
  }
}

function validatePositionArray(
  arr: unknown, width: number, height: number, label: string
): Position[] {
  if (!Array.isArray(arr)) {
    throw new Error(`Invalid challenge: ${label} must be an array`);
  }
  return arr.map((item, i) => {
    if (!isPosition(item)) {
      throw new Error(`Invalid challenge: ${label}[${i}] must have numeric row and col`);
    }
    validatePositionInBounds(item, width, height, `${label}[${i}]`);
    return { row: item.row, col: item.col };
  });
}


/**
 * Parses a JSON string into a ChallengeConfig.
 * Throws on invalid input with descriptive error messages.
 */
export function parseChallenge(json: string): ChallengeConfig {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Invalid challenge JSON: unable to parse input');
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Invalid challenge: expected an object');
  }

  const obj = parsed as Record<string, unknown>;

  // Required fields check
  const requiredFields = ['id', 'title', 'difficulty', 'grid', 'start', 'goals', 'obstacles', 'collectibles'];
  for (const field of requiredFields) {
    if (!(field in obj)) {
      throw new Error(`Invalid challenge: missing required field "${field}"`);
    }
  }

  // id
  if (typeof obj.id !== 'string') {
    throw new Error('Invalid challenge: id must be a string');
  }

  // title
  if (typeof obj.title !== 'object' || obj.title === null || Array.isArray(obj.title)) {
    throw new Error('Invalid challenge: title must be an object with zh and en keys');
  }
  const title = obj.title as Record<string, unknown>;
  if (typeof title.zh !== 'string' || typeof title.en !== 'string') {
    throw new Error('Invalid challenge: title must have zh and en string values');
  }

  // difficulty
  if (obj.difficulty !== 'easy' && obj.difficulty !== 'medium' && obj.difficulty !== 'hard') {
    throw new Error('Invalid challenge: difficulty must be "easy", "medium", or "hard"');
  }

  // grid
  if (typeof obj.grid !== 'object' || obj.grid === null || Array.isArray(obj.grid)) {
    throw new Error('Invalid challenge: grid must be an object');
  }
  const grid = obj.grid as Record<string, unknown>;
  if (typeof grid.width !== 'number' || typeof grid.height !== 'number') {
    throw new Error('Invalid challenge: grid must have numeric width and height');
  }
  if (grid.width < 4 || grid.width > 10) {
    throw new Error(`Invalid challenge: grid width must be between 4 and 10, got ${grid.width}`);
  }
  if (grid.height < 4 || grid.height > 10) {
    throw new Error(`Invalid challenge: grid height must be between 4 and 10, got ${grid.height}`);
  }

  const gridWidth = grid.width as number;
  const gridHeight = grid.height as number;

  // start
  if (typeof obj.start !== 'object' || obj.start === null || Array.isArray(obj.start)) {
    throw new Error('Invalid challenge: start must be an object');
  }
  const start = obj.start as Record<string, unknown>;
  if (typeof start.row !== 'number' || typeof start.col !== 'number') {
    throw new Error('Invalid challenge: start must have numeric row and col');
  }
  if (typeof start.direction !== 'string' || !VALID_DIRECTIONS.includes(start.direction as Direction)) {
    throw new Error(`Invalid challenge: start direction must be one of ${VALID_DIRECTIONS.join(', ')}`);
  }
  validatePositionInBounds(
    { row: start.row as number, col: start.col as number },
    gridWidth, gridHeight, 'start'
  );

  // goals, obstacles, collectibles
  const goals = validatePositionArray(obj.goals, gridWidth, gridHeight, 'goals');
  const obstacles = validatePositionArray(obj.obstacles, gridWidth, gridHeight, 'obstacles');
  const collectibles = validatePositionArray(obj.collectibles, gridWidth, gridHeight, 'collectibles');

  // blockInventory (optional)
  let blockInventory: Partial<Record<BlockType, number>> = {};
  if (obj.blockInventory !== undefined) {
    if (typeof obj.blockInventory !== 'object' || obj.blockInventory === null || Array.isArray(obj.blockInventory)) {
      throw new Error('Invalid challenge: blockInventory must be an object');
    }
    const inv = obj.blockInventory as Record<string, unknown>;
    for (const [key, value] of Object.entries(inv)) {
      if (!VALID_BLOCK_TYPES.includes(key as BlockType)) {
        throw new Error(`Invalid challenge: blockInventory has unknown block type "${key}"`);
      }
      if (typeof value !== 'number' || value < 0) {
        throw new Error(`Invalid challenge: blockInventory["${key}"] must be a non-negative number`);
      }
      blockInventory[key as BlockType] = value as number;
    }
  }

  // timeLimit (optional)
  let timeLimit: number | undefined;
  if (obj.timeLimit !== undefined) {
    if (typeof obj.timeLimit !== 'number' || obj.timeLimit <= 0) {
      throw new Error('Invalid challenge: timeLimit must be a positive number');
    }
    timeLimit = obj.timeLimit as number;
  }

  // generationSeed (optional)
  let generationSeed: number | undefined;
  if (obj.generationSeed !== undefined) {
    if (typeof obj.generationSeed !== 'number') {
      throw new Error('Invalid challenge: generationSeed must be a number');
    }
    generationSeed = obj.generationSeed as number;
  }

  const config: ChallengeConfig = {
    id: obj.id as string,
    title: { zh: title.zh as string, en: title.en as string },
    difficulty: obj.difficulty as 'easy' | 'medium' | 'hard',
    grid: { width: gridWidth, height: gridHeight },
    start: {
      row: start.row as number,
      col: start.col as number,
      direction: start.direction as Direction,
    },
    goals,
    obstacles,
    collectibles,
    blockInventory,
  };

  if (timeLimit !== undefined) {
    config.timeLimit = timeLimit;
  }

  if (generationSeed !== undefined) {
    config.generationSeed = generationSeed;
  }

  return config;
}

/**
 * Formats a ChallengeConfig to a pretty-printed JSON string.
 */
export function prettyPrintChallenge(config: ChallengeConfig): string {
  return JSON.stringify(config, null, 2);
}
