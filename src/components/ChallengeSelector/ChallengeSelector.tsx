import React from 'react';
import { useTranslation } from 'react-i18next';
import type { ChallengeConfig, CompetitionChallengeSet } from '../../core/types';
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
  competitionSets?: CompetitionChallengeSet[];
  onSelectCompetitionSet?: (set: CompetitionChallengeSet) => void;
}

export const ChallengeSelector: React.FC<ChallengeSelectorProps> = ({
  challenges,
  onSelectChallenge,
  language,
  competitionSets,
  onSelectCompetitionSet,
}) => {
  const { t } = useTranslation();

  return (
    <section className={styles.selector} aria-label={t('ui.challenges')}>
      <h2 className={styles.heading}>{t('ui.challenges')}</h2>

      {/* Competition challenge sets */}
      {competitionSets && competitionSets.length > 0 && onSelectCompetitionSet && (
        <ul className={styles.list} role="list" data-testid="competition-sets-list">
          {competitionSets.map((set) => (
            <li key={set.id}>
              <div
                className={`${styles.card} ${styles.competitionCard}`}
                role="button"
                tabIndex={0}
                data-testid="competition-set-card"
                aria-label={set.title[language]}
                onClick={() => onSelectCompetitionSet(set)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectCompetitionSet(set);
                  }
                }}
              >
                <div className={styles.setInfo}>
                  <h3 className={styles.title}>{set.title[language]}</h3>
                  <p className={styles.setDescription} data-testid="set-description">
                    {set.description[language]}
                  </p>
                  <span className={styles.setMeta}>
                    {t('challengeSet.skillFocus')}: {t(`challengeSet.${set.skillFocus}`)}
                  </span>
                  <span className={styles.setMeta} data-testid="challenge-count">
                    {t('challengeSet.challengeCount', { count: set.challenges.length })}
                  </span>
                  <span className={styles.setMeta}>
                    {t('challengeSet.recommendedTime', { time: Math.round(set.recommendedTimePerChallenge / 60) })}
                  </span>
                </div>
                <span className={`${styles.badge} ${styles.badgeTier}`} data-testid="tier-badge">
                  {t(`competition.tier.${set.tier}`)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Regular challenge cards */}
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
              {challenge.generationSeed != null && (
                <span className={styles.diceIcon} data-testid="random-maze-icon" title={t('challengeSet.randomMaze')}>
                  🎲
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default ChallengeSelector;
