import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import { ChallengeSelector, ChallengeSelectorProps } from './ChallengeSelector';
import type { ChallengeConfig } from '../../core/types';

const easyCh: ChallengeConfig = {
  id: 'easy-1',
  title: { zh: '簡單挑戰', en: 'Easy Challenge' },
  difficulty: 'easy',
  grid: { width: 4, height: 4 },
  start: { row: 0, col: 0, direction: 'east' },
  goals: [{ row: 3, col: 3 }],
  obstacles: [],
  collectibles: [],
  blockInventory: { forward: 4 },
};

const mediumCh: ChallengeConfig = {
  id: 'medium-1',
  title: { zh: '中等挑戰', en: 'Medium Challenge' },
  difficulty: 'medium',
  grid: { width: 6, height: 6 },
  start: { row: 0, col: 0, direction: 'east' },
  goals: [{ row: 5, col: 5 }],
  obstacles: [{ row: 2, col: 2 }],
  collectibles: [],
  blockInventory: { forward: 4, turn_right: 4 },
};

const hardCh: ChallengeConfig = {
  id: 'hard-1',
  title: { zh: '困難挑戰', en: 'Hard Challenge' },
  difficulty: 'hard',
  grid: { width: 8, height: 8 },
  start: { row: 0, col: 0, direction: 'east' },
  goals: [{ row: 7, col: 7 }],
  obstacles: [{ row: 1, col: 1 }],
  collectibles: [{ row: 3, col: 3 }],
  blockInventory: { forward: 4, turn_right: 4, loop_begin: 2, loop_end: 2 },
};

const challenges = [easyCh, mediumCh, hardCh];

function defaultProps(overrides: Partial<ChallengeSelectorProps> = {}): ChallengeSelectorProps {
  return {
    challenges,
    onSelectChallenge: vi.fn(),
    language: 'zh',
    ...overrides,
  };
}

function renderSelector(overrides: Partial<ChallengeSelectorProps> = {}) {
  const props = defaultProps(overrides);
  const result = render(
    <I18nextProvider i18n={i18n}>
      <ChallengeSelector {...props} />
    </I18nextProvider>,
  );
  return { ...result, props };
}

describe('ChallengeSelector', () => {
  beforeEach(() => {
    i18n.changeLanguage('zh');
  });

  afterEach(() => {
    cleanup();
  });

  it('renders a heading with the challenges label', () => {
    renderSelector();
    expect(screen.getByRole('heading', { level: 2, name: '挑戰' })).toBeInTheDocument();
  });

  it('renders a card for each challenge', () => {
    renderSelector();
    expect(screen.getByText('簡單挑戰')).toBeInTheDocument();
    expect(screen.getByText('中等挑戰')).toBeInTheDocument();
    expect(screen.getByText('困難挑戰')).toBeInTheDocument();
  });

  it('displays challenge titles in the active language (zh)', () => {
    renderSelector({ language: 'zh' });
    expect(screen.getByText('簡單挑戰')).toBeInTheDocument();
  });

  it('displays challenge titles in English when language is en', () => {
    i18n.changeLanguage('en');
    renderSelector({ language: 'en' });
    expect(screen.getByText('Easy Challenge')).toBeInTheDocument();
    expect(screen.getByText('Medium Challenge')).toBeInTheDocument();
    expect(screen.getByText('Hard Challenge')).toBeInTheDocument();
  });

  it('renders difficulty badges with translated labels', () => {
    renderSelector();
    expect(screen.getByText('簡單')).toBeInTheDocument();
    expect(screen.getByText('中等')).toBeInTheDocument();
    expect(screen.getByText('困難')).toBeInTheDocument();
  });

  it('calls onSelectChallenge with the correct config on click', () => {
    const { props } = renderSelector();
    fireEvent.click(screen.getByText('簡單挑戰'));
    expect(props.onSelectChallenge).toHaveBeenCalledWith(easyCh);
  });

  it('calls onSelectChallenge on Enter key press', () => {
    const { props } = renderSelector();
    const card = screen.getByText('中等挑戰').closest('[role="button"]')!;
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(props.onSelectChallenge).toHaveBeenCalledWith(mediumCh);
  });

  it('calls onSelectChallenge on Space key press', () => {
    const { props } = renderSelector();
    const card = screen.getByText('困難挑戰').closest('[role="button"]')!;
    fireEvent.keyDown(card, { key: ' ' });
    expect(props.onSelectChallenge).toHaveBeenCalledWith(hardCh);
  });

  it('renders an empty list when no challenges are provided', () => {
    renderSelector({ challenges: [] });
    const list = screen.getByRole('list');
    expect(list.children).toHaveLength(0);
  });

  // ── Accessibility ───────────────────────────────────────────────

  it('has a section with aria-label', () => {
    renderSelector();
    const section = screen.getByRole('region', { name: /挑戰/i });
    expect(section).toBeInTheDocument();
  });

  it('each card has role="button" and tabIndex=0', () => {
    renderSelector();
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(3);
    buttons.forEach((btn) => {
      expect(btn).toHaveAttribute('tabindex', '0');
    });
  });

  it('each card has an aria-label with title and difficulty', () => {
    renderSelector();
    const easyCard = screen.getByRole('button', { name: /簡單挑戰.*簡單/i });
    expect(easyCard).toBeInTheDocument();
  });
});
