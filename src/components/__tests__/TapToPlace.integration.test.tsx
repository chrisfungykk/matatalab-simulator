// Integration tests for tap-to-place component interactions
import React from 'react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { DndContext } from '@dnd-kit/core';
import i18n from '../../i18n';
import { TapToPlaceProvider } from '../../contexts/TapToPlaceContext';
import { BlockInventory } from '../BlockInventory/BlockInventory';
import { ControlBoard } from '../ControlBoard/ControlBoard';
import SelectionStatusLabel from '../SelectionStatusLabel/SelectionStatusLabel';
import { DEFAULT_BLOCK_INVENTORY, BlockType, ControlBoardState, ExecutionState } from '../../core/types';

// Switch to English for predictable test assertions
beforeAll(async () => {
  await i18n.changeLanguage('en');
});

// ── Test helpers ────────────────────────────────────────────────────

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <DndContext>
        <TapToPlaceProvider>{children}</TapToPlaceProvider>
      </DndContext>
    </I18nextProvider>
  );
}

const idleExecution: ExecutionState = {
  status: 'idle',
  currentLine: 0,
  currentBlockIndex: 0,
  botPosition: { row: 0, col: 0 },
  botDirection: 'east',
  collectedItems: [],
  loopCounters: new Map(),
  callStack: [],
  stepCount: 0,
};

const emptyBoard: ControlBoardState = { lines: [] };
const noopReorder = vi.fn();

function renderInventory(inventory?: Partial<Record<BlockType, number>>) {
  const inv = { ...DEFAULT_BLOCK_INVENTORY, ...inventory };
  return render(
    <Wrapper>
      <BlockInventory blockInventory={inv} />
    </Wrapper>,
  );
}

function renderWithControlBoard(
  inventory?: Partial<Record<BlockType, number>>,
  board?: ControlBoardState,
) {
  const inv = { ...DEFAULT_BLOCK_INVENTORY, ...inventory };
  const onPlace = vi.fn();
  const onRemove = vi.fn();
  return {
    onPlace,
    onRemove,
    ...render(
      <Wrapper>
        <SelectionStatusLabel />
        <BlockInventory blockInventory={inv} />
        <ControlBoard
          controlBoard={board ?? emptyBoard}
          execution={idleExecution}
          blockInventory={inv}
          onPlaceBlock={onPlace}
          onRemoveBlock={onRemove}
          onReorderBlock={noopReorder}
        />
      </Wrapper>,
    ),
  };
}


// ── 11.4: Keyboard activation tests ─────────────────────────────────

describe('Keyboard activation', () => {
  it('Enter key selects an inventory block', () => {
    renderInventory();
    const forwardBlock = screen.getByRole('button', { name: /Forward \(4\)/i });
    expect(forwardBlock).toHaveAttribute('aria-pressed', 'false');

    fireEvent.keyDown(forwardBlock, { key: 'Enter' });
    expect(forwardBlock).toHaveAttribute('aria-pressed', 'true');
  });

  it('Space key selects an inventory block', () => {
    renderInventory();
    const backwardBlock = screen.getByRole('button', { name: /Backward \(4\)/i });
    expect(backwardBlock).toHaveAttribute('aria-pressed', 'false');

    fireEvent.keyDown(backwardBlock, { key: ' ' });
    expect(backwardBlock).toHaveAttribute('aria-pressed', 'true');
  });

  it('Enter key toggles selection off', () => {
    renderInventory();
    const block = screen.getByRole('button', { name: /Forward \(4\)/i });

    fireEvent.keyDown(block, { key: 'Enter' });
    expect(block).toHaveAttribute('aria-pressed', 'true');

    fireEvent.keyDown(block, { key: 'Enter' });
    expect(block).toHaveAttribute('aria-pressed', 'false');
  });

  it('keyboard does not select a disabled block', () => {
    renderInventory({ forward: 0 });
    const block = screen.getByRole('button', { name: /Forward \(0\)/i });
    expect(block).toHaveAttribute('aria-disabled', 'true');

    fireEvent.keyDown(block, { key: 'Enter' });
    expect(block).toHaveAttribute('aria-pressed', 'false');
  });

  it('Enter key on drop zone triggers placement when block is selected', () => {
    const { onPlace } = renderWithControlBoard();

    // Select a block first
    const forwardBlock = screen.getByRole('button', { name: /Forward \(4\)/i });
    fireEvent.click(forwardBlock);

    // Find a drop zone and press Enter
    const dropZone = screen.getByTestId('dropzone-0-0');
    fireEvent.keyDown(dropZone, { key: 'Enter' });

    expect(onPlace).toHaveBeenCalledWith('forward', 0, 0);
  });

  it('Space key on drop zone triggers placement when block is selected', () => {
    const { onPlace } = renderWithControlBoard();

    const forwardBlock = screen.getByRole('button', { name: /Forward \(4\)/i });
    fireEvent.click(forwardBlock);

    const dropZone = screen.getByTestId('dropzone-0-0');
    fireEvent.keyDown(dropZone, { key: ' ' });

    expect(onPlace).toHaveBeenCalledWith('forward', 0, 0);
  });
});

