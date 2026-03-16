import { describe, it, expect } from 'vitest';
import { generateMaze, mulberry32, isSolvable } from '../mazeGenerator';

// ── mulberry32 PRNG ─────────────────────────────────────────────────

describe('mulberry32', () => {
  it('produces deterministic sequence for same seed', () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it('produces values in [0, 1)', () => {
    const rng = mulberry32(12345);
    for (let i = 0; i < 1000; i++) {
      const val = rng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('produces different sequences for different seeds', () => {
    const rng1 = mulberry32(1);
    const rng2 = mulberry32(2);
    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());
    expect(seq1).not.toEqual(seq2);
  });
});

// ── isSolvable ──────────────────────────────────────────────────────

describe('isSolvable', () => {
  it('returns true for empty grid with adjacent start and goal', () => {
    expect(isSolvable(4, 4, new Set(), { row: 0, col: 0 }, [{ row: 0, col: 1 }], [])).toBe(true);
  });

  it('returns false when goal is completely walled off', () => {
    // Goal at (0,3) walled off by obstacles forming a complete barrier
    const obstacles = new Set(['0,2', '1,3']);
    // With these obstacles, (0,3) is unreachable from (0,0)
    expect(isSolvable(4, 4, obstacles, { row: 0, col: 0 }, [{ row: 0, col: 3 }], [])).toBe(false);
  });

  it('returns false when start is completely surrounded by obstacles', () => {
    // Start at (1,1), surrounded by obstacles
    const obstacles = new Set(['0,1', '1,0', '1,2', '2,1']);
    expect(isSolvable(4, 4, obstacles, { row: 1, col: 1 }, [{ row: 3, col: 3 }], [])).toBe(false);
  });

  it('returns false when a collectible is unreachable', () => {
    // Collectible at (0,3) walled off
    const obstacles = new Set(['0,2', '1,3']);
    expect(isSolvable(4, 4, obstacles, { row: 3, col: 0 }, [{ row: 3, col: 3 }], [{ row: 0, col: 3 }])).toBe(false);
  });

  it('returns true when all collectibles and goal are reachable', () => {
    expect(
      isSolvable(4, 4, new Set(), { row: 0, col: 0 }, [{ row: 3, col: 3 }], [{ row: 1, col: 1 }, { row: 2, col: 2 }]),
    ).toBe(true);
  });
});

// ── generateMaze ────────────────────────────────────────────────────

describe('generateMaze', () => {
  it('generates valid maze for minimum grid (4×4)', () => {
    const result = generateMaze({ width: 4, height: 4, difficulty: 'easy', collectibles: 0, seed: 1 });
    expect(result.config.grid.width).toBe(4);
    expect(result.config.grid.height).toBe(4);
    expect(result.config.goals.length).toBeGreaterThanOrEqual(1);
    expect(result.config.collectibles.length).toBe(0);
    expect(result.config.generationSeed).toBe(1);
  });

  it('generates valid maze for maximum grid (8×8)', () => {
    const result = generateMaze({ width: 8, height: 8, difficulty: 'hard', collectibles: 5, seed: 42 });
    expect(result.config.grid.width).toBe(8);
    expect(result.config.grid.height).toBe(8);
    expect(result.config.collectibles.length).toBeLessThanOrEqual(5);
    expect(result.config.generationSeed).toBe(42);
  });

  it('generates maze with zero collectibles', () => {
    const result = generateMaze({ width: 5, height: 5, difficulty: 'medium', collectibles: 0, seed: 100 });
    expect(result.config.collectibles.length).toBe(0);
  });

  it('generates maze with max collectibles (5)', () => {
    const result = generateMaze({ width: 6, height: 6, difficulty: 'easy', collectibles: 5, seed: 200 });
    expect(result.config.collectibles.length).toBeLessThanOrEqual(5);
  });

  it('start is always on edge or corner', () => {
    for (const seed of [1, 10, 100, 1000, 9999]) {
      const result = generateMaze({ width: 6, height: 6, difficulty: 'medium', collectibles: 2, seed });
      const { row, col } = result.config.start;
      const { width, height } = result.config.grid;
      const isEdge = row === 0 || row === height - 1 || col === 0 || col === width - 1;
      expect(isEdge).toBe(true);
    }
  });

  it('goal is at sufficient Manhattan distance from start', () => {
    for (const seed of [1, 50, 200, 500, 999]) {
      const result = generateMaze({ width: 5, height: 5, difficulty: 'easy', collectibles: 1, seed });
      const { start, goals, grid } = result.config;
      const maxManhattan = (grid.width - 1) + (grid.height - 1);
      const minDist = Math.ceil(maxManhattan * 0.5);
      for (const goal of goals) {
        const dist = Math.abs(goal.row - start.row) + Math.abs(goal.col - start.col);
        expect(dist).toBeGreaterThanOrEqual(minDist);
      }
    }
  });

  it('produces deterministic output for same seed', () => {
    const params = { width: 6, height: 6, difficulty: 'hard' as const, collectibles: 3, seed: 42 };
    const r1 = generateMaze(params);
    const r2 = generateMaze(params);
    expect(r1.config).toEqual(r2.config);
    expect(r1.seed).toBe(r2.seed);
  });

  it('produces different output for different seeds', () => {
    const base = { width: 6, height: 6, difficulty: 'medium' as const, collectibles: 2 };
    const r1 = generateMaze({ ...base, seed: 1 });
    const r2 = generateMaze({ ...base, seed: 2 });
    // At minimum, the configs should differ (extremely unlikely to be identical)
    const json1 = JSON.stringify(r1.config);
    const json2 = JSON.stringify(r2.config);
    expect(json1).not.toBe(json2);
  });

  it('all generated mazes are solvable', () => {
    for (const seed of [1, 42, 100, 255, 1000, 9999, 65535]) {
      const result = generateMaze({ width: 7, height: 7, difficulty: 'hard', collectibles: 4, seed });
      const obstacleSet = new Set(result.config.obstacles.map(o => `${o.row},${o.col}`));
      const solvable = isSolvable(
        result.config.grid.width,
        result.config.grid.height,
        obstacleSet,
        { row: result.config.start.row, col: result.config.start.col },
        result.config.goals,
        result.config.collectibles,
      );
      expect(solvable).toBe(true);
    }
  });

  it('includes generationSeed in config', () => {
    const result = generateMaze({ width: 4, height: 4, difficulty: 'easy', collectibles: 0, seed: 777 });
    expect(result.config.generationSeed).toBe(777);
    expect(result.seed).toBe(777);
  });

  it('auto-generates seed when not provided', () => {
    const result = generateMaze({ width: 4, height: 4, difficulty: 'easy', collectibles: 0 });
    expect(typeof result.seed).toBe('number');
    expect(result.config.generationSeed).toBe(result.seed);
  });

  it('has valid direction on start', () => {
    const result = generateMaze({ width: 5, height: 5, difficulty: 'medium', collectibles: 1, seed: 42 });
    expect(['north', 'east', 'south', 'west']).toContain(result.config.start.direction);
  });

  it('has valid blockInventory', () => {
    const result = generateMaze({ width: 5, height: 5, difficulty: 'easy', collectibles: 0, seed: 1 });
    expect(result.config.blockInventory).toBeDefined();
    expect(typeof result.config.blockInventory.forward).toBe('number');
  });
});
