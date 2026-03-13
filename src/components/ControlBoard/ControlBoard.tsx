import React, { useCallback, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from 'react-i18next';
import type { ControlBoardState, ExecutionState, BlockType, CodingBlock, ProgramLine } from '../../core/types';
import { useTapToPlace } from '../../contexts/TapToPlaceContext';
import styles from './ControlBoard.module.css';

// ── Shared helpers ──────────────────────────────────────────────────

/** Maps each BlockType to its i18n key under the "block" namespace. */
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

function getBlockCategory(blockType: BlockType): string {
  if (blockType === 'forward' || blockType === 'backward' || blockType === 'turn_left' || blockType === 'turn_right') {
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

// ── Drop zone between blocks ────────────────────────────────────────

interface DropZoneProps {
  lineIndex: number;
  position: number;
  selectedBlock: BlockType | null;
  onTapPlace?: (blockType: BlockType, line: number, position: number) => void;
}

const DropZone: React.FC<DropZoneProps> = ({ lineIndex, position, selectedBlock, onTapPlace }) => {
  const droppableId = `dropzone-${lineIndex}-${position}`;
  const { isOver, setNodeRef } = useDroppable({
    id: droppableId,
    data: { type: 'drop-zone', lineIndex, position },
  });

  const handleClick = useCallback(() => {
    if (selectedBlock && onTapPlace) {
      onTapPlace(selectedBlock, lineIndex, position);
    }
  }, [selectedBlock, onTapPlace, lineIndex, position]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && selectedBlock) {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick, selectedBlock],
  );

  const isActive = selectedBlock !== null;

  const className = [
    styles.dropZone,
    isOver ? styles.dropZoneActive : '',
    isActive ? styles.dropZoneVisible : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={setNodeRef}
      className={className}
      onClick={handleClick}
      onKeyDown={isActive ? handleKeyDown : undefined}
      tabIndex={isActive ? 0 : undefined}
      role={isActive ? 'button' : undefined}
      aria-label={`Drop zone at line ${lineIndex}, position ${position}`}
      data-testid={droppableId}
    />
  );
};

// ── Sortable block on the board ─────────────────────────────────────

interface SortableBlockProps {
  block: CodingBlock;
  lineIndex: number;
  blockIndex: number;
  isExecuting: boolean;
  isError: boolean;
  selectedBlock: BlockType | null;
  onRemoveBlock?: (blockId: string) => void;
  onTapPlace?: (blockType: BlockType, line: number, position: number) => void;
}


const SortableBlock: React.FC<SortableBlockProps> = ({
  block,
  lineIndex,
  blockIndex,
  isExecuting,
  isError,
  selectedBlock,
  onRemoveBlock,
  onTapPlace,
}) => {
  const { t } = useTranslation();
  const wasDraggingRef = useRef(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: block.id,
    data: {
      type: 'board-block',
      blockId: block.id,
      blockType: block.type,
      lineIndex,
      blockIndex,
    },
  });

  // Track drag state so we can suppress the click that fires after drag ends
  if (isDragging) {
    wasDraggingRef.current = true;
  }

  const handleClick = useCallback(() => {
    // Prevent click from firing after a drag operation
    if (wasDraggingRef.current) {
      wasDraggingRef.current = false;
      return;
    }

    if (selectedBlock === null) {
      // No block selected → remove this block
      if (onRemoveBlock) {
        onRemoveBlock(block.id);
      }
    } else {
      // Block selected → insert before this block's position
      if (onTapPlace) {
        onTapPlace(selectedBlock, lineIndex, blockIndex);
      }
    }
  }, [selectedBlock, onRemoveBlock, onTapPlace, block.id, lineIndex, blockIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (wasDraggingRef.current) {
          wasDraggingRef.current = false;
          return;
        }

        if (selectedBlock === null) {
          if (onRemoveBlock) {
            onRemoveBlock(block.id);
          }
        } else {
          if (onTapPlace) {
            onTapPlace(selectedBlock, lineIndex, blockIndex);
          }
        }
      }
    },
    [selectedBlock, onRemoveBlock, onTapPlace, block.id, lineIndex, blockIndex],
  );

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const category = getBlockCategory(block.type);

  const className = [
    styles.boardBlock,
    styles[category],
    isDragging ? styles.dragging : '',
    isExecuting ? styles.executing : '',
    isError ? styles.errorBlock : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={setNodeRef}
      className={className}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={t(BLOCK_I18N_KEY[block.type])}
      aria-current={isExecuting ? 'step' : undefined}
      data-testid={`board-block-${block.id}`}
      data-block-id={block.id}
      data-line={lineIndex}
      data-position={blockIndex}
    >
      {t(BLOCK_I18N_KEY[block.type])}
    </div>
  );
};

// ── Program line component ──────────────────────────────────────────

interface ProgramLineRowProps {
  line: ProgramLine;
  execution: ExecutionState;
  selectedBlock: BlockType | null;
  onTapPlace?: (blockType: BlockType, line: number, position: number) => void;
  onRemoveBlock?: (blockId: string) => void;
}

