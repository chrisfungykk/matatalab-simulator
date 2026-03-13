// Feature: uiux-matatalab-refresh, Property 6: Bot rotation matches direction
import { describe, it, expect } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import fc from 'fast-check';
import { BotSVG } from '../BotSVG/BotSVG';
import type { Direction } from '../../core/types';

const DIRECTION_DEGREES: Record<Direction, number> = {
  north: 0,
  east: 90,
  south: 180,
  west: 270,
};

describe('BotSVG - Property 6: Bot rotation matches direction', () => {
  // **Validates: Requirements 3.2**
  it('should apply rotate(Xdeg) matching north→0, east→90, south→180, west→270', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<Direction>('north', 'east', 'south', 'west'),
        (dir: Direction) => {
          cleanup();
          const { getByTestId } = render(
            <BotSVG direction={dir} isIdle={false} isError={false} />,
          );

          const botSvg = getByTestId('bot-svg');
          const style = botSvg.getAttribute('style') ?? '';
          const expectedDeg = DIRECTION_DEGREES[dir];

          expect(style).toContain(`rotate(${expectedDeg}deg)`);

          cleanup();
        },
      ),
      { numRuns: 100 },
    );
  });
});
