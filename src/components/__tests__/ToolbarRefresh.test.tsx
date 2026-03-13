// Feature: uiux-matatalab-refresh, Property 9: Toolbar buttons have icons and text
import { describe, it, expect, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import fc from 'fast-check';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import { Toolbar } from '../Toolbar/Toolbar';
import type { ToolbarProps } from '../Toolbar/Toolbar';
import type { ControlBoardState } from '../../core/types';

const emptyBoard: ControlBoardState = {
  lines: [
    { lineIndex: 0, blocks: [] },
    { lineIndex: 1, blocks: [] },
  ],
};

function makeProps(language: 'en' | 'zh'): ToolbarProps {
  return {
    onRun: vi.fn(),
    onReset: vi.fn(),
    onLoadProgram: vi.fn(),
    onSetSpeed: vi.fn(),
    onSetLanguage: vi.fn(),
    controlBoard: emptyBoard,
    speed: 'normal',
    language,
    executionStatus: 'idle',
  };
}

describe('Toolbar - Property 9: Toolbar buttons have icons and text', () => {
  // **Validates: Requirements 6.4**
  it('every toolbar button should contain both an icon element and visible text', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<'en' | 'zh'>('en', 'zh'),
        (language) => {
          cleanup();
          i18n.changeLanguage(language);

          const props = makeProps(language);
          const { container } = render(
            <I18nextProvider i18n={i18n}>
              <Toolbar {...props} />
            </I18nextProvider>,
          );

          const buttons = container.querySelectorAll('[data-testid="toolbar-button"]');
          // Toolbar should have at least the core buttons (Run, Reset, Save, Load, Timer, Language)
          expect(buttons.length).toBeGreaterThanOrEqual(6);

          buttons.forEach((button) => {
            // Each button must contain an SVG icon with data-testid="button-icon"
            const icon = button.querySelector('[data-testid="button-icon"]');
            expect(icon).toBeTruthy();
            expect(icon!.tagName.toLowerCase()).toBe('svg');

            // Each button must have non-empty text content (excluding the SVG's text)
            const textContent = button.textContent?.replace(icon!.textContent || '', '').trim();
            expect(textContent).toBeTruthy();
            expect(textContent!.length).toBeGreaterThan(0);
          });

          cleanup();
        },
      ),
      { numRuns: 100 },
    );
  });
});
