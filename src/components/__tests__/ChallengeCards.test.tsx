// Feature: uiux-matatalab-refresh, Property 10: Challenge cards have correct difficulty badge
import { describe, it, expect } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import fc from 'fast-check';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import { ChallengeSelector } from '../ChallengeSelector/ChallengeSelector';
import type { ChallengeConfig } from '../../core/types';

function makeChallengeConfig(difficulty: 'easy' | 'medium' | 'hard'): ChallengeConfig {
  return {
    id: `test-${difficulty}`,
    title: { zh: `${difficulty}挑戰`, en: `${difficulty} Challenge` },
    difficulty,
    grid: { width: 4, height: 4 },
    start: { row: 0, col: 0, direction: 'east' },
    goals: [{ row: 3, col: 3 }],
    obstacles: [],
    collectibles: [],
    blockInventory: { forward: 4 },
  };
}

const DIFFICULTY_CSS_CLASS: Record<string, string> = {
  easy: 'badgeEasy',
  medium: 'badgeMedium',
  hard: 'badgeHard',
};

describe('ChallengeSelector - Property 10: Challenge cards have correct difficulty badge', () => {
  // **Validates: Requirements 6.5**
  it('should render a difficulty badge with correct data-difficulty attribute and CSS class for any difficulty level', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<'easy' | 'medium' | 'hard'>('easy', 'medium', 'hard'),
        (difficulty) => {
          cleanup();

          const challenge = makeChallengeConfig(difficulty);

          const { getByTestId } = render(
            <I18nextProvider i18n={i18n}>
              <ChallengeSelector
                challenges={[challenge]}
                onSelectChallenge={() => {}}
                language="en"
              />
            </I18nextProvider>,
          );

          // Find the challenge card
          const card = getByTestId('challenge-card');
          expect(card).toBeTruthy();

          // Find the difficulty badge
          const badge = getByTestId('difficulty-badge');
          expect(badge).toBeTruthy();

          // Assert data-difficulty matches the difficulty level
          expect(badge.getAttribute('data-difficulty')).toBe(difficulty);

          // Assert the badge has a CSS class containing the difficulty name
          const expectedClassFragment = DIFFICULTY_CSS_CLASS[difficulty];
          const classNames = badge.className;
          expect(classNames).toContain(expectedClassFragment);

          cleanup();
        },
      ),
      { numRuns: 100 },
    );
  });
});