// ── 11.5: ARIA live region text updates ─────────────────────────────

describe('ARIA live region updates', () => {
  it('shows selection status after selecting a block', () => {
    renderWithControlBoard();

    const forwardBlock = screen.getByRole('button', { name: /Forward \(4\)/i });
    fireEvent.click(forwardBlock);

    // SelectionStatusLabel should show the selected block
    const statusLabel = screen.getByTestId('selection-status-label');
    expect(statusLabel.textContent).toBeTruthy();
    // The label shows the translated block name
    expect(statusLabel.textContent).toMatch(/Forward/i);
  });

  it('clears selection status after deselecting', () => {
    renderWithControlBoard();

    const forwardBlock = screen.getByRole('button', { name: /Forward \(4\)/i });
    fireEvent.click(forwardBlock);

    const statusLabel = screen.getByTestId('selection-status-label');
    expect(statusLabel.textContent).toBeTruthy();

    // Deselect
    fireEvent.click(forwardBlock);
    expect(statusLabel.textContent).toBe('');
  });

  it('selection status label has aria-live="polite"', () => {
    renderWithControlBoard();
    const statusLabel = screen.getByTestId('selection-status-label');
    expect(statusLabel).toHaveAttribute('aria-live', 'polite');
  });

  it('TapToPlaceProvider ARIA live region exists with aria-live="polite"', () => {
    const { container } = renderWithControlBoard();
    const liveRegions = container.querySelectorAll('[aria-live="polite"]');
    // Should have at least 2: SelectionStatusLabel + TapToPlaceProvider's announcement div
    expect(liveRegions.length).toBeGreaterThanOrEqual(2);
  });

  it('ARIA announcement updates after placement', () => {
    const { container } = renderWithControlBoard();

    // Select a block
    const forwardBlock = screen.getByRole('button', { name: /Forward \(4\)/i });
    fireEvent.click(forwardBlock);

    // Click a drop zone to place
    const dropZone = screen.getByTestId('dropzone-0-0');
    fireEvent.click(dropZone);

    // The TapToPlaceProvider's ARIA live region should have announcement text
    const liveRegions = container.querySelectorAll('[aria-live="polite"]');
    const announcements = Array.from(liveRegions).map((el) => el.textContent).filter(Boolean);
    // At least one live region should have content about placement
    expect(announcements.some((text) => text!.toLowerCase().includes('placed'))).toBe(true);
  });
});

// ── 11.6: CSS class application tests ───────────────────────────────

describe('CSS class application', () => {
  it('applies selected class to the selected inventory block', () => {
    renderInventory();

    const forwardBlock = screen.getByRole('button', { name: /Forward \(4\)/i });
    fireEvent.click(forwardBlock);

    // CSS modules mangle class names, but the class should contain "selected"
    expect(forwardBlock.className).toMatch(/selected/);
  });

  it('removes selected class when deselected', () => {
    renderInventory();

    const forwardBlock = screen.getByRole('button', { name: /Forward \(4\)/i });
    fireEvent.click(forwardBlock);
    expect(forwardBlock.className).toMatch(/selected/);

    fireEvent.click(forwardBlock);
    expect(forwardBlock.className).not.toMatch(/selected/);
  });

  it('only one block has selected class at a time', () => {
    renderInventory();

    const forwardBlock = screen.getByRole('button', { name: /Forward \(4\)/i });
    const backwardBlock = screen.getByRole('button', { name: /Backward \(4\)/i });

    fireEvent.click(forwardBlock);
    expect(forwardBlock.className).toMatch(/selected/);
    expect(backwardBlock.className).not.toMatch(/selected/);

    fireEvent.click(backwardBlock);
    expect(forwardBlock.className).not.toMatch(/selected/);
    expect(backwardBlock.className).toMatch(/selected/);
  });

  it('drop zones get dropZoneVisible class when a block is selected', () => {
    renderWithControlBoard();

    const dropZone = screen.getByTestId('dropzone-0-0');
    // Before selection: no visible class
    expect(dropZone.className).not.toMatch(/dropZoneVisible/);

    // Select a block
    const forwardBlock = screen.getByRole('button', { name: /Forward \(4\)/i });
    fireEvent.click(forwardBlock);

    // After selection: visible class should be applied
    expect(dropZone.className).toMatch(/dropZoneVisible/);
  });

  it('drop zones lose dropZoneVisible class when deselected', () => {
    renderWithControlBoard();

    const forwardBlock = screen.getByRole('button', { name: /Forward \(4\)/i });
    fireEvent.click(forwardBlock);

    const dropZone = screen.getByTestId('dropzone-0-0');
    expect(dropZone.className).toMatch(/dropZoneVisible/);

    // Deselect
    fireEvent.click(forwardBlock);
    expect(dropZone.className).not.toMatch(/dropZoneVisible/);
  });
});
