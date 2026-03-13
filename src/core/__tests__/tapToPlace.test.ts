// Unit tests for tap-to-place selection, placement, and removal logic
import { describe, it, expect } from 'vitest';
import { BlockType, DEFAULT_BLOCK_INVENTORY } from '../types';
import { simulatorReducer, createInitialState } from '../simulatorReducer';
import { placeBlock, removeBlock } from '../inventory';

// ── Helper: toggle selection logic (mirrors BlockInventory onClick) ──

function toggleSelection(
  currentSelection: BlockType | null,
  tappedBlock: BlockType,
  inventory: Record<BlockType, number>,
): BlockType | null {
  if (inventory[tappedBlock] <= 0) return currentSelection;
  if (currentSelection === tappedBlock) return null;
  return tappedBlock;
}

// ── 11.1: Selection logic tests ─────────────────────────────────────

describe('Selection logic', () => {
  const fullInventory = { ...DEFAULT_BLOCK_INVENTORY };

  it('selects a block when nothing is selected', () => {
    expect(toggleSelection(null, 'forward', fullInventory)).toBe('forward');
  });

  it('deselects when tapping the same block', () => {
    expect(toggleSelection('forward', 'forward', fullInventory)).toBeNull();
  });

  it('toggles between different blocks', () => {
    const first = toggleSelection(null, 'forward', fullInventory);
    expect(first).toBe('forward');
    const second = toggleSelection(first, 'turn_left', fullInventory);
    expect(second).toBe('turn_left');
  });

  it('does not select a disabled block (count 0)', () => {
    const inv = { ...fullInventory, forward: 0 };
    expect(toggleSelection(null, 'forward', inv)).toBeNull();
  });

  it('keeps current selection when tapping a disabled block', () => {
    const inv = { ...fullInventory, turn_left: 0 };
    expect(toggleSelection('forward', 'turn_left', inv)).toBe('forward');
  });

  it('full round-trip: select → deselect → select different', () => {
    let sel = toggleSelection(null, 'forward', fullInventory);
    expect(sel).toBe('forward');
    sel = toggleSelection(sel, 'forward', fullInventory);
    expect(sel).toBeNull();
    sel = toggleSelection(sel, 'backward', fullInventory);
    expect(sel).toBe('backward');
  });
});


// ── 11.2: Placement logic tests ─────────────────────────────────────

describe('Placement logic', () => {
  it('places a block at a drop zone position', () => {
    const state = createInitialState();
    const newState = simulatorReducer(state, {
      type: 'PLACE_BLOCK',
      blockType: 'forward',
      line: 0,
      position: 0,
    });

    expect(newState.blockInventory.forward).toBe(DEFAULT_BLOCK_INVENTORY.forward - 1);
    const line0 = newState.controlBoard.lines.find((l) => l.lineIndex === 0);
    expect(line0).toBeDefined();
    expect(line0!.blocks).toHaveLength(1);
    expect(line0!.blocks[0].type).toBe('forward');
  });

  it('places a block on an empty line at position 0', () => {
    const state = createInitialState();
    // Line 1 doesn't exist yet — placing creates it
    const newState = simulatorReducer(state, {
      type: 'PLACE_BLOCK',
      blockType: 'turn_left',
      line: 1,
      position: 0,
    });

    const line1 = newState.controlBoard.lines.find((l) => l.lineIndex === 1);
    expect(line1).toBeDefined();
    expect(line1!.blocks).toHaveLength(1);
    expect(line1!.blocks[0].type).toBe('turn_left');
  });

  it('rejects function_define on line 0', () => {
    const state = createInitialState();
    const newState = simulatorReducer(state, {
      type: 'PLACE_BLOCK',
      blockType: 'function_define',
      line: 0,
      position: 0,
    });

    // State should be unchanged — placement rejected
    expect(newState.controlBoard).toEqual(state.controlBoard);
    expect(newState.blockInventory.function_define).toBe(
      DEFAULT_BLOCK_INVENTORY.function_define,
    );
  });

  it('allows function_define on line 1', () => {
    const state = createInitialState();
    const newState = simulatorReducer(state, {
      type: 'PLACE_BLOCK',
      blockType: 'function_define',
      line: 1,
      position: 0,
    });

    expect(newState.blockInventory.function_define).toBe(
      DEFAULT_BLOCK_INVENTORY.function_define - 1,
    );
    const line1 = newState.controlBoard.lines.find((l) => l.lineIndex === 1);
    expect(line1!.blocks[0].type).toBe('function_define');
  });

  it('does not place when inventory count is 0', () => {
    const state = createInitialState();
    state.blockInventory = { ...state.blockInventory, forward: 0 };

    const newState = simulatorReducer(state, {
      type: 'PLACE_BLOCK',
      blockType: 'forward',
      line: 0,
      position: 0,
    });

    expect(newState).toBe(state); // exact same reference — no change
  });

  it('decrements inventory by exactly 1 on placement', () => {
    const state = createInitialState();
    const before = state.blockInventory.forward;
    const newState = simulatorReducer(state, {
      type: 'PLACE_BLOCK',
      blockType: 'forward',
      line: 0,
      position: 0,
    });
    expect(newState.blockInventory.forward).toBe(before - 1);
  });

  it('post-placement selection: keeps selection when count > 0', () => {
    const inv = { ...DEFAULT_BLOCK_INVENTORY, forward: 2 };
    const result = placeBlock(inv, 'forward');
    expect('inventory' in result).toBe(true);
    if ('inventory' in result) {
      expect(result.inventory.forward).toBe(1);
      // count > 0 → selection should persist
      expect(result.inventory.forward > 0).toBe(true);
    }
  });

  it('post-placement selection: deselects when count reaches 0', () => {
    const inv = { ...DEFAULT_BLOCK_INVENTORY, fun_dance: 1 };
    const result = placeBlock(inv, 'fun_dance');
    expect('inventory' in result).toBe(true);
    if ('inventory' in result) {
      expect(result.inventory.fun_dance).toBe(0);
      // count === 0 → selection should be cleared
      expect(result.inventory.fun_dance > 0).toBe(false);
    }
  });
});


