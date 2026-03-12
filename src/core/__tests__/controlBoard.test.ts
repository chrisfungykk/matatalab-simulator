import { describe, it, expect } from 'vitest';
import {
  placeBlockOnBoard,
  removeBlockFromBoard,
  reorderBlock,
  validatePlacement,
} from '../controlBoard';
import { ControlBoardState, CodingBlock } from '../types';

function makeBlock(type: CodingBlock['type'], id?: string): CodingBlock {
  return { id: id ?? `block-${type}-${Math.random().toString(36).slice(2, 8)}`, type };
}

function emptyBoard(): ControlBoardState {
  return { lines: [] };
}

function boardWithMainLine(blocks: CodingBlock[]): ControlBoardState {
  return { lines: [{ lineIndex: 0, blocks }] };
}

// ── validatePlacement ───────────────────────────────────────────────

describe('validatePlacement', () => {
  it('returns null for a valid placement', () => {
    const board = emptyBoard();
    expect(validatePlacement(board, 'forward', 0, 0)).toBeNull();
  });

  it('rejects function_define on line 0', () => {
    const board = emptyBoard();
    const result = validatePlacement(board, 'function_define', 0, 0);
    expect(result).toBeTypeOf('string');
    expect(result).toContain('Function Define');
  });

  it('allows function_define on line 1', () => {
    const board = emptyBoard();
    expect(validatePlacement(board, 'function_define', 1, 0)).toBeNull();
  });

  it('rejects number block after turn_left', () => {
    const turnBlock = makeBlock('turn_left', 'tl-1');
    const board = boardWithMainLine([turnBlock]);
    const result = validatePlacement(board, 'number_2', 0, 1);
    expect(result).toBeTypeOf('string');
    expect(result).toContain('Number');
  });

  it('rejects number block after turn_right', () => {
    const turnBlock = makeBlock('turn_right', 'tr-1');
    const board = boardWithMainLine([turnBlock]);
    const result = validatePlacement(board, 'number_3', 0, 1);
    expect(result).toBeTypeOf('string');
  });

  it('allows number block after forward', () => {
    const fwd = makeBlock('forward', 'fwd-1');
    const board = boardWithMainLine([fwd]);
    expect(validatePlacement(board, 'number_2', 0, 1)).toBeNull();
  });

  it('allows number_random after backward', () => {
    const bwd = makeBlock('backward', 'bwd-1');
    const board = boardWithMainLine([bwd]);
    expect(validatePlacement(board, 'number_random', 0, 1)).toBeNull();
  });
});


// ── placeBlockOnBoard ───────────────────────────────────────────────

describe('placeBlockOnBoard', () => {
  it('places a block on an empty board, creating the line', () => {
    const block = makeBlock('forward', 'f1');
    const result = placeBlockOnBoard(emptyBoard(), block, 0, 0);
    expect('lines' in result).toBe(true);
    if (!('lines' in result)) return;
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].lineIndex).toBe(0);
    expect(result.lines[0].blocks).toEqual([block]);
  });

  it('inserts a block at the correct position in an existing line', () => {
    const b1 = makeBlock('forward', 'f1');
    const b2 = makeBlock('backward', 'b1');
    const board = boardWithMainLine([b1]);
    const result = placeBlockOnBoard(board, b2, 0, 1);
    expect('lines' in result).toBe(true);
    if (!('lines' in result)) return;
    expect(result.lines[0].blocks).toEqual([b1, b2]);
  });

  it('clamps position to end of line if beyond length', () => {
    const b1 = makeBlock('forward', 'f1');
    const b2 = makeBlock('backward', 'b1');
    const board = boardWithMainLine([b1]);
    const result = placeBlockOnBoard(board, b2, 0, 99);
    expect('lines' in result).toBe(true);
    if (!('lines' in result)) return;
    expect(result.lines[0].blocks).toEqual([b1, b2]);
  });

  it('returns error when placing function_define on line 0', () => {
    const block = makeBlock('function_define', 'fd1');
    const result = placeBlockOnBoard(emptyBoard(), block, 0, 0);
    expect('error' in result).toBe(true);
  });

  it('returns error when placing number block after turn block', () => {
    const turn = makeBlock('turn_left', 'tl1');
    const board = boardWithMainLine([turn]);
    const numBlock = makeBlock('number_5', 'n5');
    const result = placeBlockOnBoard(board, numBlock, 0, 1);
    expect('error' in result).toBe(true);
  });

  it('creates a new line when placing on a non-existent line', () => {
    const b1 = makeBlock('forward', 'f1');
    const board = boardWithMainLine([b1]);
    const fd = makeBlock('function_define', 'fd1');
    const result = placeBlockOnBoard(board, fd, 1, 0);
    expect('lines' in result).toBe(true);
    if (!('lines' in result)) return;
    expect(result.lines).toHaveLength(2);
    expect(result.lines[1].lineIndex).toBe(1);
    expect(result.lines[1].blocks).toEqual([fd]);
  });

  it('keeps lines sorted by lineIndex', () => {
    const b1 = makeBlock('forward', 'f1');
    const fd = makeBlock('function_define', 'fd1');
    // Place on line 2 first, then line 0
    let board = emptyBoard();
    const r1 = placeBlockOnBoard(board, fd, 2, 0);
    expect('lines' in r1).toBe(true);
    if (!('lines' in r1)) return;
    const r2 = placeBlockOnBoard(r1, b1, 0, 0);
    expect('lines' in r2).toBe(true);
    if (!('lines' in r2)) return;
    expect(r2.lines[0].lineIndex).toBe(0);
    expect(r2.lines[1].lineIndex).toBe(2);
  });
});

