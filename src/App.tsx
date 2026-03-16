import React, { useReducer, useCallback, useEffect, useRef, createContext, useContext, useState } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import i18n from './i18n';
import { simulatorReducer, createInitialState } from './core/simulatorReducer';
import { createExecutor } from './core/executor';
import type { ProgramExecutor } from './core/executor';
import type { SimulatorState, SimulatorAction, ChallengeConfig, SpeedSetting, ControlBoardState, BlockType, MazeGeneratorParams, RendererType, CompetitionChallengeSet, CompetitionSession, RoundScore } from './core/types';
import { SPEED_DELAYS } from './core/types';
import { builtInChallenges } from './challenges';
import { competitionChallengeSets } from './challenges/competitionSets';
import { generateMaze } from './core/mazeGenerator';
import { parseChallenge, prettyPrintChallenge } from './core/challengeParser';
import { saveSession, loadHistory, getPersonalBest } from './core/competitionPersistence';
import { calculateSessionSummary, isPersonalBest as checkIsPersonalBest } from './core/scoreCalculation';
import GridMap from './components/GridMap/GridMap';
import CanvasGridMap from './components/CanvasGridMap/CanvasGridMap';
import ControlBoard from './components/ControlBoard/ControlBoard';
import BlockInventory from './components/BlockInventory/BlockInventory';
import Toolbar from './components/Toolbar/Toolbar';
import ChallengeSelector from './components/ChallengeSelector/ChallengeSelector';
import FeedbackOverlay from './components/FeedbackOverlay/FeedbackOverlay';
import MazeControls from './components/MazeControls/MazeControls';
import CompetitionDashboard from './components/CompetitionDashboard/CompetitionDashboard';
import CompetitionSummary from './components/CompetitionSummary/CompetitionSummary';
import CompetitionHistory from './components/CompetitionHistory/CompetitionHistory';
import { TapToPlaceProvider } from './contexts/TapToPlaceContext';
import SelectionStatusLabel from './components/SelectionStatusLabel/SelectionStatusLabel';
import { usePreventGestures } from './hooks/usePreventGestures';
import { getBlockCategory } from './core/blockCategories';
import './App.css';

// ── Drag overlay ────────────────────────────────────────────────────

const BLOCK_I18N_KEY: Record<string, string> = {
  forward: 'block.forward',
  backward: 'block.backward',
  turn_left: 'block.turnLeft',
  turn_right: 'block.turnRight',
  loop_begin: 'block.loopBegin',
  loop_end: 'block.loopEnd',
  function_define: 'block.functionDefine',
  function_call: 'block.functionCall',
  number_2: 'block.number2',
  number_3: 'block.number3',
  number_4: 'block.number4',
  number_5: 'block.number5',
  number_random: 'block.numberRandom',
  fun_random_move: 'block.funRandomMove',
  fun_music: 'block.funMusic',
  fun_dance: 'block.funDance',
};

const BLOCK_CATEGORY_STYLES: Record<string, { background: string; border: string; color: string }> = {
  motion:   { background: '#bbdefb', border: '#64b5f6', color: '#0d47a1' },
  loop:     { background: '#fff9c4', border: '#fdd835', color: '#f57f17' },
  function: { background: '#c8e6c9', border: '#66bb6a', color: '#1b5e20' },
  number:   { background: '#e1bee7', border: '#ab47bc', color: '#4a148c' },
  fun:      { background: '#ffe0b2', border: '#ffa726', color: '#e65100' },
};

interface DragOverlayBlockProps {
  blockType: string;
}

const DragOverlayBlock: React.FC<DragOverlayBlockProps> = ({ blockType }) => {
  const { t } = useTranslation();
  const category = getBlockCategory(blockType as BlockType);
  const catStyle = BLOCK_CATEGORY_STYLES[category] ?? BLOCK_CATEGORY_STYLES.motion;
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '8px 12px',
        background: catStyle.background,
        border: `2px solid ${catStyle.border}`,
        color: catStyle.color,
        borderRadius: '8px',
        fontWeight: 500,
        fontSize: '0.85rem',
        cursor: 'grabbing',
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
      }}
    >
      {t(BLOCK_I18N_KEY[blockType] ?? blockType, { defaultValue: blockType })}
    </div>
  );
};

