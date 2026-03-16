import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { saveSession, loadHistory, getPersonalBest, updatePersonalBest, isLocalStorageAvailable, getStorageWarning, _setStorageAdapter, _resetStorageAdapter } from '../competitionPersistence';
import type { CompetitionSession } from '../types';
const KEY = 'matatalab-competition-history';
function makeSession(ov: Partial<CompetitionSession> = {}): CompetitionSession {
  return { id: 'session-1', date: '2024-01-15T10:00:00.000Z', challengeSetId: 'set-beginner', challengeSetName: { zh: '初級挑戰', en: 'Beginner Challenge' }, tier: 'beginner', rounds: [{ roundNumber: 1, challengeId: 'c-1', isRandom: false, score: { goalReached: true, basePoints: 100, collectibleBonus: 40, efficiencyBonus: 30, speedBonus: 20, total: 190 }, completed: true, timeUsed: 120 }], totalScore: 190, starRating: 2, ...ov };
}
function createStore() {
  const d: Record<string, string> = {};
  return { d, a: { getItem: (k: string) => d[k] ?? null, setItem: (k: string, v: string) => { d[k] = v; }, removeItem: (k: string) => { delete d[k]; } } };
}
describe('competitionPersistence', () => {
  let s: ReturnType<typeof createStore>;
  beforeEach(() => { s = createStore(); _setStorageAdapter(s.a); });
  afterEach(() => { _resetStorageAdapter(); });
  describe('loadHistory', () => {
    it('returns null when no data stored', () => { expect(loadHistory()).toBeNull(); });
    it('returns valid history', () => { s.d[KEY] = JSON.stringify({ version: 1, sessions: [], personalBests: {} }); expect(loadHistory()).toEqual({ version: 1, sessions: [], personalBests: {} }); });
    it('returns null and clears corrupted JSON', () => { s.d[KEY] = '{bad'; expect(loadHistory()).toBeNull(); expect(s.d[KEY]).toBeUndefined(); });
    it('returns null for wrong version', () => { s.d[KEY] = JSON.stringify({ version: 2, sessions: [], personalBests: {} }); expect(loadHistory()).toBeNull(); });
    it('returns null for missing sessions', () => { s.d[KEY] = JSON.stringify({ version: 1, personalBests: {} }); expect(loadHistory()).toBeNull(); });
    it('returns null for non-object personalBests', () => { s.d[KEY] = JSON.stringify({ version: 1, sessions: [], personalBests: 'bad' }); expect(loadHistory()).toBeNull(); });
    it('returns null for array personalBests', () => { s.d[KEY] = JSON.stringify({ version: 1, sessions: [], personalBests: [1] }); expect(loadHistory()).toBeNull(); });
    it('returns null for non-number personalBest values', () => { s.d[KEY] = JSON.stringify({ version: 1, sessions: [], personalBests: { x: 'y' } }); expect(loadHistory()).toBeNull(); });
    it('returns null for null stored value', () => { s.d[KEY] = 'null'; expect(loadHistory()).toBeNull(); });
    it('handles getItem throwing', () => { _setStorageAdapter({ getItem: () => { throw new Error('err'); }, setItem: () => {}, removeItem: () => {} }); expect(loadHistory()).toBeNull(); });
  });
  describe('saveSession', () => {
    it('saves to empty storage', () => { expect(saveSession(makeSession())).toBe(true); const h = loadHistory(); expect(h!.sessions).toHaveLength(1); });
    it('appends sessions', () => { saveSession(makeSession({ id: 's1' })); saveSession(makeSession({ id: 's2' })); expect(loadHistory()!.sessions).toHaveLength(2); });
    it('updates personal best when higher', () => { saveSession(makeSession({ challengeSetId: 'a', totalScore: 100 })); saveSession(makeSession({ challengeSetId: 'a', totalScore: 200 })); expect(loadHistory()!.personalBests['a']).toBe(200); });
    it('does not downgrade personal best', () => { saveSession(makeSession({ challengeSetId: 'a', totalScore: 200 })); saveSession(makeSession({ challengeSetId: 'a', totalScore: 100 })); expect(loadHistory()!.personalBests['a']).toBe(200); });
    it('returns false when setItem throws', () => { _setStorageAdapter({ getItem: s.a.getItem, removeItem: s.a.removeItem, setItem: () => { throw new DOMException('full'); } }); expect(saveSession(makeSession())).toBe(false); });
  });
  describe('getPersonalBest', () => {
    it('returns undefined when no history', () => { expect(getPersonalBest('a')).toBeUndefined(); });
    it('returns undefined for unknown set', () => { saveSession(makeSession({ challengeSetId: 'a', totalScore: 100 })); expect(getPersonalBest('b')).toBeUndefined(); });
    it('returns stored best', () => { saveSession(makeSession({ challengeSetId: 'a', totalScore: 250 })); expect(getPersonalBest('a')).toBe(250); });
    it('returns undefined when storage throws', () => { _setStorageAdapter({ getItem: () => { throw new Error('err'); }, setItem: () => {}, removeItem: () => {} }); expect(getPersonalBest('a')).toBeUndefined(); });
  });
  describe('updatePersonalBest', () => {
    it('sets when none exists', () => { expect(updatePersonalBest('a', 150)).toBe(true); expect(getPersonalBest('a')).toBe(150); });
    it('updates when higher', () => { updatePersonalBest('a', 100); expect(updatePersonalBest('a', 200)).toBe(true); expect(getPersonalBest('a')).toBe(200); });
    it('no update when equal', () => { updatePersonalBest('a', 100); expect(updatePersonalBest('a', 100)).toBe(false); expect(getPersonalBest('a')).toBe(100); });
    it('no update when lower', () => { updatePersonalBest('a', 200); expect(updatePersonalBest('a', 100)).toBe(false); expect(getPersonalBest('a')).toBe(200); });
    it('returns false when storage throws', () => { _setStorageAdapter({ getItem: s.a.getItem, removeItem: s.a.removeItem, setItem: () => { throw new Error('full'); } }); expect(updatePersonalBest('a', 100)).toBe(false); });
  });
  describe('isLocalStorageAvailable', () => {
    it('returns true when works', () => { expect(isLocalStorageAvailable()).toBe(true); });
    it('returns false when throws', () => { _setStorageAdapter({ getItem: () => null, removeItem: () => {}, setItem: () => { throw new Error('no'); } }); expect(isLocalStorageAvailable()).toBe(false); });
  });
  describe('getStorageWarning', () => {
    it('zh warning', () => { expect(getStorageWarning('zh')).toContain('無法使用本地儲存功能'); });
    it('en warning', () => { expect(getStorageWarning('en')).toContain('Local storage is unavailable'); });
  });
  describe('concurrent access', () => {
    it('handles external modification', () => {
      saveSession(makeSession({ id: 's1', challengeSetId: 'a', totalScore: 100 }));
      s.d[KEY] = JSON.stringify({ version: 1, sessions: [makeSession({ id: 'ext', challengeSetId: 'a', totalScore: 300 })], personalBests: { a: 300 } });
      saveSession(makeSession({ id: 's2', challengeSetId: 'a', totalScore: 150 }));
      const h = loadHistory();
      expect(h!.sessions).toHaveLength(2);
      expect(h!.personalBests['a']).toBe(300);
    });
  });
});
