import { describe, it, expect } from 'vitest';
import { simulatorReducer, createInitialState } from '../simulatorReducer';
import type {
  CompetitionChallengeSet,
  ChallengeConfig,
  RoundScore,
} from '../types';
import { DEFAULT_BLOCK_INVENTORY } from '../types';

// ── Test Fixtures ───────────────────────────────────────────────────

function makeChallenge(id: string, difficulty: 'easy' | 'medium' | 'hard', gridSize: number): ChallengeConfig {
  return {
    id,
    title: { zh: `挑戰 ${id}`, en: `Challenge ${id}` },
    difficulty,
    grid: { width: gridSize, height: gridSize },
    start: { row: 0, col: 0, direction: 'east' },
    goals: [{ row: gridSize - 1, col: gridSize - 1 }],
    obstacles: [],
    collectibles: gridSize > 4 ? [{ row: 1, col: 1 }] : [],
    blockInventory: { forward: 6, turn_left: 4, turn_right: 4 },
  };
}

function makeChallengeSet(challenges: ChallengeConfig[]): CompetitionChallengeSet {
  return {
    id: 'test-set',
    title: { zh: '測試集', en: 'Test Set' },
    description: { zh: '測試描述', en: 'Test Description' },
    skillFocus: 'combined',
    tier: 'beginner',
    challenges: challenges.map(c => ({
      type: 'predefined' as const,
      challengeConfig: c,
    })),
    recommendedTimePerChallenge: 180,
  };
}

function makeScore(total: number, goalReached = true): RoundScore {
  return {
    goalReached,
    basePoints: goalReached ? 100 : 0,
    collectibleBonus: 0,
    efficiencyBonus: Math.min(50, total - (goalReached ? 100 : 0)),
    speedBonus: 0,
    total,
  };
}

// ── ACTIVATE_COMPETITION ────────────────────────────────────────────

describe('ACTIVATE_COMPETITION', () => {
  it('initializes competition state from a challenge set', () => {
    const challenges = [makeChallenge('c1', 'easy', 4), makeChallenge('c2', 'medium', 5)];
    const set = makeChallengeSet(challenges);
    const state = simulatorReducer(createInitialState(), { type: 'ACTIVATE_COMPETITION', challengeSet: set });

    expect(state.competition.active).toBe(true);
    expect(state.competition.currentRoundIndex).toBe(0);
    expect(state.competition.challengeSet).toEqual(set);
    expect(state.competition.timeLimit).toBe(180);
    expect(state.competition.currentSession).not.toBeNull();
    expect(state.competition.currentSession!.rounds.length).toBe(2);
    expect(state.competition.currentSession!.challengeSetId).toBe('test-set');
    expect(state.competition.currentSession!.tier).toBe('beginner');
  });

  it('creates rounds with correct initial values', () => {
    const set = makeChallengeSet([makeChallenge('c1', 'easy', 4)]);
    const state = simulatorReducer(createInitialState(), { type: 'ACTIVATE_COMPETITION', challengeSet: set });
    const round = state.competition.currentSession!.rounds[0];

    expect(round.roundNumber).toBe(1);
    expect(round.challengeId).toBe('c1');
    expect(round.isRandom).toBe(false);
    expect(round.completed).toBe(false);
    expect(round.score.total).toBe(0);
    expect(round.timeUsed).toBe(0);
  });

  it('uses recommendedTimePerChallenge as timeLimit', () => {
    const set = makeChallengeSet([makeChallenge('c1', 'easy', 4)]);
    set.recommendedTimePerChallenge = 120;
    const state = simulatorReducer(createInitialState(), { type: 'ACTIVATE_COMPETITION', challengeSet: set });

    expect(state.competition.timeLimit).toBe(120);
  });

  it('marks random entries correctly', () => {
    const set: CompetitionChallengeSet = {
      id: 'mixed',
      title: { zh: '混合', en: 'Mixed' },
      description: { zh: '描述', en: 'Desc' },
      skillFocus: 'navigation',
      tier: 'intermediate',
      challenges: [
        { type: 'predefined', challengeConfig: makeChallenge('c1', 'easy', 4) },
        { type: 'random', mazeParams: { width: 5, height: 5, difficulty: 'medium', collectibles: 1, seed: 42 } },
      ],
      recommendedTimePerChallenge: 180,
    };
    const state = simulatorReducer(createInitialState(), { type: 'ACTIVATE_COMPETITION', challengeSet: set });
    const rounds = state.competition.currentSession!.rounds;

    expect(rounds[0].isRandom).toBe(false);
    expect(rounds[1].isRandom).toBe(true);
    expect(rounds[1].challengeId).toBe('random-2');
  });
});

