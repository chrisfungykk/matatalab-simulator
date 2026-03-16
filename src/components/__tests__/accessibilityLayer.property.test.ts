import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import React from 'react';
import { render } from '@testing-library/react';
import { AccessibilityLayer } from '../CanvasGridMap/AccessibilityLayer';
import { generateAriaLabel } from '../CanvasGridMap/CanvasGridMap';
import type { Position, Direction } from '../../core/types';

// ── Helpers ─────────────────────────────────────────────────────────

const directions: Direction[] = ['north', 'east', 'south', 'west'];

/** Arbitrary for grid scenario with all positions properly constrained */
function gridScenarioArb() {
  return fc
    .integer({ min: 4, max: 10 })
    .chain((width) =>
      fc.integer({ min: 4, max: 10 }).chain((height) => {
        const maxRow = height - 1;
        const maxCol = width - 1;

        const posArb = fc.record({
          row: fc.integer({ min: 0, max: maxRow }),
          col: fc.integer({ min: 0, max: maxCol }),
        });

        const uniquePosListArb = fc
          .uniqueArray(
            fc.tuple(fc.integer({ min: 0, max: maxRow }), fc.integer({ min: 0, max: maxCol })),
            { maxLength: 15, selector: ([r, c]) => `${r},${c}` },
          )
          .map((arr) => arr.map(([row, col]) => ({ row, col })));

        return fc.record({
          width: fc.constant(width),
          height: fc.constant(height),
          botPosition: posArb,
          botDirection: fc.constantFrom(...directions),
          startPosition: posArb,
          positions: uniquePosListArb,
          collectedRatio: fc.double({ min: 0, max: 1, noNaN: true }),
        });
      }),
    )
    .map((data) => {
      const { positions, botPosition, startPosition, collectedRatio, ...rest } = data;

      // Filter out positions that overlap with bot or start
      const available = positions.filter(
        (p) =>
          !(p.row === botPosition.row && p.col === botPosition.col) &&
          !(p.row === startPosition.row && p.col === startPosition.col),
      );

      const third = Math.ceil(available.length / 3);
      const obstacles = available.slice(0, third);
      const goals = available.slice(third, third * 2);
      const collectibles = available.slice(third * 2);

      const collectedCount = Math.floor(collectedRatio * collectibles.length);
      const collectedItems = collectibles.slice(0, collectedCount);

      return {
        ...rest,
        botPosition,
        startPosition,
        obstacles,
        goals,
        collectibles,
        collectedItems,
      };
    });
}

/**
 * Property 2: Accessibility DOM structure mirrors grid state
 *
 * For any grid state (including bot position, obstacles, goals, collectibles,
 * and collected items), the hidden accessibility DOM shall contain exactly
 * width × height gridcell elements with ARIA roles and labels matching the
 * current cell contents, and the ARIA live region shall reflect the bot's
 * current position.
 *
 * **Validates: Requirements 3.1, 3.2, 3.4**
 */
describe('Feature: canvas-grid-competition-mode, Property 2: Accessibility DOM structure mirrors grid state', () => {
  it('renders exactly width × height gridcells with correct labels and live region', () => {
    fc.assert(
      fc.property(gridScenarioArb(), (scenario) => {
        const {
          width, height, botPosition, botDirection, startPosition,
          obstacles, goals, collectibles, collectedItems,
        } = scenario;

        const { container } = render(
          React.createElement(AccessibilityLayer, {
            gridSize: { width, height },
            cells: { obstacles, goals, collectibles },
            botPosition,
            botDirection,
            startPosition,
            collectedItems,
          }),
        );

        // Verify gridcell count = width × height
        const gridcells = container.querySelectorAll('[role="gridcell"]');
        expect(gridcells.length).toBe(width * height);

        // Verify obstacle cells have correct label
        for (const obs of obstacles) {
          if (obs.row === botPosition.row && obs.col === botPosition.col) continue;
          const idx = obs.row * width + obs.col;
          expect(gridcells[idx].getAttribute('aria-label')).toBe('Obstacle');
        }

        // Verify goal cells have correct label
        for (const goal of goals) {
          if (goal.row === botPosition.row && goal.col === botPosition.col) continue;
          const idx = goal.row * width + goal.col;
          expect(gridcells[idx].getAttribute('aria-label')).toBe('Goal');
        }

        // Verify uncollected collectible cells have correct label
        for (const coll of collectibles) {
          if (coll.row === botPosition.row && coll.col === botPosition.col) continue;
          const isCollected = collectedItems.some(
            (c: Position) => c.row === coll.row && c.col === coll.col,
          );
          if (isCollected) continue;
          const idx = coll.row * width + coll.col;
          expect(gridcells[idx].getAttribute('aria-label')).toBe('Collectible');
        }

        // Verify bot cell label contains "Bot" and direction
        const botIdx = botPosition.row * width + botPosition.col;
        const botLabel = gridcells[botIdx].getAttribute('aria-label');
        expect(botLabel).toContain('Bot');
        expect(botLabel).toContain(botDirection);

        // Verify ARIA live region reflects bot position
        const liveRegion = container.querySelector('[aria-live="polite"]');
        expect(liveRegion).not.toBeNull();
        const liveText = liveRegion!.textContent ?? '';
        expect(liveText).toContain(`row ${botPosition.row}`);
        expect(liveText).toContain(`column ${botPosition.col}`);
        expect(liveText).toContain(botDirection);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * Property 3: Canvas aria-label reflects grid dimensions and bot position
 *
 * For any grid dimensions (width, height) and bot position (row, col),
 * the aria-label attribute on the canvas element shall contain the grid
 * dimensions and the bot's current row and column.
 *
 * **Validates: Requirements 3.3**
 */
describe('Feature: canvas-grid-competition-mode, Property 3: Canvas aria-label reflects grid dimensions and bot position', () => {
  it('generateAriaLabel contains grid dimensions and bot row/col', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 4, max: 10 }),  // width
        fc.integer({ min: 4, max: 10 }),  // height
        fc.integer({ min: 0, max: 9 }),   // botRow (constrained below)
        fc.integer({ min: 0, max: 9 }),   // botCol (constrained below)
        (width, height, rawRow, rawCol) => {
          const botRow = Math.min(rawRow, height - 1);
          const botCol = Math.min(rawCol, width - 1);

          const label = generateAriaLabel(width, height, botRow, botCol);

          // Must contain grid dimensions
          expect(label).toContain(String(width));
          expect(label).toContain(String(height));

          // Must contain bot position
          expect(label).toContain(String(botRow));
          expect(label).toContain(String(botCol));
        },
      ),
      { numRuns: 100 },
    );
  });
});
