import { describe, it, expect, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import { CompetitionHistory } from '../CompetitionHistory/CompetitionHistory';
import type { CompetitionSession, CompetitionRound, RoundScore } from '../../core/types';

function makeScore(total: number): RoundScore {
  return { goalReached: total > 0, basePoints: 100, collectibleBonus: 0, efficiencyBonus: 0, speedBonus: 0, total };
}

function makeRound(num: number, total: number): CompetitionRound {
  return { roundNumber: num, challengeId: `c-${num}`, isRandom: false, score: makeScore(total), completed: true, timeUsed: 60 };
}

function makeSession(id: string, opts: { date?: string; starRating?: 1 | 2 | 3; totalScore?: number } = {}): CompetitionSession {
  const rounds = [makeRound(1, opts.totalScore ?? 80)];
  return {
    id,
    date: opts.date ?? '2025-01-15',
    challengeSetId: 'set-1',
    challengeSetName: { zh: '基礎導航', en: 'Basic Navigation' },
    tier: 'beginner',
    rounds,
    totalScore: opts.totalScore ?? 80,
    starRating: opts.starRating ?? 2,
  };
}

describe('CompetitionHistory', () => {
  beforeEach(() => {
    cleanup();
    i18n.changeLanguage('en');
  });

  it('renders empty state when no sessions', () => {
    const { getByTestId, queryByTestId } = render(
      <I18nextProvider i18n={i18n}>
        <CompetitionHistory sessions={[]} language="en" />
      </I18nextProvider>,
    );
    expect(getByTestId('no-history')).toBeTruthy();
    expect(getByTestId('no-history').textContent).toContain('No competition history yet');
    expect(queryByTestId('history-list')).toBeNull();
  });

  it('renders a list of sessions with date, set name, score, and stars', () => {
    const sessions = [
      makeSession('s1', { date: '2025-01-10', totalScore: 120, starRating: 3 }),
      makeSession('s2', { date: '2025-01-12', totalScore: 60, starRating: 1 }),
    ];
    const { getAllByTestId } = render(
      <I18nextProvider i18n={i18n}>
        <CompetitionHistory sessions={sessions} language="en" />
      </I18nextProvider>,
    );
    const items = getAllByTestId('history-item');
    expect(items.length).toBe(2);

    // First session
    expect(items[0].textContent).toContain('2025-01-10');
    expect(items[0].textContent).toContain('Basic Navigation');
    expect(items[0].textContent).toContain('120');

    // Second session
    expect(items[1].textContent).toContain('2025-01-12');
    expect(items[1].textContent).toContain('60');
  });

  it('renders correct star ratings per session', () => {
    const sessions = [
      makeSession('s1', { starRating: 3 }),
      makeSession('s2', { starRating: 1 }),
    ];
    const { getAllByTestId } = render(
      <I18nextProvider i18n={i18n}>
        <CompetitionHistory sessions={sessions} language="en" />
      </I18nextProvider>,
    );
    const starContainers = getAllByTestId('history-stars');

    // 3-star session: all filled
    const stars3 = starContainers[0].querySelectorAll('span');
    expect(stars3.length).toBe(3);
    for (const star of stars3) {
      expect(star.className).not.toContain('starEmpty');
    }

    // 1-star session: first filled, rest empty
    const stars1 = starContainers[1].querySelectorAll('span');
    expect(stars1[0].className).not.toContain('starEmpty');
    expect(stars1[1].className).toContain('starEmpty');
    expect(stars1[2].className).toContain('starEmpty');
  });

  it('displays challenge set name in Chinese when language is zh', () => {
    i18n.changeLanguage('zh');
    const sessions = [makeSession('s1')];
    const { getByTestId } = render(
      <I18nextProvider i18n={i18n}>
        <CompetitionHistory sessions={sessions} language="zh" />
      </I18nextProvider>,
    );
    expect(getByTestId('history-set-name').textContent).toBe('基礎導航');
  });

  it('has proper ARIA attributes for accessibility', () => {
    const sessions = [makeSession('s1', { totalScore: 100 })];
    const { getByTestId, getAllByTestId } = render(
      <I18nextProvider i18n={i18n}>
        <CompetitionHistory sessions={sessions} language="en" />
      </I18nextProvider>,
    );
    const section = getByTestId('competition-history');
    expect(section.getAttribute('role')).toBe('region');
    expect(section.getAttribute('aria-label')).toBeTruthy();

    const items = getAllByTestId('history-item');
    expect(items[0].getAttribute('aria-label')).toContain('Basic Navigation');
    expect(items[0].getAttribute('aria-label')).toContain('100');

    const starSpan = getAllByTestId('history-stars')[0];
    expect(starSpan.getAttribute('aria-label')).toContain('Star Rating');
  });

  it('renders heading with translated text', () => {
    i18n.changeLanguage('zh');
    const { getByTestId } = render(
      <I18nextProvider i18n={i18n}>
        <CompetitionHistory sessions={[]} language="zh" />
      </I18nextProvider>,
    );
    const heading = getByTestId('competition-history').querySelector('h2');
    expect(heading?.textContent).toBe('過往練習');
  });
});
