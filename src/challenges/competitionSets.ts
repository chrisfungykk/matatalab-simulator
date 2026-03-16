import type {
  ChallengeConfig,
  CompetitionChallengeSet,
  CompetitionChallengeEntry,
  CompetitionTier,
  MazeGeneratorParams,
  BlockType,
} from '../core/types';
import { DEFAULT_BLOCK_INVENTORY } from '../core/types';

// ── Helper: physical Matatalab set block inventory ──────────────────

const physicalSetInventory: Record<BlockType, number> = { ...DEFAULT_BLOCK_INVENTORY };

// ── Predefined Challenges ───────────────────────────────────────────

// --- Orientation (方向感) ---

const orientationBeginnerChallenges: ChallengeConfig[] = [
  {
    id: 'orient-b-1',
    title: { zh: '右轉前進', en: 'Turn Right and Go' },
    difficulty: 'easy',
    grid: { width: 4, height: 4 },
    start: { row: 0, col: 0, direction: 'east' },
    goals: [{ row: 3, col: 0 }],
    obstacles: [],
    collectibles: [],
    blockInventory: physicalSetInventory,
  },
  {
    id: 'orient-b-2',
    title: { zh: '左轉迷宮', en: 'Left Turn Maze' },
    difficulty: 'easy',
    grid: { width: 4, height: 4 },
    start: { row: 0, col: 3, direction: 'south' },
    goals: [{ row: 3, col: 3 }],
    obstacles: [],
    collectibles: [],
    blockInventory: physicalSetInventory,
  },
  {
    id: 'orient-b-3',
    title: { zh: 'L形路線', en: 'L-Shaped Path' },
    difficulty: 'easy',
    grid: { width: 5, height: 5 },
    start: { row: 0, col: 0, direction: 'east' },
    goals: [{ row: 4, col: 4 }],
    obstacles: [{ row: 1, col: 1 }],
    collectibles: [],
    blockInventory: physicalSetInventory,
  },
];

const orientationIntermediateChallenges: ChallengeConfig[] = [
  {
    id: 'orient-i-1',
    title: { zh: 'Z字形路線', en: 'Zigzag Path' },
    difficulty: 'medium',
    grid: { width: 5, height: 5 },
    start: { row: 0, col: 0, direction: 'east' },
    goals: [{ row: 4, col: 4 }],
    obstacles: [{ row: 1, col: 2 }, { row: 3, col: 2 }],
    collectibles: [],
    blockInventory: physicalSetInventory,
  },
  {
    id: 'orient-i-2',
    title: { zh: '螺旋轉彎', en: 'Spiral Turns' },
    difficulty: 'medium',
    grid: { width: 6, height: 6 },
    start: { row: 0, col: 0, direction: 'east' },
    goals: [{ row: 2, col: 2 }],
    obstacles: [{ row: 1, col: 1 }, { row: 0, col: 2 }, { row: 2, col: 0 }],
    collectibles: [],
    blockInventory: physicalSetInventory,
  },
  {
    id: 'orient-i-3',
    title: { zh: '多次轉向', en: 'Multiple Direction Changes' },
    difficulty: 'medium',
    grid: { width: 6, height: 6 },
    start: { row: 0, col: 0, direction: 'south' },
    goals: [{ row: 5, col: 5 }],
    obstacles: [{ row: 2, col: 1 }, { row: 1, col: 3 }, { row: 4, col: 4 }],
    collectibles: [{ row: 3, col: 3 }],
    blockInventory: physicalSetInventory,
  },
];

