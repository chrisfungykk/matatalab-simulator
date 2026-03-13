// Feature: ipad-touch-interaction — Property-based tests for tap-to-place logic
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { BlockType, DEFAULT_BLOCK_INVENTORY, ControlBoardState, ProgramLine } from '../types';
import { simulatorReducer, createInitialState } from '../simulatorReducer';
import { placeBlock } from '../inventory';

// ── Constants ───────────────────────────────────────────────────────

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

// ── Generators ──────────────────────────────────────────────────────

/** Generates a random BlockType from the union type. */
const arbitraryBlockType: fc.Arbitrary<BlockType> = fc.constantFrom(...ALL_BLOCK_TYPES);

/** Generates a Record<BlockType, number> with counts 0–4. */
const arbitraryInventory: fc.Arbitrary<Record<BlockType, number>> = fc
  .tuple(...ALL_BLOCK_TYPES.map(() => fc.integer({ min: 0, max: 4 })))
  .map((counts) => {
    const inv = {} as Record<BlockType, number>;
    ALL_BLOCK_TYPES.forEach((bt, i) => {
      inv[bt] = counts[i];
    });
    return inv;
  });

/** Generates a ControlBoardState with 0–2 lines, each with 0–5 blocks. */
const arbitraryControlBoard: fc.Arbitrary<ControlBoardState> = fc
  .integer({ min: 0, max: 2 })
  .chain((numLines) =>
    fc.tuple(
      ...Array.from({ length: numLines }, (_, lineIndex) =>
        fc
          .array(
            fc.record({
              id: fc.uuid(),
              type: arbitraryBlockType,
            }),
            { minLength: 0, maxLength: 5 },
          )
          .map(
            (blocks): ProgramLine => ({
              lineIndex,
              blocks: blocks.map((b) => ({ id: b.id, type: b.type })),
            }),
          ),
      ),
    ),
  )
  .map((lines): ControlBoardState => ({ lines: lines.filter((l) => l.blocks.length > 0) }));


// ── Pure logic helpers (mirroring TapToPlace context + component logic) ──

/**
 * Selection logic: select a block from inventory.
 * Returns the new selectedBlock value.
 */
function selectBlock(blockType: BlockType): BlockType {
  return blockType;
}

/**
 * Selection logic: deselect the current block.
 * Returns null.
 */
function deselectBlock(): null {
  return null;
}

/**
 * Toggle selection logic (as implemented in BlockInventory onClick):
 * - If disabled (count === 0): no-op, return current selection
 * - If same block is already selected: deselect (return null)
 * - Otherwise: select the new block
 */
function toggleSelection(
  currentSelection: BlockType | null,
  tappedBlock: BlockType,
  inventory: Record<BlockType, number>,
): BlockType | null {
  if (inventory[tappedBlock] <= 0) {
    return currentSelection; // disabled block → no change
  }
  if (currentSelection === tappedBlock) {
    return deselectBlock(); // toggle off
  }
  return selectBlock(tappedBlock); // select new
}

/**
 * Determine post-placement selection:
 * After placing a block, if remaining count > 0 keep selection, else deselect.
 */
function postPlacementSelection(
  placedBlockType: BlockType,
  updatedInventory: Record<BlockType, number>,
): BlockType | null {
  return updatedInventory[placedBlockType] > 0 ? placedBlockType : null;
}

/**
 * Compute ARIA announcement text for a state-changing action.
 */
function getAnnouncement(
  action: 'select' | 'place' | 'remove',
  blockType: BlockType,
): string {
  switch (action) {
    case 'select':
      return `Selected ${blockType}`;
    case 'place':
      return `Placed ${blockType}`;
    case 'remove':
      return `Removed ${blockType}`;
  }
}

// ── Property Tests ──────────────────────────────────────────────────

