import React from 'react';
import type { GridState, Position, Direction, ValidationError, SpeedSetting } from '../../core/types';
import { SPEED_DELAYS } from '../../core/types';
import { BotSVG } from '../BotSVG/BotSVG';
import styles from './GridMap.module.css';

export interface GridMapProps {
  gridSize: { width: number; height: number };
  cells: Pick<GridState, 'obstacles' | 'goals' | 'collectibles'>;
  botPosition: Position;
  botDirection: Direction;
  startPosition: Position;
  speed: SpeedSetting;
  animationType?: 'music' | 'dance';
  errorInfo?: ValidationError;
}

function positionMatch(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

function hasPosition(list: Position[], pos: Position): boolean {
  return list.some((p) => positionMatch(p, pos));
}

/* ── Inline SVG illustrations ─────────────────────────────────────── */

function ObstacleSVG() {
  return (
    <svg
      data-testid="obstacle-svg"
      className={styles.obstacleSvg}
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      {/* Rock */}
      <ellipse cx="24" cy="34" rx="18" ry="10" fill="#b0a090" />
      <ellipse cx="24" cy="32" rx="16" ry="9" fill="#c4b8a8" />
      <ellipse cx="20" cy="30" rx="6" ry="4" fill="#d4c8b8" opacity="0.6" />
      {/* Small bush accent */}
      <circle cx="36" cy="26" r="5" fill="#81c784" />
      <circle cx="32" cy="24" r="4" fill="#66bb6a" />
      <circle cx="38" cy="24" r="3.5" fill="#a5d6a7" />
    </svg>
  );
}

function GoalSVG() {
  return (
    <svg
      data-testid="goal-svg"
      className={styles.goalSvg}
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      {/* Flag pole */}
      <line x1="14" y1="8" x2="14" y2="42" stroke="#795548" strokeWidth="2.5" strokeLinecap="round" />
      {/* Flag */}
      <path d="M14 8 L38 14 L14 22 Z" fill="#ef5350" />
      <path d="M14 8 L38 14 L14 22 Z" fill="url(#flagShine)" opacity="0.3" />
      {/* Base */}
      <ellipse cx="14" cy="42" rx="6" ry="2" fill="#8d6e63" />
      <defs>
        <linearGradient id="flagShine" x1="14" y1="8" x2="38" y2="22">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function CollectibleSVG() {
  return (
    <svg
      data-testid="collectible-svg"
      className={styles.collectibleSvg}
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      {/* Star shape */}
      <polygon
        points="24,4 28.5,17.5 42,17.5 31,26.5 35,40 24,31 13,40 17,26.5 6,17.5 19.5,17.5"
        fill="#ffd54f"
        stroke="#ffb300"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Inner shine */}
      <polygon
        points="24,10 27,18.5 36,18.5 29,24 31.5,33 24,27.5 16.5,33 19,24 12,18.5 21,18.5"
        fill="#ffecb3"
        opacity="0.5"
      />
    </svg>
  );
}

/* ── Main component ───────────────────────────────────────────────── */

export const GridMap: React.FC<GridMapProps> = ({
  gridSize,
  cells,
  botPosition,
  botDirection,
  startPosition,
  speed,
  animationType,
  errorInfo,
}) => {
  const { width, height } = gridSize;
  const isIdle = !errorInfo && !animationType;
  const transitionDuration = SPEED_DELAYS[speed];

  const gridStyle: React.CSSProperties = {
    gridTemplateColumns: `repeat(${width}, 1fr)`,
    gridTemplateRows: `repeat(${height}, 1fr)`,
  };

  const renderedCells: React.ReactNode[] = [];

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const pos: Position = { row, col };
      const isObstacle = hasPosition(cells.obstacles, pos);
      const isGoal = hasPosition(cells.goals, pos);
      const isCollectible = hasPosition(cells.collectibles, pos);
      const isBot = positionMatch(botPosition, pos);
      const isStart = positionMatch(startPosition, pos);

      const cellClasses = [
        styles.cell,
        isObstacle ? styles.obstacle : '',
        isGoal ? styles.goal : '',
        isCollectible ? styles.collectible : '',
        isStart ? styles.startCell : '',
      ]
        .filter(Boolean)
        .join(' ');

      // Build aria-label for special cells
      const cellLabel = isObstacle
        ? 'Obstacle'
        : isGoal
          ? 'Goal'
          : isCollectible
            ? 'Collectible'
            : isStart
              ? 'Start'
              : undefined;

      renderedCells.push(
        <div
          key={`${row}-${col}`}
          className={cellClasses}
          data-row={row}
          data-col={col}
          role="gridcell"
          aria-label={cellLabel}
        >
          {isObstacle && !isBot && <ObstacleSVG />}
          {isGoal && !isBot && <GoalSVG />}
          {isCollectible && !isBot && <CollectibleSVG />}
          {isBot && (
            <div
              className={styles.botWrapper}
              style={{ transition: `all ${transitionDuration}ms ease` }}
            >
              <div className={styles.botSvgContainer}>
                <BotSVG
                  direction={botDirection}
                  isIdle={isIdle}
                  isError={errorInfo != null}
                  animationType={animationType}
                />
              </div>
            </div>
          )}
        </div>,
      );
    }
  }

  return (
    <div className={styles.grid} style={gridStyle} role="grid" aria-label="Grid Map">
      {renderedCells}
    </div>
  );
};

export default GridMap;
