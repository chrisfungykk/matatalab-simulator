import React from 'react';
import type { GridState, Position, Direction, ValidationError } from '../../core/types';
import styles from './GridMap.module.css';

export interface GridMapProps {
  gridSize: { width: number; height: number };
  cells: Pick<GridState, 'obstacles' | 'goals' | 'collectibles'>;
  botPosition: Position;
  botDirection: Direction;
  animationType?: 'music' | 'dance';
  errorInfo?: ValidationError;
}

const DIRECTION_ROTATION: Record<Direction, number> = {
  north: 0,
  east: 90,
  south: 180,
  west: 270,
};

function positionMatch(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

function hasPosition(list: Position[], pos: Position): boolean {
  return list.some((p) => positionMatch(p, pos));
}

export const GridMap: React.FC<GridMapProps> = ({
  gridSize,
  cells,
  botPosition,
  botDirection,
  animationType,
  errorInfo,
}) => {
  const { width, height } = gridSize;

  const gridStyle: React.CSSProperties = {
    gridTemplateColumns: `repeat(${width}, minmax(40px, 1fr))`,
    gridTemplateRows: `repeat(${height}, minmax(40px, 1fr))`,
  };

  const renderedCells: React.ReactNode[] = [];

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const pos: Position = { row, col };
      const isObstacle = hasPosition(cells.obstacles, pos);
      const isGoal = hasPosition(cells.goals, pos);
      const isCollectible = hasPosition(cells.collectibles, pos);
      const isBot = positionMatch(botPosition, pos);

      const cellClasses = [
        styles.cell,
        isObstacle ? styles.obstacle : '',
        isGoal ? styles.goal : '',
        isCollectible ? styles.collectible : '',
      ]
        .filter(Boolean)
        .join(' ');

      const hasError = isBot && errorInfo != null;

      renderedCells.push(
        <div
          key={`${row}-${col}`}
          className={cellClasses}
          data-row={row}
          data-col={col}
        >
          {isObstacle && !isBot && <span>🪨</span>}
          {isGoal && !isBot && <span>🎯</span>}
          {isCollectible && !isBot && <span>⭐</span>}
          {isBot && (
            <div className={`${styles.bot} ${hasError ? styles.error : ''}`}>
              <div
                className={styles.botArrow}
                style={{
                  transform: `rotate(${DIRECTION_ROTATION[botDirection]}deg)`,
                }}
              />
              {animationType && (
                <span className={styles.animationIndicator}>
                  {animationType === 'music' ? '🎵' : '💃'}
                </span>
              )}
            </div>
          )}
        </div>,
      );
    }
  }

  return (
    <div className={styles.grid} style={gridStyle}>
      {renderedCells}
    </div>
  );
};

export default GridMap;
