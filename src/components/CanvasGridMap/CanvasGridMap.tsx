import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { GridMapProps } from '../GridMap/GridMap';
import type { Position, Direction, SpeedSetting } from '../../core/types';
import { SPEED_DELAYS } from '../../core/types';
import styles from './CanvasGridMap.module.css';
import { AccessibilityLayer } from './AccessibilityLayer';

// ── Extended props for canvas renderer ──────────────────────────────

export interface CanvasGridMapProps extends GridMapProps {
  collectedItems?: Position[];
  goalReached?: boolean;
}

// ── Colors matching existing CSS variables ──────────────────────────

const COLORS: Record<string, string> = {
  cellBg: '#f0f7e6',
  cellBorder: '#d4e4c1',
  obstacleBg: '#e8dcc8',
  goalBg: '#d4edda',
  collectibleBg: '#fff8e1',
  startBorder: '#4caf50',
};

// ── Aria label helper (exported for property testing) ───────────────

export function generateAriaLabel(width: number, height: number, botRow: number, botCol: number): string {
  return `Grid ${width} by ${height}, Bot at row ${botRow} column ${botCol}`;
}

// ── Scaling calculation (exported for property testing) ─────────────

export interface ScalingResult {
  cellSize: number;
  canvasWidth: number;
  canvasHeight: number;
  offsetX: number;
  offsetY: number;
}

/**
 * Calculate canvas scaling to fit viewport while maintaining 1:1 cell aspect ratio.
 */
export function calculateCanvasScaling(
  viewportWidth: number,
  viewportHeight: number,
  gridWidth: number,
  gridHeight: number,
): ScalingResult {
  const vw = Math.max(1, viewportWidth);
  const vh = Math.max(1, viewportHeight);
  const gw = Math.max(1, gridWidth);
  const gh = Math.max(1, gridHeight);

  const cellSize = Math.floor(Math.min(vw / gw, vh / gh));
  const actualCellSize = Math.max(1, cellSize);

  const canvasWidth = actualCellSize * gw;
  const canvasHeight = actualCellSize * gh;

  const offsetX = Math.floor((vw - canvasWidth) / 2);
  const offsetY = Math.floor((vh - canvasHeight) / 2);

  return {
    cellSize: actualCellSize,
    canvasWidth,
    canvasHeight,
    offsetX: Math.max(0, offsetX),
    offsetY: Math.max(0, offsetY),
  };
}

// ── Easing ──────────────────────────────────────────────────────────

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// ── Exported for property testing (Property 5) ─────────────────────

/**
 * Returns the tween duration in ms for a given speed setting.
 * This equals the corresponding SPEED_DELAYS value.
 */
export function getTweenDuration(speed: SpeedSetting): number {
  return SPEED_DELAYS[speed];
}

// ── TweenState interface ────────────────────────────────────────────

interface TweenState {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  fromAngle: number;
  toAngle: number;
  progress: number; // 0–1
  duration: number;
  startTime: number;
  easing: (t: number) => number;
}

// ── Particle types ──────────────────────────────────────────────────

interface MusicNote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
  size: number;
  symbol: string;
}

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

interface CollectibleAnim {
  row: number;
  col: number;
  startTime: number;
  duration: number;
}

// ── Helper: position matching ───────────────────────────────────────

