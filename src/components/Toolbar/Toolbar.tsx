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

/* ── Inline SVG Icons ──────────────────────────────────────────── */
const PlayIcon: React.FC = () => (
  <svg data-testid="button-icon" className={styles.btnIcon} width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M4 2l10 6-10 6V2z" />
  </svg>
);
const ResetIcon: React.FC = () => (
  <svg data-testid="button-icon" className={styles.btnIcon} width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M8 1a7 7 0 0 0-7 7h2a5 5 0 0 1 9.17-2.74L10 7h5V2l-1.76 1.76A7 7 0 0 0 8 1zm5 7a5 5 0 0 1-9.17 2.74L6 9H1v5l1.76-1.76A7 7 0 0 0 15 8h-2z" />
  </svg>
);
const SaveIcon: React.FC = () => (
  <svg data-testid="button-icon" className={styles.btnIcon} width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M2 1h9l3 3v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zm2 0v4h6V1H4zm4 7a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
  </svg>
);
const LoadIcon: React.FC = () => (
  <svg data-testid="button-icon" className={styles.btnIcon} width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M1 3a1 1 0 0 1 1-1h4l2 2h6a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3z" />
  </svg>
);
const SpeedIcon: React.FC = () => (
  <svg data-testid="button-icon" className={styles.btnIcon} width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 2a5 5 0 0 1 4.33 2.5l-3.46 2a1 1 0 1 1-1.74 0L3.67 5.5A5 5 0 0 1 8 3z" />
  </svg>
);
const TimerIcon: React.FC = () => (
  <svg data-testid="button-icon" className={styles.btnIcon} width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 2a5 5 0 1 1 0 10A5 5 0 0 1 8 3zm-.5 2v3.5l2.5 1.5.5-.87-2-1.2V5h-1z" />
  </svg>
);
const GlobeIcon: React.FC = () => (
  <svg data-testid="button-icon" className={styles.btnIcon} width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zM3.07 9H5.1a13 13 0 0 0 .4 2.93A5 5 0 0 1 3.07 9zm0-2a5 5 0 0 1 2.43-2.93A13 13 0 0 0 5.1 7H3.07zM8 14a5 5 0 0 1-1.2-.15C6.27 12.8 5.9 11 5.8 9h4.4c-.1 2-.47 3.8-1 4.85A5 5 0 0 1 8 14zm0-12c.5 0 1.2 1.2 1.6 3.15A5 5 0 0 1 8 5a5 5 0 0 1-1.6.15C6.8 3.2 7.5 2 8 2zm2.5 2.07A5 5 0 0 1 12.93 7H10.9a13 13 0 0 0-.4-2.93zm0 7.86a13 13 0 0 0 .4-2.93h2.03a5 5 0 0 1-2.43 2.93z" />
  </svg>
);
const StopIcon: React.FC = () => (
  <svg data-testid="button-icon" className={styles.btnIcon} width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <rect x="3" y="3" width="10" height="10" rx="1" />
  </svg>
);
const StartTimerIcon: React.FC = () => (
  <svg data-testid="button-icon" className={styles.btnIcon} width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm-.5 2v3.5l2.5 1.5.5-.87-2-1.2V5h-1z" />
  </svg>
);

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
        <button data-testid="toolbar-button" className={`${styles.btn} ${styles.btnRun}`} onClick={onRun} disabled={isRunning} aria-label={t('ui.run')}>
          <PlayIcon /> {t('ui.run')}
        </button>
        <button data-testid="toolbar-button" className={`${styles.btn} ${styles.btnReset}`} onClick={onReset} aria-label={t('ui.reset')}>
          <ResetIcon /> {t('ui.reset')}
        </button>
      </div>
      <div className={styles.separator} role="separator" />
      <div className={styles.group}>
        <button data-testid="toolbar-button" className={styles.btn} onClick={handleSave} aria-label={t('ui.save')}><SaveIcon /> {t('ui.save')}</button>
        <button data-testid="toolbar-button" className={styles.btn} onClick={handleLoadClick} aria-label={t('ui.load')}><LoadIcon /> {t('ui.load')}</button>
        <input ref={fileInputRef} type="file" accept=".json,application/json"
          className={styles.hiddenInput} onChange={handleFileChange}
          aria-label={t('toolbar.fileLabel')} tabIndex={-1} />
      </div>
      <div className={styles.separator} role="separator" />
      <div className={styles.speedGroup} role="radiogroup" aria-label={t('ui.speed')}>
        <span className={styles.speedLabel}><SpeedIcon /> {t('ui.speed')}:</span>
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
        <span className={styles.timerLabel}><TimerIcon /> {t('ui.timer')}:</span>
        {timer?.running ? (
          <>
            <span
              className={`${styles.timerDisplay} ${timer.remaining <= 10 ? styles.timerWarning : ''}`}
              aria-live="polite" aria-label={t('ui.timer')}>
              {formatTime(timer.remaining)}
            </span>
            <button data-testid="toolbar-button" className={`${styles.btn} ${styles.btnTimerStop}`}
              onClick={handleTimerStop} aria-label={t('ui.timerStop')}>
              <StopIcon /> {t('ui.timerStop')}
            </button>
          </>
        ) : (
          <>
            <input type="number" className={styles.durationInput}
              value={durationInput} onChange={handleDurChange}
              min={1} max={3600} aria-label={t('ui.timerDuration')} />
            <span className={styles.durationUnit}>{t('ui.seconds')}</span>
            <button data-testid="toolbar-button" className={`${styles.btn} ${styles.btnTimerStart}`}
              onClick={handleTimerStart}
              disabled={!onTimerStart || durationInput <= 0}
              aria-label={t('ui.timerStart')}>
              <StartTimerIcon /> {t('ui.timerStart')}
            </button>
          </>
        )}
      </div>
      <div className={styles.separator} role="separator" />
      <button data-testid="toolbar-button" className={styles.langBtn} onClick={handleLang}
        aria-label={`${t('ui.language')}: ${language === 'zh' ? 'English' : '中文'}`}>
        <GlobeIcon /> {language === 'zh' ? 'EN' : '中文'}
      </button>
    </nav>
  );
};
export default Toolbar;
