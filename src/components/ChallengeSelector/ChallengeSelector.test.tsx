import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import { ChallengeSelector, ChallengeSelectorProps } from './ChallengeSelector';
import type { ChallengeConfig, CompetitionChallengeSet } from '../../core/types';

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

// ── Competition Challenge Sets ────────────────────────────────────

const mockCompetitionSet: CompetitionChallengeSet = {
  id: 'orientation-beginner',
  title: { zh: '方向感 — 初級', en: 'Orientation — Beginner' },
  description: {
    zh: '練習基本轉向和方向變換，適合初學者。',
    en: 'Practice basic turns and direction changes. Suitable for beginners.',
  },
  skillFocus: 'orientation',
  tier: 'beginner',
  challenges: [
    { type: 'predefined', challengeConfig: easyCh },
    { type: 'predefined', challengeConfig: mediumCh },
    { type: 'random', mazeParams: { width: 4, height: 4, difficulty: 'easy', collectibles: 0 } },
  ],
  recommendedTimePerChallenge: 120,
};

const mockAdvancedSet: CompetitionChallengeSet = {
  id: 'navigation-advanced',
  title: { zh: '導航 — 高級', en: 'Navigation — Advanced' },
  description: {
    zh: '高難度路線規劃。',
    en: 'Advanced path planning.',
  },
  skillFocus: 'navigation',
  tier: 'advanced',
  challenges: [
    { type: 'predefined', challengeConfig: hardCh },
    { type: 'random', mazeParams: { width: 8, height: 8, difficulty: 'hard', collectibles: 3 } },
  ],
  recommendedTimePerChallenge: 180,
};