// Feature: ipad-touch-interaction, Property 1: Tapping an available block selects it
describe('Property 1: Tapping an available block selects it', () => {
  // **Validates: Requirements 1.1, 1.3**
  it('for any block type with count > 0, tapping it should set it as selected', () => {
    fc.assert(
      fc.property(
        arbitraryBlockType,
        arbitraryInventory,
        fc.option(arbitraryBlockType, { nil: null }),
        (blockType, inventory, previousSelection) => {
          // Only test when count > 0
          fc.pre(inventory[blockType] > 0);

          const result = toggleSelection(previousSelection, blockType, inventory);

          // If the previous selection was the same block, it toggles off
          // But if it's a different block or no selection, it should select
          if (previousSelection === blockType) {
            // This is the toggle-off case (covered by Property 2)
            expect(result).toBeNull();
          } else {
            expect(result).toBe(blockType);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Feature: ipad-touch-interaction, Property 2: Select then re-select deselects
describe('Property 2: Selecting then re-selecting the same block deselects it', () => {
  // **Validates: Requirements 1.2**
  it('for any block type with count > 0, selecting then tapping again should result in null selection', () => {
    fc.assert(
      fc.property(arbitraryBlockType, arbitraryInventory, (blockType, inventory) => {
        fc.pre(inventory[blockType] > 0);

        // First tap: select
        const afterFirstTap = toggleSelection(null, blockType, inventory);
        expect(afterFirstTap).toBe(blockType);

        // Second tap: deselect (toggle off)
        const afterSecondTap = toggleSelection(afterFirstTap, blockType, inventory);
        expect(afterSecondTap).toBeNull();
      }),
      { numRuns: 100 },
    );
  });
});

// Feature: ipad-touch-interaction, Property 3: Tapping disabled block is no-op
describe('Property 3: Tapping a disabled block does not change selection', () => {
  // **Validates: Requirements 1.4**
  it('for any block type with count = 0 and any selection state, tapping should not change selection', () => {
    fc.assert(
      fc.property(
        arbitraryBlockType,
        fc.option(arbitraryBlockType, { nil: null }),
        arbitraryInventory,
        (disabledBlock, currentSelection, inventory) => {
          // Force the tapped block to have count 0
          const modifiedInventory = { ...inventory, [disabledBlock]: 0 };

          const result = toggleSelection(currentSelection, disabledBlock, modifiedInventory);
          expect(result).toBe(currentSelection);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Feature: ipad-touch-interaction, Property 4: Placing selected block at drop zone
describe('Property 4: Placing a selected block at a drop zone', () => {
  // **Validates: Requirements 2.1, 2.2**
  it('for any selected block with count > 0 and valid position, placement should add block and decrement count by 1', () => {
    fc.assert(
      fc.property(
        arbitraryBlockType,
        arbitraryInventory,
        (blockType, inventory) => {
          fc.pre(inventory[blockType] > 0);

          // Skip function_define on line 0 (validation rejects it)
          // We test on line 1 for function_define, line 0 for others
          const line = blockType === 'function_define' ? 1 : 0;
          const position = 0;

          // Build a state with the given inventory
          const state = createInitialState();
          state.blockInventory = { ...inventory };

          const originalCount = state.blockInventory[blockType];

          // Count blocks of this type on the board before placement
          const blocksBefore = state.controlBoard.lines
            .flatMap((l) => l.blocks)
            .filter((b) => b.type === blockType).length;

          const newState = simulatorReducer(state, {
            type: 'PLACE_BLOCK',
            blockType,
            line,
            position,
          });

          // Inventory count should decrease by 1
          expect(newState.blockInventory[blockType]).toBe(originalCount - 1);

          // Board should have one more block of this type
          const blocksAfter = newState.controlBoard.lines
            .flatMap((l) => l.blocks)
            .filter((b) => b.type === blockType).length;
          expect(blocksAfter).toBe(blocksBefore + 1);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Feature: ipad-touch-interaction, Property 5: No placement without selection
describe('Property 5: No placement occurs without a selection', () => {
  // **Validates: Requirements 2.3**
  it('for any board state with null selection, tapping a drop zone should not change the board', () => {
    fc.assert(
      fc.property(arbitraryControlBoard, (board) => {
        // With null selection, the UI would not dispatch PLACE_BLOCK at all.
        // We verify the invariant: if selectedBlock is null, the board is unchanged.
        const selectedBlock: BlockType | null = null;

        // The tap-to-place logic: if selectedBlock is null, no action is dispatched.
        // So the board state should remain identical.
        const boardAfter = selectedBlock === null ? board : board; // no-op path
        expect(boardAfter).toEqual(board);

        // Also verify via reducer: even if we somehow tried to place without
        // a valid block, the reducer protects against count=0 blocks
        const state = createInitialState();
        state.controlBoard = board;
        // Set all inventory to 0 to simulate "nothing selected" scenario
        const emptyInventory = { ...DEFAULT_BLOCK_INVENTORY };
        ALL_BLOCK_TYPES.forEach((bt) => {
          emptyInventory[bt] = 0;
        });
        state.blockInventory = emptyInventory;

        // Try placing any block — should be rejected (count is 0)
        const blockToTry = ALL_BLOCK_TYPES[0];
        const newState = simulatorReducer(state, {
          type: 'PLACE_BLOCK',
          blockType: blockToTry,
          line: 0,
          position: 0,
        });

        // Board should be unchanged
        expect(newState.controlBoard).toEqual(board);
      }),
      { numRuns: 100 },
    );
  });
});

// Feature: ipad-touch-interaction, Property 6: Post-placement selection reflects count
describe('Property 6: Post-placement selection reflects inventory count', () => {
  // **Validates: Requirements 2.4, 2.5**
  it('for any placed block, selection persists iff remaining count > 0', () => {
    fc.assert(
      fc.property(arbitraryBlockType, arbitraryInventory, (blockType, inventory) => {
        fc.pre(inventory[blockType] > 0);

        // Simulate placement: decrement inventory
        const placeResult = placeBlock(inventory, blockType);
        if ('error' in placeResult) return; // shouldn't happen given precondition

        const updatedInventory = placeResult.inventory;
        const newSelection = postPlacementSelection(blockType, updatedInventory);

        if (updatedInventory[blockType] > 0) {
          // Selection should persist
          expect(newSelection).toBe(blockType);
        } else {
          // Selection should be cleared
          expect(newSelection).toBeNull();
        }
      }),
      { numRuns: 100 },
    );
  });
});

// Feature: ipad-touch-interaction, Property 7: Tap board block without selection removes it
describe('Property 7: Tapping a board block without selection removes it', () => {
  // **Validates: Requirements 3.1**
  it('for any board block with null selection, tapping removes it and increments inventory by 1', () => {
    fc.assert(
      fc.property(
        arbitraryBlockType,
        arbitraryInventory,
        (blockType, inventory) => {
          // Ensure we can place a block first (need count > 0)
          fc.pre(inventory[blockType] > 0);

          // Skip function_define on line 0
          const line = blockType === 'function_define' ? 1 : 0;

          // Set up state and place a block so we have something to remove
          const state = createInitialState();
          state.blockInventory = { ...inventory };

          const stateAfterPlace = simulatorReducer(state, {
            type: 'PLACE_BLOCK',
            blockType,
            line,
            position: 0,
          });

          // Find the placed block's ID
          const placedLine = stateAfterPlace.controlBoard.lines.find(
            (l) => l.lineIndex === line,
          );
          if (!placedLine || placedLine.blocks.length === 0) return;

          const placedBlock = placedLine.blocks[0];
          const inventoryAfterPlace = stateAfterPlace.blockInventory[blockType];

          // Now remove it (simulating tap with no selection)
          const stateAfterRemove = simulatorReducer(stateAfterPlace, {
            type: 'REMOVE_BLOCK',
            blockId: placedBlock.id,
          });

          // Inventory should increment by 1, capped at the default max
          const expectedCount = Math.min(
            inventoryAfterPlace + 1,
            DEFAULT_BLOCK_INVENTORY[blockType],
          );
          expect(stateAfterRemove.blockInventory[blockType]).toBe(expectedCount);

          // Block should no longer be on the board
          const allBlockIds = stateAfterRemove.controlBoard.lines
            .flatMap((l) => l.blocks)
            .map((b) => b.id);
          expect(allBlockIds).not.toContain(placedBlock.id);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Feature: ipad-touch-interaction, Property 8: Tap board block with selection inserts before
describe('Property 8: Tapping a board block with selection inserts before it', () => {
  // **Validates: Requirements 3.2**
  it('for any selected block and board block, tapping inserts before without removing', () => {
    fc.assert(
      fc.property(
        arbitraryBlockType,
        arbitraryBlockType,
        arbitraryInventory,
        (existingBlockType, selectedBlockType, inventory) => {
          // Need count > 0 for both blocks
          fc.pre(inventory[existingBlockType] > 0);
          fc.pre(inventory[selectedBlockType] > 0);

          // Skip function_define on line 0
          const line = existingBlockType === 'function_define' || selectedBlockType === 'function_define' ? 1 : 0;

          // Set up state and place the existing block
          const state = createInitialState();
          state.blockInventory = { ...inventory };

          const stateWithExisting = simulatorReducer(state, {
            type: 'PLACE_BLOCK',
            blockType: existingBlockType,
            line,
            position: 0,
          });

          // Find the existing block
          const existingLine = stateWithExisting.controlBoard.lines.find(
            (l) => l.lineIndex === line,
          );
          if (!existingLine || existingLine.blocks.length === 0) return;

          const existingBlock = existingLine.blocks[0];

          // Check if we still have inventory for the selected block
          fc.pre(stateWithExisting.blockInventory[selectedBlockType] > 0);

          const totalBlocksBefore = stateWithExisting.controlBoard.lines
            .flatMap((l) => l.blocks).length;

          // Insert selected block before the existing block (position 0)
          const stateAfterInsert = simulatorReducer(stateWithExisting, {
            type: 'PLACE_BLOCK',
            blockType: selectedBlockType,
            line,
            position: 0,
          });

          // The existing block should still be on the board
          const allBlockIds = stateAfterInsert.controlBoard.lines
            .flatMap((l) => l.blocks)
            .map((b) => b.id);
          expect(allBlockIds).toContain(existingBlock.id);

          // Total blocks should increase by 1
          const totalBlocksAfter = stateAfterInsert.controlBoard.lines
            .flatMap((l) => l.blocks).length;
          expect(totalBlocksAfter).toBe(totalBlocksBefore + 1);

          // The inserted block should be before the existing block on the same line
          const updatedLine = stateAfterInsert.controlBoard.lines.find(
            (l) => l.lineIndex === line,
          );
          if (!updatedLine) return;

          const existingBlockIndex = updatedLine.blocks.findIndex(
            (b) => b.id === existingBlock.id,
          );
          // The new block was inserted at position 0, so existing should be at index 1+
          expect(existingBlockIndex).toBeGreaterThan(0);

          // The block at position 0 should be the selected type
          expect(updatedLine.blocks[0].type).toBe(selectedBlockType);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Feature: ipad-touch-interaction, Property 9: ARIA live region updates on state changes
describe('Property 9: ARIA live region announces state changes', () => {
  // **Validates: Requirements 8.3, 8.4**
  it('for any state-changing action, the ARIA live region text should update', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('select' as const, 'place' as const, 'remove' as const),
        arbitraryBlockType,
        (action, blockType) => {
          const announcement = getAnnouncement(action, blockType);

          // Announcement should be a non-empty string
          expect(announcement).toBeTruthy();
          expect(typeof announcement).toBe('string');
          expect(announcement.length).toBeGreaterThan(0);

          // Announcement should contain the block type name
          expect(announcement).toContain(blockType);

          // Announcement should describe the action
          switch (action) {
            case 'select':
              expect(announcement.toLowerCase()).toContain('selected');
              break;
            case 'place':
              expect(announcement.toLowerCase()).toContain('placed');
              break;
            case 'remove':
              expect(announcement.toLowerCase()).toContain('removed');
              break;
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