const orientationAdvancedChallenges: ChallengeConfig[] = [
  {
    id: 'orient-a-1',
    title: { zh: '方向大挑戰', en: 'Direction Master' },
    difficulty: 'hard',
    grid: { width: 7, height: 7 },
    start: { row: 0, col: 0, direction: 'east' },
    goals: [{ row: 6, col: 6 }],
    obstacles: [
      { row: 1, col: 1 }, { row: 2, col: 3 }, { row: 3, col: 5 },
      { row: 4, col: 2 }, { row: 5, col: 4 },
    ],
    collectibles: [{ row: 1, col: 4 }, { row: 4, col: 1 }],
    blockInventory: physicalSetInventory,
  },
  {
    id: 'orient-a-2',
    title: { zh: '迷宮轉向王', en: 'Maze Turn King' },
    difficulty: 'hard',
    grid: { width: 8, height: 8 },
    start: { row: 0, col: 0, direction: 'south' },
    goals: [{ row: 7, col: 7 }],
    obstacles: [
      { row: 1, col: 2 }, { row: 2, col: 4 }, { row: 3, col: 1 },
      { row: 4, col: 6 }, { row: 5, col: 3 }, { row: 6, col: 5 },
    ],
    collectibles: [{ row: 2, col: 6 }, { row: 5, col: 1 }, { row: 6, col: 7 }],
    blockInventory: physicalSetInventory,
  },
];

// --- Navigation (導航) ---

const navigationBeginnerChallenges: ChallengeConfig[] = [
  {
    id: 'nav-b-1',
    title: { zh: '避開石頭', en: 'Avoid the Rock' },
    difficulty: 'easy',
    grid: { width: 4, height: 4 },
    start: { row: 0, col: 0, direction: 'east' },
    goals: [{ row: 0, col: 3 }],
    obstacles: [{ row: 0, col: 1 }],
    collectibles: [],
    blockInventory: physicalSetInventory,
  },
  {
    id: 'nav-b-2',
    title: { zh: '繞過障礙', en: 'Go Around' },
    difficulty: 'easy',
    grid: { width: 4, height: 4 },
    start: { row: 0, col: 0, direction: 'east' },
    goals: [{ row: 3, col: 3 }],
    obstacles: [{ row: 1, col: 1 }, { row: 2, col: 2 }],
    collectibles: [],
    blockInventory: physicalSetInventory,
  },
  {
    id: 'nav-b-3',
    title: { zh: '找到出路', en: 'Find the Way' },
    difficulty: 'easy',
    grid: { width: 5, height: 5 },
    start: { row: 0, col: 0, direction: 'south' },
    goals: [{ row: 4, col: 4 }],
    obstacles: [{ row: 1, col: 0 }],
    collectibles: [],
    blockInventory: physicalSetInventory,
  },
];

const navigationIntermediateChallenges: ChallengeConfig[] = [
  {
    id: 'nav-i-1',
    title: { zh: '障礙迷宮', en: 'Obstacle Maze' },
    difficulty: 'medium',
    grid: { width: 5, height: 5 },
    start: { row: 0, col: 0, direction: 'east' },
    goals: [{ row: 4, col: 4 }],
    obstacles: [{ row: 1, col: 1 }, { row: 2, col: 3 }, { row: 3, col: 1 }],
    collectibles: [{ row: 2, col: 0 }],
    blockInventory: physicalSetInventory,
  },
  {
    id: 'nav-i-2',
    title: { zh: '路線規劃', en: 'Path Planning' },
    difficulty: 'medium',
    grid: { width: 6, height: 6 },
    start: { row: 0, col: 0, direction: 'east' },
    goals: [{ row: 5, col: 5 }],
    obstacles: [{ row: 1, col: 2 }, { row: 3, col: 3 }, { row: 4, col: 1 }],
    collectibles: [{ row: 0, col: 4 }],
    blockInventory: physicalSetInventory,
  },
  {
    id: 'nav-i-3',
    title: { zh: '迂迴前進', en: 'Detour Route' },
    difficulty: 'medium',
    grid: { width: 6, height: 6 },
    start: { row: 0, col: 5, direction: 'south' },
    goals: [{ row: 5, col: 0 }],
    obstacles: [{ row: 1, col: 4 }, { row: 2, col: 2 }, { row: 3, col: 4 }, { row: 4, col: 1 }],
    collectibles: [{ row: 3, col: 0 }],
    blockInventory: physicalSetInventory,
  },
];

