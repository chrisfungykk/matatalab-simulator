import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useTranslation } from 'react-i18next';
import type { BlockType } from '../../core/types';
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

/** Colour category for visual grouping of block types. */
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

// ── Individual draggable block item ─────────────────────────────────

interface DraggableBlockProps {
  blockType: BlockType;
  count: number;
}

const DraggableBlock: React.FC<DraggableBlockProps> = ({ blockType, count }) => {
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
    styles[category],
    disabled ? styles.disabled : '',
    isDragging ? styles.dragging : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={setNodeRef}
      className={className}
      {...attributes}
      {...listeners}
      role="button"
      aria-disabled={disabled}
      aria-label={`${t(BLOCK_I18N_KEY[blockType])} (${count})`}
      tabIndex={disabled ? -1 : 0}
    >
      <span className={styles.label}>{t(BLOCK_I18N_KEY[blockType])}</span>
      <span className={styles.badge} aria-label={`${count}`}>{count}</span>
    </div>
  );
};

// ── BlockInventory panel ────────────────────────────────────────────

export interface BlockInventoryProps {
  blockInventory: Record<BlockType, number>;
}

export const BlockInventory: React.FC<BlockInventoryProps> = ({ blockInventory }) => {
  const { t } = useTranslation();

  return (
    <section className={styles.inventory} aria-label={t('ui.blockInventory', 'Block Inventory')}>
      <h2 className={styles.heading}>{t('ui.blockInventory', 'Block Inventory')}</h2>
      <div className={styles.grid}>
        {BLOCK_TYPE_ORDER.map((blockType) => (
          <DraggableBlock
            key={blockType}
            blockType={blockType}
            count={blockInventory[blockType]}
          />
        ))}
      </div>
    </section>
  );
};

export default BlockInventory;