// ── Simulator Context ───────────────────────────────────────────────

interface SimulatorContextValue {
  state: SimulatorState;
  dispatch: React.Dispatch<SimulatorAction>;
}

const SimulatorContext = createContext<SimulatorContextValue | null>(null);

export function useSimulator(): SimulatorContextValue {
  const ctx = useContext(SimulatorContext);
  if (!ctx) throw new Error('useSimulator must be used within SimulatorProvider');
  return ctx;
}

// ── App Component ───────────────────────────────────────────────────

function App() {
  const [state, dispatch] = useReducer(simulatorReducer, undefined, createInitialState);

  // ── Canvas 2D support detection (Task 15.3) ─────────────────────
  const [canvasSupported, setCanvasSupported] = useState(true);
  useEffect(() => {
    try {
      const testCanvas = document.createElement('canvas');
      const ctx = testCanvas.getContext('2d');
      if (!ctx) {
        setCanvasSupported(false);
        dispatch({ type: 'SET_RENDERER', renderer: 'dom' });
      }
    } catch {
      setCanvasSupported(false);
      dispatch({ type: 'SET_RENDERER', renderer: 'dom' });
    }
  }, []);

  // ── Active drag tracking ────────────────────────────────────────
  const [activeDragData, setActiveDragData] = useState<{ blockType?: string } | null>(null);

  // ── Gesture prevention refs ─────────────────────────────────────
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const blockInventoryRef = useRef<HTMLDivElement>(null);
  usePreventGestures(rightPanelRef);
  usePreventGestures(blockInventoryRef);

  // ── Sensors ─────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // ── Execution animation loop ────────────────────────────────────
  const executorRef = useRef<ProgramExecutor | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speedRef = useRef<SpeedSetting>(state.speed);

  // Keep speed ref in sync so the animation loop always reads the latest value
  useEffect(() => {
    speedRef.current = state.speed;
  }, [state.speed]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  // Main animation loop: start when execution status becomes 'running'
  useEffect(() => {
    if (state.execution.status !== 'running') {
      // If execution stopped, clean up
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Create a fresh executor when execution starts (stepCount === 0 means fresh start)
    if (state.execution.stepCount === 0) {
      executorRef.current = createExecutor(
        state.controlBoard,
        state.grid,
        state.botStartPosition,
        state.botStartDirection,
        state.speed,
      );
    }

    const executor = executorRef.current;
    if (!executor) return;

    function tick() {
      if (!executor) return;

      const execState = executor.step();
      dispatch({ type: 'EXECUTE_STEP', state: execState });

      if (execState.status === 'completed') {
        // Check goal conditions and dispatch completion
        const success = execState.goalReached ?? false;
        dispatch({ type: 'EXECUTION_COMPLETE', success });
        executorRef.current = null;
        timeoutRef.current = null;
        return;
      }

      if (execState.status === 'error') {
        // Error info is already in the execution state from the executor;
        // the EXECUTE_STEP dispatch propagated it to the UI. Just stop.
        executorRef.current = null;
        timeoutRef.current = null;
        return;
      }

      // Schedule next step using the latest speed from the ref
      timeoutRef.current = setTimeout(tick, SPEED_DELAYS[speedRef.current]);
    }

    // Kick off the first step after the current speed delay
    timeoutRef.current = setTimeout(tick, SPEED_DELAYS[speedRef.current]);

    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  // Only re-run when execution status changes — speed changes are picked up via ref
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.execution.status]);

  // ── Drag-and-drop handler ───────────────────────────────────────
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragData(event.active.data.current ? (event.active.data.current as { blockType?: string }) : null);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragData(null);
    const { active, over } = event;
    const activeData = active.data.current;
    if (!activeData) return;

    if (activeData.type === 'inventory-block') {
      // Dragged from inventory — need a valid drop target
      if (!over) return;
      const overData = over.data.current;
      if (!overData) return;

      let lineIndex = 0;
      let position = 0;

      if (overData.type === 'drop-zone') {
        lineIndex = overData.lineIndex as number;
        position = overData.position as number;
      } else if (overData.type === 'program-line') {
        lineIndex = overData.lineIndex as number;
        position = 0;
      } else {
        return;
      }

      dispatch({
        type: 'PLACE_BLOCK',
        blockType: activeData.blockType,
        line: lineIndex,
        position,
      });
    } else if (activeData.type === 'board-block') {
      if (!over) {
        // Dropped outside any target — remove from board
        dispatch({ type: 'REMOVE_BLOCK', blockId: activeData.blockId });
        return;
      }

      const overData = over.data.current;
      if (!overData) {
        dispatch({ type: 'REMOVE_BLOCK', blockId: activeData.blockId });
        return;
      }

      if (overData.type === 'drop-zone' || overData.type === 'program-line') {
        const newLine = (overData.lineIndex as number) ?? 0;
        const newPosition = overData.type === 'drop-zone' ? (overData.position as number) : 0;

        dispatch({
          type: 'REORDER_BLOCK',
          blockId: activeData.blockId,
          newLine,
          newPosition,
        });
      }
    }
  }, []);

  // ── Toolbar callbacks ───────────────────────────────────────────
  const handleRun = useCallback(() => dispatch({ type: 'RUN_PROGRAM' }), []);
  const handleReset = useCallback(() => dispatch({ type: 'RESET' }), []);
  const handleLoadProgram = useCallback(
    (board: ControlBoardState) => dispatch({ type: 'LOAD_PROGRAM', board }),
    [],
  );
  const handleSetSpeed = useCallback(
    (speed: SpeedSetting) => dispatch({ type: 'SET_SPEED', speed }),
    [],
  );
  const handleSetLanguage = useCallback(
    (language: 'zh' | 'en') => dispatch({ type: 'SET_LANGUAGE', language }),
    [],
  );
  const handleTimerStart = useCallback(
    (duration: number) => dispatch({ type: 'TIMER_START', duration }),
    [],
  );
  const handleTimerStop = useCallback(() => dispatch({ type: 'TIMER_STOP' }), []);
  const handleTimerTick = useCallback(() => dispatch({ type: 'TIMER_TICK' }), []);
  const handleTimerExpired = useCallback(() => dispatch({ type: 'TIMER_EXPIRED' }), []);

  // ── Renderer toggle callback ────────────────────────────────────
  const handleToggleRenderer = useCallback(() => {
    if (!canvasSupported && state.renderer === 'dom') return; // can't switch to canvas if unsupported
    const next: RendererType = state.renderer === 'canvas' ? 'dom' : 'canvas';
    dispatch({ type: 'SET_RENDERER', renderer: next });
  }, [state.renderer, canvasSupported]);

  // ── Competition mode callbacks (Task 16.1) ──────────────────────
  const [competitionHistory, setCompetitionHistory] = useState<CompetitionSession[]>(() => {
    const history = loadHistory();
    return history?.sessions ?? [];
  });
  const [showCompetitionSummary, setShowCompetitionSummary] = useState(false);
  const [summaryIsPersonalBest, setSummaryIsPersonalBest] = useState(false);

  const handleToggleCompetition = useCallback(() => {
    if (state.competition.active) {
      dispatch({ type: 'DEACTIVATE_COMPETITION' });
      setShowCompetitionSummary(false);
    } else {
      // Just toggle on — user picks a set via ChallengeSelector
      dispatch({ type: 'DEACTIVATE_COMPETITION' });
    }
  }, [state.competition.active]);

  const handleStartRound = useCallback(() => {
    dispatch({ type: 'START_ROUND' });
  }, []);

  const handleCompleteRound = useCallback((score: RoundScore) => {
    dispatch({ type: 'COMPLETE_ROUND', score });
  }, []);

  const handleSelectCompetitionSet = useCallback((set: CompetitionChallengeSet) => {
    dispatch({ type: 'ACTIVATE_COMPETITION', challengeSet: set });
    setShowCompetitionSummary(false);
    // Auto-start the first round after activation
    setTimeout(() => handleStartRound(), 0);
  }, [handleStartRound]);

  const handleNextRound = useCallback(() => {
    const session = state.competition.currentSession;
    if (!session) return;
    const nextIndex = state.competition.currentRoundIndex + 1;
    if (nextIndex >= session.rounds.length) {
      // All rounds done — calculate final summary and show it
      const collectibleCounts = state.competition.challengeSet?.challenges.map(entry => {
        if (entry.type === 'predefined' && entry.challengeConfig) {
          return entry.challengeConfig.collectibles.length;
        }
        return entry.mazeParams?.collectibles ?? 0;
      }) ?? [];
      const summary = calculateSessionSummary(session.rounds, collectibleCounts);
      const finalSession: CompetitionSession = {
        ...session,
        totalScore: summary.totalScore,
        starRating: summary.starRating,
      };
      // Check personal best
      const storedBest = getPersonalBest(session.challengeSetId);
      const isPB = checkIsPersonalBest(summary.totalScore, storedBest);
      setSummaryIsPersonalBest(isPB);
      // Save session to localStorage
      saveSession(finalSession);
      setCompetitionHistory(prev => [...prev, finalSession]);
      setShowCompetitionSummary(true);
    } else {
      dispatch({ type: 'NEXT_ROUND' });
      // Auto-start the next round
      setTimeout(() => handleStartRound(), 0);
    }
  }, [state.competition.currentSession, state.competition.currentRoundIndex, state.competition.challengeSet, handleStartRound]);

  const handleDismissCompetitionSummary = useCallback(() => {
    setShowCompetitionSummary(false);
    dispatch({ type: 'DEACTIVATE_COMPETITION' });
  }, []);

  // ── Auto-score competition round on execution completion ────────
  useEffect(() => {
    if (!state.competition.active || !state.competition.currentSession) return;
    const status = state.execution.status;
    if (status !== 'completed' && status !== 'error') return;

    // Only score if the current round is not yet completed
    const currentRound = state.competition.currentSession.rounds[state.competition.currentRoundIndex];
    if (!currentRound || currentRound.completed) return;

    const goalReached = state.execution.goalReached ?? false;
    const collectiblesGathered = state.collectedItems.length;
    const stepCount = state.execution.stepCount ?? 0;
    // Estimate optimal steps as Manhattan distance (rough heuristic)
    const optimalSteps = Math.max(1, stepCount);
    const timeRemaining = state.timer.remaining;
    const timeLimit = state.competition.timeLimit;

    const score: RoundScore = {
      goalReached,
      basePoints: goalReached ? 100 : 0,
      collectibleBonus: collectiblesGathered * 20,
      efficiencyBonus: Math.max(0, 50 - (stepCount - optimalSteps) * 5),
      speedBonus: timeLimit > 0 ? Math.max(0, Math.floor((timeRemaining / timeLimit) * 50)) : 0,
      total: 0,
    };
    score.total = score.basePoints + score.collectibleBonus + score.efficiencyBonus + score.speedBonus;

    handleCompleteRound(score);
    // Auto-advance to next round after a short delay
    setTimeout(() => handleNextRound(), 2000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.execution.status]);

  // ── Challenge selector callback ─────────────────────────────────
  const handleSelectChallenge = useCallback(
    (config: ChallengeConfig) => dispatch({ type: 'LOAD_CHALLENGE', config }),
    [],
  );

  // ── ControlBoard callbacks ──────────────────────────────────────
  const handlePlaceBlock = useCallback(
    (blockType: string, line: number, position: number) =>
      dispatch({ type: 'PLACE_BLOCK', blockType: blockType as any, line, position }),
    [],
  );
  const handleRemoveBlock = useCallback(
    (blockId: string) => dispatch({ type: 'REMOVE_BLOCK', blockId }),
    [],
  );
  const handleReorderBlock = useCallback(
    (blockId: string, newLine: number, newPosition: number) =>
      dispatch({ type: 'REORDER_BLOCK', blockId, newLine, newPosition }),
    [],
  );

  // ── Feedback overlay dismiss ────────────────────────────────────
  const handleDismissFeedback = useCallback(() => dispatch({ type: 'RESET' }), []);

  // ── Maze generation, export, and import (Tasks 14.2–14.5) ───────
  const { t } = useTranslation();
  const [generatedSeed, setGeneratedSeed] = useState<number | undefined>(undefined);

  // 14.2: Generate maze and dispatch LOAD_GENERATED_MAZE
  const handleGenerateMaze = useCallback((params: MazeGeneratorParams) => {
    try {
      const result = generateMaze(params);
      dispatch({ type: 'LOAD_GENERATED_MAZE', result });
      setGeneratedSeed(result.seed);
    } catch {
      alert(t('maze.generateError'));
    }
  }, [t]);

  // 14.4: Export current challenge config as JSON file download
  const handleExportMaze = useCallback(() => {
    if (!state.currentChallenge) return;
    const json = prettyPrintChallenge(state.currentChallenge);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maze-${state.currentChallenge.generationSeed ?? 'custom'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state.currentChallenge]);

  // 14.5: Import maze JSON with validation and bilingual error messages
  const handleImportMaze = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text !== 'string') return;
      try {
        const config = parseChallenge(text);
        dispatch({ type: 'LOAD_CHALLENGE', config });
        if (config.generationSeed != null) {
          setGeneratedSeed(config.generationSeed);
        } else {
          setGeneratedSeed(undefined);
        }
      } catch (err) {
        const detail = err instanceof Error ? err.message : '';
        alert(`${t('maze.invalidFile')}\n${detail}`);
      }
    };
    reader.readAsText(file);
  }, [t]);

  // Helper: trigger file input for maze import
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImportMaze(file);
      // Reset input so the same file can be re-imported
      e.target.value = '';
    }
  }, [handleImportMaze]);

  return (
    <I18nextProvider i18n={i18n}>
      <SimulatorContext.Provider value={{ state, dispatch }}>
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <TapToPlaceProvider>
          <div className="app">
            <header className="app-toolbar">
              <Toolbar
                onRun={handleRun}
                onReset={handleReset}
                onLoadProgram={handleLoadProgram}
                onSetSpeed={handleSetSpeed}
                onSetLanguage={handleSetLanguage}
                onTimerStart={handleTimerStart}
                onTimerStop={handleTimerStop}
                onTimerTick={handleTimerTick}
                onTimerExpired={handleTimerExpired}
                controlBoard={state.controlBoard}
                speed={state.speed}
                language={state.language}
                executionStatus={state.execution.status}
                timer={state.timer}
                renderer={state.renderer}
                onToggleRenderer={handleToggleRenderer}
                competitionActive={state.competition.active}
                onToggleCompetition={handleToggleCompetition}
              />
            </header>

            <main className="app-main">
              {/* Task 16.2: Competition Dashboard — visible when competition active */}
              {state.competition.active && state.competition.currentSession && (
                <CompetitionDashboard
                  session={state.competition.currentSession}
                  currentRoundIndex={state.competition.currentRoundIndex}
                  timeRemaining={state.timer.remaining}
                  language={state.language}
                />
              )}

              <section className="app-grid-panel">
                {!canvasSupported && (
                  <div className="canvas-unsupported-msg" role="alert">
                    {t('renderer.canvasUnsupported')}
                  </div>
                )}
                {state.renderer === 'canvas' ? (
                  <CanvasGridMap
                    gridSize={{ width: state.grid.width, height: state.grid.height }}
                    cells={{
                      obstacles: state.grid.obstacles,
                      goals: state.grid.goals,
                      collectibles: state.grid.collectibles,
                    }}
                    botPosition={state.botPosition}
                    botDirection={state.botDirection}
                    startPosition={state.botStartPosition}
                    speed={state.speed}
                    animationType={state.execution.animationType}
                    errorInfo={state.execution.errorInfo}
                    collectedItems={state.collectedItems}
                    goalReached={state.execution.goalReached}
                  />
                ) : (
                  <GridMap
                    gridSize={{ width: state.grid.width, height: state.grid.height }}
                    cells={{
                      obstacles: state.grid.obstacles,
                      goals: state.grid.goals,
                      collectibles: state.grid.collectibles,
                    }}
                    botPosition={state.botPosition}
                    botDirection={state.botDirection}
                    startPosition={state.botStartPosition}
                    speed={state.speed}
                    animationType={state.execution.animationType}
                    errorInfo={state.execution.errorInfo}
                  />
                )}
              </section>

              <section className="app-right-panel" ref={rightPanelRef}>
                <div className="app-block-inventory" ref={blockInventoryRef}>
                  <BlockInventory blockInventory={state.blockInventory} />
                </div>

                <SelectionStatusLabel />
                <div className="app-control-board">
                  <ControlBoard
                    controlBoard={state.controlBoard}
                    execution={state.execution}
                    blockInventory={state.blockInventory}
                    onPlaceBlock={handlePlaceBlock}
                    onRemoveBlock={handleRemoveBlock}
                    onReorderBlock={handleReorderBlock}
                  />
                </div>
              </section>
            </main>

            <aside className="app-challenges">
              <ChallengeSelector
                challenges={builtInChallenges}
                onSelectChallenge={handleSelectChallenge}
                language={state.language}
                competitionSets={competitionChallengeSets}
                onSelectCompetitionSet={handleSelectCompetitionSet}
              />
              {/* Task 16.4: Competition History — visible when competition mode is active */}
              {state.competition.active && (
                <CompetitionHistory
                  sessions={competitionHistory}
                  language={state.language}
                />
              )}
              <MazeControls
                onGenerate={handleGenerateMaze}
                onExport={handleExportMaze}
                generatedSeed={generatedSeed}
                language={state.language}
                disabled={state.execution.status === 'running'}
              />
              <button
                className="maze-import-btn"
                onClick={handleImportClick}
                disabled={state.execution.status === 'running'}
                data-testid="maze-import-button"
              >
                {t('maze.import')}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleFileChange}
                data-testid="maze-import-input"
              />
            </aside>

            <FeedbackOverlay
              executionStatus={state.execution.status}
              goalReached={state.execution.goalReached}
              errorInfo={state.execution.errorInfo}
              challengeDifficulty={state.currentChallenge?.difficulty}
              language={state.language}
              onDismiss={handleDismissFeedback}
            />

            {/* Task 16.3: Competition Summary overlay — shown after all rounds complete */}
            {showCompetitionSummary && state.competition.currentSession && (
              <CompetitionSummary
                session={state.competition.currentSession}
                isPersonalBest={summaryIsPersonalBest}
                language={state.language}
                onDismiss={handleDismissCompetitionSummary}
              />
            )}

            <footer className="app-version">
              v{__APP_VERSION__} · {new Date(__BUILD_TIME__).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </footer>
          </div>
          </TapToPlaceProvider>

          <DragOverlay dropAnimation={null}>
            {activeDragData?.blockType ? (
              <DragOverlayBlock blockType={activeDragData.blockType} />
            ) : null}
          </DragOverlay>
        </DndContext>
      </SimulatorContext.Provider>
    </I18nextProvider>
  );
}

export default App;