// ── DEACTIVATE_COMPETITION ──────────────────────────────────────────

describe('DEACTIVATE_COMPETITION', () => {
  it('resets competition state to inactive', () => {
    const set = makeChallengeSet([makeChallenge('c1', 'easy', 4)]);
    let state = simulatorReducer(createInitialState(), { type: 'ACTIVATE_COMPETITION', challengeSet: set });
    expect(state.competition.active).toBe(true);

    state = simulatorReducer(state, { type: 'DEACTIVATE_COMPETITION' });
    expect(state.competition.active).toBe(false);
    expect(state.competition.currentSession).toBeNull();
    expect(state.competition.challengeSet).toBeNull();
    expect(state.competition.currentRoundIndex).toBe(0);
    expect(state.competition.timeLimit).toBe(180);
  });
});

// ── START_ROUND ─────────────────────────────────────────────────────

describe('START_ROUND', () => {
  it('loads the current round challenge into the grid', () => {
    const challenge = makeChallenge('c1', 'easy', 5);
    const set = makeChallengeSet([challenge]);
    let state = simulatorReducer(createInitialState(), { type: 'ACTIVATE_COMPETITION', challengeSet: set });
    state = simulatorReducer(state, { type: 'START_ROUND' });

    expect(state.grid.width).toBe(5);
    expect(state.grid.height).toBe(5);
    expect(state.botPosition).toEqual({ row: 0, col: 0 });
    expect(state.botDirection).toBe('east');
    expect(state.currentChallenge).toEqual(challenge);
    expect(state.controlBoard.lines).toEqual([]);
    expect(state.collectedItems).toEqual([]);
  });

  it('sets up timer with competition time limit', () => {
    const set = makeChallengeSet([makeChallenge('c1', 'easy', 4)]);
    let state = simulatorReducer(createInitialState(), { type: 'ACTIVATE_COMPETITION', challengeSet: set });
    state = simulatorReducer(state, { type: 'START_ROUND' });

    expect(state.timer.enabled).toBe(true);
    expect(state.timer.duration).toBe(180);
    expect(state.timer.remaining).toBe(180);
  });

  it('merges block inventory with defaults', () => {
    const challenge = makeChallenge('c1', 'easy', 4);
    challenge.blockInventory = { forward: 2, turn_left: 1 };
    const set = makeChallengeSet([challenge]);
    let state = simulatorReducer(createInitialState(), { type: 'ACTIVATE_COMPETITION', challengeSet: set });
    state = simulatorReducer(state, { type: 'START_ROUND' });

    expect(state.blockInventory.forward).toBe(2);
    expect(state.blockInventory.turn_left).toBe(1);
    expect(state.blockInventory.turn_right).toBe(DEFAULT_BLOCK_INVENTORY.turn_right);
    expect(state.blockInventory.backward).toBe(DEFAULT_BLOCK_INVENTORY.backward);
  });

  it('returns state unchanged when competition is not active', () => {
    const state = createInitialState();
    const newState = simulatorReducer(state, { type: 'START_ROUND' });
    expect(newState).toBe(state);
  });

  it('returns state unchanged when round index is out of bounds', () => {
    const set = makeChallengeSet([makeChallenge('c1', 'easy', 4)]);
    let state = simulatorReducer(createInitialState(), { type: 'ACTIVATE_COMPETITION', challengeSet: set });
    // Advance past the only round
    state = { ...state, competition: { ...state.competition, currentRoundIndex: 5 } };
    const newState = simulatorReducer(state, { type: 'START_ROUND' });
    expect(newState).toBe(state);
  });
});

// ── COMPLETE_ROUND ──────────────────────────────────────────────────

