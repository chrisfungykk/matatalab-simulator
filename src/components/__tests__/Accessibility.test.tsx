// Feature: uiux-matatalab-refresh, Property 12: Accessibility attributes preserved
import { describe, it, expect, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import fc from 'fast-check';
import { DndContext } from '@dnd-kit/core';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import { TapToPlaceProvider } from '../../contexts/TapToPlaceContext';
import { BlockInventory } from '../BlockInventory/BlockInventory';
import { ControlBoard } from '../ControlBoard/ControlBoard';
import { Toolbar } from '../Toolbar/Toolbar';
import { GridMap } from '../GridMap/GridMap';
import FeedbackOverlay from '../FeedbackOverlay/FeedbackOverlay';
import { BlockIcon } from '../BlockIcon/BlockIcon';
import { BotSVG } from '../BotSVG/BotSVG';
import type { BlockType, ControlBoardState, ExecutionState, Direction } from '../../core/types';

const ALL_BLOCK_TYPES: BlockType[] = [
  'forward', 'backward', 'turn_left', 'turn_right',
  'loop_begin', 'loop_end',
  'function_define', 'function_call',
  'number_2', 'number_3', 'number_4', 'number_5', 'number_random',
  'fun_random_move', 'fun_music', 'fun_dance',
];

function fullInventory(): Record<BlockType, number> {
  const inv = {} as Record<BlockType, number>;
  for (const bt of ALL_BLOCK_TYPES) inv[bt] = 3;
  return inv;
}

const emptyBoard: ControlBoardState = {
  lines: [
    { lineIndex: 0, blocks: [] },
    { lineIndex: 1, blocks: [] },
  ],
};

const boardWithBlocks: ControlBoardState = {
  lines: [
    {
      lineIndex: 0,
      blocks: [
        { id: 'b1', type: 'forward' },
        { id: 'b2', type: 'turn_left' },
      ],
    },
    { lineIndex: 1, blocks: [] },
  ],
};

const idleExecution: ExecutionState = {
  status: 'idle',
  currentBlockIndex: -1,
  currentLine: 0,
  botPosition: { row: 0, col: 0 },
  botDirection: 'north',
  collectedItems: [],
  loopCounters: new Map(),
  callStack: [],
  stepCount: 0,
};

describe('Accessibility - Property 12: Accessibility attributes preserved', () => {
  // **Validates: Requirements 8.6**

  it('BlockInventory blocks have role="button", aria-label, and tabIndex', () => {
    fc.assert(
      fc.property(fc.constantFrom(...ALL_BLOCK_TYPES), (_blockType: BlockType) => {
        cleanup();
        const inv = fullInventory();
        const { container } = render(
          <I18nextProvider i18n={i18n}>
            <DndContext>
              <TapToPlaceProvider>
                <BlockInventory blockInventory={inv} />
              </TapToPlaceProvider>
            </DndContext>
          </I18nextProvider>,
        );

        const blockItems = container.querySelectorAll('[data-testid="block-item"]');
        expect(blockItems.length).toBeGreaterThan(0);

        // Every block item must have role="button", aria-label, and tabIndex
        blockItems.forEach((el) => {
          expect(el.getAttribute('role')).toBe('button');
          expect(el.getAttribute('aria-label')).toBeTruthy();
          expect(el.getAttribute('aria-label')!.length).toBeGreaterThan(0);
          expect(el.hasAttribute('tabindex')).toBe(true);
        });

        cleanup();
      }),
      { numRuns: 100 },
    );
  });

  it('ControlBoard placed blocks and drop zones have proper ARIA attributes', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<'en' | 'zh'>('en', 'zh'),
        (lang) => {
          cleanup();
          i18n.changeLanguage(lang);

          const { container } = render(
            <I18nextProvider i18n={i18n}>
              <DndContext>
                <TapToPlaceProvider>
                  <ControlBoard
                    controlBoard={boardWithBlocks}
                    execution={idleExecution}
                    blockInventory={fullInventory()}
                    onPlaceBlock={() => {}}
                    onRemoveBlock={() => {}}
                    onReorderBlock={() => {}}
                  />
                </TapToPlaceProvider>
              </DndContext>
            </I18nextProvider>,
          );

          // Placed blocks should have role="button", aria-label, tabIndex
          const placedBlocks = container.querySelectorAll('[data-testid^="board-block-"]');
          expect(placedBlocks.length).toBe(2);
          placedBlocks.forEach((el) => {
            expect(el.getAttribute('role')).toBe('button');
            expect(el.getAttribute('aria-label')).toBeTruthy();
            expect(el.hasAttribute('tabindex')).toBe(true);
          });

          // Drop zones should have aria-label
          const dropZones = container.querySelectorAll('[data-testid^="dropzone-"]');
          expect(dropZones.length).toBeGreaterThan(0);
          dropZones.forEach((el) => {
            expect(el.getAttribute('aria-label')).toBeTruthy();
          });

          cleanup();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('Toolbar buttons have aria-label', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<'en' | 'zh'>('en', 'zh'),
        (lang) => {
          cleanup();
          i18n.changeLanguage(lang);

          const { container } = render(
            <I18nextProvider i18n={i18n}>
              <Toolbar
                onRun={vi.fn()}
                onReset={vi.fn()}
                onLoadProgram={vi.fn()}
                onSetSpeed={vi.fn()}
                onSetLanguage={vi.fn()}
                controlBoard={emptyBoard}
                speed="normal"
                language={lang}
                executionStatus="idle"
              />
            </I18nextProvider>,
          );

          const buttons = container.querySelectorAll('[data-testid="toolbar-button"]');
          expect(buttons.length).toBeGreaterThanOrEqual(6);

          buttons.forEach((btn) => {
            expect(btn.getAttribute('aria-label')).toBeTruthy();
            expect(btn.getAttribute('aria-label')!.length).toBeGreaterThan(0);
          });

          cleanup();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('GridMap has role="grid" and cells have role="gridcell"', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<Direction>('north', 'east', 'south', 'west'),
        (dir) => {
          cleanup();

          const { container } = render(
            <GridMap
              gridSize={{ width: 4, height: 4 }}
              cells={{ obstacles: [{ row: 1, col: 1 }], goals: [{ row: 3, col: 3 }], collectibles: [{ row: 2, col: 2 }] }}
              botPosition={{ row: 0, col: 0 }}
              botDirection={dir}
              startPosition={{ row: 0, col: 0 }}
              speed="normal"
            />,
          );

          // Grid container should have role="grid"
          const grid = container.querySelector('[role="grid"]');
          expect(grid).not.toBeNull();
          expect(grid!.getAttribute('aria-label')).toBeTruthy();

          // All cells should have role="gridcell"
          const cells = container.querySelectorAll('[role="gridcell"]');
          expect(cells.length).toBe(16); // 4x4 grid

          cleanup();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('FeedbackOverlay has role="status" or role="alert" with aria-live', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<'success' | 'failure' | 'error'>('success', 'failure', 'error'),
        (scenario) => {
          cleanup();

          const props = {
            executionStatus: scenario === 'error' ? 'error' as const : 'completed' as const,
            goalReached: scenario === 'success' ? true : scenario === 'failure' ? false : undefined,
            errorInfo: scenario === 'error' ? { type: 'BOUNDARY_VIOLATION' as const, messageKey: 'error.boundary', blockIndex: 0, line: 0 } : undefined,
            challengeDifficulty: 'easy' as const,
            language: 'en' as const,
            onDismiss: vi.fn(),
          };

          const { getByTestId } = render(
            <I18nextProvider i18n={i18n}>
              <FeedbackOverlay {...props} />
            </I18nextProvider>,
          );

          const overlay = getByTestId('feedback-overlay');

          if (scenario === 'error') {
            // Error toast should have role="alert"
            expect(overlay.getAttribute('role')).toBe('alert');
          } else {
            // Success/failure overlays should have role="status" and aria-live
            expect(overlay.getAttribute('role')).toBe('status');
            expect(overlay.getAttribute('aria-live')).toBe('polite');
          }

          cleanup();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('BlockIcon SVGs have aria-hidden="true"', () => {
    fc.assert(
      fc.property(fc.constantFrom(...ALL_BLOCK_TYPES), (blockType: BlockType) => {
        cleanup();

        const { getByTestId } = render(<BlockIcon blockType={blockType} />);
        const svg = getByTestId('block-icon');

        // Decorative SVGs should have aria-hidden="true"
        expect(svg.getAttribute('aria-hidden')).toBe('true');

        cleanup();
      }),
      { numRuns: 100 },
    );
  });

  it('BotSVG has role="img" and aria-label', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<Direction>('north', 'east', 'south', 'west'),
        (dir) => {
          cleanup();

          const { getByTestId } = render(
            <BotSVG direction={dir} isIdle={false} isError={false} />,
          );

          const svg = getByTestId('bot-svg');
          expect(svg.getAttribute('role')).toBe('img');
          expect(svg.getAttribute('aria-label')).toBeTruthy();
          expect(svg.getAttribute('aria-label')!.length).toBeGreaterThan(0);

          cleanup();
        },
      ),
      { numRuns: 100 },
    );
  });
});
