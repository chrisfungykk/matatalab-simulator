import { ControlBoardState, CodingBlock, BlockType, ProgramLine } from './types';

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
 * Validate whether a block placement is allowed.
 * Returns an error message string if invalid, or null if valid.
 */
export function validatePlacement(
  board: ControlBoardState,
  blockType: BlockType,
  line: number,
  position: number,
): string | null {
  // Reject function_define on line 0 (main program line)
  if (blockType === 'function_define' && line === 0) {
    return 'Function Define block cannot be placed on the main program line';
  }

  // Reject number blocks placed after turn blocks
  if (NUMBER_BLOCK_TYPES.has(blockType) && position > 0) {
    const existingLine = board.lines.find((l) => l.lineIndex === line);
    if (existingLine) {
      const prevBlock = existingLine.blocks[position - 1];
      if (prevBlock && TURN_BLOCK_TYPES.has(prevBlock.type)) {
        return 'Number blocks cannot be placed after turn blocks';
      }
    }
  }

  return null;
}


/**
 * Place a coding block on the control board at the given line and position.
 * Returns the updated board state, or an object with an error string if placement is invalid.
 */
export function placeBlockOnBoard(
  board: ControlBoardState,
  block: CodingBlock,
  line: number,
  position: number,
): ControlBoardState | { error: string } {
  const validationError = validatePlacement(board, block.type, line, position);
  if (validationError) {
    return { error: validationError };
  }

  const existingLineIndex = board.lines.findIndex((l) => l.lineIndex === line);

  if (existingLineIndex === -1) {
    // Line doesn't exist — create it with the block
    const newLine: ProgramLine = { lineIndex: line, blocks: [block] };
    const newLines = [...board.lines, newLine].sort(
      (a, b) => a.lineIndex - b.lineIndex,
    );
    return { lines: newLines };
  }

  // Line exists — insert block at position
  const existingLine = board.lines[existingLineIndex];
  const newBlocks = [...existingLine.blocks];
  const clampedPosition = Math.min(position, newBlocks.length);
  newBlocks.splice(clampedPosition, 0, block);

  const newLines = board.lines.map((l) =>
    l.lineIndex === line ? { ...l, blocks: newBlocks } : l,
  );

  return { lines: newLines };
}

/**
 * Remove a block from the control board by its unique ID.
 * Returns the updated board state. If the block is not found, returns the board unchanged.
 */
export function removeBlockFromBoard(
  board: ControlBoardState,
  blockId: string,
): ControlBoardState {
  const newLines = board.lines
    .map((line) => ({
      ...line,
      blocks: line.blocks.filter((b) => b.id !== blockId),
    }))
    .filter((line) => line.blocks.length > 0);

  return { lines: newLines };
}

/**
 * Move a block to a new line and position on the control board.
 * Removes the block from its current location and inserts it at the new position.
 * Returns the updated board state.
 */
export function reorderBlock(
  board: ControlBoardState,
  blockId: string,
  newLine: number,
  newPosition: number,
): ControlBoardState {
  // Find the block
  let targetBlock: CodingBlock | undefined;
  for (const line of board.lines) {
    const found = line.blocks.find((b) => b.id === blockId);
    if (found) {
      targetBlock = found;
      break;
    }
  }

  if (!targetBlock) {
    return board;
  }

  // Remove the block first
  const boardAfterRemoval = removeBlockFromBoard(board, blockId);

  // Validate the new placement
  const validationError = validatePlacement(
    boardAfterRemoval,
    targetBlock.type,
    newLine,
    newPosition,
  );
  if (validationError) {
    // If the new placement is invalid, return the original board unchanged
    return board;
  }

  // Insert at the new position
  const existingLineIndex = boardAfterRemoval.lines.findIndex(
    (l) => l.lineIndex === newLine,
  );

  if (existingLineIndex === -1) {
    // Create the line
    const newProgramLine: ProgramLine = {
      lineIndex: newLine,
      blocks: [targetBlock],
    };
    const newLines = [...boardAfterRemoval.lines, newProgramLine].sort(
      (a, b) => a.lineIndex - b.lineIndex,
    );
    return { lines: newLines };
  }

  const existingLine = boardAfterRemoval.lines[existingLineIndex];
  const newBlocks = [...existingLine.blocks];
  const clampedPosition = Math.min(newPosition, newBlocks.length);
  newBlocks.splice(clampedPosition, 0, targetBlock);

  const newLines = boardAfterRemoval.lines.map((l) =>
    l.lineIndex === newLine ? { ...l, blocks: newBlocks } : l,
  );

  return { lines: newLines };
}
