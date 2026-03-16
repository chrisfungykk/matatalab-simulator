import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { MazeGeneratorParams } from '../../core/types';
import styles from './MazeControls.module.css';

export interface MazeControlsProps {
  onGenerate: (params: MazeGeneratorParams) => void;
  onExport: () => void;
  generatedSeed?: number;
  language: 'zh' | 'en';
  disabled?: boolean;
}

const WIDTH_OPTIONS = [4, 5, 6, 7, 8];
const HEIGHT_OPTIONS = [4, 5, 6, 7, 8];
const DIFFICULTY_OPTIONS: MazeGeneratorParams['difficulty'][] = ['easy', 'medium', 'hard'];
const COLLECTIBLE_OPTIONS = [0, 1, 2, 3, 4, 5];

export const MazeControls: React.FC<MazeControlsProps> = ({
  onGenerate,
  onExport,
  generatedSeed,
  disabled = false,
}) => {
  const { t } = useTranslation();

  const [seedInput, setSeedInput] = useState('');
  const [width, setWidth] = useState(5);
  const [height, setHeight] = useState(5);
  const [difficulty, setDifficulty] = useState<MazeGeneratorParams['difficulty']>('medium');
  const [collectibles, setCollectibles] = useState(1);

  const handleSeedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow empty or non-negative integers only
    if (val === '' || /^\d+$/.test(val)) {
      setSeedInput(val);
    }
  }, []);

  const handleGenerate = useCallback(() => {
    const params: MazeGeneratorParams = {
      width,
      height,
      difficulty,
      collectibles,
    };
    if (seedInput !== '') {
      params.seed = parseInt(seedInput, 10);
    }
    onGenerate(params);
  }, [width, height, difficulty, collectibles, seedInput, onGenerate]);

  return (
    <div className={styles.container} data-testid="maze-controls" role="region" aria-label={t('maze.generate')}>
      {/* Seed input */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="maze-seed">{t('maze.seed')}</label>
        <input
          id="maze-seed"
          data-testid="maze-seed-input"
          className={styles.input}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={seedInput}
          onChange={handleSeedChange}
          placeholder={t('maze.seedInput')}
          disabled={disabled}
        />
      </div>

      {/* Grid width */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="maze-width">{t('maze.gridWidth')}</label>
        <select
          id="maze-width"
          data-testid="maze-width-select"
          className={styles.select}
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
          disabled={disabled}
        >
          {WIDTH_OPTIONS.map((w) => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>
      </div>

      {/* Grid height */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="maze-height">{t('maze.gridHeight')}</label>
        <select
          id="maze-height"
          data-testid="maze-height-select"
          className={styles.select}
          value={height}
          onChange={(e) => setHeight(Number(e.target.value))}
          disabled={disabled}
        >
          {HEIGHT_OPTIONS.map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
      </div>

      {/* Difficulty */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="maze-difficulty">{t('maze.difficulty')}</label>
        <select
          id="maze-difficulty"
          data-testid="maze-difficulty-select"
          className={styles.select}
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as MazeGeneratorParams['difficulty'])}
          disabled={disabled}
        >
          {DIFFICULTY_OPTIONS.map((d) => (
            <option key={d} value={d}>{t(`difficulty.${d}`)}</option>
          ))}
        </select>
      </div>

      {/* Collectible count */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="maze-collectibles">{t('maze.collectibleCount')}</label>
        <select
          id="maze-collectibles"
          data-testid="maze-collectibles-select"
          className={styles.select}
          value={collectibles}
          onChange={(e) => setCollectibles(Number(e.target.value))}
          disabled={disabled}
        >
          {COLLECTIBLE_OPTIONS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Buttons */}
      <div className={styles.actions}>
        <button
          data-testid="maze-generate-button"
          className={styles.generateBtn}
          onClick={handleGenerate}
          disabled={disabled}
          aria-label={t('maze.generate')}
        >
          {t('maze.generate')}
        </button>
        <button
          data-testid="maze-export-button"
          className={styles.exportBtn}
          onClick={onExport}
          disabled={disabled || generatedSeed == null}
          aria-label={t('maze.export')}
        >
          {t('maze.export')}
        </button>
      </div>

      {/* Display generated seed */}
      {generatedSeed != null && (
        <div className={styles.seedDisplay} data-testid="maze-seed-display">
          {t('maze.seedDisplay', { seed: generatedSeed })}
        </div>
      )}
    </div>
  );
};

export default MazeControls;
