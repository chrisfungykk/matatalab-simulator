import React from 'react';
import type { Position, Direction, GridState } from '../../core/types';

// ── Props ───────────────────────────────────────────────────────────

export interface AccessibilityLayerProps {
  gridSize: { width: number; height: number };
  cells: Pick<GridState, 'obstacles' | 'goals' | 'collectibles'>;
  botPosition: Position;
  botDirection: Direction;
  startPosition: Position;
  collectedItems?: Position[];
}

// ── Helpers ─────────────────────────────────────────────────────────

function posMatch(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

function hasPos(list: Position[], pos: Position): boolean {
  return list.some((p) => posMatch(p, pos));
}

export function getCellLabel(
  pos: Position,
  cells: Pick<GridState, 'obstacles' | 'goals' | 'collectibles'>,
  botPosition: Position,
  botDirection: Direction,
  startPosition: Position,
  collectedItems: Position[],
): string {
  const isBot = posMatch(botPosition, pos);
  if (isBot) return `Bot facing ${botDirection}`;

  const isObstacle = hasPos(cells.obstacles, pos);
  if (isObstacle) return 'Obstacle';

  const isGoal = hasPos(cells.goals, pos);
  if (isGoal) return 'Goal';

  const isCollectible = hasPos(cells.collectibles, pos) && !hasPos(collectedItems, pos);
  if (isCollectible) return 'Collectible';

  const isStart = posMatch(startPosition, pos);
  if (isStart) return 'Start';

  return '';
}

// ── Component ───────────────────────────────────────────────────────

export const AccessibilityLayer: React.FC<AccessibilityLayerProps> = ({
  gridSize,
  cells,
  botPosition,
  botDirection,
  startPosition,
  collectedItems = [],
}) => {
  const { width, height } = gridSize;

  const rows: React.ReactNode[] = [];
  for (let row = 0; row < height; row++) {
    const cellNodes: React.ReactNode[] = [];
    for (let col = 0; col < width; col++) {
      const pos: Position = { row, col };
      const label = getCellLabel(pos, cells, botPosition, botDirection, startPosition, collectedItems);
      cellNodes.push(
        <div key={`${row}-${col}`} role="gridcell" aria-label={label || undefined}>
          {label}
        </div>,
      );
    }
    rows.push(
      <div key={`row-${row}`} role="row">
        {cellNodes}
      </div>,
    );
  }

  const liveText = `Bot moved to row ${botPosition.row}, column ${botPosition.col}, facing ${botDirection}`;

  return (
    <div
      style={{
        position: 'absolute',
        left: '-9999px',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
      }}
    >
      <div role="grid" aria-label="Accessible grid mirror">
        {rows}
      </div>
      <div aria-live="polite">{liveText}</div>
    </div>
  );
};

export default AccessibilityLayer;
