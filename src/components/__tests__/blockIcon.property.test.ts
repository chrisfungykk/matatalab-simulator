// Feature: canvas-grid-competition-mode, Property 4: Block icon minimum size
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { createElement } from 'react';
import fc from 'fast-check';
import { BlockIcon } from '../BlockIcon/BlockIcon';
import type { BlockType } from '../../core/types';

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

afterEach(cleanup);

describe('BlockIcon - Property 4: Block icon minimum size', () => {
  // **Validates: Requirements 4.8**
  it('should render SVG icon with dimensions of at least 32×32 pixels for any block type', () => {
    fc.assert(
      fc.property(fc.constantFrom(...ALL_BLOCK_TYPES), (blockType: BlockType) => {
        cleanup();

        // Render with default size (should be 32)
        const { getByTestId } = render(createElement(BlockIcon, { blockType }));
        const svg = getByTestId('block-icon');

        // Check SVG element exists and is an SVG
        expect(svg.tagName.toLowerCase()).toBe('svg');

        // Check width and height attributes are at least 32
        const width = Number(svg.getAttribute('width'));
        const height = Number(svg.getAttribute('height'));
        expect(width).toBeGreaterThanOrEqual(32);
        expect(height).toBeGreaterThanOrEqual(32);

        cleanup();
      }),
      { numRuns: 100 },
    );
  });

  it('should render SVG icon with at least 32×32 pixels even when explicit size ≥ 32 is provided', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_BLOCK_TYPES),
        fc.integer({ min: 32, max: 128 }),
        (blockType: BlockType, size: number) => {
          cleanup();

          const { getByTestId } = render(createElement(BlockIcon, { blockType, size }));
          const svg = getByTestId('block-icon');

          const width = Number(svg.getAttribute('width'));
          const height = Number(svg.getAttribute('height'));
          expect(width).toBeGreaterThanOrEqual(32);
          expect(height).toBeGreaterThanOrEqual(32);
          expect(width).toBe(size);
          expect(height).toBe(size);

          cleanup();
        },
      ),
      { numRuns: 100 },
    );
  });
});
