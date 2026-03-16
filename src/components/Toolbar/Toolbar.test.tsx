import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import { Toolbar, ToolbarProps, TimerState } from './Toolbar';
import type { ControlBoardState, SpeedSetting } from '../../core/types';

// ── Helpers ─────────────────────────────────────────────────────────

const emptyBoard: ControlBoardState = {
  lines: [{ lineIndex: 0, blocks: [] }],
};

const boardWithBlocks: ControlBoardState = {
  lines: [
    {
      lineIndex: 0,
      blocks: [
        { id: 'b1', type: 'forward' },
        { id: 'b2', type: 'turn_left' },
      ],
    },
  ],
};

const defaultTimer: TimerState = {
  enabled: false,
  duration: 0,
  remaining: 0,
  running: false,
};

function defaultProps(overrides: Partial<ToolbarProps> = {}): ToolbarProps {
  return {
    onRun: vi.fn(),
    onReset: vi.fn(),
    onLoadProgram: vi.fn(),
    onSetSpeed: vi.fn(),
    onSetLanguage: vi.fn(),
    onTimerStart: vi.fn(),
    onTimerStop: vi.fn(),
    onTimerTick: vi.fn(),
    onTimerExpired: vi.fn(),
    controlBoard: emptyBoard,
    speed: 'normal' as SpeedSetting,
    language: 'zh',
    executionStatus: 'idle',
    timer: defaultTimer,
    ...overrides,
  };
}

function renderToolbar(overrides: Partial<ToolbarProps> = {}) {
  const props = defaultProps(overrides);
  const result = render(
    <I18nextProvider i18n={i18n}>
      <Toolbar {...props} />
    </I18nextProvider>,
  );
  return { ...result, props };
}

// ── Tests ───────────────────────────────────────────────────────────