const navigationAdvancedChallenges: ChallengeConfig[] = [
  {
    id: 'nav-a-1',
    title: { zh: '複雜路線', en: 'Complex Route' },
    difficulty: 'hard',
    grid: { width: 7, height: 7 },
    start: { row: 0, col: 0, direction: 'east' },
    goals: [{ row: 6, col: 6 }],
    obstacles: [
      { row: 1, col: 1 }, { row: 1, col: 4 }, { row: 3, col: 2 },
      { row: 4, col: 5 }, { row: 5, col: 3 },
    ],
    collectibles: [{ row: 2, col: 5 }, { row: 5, col: 1 }],
    blockInventory: physicalSetInventory,
  },
  {
    id: 'nav-a-2',
    title: { zh: '導航大師', en: 'Navigation Master' },
    difficulty: 'hard',
    grid: { width: 8, height: 8 },
    start: { row: 0, col: 0, direction: 'east' },
    goals: [{ row: 7, col: 7 }],
    obstacles: [
      { row: 1, col: 2 }, { row: 2, col: 5 }, { row: 3, col: 3 },
      { row: 4, col: 1 }, { row: 5, col: 6 }, { row: 6, col: 4 },
    ],
    collectibles: [{ row: 0, col: 5 }, { row: 4, col: 7 }, { row: 7, col: 2 }],
    blockInventory: physicalSetInventory,
  },
];

// --- Collection (收集) ---

const collectionBeginnerChallenges: ChallengeConfig[] = [
  {
    id: 'collect-b-1',
    title: { zh: '收集星星', en: 'Collect the Star' },
    difficulty: 'easy',
    grid: { width: 4, height: 4 },
    start: { row: 0, col: 0, direction: 'east' },
    goals: [{ row: 3, col: 3 }],
    obstacles: [],
    collectibles: [{ row: 0, col: 2 }],
    blockInventory: physicalSetInventory,
  },
  {
    id: 'collect-b-2',
    title: { zh: '兩顆寶石', en: 'Two Gems' },
    difficulty: 'easy',
    grid: { width: 5, height: 5 },
    start: { row: 0, col: 0, direction: 'east' },
    goals: [{ row: 4, col: 4 }],
    obstacles: [{ row: 2, col: 2 }],
    collectibles: [{ row: 0, col: 3 }, { row: 3, col: 1 }],
    blockInventory: physicalSetInventory,
  },
  {
    id: 'collect-b-3',
    title: { zh: '寶物獵人', en: 'Treasure Hunter' },
    difficulty: 'easy',
    grid: { width: 5, height: 5 },
    start: { row: 0, col: 0, direction: 'south' },
    goals: [{ row: 4, col: 4 }],
    obstacles: [{ row: 1, col: 1 }],
    collectibles: [{ row: 2, col: 0 }, { row: 0, col: 4 }],
    blockInventory: physicalSetInventory,
  },
];

const collectionIntermediateChallenges: ChallengeConfig[] = [
  {
    id: 'collect-i-1',
    title: { zh: '收集三寶', en: 'Collect Three Treasures' },
    difficulty: 'medium',
    grid: { width: 5, height: 5 },
    start: { row: 0, col: 0, direction: 'east' },
    goals: [{ row: 4, col: 4 }],
    obstacles: [{ row: 1, col: 2 }, { row: 3, col: 1 }],
    collectibles: [{ row: 0, col: 4 }, { row: 2, col: 3 }, { row: 4, col: 1 }],
    blockInventory: physicalSetInventory,
  },
  {
    id: 'collect-i-2',
    title: { zh: '寶石迷宮', en: 'Gem Maze' },
    difficulty: 'medium',
    grid: { width: 6, height: 6 },
    start: { row: 0, col: 0, direction: 'east' },
    goals: [{ row: 5, col: 5 }],
    obstacles: [{ row: 1, col: 1 }, { row: 2, col: 4 }, { row: 4, col: 2 }],
    collectibles: [{ row: 0, col: 3 }, { row: 3, col: 5 }, { row: 5, col: 1 }],
    blockInventory: physicalSetInventory,
  },
  {
    id: 'collect-i-3',
    title: { zh: '收集挑戰', en: 'Collection Challenge' },
    difficulty: 'medium',
    grid: { width: 6, height: 6 },
    start: { row: 5, col: 0, direction: 'north' },
    goals: [{ row: 0, col: 5 }],
    obstacles: [{ row: 2, col: 2 }, { row: 3, col: 4 }, { row: 4, col: 1 }],
    collectibles: [{ row: 1, col: 3 }, { row: 4, col: 5 }],
    blockInventory: physicalSetInventory,
  },
];

