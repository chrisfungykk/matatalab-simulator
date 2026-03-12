import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ControlBoardState, SpeedSetting } from '../../core/types';
import { serialize, deserialize } from '../../core/serializer';
import styles from './Toolbar.module.css';
const SPEED_OPTIONS: SpeedSetting[] = ['slow', 'normal', 'fast'];
const SPEED_I18N: Record<SpeedSetting, string> = { slow: 'ui.slow', normal: 'ui.normal', fast: 'ui.fast' };
const LOCALSTORAGE_KEY = 'matatalab-program';
export interface TimerState { enabled: boolean; duration: number; remaining: number; running: boolean; }
export interface ToolbarProps {
  onRun: () => void; onReset: () => void; onLoadProgram: (board: ControlBoardState) => void;
  onSetSpeed: (speed: SpeedSetting) => void; onSetLanguage: (language: 'zh' | 'en') => void;
  onTimerStart?: (duration: number) => void; onTimerStop?: () => void;
  onTimerTick?: () => void; onTimerExpired?: () => void;
  controlBoard: ControlBoardState; speed: SpeedSetting; language: 'zh' | 'en';
  executionStatus: string; timer?: TimerState;
}
function formatTime(sec: number): string { const m = Math.floor(sec / 60); const s = sec % 60; return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0'); }
export const Toolbar: React.FC<ToolbarProps> = (props) => {
  const { onRun, onReset, onLoadProgram, onSetSpeed, onSetLanguage, onTimerStart, onTimerStop, onTimerTick, onTimerExpired, controlBoard, speed, language, executionStatus, timer } = props;
  const { t, i18n } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [durationInput, setDurationInput] = useState<number>(60);
  const isRunning = executionStatus === 'running';
  useEffect(() => {
    if (!timer?.running || !onTimerTick) return;
    const id = setInterval(() => { onTimerTick(); }, 1000);
    return () => clearInterval(id);
  }, [timer?.running, onTimerTick]);
  useEffect(() => {
    if (timer?.running && timer.remaining <= 0 && onTimerExpired) onTimerExpired();
  }, [timer?.running, timer?.remaining, onTimerExpired]);
  const handleSave = useCallback(() => {
    const json = serialize(controlBoard);
    try { localStorage.setItem(LOCALSTORAGE_KEY, json); } catch { /* noop */ }
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'matatalab-program.json'; a.click();
    URL.revokeObjectURL(url);
  }, [controlBoard]);
  const handleLoadClick = useCallback(() => { fileInputRef.current?.click(); }, []);
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { try { onLoadProgram(deserialize(reader.result as string)); } catch { alert(t('toolbar.loadError')); } };
    reader.readAsText(file); e.target.value = '';
  }, [onLoadProgram, t]);
  const handleLang = useCallback(() => { const n = language === 'zh' ? 'en' : 'zh'; onSetLanguage(n); i18n.changeLanguage(n); }, [language, onSetLanguage, i18n]);
  const handleTimerStart = useCallback(() => { if (onTimerStart && durationInput > 0) onTimerStart(durationInput); }, [onTimerStart, durationInput]);
  const handleTimerStop = useCallback(() => { onTimerStop?.(); }, [onTimerStop]);
  const handleDurChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { const v = parseInt(e.target.value, 10); if (!isNaN(v) && v >= 0) setDurationInput(v); }, []);
  return (
    <nav className={styles.toolbar} aria-label={t('ui.controlBoard')}>
      <div className={styles.group}>
        <button className={`${styles.btn} ${styles.btnRun}`} onClick={onRun} disabled={isRunning} aria-label={t('ui.run')}>
          ▶ {t('ui.run')}
        </button>
        <button className={`${styles.btn} ${styles.btnReset}`} onClick={onReset} aria-label={t('ui.reset')}>
          ↺ {t('ui.reset')}
        </button>
      </div>
      <div className={styles.separator} role="separator" />
      <div className={styles.group}>
        <button className={styles.btn} onClick={handleSave} aria-label={t('ui.save')}>💾 {t('ui.save')}</button>
        <button className={styles.btn} onClick={handleLoadClick} aria-label={t('ui.load')}>📂 {t('ui.load')}</button>
        <input ref={fileInputRef} type="file" accept=".json,application/json"
          className={styles.hiddenInput} onChange={handleFileChange}
          aria-label={t('toolbar.fileLabel')} tabIndex={-1} />
      </div>
      <div className={styles.separator} role="separator" />
      <div className={styles.speedGroup} role="radiogroup" aria-label={t('ui.speed')}>
        <span className={styles.speedLabel}>{t('ui.speed')}:</span>
        {SPEED_OPTIONS.map((opt) => (
          <button key={opt}
            className={`${styles.speedBtn} ${speed === opt ? styles.speedActive : ''}`}
            onClick={() => onSetSpeed(opt)} role="radio"
            aria-checked={speed === opt} aria-label={t(SPEED_I18N[opt])}>
            {t(SPEED_I18N[opt])}
          </button>
        ))}
      </div>
      <div className={styles.separator} role="separator" />
      <div className={styles.timerGroup} role="group" aria-label={t('ui.timer')}>
        <span className={styles.timerLabel}>⏱ {t('ui.timer')}:</span>
        {timer?.running ? (
          <>
            <span
              className={`${styles.timerDisplay} ${timer.remaining <= 10 ? styles.timerWarning : ''}`}
              aria-live="polite" aria-label={t('ui.timer')}>
              {formatTime(timer.remaining)}
            </span>
            <button className={`${styles.btn} ${styles.btnTimerStop}`}
              onClick={handleTimerStop} aria-label={t('ui.timerStop')}>
              ⏹ {t('ui.timerStop')}
            </button>
          </>
        ) : (
          <>
            <input type="number" className={styles.durationInput}
              value={durationInput} onChange={handleDurChange}
              min={1} max={3600} aria-label={t('ui.timerDuration')} />
            <span className={styles.durationUnit}>{t('ui.seconds')}</span>
            <button className={`${styles.btn} ${styles.btnTimerStart}`}
              onClick={handleTimerStart}
              disabled={!onTimerStart || durationInput <= 0}
              aria-label={t('ui.timerStart')}>
              ⏱ {t('ui.timerStart')}
            </button>
          </>
        )}
      </div>
      <div className={styles.separator} role="separator" />
      <button className={styles.langBtn} onClick={handleLang}
        aria-label={`${t('ui.language')}: ${language === 'zh' ? 'English' : '中文'}`}>
        {language === 'zh' ? 'EN' : '中文'}
      </button>
    </nav>
  );
};
export default Toolbar;
