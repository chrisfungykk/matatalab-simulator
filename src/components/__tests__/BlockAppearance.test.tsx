// Feature: uiux-matatalab-refresh, Property 2: Block renders icon with localized label
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import fc from 'fast-check';
import { DndContext } from '@dnd-kit/core';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import { TapToPlaceProvider } from '../../contexts/TapToPlaceContext';
import { BlockInventory } from '../BlockInventory/BlockInventory';
import type { BlockType } from '../../core/types';
import en from '../../i18n/en.json';
import zh from '../../i18n/zh.json';

const ALL_BLOCK_TYPES: BlockType[] = [
  'forward', 'backward', 'turn_left', 'turn_right',
  'loop_begin', 'loop_end',
  'function_define', 'function_call',
  'number_2', 'number_3', 'number_4', 'number_5', 'number_random',
  'fun_random_move', 'fun_music', 'fun_dance',
];

/** Maps BlockType to the i18n key path used in the component. */
const BLOCK_I18N_KEY: Record<BlockType, string> = {
  forward: 'block.forward',
  backward: 'block.backward',
  turn_left: 'block.turnLeft',
  turn_right: 'block.turnRight',
  loop_begin: 'block.loopBegin',
  loop_end: 'block.loopEnd',
  function_define: 'block.functionDefine',
  function_call: 'block.functionCall',
  number_2: 'block.number2',
  number_3: 'block.number3',
  number_4: 'block.number4',
  number_5: 'block.number5',
  number_random: 'block.numberRandom',
  fun_random_move: 'block.funRandomMove',
  fun_music: 'block.funMusic',
  fun_dance: 'block.funDance',
};

/** Resolve a dotted key like "block.forward" from a translation object. */
function resolve(obj: Record<string, unknown>, key: string): string {
  const parts = key.split('.');
  let cur: unknown = obj;
  for (const p of parts) {
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur as string;
}

const TRANSLATIONS: Record<string, Record<string, unknown>> = { en, zh };

/** Build a blockInventory record giving every block a count of 1. */
function fullInventory(): Record<BlockType, number> {
  const inv = {} as Record<BlockType, number>;
  for (const bt of ALL_BLOCK_TYPES) inv[bt] = 1;
  return inv;
}

afterEach(cleanup);

describe('BlockAppearance - Property 2: Block renders icon with localized label', () => {
  // **Validates: Requirements 1.7**
  it('should render an icon (data-testid="block-icon") and a localized label (data-testid="block-label") for every block type in each language', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_BLOCK_TYPES),
        fc.constantFrom('en' as const, 'zh' as const),
        (blockType: BlockType, lang: 'en' | 'zh') => {
          // Switch language synchronously
          i18n.changeLanguage(lang);

          const { container } = render(
            <I18nextProvider i18n={i18n}>
              <DndContext>
                <TapToPlaceProvider>
                  <BlockInventory blockInventory={fullInventory()} />
                </TapToPlaceProvider>
              </DndContext>
            </I18nextProvider>,
          );

          // Find the specific block item for this blockType
          const allBlocks = container.querySelectorAll('[data-testid="block-item"]');
          // The block order matches ALL_BLOCK_TYPES grouped by category; locate by aria-label
          const expectedLabel = resolve(TRANSLATIONS[lang], BLOCK_I18N_KEY[blockType]);
          let targetBlock: Element | null = null;
          for (const block of allBlocks) {
            const ariaLabel = block.getAttribute('aria-label');
            if (ariaLabel && ariaLabel.startsWith(expectedLabel)) {
              targetBlock = block;
              break;
            }
          }

          expect(targetBlock).not.toBeNull();

          // Verify icon exists
          const icon = targetBlock!.querySelector('[data-testid="block-icon"]');
          expect(icon).not.toBeNull();
          expect(icon!.tagName.toLowerCase()).toBe('svg');

          // Verify label exists and matches translation
          const label = targetBlock!.querySelector('[data-testid="block-label"]');
          expect(label).not.toBeNull();
          expect(label!.textContent).toBe(expectedLabel);
          expect(label!.textContent!.length).toBeGreaterThan(0);

          cleanup();
        },
      ),
      { numRuns: 100 },
    );
  });
});


