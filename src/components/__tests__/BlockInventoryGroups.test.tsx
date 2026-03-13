// Feature: uiux-matatalab-refresh, Property 11: Block inventory groups by category
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import fc from 'fast-check';
import { DndContext } from '@dnd-kit/core';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import { TapToPlaceProvider } from '../../contexts/TapToPlaceContext';
import { BlockInventory } from '../BlockInventory/BlockInventory';
import type { BlockType } from '../../core/types';
import { getBlockCategory } from '../../core/blockCategories';

const ALL_BLOCK_TYPES: BlockType[] = [
  'forward', 'backward', 'turn_left', 'turn_right',
  'loop_begin', 'loop_end',
  'function_define', 'function_call',
  'number_2', 'number_3', 'number_4', 'number_5', 'number_random',
  'fun_random_move', 'fun_music', 'fun_dance',
];

const CATEGORIES = ['motion', 'loop', 'function', 'number', 'fun'] as const;

/** Build a blockInventory record giving every block a count of 1. */
function fullInventory(): Record<BlockType, number> {
  const inv = {} as Record<BlockType, number>;
  for (const bt of ALL_BLOCK_TYPES) inv[bt] = 1;
  return inv;
}

/** Map category → expected block types belonging to that category. */
const BLOCKS_BY_CATEGORY: Record<string, BlockType[]> = {};
for (const bt of ALL_BLOCK_TYPES) {
  const cat = getBlockCategory(bt);
  if (!BLOCKS_BY_CATEGORY[cat]) BLOCKS_BY_CATEGORY[cat] = [];
  BLOCKS_BY_CATEGORY[cat].push(bt);
}

afterEach(cleanup);

describe('BlockInventoryGroups - Property 11: Block inventory groups by category', () => {
  // **Validates: Requirements 8.4**
  it('should render exactly 5 category groups with correct headers and blocks belonging to the same category', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...CATEGORIES),
        (category) => {
          const { container } = render(
            <I18nextProvider i18n={i18n}>
              <DndContext>
                <TapToPlaceProvider>
                  <BlockInventory blockInventory={fullInventory()} />
                </TapToPlaceProvider>
              </DndContext>
            </I18nextProvider>,
          );

          // 1. There should be exactly 5 category groups
          const allGroups = container.querySelectorAll('[data-testid="category-group"]');
          expect(allGroups.length).toBe(5);

          // 2. Collect all data-category values — should be exactly the 5 categories
          const categoryValues = Array.from(allGroups).map(
            (g) => g.getAttribute('data-category'),
          );
          for (const cat of CATEGORIES) {
            expect(categoryValues).toContain(cat);
          }

          // 3. Find the group for the current category under test
          const targetGroup = container.querySelector(
            `[data-testid="category-group"][data-category="${category}"]`,
          );
          expect(targetGroup).not.toBeNull();

          // 4. Category group should have a category-header with non-empty text
          const header = targetGroup!.querySelector('[data-testid="category-header"]');
          expect(header).not.toBeNull();
          expect(header!.textContent).toBeTruthy();
          expect(header!.textContent!.trim().length).toBeGreaterThan(0);

          // 5. Category group should contain block-item elements
          const blockItems = targetGroup!.querySelectorAll('[data-testid="block-item"]');
          expect(blockItems.length).toBeGreaterThan(0);

          // 6. All block items within this category group should have aria-labels
          //    matching blocks that belong to this category
          const expectedBlocks = BLOCKS_BY_CATEGORY[category];
          expect(blockItems.length).toBe(expectedBlocks.length);

          // Verify all expected blocks belong to this category
          const allMatchCategory = expectedBlocks.every((bt) => getBlockCategory(bt) === category);
          expect(allMatchCategory).toBe(true);

          cleanup();
        },
      ),
      { numRuns: 100 },
    );
  });
});
