import { describe, it, expect } from 'vitest';
import { createExecutor } from '../executor';
import { simulatorReducer, createInitialState } from '../simulatorReducer';
import { builtInChallenges } from '../../challenges';
import type { ControlBoardState, CodingBlock, GridState } from '../types';

// ── Helpers ─────────────────────────────────────────────────────────

let blockCounter = 0;
function makeBlock(type: CodingBlock['type']): CodingBlock {
  return { id: `block-${blockCounter++}`, type };
}

function runToCompletion(executor: ReturnType<typeof createExecutor>, maxSteps = 500) {
  let state = executor.getState();
  let steps = 0;
  while (state.status !== 'completed' && state.status !== 'error' && steps < maxSteps) {
    state = executor.step();
    steps++;
  }
  return state;
}

// ── Integration Tests: Built-in Challenges ──────────────────────────

describe('Integration: Built-in challenges are playable end-to-end', () => {
  /**
   * Validates: Requirements 9.4, 9.5
   *
   * Easy (easy-1): 4x4 grid, start (0,0) east, goal (0,3), no obstacles.
   * Solution: forward, forward, forward
   */
  it('easy-1: straight forward to goal', () => {
    const challenge = builtInChallenges.find((c) => c.id === 'easy-1')!;
    expect(challenge).toBeDefined();

    // Load challenge via reducer
    let state = simulatorReducer(createInitialState(), {
      type: 'LOAD_CHALLENGE',
      config: challenge,
    });

    expect(state.grid.width).toBe(4);
    expect(state.grid.height).toBe(4);
    expect(state.botPosition).toEqual({ row: 0, col: 0 });
    expect(state.botDirection).toBe('east');

    // Build solution: 3 forward blocks
    const board: ControlBoardState = {
      lines: [
        {
          lineIndex: 0,
          blocks: [makeBlock('forward'), makeBlock('forward'), makeBlock('forward')],
        },
      ],
    };

    const grid: GridState = state.grid;
    const executor = createExecutor(
      board,
      grid,
      state.botStartPosition,
      state.botStartDirection,
      'normal',
    );

    const result = runToCompletion(executor);

    expect(result.status).toBe('completed');
    expect(result.botPosition).toEqual({ row: 0, col: 3 });
    expect(result.goalReached).toBe(true);
  });

  /**
   * Validates: Requirements 9.4, 9.5
   *
   * Medium (medium-1): 6x6 grid, start (0,0) east, goal (5,5).
   * Obstacles at (1,1), (2,3), (3,2), (4,4).
   * Solution: forward+number_5 → (0,5), turn_right, forward+number_5 → (5,5)
   * Path avoids all obstacles (travels along row 0 then col 5).
   */
  it('medium-1: navigate around obstacles to goal', () => {
    const challenge = builtInChallenges.find((c) => c.id === 'medium-1')!;
    expect(challenge).toBeDefined();

    let state = simulatorReducer(createInitialState(), {
      type: 'LOAD_CHALLENGE',
      config: challenge,
    });

    expect(state.grid.width).toBe(6);
    expect(state.grid.height).toBe(6);
    expect(state.botPosition).toEqual({ row: 0, col: 0 });
    expect(state.botDirection).toBe('east');
    expect(state.grid.obstacles).toHaveLength(4);

    // Solution: forward+number_5 (east 5 cells), turn_right, forward+number_5 (south 5 cells)
    const board: ControlBoardState = {
      lines: [
        {
          lineIndex: 0,
          blocks: [
            makeBlock('forward'),
            makeBlock('number_5'),
            makeBlock('turn_right'),
            makeBlock('forward'),
            makeBlock('number_5'),
          ],
        },
      ],
    };

    const grid: GridState = state.grid;
    const executor = createExecutor(
      board,
      grid,
      state.botStartPosition,
      state.botStartDirection,
      'normal',
    );

    const result = runToCompletion(executor);

    expect(result.status).toBe('completed');
    expect(result.botPosition).toEqual({ row: 5, col: 5 });
    expect(result.goalReached).toBe(true);
  });

  /**
   * Validates: Requirements 9.4, 9.5
   *
   * Hard (hard-1): 8x8 grid, start (0,0) east, goal (7,7).
   * Obstacles at (1,2),(2,5),(3,3),(4,1),(5,6),(6,4).
   * Collectibles at (0,4),(3,7),(6,2).
   * Must collect ALL 3 collectibles AND reach (7,7).
   *
   * Solution path (constructed directly, bypassing inventory limits):
   *   1. forward×4 east → (0,4) [collect]
   *   2. forward×3 east → (0,7)
   *   3. turn_right (now south)
   *   4. forward×3 south → (3,7) [collect]
   *   5. turn_right (now west)
   *   6. forward×2 west → (3,5)
   *   7. turn_left (now south)
   *   8. forward×4 south → (7,5)
   *   9. turn_right (now west)
   *   10. forward×3 west → (7,2)
   *   11. turn_right (now north)
   *   12. forward×1 north → (6,2) [collect]
   *   13. turn_left (now west)
   *   14. turn_left (now south)
   *   15. forward×1 south → (7,2)
   *   16. turn_left (now east)
   *   17. forward×5 east → (7,7) [goal]
   */
  it('hard-1: collect all treasures and reach goal', () => {
    const challenge = builtInChallenges.find((c) => c.id === 'hard-1')!;
    expect(challenge).toBeDefined();

    let state = simulatorReducer(createInitialState(), {
      type: 'LOAD_CHALLENGE',
      config: challenge,
    });

    expect(state.grid.width).toBe(8);
    expect(state.grid.height).toBe(8);
    expect(state.botPosition).toEqual({ row: 0, col: 0 });
    expect(state.botDirection).toBe('east');
    expect(state.grid.obstacles).toHaveLength(6);
    expect(state.grid.collectibles).toHaveLength(3);

    // Construct solution board directly (bypassing inventory limits for test)
    const board: ControlBoardState = {
      lines: [
        {
          lineIndex: 0,
          blocks: [
            // 1. forward+number_4 → east 4 cells to (0,4) [collect]
            makeBlock('forward'),
            makeBlock('number_4'),
            // 2. forward+number_3 → east 3 cells to (0,7)
            makeBlock('forward'),
            makeBlock('number_3'),
            // 3. turn_right (now south)
            makeBlock('turn_right'),
            // 4. forward+number_3 → south 3 cells to (3,7) [collect]
            makeBlock('forward'),
            makeBlock('number_3'),
            // 5. turn_right (now west)
            makeBlock('turn_right'),
            // 6. forward+number_2 → west 2 cells to (3,5)
            makeBlock('forward'),
            makeBlock('number_2'),
            // 7. turn_left (now south)
            makeBlock('turn_left'),
            // 8. forward+number_4 → south 4 cells to (7,5)
            makeBlock('forward'),
            makeBlock('number_4'),
            // 9. turn_right (now west)
            makeBlock('turn_right'),
            // 10. forward+number_3 → west 3 cells to (7,2)
            makeBlock('forward'),
            makeBlock('number_3'),
            // 11. turn_right (now north)
            makeBlock('turn_right'),
            // 12. forward → north 1 cell to (6,2) [collect]
            makeBlock('forward'),
            // 13-14. turn_left, turn_left (now south)
            makeBlock('turn_left'),
            makeBlock('turn_left'),
            // 15. forward → south 1 cell to (7,2)
            makeBlock('forward'),
            // 16. turn_left (now east)
            makeBlock('turn_left'),
            // 17. forward+number_5 → east 5 cells to (7,7) [goal]
            makeBlock('forward'),
            makeBlock('number_5'),
          ],
        },
      ],
    };

    const grid: GridState = state.grid;
    const executor = createExecutor(
      board,
      grid,
      state.botStartPosition,
      state.botStartDirection,
      'normal',
    );

    const result = runToCompletion(executor);

    expect(result.status).toBe('completed');
    expect(result.botPosition).toEqual({ row: 7, col: 7 });
    // All 3 collectibles should be collected
    expect(result.collectedItems).toHaveLength(3);
    expect(result.collectedItems).toContain('0,4');
    expect(result.collectedItems).toContain('3,7');
    expect(result.collectedItems).toContain('6,2');
    expect(result.goalReached).toBe(true);
  });
});
