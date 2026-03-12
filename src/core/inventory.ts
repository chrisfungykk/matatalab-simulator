import { BlockType, DEFAULT_BLOCK_INVENTORY } from './types';

/**
 * Attempt to place a block from the inventory onto the control board.
 * Decrements the count for the given block type by 1.
 *
 * Returns the updated inventory, or an error string if the count is already 0.
 */
export function placeBlock(
  inventory: Record<BlockType, number>,
  blockType: BlockType,
): { inventory: Record<BlockType, number> } | { error: string } {
  if (inventory[blockType] <= 0) {
    return { error: `No ${blockType} blocks remaining` };
  }

  return {
    inventory: {
      ...inventory,
      [blockType]: inventory[blockType] - 1,
    },
  };
}

/**
 * Return a block from the control board back to the inventory.
 * Increments the count for the given block type by 1, capped at the initial limit.
 */
export function removeBlock(
  inventory: Record<BlockType, number>,
  blockType: BlockType,
): Record<BlockType, number> {
  const maxCount = DEFAULT_BLOCK_INVENTORY[blockType];
  const currentCount = inventory[blockType];

  return {
    ...inventory,
    [blockType]: Math.min(currentCount + 1, maxCount),
  };
}