const collectionAdvancedChallenges: ChallengeConfig[] = [
  {
    id: 'collect-a-1',
    title: { zh: '全面收集', en: 'Full Collection' },
    difficulty: 'hard',
    grid: { width: 7, height: 7 },
    start: { row: 0, col: 0, direction: 'east' },
    goals: [{ row: 6, col: 6 }],
    obstacles: [
      { row: 1, col: 2 }, { row: 2, col: 4 }, { row: 3, col: 1 },
      { row: 4, col: 5 }, { row: 5, col: 3 },
    ],
    collectibles: [{ row: 0, col: 4 }, { row: 3, col: 6 }, { row: 5, col: 1 }, { row: 6, col: 4 }],
    blockInventory: physicalSetInventory,
  },
  {
    id: 'collect-a-2',
    title: { zh: '收集大師', en: 'Collection Master' },
    difficulty: 'hard',
    grid: { width: 8, height: 8 },
    start: { row: 0, col: 0, direction: 'east' },
    goals: [{ row: 7, col: 7 }],
    obstacles: [
      { row: 1, col: 3 }, { row: 2, col: 6 }, { row: 3, col: 1 },
      { row: 5, col: 4 }, { row: 6, col: 2 }, { row: 6, col: 6 },
    ],
    collectibles: [
      { row: 0, col: 5 }, { row: 2, col: 2 }, { row: 4, col: 7 },
      { row: 7, col: 3 }, { row: 5, col: 0 },
    ],
    blockInventory: physicalSetInventory,
  },
];

// --- Combined (綜合) ---

const combinedBeginnerChallenges: ChallengeConfig[] = [
  {
    id: 'combined-b-1',
    title: { zh: '綜合入門', en: 'Combined Basics' },
    difficulty: 'easy',
    grid: { width: 4, height: 4 },
    start: { row: 0, col: 0, direction: 'east' },
    goals: [{ row: 3, col: 3 }],
    obstacles: [{ row: 1, col: 1 }],
    collectibles: [{ row: 0, col: 3 }],
    blockInventory: physicalSetInventory,
  },
  {
    id: 'combined-b-2',
    title: { zh: '簡單任務', en: 'Simple Mission' },
    difficulty: 'easy',
    grid: { width: 5, height: 5 },
    start: { row: 0, col: 0, direction: 'south' },
    goals: [{ row: 4, col: 4 }],
    obstacles: [{ row: 2, col: 1 }, { row: 1, col: 3 }],
    collectibles: [{ row: 3, col: 0 }],
    blockInventory: physicalSetInventory,
  },
];

const combinedIntermediateChallenges: ChallengeConfig[] = [
  {
    id: 'combined-i-1',
    title: { zh: '綜合挑戰', en: 'Combined Challenge' },
    difficulty: 'medium',
    grid: { width: 6, height: 6 },
    start: { row: 0, col: 0, direction: 'east' },
    goals: [{ row: 5, col: 5 }],
    obstacles: [{ row: 1, col: 2 }, { row: 3, col: 3 }, { row: 4, col: 1 }],
    collectibles: [{ row: 0, col: 4 }, { row: 2, col: 5 }, { row: 5, col: 2 }],
    blockInventory: physicalSetInventory,
  },
  {
    id: 'combined-i-2',
    title: { zh: '技能測試', en: 'Skill Test' },
    difficulty: 'medium',
    grid: { width: 6, height: 6 },
    start: { row: 5, col: 0, direction: 'east' },
    goals: [{ row: 0, col: 5 }],
    obstacles: [{ row: 2, col: 1 }, { row: 3, col: 3 }, { row: 1, col: 4 }, { row: 4, col: 2 }],
    collectibles: [{ row: 4, col: 5 }, { row: 1, col: 1 }],
    blockInventory: physicalSetInventory,
  },
];