function posMatch(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

function hasPos(list: Position[], pos: Position): boolean {
  return list.some((p) => posMatch(p, pos));
}

// ── Direction to angle mapping ──────────────────────────────────────

const DIRECTION_ANGLES: Record<Direction, number> = {
  north: 0,
  east: Math.PI / 2,
  south: Math.PI,
  west: (3 * Math.PI) / 2,
};

/**
 * Compute shortest rotation path between two angles.
 */
function shortestAngleDelta(from: number, to: number): number {
  let delta = to - from;
  while (delta > Math.PI) delta -= 2 * Math.PI;
  while (delta < -Math.PI) delta += 2 * Math.PI;
  return delta;
}

// ── Drawing functions ───────────────────────────────────────────────

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  ctx.lineTo(x + radius, y + h);
  ctx.arcTo(x, y + h, x, y + h - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, size: number, fillColor: string, isStart: boolean,
) {
  const padding = 1;
  const radius = Math.max(2, size * 0.08);

  drawRoundedRect(ctx, x + padding, y + padding, size - padding * 2, size - padding * 2, radius);
  ctx.fillStyle = fillColor;
  ctx.fill();

  ctx.strokeStyle = COLORS.cellBorder;
  ctx.lineWidth = 1;
  ctx.stroke();

  if (isStart) {
    drawRoundedRect(ctx, x + padding + 1, y + padding + 1, size - padding * 2 - 2, size - padding * 2 - 2, radius);
    ctx.strokeStyle = COLORS.startBorder;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(76, 175, 80, 0.2)';
    ctx.lineWidth = 4;
    ctx.stroke();
  }
}

function drawObstacle(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  const s = size * 0.3;
  ctx.beginPath();
  ctx.ellipse(cx, cy + s * 0.4, s * 0.9, s * 0.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#b0a090';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx, cy + s * 0.2, s * 0.8, s * 0.45, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#c4b8a8';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx - s * 0.2, cy, s * 0.3, s * 0.2, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(212, 200, 184, 0.6)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + s * 0.6, cy - s * 0.2, s * 0.25, 0, Math.PI * 2);
  ctx.fillStyle = '#81c784';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + s * 0.4, cy - s * 0.35, s * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = '#66bb6a';
  ctx.fill();
}

function drawGoalFlag(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, time: number) {
  const s = size * 0.3;
  const wave = Math.sin(time * 0.003) * 2;
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.5, cy - s * 0.8);
  ctx.lineTo(cx - s * 0.5, cy + s * 0.8);
  ctx.strokeStyle = '#795548';
  ctx.lineWidth = Math.max(1.5, s * 0.12);
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.5, cy - s * 0.8);
  ctx.lineTo(cx + s * 0.6 + wave, cy - s * 0.4);
  ctx.lineTo(cx - s * 0.5, cy);
  ctx.closePath();
  ctx.fillStyle = '#ef5350';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx - s * 0.5, cy + s * 0.8, s * 0.3, s * 0.1, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#8d6e63';
  ctx.fill();
}

function drawCollectibleStar(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, size: number, time: number,
  scale: number = 1, opacity: number = 1,
) {
  const pulse = 1 + Math.sin(time * 0.004) * 0.1;
  const s = size * 0.25 * pulse * scale;

  ctx.save();
  ctx.globalAlpha = opacity;

  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 2) * -1 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? s : s * 0.45;
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = '#ffd54f';
  ctx.fill();
  ctx.strokeStyle = '#ffb300';
  ctx.lineWidth = Math.max(1, s * 0.08);
  ctx.lineJoin = 'round';
  ctx.stroke();

  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 2) * -1 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? s * 0.65 : s * 0.3;
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 236, 179, 0.5)';
  ctx.fill();

  ctx.restore();
}

function drawBot(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, size: number, angle: number,
  idleOffset: number = 0,
  errorFlash: boolean = false,
  shakeOffset: number = 0,
  danceWiggle: number = 0,
) {
  const s = size * 0.3;

  ctx.save();
  ctx.translate(cx + shakeOffset, cy + idleOffset);
  ctx.rotate(angle + danceWiggle);

  // Bot body
  ctx.beginPath();
  ctx.arc(0, 0, s, 0, Math.PI * 2);
  ctx.fillStyle = errorFlash ? '#ef5350' : '#42a5f5';
  ctx.fill();
  ctx.strokeStyle = errorFlash ? '#c62828' : '#1e88e5';
  ctx.lineWidth = Math.max(1.5, s * 0.1);
  ctx.stroke();

  // Direction indicator
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.7);
  ctx.lineTo(-s * 0.4, s * 0.1);
  ctx.lineTo(s * 0.4, s * 0.1);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Eyes
  const eyeY = -s * 0.1;
  const eyeX = s * 0.3;
  const eyeR = s * 0.12;
  ctx.beginPath();
  ctx.arc(-eyeX, eyeY, eyeR, 0, Math.PI * 2);
  ctx.arc(eyeX, eyeY, eyeR, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-eyeX, eyeY, eyeR * 0.5, 0, Math.PI * 2);
  ctx.arc(eyeX, eyeY, eyeR * 0.5, 0, Math.PI * 2);
  ctx.fillStyle = '#1a237e';
  ctx.fill();

  ctx.restore();
}

// ── Particle drawing ────────────────────────────────────────────────

function drawMusicNotes(ctx: CanvasRenderingContext2D, notes: MusicNote[]) {
  for (const note of notes) {
    ctx.save();
    ctx.globalAlpha = note.opacity;
    ctx.font = `${note.size}px serif`;
    ctx.fillStyle = '#9c27b0';
    ctx.fillText(note.symbol, note.x, note.y);
    ctx.restore();
  }
}

function drawConfetti(ctx: CanvasRenderingContext2D, particles: ConfettiParticle[]) {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = p.opacity;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.4);
    ctx.restore();
  }
}

