import type { BlockType } from '../../core/types';
import styles from './BlockIcon.module.css';

export interface BlockIconProps {
  blockType: BlockType;
  size?: number;
  className?: string;
}

// ── Category color scheme (increased saturation, softer gradients) ───
const CATEGORY_COLORS = {
  motion: { fill: '#42a5f5', stroke: '#1565c0' },
  loop: { fill: '#fdd835', stroke: '#f9a825' },
  function: { fill: '#66bb6a', stroke: '#2e7d32' },
  number: { fill: '#ab47bc', stroke: '#6a1b9a' },
  fun: { fill: '#ffa726', stroke: '#e65100' },
} as const;

type Category = keyof typeof CATEGORY_COLORS;

function getCategory(blockType: BlockType): Category {
  if (blockType.startsWith('forward') || blockType.startsWith('backward') || blockType.startsWith('turn_'))
    return 'motion';
  if (blockType.startsWith('loop_')) return 'loop';
  if (blockType.startsWith('function_')) return 'function';
  if (blockType.startsWith('number_')) return 'number';
  return 'fun';
}

/** Small smiling face helper (two dot eyes + curved smile) */
function smileyFace(cx: number, cy: number, r: number, strokeColor: string) {
  const eyeR = r * 0.15;
  const eyeOffX = r * 0.35;
  const eyeOffY = r * 0.2;
  return (
    <g>
      <circle cx={cx - eyeOffX} cy={cy - eyeOffY} r={eyeR} fill={strokeColor} />
      <circle cx={cx + eyeOffX} cy={cy - eyeOffY} r={eyeR} fill={strokeColor} />
      <path
        d={`M${cx - r * 0.3},${cy + r * 0.15} Q${cx},${cy + r * 0.55} ${cx + r * 0.3},${cy + r * 0.15}`}
        fill="none"
        stroke={strokeColor}
        strokeWidth={Math.max(1, r * 0.15)}
        strokeLinecap="round"
      />
    </g>
  );
}

