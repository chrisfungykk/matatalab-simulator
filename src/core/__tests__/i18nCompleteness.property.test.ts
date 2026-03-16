// Feature: canvas-grid-competition-mode, Property 26: Bilingual i18n completeness
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import en from '../../i18n/en.json';
import zh from '../../i18n/zh.json';

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Recursively flatten a nested object into dot-separated keys.
 * e.g. { a: { b: "x" } } → { "a.b": "x" }
 */
function flattenKeys(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenKeys(value as Record<string, unknown>, fullKey));
    } else if (typeof value === 'string') {
      result[fullKey] = value;
    }
  }
  return result;
}

const flatEn = flattenKeys(en);
const flatZh = flattenKeys(zh);

// Collect all keys from both files that belong to the new feature namespaces
const NEW_NAMESPACES = ['competition.', 'maze.', 'challengeSet.', 'scoring.', 'renderer.'];

const allNewKeys = Array.from(
  new Set([
    ...Object.keys(flatEn).filter((k) => NEW_NAMESPACES.some((ns) => k.startsWith(ns))),
    ...Object.keys(flatZh).filter((k) => NEW_NAMESPACES.some((ns) => k.startsWith(ns))),
  ])
).sort();

// ── Property 26 ─────────────────────────────────────────────────────

describe('Feature: canvas-grid-competition-mode, Property 26: Bilingual i18n completeness', () => {
  it('should have new feature keys present in both language files', () => {
    // Sanity: we actually have keys to test
    expect(allNewKeys.length).toBeGreaterThan(0);
  });

  /**
   * Validates: Requirements 13.1, 13.2, 13.3, 13.5
   *
   * For any i18n key added for competition mode, maze generation,
   * challenge set titles/descriptions, and scoring terms, both the zh
   * and en translation files shall contain a non-empty string value.
   */
  it('every new feature key exists with a non-empty value in both en and zh', () => {
    fc.assert(
      fc.property(fc.constantFrom(...allNewKeys), (key: string) => {
        // English must have a non-empty string
        expect(flatEn[key]).toBeDefined();
        expect(typeof flatEn[key]).toBe('string');
        expect(flatEn[key].length).toBeGreaterThan(0);

        // Chinese must have a non-empty string
        expect(flatZh[key]).toBeDefined();
        expect(typeof flatZh[key]).toBe('string');
        expect(flatZh[key].length).toBeGreaterThan(0);
      }),
      { numRuns: allNewKeys.length * 3 }
    );
  });
});
