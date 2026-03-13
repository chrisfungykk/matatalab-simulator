// Feature: uiux-matatalab-refresh, Property 8: Flow indicators between placed blocks
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import fc from 'fast-check';
import { DndContext } from '@dnd-kit/core';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import { TapToPlaceProvider } from '../../contexts/TapToPlaceContext';
import { ControlBoard } from '../ControlBoard/ControlBoard';
import type { BlockType, ControlBoardState, ExecutionState, CodingBlock } from '../../core/types';
import { DEFAULT_BLOCK_INVENTORY } from '../../core/types';

const ALL_BLOCK_TYPES: BlockType[] = [
  'forward', 'backward', 'turn_left', 'turn_right',
  'loop_begin', 'loop_end',
  'function_define', 'function_call',
  'number_2', 'number_3', 'number_4', 'number_5', 'number_random',
  'fun_random_move', 'fun_music', 'fun_dance',
];

/** Arbitrary that picks a random BlockType. */
const arbBlockType = fc.constantFrom(...ALL_BLOCK_TYPES);

/** Build an idle ExecutionState. */
function idleExecution(): ExecutionState {
  return {
    status: 'idle',
    currentLine: 0,
    currentBlockIndex: 0,
    botPosition: { row: 0, col: 0 },
    botDirection: 'north',
    collectedItems: [],
    loopCounters: new Map(),
    callStack: [],
    stepCount: 0,
  };
}

afterEach(cleanup);

describe('ControlBoardSlots - Property 8: Flow indicators between placed blocks', () => {
  // **Validates: Requirements 5.5**
  it('should render exactly N-1 flow indicators for a program line with N placed blocks (N >= 2)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 8 }),
        fc.infiniteStream(arbBlockType),
        (n: number, blockTypeStream) => {
          // Generate N blocks with unique IDs and random types
          const blocks: CodingBlock[] = [];
          const iter = blockTypeStream[Symbol.iterator]();
          for (let i = 0; i < n; i++) {
            const { value: blockType } = iter.next();
            blocks.push({ id: `test-block-${i}`, type: blockType });
          }

          const controlBoard: ControlBoardState = {
            lines: [
              { lineIndex: 0, blocks },
              { lineIndex: 1, blocks: [] },
            ],
          };

          const { container } = render(
            <I18nextProvider i18n={i18n}>
              <DndContext>
                <TapToPlaceProvider>
                  <ControlBoard
                    controlBoard={controlBoard}
                    execution={idleExecution()}
                    blockInventory={{ ...DEFAULT_BLOCK_INVENTORY }}
                    onPlaceBlock={() => {}}
                    onRemoveBlock={() => {}}
                    onReorderBlock={() => {}}
                  />
                </TapToPlaceProvider>
              </DndContext>
            </I18nextProvider>,
          );

          // Find the main program line (first one, lineIndex 0)
          const programLines = container.querySelectorAll('[data-testid="program-line"]');
          const mainLine = programLines[0];
          expect(mainLine).toBeTruthy();

          // Count flow indicators within the main line
          const flowIndicators = mainLine!.querySelectorAll('[data-testid="flow-indicator"]');
          expect(flowIndicators.length).toBe(n - 1);

          cleanup();
        },
      ),
      { numRuns: 100 },
    );
  });
});
