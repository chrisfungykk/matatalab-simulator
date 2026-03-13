import type { Direction } from '../../core/types';
import styles from './BotSVG.module.css';

export interface BotSVGProps {
  direction: Direction;
  isIdle: boolean;
  isError: boolean;
  animationType?: 'music' | 'dance';
  className?: string;
}

const DIRECTION_DEGREES: Record<Direction, number> = {
  north: 0,
  east: 90,
  south: 180,
  west: 270,
};

export function BotSVG({ direction, isIdle, isError, animationType, className }: BotSVGProps) {
  const degrees = DIRECTION_DEGREES[direction];

  const classNames = [styles.botSvg];
  if (isIdle && !isError && !animationType) classNames.push(styles.botIdle);
  if (isError) classNames.push(styles.botError);
  if (animationType === 'music') classNames.push(styles.botMusic);
  if (animationType === 'dance') classNames.push(styles.botDance);
  if (className) classNames.push(className);

  return (
    <svg
      data-testid="bot-svg"
      width="48"
      height="48"
      viewBox="0 0 48 48"
      className={classNames.join(' ')}
      style={{ transform: `rotate(${degrees}deg)` }}
      aria-label="MatataBot"
      role="img"
    >
      {/* Car body */}
      <rect
        className={styles.botBody}
        x="10"
        y="14"
        width="28"
        height="20"
        rx="6"
        ry="6"
        fill="#4FC3F7"
        stroke="#0288D1"
        strokeWidth="1.5"
      />

      {/* Windshield */}
      <rect
        x="14"
        y="10"
        width="20"
        height="10"
        rx="4"
        ry="4"
        fill="#E1F5FE"
        stroke="#0288D1"
        strokeWidth="1"
      />

      {/* Left eye */}
      <circle cx="19" cy="15" r="2.5" fill="#1A237E" />
      <circle cx="19.8" cy="14.2" r="0.8" fill="#fff" />

      {/* Right eye */}
      <circle cx="29" cy="15" r="2.5" fill="#1A237E" />
      <circle cx="29.8" cy="14.2" r="0.8" fill="#fff" />

      {/* Smile */}
      <path
        d="M20 19 Q24 22 28 19"
        fill="none"
        stroke="#1A237E"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Left wheel */}
      <rect x="7" y="26" width="6" height="8" rx="2" ry="2" fill="#455A64" stroke="#263238" strokeWidth="1" />

      {/* Right wheel */}
      <rect x="35" y="26" width="6" height="8" rx="2" ry="2" fill="#455A64" stroke="#263238" strokeWidth="1" />

      {/* Antenna */}
      <line x1="24" y1="10" x2="24" y2="5" stroke="#0288D1" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="24" cy="4" r="2" fill="#FF7043" />

      {/* Music notes (visible only during music animation) */}
      {animationType === 'music' && (
        <g className={styles.musicNote}>
          <text x="36" y="10" fontSize="8" fill="#FF7043" aria-hidden="true">♪</text>
          <text x="8" y="12" fontSize="6" fill="#FF7043" aria-hidden="true">♫</text>
        </g>
      )}
    </svg>
  );
}

export default BotSVG;
