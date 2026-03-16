import type {
  MazeGeneratorParams,
  MazeGeneratorResult,
  ChallengeConfig,
  Position,
  Direction,
  BlockType,
} from './types';
import { DEFAULT_BLOCK_INVENTORY } from './types';

// ── Seeded PRNG (mulberry32) ────────────────────────────────────────

/**
 * Creates a seeded pseudo-random number generator using the mulberry32 algorithm.
 * Returns a function that produces deterministic values in [0, 1) for a given seed.
 */
export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Difficulty density ranges ───────────────────────────────────────

const DENSITY_RANGES: Record<MazeGeneratorParams['difficulty'], { min: number; max: number }> = {
  easy: { min: 0, max: 0.15 },
  medium: { min: 0.15, max: 0.25 },
  hard: { min: 0.25, max: 0.35 },
};

// ── Helper utilities ────────────────────────────────────────────────

function posKey(p: Position): string {
  return `${p.row},${p.col}`;
}

function manhattanDistance(a: Position, b: Position): number {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

function getEdgeCells(width: number, height: number): Position[] {
  const cells: Position[] = [];
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (r === 0 || r === height - 1 || c === 0 || c === width - 1) {
        cells.push({ row: r, col: c });
      }
    }
  }
  return cells;
}

function getCornerCells(width: number, height: number): Position[] {
  return [
    { row: 0, col: 0 },
    { row: 0, col: width - 1 },
    { row: height - 1, col: 0 },
    { row: height - 1, col: width - 1 },
  ];
}

const DIRECTIONS: Direction[] = ['north', 'east', 'south', 'west'];

// ── BFS solvability validation ──────────────────────────────────────

/**
 * Checks if there is a valid path from start through all collectibles to the goal,
 * using BFS on the grid (avoiding obstacles).
 */
export function isSolvable(
  width: number,
  height: number,
  obstacles: Set<string>,
  start: Position,
  goals: Position[],
  collectibles: Position[],
): boolean {
  // BFS reachability from a given position
  function bfsReachable(from: Position): Set<string> {
    const visited = new Set<string>();
    const queue: Position[] = [from];
    visited.add(posKey(from));

    while (queue.length > 0) {
      const current = queue.shift()!;
      const neighbors: Position[] = [
        { row: current.row - 1, col: current.col },
        { row: current.row + 1, col: current.col },
        { row: current.row, col: current.col - 1 },
        { row: current.row, col: current.col + 1 },
      ];
      for (const n of neighbors) {
        if (n.row >= 0 && n.row < height && n.col >= 0 && n.col < width) {
          const key = posKey(n);
          if (!visited.has(key) && !obstacles.has(key)) {
            visited.add(key);
            queue.push(n);
          }
        }
      }
    }
    return visited;
  }

  const reachable = bfsReachable(start);

  // Check all collectibles are reachable from start
  for (const c of collectibles) {
    if (!reachable.has(posKey(c))) return false;
  }

  // Check at least one goal is reachable from start
  const goalReachable = goals.some(g => reachable.has(posKey(g)));
  if (!goalReachable) return false;

  return true;
}

// ── Main maze generator ─────────────────────────────────────────────

const MAX_RETRIES = 50;

/**
 * Generates a random maze conforming to ChallengeConfig.
 * Uses seeded PRNG for deterministic output.
 */
export function generateMaze(params: MazeGeneratorParams): MazeGeneratorResult {
  const { width, height, difficulty, collectibles: collectibleCount } = params;
  const seed = params.seed ?? (Date.now() ^ (Math.random() * 0xFFFFFFFF)) >>> 0;
  const rng = mulberry32(seed);

  // Helper: pick random element from array
  function pick<T>(arr: T[]): T {
    return arr[Math.floor(rng() * arr.length)];
  }

  // Helper: shuffle array in place (Fisher-Yates)
  function shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // 1. Place start at corner/edge
  const corners = getCornerCells(width, height);
  const edges = getEdgeCells(width, height);
  // Prefer corners (50% chance), otherwise random edge
  const start: Position = rng() < 0.5 ? pick(corners) : pick(edges);
  const startDirection: Direction = pick(DIRECTIONS);

  // 2. Place goal at ≥50% max Manhattan distance
  const maxManhattan = (width - 1) + (height - 1);
  const minGoalDistance = Math.ceil(maxManhattan * 0.5);

  const goalCandidates: Position[] = [];
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (r === start.row && c === start.col) continue;
      if (manhattanDistance(start, { row: r, col: c }) >= minGoalDistance) {
        goalCandidates.push({ row: r, col: c });
      }
    }
  }

  const goal: Position = pick(goalCandidates);
  const reserved = new Set<string>([posKey(start), posKey(goal)]);

  // 3. Place obstacles by density
  const totalCells = width * height;
  const densityRange = DENSITY_RANGES[difficulty];
  const density = densityRange.min + rng() * (densityRange.max - densityRange.min);
  const obstacleCount = Math.floor(density * totalCells);

  // Get all free cells (not start, not goal)
  function getFreeCells(currentObstacles: Set<string>): Position[] {
    const free: Position[] = [];
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const key = posKey({ row: r, col: c });
        if (!reserved.has(key) && !currentObstacles.has(key)) {
          free.push({ row: r, col: c });
        }
      }
    }
    return free;
  }

  let obstacles: Position[] = [];
  let obstacleSet = new Set<string>();
  let collectibles: Position[] = [];

  // Place initial obstacles
  const freeCellsForObstacles = shuffle(getFreeCells(new Set()));
  const initialObstacles = freeCellsForObstacles.slice(0, Math.min(obstacleCount, freeCellsForObstacles.length));
  obstacles = [...initialObstacles];
  obstacleSet = new Set(obstacles.map(posKey));

  // 4. Place collectibles on free cells
  function placeCollectibles(): Position[] {
    const freeCells = shuffle(getFreeCells(obstacleSet));
    return freeCells.slice(0, Math.min(collectibleCount, freeCells.length));
  }

  collectibles = placeCollectibles();

  // 5. BFS validate solvability with retry logic
  let iteration = 0;
  while (!isSolvable(width, height, obstacleSet, start, [goal], collectibles) && iteration < MAX_RETRIES) {
    // Remove a random obstacle to improve solvability
    if (obstacles.length > 0) {
      const removeIdx = Math.floor(rng() * obstacles.length);
      obstacles.splice(removeIdx, 1);
      obstacleSet = new Set(obstacles.map(posKey));
      // Re-place collectibles since free cells changed
      collectibles = placeCollectibles();
    }
    iteration++;
  }

  // 6. Build ChallengeConfig
  const config: ChallengeConfig = {
    id: `generated-${seed}`,
    title: {
      zh: `隨機迷宮 #${seed}`,
      en: `Random Maze #${seed}`,
    },
    difficulty,
    grid: { width, height },
    start: { row: start.row, col: start.col, direction: startDirection },
    goals: [goal],
    obstacles,
    collectibles,
    blockInventory: { ...DEFAULT_BLOCK_INVENTORY } as Partial<Record<BlockType, number>>,
    generationSeed: seed,
  };

  return { config, seed };
}