describe('COMPLETE_ROUND', () => {
  it('records score and marks round complete', () => {
    const set = makeChallengeSet([makeChallenge('c1', 'easy', 4)]);
    let state = simulatorReducer(createInitialState(), { type: 'ACTIVATE_COMPETITION', challengeSet: set });
    state = simulatorReducer(state, { type: 'START_ROUND' });

    const score = makeScore(150);
    state = simulatorReducer(state, { type: 'COMPLETE_ROUND', score });

    const round = state.competition.currentSession!.rounds[0];
    expect(round.completed).toBe(true);
    expect(round.score).toEqual(score);
    expect(state.competition.currentSession!.totalScore).toBe(150);
  });

  it('records time used based on timer remaining', () => {
    const set = makeChallengeSet([makeChallenge('c1', 'easy', 4)]);
    let state = simulatorReducer(createInitialState(), { type: 'ACTIVATE_COMPETITION', challengeSet: set });
    state = simulatorReducer(state, { type: 'START_ROUND' });

    // Simulate some timer ticks (start timer first)
    state = simulatorReducer(state, { type: 'TIMER_START', duration: 180 });
    for (let i = 0; i < 30; i++) {
      state = simulatorReducer(state, { type: 'TIMER_TICK' });
    }

    state = simulatorReducer(state, { type: 'COMPLETE_ROUND', score: makeScore(100) });
    const round = state.competition.currentSession!.rounds[0];
    expect(round.timeUsed).toBe(30); // 180 - 150 = 30
  });

  it('returns state unchanged when competition is not active', () => {
    const state = createInitialState();
    const newState = simulatorReducer(state, { type: 'COMPLETE_ROUND', score: makeScore(100) });
    expect(newState).toBe(state);
  });

  it('accumulates total score across multiple rounds', () => {
    const set = makeChallengeSet([
      makeChallenge('c1', 'easy', 4),
      makeChallenge('c2', 'easy', 4),
    ]);
    let state = simulatorReducer(createInitialState(), { type: 'ACTIVATE_COMPETITION', challengeSet: set });

    // Round 1
    state = simulatorReducer(state, { type: 'START_ROUND' });
    state = simulatorReducer(state, { type: 'COMPLETE_ROUND', score: makeScore(100) });
    state = simulatorReducer(state, { type: 'NEXT_ROUND' });

    // Round 2
    state = simulatorReducer(state, { type: 'START_ROUND' });
    state = simulatorReducer(state, { type: 'COMPLETE_ROUND', score: makeScore(200) });

    expect(state.competition.currentSession!.totalScore).toBe(300);
  });
});

// ── NEXT_ROUND ──────────────────────────────────────────────────────

describe('NEXT_ROUND', () => {
  it('advances round index', () => {
    const set = makeChallengeSet([
      makeChallenge('c1', 'easy', 4),
      makeChallenge('c2', 'medium', 5),
    ]);
    let state = simulatorReducer(createInitialState(), { type: 'ACTIVATE_COMPETITION', challengeSet: set });
    expect(state.competition.currentRoundIndex).toBe(0);

    state = simulatorReducer(state, { type: 'NEXT_ROUND' });
    expect(state.competition.currentRoundIndex).toBe(1);
  });

  it('returns state unchanged when competition is not active', () => {
    const state = createInitialState();
    const newState = simulatorReducer(state, { type: 'NEXT_ROUND' });
    expect(newState).toBe(state);
  });
});

// ── Timer Integration ───────────────────────────────────────────────

describe('Competition timer integration', () => {
  it('default time limit is 180 seconds', () => {
    const state = createInitialState();
    expect(state.competition.timeLimit).toBe(180);
  });

  it('timer is set up when starting a round', () => {
    const set = makeChallengeSet([makeChallenge('c1', 'easy', 4)]);
    let state = simulatorReducer(createInitialState(), { type: 'ACTIVATE_COMPETITION', challengeSet: set });
    state = simulatorReducer(state, { type: 'START_ROUND' });

    expect(state.timer.enabled).toBe(true);
    expect(state.timer.duration).toBe(180);
    expect(state.timer.remaining).toBe(180);
  });

  it('TIMER_EXPIRED stops execution', () => {
    const set = makeChallengeSet([makeChallenge('c1', 'easy', 4)]);
    let state = simulatorReducer(createInitialState(), { type: 'ACTIVATE_COMPETITION', challengeSet: set });
    state = simulatorReducer(state, { type: 'START_ROUND' });
    state = simulatorReducer(state, { type: 'TIMER_EXPIRED' });

    expect(state.execution.status).toBe('error');
    expect(state.timer.running).toBe(false);
  });
});

// ── SET_RENDERER ────────────────────────────────────────────────────

describe('SET_RENDERER', () => {
  it('switches renderer without altering other state', () => {
    const set = makeChallengeSet([makeChallenge('c1', 'easy', 5)]);
    let state = simulatorReducer(createInitialState(), { type: 'ACTIVATE_COMPETITION', challengeSet: set });
    state = simulatorReducer(state, { type: 'START_ROUND' });
    state = simulatorReducer(state, { type: 'SET_RENDERER', renderer: 'dom' });

    expect(state.renderer).toBe('dom');
    expect(state.grid.width).toBe(5);
    expect(state.botPosition).toEqual({ row: 0, col: 0 });
    expect(state.botDirection).toBe('east');
    expect(state.competition.active).toBe(true);
  });
});