const combinedAdvancedChallenges: ChallengeConfig[] = [
  {
    id: 'combined-a-1',
    title: { zh: '終極挑戰', en: 'Ultimate Challenge' },
    difficulty: 'hard',
    grid: { width: 8, height: 8 },
    start: { row: 0, col: 0, direction: 'east' },
    goals: [{ row: 7, col: 7 }],
    obstacles: [
      { row: 1, col: 2 }, { row: 2, col: 5 }, { row: 3, col: 3 },
      { row: 4, col: 1 }, { row: 5, col: 6 }, { row: 6, col: 4 },
    ],
    collectibles: [
      { row: 0, col: 4 }, { row: 3, col: 7 }, { row: 6, col: 2 },
      { row: 7, col: 5 },
    ],
    blockInventory: physicalSetInventory,
  },
  {
    id: 'combined-a-2',
    title: { zh: '大師級任務', en: 'Master Mission' },
    difficulty: 'hard',
    grid: { width: 8, height: 8 },
    start: { row: 7, col: 0, direction: 'north' },
    goals: [{ row: 0, col: 7 }],
    obstacles: [
      { row: 1, col: 1 }, { row: 2, col: 4 }, { row: 3, col: 6 },
      { row: 5, col: 2 }, { row: 5, col: 5 }, { row: 6, col: 3 },
    ],
    collectibles: [
      { row: 1, col: 5 }, { row: 3, col: 2 }, { row: 6, col: 7 },
      { row: 4, col: 0 }, { row: 7, col: 4 },
    ],
    blockInventory: physicalSetInventory,
  },
];

// ── Helper: wrap ChallengeConfig into a predefined entry ────────────

function predefined(config: ChallengeConfig): CompetitionChallengeEntry {
  return { type: 'predefined', challengeConfig: config };
}

// ── Tier → MazeGeneratorParams defaults ─────────────────────────────

function tierToMazeParams(
  tier: CompetitionTier,
  skillFocus: CompetitionChallengeSet['skillFocus'],
): MazeGeneratorParams {
  switch (tier) {
    case 'beginner':
      return {
        width: 4,
        height: 4,
        difficulty: 'easy',
        collectibles: skillFocus === 'collection' || skillFocus === 'combined' ? 1 : 0,
      };
    case 'intermediate':
      return {
        width: 6,
        height: 6,
        difficulty: 'medium',
        collectibles: skillFocus === 'collection' || skillFocus === 'combined' ? 2 : 1,
      };
    case 'advanced':
      return {
        width: 8,
        height: 8,
        difficulty: 'hard',
        collectibles: skillFocus === 'collection' || skillFocus === 'combined' ? 4 : 2,
      };
  }
}

// ── Mixed Challenge Set Builder (Req 11.1, 11.2) ───────────────────

export function buildMixedChallengeSet(options: {
  id: string;
  title: Record<'zh' | 'en', string>;
  description: Record<'zh' | 'en', string>;
  skillFocus: CompetitionChallengeSet['skillFocus'];
  tier: CompetitionTier;
  predefinedChallenges: ChallengeConfig[];
  randomRatio: number; // 0–1, proportion of random mazes
  totalChallenges: number;
  recommendedTimePerChallenge: number;
}): CompetitionChallengeSet {
  const {
    id,
    title,
    description,
    skillFocus,
    tier,
    predefinedChallenges,
    randomRatio,
    totalChallenges,
    recommendedTimePerChallenge,
  } = options;

  const clampedRatio = Math.max(0, Math.min(1, randomRatio));
  const randomCount = Math.round(totalChallenges * clampedRatio);
  const predefinedCount = totalChallenges - randomCount;

  const challenges: CompetitionChallengeEntry[] = [];

  // Add predefined challenges (cycle through available ones if needed)
  for (let i = 0; i < predefinedCount; i++) {
    const config = predefinedChallenges[i % predefinedChallenges.length];
    challenges.push(predefined(config));
  }

  // Add random maze entries
  const mazeParams = tierToMazeParams(tier, skillFocus);
  for (let i = 0; i < randomCount; i++) {
    challenges.push({
      type: 'random',
      mazeParams: { ...mazeParams },
    });
  }

  return {
    id,
    title,
    description,
    skillFocus,
    tier,
    challenges,
    recommendedTimePerChallenge,
  };
}

// ── Built-in Competition Challenge Sets ─────────────────────────────

// --- Orientation Sets ---