function getIcon(blockType: BlockType, size: number): React.ReactNode {
  const s = size;
  const half = s / 2;
  const stroke = Math.max(2, s / 12);
  const cat = getCategory(blockType);
  const { fill, stroke: strokeColor } = CATEGORY_COLORS[cat];

  switch (blockType) {
    // ── Motion blocks (cartoon arrows with smiling faces) ───────
    case 'forward':
      return (
        <g>
          <defs>
            <linearGradient id={`grad-fwd-${s}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#90caf9" />
              <stop offset="100%" stopColor={fill} />
            </linearGradient>
          </defs>
          {/* Rounded arrow body */}
          <rect x={half - s * 0.12} y={s * 0.35} width={s * 0.24} height={s * 0.45} rx={s * 0.06} fill={`url(#grad-fwd-${s})`} stroke={strokeColor} strokeWidth={stroke} />
          {/* Arrow head */}
          <polygon
            points={`${half},${s * 0.12} ${half - s * 0.28},${s * 0.42} ${half + s * 0.28},${s * 0.42}`}
            fill={`url(#grad-fwd-${s})`}
            stroke={strokeColor}
            strokeWidth={stroke}
            strokeLinejoin="round"
          />
          {/* Smiling face on arrow head */}
          {smileyFace(half, s * 0.3, s * 0.14, strokeColor)}
        </g>
      );
    case 'backward':
      return (
        <g>
          <defs>
            <linearGradient id={`grad-bwd-${s}`} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#90caf9" />
              <stop offset="100%" stopColor={fill} />
            </linearGradient>
          </defs>
          <rect x={half - s * 0.12} y={s * 0.2} width={s * 0.24} height={s * 0.45} rx={s * 0.06} fill={`url(#grad-bwd-${s})`} stroke={strokeColor} strokeWidth={stroke} />
          <polygon
            points={`${half},${s * 0.88} ${half - s * 0.28},${s * 0.58} ${half + s * 0.28},${s * 0.58}`}
            fill={`url(#grad-bwd-${s})`}
            stroke={strokeColor}
            strokeWidth={stroke}
            strokeLinejoin="round"
          />
          {smileyFace(half, s * 0.7, s * 0.14, strokeColor)}
        </g>
      );
    case 'turn_left':
      return (
        <g>
          <defs>
            <linearGradient id={`grad-tl-${s}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#90caf9" />
              <stop offset="100%" stopColor={fill} />
            </linearGradient>
          </defs>
          {/* Curved arrow */}
          <path
            d={`M${s * 0.7},${s * 0.72} L${s * 0.7},${s * 0.42} A${s * 0.25},${s * 0.25} 0 0,0 ${s * 0.3},${s * 0.42}`}
            fill="none"
            stroke={`url(#grad-tl-${s})`}
            strokeWidth={stroke * 2.5}
            strokeLinecap="round"
          />
          <path
            d={`M${s * 0.7},${s * 0.72} L${s * 0.7},${s * 0.42} A${s * 0.25},${s * 0.25} 0 0,0 ${s * 0.3},${s * 0.42}`}
            fill="none"
            stroke={strokeColor}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          {/* Arrowhead */}
          <polygon
            points={`${s * 0.18},${s * 0.42} ${s * 0.38},${s * 0.28} ${s * 0.38},${s * 0.56}`}
            fill={fill}
            stroke={strokeColor}
            strokeWidth={stroke}
            strokeLinejoin="round"
          />
          {/* Friendly face on curve */}
          {smileyFace(s * 0.5, s * 0.32, s * 0.1, strokeColor)}
        </g>
      );
    case 'turn_right':
      return (
        <g>
          <defs>
            <linearGradient id={`grad-tr-${s}`} x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#90caf9" />
              <stop offset="100%" stopColor={fill} />
            </linearGradient>
          </defs>
          <path
            d={`M${s * 0.3},${s * 0.72} L${s * 0.3},${s * 0.42} A${s * 0.25},${s * 0.25} 0 0,1 ${s * 0.7},${s * 0.42}`}
            fill="none"
            stroke={`url(#grad-tr-${s})`}
            strokeWidth={stroke * 2.5}
            strokeLinecap="round"
          />
          <path
            d={`M${s * 0.3},${s * 0.72} L${s * 0.3},${s * 0.42} A${s * 0.25},${s * 0.25} 0 0,1 ${s * 0.7},${s * 0.42}`}
            fill="none"
            stroke={strokeColor}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          <polygon
            points={`${s * 0.82},${s * 0.42} ${s * 0.62},${s * 0.28} ${s * 0.62},${s * 0.56}`}
            fill={fill}
            stroke={strokeColor}
            strokeWidth={stroke}
            strokeLinejoin="round"
          />
          {smileyFace(s * 0.5, s * 0.32, s * 0.1, strokeColor)}
        </g>
      );

    // ── Loop blocks (circular arrow with face, bracket) ─────────
    case 'loop_begin':
      return (
        <g>
          <defs>
            <linearGradient id={`grad-lb-${s}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fff176" />
              <stop offset="100%" stopColor={fill} />
            </linearGradient>
          </defs>
          {/* Circular arrow */}
          <path
            d={`M${s * 0.62},${s * 0.25} A${s * 0.25},${s * 0.25} 0 1,0 ${s * 0.62},${s * 0.75}`}
            fill="none"
            stroke={`url(#grad-lb-${s})`}
            strokeWidth={stroke * 2}
            strokeLinecap="round"
          />
          <path
            d={`M${s * 0.62},${s * 0.25} A${s * 0.25},${s * 0.25} 0 1,0 ${s * 0.62},${s * 0.75}`}
            fill="none"
            stroke={strokeColor}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          {/* Arrowhead at end */}
          <polygon
            points={`${s * 0.5},${s * 0.65} ${s * 0.62},${s * 0.78} ${s * 0.74},${s * 0.65}`}
            fill={fill}
            stroke={strokeColor}
            strokeWidth={stroke}
            strokeLinejoin="round"
          />
          {/* Friendly face in center */}
          {smileyFace(s * 0.42, s * 0.5, s * 0.12, strokeColor)}
        </g>
      );
    case 'loop_end':
      return (
        <g>
          <defs>
            <linearGradient id={`grad-le-${s}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff176" />
              <stop offset="100%" stopColor={fill} />
            </linearGradient>
          </defs>
          {/* Rounded bracket */}
          <path
            d={`M${s * 0.42},${s * 0.15} Q${s * 0.62},${s * 0.15} ${s * 0.62},${s * 0.3} L${s * 0.62},${s * 0.7} Q${s * 0.62},${s * 0.85} ${s * 0.42},${s * 0.85}`}
            fill="none"
            stroke={`url(#grad-le-${s})`}
            strokeWidth={stroke * 2}
            strokeLinecap="round"
          />
          <path
            d={`M${s * 0.42},${s * 0.15} Q${s * 0.62},${s * 0.15} ${s * 0.62},${s * 0.3} L${s * 0.62},${s * 0.7} Q${s * 0.62},${s * 0.85} ${s * 0.42},${s * 0.85}`}
            fill="none"
            stroke={strokeColor}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          {/* Small dots for decoration */}
          <circle cx={s * 0.35} cy={s * 0.35} r={s * 0.04} fill={strokeColor} />
          <circle cx={s * 0.35} cy={s * 0.65} r={s * 0.04} fill={strokeColor} />
        </g>
      );

    // ── Function blocks (magic wand / play-button star) ─────────
    case 'function_define':
      return (
        <g>
          <defs>
            <linearGradient id={`grad-fd-${s}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#a5d6a7" />
              <stop offset="100%" stopColor={fill} />
            </linearGradient>
          </defs>
          {/* Magic wand */}
          <line
            x1={s * 0.25} y1={s * 0.75}
            x2={s * 0.65} y2={s * 0.35}
            stroke={`url(#grad-fd-${s})`}
            strokeWidth={stroke * 2}
            strokeLinecap="round"
          />
          <line
            x1={s * 0.25} y1={s * 0.75}
            x2={s * 0.65} y2={s * 0.35}
            stroke={strokeColor}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          {/* Sparkle stars */}
          <polygon
            points={`${s * 0.72},${s * 0.2} ${s * 0.75},${s * 0.14} ${s * 0.78},${s * 0.2} ${s * 0.84},${s * 0.23} ${s * 0.78},${s * 0.26} ${s * 0.75},${s * 0.32} ${s * 0.72},${s * 0.26} ${s * 0.66},${s * 0.23}`}
            fill={fill}
            stroke={strokeColor}
            strokeWidth={stroke * 0.5}
          />
          <polygon
            points={`${s * 0.5},${s * 0.18} ${s * 0.52},${s * 0.14} ${s * 0.54},${s * 0.18} ${s * 0.58},${s * 0.2} ${s * 0.54},${s * 0.22} ${s * 0.52},${s * 0.26} ${s * 0.5},${s * 0.22} ${s * 0.46},${s * 0.2}`}
            fill={fill}
            stroke={strokeColor}
            strokeWidth={stroke * 0.4}
          />
          {/* Small sparkle */}
          <circle cx={s * 0.82} cy={s * 0.42} r={s * 0.03} fill={fill} />
        </g>
      );
    case 'function_call':
      return (
        <g>
          <defs>
            <linearGradient id={`grad-fc-${s}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#a5d6a7" />
              <stop offset="100%" stopColor={fill} />
            </linearGradient>
          </defs>
          {/* Play button triangle */}
          <polygon
            points={`${s * 0.28},${s * 0.2} ${s * 0.78},${s * 0.5} ${s * 0.28},${s * 0.8}`}
            fill={`url(#grad-fc-${s})`}
            stroke={strokeColor}
            strokeWidth={stroke}
            strokeLinejoin="round"
          />
          {/* Star overlay */}
          <polygon
            points={`${s * 0.48},${s * 0.35} ${s * 0.52},${s * 0.42} ${s * 0.6},${s * 0.42} ${s * 0.54},${s * 0.48} ${s * 0.56},${s * 0.56} ${s * 0.48},${s * 0.52} ${s * 0.4},${s * 0.56} ${s * 0.42},${s * 0.48} ${s * 0.36},${s * 0.42} ${s * 0.44},${s * 0.42}`}
            fill="#fff"
            opacity={0.8}
          />
        </g>
      );

    // ── Number blocks (bubbly digits, bouncing dice) ────────────
    case 'number_2':
      return renderBubblyDigit('2', s, fill, strokeColor);
    case 'number_3':
      return renderBubblyDigit('3', s, fill, strokeColor);
    case 'number_4':
      return renderBubblyDigit('4', s, fill, strokeColor);
    case 'number_5':
      return renderBubblyDigit('5', s, fill, strokeColor);
    case 'number_random':
      return (
        <g>
          <defs>
            <linearGradient id={`grad-nr-${s}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ce93d8" />
              <stop offset="100%" stopColor={fill} />
            </linearGradient>
          </defs>
          {/* Dice body - tilted for bouncing effect */}
          <rect
            x={s * 0.18} y={s * 0.18}
            width={s * 0.64} height={s * 0.64}
            rx={s * 0.12}
            fill={`url(#grad-nr-${s})`}
            stroke={strokeColor}
            strokeWidth={stroke}
            transform={`rotate(-8,${half},${half})`}
          />
          {/* Dice dots */}
          <circle cx={s * 0.35} cy={s * 0.35} r={s * 0.06} fill="#fff" />
          <circle cx={s * 0.65} cy={s * 0.35} r={s * 0.06} fill="#fff" />
          <circle cx={s * 0.5} cy={s * 0.5} r={s * 0.06} fill="#fff" />
          <circle cx={s * 0.35} cy={s * 0.65} r={s * 0.06} fill="#fff" />
          <circle cx={s * 0.65} cy={s * 0.65} r={s * 0.06} fill="#fff" />
          {/* Bounce lines */}
          <line x1={s * 0.15} y1={s * 0.88} x2={s * 0.3} y2={s * 0.88} stroke={strokeColor} strokeWidth={stroke * 0.6} strokeLinecap="round" />
          <line x1={s * 0.7} y1={s * 0.88} x2={s * 0.85} y2={s * 0.88} stroke={strokeColor} strokeWidth={stroke * 0.6} strokeLinecap="round" />
        </g>
      );

    // ── Fun blocks (musical note, dancing figure, question arrow) ─
    case 'fun_music':
      return (
        <g>
          <defs>
            <linearGradient id={`grad-fm-${s}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffcc80" />
              <stop offset="100%" stopColor={fill} />
            </linearGradient>
          </defs>
          {/* Note stem */}
          <line x1={s * 0.58} y1={s * 0.22} x2={s * 0.58} y2={s * 0.68} stroke={strokeColor} strokeWidth={stroke} strokeLinecap="round" />
          {/* Note head */}
          <ellipse
            cx={s * 0.45} cy={s * 0.72}
            rx={s * 0.14} ry={s * 0.1}
            fill={`url(#grad-fm-${s})`}
            stroke={strokeColor}
            strokeWidth={stroke}
            transform={`rotate(-20,${s * 0.45},${s * 0.72})`}
          />
          {/* Flag */}
          <path
            d={`M${s * 0.58},${s * 0.22} Q${s * 0.78},${s * 0.32} ${s * 0.58},${s * 0.42}`}
            fill="none"
            stroke={strokeColor}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          {/* Sparkle dots */}
          <circle cx={s * 0.75} cy={s * 0.18} r={s * 0.035} fill={fill} />
          <circle cx={s * 0.82} cy={s * 0.3} r={s * 0.025} fill={fill} />
          <circle cx={s * 0.28} cy={s * 0.28} r={s * 0.03} fill={fill} />
        </g>
      );
    case 'fun_dance':
      return (
        <g>
          <defs>
            <linearGradient id={`grad-fda-${s}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffcc80" />
              <stop offset="100%" stopColor={fill} />
            </linearGradient>
          </defs>
          {/* Head */}
          <circle cx={half} cy={s * 0.2} r={s * 0.1} fill={`url(#grad-fda-${s})`} stroke={strokeColor} strokeWidth={stroke} />
          {/* Body */}
          <line x1={half} y1={s * 0.3} x2={half} y2={s * 0.58} stroke={strokeColor} strokeWidth={stroke} strokeLinecap="round" />
          {/* Arms raised in dance pose */}
          <line x1={half} y1={s * 0.38} x2={s * 0.25} y2={s * 0.25} stroke={strokeColor} strokeWidth={stroke} strokeLinecap="round" />
          <line x1={half} y1={s * 0.38} x2={s * 0.75} y2={s * 0.25} stroke={strokeColor} strokeWidth={stroke} strokeLinecap="round" />
          {/* Legs in dance pose */}
          <line x1={half} y1={s * 0.58} x2={s * 0.3} y2={s * 0.82} stroke={strokeColor} strokeWidth={stroke} strokeLinecap="round" />
          <line x1={half} y1={s * 0.58} x2={s * 0.7} y2={s * 0.82} stroke={strokeColor} strokeWidth={stroke} strokeLinecap="round" />
          {/* Motion lines */}
          <line x1={s * 0.15} y1={s * 0.35} x2={s * 0.08} y2={s * 0.3} stroke={fill} strokeWidth={stroke * 0.6} strokeLinecap="round" />
          <line x1={s * 0.85} y1={s * 0.35} x2={s * 0.92} y2={s * 0.3} stroke={fill} strokeWidth={stroke * 0.6} strokeLinecap="round" />
          <line x1={s * 0.18} y1={s * 0.7} x2={s * 0.1} y2={s * 0.72} stroke={fill} strokeWidth={stroke * 0.6} strokeLinecap="round" />
        </g>
      );
    case 'fun_random_move':
      return (
        <g>
          <defs>
            <linearGradient id={`grad-frm-${s}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffcc80" />
              <stop offset="100%" stopColor={fill} />
            </linearGradient>
          </defs>
          {/* Question mark */}
          <path
            d={`M${s * 0.35},${s * 0.3} Q${s * 0.35},${s * 0.15} ${s * 0.5},${s * 0.15} Q${s * 0.65},${s * 0.15} ${s * 0.65},${s * 0.3} Q${s * 0.65},${s * 0.42} ${s * 0.5},${s * 0.45}`}
            fill="none"
            stroke={strokeColor}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          <circle cx={s * 0.5} cy={s * 0.55} r={s * 0.035} fill={strokeColor} />
          {/* Directional arrows around question mark */}
          <line x1={s * 0.15} y1={s * 0.5} x2={s * 0.08} y2={s * 0.5} stroke={fill} strokeWidth={stroke} strokeLinecap="round" />
          <polyline points={`${s * 0.12},${s * 0.45} ${s * 0.08},${s * 0.5} ${s * 0.12},${s * 0.55}`} fill="none" stroke={fill} strokeWidth={stroke * 0.7} strokeLinecap="round" strokeLinejoin="round" />
          <line x1={s * 0.85} y1={s * 0.5} x2={s * 0.92} y2={s * 0.5} stroke={fill} strokeWidth={stroke} strokeLinecap="round" />
          <polyline points={`${s * 0.88},${s * 0.45} ${s * 0.92},${s * 0.5} ${s * 0.88},${s * 0.55}`} fill="none" stroke={fill} strokeWidth={stroke * 0.7} strokeLinecap="round" strokeLinejoin="round" />
          {/* Down arrow */}
          <line x1={s * 0.5} y1={s * 0.68} x2={s * 0.5} y2={s * 0.88} stroke={fill} strokeWidth={stroke} strokeLinecap="round" />
          <polyline points={`${s * 0.45},${s * 0.82} ${s * 0.5},${s * 0.88} ${s * 0.55},${s * 0.82}`} fill="none" stroke={fill} strokeWidth={stroke * 0.7} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
  }
}

/** Render a bubbly digit with rounded background and shadow */
function renderBubblyDigit(digit: string, s: number, fill: string, strokeColor: string): React.ReactNode {
  return (
    <g>
      <defs>
        <linearGradient id={`grad-num-${digit}-${s}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ce93d8" />
          <stop offset="100%" stopColor={fill} />
        </linearGradient>
      </defs>
      {/* Bubbly background circle */}
      <circle
        cx={s / 2} cy={s / 2} r={s * 0.38}
        fill={`url(#grad-num-${digit}-${s})`}
        stroke={strokeColor}
        strokeWidth={Math.max(2, s / 12)}
      />
      {/* Highlight bubble */}
      <ellipse
        cx={s * 0.4} cy={s * 0.35}
        rx={s * 0.1} ry={s * 0.06}
        fill="#fff"
        opacity={0.4}
      />
      {/* Digit */}
      <text
        x={s / 2}
        y={s / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={s * 0.48}
        fontWeight="bold"
        fill="#fff"
        fontFamily="'Nunito', sans-serif"
        stroke={strokeColor}
        strokeWidth={s * 0.02}
      >
        {digit}
      </text>
    </g>
  );
}

export function BlockIcon({ blockType, size = 32, className }: BlockIconProps) {
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
