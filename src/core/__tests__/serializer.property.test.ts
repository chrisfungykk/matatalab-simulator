// Feature: matatalab-simulator, Property 19: Program serialization round-trip
// Feature: matatalab-simulator, Property 20: Invalid program JSON is rejected gracefully
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { serialize, deserialize } from '../serializer';
import type { ControlBoardState, CodingBlock, BlockType } from '../types';

// ── Helpers ─────────────────────────────────────────────────────────

const ALL_BLOCK_TYPES: BlockType[] = [
  'forward', 'backward', 'turn_left', 'turn_right',
  'loop_begin', 'loop_end', 'function_define', 'function_call',
  'number_2', 'number_3', 'number_4', 'number_5', 'number_random',
  'fun_random_move', 'fun_music', 'fun_dance',
];

let idCounter = 0;
function makeBlock(type: BlockType, parameter?: number | 'random'): CodingBlock {
  const block: CodingBlock = { id: `test_${++idCounter}`, type };
  if (parameter !== undefined) {
    block.parameter = parameter;
  }
  return block;
}

// ── Arbitraries ─────────────────────────────────────────────────────

const blockTypeArb = fc.constantFrom<BlockType>(...ALL_BLOCK_TYPES);

const parameterArb = fc.oneof(
  fc.constant(undefined),
  fc.integer({ min: 1, max: 6 }),
  fc.constant('random' as const),
);

const codingBlockArb = fc.tuple(blockTypeArb, parameterArb).map(
  ([type, param]) => makeBlock(type, param)
);

const programLineArb = (lineIndex: number) =>
  fc.array(codingBlockArb, { minLength: 0, maxLength: 5 }).map(blocks => ({
    lineIndex,
    blocks,
  }));

const controlBoardArb: fc.Arbitrary<ControlBoardState> =
  fc.integer({ min: 1, max: 3 }).chain(numLines =>
    fc.tuple(
      ...Array.from({ length: numLines }, (_, i) => programLineArb(i))
    ).map(lines => ({ lines }))
  );

// ── Property 19: Program serialization round-trip ───────────────────
// Feature: matatalab-simulator, Property 19
describe('Property 19: Program serialization round-trip', () => {
  // **Validates: Requirements 13.1, 13.2, 13.3, 13.4**

  it('serialize then deserialize produces equivalent state (same block types, parameters, line assignments, ordering)', () => {
    fc.assert(
      fc.property(controlBoardArb, (board) => {
        const json = serialize(board);
        const restored = deserialize(json);

        // Same number of lines
        expect(restored.lines.length).toBe(board.lines.length);

        for (let i = 0; i < board.lines.length; i++) {
          const origLine = board.lines[i];
          const restoredLine = restored.lines[i];

          // Same line index
          expect(restoredLine.lineIndex).toBe(origLine.lineIndex);

          // Same number of blocks
          expect(restoredLine.blocks.length).toBe(origLine.blocks.length);

          for (let j = 0; j < origLine.blocks.length; j++) {
            const origBlock = origLine.blocks[j];
            const restoredBlock = restoredLine.blocks[j];

            // Same type
            expect(restoredBlock.type).toBe(origBlock.type);

            // Same parameter (IDs will differ since deserialize generates new ones)
            expect(restoredBlock.parameter).toBe(origBlock.parameter);
          }
        }
      }),
      { numRuns: 150 }
    );
  });

  it('serialized JSON is valid JSON and contains version 1', () => {
    fc.assert(
      fc.property(controlBoardArb, (board) => {
        const json = serialize(board);
        const parsed = JSON.parse(json);
        expect(parsed.version).toBe(1);
        expect(Array.isArray(parsed.lines)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

// ── Property 20: Invalid program JSON is rejected gracefully ────────
// Feature: matatalab-simulator, Property 20
describe('Property 20: Invalid program JSON is rejected gracefully', () => {
  // **Validates: Requirements 13.5**

  it('rejects invalid JSON strings', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => {
          try { JSON.parse(s); return false; } catch { return true; }
        }),
        (invalidJson) => {
          expect(() => deserialize(invalidJson)).toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects JSON missing version field', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ lineIndex: fc.nat(), blocks: fc.constant([]) }), { minLength: 0, maxLength: 3 }),
        (lines) => {
          const json = JSON.stringify({ lines });
          expect(() => deserialize(json)).toThrow(/version/i);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects JSON with wrong version', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 100 }),
        (version) => {
          const json = JSON.stringify({ version, lines: [] });
          expect(() => deserialize(json)).toThrow(/version/i);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects JSON missing lines field', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const json = JSON.stringify({ version: 1 });
          expect(() => deserialize(json)).toThrow(/lines/i);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects JSON with invalid block types', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => !ALL_BLOCK_TYPES.includes(s as BlockType) && s.length > 0),
        (invalidType) => {
          const json = JSON.stringify({
            version: 1,
            lines: [{ lineIndex: 0, blocks: [{ type: invalidType }] }],
          });
          expect(() => deserialize(json)).toThrow(/invalid type/i);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects non-object JSON values (arrays, strings, numbers, booleans, null)', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.array(fc.anything()).map(v => JSON.stringify(v)),
          fc.double().map(v => JSON.stringify(v)),
          fc.boolean().map(v => JSON.stringify(v)),
          fc.constant('null'),
          fc.constant('"hello"'),
        ),
        (json) => {
          expect(() => deserialize(json)).toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });
});
