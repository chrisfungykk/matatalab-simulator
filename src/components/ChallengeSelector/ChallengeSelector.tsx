import React from 'react';
import { useTranslation } from 'react-i18next';
import type { ChallengeConfig } from '../../core/types';
import styles from './ChallengeSelector.module.css';

const BADGE_CLASS: Record<ChallengeConfig['difficulty'], string> = {
  easy: styles.badgeEasy,
  medium: styles.badgeMedium,
  hard: styles.badgeHard,
};

export interface ChallengeSelectorProps {
  challenges: ChallengeConfig[];
  onSelectChallenge: (config: ChallengeConfig) => void;
  language: 'zh' | 'en';
}

export const ChallengeSelector: React.FC<ChallengeSelectorProps> = ({
  challenges,
  onSelectChallenge,
  language,
}) => {
  const { t } = useTranslation();

  return (
    <section className={styles.selector} aria-label={t('ui.challenges')}>
      <h2 className={styles.heading}>{t('ui.challenges')}</h2>
      <ul className={styles.list} role="list">
        {challenges.map((challenge) => (
          <li key={challenge.id}>
            <div
              className={styles.card}
              role="button"
              tabIndex={0}
              data-testid="challenge-card"
              aria-label={`${challenge.title[language]} — ${t(`difficulty.${challenge.difficulty}`)}`}
              onClick={() => onSelectChallenge(challenge)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectChallenge(challenge);
                }
              }}
            >
              <h3 className={styles.title}>{challenge.title[language]}</h3>
              <span
                className={`${styles.badge} ${BADGE_CLASS[challenge.difficulty]}`}
                data-testid="difficulty-badge"
                data-difficulty={challenge.difficulty}
              >
                {t(`difficulty.${challenge.difficulty}`)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default ChallengeSelector;
