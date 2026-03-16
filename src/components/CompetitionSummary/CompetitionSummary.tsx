import React from 'react';
import { useTranslation } from 'react-i18next';
import type { CompetitionSession } from '../../core/types';
import styles from './CompetitionSummary.module.css';

export interface CompetitionSummaryProps {
  session: CompetitionSession;
  isPersonalBest: boolean;
  language: 'zh' | 'en';
  onDismiss: () => void;
}

/**
 * Analyze round scores and return i18n keys for areas that need improvement.
 */
function getImprovementAreas(session: CompetitionSession): string[] {
  const areas: string[] = [];
  const rounds = session.rounds;
  if (rounds.length === 0) return areas;

  const goalMissCount = rounds.filter((r) => !r.score.goalReached).length;
  if (goalMissCount > 0) {
    areas.push('competition.improvement.reachGoal');
  }

  const avgEfficiency =
    rounds.reduce((sum, r) => sum + r.score.efficiencyBonus, 0) / rounds.length;
  if (avgEfficiency < 25) {
    areas.push('competition.improvement.fewerSteps');
  }

  const avgSpeed =
    rounds.reduce((sum, r) => sum + r.score.speedBonus, 0) / rounds.length;
  if (avgSpeed < 25) {
    areas.push('competition.improvement.workFaster');
  }

  const avgCollectible =
    rounds.reduce((sum, r) => sum + r.score.collectibleBonus, 0) / rounds.length;
  if (avgCollectible < 20) {
    areas.push('competition.improvement.collectMore');
  }

  return areas;
}

export const CompetitionSummary: React.FC<CompetitionSummaryProps> = ({
  session,
  isPersonalBest,
  onDismiss,
}) => {
  const { t } = useTranslation();
  const maxStars = 3;
  const improvements = getImprovementAreas(session);

  return (
    <div className={styles.overlay} data-testid="competition-summary-overlay">
      <div className={styles.summary} data-testid="competition-summary" role="dialog" aria-label={t('competition.summary')}>
        <h2 className={styles.heading}>{t('competition.sessionComplete')}</h2>

        {isPersonalBest && (
          <div className={styles.personalBestBadge} data-testid="personal-best-badge">
            🏆 {t('competition.newPersonalBest')}
          </div>
        )}

        <div className={styles.totalScore} data-testid="total-score">
          {t('competition.totalScore')}: {session.totalScore}
        </div>

        <div className={styles.stars} data-testid="star-rating" aria-label={`${t('competition.starRating')}: ${session.starRating}/${maxStars}`}>
          {Array.from({ length: maxStars }, (_, i) => (
            <span key={i} className={i < session.starRating ? styles.starFilled : styles.starEmpty}>
              ⭐
            </span>
          ))}
        </div>

        <h3 className={styles.roundsHeading}>{t('competition.perRoundScores')}</h3>
        <div className={styles.roundTable} data-testid="round-scores-list">
          <div className={styles.roundTableHeader}>
            <span>{t('competition.round')}</span>
            <span>{t('competition.basePoints')}</span>
            <span>🌟</span>
            <span>🎯</span>
            <span>⚡</span>
            <span>{t('competition.score')}</span>
          </div>
          {session.rounds.map((round) => (
            <div key={round.roundNumber} className={styles.roundItem} data-testid="round-score-item">
              <span className={styles.roundLabel}>
                {round.roundNumber}
              </span>
              <span className={styles.roundDetail}>{round.score.basePoints}</span>
              <span className={styles.roundDetail}>{round.score.collectibleBonus}</span>
              <span className={styles.roundDetail}>{round.score.efficiencyBonus}</span>
              <span className={styles.roundDetail}>{round.score.speedBonus}</span>
              <span className={styles.roundScore}>{round.score.total}</span>
            </div>
          ))}
        </div>

        {improvements.length > 0 && (
          <div className={styles.improvementSection} data-testid="improvement-areas">
            <h3 className={styles.improvementHeading}>{t('competition.areasForImprovement')}</h3>
            <ul className={styles.improvementList}>
              {improvements.map((key) => (
                <li key={key} className={styles.improvementItem} data-testid="improvement-item">
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button className={styles.dismissBtn} onClick={onDismiss} data-testid="dismiss-button">
          {t('ui.dismiss')}
        </button>
      </div>
    </div>
  );
};

export default CompetitionSummary;
