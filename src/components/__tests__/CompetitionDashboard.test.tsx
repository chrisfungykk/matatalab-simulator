import { describe, it, expect, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import { CompetitionDashboard } from '../CompetitionDashboard/CompetitionDashboard';
import type { CompetitionSession, CompetitionRound, RoundScore } from '../../core/types';

function makeScore(total: number): RoundScore {
  return { goalReached: total > 0, basePoints: 100, collectibleBonus: 0, efficiencyBonus: 0, speedBonus: 0, total };
}

function makeRound(num: number, completed: boolean, total = 0): CompetitionRound {
  return { roundNumber: num, challengeId: `c-${num}`, isRandom: false, score: makeScore(total), completed, timeUsed: 60 };
}

function makeSession(rounds: CompetitionRound[]): CompetitionSession {
  return {
    id: 'test-session',
    date: '2025-01-01',
    challengeSetId: 'set-1',
    challengeSetName: { zh: '測試', en: 'Test Set' },
    tier: 'beginner',
    rounds,
    totalScore: rounds.reduce((s, r) => s + r.score.total, 0),
    starRating: 1,
  };
}

describe('CompetitionDashboard', () => {
  beforeEach(() => {
    cleanup();
    i18n.changeLanguage('en');
  });

  it('renders round info with correct current round and total', () => {
    const session = makeSession([makeRound(1, false), makeRound(2, false), makeRound(3, false)]);
    const { getByTestId } = render(
      <I18nextProvider i18n={i18n}>
        <CompetitionDashboard session={session} currentRoundIndex={1} timeRemaining={120} language="en" />
      </I18nextProvider>,
    );
    const roundInfo = getByTestId('round-info');
    expect(roundInfo.textContent).toContain('2');
    expect(roundInfo.textContent).toContain('3');
  });

  it('renders time remaining in MM:SS format', () => {
    const session = makeSession([makeRound(1, false)]);
    const { getByTestId } = render(
      <I18nextProvider i18n={i18n}>
        <CompetitionDashboard session={session} currentRoundIndex={0} timeRemaining={125} language="en" />
      </I18nextProvider>,
    );
    expect(getByTestId('time-remaining').textContent).toBe('02:05');
  });

  it('shows warning style when time is low (<=30s)', () => {
    const session = makeSession([makeRound(1, false)]);
    const { getByTestId } = render(
      <I18nextProvider i18n={i18n}>
        <CompetitionDashboard session={session} currentRoundIndex={0} timeRemaining={15} language="en" />
      </I18nextProvider>,
    );
    expect(getByTestId('time-remaining').className).toContain('timerWarning');
  });

  it('does not show warning style when time is above 30s', () => {
    const session = makeSession([makeRound(1, false)]);
    const { getByTestId } = render(
      <I18nextProvider i18n={i18n}>
        <CompetitionDashboard session={session} currentRoundIndex={0} timeRemaining={60} language="en" />
      </I18nextProvider>,
    );
    expect(getByTestId('time-remaining').className).not.toContain('timerWarning');
  });

  it('displays current accumulated score', () => {
    const session = makeSession([makeRound(1, true, 80), makeRound(2, true, 50), makeRound(3, false)]);
    const { getByTestId } = render(
      <I18nextProvider i18n={i18n}>
        <CompetitionDashboard session={session} currentRoundIndex={2} timeRemaining={180} language="en" />
      </I18nextProvider>,
    );
    expect(getByTestId('current-score').textContent).toContain('130');
  });

  it('renders a progress bar with correct aria attributes', () => {
    const session = makeSession([makeRound(1, true, 100), makeRound(2, false), makeRound(3, false)]);
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <CompetitionDashboard session={session} currentRoundIndex={1} timeRemaining={90} language="en" />
      </I18nextProvider>,
    );
    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toBeTruthy();
    // 1 of 3 completed = ~33.33%
    const value = Number(progressBar!.getAttribute('aria-valuenow'));
    expect(value).toBeCloseTo(33.33, 0);
  });

  it('renders with Chinese language', () => {
    i18n.changeLanguage('zh');
    const session = makeSession([makeRound(1, false)]);
    const { getByTestId } = render(
      <I18nextProvider i18n={i18n}>
        <CompetitionDashboard session={session} currentRoundIndex={0} timeRemaining={60} language="zh" />
      </I18nextProvider>,
    );
    // Should contain Chinese text for "Score"
    expect(getByTestId('current-score').textContent).toContain('得分');
  });
});
