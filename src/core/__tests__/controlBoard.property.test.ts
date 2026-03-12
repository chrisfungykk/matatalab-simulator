// Feature: matatalab-simulator, Property 3: Reordering preserves block set
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { reorderBlock, validatePlacement, placeBlockOnBoard } from '../controlBoard';
import { ControlBoardState, CodingBlock, BlockType } from '../types';

/**
 * Block types safe to place on line 0 (main program line).
 * Excludes function_define which is rejected on line 0.
 */
const MAIN_LINE_BLOCK_TYPES: BlockType[] = [
  'forward',
  'backward',
  'turn_left',
  'turn_right',
  'loop_begin',
  'loop_end',
  'function_call',
];

const mainLineBlockTypeArb = fc.constantFrom(...MAIN_LINE_BLOCK_TYPES);

/** Generate a CodingBlock with a unique ID and a random main-line-safe type. */
const codingBlockArb = (index: number): fc.Arbitrary<CodingBlock> =>
  mainLineBlockTypeArb.map((type) => ({
    id: `block-${index}`,
    type,
  }));

/**
 * Generate a non-empty board with 1–8 blocks on line 0.
 * Each block gets a unique sequential ID.
 */
const boardArb: fc.Arbitrary<ControlBoardState> = fc
  .integer({ min: 1, max: 8 })
  .chain((count) =>
    fc.tuple(...Array.from({ length: count }, (_, i) => codingBlockArb(i))),
  )
  .map((blocks) => ({
    lines: [{ lineIndex: 0, blocks }],
  }));

/** Collect all blocks from a board as a sorted array of [id, type] tuples for comparison. */
function collectBlockMultiset(board: ControlBoardState): [string, BlockType][] {
  const entries: [string, BlockType][] = [];
  for (const line of board.lines) {
    for (const block of line.blocks) {
      entries.push([block.id, block.type]);
    }
  }
  return entries.sort((a, b) => a[0].localeCompare(b[0]));
}

describe('Property 3: Reordering preserves block set', () => {
  // **Validates: Requirements 2.6**
  it('reordering a block preserves the multiset of blocks (same IDs, types, count)', () => {
    fc.assert(
      fc.property(
        boardArb.chain((board) => {
          const totalBlocks = board.lines[0].blocks.length;
          return fc.tuple(
            fc.constant(board),
            // Pick a random block index to reorder
            fc.integer({ min: 0, max: totalBlocks - 1 }),
            // Target line (keep on line 0 to avoid function_define rejection)
            fc.constant(0),
            // Target position
            fc.integer({ min: 0, max: totalBlocks - 1 }),
          );
        }),
        ([board, blockIndex, newLine, newPosition]) => {
          const blockId = board.lines[0].blocks[blockIndex].id;
          const beforeMultiset = collectBlockMultiset(board);

          const result = reorderBlock(board, blockId, newLine, newPosition);

          const afterMultiset = collectBlockMultiset(result);

          // The multiset of blocks must be identical
          expect(afterMultiset).toEqual(beforeMultiset);
        },
      ),
      { numRuns: 100 },
    );
  });
});


// Feature: matatalab-simulator, Property 12: Function_Define on main line rejected
describe('Property 12: Function_Define_Block on main line is rejected', () => {
  // **Validates: Requirements 3.3, 3.4**

  const emptyBoard: ControlBoardState = { lines: [{ lineIndex: 0, blocks: [] }] };

  it('validatePlacement rejects function_define on line 0 at any position', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 20 }),
        (position) => {
          const error = validatePlacement(emptyBoard, 'function_define', 0, position);
          expect(error).not.toBeNull();
          expect(typeof error).toBe('string');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('placeBlockOnBoard rejects function_define on line 0 and returns error', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 20 }),
        (position) => {
          const block: CodingBlock = { id: `fd-${position}`, type: 'function_define' };
          const result = placeBlockOnBoard(emptyBoard, block, 0, position);
          expect(result).toHaveProperty('error');
          expect((result as { error: string }).error).toBeTruthy();
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Feature: matatalab-simulator, Property 7: Number block on turn rejected
describe('Property 7: Number block on turn is rejected', () => {
  // **Validates: Requirements 4.7**

  const turnBlockTypes: ('turn_left' | 'turn_right')[] = ['turn_left', 'turn_right'];
  const numberBlockTypes: BlockType[] = [
    'number_2',
    'number_3',
    'number_4',
    'number_5',
    'number_random',
  ];

  const turnBlockArb = fc.constantFrom(...turnBlockTypes);
  const numberBlockArb = fc.constantFrom(...numberBlockTypes);

  it('placing a number block immediately after a turn block is rejected', () => {
    fc.assert(
      fc.property(
        turnBlockArb,
        numberBlockArb,
        (turnType, numberType) => {
          // Build a board with a turn block at position 0 on line 0
          const turnBlock: CodingBlock = { id: 'turn-0', type: turnType };
          const board: ControlBoardState = {
            lines: [{ lineIndex: 0, blocks: [turnBlock] }],
          };

          // Attempt to place a number block at position 1 (right after the turn)
          const numberBlock: CodingBlock = { id: 'num-1', type: numberType };
          const result = placeBlockOnBoard(board, numberBlock, 0, 1);

          expect(result).toHaveProperty('error');
          expect((result as { error: string }).error).toBeTruthy();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('validatePlacement rejects number block after turn block', () => {
    fc.assert(
      fc.property(
        turnBlockArb,
        numberBlockArb,
        (turnType, numberType) => {
          const turnBlock: CodingBlock = { id: 'turn-0', type: turnType };
          const board: ControlBoardState = {
            lines: [{ lineIndex: 0, blocks: [turnBlock] }],
          };

          const error = validatePlacement(board, numberType, 0, 1);
          expect(error).not.toBeNull();
          expect(typeof error).toBe('string');
        },
      ),
      { numRuns: 100 },
    );
  });
});
