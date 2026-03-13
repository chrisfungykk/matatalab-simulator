import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from 'react-i18next';
import type { ControlBoardState, ExecutionState, BlockType, CodingBlock, ProgramLine } from '../../core/types';
import { getBlockCategory } from '../../core/blockCategories';
import { useTapToPlace } from '../../contexts/TapToPlaceContext';
import { BlockIcon } from '../BlockIcon/BlockIcon';
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

/** Maximum number of visible empty slots per line */
const MAX_EMPTY_SLOTS = 6;

// ── Flow indicator arrow between blocks ─────────────────────────────

const FlowIndicator: React.FC = () => (
  <span className={styles.flowIndicator} data-testid="flow-indicator" aria-hidden="true">
    <svg width="12" height="12" viewBox="0 0 12 12">
      <path d="M2 6h6M6 3l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </span>
);

// ── Hand-drag icon for empty placeholder ────────────────────────────

const HandDragIcon: React.FC = () => (
  <span className={styles.handDragIcon} aria-hidden="true">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 11V6a2 2 0 0 0-4 0" />
      <path d="M14 10V4a2 2 0 0 0-4 0v6" />
      <path d="M10 10.5V6a2 2 0 0 0-4 0v8" />
      <path d="M18 8a2 2 0 0 1 4 0v7a8 8 0 0 1-8 8h-2c-2.5 0-4.5-1-6.2-2.8L3 17" />
    </svg>
  </span>
);

// ── Line header icons ───────────────────────────────────────────────

const MainLineIcon: React.FC = () => (
  <span className={styles.lineHeaderIcon} aria-hidden="true">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 3h12v2H2V3zm0 4h8v2H2V7zm0 4h10v2H2v-2z" />
    </svg>
  </span>
);

const FunctionLineIcon: React.FC = () => (
  <span className={styles.lineHeaderIcon} aria-hidden="true">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M5.5 2C4.1 2 3 3.1 3 4.5V6H2v2h1v3.5C3 12.9 4.1 14 5.5 14H7v-2H5.5c-.3 0-.5-.2-.5-.5V8h3V6H5V4.5c0-.3.2-.5.5-.5H7V2H5.5zM10 6v2h1.5c.3 0 .5.2.5.5V12h-3v2h3c1.4 0 2.5-1.1 2.5-2.5V8h1V6h-1V4.5C14.5 3.1 13.4 2 12 2h-1.5v2H12c.3 0 .5.2.5.5V6H10z" />
    </svg>
  </span>
);

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
  isNew: boolean;
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
  isNew,
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
    isNew ? styles.snapBounce : '',
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
      <BlockIcon blockType={block.type} size={20} />
      <span className={styles.boardBlockLabel}>{t(BLOCK_I18N_KEY[block.type])}</span>
    </div>
  );
};

// ── Program line component ──────────────────────────────────────────

interface ProgramLineRowProps {
  line: ProgramLine;
  execution: ExecutionState;
  selectedBlock: BlockType | null;
  newBlockIds: Set<string>;
  onTapPlace?: (blockType: BlockType, line: number, position: number) => void;
  onRemoveBlock?: (blockId: string) => void;
}

const ProgramLineRow: React.FC<ProgramLineRowProps> = ({ line, execution, selectedBlock, newBlockIds, onTapPlace, onRemoveBlock }) => {
  const { t } = useTranslation();
  const { lineIndex, blocks } = line;
  const isMain = lineIndex === 0;

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

  const blockIds = blocks.map((b) => b.id);
  const isActive = selectedBlock !== null;

  // Calculate empty slots to show
  const emptySlotCount = Math.max(0, MAX_EMPTY_SLOTS - blocks.length);

  return (
    <div
      ref={setLineRef}
      className={lineClassName}
      role="list"
      aria-label={lineLabel}
      data-testid="program-line"
      style={isLineOver ? { borderColor: '#2196f3', borderStyle: 'solid' } : undefined}
    >
      <div className={styles.lineHeader} data-testid="line-header">
        {isMain ? <MainLineIcon /> : <FunctionLineIcon />}
        <span className={styles.lineLabel}>{lineLabel}</span>
      </div>

      <SortableContext items={blockIds} strategy={horizontalListSortingStrategy}>
        {blocks.length === 0 ? (
          <>
            <DropZone lineIndex={lineIndex} position={0} selectedBlock={selectedBlock} onTapPlace={onTapPlace} />
            <div
              className={styles.emptyPlaceholder}
              onClick={handleEmptyLineClick}
              onKeyDown={isActive ? handleEmptyLineKeyDown : undefined}
              tabIndex={isActive ? 0 : undefined}
              role={isActive ? 'button' : undefined}
              style={isActive ? { cursor: 'pointer' } : undefined}
            >
              <HandDragIcon />
              <span className={styles.emptyHintText}>
                {t('ui.dropBlocksHere', 'Drop blocks here')}
              </span>
            </div>
            {/* Render empty slots for visual guidance */}
            {Array.from({ length: emptySlotCount }, (_, i) => (
              <div key={`empty-${lineIndex}-${i}`} className={styles.emptySlot} data-testid="empty-slot" aria-hidden="true" />
            ))}
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
                  isNew={newBlockIds.has(block.id)}
                  selectedBlock={selectedBlock}
                  onRemoveBlock={onRemoveBlock}
                  onTapPlace={onTapPlace}
                />
                {/* Flow indicator between blocks (not after the last one) */}
                {idx < blocks.length - 1 && <FlowIndicator />}
              </React.Fragment>
            );
          })
        )}
        {blocks.length > 0 && (
          <>
            <DropZone lineIndex={lineIndex} position={blocks.length} selectedBlock={selectedBlock} onTapPlace={onTapPlace} />
            {/* Render remaining empty slots after placed blocks */}
            {Array.from({ length: emptySlotCount }, (_, i) => (
              <div key={`empty-${lineIndex}-${i}`} className={styles.emptySlot} data-testid="empty-slot" aria-hidden="true" />
            ))}
          </>
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

  // Track newly placed block IDs for snap-bounce animation
  const [newBlockIds, setNewBlockIds] = useState<Set<string>>(new Set());
  const prevBlockIdsRef = useRef<Set<string>>(new Set());

  // Detect newly added blocks by comparing current vs previous block IDs
  useEffect(() => {
    const currentIds = new Set(controlBoard.lines.flatMap((l) => l.blocks.map((b) => b.id)));
    const prevIds = prevBlockIdsRef.current;

    const added = new Set<string>();
    for (const id of currentIds) {
      if (!prevIds.has(id)) {
        added.add(id);
      }
    }

    if (added.size > 0) {
      setNewBlockIds(added);
      // Clear the animation class after the animation completes
      const timer = setTimeout(() => setNewBlockIds(new Set()), 200);
      prevBlockIdsRef.current = currentIds;
      return () => clearTimeout(timer);
    }

    prevBlockIdsRef.current = currentIds;
  }, [controlBoard.lines]);

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

      const remainingCount = currentCount - 1;
      if (remainingCount <= 0) {
        deselectBlock();
      }
    },
    [blockInventory, onPlaceBlock, deselectBlock, setAnnouncement],
  );

  const handleTapRemove = useCallback(
    (blockId: string) => {
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
          newBlockIds={newBlockIds}
          onTapPlace={handleTapPlace}
          onRemoveBlock={handleTapRemove}
        />
      ))}
    </section>
  );
};

export default ControlBoard;
