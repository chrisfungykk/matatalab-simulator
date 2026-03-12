// Feature: matatalab-simulator, Property 9: Loop validation rejects malformed loops
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateProgram } from '../validator';
import { ControlBoardState, CodingBlock, BlockType } from '../types';

// ── Helpers ─────────────────────────────────────────────────────────

let blockIdCounter = 0;
function makeBlock(type: BlockType): CodingBlock {
  return { id: `block-${blockIdCounter++}`, type };
}

/** Block types that are safe filler (not loop/function structural blocks) */
const FILLER_BLOCK_TYPES: BlockType[] = [
  'forward',
  'backward',
  'turn_left',
  'turn_right',
];

const fillerBlockArb: fc.Arbitrary<CodingBlock> = fc
  .constantFrom(...FILLER_BLOCK_TYPES)
  .map((type) => makeBlock(type));

const fillerBlocksArb = (min = 0, max = 5): fc.Arbitrary<CodingBlock[]> =>
  fc.array(fillerBlockArb, { minLength: min, maxLength: max });

const NUMBER_BLOCK_TYPES: BlockType[] = [
  'number_2',
  'number_3',
  'number_4',
  'number_5',
  'number_random',
];

const numberBlockArb: fc.Arbitrary<CodingBlock> = fc
  .constantFrom(...NUMBER_BLOCK_TYPES)
  .map((type) => makeBlock(type));

function makeBoard(blocks: CodingBlock[], lineIndex = 0): ControlBoardState {
  return { lines: [{ lineIndex, blocks }] };
}

// ── Property 9: Loop validation rejects malformed loops ─────────────

