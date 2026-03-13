import React, { useCallback, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useTranslation } from 'react-i18next';
import type { BlockType } from '../../core/types';
import { getBlockCategory, type BlockCategory } from '../../core/blockCategories';
import { useTapToPlace } from '../../contexts/TapToPlaceContext';
import { BlockIcon } from '../BlockIcon/BlockIcon';
import styles from './BlockInventory.module.css';

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

/** Ordered list of block types for display in the inventory panel. */
const BLOCK_TYPE_ORDER: BlockType[] = [
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

/** Category display order */
const CATEGORY_ORDER: BlockCategory[] = ['motion', 'loop', 'function', 'number', 'fun'];

// ── Individual draggable block item ─────────────────────────────────

interface DraggableBlockProps {
  blockType: BlockType;
  count: number;
  isSelected: boolean;
  onSelect: (blockType: BlockType) => void;
  onDeselect: () => void;
}

const DraggableBlock: React.FC<DraggableBlockProps> = ({ blockType, count, isSelected, onSelect, onDeselect }) => {
  const { t } = useTranslation();
  const disabled = count === 0;

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `inventory-${blockType}`,
    data: { type: 'inventory-block', blockType },
    disabled,
  });

  const category = getBlockCategory(blockType);

  const className = [
    styles.block,
    styles[`category-${category}`],
    disabled ? styles.disabled : '',
    isDragging ? styles.dragging : '',
    isSelected ? styles.selected : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleClick = useCallback(
    () => {
      if (disabled) return;
      if (isSelected) {
        onDeselect();
      } else {
        onSelect(blockType);
      }
    },
    [disabled, isSelected, blockType, onSelect, onDeselect],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick],
  );

  return (
    <div
      ref={setNodeRef}
      className={className}
      data-testid="block-item"
      {...attributes}
      {...listeners}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      aria-disabled={disabled}
      aria-pressed={isSelected}
      aria-label={`${t(BLOCK_I18N_KEY[blockType])} (${count})`}
      tabIndex={disabled ? -1 : 0}
    >
      <BlockIcon blockType={blockType} size={28} className={styles.icon} />
      <span className={styles.label} data-testid="block-label">{t(BLOCK_I18N_KEY[blockType])}</span>
      <span className={styles.badge} data-testid="count-badge" aria-label={`${count}`}>{count}</span>
    </div>
  );
};

// ── BlockInventory panel ────────────────────────────────────────────

export interface BlockInventoryProps {
  blockInventory: Record<BlockType, number>;
}

export const BlockInventory: React.FC<BlockInventoryProps> = ({ blockInventory }) => {
  const { t } = useTranslation();
  const { selectedBlock, selectBlock, deselectBlock } = useTapToPlace();

  /** Group blocks by category, preserving order within each group */
  const groupedBlocks = useMemo(() => {
    const groups: Record<BlockCategory, BlockType[]> = {
      motion: [],
      loop: [],
      function: [],
      number: [],
      fun: [],
    };
    for (const blockType of BLOCK_TYPE_ORDER) {
      const cat = getBlockCategory(blockType);
      groups[cat].push(blockType);
    }
    return groups;
  }, []);

  return (
    <section className={styles.inventory} aria-label={t('ui.blockInventory', 'Block Inventory')}>
      <h2 className={styles.heading}>{t('ui.blockInventory', 'Block Inventory')}</h2>
      <div className={styles.categories}>
        {CATEGORY_ORDER.map((category) => (
          <div
            key={category}
            className={`${styles.categoryGroup} ${styles[`categoryGroup-${category}`]}`}
            data-testid="category-group"
            data-category={category}
          >
            <h3
              className={`${styles.categoryHeader} ${styles[`categoryHeader-${category}`]}`}
              data-testid="category-header"
            >
              {t(`category.${category}`, category)}
            </h3>
            <div className={styles.grid}>
              {groupedBlocks[category].map((blockType) => (
                <DraggableBlock
                  key={blockType}
                  blockType={blockType}
                  count={blockInventory[blockType]}
                  isSelected={blockType === selectedBlock}
                  onSelect={selectBlock}
                  onDeselect={deselectBlock}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default BlockInventory;
