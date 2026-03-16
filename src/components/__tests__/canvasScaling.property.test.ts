import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { calculateCanvasScaling } from '../CanvasGridMap/CanvasGridMap';

/**
 * Property 1: Canvas scaling preserves 1:1 cell aspect ratio
 *
 * For any viewport dimensions and grid size (4×4 to 10×10), the canvas scaling
 * function shall produce cell dimensions where width equals height (1:1 aspect ratio),
 * and the total canvas fits within the viewport without scrolling.
 *
 * **Validates: Requirements 1.7**
 */
describe('Feature: canvas-grid-competition-mode, Property 1: Canvas scaling preserves 1:1 cell aspect ratio', () => {
  it('cell width equals cell height (1:1 aspect ratio) for any viewport and grid size', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 200, max: 2000 }), // viewportWidth
        fc.integer({ min: 200, max: 2000 }), // viewportHeight
        fc.integer({ min: 4, max: 10 }),      // gridWidth
        fc.integer({ min: 4, max: 10 }),      // gridHeight
        (viewportWidth, viewportHeight, gridWidth, gridHeight) => {
          const result = calculateCanvasScaling(viewportWidth, viewportHeight, gridWidth, gridHeight);

          // Cell size is a single number — width equals height by construction (1:1 ratio)
          expect(result.cellSize).toBeGreaterThan(0);

          // Canvas dimensions are exact multiples of cellSize
          expect(result.canvasWidth).toBe(result.cellSize * gridWidth);
          expect(result.canvasHeight).toBe(result.cellSize * gridHeight);

          // Canvas fits within viewport without scrolling
          expect(result.canvasWidth).toBeLessThanOrEqual(viewportWidth);
          expect(result.canvasHeight).toBeLessThanOrEqual(viewportHeight);
        },
      ),
      { numRuns: 100 },
    );
  });
});
