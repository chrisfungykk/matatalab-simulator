import React from 'react';
import { useTranslation } from 'react-i18next';
import type { CompetitionSession } from '../../core/types';
import styles from './CompetitionDashboard.module.css';

export interface CompetitionDashboardProps {
  session: CompetitionSession;
  currentRoundIndex: number;
  timeRemaining: number;
  language: 'zh' | 'en';
}

function formatTime(seconds: number): string {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.max(0, seconds) % 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

export const CompetitionDashboard: React.FC<CompetitionDashboardProps> = ({
  session,
  currentRoundIndex,
  timeRemaining,
}) => {
  const { t } = useTranslation();
  const totalRounds = session.rounds.length;
  const completedRounds = session.rounds.filter((r) => r.completed).length;
  const currentScore = session.rounds.reduce((sum, r) => sum + r.score.total, 0);
  const progressPercent = totalRounds > 0 ? (completedRounds / totalRounds) * 100 : 0;

  return (
    <div className={styles.dashboard} data-testid="competition-dashboard" role="region" aria-label={t('competition.dashboard')}>
      <span className={styles.roundInfo} data-testid="round-info">
        {t('competition.round')} {currentRoundIndex + 1} / {totalRounds}
      </span>

      <span
        className={`${styles.timer} ${timeRemaining <= 30 ? styles.timerWarning : ''}`}
        data-testid="time-remaining"
        aria-label={t('competition.timeRemaining')}
      >
        {formatTime(timeRemaining)}
      </span>

      <span className={styles.score} data-testid="current-score">
        {t('competition.score')}: {currentScore}
      </span>

      <div className={styles.progressContainer}>
        <span className={styles.progressLabel}>{t('competition.progress')}:</span>
        <div className={styles.progressBar} role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
          <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
        </div>
      </div>
    </div>
  );
};

export default CompetitionDashboard;