// Feature: uiux-matatalab-refresh, Property 4: Block 3D appearance invariants
describe('BlockAppearance - Property 4: Block 3D appearance invariants', () => {
  // **Validates: Requirements 2.1, 2.2, 2.5**
  it('should render each block with a non-empty CSS class, and a count badge with text content', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_BLOCK_TYPES),
        (blockType: BlockType) => {
          const { container } = render(
            <I18nextProvider i18n={i18n}>
              <DndContext>
                <TapToPlaceProvider>
                  <BlockInventory blockInventory={fullInventory()} />
                </TapToPlaceProvider>
              </DndContext>
            </I18nextProvider>,
          );

          // Find the specific block item for this blockType via aria-label
          const expectedLabel = resolve(TRANSLATIONS['en'], BLOCK_I18N_KEY[blockType]);
          const allBlocks = container.querySelectorAll('[data-testid="block-item"]');
          let targetBlock: Element | null = null;
          for (const block of allBlocks) {
            const ariaLabel = block.getAttribute('aria-label');
            if (ariaLabel && ariaLabel.startsWith(expectedLabel)) {
              targetBlock = block;
              break;
            }
          }

          // Block element exists
          expect(targetBlock).not.toBeNull();

          // Block element has a non-empty class attribute (CSS module classes applied for 3D appearance)
          const classAttr = targetBlock!.getAttribute('class');
          expect(classAttr).toBeTruthy();
          expect(classAttr!.trim().length).toBeGreaterThan(0);

          // Count badge exists within the block
          const badge = targetBlock!.querySelector('[data-testid="count-badge"]');
          expect(badge).not.toBeNull();

          // Count badge has text content (the count number)
          expect(badge!.textContent).toBeTruthy();
          expect(badge!.textContent!.trim().length).toBeGreaterThan(0);

          cleanup();
        },
      ),
      { numRuns: 100 },
    );
  });
});


// Feature: uiux-matatalab-refresh, Property 5: Zero-count blocks are visually disabled
describe('BlockAppearance - Property 5: Zero-count blocks are visually disabled', () => {
  // **Validates: Requirements 2.4**
  it('should render blocks with count 0 as aria-disabled with a "disabled" CSS class', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_BLOCK_TYPES),
        (blockType: BlockType) => {
          // Build inventory: target block has count 0, all others have count 1
          const inv = fullInventory();
          inv[blockType] = 0;

          const { container } = render(
            <I18nextProvider i18n={i18n}>
              <DndContext>
                <TapToPlaceProvider>
                  <BlockInventory blockInventory={inv} />
                </TapToPlaceProvider>
              </DndContext>
            </I18nextProvider>,
          );

          // Locate the zero-count block by its aria-label
          const expectedLabel = resolve(TRANSLATIONS['en'], BLOCK_I18N_KEY[blockType]);
          const allBlocks = container.querySelectorAll('[data-testid="block-item"]');
          let targetBlock: Element | null = null;
          for (const block of allBlocks) {
            const ariaLabel = block.getAttribute('aria-label');
            if (ariaLabel && ariaLabel.startsWith(expectedLabel)) {
              targetBlock = block;
              break;
            }
          }

          expect(targetBlock).not.toBeNull();

          // 1. aria-disabled="true"
          expect(targetBlock!.getAttribute('aria-disabled')).toBe('true');

          // 2. CSS class containing "disabled" (CSS module class for opacity: 0.4 + grayscale)
          const classAttr = targetBlock!.getAttribute('class') ?? '';
          expect(classAttr).toMatch(/disabled/);

          cleanup();
        },
      ),
      { numRuns: 100 },
    );
  });
});
