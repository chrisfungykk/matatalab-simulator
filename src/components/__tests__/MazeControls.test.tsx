import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import { MazeControls } from '../MazeControls/MazeControls';
import type { MazeControlsProps } from '../MazeControls/MazeControls';

function defaultProps(overrides: Partial<MazeControlsProps> = {}): MazeControlsProps {
  return {
    onGenerate: vi.fn(),
    onExport: vi.fn(),
    language: 'en',
    ...overrides,
  };
}

function renderControls(overrides: Partial<MazeControlsProps> = {}) {
  const props = defaultProps(overrides);
  const result = render(
    <I18nextProvider i18n={i18n}>
      <MazeControls {...props} />
    </I18nextProvider>,
  );
  return { ...result, props };
}

describe('MazeControls', () => {
  beforeEach(() => {
    i18n.changeLanguage('en');
  });

  afterEach(() => {
    cleanup();
  });

  // ── Rendering ───────────────────────────────────────────────────

  it('renders the maze-controls container', () => {
    renderControls();
    expect(screen.getByTestId('maze-controls')).toBeInTheDocument();
  });

  it('renders all control elements', () => {
    renderControls();
    expect(screen.getByTestId('maze-seed-input')).toBeInTheDocument();
    expect(screen.getByTestId('maze-width-select')).toBeInTheDocument();
    expect(screen.getByTestId('maze-height-select')).toBeInTheDocument();
    expect(screen.getByTestId('maze-difficulty-select')).toBeInTheDocument();
    expect(screen.getByTestId('maze-collectibles-select')).toBeInTheDocument();
    expect(screen.getByTestId('maze-generate-button')).toBeInTheDocument();
    expect(screen.getByTestId('maze-export-button')).toBeInTheDocument();
  });

  // ── Default Values ──────────────────────────────────────────────

  it('has default width of 5', () => {
    renderControls();
    expect(screen.getByTestId('maze-width-select')).toHaveValue('5');
  });

  it('has default height of 5', () => {
    renderControls();
    expect(screen.getByTestId('maze-height-select')).toHaveValue('5');
  });

  it('has default difficulty of medium', () => {
    renderControls();
    expect(screen.getByTestId('maze-difficulty-select')).toHaveValue('medium');
  });

  it('has default collectibles of 1', () => {
    renderControls();
    expect(screen.getByTestId('maze-collectibles-select')).toHaveValue('1');
  });

  it('has empty seed input by default', () => {
    renderControls();
    expect(screen.getByTestId('maze-seed-input')).toHaveValue('');
  });

  // ── Generate Button ─────────────────────────────────────────────

  it('calls onGenerate with default params when generate button clicked', () => {
    const { props } = renderControls();
    fireEvent.click(screen.getByTestId('maze-generate-button'));
    expect(props.onGenerate).toHaveBeenCalledWith({
      width: 5,
      height: 5,
      difficulty: 'medium',
      collectibles: 1,
    });
  });

  it('calls onGenerate with seed when seed input has a value', () => {
    const { props } = renderControls();
    fireEvent.change(screen.getByTestId('maze-seed-input'), { target: { value: '42' } });
    fireEvent.click(screen.getByTestId('maze-generate-button'));
    expect(props.onGenerate).toHaveBeenCalledWith({
      width: 5,
      height: 5,
      difficulty: 'medium',
      collectibles: 1,
      seed: 42,
    });
  });

  it('calls onGenerate without seed when seed input is empty', () => {
    const { props } = renderControls();
    fireEvent.click(screen.getByTestId('maze-generate-button'));
    const callArgs = (props.onGenerate as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(callArgs).not.toHaveProperty('seed');
  });

  it('calls onGenerate with changed parameter values', () => {
    const { props } = renderControls();
    fireEvent.change(screen.getByTestId('maze-width-select'), { target: { value: '8' } });
    fireEvent.change(screen.getByTestId('maze-height-select'), { target: { value: '6' } });
    fireEvent.change(screen.getByTestId('maze-difficulty-select'), { target: { value: 'hard' } });
    fireEvent.change(screen.getByTestId('maze-collectibles-select'), { target: { value: '3' } });
    fireEvent.click(screen.getByTestId('maze-generate-button'));
    expect(props.onGenerate).toHaveBeenCalledWith({
      width: 8,
      height: 6,
      difficulty: 'hard',
      collectibles: 3,
    });
  });

  // ── Export Button ───────────────────────────────────────────────

  it('export button is disabled when generatedSeed is undefined', () => {
    renderControls({ generatedSeed: undefined });
    expect(screen.getByTestId('maze-export-button')).toBeDisabled();
  });

  it('export button is enabled when generatedSeed is provided', () => {
    renderControls({ generatedSeed: 12345 });
    expect(screen.getByTestId('maze-export-button')).toBeEnabled();
  });

  it('calls onExport when export button clicked', () => {
    const { props } = renderControls({ generatedSeed: 12345 });
    fireEvent.click(screen.getByTestId('maze-export-button'));
    expect(props.onExport).toHaveBeenCalledOnce();
  });

  // ── Seed Display ────────────────────────────────────────────────

  it('displays generated seed when generatedSeed prop is provided', () => {
    renderControls({ generatedSeed: 99999 });
    const seedDisplay = screen.getByTestId('maze-seed-display');
    expect(seedDisplay).toBeInTheDocument();
    expect(seedDisplay.textContent).toContain('99999');
  });

  it('does not display seed when generatedSeed is undefined', () => {
    renderControls({ generatedSeed: undefined });
    expect(screen.queryByTestId('maze-seed-display')).not.toBeInTheDocument();
  });

  // ── Disabled State ──────────────────────────────────────────────

  it('all controls are disabled when disabled prop is true', () => {
    renderControls({ disabled: true, generatedSeed: 123 });
    expect(screen.getByTestId('maze-seed-input')).toBeDisabled();
    expect(screen.getByTestId('maze-width-select')).toBeDisabled();
    expect(screen.getByTestId('maze-height-select')).toBeDisabled();
    expect(screen.getByTestId('maze-difficulty-select')).toBeDisabled();
    expect(screen.getByTestId('maze-collectibles-select')).toBeDisabled();
    expect(screen.getByTestId('maze-generate-button')).toBeDisabled();
    expect(screen.getByTestId('maze-export-button')).toBeDisabled();
  });

  // ── Seed Input Validation ───────────────────────────────────────

  it('seed input accepts numeric values', () => {
    renderControls();
    const input = screen.getByTestId('maze-seed-input');
    fireEvent.change(input, { target: { value: '12345' } });
    expect(input).toHaveValue('12345');
  });

  it('seed input rejects non-numeric values', () => {
    renderControls();
    const input = screen.getByTestId('maze-seed-input');
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(input).toHaveValue('');
  });

  it('seed input rejects mixed alphanumeric values', () => {
    renderControls();
    const input = screen.getByTestId('maze-seed-input');
    fireEvent.change(input, { target: { value: '12a3' } });
    expect(input).toHaveValue('');
  });

  // ── Bilingual Labels ───────────────────────────────────────────

  it('renders English labels when language is en', () => {
    i18n.changeLanguage('en');
    renderControls({ language: 'en' });
    expect(screen.getByText('Seed')).toBeInTheDocument();
    expect(screen.getByText('Grid Width')).toBeInTheDocument();
    expect(screen.getByText('Grid Height')).toBeInTheDocument();
    expect(screen.getByText('Difficulty')).toBeInTheDocument();
    expect(screen.getByText('Collectibles')).toBeInTheDocument();
    expect(screen.getByTestId('maze-generate-button')).toHaveTextContent('Generate Maze');
    expect(screen.getByTestId('maze-export-button')).toHaveTextContent('Export Maze');
  });

  it('renders Chinese labels when language is zh', () => {
    i18n.changeLanguage('zh');
    renderControls({ language: 'zh' });
    expect(screen.getByText('種子碼')).toBeInTheDocument();
    expect(screen.getByText('格子寬度')).toBeInTheDocument();
    expect(screen.getByText('格子高度')).toBeInTheDocument();
    expect(screen.getByText('難度')).toBeInTheDocument();
    expect(screen.getByText('收集物數量')).toBeInTheDocument();
    expect(screen.getByTestId('maze-generate-button')).toHaveTextContent('生成迷宮');
    expect(screen.getByTestId('maze-export-button')).toHaveTextContent('匯出迷宮');
  });

  it('displays seed in Chinese format when language is zh', () => {
    i18n.changeLanguage('zh');
    renderControls({ language: 'zh', generatedSeed: 42 });
    expect(screen.getByTestId('maze-seed-display').textContent).toContain('種子碼');
    expect(screen.getByTestId('maze-seed-display').textContent).toContain('42');
  });

  // ── Accessibility ──────────────────────────────────────────────

  it('has a region with aria-label', () => {
    renderControls();
    const region = screen.getByRole('region');
    expect(region).toHaveAttribute('aria-label', 'Generate Maze');
  });

  it('labels are associated with inputs via htmlFor', () => {
    renderControls();
    // Each label should have a corresponding input via htmlFor/id
    const seedInput = screen.getByTestId('maze-seed-input');
    expect(seedInput).toHaveAttribute('id', 'maze-seed');
    expect(screen.getByLabelText('Seed')).toBe(seedInput);

    const widthSelect = screen.getByTestId('maze-width-select');
    expect(widthSelect).toHaveAttribute('id', 'maze-width');
    expect(screen.getByLabelText('Grid Width')).toBe(widthSelect);

    const heightSelect = screen.getByTestId('maze-height-select');
    expect(heightSelect).toHaveAttribute('id', 'maze-height');
    expect(screen.getByLabelText('Grid Height')).toBe(heightSelect);

    const difficultySelect = screen.getByTestId('maze-difficulty-select');
    expect(difficultySelect).toHaveAttribute('id', 'maze-difficulty');
    expect(screen.getByLabelText('Difficulty')).toBe(difficultySelect);

    const collectiblesSelect = screen.getByTestId('maze-collectibles-select');
    expect(collectiblesSelect).toHaveAttribute('id', 'maze-collectibles');
    expect(screen.getByLabelText('Collectibles')).toBe(collectiblesSelect);
  });

  it('generate button has aria-label', () => {
    renderControls();
    expect(screen.getByTestId('maze-generate-button')).toHaveAttribute('aria-label', 'Generate Maze');
  });

  it('export button has aria-label', () => {
    renderControls();
    expect(screen.getByTestId('maze-export-button')).toHaveAttribute('aria-label', 'Export Maze');
  });
});
