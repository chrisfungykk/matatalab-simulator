// Feature: matatalab-simulator, Property 1: Block inventory round-trip
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { placeBlock, removeBlock } from '../inventory';
import { BlockType, DEFAULT_BLOCK_INVENTORY } from '../types';

const ALL_BLOCK_TYPES: BlockType[] = [
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

const blockTypeArb = fc.constantFrom(...ALL_BLOCK_TYPES);

describe('Property 1: Block inventory round-trip (place and remove)', () => {
  // **Validates: Requirements 2.3, 2.4**
  it('placing a block then removing it restores the original inventory count', () => {
    fc.assert(
      fc.property(blockTypeArb, (blockType) => {
        const inventory = { ...DEFAULT_BLOCK_INVENTORY };

        // Only test when count > 0
        fc.pre(inventory[blockType] > 0);

        const originalCount = inventory[blockType];

        // Place the block on the control board
        const placeResult = placeBlock(inventory, blockType);
        expect('inventory' in placeResult).toBe(true);

        if (!('inventory' in placeResult)) return;

        // Remove the block back to the inventory
        const restoredInventory = removeBlock(placeResult.inventory, blockType);

        // The count should be restored to the original value
        expect(restoredInventory[blockType]).toBe(originalCount);

        // All other block types should remain unchanged
        for (const otherType of ALL_BLOCK_TYPES) {
          if (otherType !== blockType) {
            expect(restoredInventory[otherType]).toBe(inventory[otherType]);
          }
        }
      }),
      { numRuns: 100 },
    );
  });
});

// Feature: matatalab-simulator, Property 2: Block inventory count bounds
describe('Property 2: Block inventory count is non-negative and bounded', () => {
  // **Validates: Requirements 2.2, 2.5**

  // Arbitrary for a random operation: either place or remove a random block type
  const operationArb = fc.record({
    action: fc.constantFrom('place' as const, 'remove' as const),
    blockType: blockTypeArb,
  });

  it('for any sequence of place/remove operations, counts stay in [0, initialLimit] and place is rejected at 0', () => {
    fc.assert(
      fc.property(fc.array(operationArb, { minLength: 1, maxLength: 50 }), (operations) => {
        let inventory = { ...DEFAULT_BLOCK_INVENTORY };

        for (const op of operations) {
          if (op.action === 'place') {
            const result = placeBlock(inventory, op.blockType);

            if (inventory[op.blockType] === 0) {
              // Place should be rejected when count is 0
              expect('error' in result).toBe(true);
            } else {
              expect('inventory' in result).toBe(true);
              if ('inventory' in result) {
                inventory = result.inventory;
              }
            }
          } else {
            inventory = removeBlock(inventory, op.blockType);
          }

          // After every operation, all counts must be in [0, initialLimit]
          for (const bt of ALL_BLOCK_TYPES) {
            expect(inventory[bt]).toBeGreaterThanOrEqual(0);
            expect(inventory[bt]).toBeLessThanOrEqual(DEFAULT_BLOCK_INVENTORY[bt]);
          }
        }
      }),
      { numRuns: 100 },
    );
  });
});
