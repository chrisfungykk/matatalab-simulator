// Feature: matatalab-simulator, Property 23: i18n completeness
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import zh from '../../i18n/zh.json';
import en from '../../i18n/en.json';

// ── Helpers ─────────────────────────────────────────────────────────

type NestedRecord = { [key: string]: string | NestedRecord };

/** Recursively collect all dot-separated keys from a nested JSON object */
function collectKeys(obj: NestedRecord, prefix = ''): string[] {
  const keys: string[] = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (typeof value === 'object' && value !== null) {
      keys.push(...collectKeys(value as NestedRecord, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

/** Resolve a dot-separated key against a nested object */
function resolve(obj: NestedRecord, key: string): unknown {
  const parts = key.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

// ── Collect all keys from both translation files ────────────────────

const zhKeys = collectKeys(zh as NestedRecord);
const enKeys = collectKeys(en as NestedRecord);
const allKeys = [...new Set([...zhKeys, ...enKeys])];

// ── Property 23: i18n completeness ──────────────────────────────────
// Feature: matatalab-simulator, Property 23
describe('Property 23: i18n completeness', () => {
  // **Validates: Requirements 11.3, 11.4**

  it('every i18n key exists in both zh and en with a non-empty string value', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...allKeys),
        (key) => {
          const zhValue = resolve(zh as NestedRecord, key);
          const enValue = resolve(en as NestedRecord, key);

          // Both must exist
          expect(zhValue).toBeDefined();
          expect(enValue).toBeDefined();

          // Both must be non-empty strings
          expect(typeof zhValue).toBe('string');
          expect(typeof enValue).toBe('string');
          expect((zhValue as string).length).toBeGreaterThan(0);
          expect((enValue as string).length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('zh and en have the same set of keys', () => {
    const zhKeySet = new Set(zhKeys);
    const enKeySet = new Set(enKeys);

    // Every zh key must be in en
    for (const key of zhKeys) {
      expect(enKeySet.has(key), `key "${key}" missing from en.json`).toBe(true);
    }

    // Every en key must be in zh
    for (const key of enKeys) {
      expect(zhKeySet.has(key), `key "${key}" missing from zh.json`).toBe(true);
    }
  });
});
