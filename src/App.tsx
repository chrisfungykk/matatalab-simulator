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
import type { SimulatorState, SimulatorAction, ChallengeConfig, SpeedSetting, ControlBoardState } from './core/types';
import { SPEED_DELAYS } from './core/types';
import { builtInChallenges } from './challenges';
import GridMap from './components/GridMap/GridMap';
import ControlBoard from './components/ControlBoard/ControlBoard';
import BlockInventory from './components/BlockInventory/BlockInventory';
import Toolbar from './components/Toolbar/Toolbar';
import ChallengeSelector from './components/ChallengeSelector/ChallengeSelector';
import ErrorDisplay from './components/ErrorDisplay/ErrorDisplay';
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

function getBlockCategory(blockType: string): string {
  if (['forward', 'backward', 'turn_left', 'turn_right'].includes(blockType)) return 'motion';
  if (['loop_begin', 'loop_end'].includes(blockType)) return 'loop';
  if (['function_define', 'function_call'].includes(blockType)) return 'function';
  if (blockType.startsWith('number_')) return 'number';
  return 'fun';
}

interface DragOverlayBlockProps {
  blockType: string;
}

const DragOverlayBlock: React.FC<DragOverlayBlockProps> = ({ blockType }) => {
  const { t } = useTranslation();
  const category = getBlockCategory(blockType);
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

  // ── Active drag tracking ────────────────────────────────────────
  const [activeDragData, setActiveDragData] = useState<{ blockType?: string } | null>(null);

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

  return (
    <I18nextProvider i18n={i18n}>
      <SimulatorContext.Provider value={{ state, dispatch }}>
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
              />
            </header>

            <main className="app-main">
              <section className="app-grid-panel">
                <GridMap
                  gridSize={{ width: state.grid.width, height: state.grid.height }}
                  cells={{
                    obstacles: state.grid.obstacles,
                    goals: state.grid.goals,
                    collectibles: state.grid.collectibles,
                  }}
                  botPosition={state.botPosition}
                  botDirection={state.botDirection}
                  animationType={state.execution.animationType}
                  errorInfo={state.execution.errorInfo}
                />
              </section>

              <section className="app-right-panel">
                <div className="app-control-board">
                  <ControlBoard
                    controlBoard={state.controlBoard}
                    execution={state.execution}
                    onPlaceBlock={handlePlaceBlock}
                    onRemoveBlock={handleRemoveBlock}
                    onReorderBlock={handleReorderBlock}
                  />
                </div>

                <div className="app-block-inventory">
                  <BlockInventory blockInventory={state.blockInventory} />
                </div>
              </section>
            </main>

            <aside className="app-challenges">
              <ChallengeSelector
                challenges={builtInChallenges}
                onSelectChallenge={handleSelectChallenge}
                language={state.language}
              />
            </aside>

            <ErrorDisplay
              errorInfo={state.execution.errorInfo}
              goalReached={state.execution.goalReached}
              executionStatus={state.execution.status}
            />
          </div>

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
