import React from 'react';
import { useTranslation } from 'react-i18next';
import type { CompetitionSession } from '../../core/types';
import styles from './CompetitionHistory.module.css';

export interface CompetitionHistoryProps {
  sessions: CompetitionSession[];
  language: 'zh' | 'en';
}

export const CompetitionHistory: React.FC<CompetitionHistoryProps> = ({
  sessions,
  language,
}) => {
  const { t } = useTranslation();
  const maxStars = 3;

  return (
    <section
      className={styles.history}
      data-testid="competition-history"
      role="region"
      aria-label={t('competition.history')}
    >
      <h2 className={styles.heading}>{t('competition.pastSessions')}</h2>

      {sessions.length === 0 ? (
        <p className={styles.empty} data-testid="no-history">
          {t('competition.noHistory')}
        </p>
      ) : (
        <ul className={styles.list} role="list" data-testid="history-list">
          {sessions.map((session) => (
            <li
              key={session.id}
              className={styles.item}
              data-testid="history-item"
              aria-label={`${session.challengeSetName[language]} — ${t('competition.score')}: ${session.totalScore}`}
            >
              <span className={styles.date} data-testid="history-date">
                {session.date}
              </span>
              <span className={styles.setName} data-testid="history-set-name">
                {session.challengeSetName[language]}
              </span>
              <span className={styles.score} data-testid="history-score">
                {t('competition.score')}: {session.totalScore}
              </span>
              <span
                className={styles.stars}
                data-testid="history-stars"
                aria-label={`${t('competition.starRating')}: ${session.starRating}/${maxStars}`}
              >
                {Array.from({ length: maxStars }, (_, i) => (
                  <span
                    key={i}
                    className={i < session.starRating ? styles.starFilled : styles.starEmpty}
                  >
                    ⭐
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default CompetitionHistory;
