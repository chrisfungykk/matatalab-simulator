import type { CompetitionSession, StoredCompetitionHistory } from './types';

const STORAGE_KEY = 'matatalab-competition-history';

// ── Storage abstraction for testability ─────────────────────────────

interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

let storage: StorageAdapter = typeof localStorage !== 'undefined'
  ? localStorage
  : { getItem: () => null, setItem: () => {}, removeItem: () => {} };

/** @internal Exposed for testing only */
export function _setStorageAdapter(adapter: StorageAdapter): void {
  storage = adapter;
}

/** @internal Reset to real localStorage */
export function _resetStorageAdapter(): void {
  storage = typeof localStorage !== 'undefined'
    ? localStorage
    : { getItem: () => null, setItem: () => {}, removeItem: () => {} };
}

// ── Schema Validation ───────────────────────────────────────────────

function isValidStoredHistory(data: unknown): data is StoredCompetitionHistory {
  if (data === null || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;

  if (obj.version !== 1) return false;
  if (!Array.isArray(obj.sessions)) return false;
  if (obj.personalBests === null || typeof obj.personalBests !== 'object' || Array.isArray(obj.personalBests)) return false;

  for (const value of Object.values(obj.personalBests as Record<string, unknown>)) {
    if (typeof value !== 'number') return false;
  }

  return true;
}

function createEmptyHistory(): StoredCompetitionHistory {
  return { version: 1, sessions: [], personalBests: {} };
}

// ── localStorage Availability ───────────────────────────────────────

export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__matatalab_storage_test__';
    storage.setItem(testKey, 'test');
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export function getStorageWarning(language: 'zh' | 'en'): string {
  if (language === 'zh') {
    return '無法使用本地儲存功能。您的競賽記錄將不會被保存。';
  }
  return 'Local storage is unavailable. Your competition records will not be saved.';
}

// ── Persistence Functions ───────────────────────────────────────────

export function loadHistory(): StoredCompetitionHistory | null {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!isValidStoredHistory(parsed)) {
      storage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    try {
      storage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore cleanup failure
    }
    return null;
  }
}

export function saveSession(session: CompetitionSession): boolean {
  try {
    const history = loadHistory() ?? createEmptyHistory();
    history.sessions.push(session);

    const currentBest = history.personalBests[session.challengeSetId];
    if (currentBest === undefined || session.totalScore > currentBest) {
      history.personalBests[session.challengeSetId] = session.totalScore;
    }

    storage.setItem(STORAGE_KEY, JSON.stringify(history));
    return true;
  } catch {
    return false;
  }
}

export function getPersonalBest(challengeSetId: string): number | undefined {
  try {
    const history = loadHistory();
    if (!history) return undefined;
    const best = history.personalBests[challengeSetId];
    return best !== undefined ? best : undefined;
  } catch {
    return undefined;
  }
}

export function updatePersonalBest(challengeSetId: string, score: number): boolean {
  try {
    const history = loadHistory() ?? createEmptyHistory();
    const currentBest = history.personalBests[challengeSetId];

    if (currentBest === undefined || score > currentBest) {
      history.personalBests[challengeSetId] = score;
      storage.setItem(STORAGE_KEY, JSON.stringify(history));
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