// ── removeBlockFromBoard ────────────────────────────────────────────

describe('removeBlockFromBoard', () => {
  it('removes a block by ID', () => {
    const b1 = makeBlock('forward', 'f1');
    const b2 = makeBlock('backward', 'b1');
    const board = boardWithMainLine([b1, b2]);
    const result = removeBlockFromBoard(board, 'f1');
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].blocks).toEqual([b2]);
  });

  it('removes the line when it becomes empty', () => {
    const b1 = makeBlock('forward', 'f1');
    const board = boardWithMainLine([b1]);
    const result = removeBlockFromBoard(board, 'f1');
    expect(result.lines).toHaveLength(0);
  });

  it('returns board unchanged if block ID not found', () => {
    const b1 = makeBlock('forward', 'f1');
    const board = boardWithMainLine([b1]);
    const result = removeBlockFromBoard(board, 'nonexistent');
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].blocks).toEqual([b1]);
  });
});

// ── reorderBlock ────────────────────────────────────────────────────

describe('reorderBlock', () => {
  it('moves a block to a new position within the same line', () => {
    const b1 = makeBlock('forward', 'f1');
    const b2 = makeBlock('backward', 'b1');
    const b3 = makeBlock('turn_left', 'tl1');
    const board = boardWithMainLine([b1, b2, b3]);
    const result = reorderBlock(board, 'f1', 0, 2);
    expect(result.lines[0].blocks.map((b) => b.id)).toEqual(['b1', 'tl1', 'f1']);
  });

  it('moves a block to a different line', () => {
    const b1 = makeBlock('forward', 'f1');
    const b2 = makeBlock('backward', 'b1');
    const board: ControlBoardState = {
      lines: [
        { lineIndex: 0, blocks: [b1, b2] },
        { lineIndex: 1, blocks: [makeBlock('function_define', 'fd1')] },
      ],
    };
    const result = reorderBlock(board, 'b1', 1, 1);
    expect(result.lines[0].blocks.map((b) => b.id)).toEqual(['f1']);
    expect(result.lines[1].blocks.map((b) => b.id)).toEqual(['fd1', 'b1']);
  });

  it('returns board unchanged if block not found', () => {
    const board = boardWithMainLine([makeBlock('forward', 'f1')]);
    const result = reorderBlock(board, 'nonexistent', 0, 0);
    expect(result).toEqual(board);
  });

  it('returns board unchanged if reorder would violate placement rules', () => {
    const fd = makeBlock('function_define', 'fd1');
    const board: ControlBoardState = {
      lines: [{ lineIndex: 1, blocks: [fd] }],
    };
    // Try to move function_define to line 0 — should be rejected
    const result = reorderBlock(board, 'fd1', 0, 0);
    expect(result).toEqual(board);
  });
});