const orientationBeginner: CompetitionChallengeSet = {
  id: 'orientation-beginner',
  title: { zh: '方向感 — 初級', en: 'Orientation — Beginner' },
  description: {
    zh: '練習基本轉向和方向變換，適合初學者。',
    en: 'Practice basic turns and direction changes. Suitable for beginners.',
  },
  skillFocus: 'orientation',
  tier: 'beginner',
  challenges: orientationBeginnerChallenges.map(predefined),
  recommendedTimePerChallenge: 120,
};

const orientationIntermediate: CompetitionChallengeSet = {
  id: 'orientation-intermediate',
  title: { zh: '方向感 — 中級', en: 'Orientation — Intermediate' },
  description: {
    zh: '在障礙物之間練習多次轉向，需要更好的方向感。',
    en: 'Practice multiple turns among obstacles. Requires better sense of direction.',
  },
  skillFocus: 'orientation',
  tier: 'intermediate',
  challenges: orientationIntermediateChallenges.map(predefined),
  recommendedTimePerChallenge: 150,
};

const orientationAdvanced: CompetitionChallengeSet = {
  id: 'orientation-advanced',
  title: { zh: '方向感 — 高級', en: 'Orientation — Advanced' },
  description: {
    zh: '複雜的方向挑戰，需要精確的轉向規劃和收集物品。',
    en: 'Complex direction challenges requiring precise turn planning and item collection.',
  },
  skillFocus: 'orientation',
  tier: 'advanced',
  challenges: orientationAdvancedChallenges.map(predefined),
  recommendedTimePerChallenge: 180,
};

// --- Navigation Sets ---

const navigationBeginner: CompetitionChallengeSet = {
  id: 'navigation-beginner',
  title: { zh: '導航 — 初級', en: 'Navigation — Beginner' },
  description: {
    zh: '學習繞過簡單障礙物到達目標。',
    en: 'Learn to navigate around simple obstacles to reach the goal.',
  },
  skillFocus: 'navigation',
  tier: 'beginner',
  challenges: navigationBeginnerChallenges.map(predefined),
  recommendedTimePerChallenge: 120,
};

const navigationIntermediate: CompetitionChallengeSet = {
  id: 'navigation-intermediate',
  title: { zh: '導航 — 中級', en: 'Navigation — Intermediate' },
  description: {
    zh: '在多個障礙物中規劃路線，同時收集物品。',
    en: 'Plan routes through multiple obstacles while collecting items.',
  },
  skillFocus: 'navigation',
  tier: 'intermediate',
  challenges: navigationIntermediateChallenges.map(predefined),
  recommendedTimePerChallenge: 150,
};

const navigationAdvanced: CompetitionChallengeSet = {
  id: 'navigation-advanced',
  title: { zh: '導航 — 高級', en: 'Navigation — Advanced' },
  description: {
    zh: '高難度路線規劃，需要在密集障礙中找到最佳路徑。',
    en: 'Advanced path planning through dense obstacles to find optimal routes.',
  },
  skillFocus: 'navigation',
  tier: 'advanced',
  challenges: navigationAdvancedChallenges.map(predefined),
  recommendedTimePerChallenge: 180,
};

// --- Collection Sets ---

const collectionBeginner: CompetitionChallengeSet = {
  id: 'collection-beginner',
  title: { zh: '收集 — 初級', en: 'Collection — Beginner' },
  description: {
    zh: '練習在到達目標前收集物品。',
    en: 'Practice collecting items before reaching the goal.',
  },
  skillFocus: 'collection',
  tier: 'beginner',
  challenges: collectionBeginnerChallenges.map(predefined),
  recommendedTimePerChallenge: 120,
};

const collectionIntermediate: CompetitionChallengeSet = {
  id: 'collection-intermediate',
  title: { zh: '收集 — 中級', en: 'Collection — Intermediate' },
  description: {
    zh: '在障礙物之間收集多個物品，需要路線規劃。',
    en: 'Collect multiple items among obstacles. Requires route planning.',
  },
  skillFocus: 'collection',
  tier: 'intermediate',
  challenges: collectionIntermediateChallenges.map(predefined),
  recommendedTimePerChallenge: 150,
};

