import type { BlockType } from './types';

/**
 * Block category type — maps to CSS class names and visual grouping.
 */
export type BlockCategory = 'motion' | 'loop' | 'function' | 'number' | 'fun';

/**
 * Returns the visual category for a given block type.
 * Used for CSS class assignment and inventory grouping.
 *
 * - motion: forward, backward, turn_left, turn_right
 * - loop: loop_begin, loop_end
 * - function: function_define, function_call
 * - number: number_2..5, number_random
 * - fun: fun_random_move, fun_music, fun_dance
 */
export function getBlockCategory(blockType: BlockType): BlockCategory {
  if (
    blockType === 'forward' ||
    blockType === 'backward' ||
    blockType === 'turn_left' ||
    blockType === 'turn_right'
  ) {
    return 'motion';
  }
  if (blockType === 'loop_begin' || blockType === 'loop_end') {
    return 'loop';
  }
  if (blockType === 'function_define' || blockType === 'function_call') {
    return 'function';
  }
  if (blockType.startsWith('number_')) {
    return 'number';
  }
  return 'fun';
}