describe('Toolbar', () => {
  beforeEach(() => {
    i18n.changeLanguage('zh');
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('renders Run, Reset, Save, Load buttons', () => {
    renderToolbar();
    expect(screen.getByRole('button', { name: /執行/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /重置/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /儲存/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /載入/i })).toBeInTheDocument();
  });

  it('renders speed selector with three options', () => {
    renderToolbar();
    expect(screen.getByRole('radio', { name: /慢速/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /正常/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /快速/i })).toBeInTheDocument();
  });

  it('renders language toggle button', () => {
    renderToolbar({ language: 'zh' });
    expect(screen.getByText('EN')).toBeInTheDocument();
  });

  // ── Run button ──────────────────────────────────────────────────

  it('calls onRun when Run button is clicked', () => {
    const { props } = renderToolbar();
    fireEvent.click(screen.getByRole('button', { name: /執行/i }));
    expect(props.onRun).toHaveBeenCalledOnce();
  });

  it('disables Run button when execution is running', () => {
    renderToolbar({ executionStatus: 'running' });
    expect(screen.getByRole('button', { name: /執行/i })).toBeDisabled();
  });

  // ── Reset button ────────────────────────────────────────────────

  it('calls onReset when Reset button is clicked', () => {
    const { props } = renderToolbar();
    fireEvent.click(screen.getByRole('button', { name: /重置/i }));
    expect(props.onReset).toHaveBeenCalledOnce();
  });

  // ── Save button ─────────────────────────────────────────────────

  it('serializes and triggers download on Save click', () => {
    const clickSpy = vi.fn();
    const revokeObjectURLSpy = vi.fn();
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:test'),
      revokeObjectURL: revokeObjectURLSpy,
    });

    const setItemSpy = vi.fn();
    const storageMock = { setItem: setItemSpy, getItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn(), length: 0, key: vi.fn() };
    vi.stubGlobal('localStorage', storageMock);

    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string, options?: ElementCreationOptions) => {
      if (tag === 'a') {
        return { click: clickSpy, href: '', download: '' } as unknown as HTMLAnchorElement;
      }
      return origCreateElement(tag, options);
    });

    renderToolbar({ controlBoard: boardWithBlocks });
    fireEvent.click(screen.getByRole('button', { name: /儲存/i }));

    expect(setItemSpy).toHaveBeenCalledWith('matatalab-program', expect.any(String));
    const savedJson = setItemSpy.mock.calls[0][1];
    const parsed = JSON.parse(savedJson);
    expect(parsed.version).toBe(1);
    expect(parsed.lines[0].blocks).toHaveLength(2);

    expect(clickSpy).toHaveBeenCalledOnce();
    expect(revokeObjectURLSpy).toHaveBeenCalledOnce();
  });

  // ── Load button ─────────────────────────────────────────────────

  it('opens file picker when Load button is clicked', () => {
    renderToolbar();
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, 'click');

    fireEvent.click(screen.getByRole('button', { name: /載入/i }));
    expect(clickSpy).toHaveBeenCalledOnce();
  });

  it('dispatches onLoadProgram with deserialized board on valid file', async () => {
    vi.useRealTimers();
    const { props } = renderToolbar();
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const validJson = JSON.stringify({
      version: 1,
      lines: [{ lineIndex: 0, blocks: [{ type: 'forward' }] }],
    });

    const file = new File([validJson], 'test.json', { type: 'application/json' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await vi.waitFor(() => {
      expect(props.onLoadProgram).toHaveBeenCalledOnce();
    });

    const loadedBoard = (props.onLoadProgram as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(loadedBoard.lines).toHaveLength(1);
    expect(loadedBoard.lines[0].blocks[0].type).toBe('forward');
  });

  it('shows alert on invalid JSON file load', async () => {
    vi.useRealTimers();
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const { props } = renderToolbar();
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const file = new File(['not valid json'], 'bad.json', { type: 'application/json' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await vi.waitFor(() => {
      expect(alertSpy).toHaveBeenCalledOnce();
    });

    expect(props.onLoadProgram).not.toHaveBeenCalled();
  });

  // ── Speed selector ──────────────────────────────────────────────

  it('marks current speed as active (aria-checked)', () => {
    renderToolbar({ speed: 'normal' });
    expect(screen.getByRole('radio', { name: /正常/i })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /慢速/i })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('radio', { name: /快速/i })).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onSetSpeed when a speed option is clicked', () => {
    const { props } = renderToolbar({ speed: 'normal' });
    fireEvent.click(screen.getByRole('radio', { name: /快速/i }));
    expect(props.onSetSpeed).toHaveBeenCalledWith('fast');
  });

  // ── Language toggle ─────────────────────────────────────────────

  it('calls onSetLanguage and i18n.changeLanguage on toggle', () => {
    const changeLangSpy = vi.spyOn(i18n, 'changeLanguage');
    const { props } = renderToolbar({ language: 'zh' });

    fireEvent.click(screen.getByText('EN'));

    expect(props.onSetLanguage).toHaveBeenCalledWith('en');
    expect(changeLangSpy).toHaveBeenCalledWith('en');
  });

  it('shows 中文 when language is en', () => {
    renderToolbar({ language: 'en' });
    expect(screen.getByText('中文')).toBeInTheDocument();
  });

  // ── Accessibility ───────────────────────────────────────────────

  it('has a nav element with aria-label', () => {
    renderToolbar();
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label');
  });

  it('speed selector has radiogroup role with aria-label', () => {
    renderToolbar();
    const radiogroup = screen.getByRole('radiogroup');
    expect(radiogroup).toHaveAttribute('aria-label');
  });

  it('file input has aria-label and accepts JSON', () => {
    renderToolbar();
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toHaveAttribute('aria-label');
    expect(fileInput).toHaveAttribute('accept', '.json,application/json');
  });

  // ── Timer controls ──────────────────────────────────────────────

  describe('Timer', () => {
    it('renders timer group with aria-label', () => {
      renderToolbar();
      const timerGroup = screen.getByRole('group', { name: /計時器/i });
      expect(timerGroup).toBeInTheDocument();
    });

    it('renders duration input and start button when timer is not running', () => {
      renderToolbar({ timer: defaultTimer });
      expect(screen.getByLabelText(/計時時長/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /開始計時/i })).toBeInTheDocument();
    });

    it('calls onTimerStart with duration when start button is clicked', () => {
      const { props } = renderToolbar({ timer: defaultTimer });
      const input = screen.getByLabelText(/計時時長/i);
      fireEvent.change(input, { target: { value: '120' } });
      fireEvent.click(screen.getByRole('button', { name: /開始計時/i }));
      expect(props.onTimerStart).toHaveBeenCalledWith(120);
    });

    it('renders countdown display and stop button when timer is running', () => {
      const runningTimer: TimerState = {
        enabled: true,
        duration: 120,
        remaining: 95,
        running: true,
      };
      renderToolbar({ timer: runningTimer });
      expect(screen.getByText('01:35')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /停止計時/i })).toBeInTheDocument();
    });

    it('calls onTimerStop when stop button is clicked', () => {
      const runningTimer: TimerState = {
        enabled: true,
        duration: 60,
        remaining: 30,
        running: true,
      };
      const { props } = renderToolbar({ timer: runningTimer });
      fireEvent.click(screen.getByRole('button', { name: /停止計時/i }));
      expect(props.onTimerStop).toHaveBeenCalledOnce();
    });

    it('dispatches onTimerTick every second when timer is running', () => {
      const runningTimer: TimerState = {
        enabled: true,
        duration: 60,
        remaining: 30,
        running: true,
      };
      const { props } = renderToolbar({ timer: runningTimer });

      act(() => { vi.advanceTimersByTime(1000); });
      expect(props.onTimerTick).toHaveBeenCalledTimes(1);

      act(() => { vi.advanceTimersByTime(1000); });
      expect(props.onTimerTick).toHaveBeenCalledTimes(2);

      act(() => { vi.advanceTimersByTime(1000); });
      expect(props.onTimerTick).toHaveBeenCalledTimes(3);
    });

    it('does not dispatch onTimerTick when timer is not running', () => {
      const { props } = renderToolbar({ timer: defaultTimer });

      act(() => { vi.advanceTimersByTime(3000); });
      expect(props.onTimerTick).not.toHaveBeenCalled();
    });

    it('dispatches onTimerExpired when remaining reaches 0', () => {
      const expiredTimer: TimerState = {
        enabled: true,
        duration: 60,
        remaining: 0,
        running: true,
      };
      const { props } = renderToolbar({ timer: expiredTimer });
      expect(props.onTimerExpired).toHaveBeenCalledOnce();
    });

    it('applies warning style when remaining <= 10 seconds', () => {
      const lowTimer: TimerState = {
        enabled: true,
        duration: 60,
        remaining: 8,
        running: true,
      };
      renderToolbar({ timer: lowTimer });
      const display = screen.getByText('00:08');
      expect(display.className).toContain('timerWarning');
    });

    it('formats time as mm:ss correctly', () => {
      const timer125: TimerState = {
        enabled: true,
        duration: 300,
        remaining: 125,
        running: true,
      };
      renderToolbar({ timer: timer125 });
      expect(screen.getByText('02:05')).toBeInTheDocument();
    });

    it('allows free practice mode (timer not started)', () => {
      renderToolbar({ timer: defaultTimer });
      // Duration input and start button are visible, no countdown
      expect(screen.getByLabelText(/計時時長/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /開始計時/i })).toBeInTheDocument();
      // No countdown display should be visible
      expect(screen.queryByText(/\d{2}:\d{2}/)).not.toBeInTheDocument();
    });

    it('disables start button when duration is 0', () => {
      const { props } = renderToolbar({ timer: defaultTimer });
      const input = screen.getByLabelText(/計時時長/i);
      fireEvent.change(input, { target: { value: '0' } });
      fireEvent.click(screen.getByRole('button', { name: /開始計時/i }));
      expect(props.onTimerStart).not.toHaveBeenCalled();
    });

    it('timer countdown display has aria-live for accessibility', () => {
      const runningTimer: TimerState = {
        enabled: true,
        duration: 60,
        remaining: 45,
        running: true,
      };
      renderToolbar({ timer: runningTimer });
      const display = screen.getByText('00:45');
      expect(display).toHaveAttribute('aria-live', 'polite');
    });
  });
});