const ProgramLineRow: React.FC<ProgramLineRowProps> = ({ line, execution, selectedBlock, onTapPlace, onRemoveBlock }) => {
  const { t } = useTranslation();
  const { lineIndex, blocks } = line;
  const isMain = lineIndex === 0;

  // Set up the line itself as a droppable target for empty lines
  const { setNodeRef: setLineRef, isOver: isLineOver } = useDroppable({
    id: `line-${lineIndex}`,
    data: { type: 'program-line', lineIndex },
  });

  const handleEmptyLineClick = useCallback(() => {
    if (selectedBlock && onTapPlace) {
      onTapPlace(selectedBlock, lineIndex, 0);
    }
  }, [selectedBlock, onTapPlace, lineIndex]);

  const handleEmptyLineKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && selectedBlock) {
        e.preventDefault();
        handleEmptyLineClick();
      }
    },
    [handleEmptyLineClick, selectedBlock],
  );

  const lineClassName = [
    styles.programLine,
    isMain ? styles.mainLine : styles.functionLine,
  ]
    .filter(Boolean)
    .join(' ');

  const lineLabel = isMain
    ? t('ui.mainProgram', 'Main Program')
    : t('ui.functionDefinition', 'Function Definition');

  // Collect block IDs for SortableContext
  const blockIds = blocks.map((b) => b.id);

  const isActive = selectedBlock !== null;

  return (
    <div
      ref={setLineRef}
      className={lineClassName}
      role="list"
      aria-label={lineLabel}
      data-testid={`program-line-${lineIndex}`}
      style={isLineOver ? { borderColor: '#2196f3', borderStyle: 'solid' } : undefined}
    >
      <span className={styles.lineLabel}>{lineLabel}</span>

      <SortableContext items={blockIds} strategy={horizontalListSortingStrategy}>
        {blocks.length === 0 ? (
          <>
            <DropZone lineIndex={lineIndex} position={0} selectedBlock={selectedBlock} onTapPlace={onTapPlace} />
            <span
              className={styles.emptyHint}
              onClick={handleEmptyLineClick}
              onKeyDown={isActive ? handleEmptyLineKeyDown : undefined}
              tabIndex={isActive ? 0 : undefined}
              role={isActive ? 'button' : undefined}
              style={isActive ? { cursor: 'pointer' } : undefined}
            >
              {t('ui.dropBlocksHere', 'Drop blocks here')}
            </span>
          </>
        ) : (
          blocks.map((block, idx) => {
            const isExecuting =
              execution.status === 'running' &&
              execution.currentLine === lineIndex &&
              execution.currentBlockIndex === idx;

            const isError =
              execution.errorInfo != null &&
              execution.errorInfo.line === lineIndex &&
              execution.errorInfo.blockIndex === idx;

            return (
              <React.Fragment key={block.id}>
                <DropZone lineIndex={lineIndex} position={idx} selectedBlock={selectedBlock} onTapPlace={onTapPlace} />
                <SortableBlock
                  block={block}
                  lineIndex={lineIndex}
                  blockIndex={idx}
                  isExecuting={isExecuting}
                  isError={isError}
                  selectedBlock={selectedBlock}
                  onRemoveBlock={onRemoveBlock}
                  onTapPlace={onTapPlace}
                />
              </React.Fragment>
            );
          })
        )}
        {blocks.length > 0 && (
          <DropZone lineIndex={lineIndex} position={blocks.length} selectedBlock={selectedBlock} onTapPlace={onTapPlace} />
        )}
      </SortableContext>
    </div>
  );
};

// ── ControlBoard component ──────────────────────────────────────────

export interface ControlBoardProps {
  controlBoard: ControlBoardState;
  execution: ExecutionState;
  blockInventory: Record<BlockType, number>;
  onPlaceBlock: (blockType: string, line: number, position: number) => void;
  onRemoveBlock: (blockId: string) => void;
  onReorderBlock: (blockId: string, newLine: number, newPosition: number) => void;
}

export const ControlBoard: React.FC<ControlBoardProps> = ({
  controlBoard,
  execution,
  blockInventory,
  onPlaceBlock,
  onRemoveBlock,
}) => {
  const { t } = useTranslation();
  const { selectedBlock, deselectBlock, setAnnouncement } = useTapToPlace();

  // Ensure at least 2 lines exist (main + function definition)
  const lines: ProgramLine[] = controlBoard.lines.length >= 2
    ? controlBoard.lines
    : [
        controlBoard.lines[0] ?? { lineIndex: 0, blocks: [] },
        controlBoard.lines[1] ?? { lineIndex: 1, blocks: [] },
      ];

  const handleTapPlace = useCallback(
    (blockType: BlockType, line: number, position: number) => {
      const currentCount = blockInventory[blockType] ?? 0;
      if (currentCount <= 0) return;

      onPlaceBlock(blockType, line, position);
      setAnnouncement(`Placed ${blockType.replace(/_/g, ' ')} at line ${line}, position ${position}`);

      // After placement, check remaining inventory count
      const remainingCount = currentCount - 1;
      if (remainingCount <= 0) {
        deselectBlock();
      }
    },
    [blockInventory, onPlaceBlock, deselectBlock, setAnnouncement],
  );

  const handleTapRemove = useCallback(
    (blockId: string) => {
      // Find the block type for the announcement
      const block = controlBoard.lines
        .flatMap((l) => l.blocks)
        .find((b) => b.id === blockId);
      onRemoveBlock(blockId);
      if (block) {
        setAnnouncement(`Removed ${block.type.replace(/_/g, ' ')} from board`);
      }
    },
    [onRemoveBlock, controlBoard.lines, setAnnouncement],
  );

  return (
    <section
      className={styles.controlBoard}
      aria-label={t('ui.controlBoard', 'Control Board')}
      data-testid="control-board"
    >
      <h2 className={styles.heading}>{t('ui.controlBoard', 'Control Board')}</h2>
      {lines.map((line) => (
        <ProgramLineRow
          key={line.lineIndex}
          line={line}
          execution={execution}
          selectedBlock={selectedBlock}
          onTapPlace={handleTapPlace}
          onRemoveBlock={handleTapRemove}
        />
      ))}
    </section>
  );
};

export default ControlBoard;
