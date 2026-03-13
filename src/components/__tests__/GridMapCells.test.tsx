// Feature: uiux-matatalab-refresh, Property 7: Special grid cells render SVG illustrations
import { describe, it, expect } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import fc from 'fast-check';
import { GridMap } from '../GridMap/GridMap';
import type { Position, Direction, SpeedSetting } from '../../core/types';

type SpecialCellType = 'obstacle' | 'goal' | 'collectible';

const SVG_TEST_IDS: Record<SpecialCellType, string> = {
  obstacle: 'obstacle-svg',
  goal: 'goal-svg',
  collectible: 'collectible-svg',
};

function buildCells(cellType: SpecialCellType, pos: Position) {
  return {
    obstacles: cellType === 'obstacle' ? [pos] : [],
    goals: cellType === 'goal' ? [pos] : [],
    collectibles: cellType === 'collectible' ? [pos] : [],
  };
}

// Place bot at a position guaranteed to differ from the target cell
function safeBotPosition(targetRow: number, targetCol: number): Position {
  const botRow = targetRow === 0 ? 3 : 0;
  const botCol = targetCol === 0 ? 3 : 0;
  return { row: botRow, col: botCol };
}

describe('GridMap - Property 7: Special grid cells render SVG illustrations', () => {
  // **Validates: Requirements 4.2, 4.3, 4.4**
  it('should render an SVG illustration (not plain emoji) for obstacle, goal, and collectible cells', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<SpecialCellType>('obstacle', 'goal', 'collectible'),
        fc.integer({ min: 0, max: 3 }),
        fc.integer({ min: 0, max: 3 }),
        (cellType: SpecialCellType, row: number, col: number) => {
          cleanup();

          const pos: Position = { row, col };
          const botPos = safeBotPosition(row, col);
          const cells = buildCells(cellType, pos);

          const { container, getByTestId } = render(
            <GridMap
              gridSize={{ width: 4, height: 4 }}
              cells={cells}
              botPosition={botPos}
              botDirection={'north' as Direction}
              startPosition={{ row: 0, col: 0 }}
              speed={'normal' as SpeedSetting}
            />,
          );

          // The cell should contain the appropriate SVG element
          const svgElement = getByTestId(SVG_TEST_IDS[cellType]);
          expect(svgElement).toBeTruthy();
          expect(svgElement.tagName.toLowerCase()).toBe('svg');

          // Find the cell div by data-row/data-col
          const cellDiv = container.querySelector(
            `[data-row="${row}"][data-col="${col}"]`,
          );
          expect(cellDiv).toBeTruthy();

          // The cell should NOT contain plain text emoji content
          // Get direct text content (excluding child element text)
          const textContent = Array.from(cellDiv!.childNodes)
            .filter((node) => node.nodeType === Node.TEXT_NODE)
            .map((node) => node.textContent?.trim())
            .filter(Boolean)
            .join('');
          expect(textContent).toBe('');

          cleanup();
        },
      ),
      { numRuns: 100 },
    );
  });
});
