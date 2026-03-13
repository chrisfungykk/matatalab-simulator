// Feature: uiux-matatalab-refresh, Property 13: Star rating matches difficulty
import { describe, it, expect } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import fc from 'fast-check';
import StarRating from '../StarRating/StarRating';

type Difficulty = 'easy' | 'medium' | 'hard';

const EXPECTED_STARS: Record<Difficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

describe('FeedbackOverlay - Property 13: Star rating matches difficulty', () => {
  // **Validates: Requirements 9.1**
  it('should render the correct number of stars and trophy only for hard difficulty', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<Difficulty>('easy', 'medium', 'hard'),
        (difficulty: Difficulty) => {
          cleanup();

          const { getByTestId, getAllByTestId, queryByTestId } = render(
            <StarRating difficulty={difficulty} />,
          );

          // Container should exist
          const container = getByTestId('star-rating');
          expect(container).toBeTruthy();

          // Star count should match expected mapping
          const stars = getAllByTestId('star');
          expect(stars.length).toBe(EXPECTED_STARS[difficulty]);

          // Trophy should exist only for hard difficulty
          const trophy = queryByTestId('trophy');
          if (difficulty === 'hard') {
            expect(trophy).not.toBeNull();
          } else {
            expect(trophy).toBeNull();
          }

          cleanup();
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Feature: uiux-matatalab-refresh, Property 14: Success message is localized
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import FeedbackOverlay from '../FeedbackOverlay/FeedbackOverlay';

const EXPECTED_SUCCESS: Record<string, string> = {
  en: 'Challenge Complete!',
  zh: '挑戰成功！',
};

describe('FeedbackOverlay - Property 14: Success message is localized', () => {
  // **Validates: Requirements 9.3**
  it('should display a congratulatory message matching the i18n translation for the active language', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('en', 'zh'),
        (lang: string) => {
          cleanup();
          i18n.changeLanguage(lang);

          const { getByTestId } = render(
            <I18nextProvider i18n={i18n}>
              <FeedbackOverlay
                executionStatus="completed"
                goalReached={true}
                challengeDifficulty="easy"
                language={lang as 'en' | 'zh'}
                onDismiss={() => {}}
              />
            </I18nextProvider>,
          );

          const successMsg = getByTestId('success-message');
          expect(successMsg.textContent).toBe(EXPECTED_SUCCESS[lang]);

          cleanup();
        },
      ),
      { numRuns: 100 },
    );
  });
});