// ── Full Session Lifecycle ──────────────────────────────────────────

describe('Full competition session lifecycle', () => {
  it('completes a 3-round session from activation to summary', () => {
    const challenges = [
      makeChallenge('c1', 'easy', 4),
      makeChallenge('c2', 'medium', 5),
      makeChallenge('c3', 'hard', 6),
    ];
    const set = makeChallengeSet(challenges);
    let state = simulatorReducer(createInitialState(), { type: 'ACTIVATE_COMPETITION', challengeSet: set });

    // Verify initial state
    expect(state.competition.active).toBe(true);
    expect(state.competition.currentSession!.rounds.length).toBe(3);

    // Round 1
    state = simulatorReducer(state, { type: 'START_ROUND' });
    expect(state.currentChallenge!.id).toBe('c1');
    state = simulatorReducer(state, { type: 'COMPLETE_ROUND', score: makeScore(150) });
    expect(state.competition.currentSession!.rounds[0].completed).toBe(true);
    state = simulatorReducer(state, { type: 'NEXT_ROUND' });
    expect(state.competition.currentRoundIndex).toBe(1);

    // Round 2
    state = simulatorReducer(state, { type: 'START_ROUND' });
    expect(state.currentChallenge!.id).toBe('c2');
    state = simulatorReducer(state, { type: 'COMPLETE_ROUND', score: makeScore(120) });
    state = simulatorReducer(state, { type: 'NEXT_ROUND' });

    // Round 3
    state = simulatorReducer(state, { type: 'START_ROUND' });
    expect(state.currentChallenge!.id).toBe('c3');
    state = simulatorReducer(state, { type: 'COMPLETE_ROUND', score: makeScore(200) });

    // Verify final state
    const session = state.competition.currentSession!;
    expect(session.totalScore).toBe(470);
    expect(session.rounds.every(r => r.completed)).toBe(true);
    expect(session.rounds[0].score.total).toBe(150);
    expect(session.rounds[1].score.total).toBe(120);
    expect(session.rounds[2].score.total).toBe(200);

    // Deactivate
    state = simulatorReducer(state, { type: 'DEACTIVATE_COMPETITION' });
    expect(state.competition.active).toBe(false);
    expect(state.competition.currentSession).toBeNull();
  });

  it('handles timer expiry mid-round', () => {
    const set = makeChallengeSet([makeChallenge('c1', 'easy', 4), makeChallenge('c2', 'easy', 4)]);
    let state = simulatorReducer(createInitialState(), { type: 'ACTIVATE_COMPETITION', challengeSet: set });
    state = simulatorReducer(state, { type: 'START_ROUND' });

    // Timer expires
    state = simulatorReducer(state, { type: 'TIMER_EXPIRED' });
    expect(state.execution.status).toBe('error');

    // Record partial score and advance
    const partialScore: RoundScore = {
      goalReached: false,
      basePoints: 0,
      collectibleBonus: 0,
      efficiencyBonus: 0,
      speedBonus: 0,
      total: 0,
    };
    state = simulatorReducer(state, { type: 'COMPLETE_ROUND', score: partialScore });
    expect(state.competition.currentSession!.rounds[0].completed).toBe(true);
    expect(state.competition.currentSession!.rounds[0].score.total).toBe(0);

    state = simulatorReducer(state, { type: 'NEXT_ROUND' });
    expect(state.competition.currentRoundIndex).toBe(1);
  });

  it('renderer switch during active competition preserves all state', () => {
    const set = makeChallengeSet([makeChallenge('c1', 'easy', 5)]);
    let state = simulatorReducer(createInitialState(), { type: 'ACTIVATE_COMPETITION', challengeSet: set });
    state = simulatorReducer(state, { type: 'START_ROUND' });

    const gridBefore = { ...state.grid };
    const botBefore = { ...state.botPosition };
    const dirBefore = state.botDirection;

    state = simulatorReducer(state, { type: 'SET_RENDERER', renderer: 'dom' });
    expect(state.renderer).toBe('dom');
    expect(state.grid).toEqual(gridBefore);
    expect(state.botPosition).toEqual(botBefore);
    expect(state.botDirection).toBe(dirBefore);
    expect(state.competition.active).toBe(true);

    state = simulatorReducer(state, { type: 'SET_RENDERER', renderer: 'canvas' });
    expect(state.renderer).toBe('canvas');
    expect(state.grid).toEqual(gridBefore);
  });
});
