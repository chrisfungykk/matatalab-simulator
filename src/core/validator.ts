import {
  ControlBoardState,
  ValidationResult,
  ValidationError,
  BlockType,
} from './types';

/** Block types that are number parameters */
const NUMBER_BLOCK_TYPES: ReadonlySet<BlockType> = new Set([
  'number_2',
  'number_3',
  'number_4',
  'number_5',
  'number_random',
]);

/** Block types that are turn blocks */
const TURN_BLOCK_TYPES: ReadonlySet<BlockType> = new Set([
  'turn_left',
  'turn_right',
]);

/**
 * Validate a program on the control board for structural errors.
 * Returns a ValidationResult indicating whether the program is valid,
 * along with any errors found.
 */
export function validateProgram(board: ControlBoardState): ValidationResult {
  const errors: ValidationError[] = [];

  // Check if any function_define block exists on the board (any line)
  const hasFunctionDefine = board.lines.some((line) =>
    line.blocks.some((block) => block.type === 'function_define'),
  );

  for (const line of board.lines) {
    const blocks = line.blocks;

    // 6. Function_Define on main line (line 0)
    if (line.lineIndex === 0) {
      for (let i = 0; i < blocks.length; i++) {
        if (blocks[i].type === 'function_define') {
          errors.push({
            type: 'FUNCTION_ON_MAIN_LINE',
            blockIndex: i,
            line: line.lineIndex,
            messageKey: 'error.functionOnMainLine',
          });
        }
      }
    }

    // 5. Number_Block after Turn
    for (let i = 1; i < blocks.length; i++) {
      if (
        NUMBER_BLOCK_TYPES.has(blocks[i].type) &&
        TURN_BLOCK_TYPES.has(blocks[i - 1].type)
      ) {
        errors.push({
          type: 'NUMBER_ON_TURN',
          blockIndex: i,
          line: line.lineIndex,
          messageKey: 'error.numberOnTurn',
        });
      }
    }

    // Loop matching within this line
    // Track loop_begin indices to match with loop_end
    const loopBeginStack: number[] = [];

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];

      if (block.type === 'loop_begin') {
        // 3. Check for missing loop Number_Block (must be immediately after loop_begin)
        const nextBlock = blocks[i + 1];
        if (!nextBlock || !NUMBER_BLOCK_TYPES.has(nextBlock.type)) {
          errors.push({
            type: 'MISSING_LOOP_NUMBER',
            blockIndex: i,
            line: line.lineIndex,
            messageKey: 'error.missingLoopNumber',
          });
        }
        loopBeginStack.push(i);
      } else if (block.type === 'loop_end') {
        if (loopBeginStack.length === 0) {
          // 2. Unmatched Loop End
          errors.push({
            type: 'UNMATCHED_LOOP_END',
            blockIndex: i,
            line: line.lineIndex,
            messageKey: 'error.unmatchedLoopEnd',
          });
        } else {
          loopBeginStack.pop();
        }
      }
    }

    // 1. Any remaining loop_begin entries are unmatched
    for (const beginIndex of loopBeginStack) {
      errors.push({
        type: 'UNMATCHED_LOOP_BEGIN',
        blockIndex: beginIndex,
        line: line.lineIndex,
        messageKey: 'error.unmatchedLoopBegin',
      });
    }

    // 4. Function_Call without Function_Define on the board
    for (let i = 0; i < blocks.length; i++) {
      if (blocks[i].type === 'function_call' && !hasFunctionDefine) {
        errors.push({
          type: 'FUNCTION_CALL_NO_DEFINITION',
          blockIndex: i,
          line: line.lineIndex,
          messageKey: 'error.functionCallNoDefinition',
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
