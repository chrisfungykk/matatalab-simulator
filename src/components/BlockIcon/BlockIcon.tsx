import type { BlockType } from '../../core/types';
import styles from './BlockIcon.module.css';

export interface BlockIconProps {
  blockType: BlockType;
  size?: number;
  className?: string;
}

function getIcon(blockType: BlockType, size: number): React.ReactNode {
  const s = size;
  const half = s / 2;
  const stroke = Math.max(2, s / 12);

  switch (blockType) {
    // ── Motion blocks ───────────────────────────────────────────
    case 'forward':
      return (
        <g>
          <line x1={half} y1={s * 0.8} x2={half} y2={s * 0.2} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" />
          <polyline points={`${half - s * 0.2},${s * 0.38} ${half},${s * 0.18} ${half + s * 0.2},${s * 0.38}`} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    case 'backward':
      return (
        <g>
          <line x1={half} y1={s * 0.2} x2={half} y2={s * 0.8} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" />
          <polyline points={`${half - s * 0.2},${s * 0.62} ${half},${s * 0.82} ${half + s * 0.2},${s * 0.62}`} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    case 'turn_left':
      return (
        <g>
          <path
            d={`M${s * 0.65},${s * 0.75} L${s * 0.65},${s * 0.4} A${s * 0.2},${s * 0.2} 0 0,0 ${s * 0.35},${s * 0.4}`}
            fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round"
          />
          <polyline points={`${s * 0.48},${s * 0.28} ${s * 0.35},${s * 0.4} ${s * 0.48},${s * 0.52}`} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    case 'turn_right':
      return (
        <g>
          <path
            d={`M${s * 0.35},${s * 0.75} L${s * 0.35},${s * 0.4} A${s * 0.2},${s * 0.2} 0 0,1 ${s * 0.65},${s * 0.4}`}
            fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round"
          />
          <polyline points={`${s * 0.52},${s * 0.28} ${s * 0.65},${s * 0.4} ${s * 0.52},${s * 0.52}`} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );

    // ── Loop blocks ─────────────────────────────────────────────
    case 'loop_begin':
      return (
        <g>
          <path
            d={`M${s * 0.6},${s * 0.25} A${s * 0.25},${s * 0.25} 0 1,0 ${s * 0.6},${s * 0.75}`}
            fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round"
          />
          <polyline points={`${s * 0.48},${s * 0.65} ${s * 0.6},${s * 0.75} ${s * 0.72},${s * 0.65}`} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    case 'loop_end':
      return (
        <g>
          <line x1={s * 0.55} y1={s * 0.2} x2={s * 0.55} y2={s * 0.8} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" />
          <line x1={s * 0.55} y1={s * 0.2} x2={s * 0.4} y2={s * 0.2} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" />
          <line x1={s * 0.55} y1={s * 0.8} x2={s * 0.4} y2={s * 0.8} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" />
        </g>
      );

    // ── Function blocks ─────────────────────────────────────────
    case 'function_define':
      return (
        <g>
          {/* Gear */}
          <circle cx={s * 0.42} cy={s * 0.45} r={s * 0.18} fill="none" stroke="currentColor" strokeWidth={stroke} />
          <circle cx={s * 0.42} cy={s * 0.45} r={s * 0.08} fill="currentColor" />
          {/* Pencil */}
          <line x1={s * 0.62} y1={s * 0.72} x2={s * 0.78} y2={s * 0.28} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" />
          <line x1={s * 0.72} y1={s * 0.32} x2={s * 0.82} y2={s * 0.36} stroke="currentColor" strokeWidth={stroke * 0.8} strokeLinecap="round" />
        </g>
      );
    case 'function_call':
      return (
        <g>
          <polygon
            points={`${s * 0.3},${s * 0.2} ${s * 0.75},${s * 0.5} ${s * 0.3},${s * 0.8}`}
            fill="currentColor"
          />
        </g>
      );

    // ── Number blocks ───────────────────────────────────────────
    case 'number_2':
      return renderDigit('2', s);
    case 'number_3':
      return renderDigit('3', s);
    case 'number_4':
      return renderDigit('4', s);
    case 'number_5':
      return renderDigit('5', s);
    case 'number_random':
      return (
        <g>
          {/* Dice body */}
          <rect x={s * 0.18} y={s * 0.18} width={s * 0.64} height={s * 0.64} rx={s * 0.08} fill="none" stroke="currentColor" strokeWidth={stroke} />
          {/* Dots */}
          <circle cx={s * 0.35} cy={s * 0.35} r={s * 0.05} fill="currentColor" />
          <circle cx={s * 0.65} cy={s * 0.35} r={s * 0.05} fill="currentColor" />
          <circle cx={s * 0.5} cy={s * 0.5} r={s * 0.05} fill="currentColor" />
          <circle cx={s * 0.35} cy={s * 0.65} r={s * 0.05} fill="currentColor" />
          <circle cx={s * 0.65} cy={s * 0.65} r={s * 0.05} fill="currentColor" />
        </g>
      );

    // ── Fun blocks ──────────────────────────────────────────────
    case 'fun_random_move':
      return (
        <g>
          {/* Right arrow */}
          <line x1={s * 0.2} y1={s * 0.38} x2={s * 0.7} y2={s * 0.38} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" />
          <polyline points={`${s * 0.58},${s * 0.28} ${s * 0.7},${s * 0.38} ${s * 0.58},${s * 0.48}`} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
          {/* Left arrow */}
          <line x1={s * 0.8} y1={s * 0.62} x2={s * 0.3} y2={s * 0.62} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" />
          <polyline points={`${s * 0.42},${s * 0.52} ${s * 0.3},${s * 0.62} ${s * 0.42},${s * 0.72}`} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    case 'fun_music':
      return (
        <g>
          {/* Note stem */}
          <line x1={s * 0.58} y1={s * 0.22} x2={s * 0.58} y2={s * 0.68} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" />
          {/* Note head */}
          <ellipse cx={s * 0.45} cy={s * 0.72} rx={s * 0.14} ry={s * 0.1} fill="currentColor" transform={`rotate(-20,${s * 0.45},${s * 0.72})`} />
          {/* Flag */}
          <path d={`M${s * 0.58},${s * 0.22} Q${s * 0.78},${s * 0.32} ${s * 0.58},${s * 0.42}`} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" />
        </g>
      );
    case 'fun_dance':
      return (
        <g>
          {/* Head */}
          <circle cx={half} cy={s * 0.22} r={s * 0.1} fill="currentColor" />
          {/* Body */}
          <line x1={half} y1={s * 0.32} x2={half} y2={s * 0.58} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" />
          {/* Arms raised */}
          <line x1={half} y1={s * 0.4} x2={s * 0.28} y2={s * 0.28} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" />
          <line x1={half} y1={s * 0.4} x2={s * 0.72} y2={s * 0.28} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" />
          {/* Legs */}
          <line x1={half} y1={s * 0.58} x2={s * 0.32} y2={s * 0.82} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" />
          <line x1={half} y1={s * 0.58} x2={s * 0.68} y2={s * 0.82} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" />
        </g>
      );
  }
}

function renderDigit(digit: string, s: number): React.ReactNode {
  return (
    <text
      x={s / 2}
      y={s / 2}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={s * 0.6}
      fontWeight="bold"
      fill="currentColor"
      fontFamily="'Nunito', sans-serif"
    >
      {digit}
    </text>
  );
}

export function BlockIcon({ blockType, size = 24, className }: BlockIconProps) {
  return (
    <svg
      data-testid="block-icon"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`${styles.blockIcon}${className ? ` ${className}` : ''}`}
      aria-hidden="true"
    >
      {getIcon(blockType, size)}
    </svg>
  );
}

export default BlockIcon;