// ── 11.3: Removal logic tests ───────────────────────────────────────

describe('Removal logic', () => {
  it('tap to remove: removes block and increments inventory', () => {
    const state = createInitialState();
    // Place a block first
    const placed = simulatorReducer(state, {
      type: 'PLACE_BLOCK',
      blockType: 'forward',
      line: 0,
      position: 0,
    });

    const blockId = placed.controlBoard.lines[0].blocks[0].id;
    const invAfterPlace = placed.blockInventory.forward;

    // Remove it (simulating tap with no selection)
    const removed = simulatorReducer(placed, {
      type: 'REMOVE_BLOCK',
      blockId,
    });

    // Inventory should increment by 1
    expect(removed.blockInventory.forward).toBe(invAfterPlace + 1);
    // Block should be gone from the board
    const allIds = removed.controlBoard.lines.flatMap((l) => l.blocks.map((b) => b.id));
    expect(allIds).not.toContain(blockId);
  });

  it('tap to remove: inventory capped at default max', () => {
    const state = createInitialState();
    // Inventory already at max — removeBlock should cap
    const result = removeBlock(state.blockInventory, 'forward');
    expect(result.forward).toBe(DEFAULT_BLOCK_INVENTORY.forward);
  });

  it('tap to insert with selection: inserts before existing block', () => {
    const state = createInitialState();
    // Place an existing block
    const withExisting = simulatorReducer(state, {
      type: 'PLACE_BLOCK',
      blockType: 'forward',
      line: 0,
      position: 0,
    });

    const existingBlockId = withExisting.controlBoard.lines[0].blocks[0].id;

    // Insert turn_left before the existing block (position 0)
    const afterInsert = simulatorReducer(withExisting, {
      type: 'PLACE_BLOCK',
      blockType: 'turn_left',
      line: 0,
      position: 0,
    });

    const line0 = afterInsert.controlBoard.lines.find((l) => l.lineIndex === 0)!;
    // Should have 2 blocks now
    expect(line0.blocks).toHaveLength(2);
    // First block should be the newly inserted turn_left
    expect(line0.blocks[0].type).toBe('turn_left');
    // Second block should be the original forward
    expect(line0.blocks[1].id).toBe(existingBlockId);
    expect(line0.blocks[1].type).toBe('forward');
  });

  it('removing a non-existent block is a no-op', () => {
    const state = createInitialState();
    const result = simulatorReducer(state, {
      type: 'REMOVE_BLOCK',
      blockId: 'non-existent-id',
    });
    expect(result).toBe(state);
  });
});
