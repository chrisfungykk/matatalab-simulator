import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { getTweenDuration } from '../CanvasGridMap/CanvasGridMap';
import { SPEED_DELAYS } from '../../core/types';
import type { SpeedSetting } from '../../core/types';

/**
 * Property 5: Bot movement tween duration matches speed setting
 *
 * For any speed setting (slow, normal, fast) and bot movement event,
 * the tween animation duration shall equal the corresponding
 * `SPEED_DELAYS` value for that speed setting.
 *
 * **Validates: Requirements 2.1**
 */
describe('Feature: canvas-grid-competition-mode, Property 5: Bot movement tween duration matches speed setting', () => {
  it('getTweenDuration returns the correct SPEED_DELAYS value for each speed setting', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<SpeedSetting>('slow', 'normal', 'fast'),
        (speed) => {
          const duration = getTweenDuration(speed);
          expect(duration).toBe(SPEED_DELAYS[speed]);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('tween duration is always a positive number', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<SpeedSetting>('slow', 'normal', 'fast'),
        (speed) => {
          const duration = getTweenDuration(speed);
          expect(duration).toBeGreaterThan(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('slow >= normal >= fast ordering is preserved', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<SpeedSetting>('slow', 'normal', 'fast'),
        () => {
          expect(getTweenDuration('slow')).toBeGreaterThanOrEqual(getTweenDuration('normal'));
          expect(getTweenDuration('normal')).toBeGreaterThanOrEqual(getTweenDuration('fast'));
        },
      ),
      { numRuns: 100 },
    );
  });
});