// ── Confetti colors ─────────────────────────────────────────────────

const CONFETTI_COLORS = ['#ef5350', '#ffd54f', '#66bb6a', '#42a5f5', '#ab47bc', '#ff7043'];

// ── Main Component ──────────────────────────────────────────────────

export const CanvasGridMap: React.FC<CanvasGridMapProps> = ({
  gridSize,
  cells,
  botPosition,
  botDirection,
  startPosition,
  speed,
  animationType,
  errorInfo,
  collectedItems,
  goalReached,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const [containerSize, setContainerSize] = useState({ width: 400, height: 400 });
  const wrapperRef = useRef<HTMLDivElement>(null);

  // ── Animation state refs (avoid re-renders) ─────────────────────

  // Position/rotation tween
  const tweenRef = useRef<TweenState | null>(null);
  const prevBotPos = useRef<Position>(botPosition);
  const prevBotDir = useRef<Direction>(botDirection);
  const currentAngleRef = useRef<number>(DIRECTION_ANGLES[botDirection]);

  // Rotation tween (separate, ≤200ms)
  const rotTweenRef = useRef<{ from: number; to: number; startTime: number; duration: number } | null>(null);

  // Error animation
  const errorStartRef = useRef<number | null>(null);
  const prevErrorRef = useRef(errorInfo);

  // Music notes
  const musicNotesRef = useRef<MusicNote[]>([]);
  const prevAnimTypeRef = useRef(animationType);

  // Confetti
  const confettiRef = useRef<ConfettiParticle[]>([]);
  const confettiStartRef = useRef<number | null>(null);
  const prevGoalReachedRef = useRef(goalReached);

  // Collectible pickup animations
  const collectibleAnimsRef = useRef<CollectibleAnim[]>([]);
  const prevCollectedRef = useRef<Position[]>(collectedItems ?? []);

  // ── Detect position changes → start tween ───────────────────────

  useEffect(() => {
    const prev = prevBotPos.current;
    if (prev.row !== botPosition.row || prev.col !== botPosition.col) {
      const now = performance.now();
      const fromAngle = currentAngleRef.current;
      const toAngle = DIRECTION_ANGLES[botDirection];

      tweenRef.current = {
        fromX: prev.col,
        fromY: prev.row,
        toX: botPosition.col,
        toY: botPosition.row,
        fromAngle,
        toAngle: fromAngle + shortestAngleDelta(fromAngle, toAngle),
        progress: 0,
        duration: getTweenDuration(speed),
        startTime: now,
        easing: easeInOutQuad,
      };
      prevBotPos.current = botPosition;
      prevBotDir.current = botDirection;
    }
  }, [botPosition, botDirection, speed]);

  // ── Detect direction-only changes → rotation tween ──────────────

  useEffect(() => {
    if (prevBotDir.current !== botDirection) {
      // Only start rotation tween if no position tween is active
      // (position tween handles rotation too)
      const prev = prevBotPos.current;
      if (prev.row === botPosition.row && prev.col === botPosition.col) {
        const fromAngle = currentAngleRef.current;
        const toAngle = DIRECTION_ANGLES[botDirection];
        rotTweenRef.current = {
          from: fromAngle,
          to: fromAngle + shortestAngleDelta(fromAngle, toAngle),
          startTime: performance.now(),
          duration: 200,
        };
      }
      prevBotDir.current = botDirection;
    }
  }, [botDirection, botPosition]);

  // ── Detect error → start error animation ────────────────────────

  useEffect(() => {
    if (errorInfo && errorInfo !== prevErrorRef.current) {
      errorStartRef.current = performance.now();
    }
    prevErrorRef.current = errorInfo;
  }, [errorInfo]);

  // ── Detect animationType changes → spawn particles ──────────────

  useEffect(() => {
    if (animationType && animationType !== prevAnimTypeRef.current) {
      if (animationType === 'music') {
        // Spawn music note particles
        const notes: MusicNote[] = [];
        const symbols = ['♪', '♫', '♬', '♩'];
        for (let i = 0; i < 6; i++) {
          notes.push({
            x: 0, y: 0, // will be positioned relative to bot in draw
            vx: (Math.random() - 0.5) * 40,
            vy: -30 - Math.random() * 40,
            opacity: 1,
            size: 12 + Math.random() * 8,
            symbol: symbols[Math.floor(Math.random() * symbols.length)],
          });
        }
        musicNotesRef.current = notes;
      }
    }
    if (!animationType) {
      musicNotesRef.current = [];
    }
    prevAnimTypeRef.current = animationType;
  }, [animationType]);

  // ── Detect goal reached → spawn confetti ────────────────────────

  useEffect(() => {
    if (goalReached && !prevGoalReachedRef.current) {
      const particles: ConfettiParticle[] = [];
      for (let i = 0; i < 60; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 80 + Math.random() * 120;
        particles.push({
          x: 0, y: 0, // positioned at canvas center in draw
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 60,
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          size: 4 + Math.random() * 6,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 10,
          opacity: 1,
        });
      }
      confettiRef.current = particles;
      confettiStartRef.current = performance.now();
    }
    prevGoalReachedRef.current = goalReached;
  }, [goalReached]);

  // ── Detect new collected items → start pickup animation ─────────

  useEffect(() => {
    const prev = prevCollectedRef.current;
    const curr = collectedItems ?? [];
    // Find newly collected items
    for (const item of curr) {
      if (!hasPos(prev, item)) {
        collectibleAnimsRef.current.push({
          row: item.row,
          col: item.col,
          startTime: performance.now(),
          duration: 300,
        });
      }
    }
    prevCollectedRef.current = curr;
  }, [collectedItems]);

  // ── Debounced resize handler ────────────────────────────────────

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (wrapperRef.current) {
          const rect = wrapperRef.current.getBoundingClientRect();
          setContainerSize({ width: rect.width, height: rect.height });
        }
      }, 100);
    };
    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (wrapperRef.current) observer.observe(wrapperRef.current);
    return () => { clearTimeout(timeoutId); observer.disconnect(); };
  }, []);

  const { width, height } = gridSize;

  const scaling = calculateCanvasScaling(
    containerSize.width, containerSize.height, width, height,
  );

  // ── Draw loop ───────────────────────────────────────────────────

  const draw = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { cellSize } = scaling;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // ── Draw cells ──────────────────────────────────────────────
      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          const x = col * cellSize;
          const y = row * cellSize;
          const pos: Position = { row, col };

          const isObstacle = hasPos(cells.obstacles, pos);
          const isGoal = hasPos(cells.goals, pos);
          const isCollectible = hasPos(cells.collectibles, pos);
          const isStart = posMatch(startPosition, pos);
          const isCollected = collectedItems ? hasPos(collectedItems, pos) : false;

          let fillColor = COLORS.cellBg;
          if (isObstacle) fillColor = COLORS.obstacleBg;
          else if (isGoal) fillColor = COLORS.goalBg;
          else if (isCollectible && !isCollected) fillColor = COLORS.collectibleBg;

          drawCell(ctx, x, y, cellSize, fillColor, isStart);

          const cx = x + cellSize / 2;
          const cy = y + cellSize / 2;

          if (isObstacle) drawObstacle(ctx, cx, cy, cellSize);
          if (isGoal) drawGoalFlag(ctx, cx, cy, cellSize, time);

          // Collectible: check for pickup animation
          if (isCollectible) {
            const pickupAnim = collectibleAnimsRef.current.find(
              (a) => a.row === row && a.col === col,
            );
            if (pickupAnim) {
              const elapsed = time - pickupAnim.startTime;
              const progress = Math.min(1, elapsed / pickupAnim.duration);
              if (progress < 1) {
                const animScale = 1 - progress; // shrink
                const animOpacity = 1 - progress; // fade
                drawCollectibleStar(ctx, cx, cy, cellSize, time, animScale, animOpacity);
              }
            } else if (!isCollected) {
              drawCollectibleStar(ctx, cx, cy, cellSize, time);
            }
          }
        }
      }

      // Clean up finished collectible animations
      collectibleAnimsRef.current = collectibleAnimsRef.current.filter(
        (a) => time - a.startTime < a.duration,
      );

      // ── Calculate bot render position ───────────────────────────

      let botRenderX: number;
      let botRenderY: number;
      let botRenderAngle: number;

      const tween = tweenRef.current;
      if (tween && tween.progress < 1) {
        const elapsed = time - tween.startTime;
        tween.progress = Math.min(1, elapsed / tween.duration);
        const t = tween.easing(tween.progress);

        botRenderX = (tween.fromX + (tween.toX - tween.fromX) * t) * cellSize + cellSize / 2;
        botRenderY = (tween.fromY + (tween.toY - tween.fromY) * t) * cellSize + cellSize / 2;
        botRenderAngle = tween.fromAngle + (tween.toAngle - tween.fromAngle) * t;

        if (tween.progress >= 1) {
          currentAngleRef.current = tween.toAngle;
        }
      } else {
        // No active position tween — use exact position
        botRenderX = botPosition.col * cellSize + cellSize / 2;
        botRenderY = botPosition.row * cellSize + cellSize / 2;

        // Check rotation-only tween
        const rotTween = rotTweenRef.current;
        if (rotTween) {
          const elapsed = time - rotTween.startTime;
          const progress = Math.min(1, elapsed / rotTween.duration);
          const t = easeInOutQuad(progress);
          botRenderAngle = rotTween.from + (rotTween.to - rotTween.from) * t;
          if (progress >= 1) {
            currentAngleRef.current = rotTween.to;
            rotTweenRef.current = null;
          }
        } else {
          botRenderAngle = DIRECTION_ANGLES[botDirection];
          currentAngleRef.current = botRenderAngle;
        }
      }

      // ── Idle animation (gentle bobbing) ─────────────────────────
      const isMoving = tween && tween.progress < 1;
      const idleOffset = isMoving ? 0 : Math.sin(time * 0.003) * 2;

      // ── Error animation (red flash + shake, 500ms) ──────────────
      let errorFlash = false;
      let shakeOffset = 0;
      if (errorStartRef.current !== null) {
        const errorElapsed = time - errorStartRef.current;
        if (errorElapsed < 500) {
          errorFlash = true;
          // Shake: oscillate with decreasing amplitude
          const shakeProgress = errorElapsed / 500;
          const amplitude = 4 * (1 - shakeProgress);
          shakeOffset = Math.sin(errorElapsed * 0.05) * amplitude;
        } else {
          errorStartRef.current = null;
        }
      }

      // ── Dance animation (wiggle) ────────────────────────────────
      let danceWiggle = 0;
      if (animationType === 'dance') {
        danceWiggle = Math.sin(time * 0.01) * 0.3; // radians
      }

      // ── Draw bot ────────────────────────────────────────────────
      drawBot(ctx, botRenderX, botRenderY, cellSize, botRenderAngle,
        idleOffset, errorFlash, shakeOffset, danceWiggle);

      // ── Music note particles ────────────────────────────────────
      if (animationType === 'music' && musicNotesRef.current.length > 0) {
        // Update and draw music notes relative to bot position
        const dt = 1 / 60; // approximate frame time
        for (const note of musicNotesRef.current) {
          // Initialize position near bot if at origin
          if (note.x === 0 && note.y === 0) {
            note.x = botRenderX + (Math.random() - 0.5) * 10;
            note.y = botRenderY;
          }
          note.x += note.vx * dt;
          note.y += note.vy * dt;
          note.opacity -= dt * 0.5;
        }
        musicNotesRef.current = musicNotesRef.current.filter((n) => n.opacity > 0);
        drawMusicNotes(ctx, musicNotesRef.current);
      }

      // ── Confetti burst ──────────────────────────────────────────
      if (confettiStartRef.current !== null) {
        const confettiElapsed = time - confettiStartRef.current;
        const confettiDuration = 3000; // 3 seconds
        if (confettiElapsed < confettiDuration) {
          const dt = 1 / 60;
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          for (const p of confettiRef.current) {
            // Initialize position at center
            if (p.x === 0 && p.y === 0) {
              p.x = centerX;
              p.y = centerY;
            }
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 120 * dt; // gravity
            p.rotation += p.rotationSpeed * dt;
            // Fade out in last second
            if (confettiElapsed > confettiDuration - 1000) {
              p.opacity = Math.max(0, 1 - (confettiElapsed - (confettiDuration - 1000)) / 1000);
            }
          }
          drawConfetti(ctx, confettiRef.current);
        } else {
          confettiRef.current = [];
          confettiStartRef.current = null;
        }
      }

      // Continue animation loop
      animFrameRef.current = requestAnimationFrame(draw);
    },
    [scaling, width, height, cells, botPosition, botDirection, startPosition,
      collectedItems, speed, animationType, errorInfo, goalReached],
  );

  // Start/stop animation loop
  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animFrameRef.current); };
  }, [draw]);

  // Aria label
  const ariaLabel = generateAriaLabel(width, height, botPosition.row, botPosition.col);

  return (
    <div ref={wrapperRef} className={styles.canvasWrapper}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        width={scaling.canvasWidth}
        height={scaling.canvasHeight}
        role="img"
        aria-label={ariaLabel}
      />
      <AccessibilityLayer
        gridSize={gridSize}
        cells={cells}
        botPosition={botPosition}
        botDirection={botDirection}
        startPosition={startPosition}
        collectedItems={collectedItems}
      />
    </div>
  );
};

export default CanvasGridMap;