const collectionAdvanced: CompetitionChallengeSet = {
  id: 'collection-advanced',
  title: { zh: '收集 — 高級', en: 'Collection — Advanced' },
  description: {
    zh: '在複雜地圖中收集所有寶物，考驗全面的路線規劃能力。',
    en: 'Collect all treasures in complex maps. Tests comprehensive route planning.',
  },
  skillFocus: 'collection',
  tier: 'advanced',
  challenges: collectionAdvancedChallenges.map(predefined),
  recommendedTimePerChallenge: 180,
};

// --- Combined Sets ---

const combinedBeginner: CompetitionChallengeSet = {
  id: 'combined-beginner',
  title: { zh: '綜合 — 初級', en: 'Combined — Beginner' },
  description: {
    zh: '結合方向、導航和收集的基礎綜合練習。',
    en: 'Basic combined practice with orientation, navigation, and collection.',
  },
  skillFocus: 'combined',
  tier: 'beginner',
  challenges: combinedBeginnerChallenges.map(predefined),
  recommendedTimePerChallenge: 120,
};

const combinedIntermediate: CompetitionChallengeSet = {
  id: 'combined-intermediate',
  title: { zh: '綜合 — 中級', en: 'Combined — Intermediate' },
  description: {
    zh: '中等難度的綜合挑戰，模擬比賽環境。',
    en: 'Intermediate combined challenges simulating competition conditions.',
  },
  skillFocus: 'combined',
  tier: 'intermediate',
  challenges: combinedIntermediateChallenges.map(predefined),
  recommendedTimePerChallenge: 150,
};

const combinedAdvanced: CompetitionChallengeSet = {
  id: 'combined-advanced',
  title: { zh: '綜合 — 高級', en: 'Combined — Advanced' },
  description: {
    zh: '高難度綜合挑戰，全面考驗編程和路線規劃能力。',
    en: 'Advanced combined challenges testing all programming and planning skills.',
  },
  skillFocus: 'combined',
  tier: 'advanced',
  challenges: combinedAdvancedChallenges.map(predefined),
  recommendedTimePerChallenge: 180,
};

// --- Mixed Sets (predefined + random) ---

const mixedCompetitionPractice: CompetitionChallengeSet = buildMixedChallengeSet({
  id: 'mixed-competition-practice',
  title: { zh: '比賽模擬練習', en: 'Competition Practice Mix' },
  description: {
    zh: '混合預設和隨機關卡，模擬真實比賽體驗。',
    en: 'Mix of predefined and random challenges simulating real competition experience.',
  },
  skillFocus: 'combined',
  tier: 'intermediate',
  predefinedChallenges: [
    combinedIntermediateChallenges[0],
    navigationIntermediateChallenges[0],
    collectionIntermediateChallenges[0],
  ],
  randomRatio: 0.4,
  totalChallenges: 5,
  recommendedTimePerChallenge: 150,
});

const mixedAdvancedTournament: CompetitionChallengeSet = buildMixedChallengeSet({
  id: 'mixed-advanced-tournament',
  title: { zh: '高級錦標賽', en: 'Advanced Tournament' },
  description: {
    zh: '高難度混合挑戰，包含隨機迷宮，適合比賽前衝刺練習。',
    en: 'Advanced mixed challenges with random mazes for pre-competition sprint practice.',
  },
  skillFocus: 'combined',
  tier: 'advanced',
  predefinedChallenges: [
    combinedAdvancedChallenges[0],
    navigationAdvancedChallenges[1],
    collectionAdvancedChallenges[1],
  ],
  randomRatio: 0.5,
  totalChallenges: 6,
  recommendedTimePerChallenge: 180,
});

// ── Exports ─────────────────────────────────────────────────────────

export const competitionChallengeSets: CompetitionChallengeSet[] = [
  // Orientation
  orientationBeginner,
  orientationIntermediate,
  orientationAdvanced,
  // Navigation
  navigationBeginner,
  navigationIntermediate,
  navigationAdvanced,
  // Collection
  collectionBeginner,
  collectionIntermediate,
  collectionAdvanced,
  // Combined
  combinedBeginner,
  combinedIntermediate,
  combinedAdvanced,
  // Mixed
  mixedCompetitionPractice,
  mixedAdvancedTournament,
];
