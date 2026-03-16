import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import { CompetitionSummary } from '../CompetitionSummary/CompetitionSummary';
import type { CompetitionSession, CompetitionRound, RoundScore } from '../../core/types';

function makeScore(total: number): RoundScore {
  return { goalReached: total > 0, basePoints: 100, collectibleBonus: 0, efficiencyBonus: 0, speedBonus: 0, total };
}

function makeRound(num: number, total: number): CompetitionRound {
  return { roundNumber: num, challengeId: `c-${num}`, isRandom: false, score: makeScore(total), completed: true, timeUsed: 60 };
}

function makeSession(starRating: 1 | 2 | 3, rounds: CompetitionRound[]): CompetitionSession {
  return {
    id: 'test-session',
    date: '2025-01-01',
    challengeSetId: 'set-1',
    challengeSetName: { zh: '測試', en: 'Test Set' },
    tier: 'beginner',
    rounds,
    totalScore: rounds.reduce((s, r) => s + r.score.total, 0),
    starRating,
  };
}

describe('CompetitionSummary', () => {
  beforeEach(() => {
    cleanup();
    i18n.changeLanguage('en');
  });

  it('renders total score', () => {
    const session = makeSession(2, [makeRound(1, 80), makeRound(2, 60)]);
    const { getByTestId } = render(
      <I18nextProvider i18n={i18n}>
        <CompetitionSummary session={session} isPersonalBest={false} language="en" onDismiss={() => {}} />
      </I18nextProvider>,
    );
    expect(getByTestId('total-score').textContent).toContain('140');
  });

  it('renders correct number of filled stars for star rating', () => {
    const session = makeSession(2, [makeRound(1, 80)]);
    const { getByTestId } = render(
      <I18nextProvider i18n={i18n}>
        <CompetitionSummary session={session} isPersonalBest={false} language="en" onDismiss={() => {}} />
      </I18nextProvider>,
    );
    const starContainer = getByTestId('star-rating');
    const stars = starContainer.querySelectorAll('span');
    expect(stars.length).toBe(3);
    // First 2 should not have starEmpty class, third should
    expect(stars[0].className).not.toContain('starEmpty');
    expect(stars[1].className).not.toContain('starEmpty');
    expect(stars[2].className).toContain('starEmpty');
  });

  it('renders 3 filled stars for 3-star rating', () => {
    const session = makeSession(3, [makeRound(1, 200)]);
    const { getByTestId } = render(
      <I18nextProvider i18n={i18n}>
        <CompetitionSummary session={session} isPersonalBest={false} language="en" onDismiss={() => {}} />
      </I18nextProvider>,
    );
    const stars = getByTestId('star-rating').querySelectorAll('span');
    for (const star of stars) {
      expect(star.className).not.toContain('starEmpty');
    }
  });

  it('shows personal best badge when isPersonalBest is true', () => {
    const session = makeSession(1, [makeRound(1, 50)]);
    const { getByTestId } = render(
      <I18nextProvider i18n={i18n}>
        <CompetitionSummary session={session} isPersonalBest={true} language="en" onDismiss={() => {}} />
      </I18nextProvider>,
    );
    expect(getByTestId('personal-best-badge')).toBeTruthy();
    expect(getByTestId('personal-best-badge').textContent).toContain('New Personal Best');
  });

  it('does not show personal best badge when isPersonalBest is false', () => {
    const session = makeSession(1, [makeRound(1, 50)]);
    const { queryByTestId } = render(
      <I18nextProvider i18n={i18n}>
        <CompetitionSummary session={session} isPersonalBest={false} language="en" onDismiss={() => {}} />
      </I18nextProvider>,
    );
    expect(queryByTestId('personal-best-badge')).toBeNull();
  });

  it('renders per-round score breakdown', () => {
    const session = makeSession(1, [makeRound(1, 80), makeRound(2, 60), makeRound(3, 40)]);
    const { getAllByTestId } = render(
      <I18nextProvider i18n={i18n}>
        <CompetitionSummary session={session} isPersonalBest={false} language="en" onDismiss={() => {}} />
      </I18nextProvider>,
    );
    const items = getAllByTestId('round-score-item');
    expect(items.length).toBe(3);
    expect(items[0].textContent).toContain('80');
    expect(items[1].textContent).toContain('60');
    expect(items[2].textContent).toContain('40');
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    const onDismiss = vi.fn();
    const session = makeSession(1, [makeRound(1, 50)]);
    const { getByTestId } = render(
      <I18nextProvider i18n={i18n}>
        <CompetitionSummary session={session} isPersonalBest={false} language="en" onDismiss={onDismiss} />
      </I18nextProvider>,
    );
    fireEvent.click(getByTestId('dismiss-button'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders with Chinese language', () => {
    i18n.changeLanguage('zh');
    const session = makeSession(1, [makeRound(1, 50)]);
    const { getByTestId } = render(
      <I18nextProvider i18n={i18n}>
        <CompetitionSummary session={session} isPersonalBest={true} language="zh" onDismiss={() => {}} />
      </I18nextProvider>,
    );
    expect(getByTestId('personal-best-badge').textContent).toContain('新個人最佳');
  });
});
