// Feature: uiux-matatalab-refresh, Property 1: Every block type has an icon
import { describe, it, expect } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import fc from 'fast-check';
import { BlockIcon } from '../BlockIcon/BlockIcon';
import { getBlockCategory } from '../../core/blockCategories';
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

describe('BlockIcon - Property 1: Every block type has an icon', () => {
  // **Validates: Requirements 1.1**
  it('should render a non-empty SVG with data-testid="block-icon" for every block type', () => {
    fc.assert(
      fc.property(fc.constantFrom(...ALL_BLOCK_TYPES), (blockType: BlockType) => {
        cleanup();
        const { getByTestId } = render(<BlockIcon blockType={blockType} />);

        const svg = getByTestId('block-icon');

        // Assert it's an SVG element
        expect(svg.tagName.toLowerCase()).toBe('svg');

        // Assert the SVG is non-empty (has child elements)
        expect(svg.children.length).toBeGreaterThan(0);

        cleanup();
      }),
      { numRuns: 100 },
    );
  });
});

// Feature: uiux-matatalab-refresh, Property 3: Block category color mapping is consistent
describe('BlockIcon - Property 3: Block category color mapping is consistent', () => {
  // **Validates: Requirements 1.8**

  /**
   * Expected category mapping per the design spec:
   * - motion: forward, backward, turn_left, turn_right
   * - loop: loop_begin, loop_end
   * - function: function_define, function_call
   * - number: number_2..5, number_random
   * - fun: fun_random_move, fun_music, fun_dance
   */
  const EXPECTED_CATEGORY: Record<BlockType, string> = {
    forward: 'motion',
    backward: 'motion',
    turn_left: 'motion',
    turn_right: 'motion',
    loop_begin: 'loop',
    loop_end: 'loop',
    function_define: 'function',
    function_call: 'function',
    number_2: 'number',
    number_3: 'number',
    number_4: 'number',
    number_5: 'number',
    number_random: 'number',
    fun_random_move: 'fun',
    fun_music: 'fun',
    fun_dance: 'fun',
  };

  it('should map every block type to its correct category (motion, loop, function, number, fun)', () => {
    fc.assert(
      fc.property(fc.constantFrom(...ALL_BLOCK_TYPES), (blockType: BlockType) => {
        const actual = getBlockCategory(blockType);
        const expected = EXPECTED_CATEGORY[blockType];

        expect(actual).toBe(expected);
      }),
      { numRuns: 100 },
    );
  });
});
