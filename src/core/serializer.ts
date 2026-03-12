import type {
  ControlBoardState,
  SerializedProgram,
  SerializedBlock,
  SerializedLine,
  BlockType,
  CodingBlock,
  ProgramLine,
} from './types';

const VALID_BLOCK_TYPES: BlockType[] = [
  'forward',
  'backward',
  'turn_left',
  'turn_right',
  'loop_begin',
  'loop_end',
  'function_define',
  'function_call',
  'number_2',
  'number_3',
  'number_4',
  'number_5',
  'number_random',
  'fun_random_move',
  'fun_music',
  'fun_dance',
];

let idCounter = 0;

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `block-${++idCounter}`;
}

/**
 * Serializes a ControlBoardState into a JSON string.
 */
export function serialize(board: ControlBoardState): string {
  const program: SerializedProgram = {
    version: 1,
    lines: board.lines.map((line): SerializedLine => ({
      lineIndex: line.lineIndex,
      blocks: line.blocks.map((block): SerializedBlock => {
        const serialized: SerializedBlock = { type: block.type };
        if (block.parameter !== undefined) {
          serialized.parameter = block.parameter;
        }
        return serialized;
      }),
    })),
  };
  return JSON.stringify(program);
}

/**
 * Deserializes a JSON string into a ControlBoardState.
 * Throws on invalid input.
 */
export function deserialize(json: string): ControlBoardState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Invalid JSON: unable to parse input');
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Invalid program: expected an object');
  }

  const obj = parsed as Record<string, unknown>;

  if (obj.version !== 1) {
    throw new Error('Invalid program: version must be 1');
  }

  if (!Array.isArray(obj.lines)) {
    throw new Error('Invalid program: lines must be an array');
  }

  const lines: ProgramLine[] = (obj.lines as unknown[]).map((line, i) => {
    if (typeof line !== 'object' || line === null || Array.isArray(line)) {
      throw new Error(`Invalid program: line at index ${i} must be an object`);
    }

    const lineObj = line as Record<string, unknown>;

    if (typeof lineObj.lineIndex !== 'number') {
      throw new Error(`Invalid program: line at index ${i} must have a numeric lineIndex`);
    }

    if (!Array.isArray(lineObj.blocks)) {
      throw new Error(`Invalid program: line at index ${i} must have a blocks array`);
    }

    const blocks: CodingBlock[] = (lineObj.blocks as unknown[]).map((block, j) => {
      if (typeof block !== 'object' || block === null || Array.isArray(block)) {
        throw new Error(`Invalid program: block at line ${i}, index ${j} must be an object`);
      }

      const blockObj = block as Record<string, unknown>;

      if (typeof blockObj.type !== 'string' || !VALID_BLOCK_TYPES.includes(blockObj.type as BlockType)) {
        throw new Error(
          `Invalid program: block at line ${i}, index ${j} has invalid type "${blockObj.type}"`
        );
      }

      const codingBlock: CodingBlock = {
        id: generateId(),
        type: blockObj.type as BlockType,
      };

      if (blockObj.parameter !== undefined) {
        if (typeof blockObj.parameter !== 'number' && blockObj.parameter !== 'random') {
          throw new Error(
            `Invalid program: block at line ${i}, index ${j} has invalid parameter "${blockObj.parameter}"`
          );
        }
        codingBlock.parameter = blockObj.parameter as number | 'random';
      }

      return codingBlock;
    });

    return {
      lineIndex: lineObj.lineIndex as number,
      blocks,
    };
  });

  return { lines };
}