describe('Competition Toggle', () => {
  beforeEach(() => {
    i18n.changeLanguage('zh');
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('renders competition toggle button when onToggleCompetition is provided', () => {
    renderToolbar({ onToggleCompetition: vi.fn(), competitionActive: false });
    const btn = screen.getByTestId('competition-toggle');
    expect(btn).toBeInTheDocument();
  });

  it('does not render competition toggle when onToggleCompetition is not provided', () => {
    renderToolbar({ onToggleCompetition: undefined });
    expect(screen.queryByTestId('competition-toggle')).not.toBeInTheDocument();
  });

  it('calls onToggleCompetition when clicked', () => {
    const handler = vi.fn();
    renderToolbar({ onToggleCompetition: handler, competitionActive: false });
    fireEvent.click(screen.getByTestId('competition-toggle'));
    expect(handler).toHaveBeenCalledOnce();
  });

  it('shows free practice label when competition is inactive', () => {
    renderToolbar({ onToggleCompetition: vi.fn(), competitionActive: false });
    const btn = screen.getByTestId('competition-toggle');
    expect(btn.textContent).toContain('自由練習');
  });

  it('shows competition mode label when competition is active', () => {
    renderToolbar({ onToggleCompetition: vi.fn(), competitionActive: true });
    const btn = screen.getByTestId('competition-toggle');
    expect(btn.textContent).toContain('比賽模式');
  });

  it('has aria-pressed=false when competition is inactive', () => {
    renderToolbar({ onToggleCompetition: vi.fn(), competitionActive: false });
    const btn = screen.getByTestId('competition-toggle');
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  it('has aria-pressed=true when competition is active', () => {
    renderToolbar({ onToggleCompetition: vi.fn(), competitionActive: true });
    const btn = screen.getByTestId('competition-toggle');
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  it('applies active style class when competition is active', () => {
    renderToolbar({ onToggleCompetition: vi.fn(), competitionActive: true });
    const btn = screen.getByTestId('competition-toggle');
    expect(btn.className).toContain('competitionActive');
  });

  it('does not apply active style class when competition is inactive', () => {
    renderToolbar({ onToggleCompetition: vi.fn(), competitionActive: false });
    const btn = screen.getByTestId('competition-toggle');
    expect(btn.className).not.toContain('competitionActive');
  });

  it('has aria-label for accessibility', () => {
    renderToolbar({ onToggleCompetition: vi.fn(), competitionActive: false });
    const btn = screen.getByTestId('competition-toggle');
    expect(btn).toHaveAttribute('aria-label');
  });

  it('contains a trophy icon SVG', () => {
    renderToolbar({ onToggleCompetition: vi.fn(), competitionActive: false });
    const btn = screen.getByTestId('competition-toggle');
    const svg = btn.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});