describe('Property 9: Loop validation rejects malformed loops', () => {
  // **Validates: Requirements 5.3, 5.4, 5.5**

  it('unmatched Loop Begin (no Loop End) produces UNMATCHED_LOOP_BEGIN error', () => {
    fc.assert(
      fc.property(
        fillerBlocksArb(0, 4),
        fillerBlocksArb(0, 4),
        numberBlockArb,
        (before, after, numBlock) => {
          blockIdCounter = 0;
          // Build: [filler...] [loop_begin] [number] [filler...] — no loop_end
          const blocks: CodingBlock[] = [
            ...before,
            makeBlock('loop_begin'),
            numBlock,
            ...after,
          ];
          const board = makeBoard(blocks);
          const result = validateProgram(board);

          expect(result.valid).toBe(false);
          expect(
            result.errors.some((e) => e.type === 'UNMATCHED_LOOP_BEGIN'),
          ).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('unmatched Loop End (no Loop Begin) produces UNMATCHED_LOOP_END error', () => {
    fc.assert(
      fc.property(
        fillerBlocksArb(0, 4),
        fillerBlocksArb(0, 4),
        (before, after) => {
          blockIdCounter = 0;
          // Build: [filler...] [loop_end] [filler...] — no loop_begin
          const blocks: CodingBlock[] = [
            ...before,
            makeBlock('loop_end'),
            ...after,
          ];
          const board = makeBoard(blocks);
          const result = validateProgram(board);

          expect(result.valid).toBe(false);
          expect(
            result.errors.some((e) => e.type === 'UNMATCHED_LOOP_END'),
          ).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('Loop Begin without a Number_Block produces MISSING_LOOP_NUMBER error', () => {
    fc.assert(
      fc.property(
        fillerBlocksArb(0, 3),
        fillerBlocksArb(0, 3),
        (before, innerBlocks) => {
          blockIdCounter = 0;
          // Build: [filler...] [loop_begin] [filler (not number)...] [loop_end]
          // The block immediately after loop_begin is NOT a number block
          const blocks: CodingBlock[] = [
            ...before,
            makeBlock('loop_begin'),
            ...innerBlocks,
            makeBlock('loop_end'),
          ];
          const board = makeBoard(blocks);
          const result = validateProgram(board);

          expect(result.valid).toBe(false);
          expect(
            result.errors.some((e) => e.type === 'MISSING_LOOP_NUMBER'),
          ).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});


// Feature: matatalab-simulator, Property 11: Function call without definition rejected
describe('Property 11: Function call without definition is rejected', () => {
  // **Validates: Requirements 6.2**

  it('a program with function_call but no function_define produces FUNCTION_CALL_NO_DEFINITION error', () => {
    fc.assert(
      fc.property(
        fillerBlocksArb(0, 4),
        fillerBlocksArb(0, 4),
        fc.integer({ min: 1, max: 3 }),
        (before, after, callCount) => {
          blockIdCounter = 0;
          // Build a main line with filler + N function_call blocks + filler, no function_define anywhere
          const callBlocks = Array.from({ length: callCount }, () =>
            makeBlock('function_call'),
          );
          const blocks: CodingBlock[] = [...before, ...callBlocks, ...after];
          const board: ControlBoardState = {
            lines: [{ lineIndex: 0, blocks }],
          };
          const result = validateProgram(board);

          expect(result.valid).toBe(false);
          expect(
            result.errors.some((e) => e.type === 'FUNCTION_CALL_NO_DEFINITION'),
          ).toBe(true);
          // Should have one error per function_call block
          const callErrors = result.errors.filter(
            (e) => e.type === 'FUNCTION_CALL_NO_DEFINITION',
          );
          expect(callErrors.length).toBe(callCount);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('a program with function_call AND function_define does NOT produce FUNCTION_CALL_NO_DEFINITION error', () => {
    fc.assert(
      fc.property(
        fillerBlocksArb(0, 3),
        fillerBlocksArb(0, 3),
        (mainFiller, funcFiller) => {
          blockIdCounter = 0;
          // Main line has a function_call, function definition line has function_define
          const mainBlocks: CodingBlock[] = [
            ...mainFiller,
            makeBlock('function_call'),
          ];
          const funcBlocks: CodingBlock[] = [
            makeBlock('function_define'),
            ...funcFiller,
          ];
          const board: ControlBoardState = {
            lines: [
              { lineIndex: 0, blocks: mainBlocks },
              { lineIndex: 1, blocks: funcBlocks },
            ],
          };
          const result = validateProgram(board);

          // Should NOT have FUNCTION_CALL_NO_DEFINITION errors
          expect(
            result.errors.some((e) => e.type === 'FUNCTION_CALL_NO_DEFINITION'),
          ).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Feature: matatalab-simulator, Property 13: Validation runs before execution
describe('Property 13: Validation runs before execution', () => {
  // **Validates: Requirements 7.1**

  /**
   * Generate a program with at least one structural error.
   * We pick from three error categories: unmatched loop, missing function def, number on turn.
   */
  const errorCategory = fc.constantFrom(
    'unmatched_loop_begin' as const,
    'unmatched_loop_end' as const,
    'missing_loop_number' as const,
    'function_call_no_def' as const,
    'number_on_turn' as const,
  );

  function buildErrorBoard(
    category: string,
    filler: CodingBlock[],
  ): ControlBoardState {
    blockIdCounter = 0;
    switch (category) {
      case 'unmatched_loop_begin':
        return makeBoard([
          ...filler,
          makeBlock('loop_begin'),
          makeBlock('number_3'),
          makeBlock('forward'),
        ]);
      case 'unmatched_loop_end':
        return makeBoard([
          ...filler,
          makeBlock('forward'),
          makeBlock('loop_end'),
        ]);
      case 'missing_loop_number':
        return makeBoard([
          ...filler,
          makeBlock('loop_begin'),
          makeBlock('forward'),
          makeBlock('loop_end'),
        ]);
      case 'function_call_no_def':
        return {
          lines: [
            {
              lineIndex: 0,
              blocks: [...filler, makeBlock('function_call')],
            },
          ],
        };
      case 'number_on_turn': {
        // We need turn followed by number — validator checks this pattern
        const turnBlock = makeBlock('turn_left');
        const numBlock = makeBlock('number_2');
        return makeBoard([...filler, turnBlock, numBlock]);
      }
      default:
        return makeBoard([]);
    }
  }

  it('programs with structural errors are rejected by validateProgram (errors returned, valid=false)', () => {
    fc.assert(
      fc.property(
        errorCategory,
        fillerBlocksArb(0, 3),
        (category, filler) => {
          const board = buildErrorBoard(category, filler);
          const result = validateProgram(board);

          // Validation must detect the error
          expect(result.valid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);

          // Each error should have required fields
          for (const error of result.errors) {
            expect(error).toHaveProperty('type');
            expect(error).toHaveProperty('blockIndex');
            expect(error).toHaveProperty('line');
            expect(error).toHaveProperty('messageKey');
            expect(typeof error.blockIndex).toBe('number');
            expect(typeof error.line).toBe('number');
            expect(typeof error.messageKey).toBe('string');
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('a valid program with no structural errors passes validation', () => {
    fc.assert(
      fc.property(
        fillerBlocksArb(1, 6),
        (filler) => {
          blockIdCounter = 0;
          // A simple program with only motion/turn blocks — no structural issues
          const board = makeBoard(filler);
          const result = validateProgram(board);

          expect(result.valid).toBe(true);
          expect(result.errors.length).toBe(0);
        },
      ),
      { numRuns: 100 },
    );
  });
});