describe('ChallengeSelector — Competition Sets', () => {
  beforeEach(() => {
    i18n.changeLanguage('zh');
  });

  afterEach(() => {
    cleanup();
  });

  it('renders competition set cards when competitionSets are provided', () => {
    renderSelector({
      competitionSets: [mockCompetitionSet],
      onSelectCompetitionSet: vi.fn(),
    });
    expect(screen.getByTestId('competition-sets-list')).toBeInTheDocument();
    expect(screen.getByTestId('competition-set-card')).toBeInTheDocument();
  });

  it('does not render competition sets list when competitionSets is empty', () => {
    renderSelector({
      competitionSets: [],
      onSelectCompetitionSet: vi.fn(),
    });
    expect(screen.queryByTestId('competition-sets-list')).not.toBeInTheDocument();
  });

  it('does not render competition sets when onSelectCompetitionSet is not provided', () => {
    renderSelector({
      competitionSets: [mockCompetitionSet],
    });
    expect(screen.queryByTestId('competition-sets-list')).not.toBeInTheDocument();
  });

  it('displays bilingual title in Chinese', () => {
    renderSelector({
      competitionSets: [mockCompetitionSet],
      onSelectCompetitionSet: vi.fn(),
    });
    expect(screen.getByText('方向感 — 初級')).toBeInTheDocument();
  });

  it('displays bilingual title in English', () => {
    i18n.changeLanguage('en');
    renderSelector({
      language: 'en',
      competitionSets: [mockCompetitionSet],
      onSelectCompetitionSet: vi.fn(),
    });
    expect(screen.getByText('Orientation — Beginner')).toBeInTheDocument();
  });

  it('displays bilingual description in Chinese', () => {
    renderSelector({
      competitionSets: [mockCompetitionSet],
      onSelectCompetitionSet: vi.fn(),
    });
    expect(screen.getByText('練習基本轉向和方向變換，適合初學者。')).toBeInTheDocument();
  });

  it('displays bilingual description in English', () => {
    i18n.changeLanguage('en');
    renderSelector({
      language: 'en',
      competitionSets: [mockCompetitionSet],
      onSelectCompetitionSet: vi.fn(),
    });
    expect(screen.getByText('Practice basic turns and direction changes. Suitable for beginners.')).toBeInTheDocument();
  });

  it('displays skill focus with i18n label', () => {
    renderSelector({
      competitionSets: [mockCompetitionSet],
      onSelectCompetitionSet: vi.fn(),
    });
    // "技能重點: 方向感" in Chinese
    expect(screen.getByText(/技能重點.*方向感/)).toBeInTheDocument();
  });

  it('displays challenge count', () => {
    renderSelector({
      competitionSets: [mockCompetitionSet],
      onSelectCompetitionSet: vi.fn(),
    });
    expect(screen.getByTestId('challenge-count')).toHaveTextContent('3');
  });

  it('displays recommended time per challenge', () => {
    renderSelector({
      competitionSets: [mockCompetitionSet],
      onSelectCompetitionSet: vi.fn(),
    });
    // 120 seconds = 2 minutes
    expect(screen.getByText(/2/)).toBeInTheDocument();
  });

  it('displays tier badge', () => {
    renderSelector({
      competitionSets: [mockCompetitionSet],
      onSelectCompetitionSet: vi.fn(),
    });
    expect(screen.getByTestId('tier-badge')).toHaveTextContent('初級');
  });

  it('displays tier badge in English', () => {
    i18n.changeLanguage('en');
    renderSelector({
      language: 'en',
      competitionSets: [mockAdvancedSet],
      onSelectCompetitionSet: vi.fn(),
    });
    expect(screen.getByTestId('tier-badge')).toHaveTextContent('Advanced');
  });

  it('calls onSelectCompetitionSet on click', () => {
    const onSelect = vi.fn();
    renderSelector({
      competitionSets: [mockCompetitionSet],
      onSelectCompetitionSet: onSelect,
    });
    fireEvent.click(screen.getByTestId('competition-set-card'));
    expect(onSelect).toHaveBeenCalledWith(mockCompetitionSet);
  });

  it('calls onSelectCompetitionSet on Enter key', () => {
    const onSelect = vi.fn();
    renderSelector({
      competitionSets: [mockCompetitionSet],
      onSelectCompetitionSet: onSelect,
    });
    fireEvent.keyDown(screen.getByTestId('competition-set-card'), { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith(mockCompetitionSet);
  });

  it('calls onSelectCompetitionSet on Space key', () => {
    const onSelect = vi.fn();
    renderSelector({
      competitionSets: [mockCompetitionSet],
      onSelectCompetitionSet: onSelect,
    });
    fireEvent.keyDown(screen.getByTestId('competition-set-card'), { key: ' ' });
    expect(onSelect).toHaveBeenCalledWith(mockCompetitionSet);
  });

  it('renders multiple competition sets', () => {
    renderSelector({
      competitionSets: [mockCompetitionSet, mockAdvancedSet],
      onSelectCompetitionSet: vi.fn(),
    });
    const cards = screen.getAllByTestId('competition-set-card');
    expect(cards).toHaveLength(2);
  });

  it('renders both competition sets and regular challenges together', () => {
    renderSelector({
      competitionSets: [mockCompetitionSet],
      onSelectCompetitionSet: vi.fn(),
    });
    // Competition set card
    expect(screen.getByTestId('competition-set-card')).toBeInTheDocument();
    // Regular challenge cards
    expect(screen.getAllByTestId('challenge-card')).toHaveLength(3);
  });

  it('competition set card has aria-label with title', () => {
    renderSelector({
      competitionSets: [mockCompetitionSet],
      onSelectCompetitionSet: vi.fn(),
    });
    expect(screen.getByRole('button', { name: '方向感 — 初級' })).toBeInTheDocument();
  });

  it('has data-testid on description element', () => {
    renderSelector({
      competitionSets: [mockCompetitionSet],
      onSelectCompetitionSet: vi.fn(),
    });
    expect(screen.getByTestId('set-description')).toBeInTheDocument();
  });
});

// ── Random Maze Dice Icon ─────────────────────────────────────────

describe('ChallengeSelector — Random Maze Indicator', () => {
  afterEach(() => {
    cleanup();
  });

  const randomChallenge: ChallengeConfig = {
    ...easyCh,
    id: 'random-1',
    title: { zh: '隨機迷宮', en: 'Random Maze' },
    generationSeed: 42,
  };

  it('shows dice icon on challenge cards with generationSeed', () => {
    renderSelector({ challenges: [randomChallenge] });
    const icon = screen.getByTestId('random-maze-icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveTextContent('🎲');
  });

  it('does not show dice icon on predefined challenges without generationSeed', () => {
    renderSelector({ challenges: [easyCh] });
    expect(screen.queryByTestId('random-maze-icon')).not.toBeInTheDocument();
  });

  it('shows dice icon only on random challenges in a mixed list', () => {
    renderSelector({ challenges: [easyCh, randomChallenge, mediumCh] });
    const icons = screen.getAllByTestId('random-maze-icon');
    expect(icons).toHaveLength(1);
  });

  it('dice icon has tooltip with i18n randomMaze label', () => {
    i18n.changeLanguage('zh');
    renderSelector({ challenges: [randomChallenge] });
    const icon = screen.getByTestId('random-maze-icon');
    expect(icon).toHaveAttribute('title', '隨機迷宮');
  });

  it('dice icon tooltip updates for English language', () => {
    i18n.changeLanguage('en');
    renderSelector({ challenges: [randomChallenge], language: 'en' });
    const icon = screen.getByTestId('random-maze-icon');
    expect(icon).toHaveAttribute('title', 'Random Maze');
  });
});
