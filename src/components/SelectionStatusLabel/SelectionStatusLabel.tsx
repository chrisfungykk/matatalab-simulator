import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTapToPlace } from '../../contexts/TapToPlaceContext';
import type { BlockType } from '../../core/types';

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

const SelectionStatusLabel: React.FC = () => {
  const { t } = useTranslation();
  const { selectedBlock } = useTapToPlace();

  return (
    <div aria-live="polite" aria-atomic="true" data-testid="selection-status-label">
      {selectedBlock ? (
        <span
          style={{
            display: 'inline-block',
            padding: '4px 10px',
            fontSize: '0.82rem',
            fontWeight: 500,
            color: '#1a73e8',
            background: '#e8f0fe',
            borderRadius: '4px',
          }}
        >
          {t('ui.selected', { defaultValue: 'Selected' })}:{' '}
          {t(BLOCK_I18N_KEY[selectedBlock], { defaultValue: selectedBlock })}
        </span>
      ) : null}
    </div>
  );
};

export default SelectionStatusLabel;
