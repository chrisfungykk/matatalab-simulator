import React from 'react';

export interface StarRatingProps {
  difficulty: 'easy' | 'medium' | 'hard';
}

const Star: React.FC = () => (
  <svg
    data-testid="star"
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="#FFD700"
    stroke="#E6AC00"
    strokeWidth="1"
    strokeLinejoin="round"
    style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}
    aria-hidden="true"
  >
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
  </svg>
);

const Trophy: React.FC = () => (
  <svg
    data-testid="trophy"
    width="36"
    height="36"
    viewBox="0 0 32 32"
    fill="none"
    style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}
    aria-hidden="true"
  >
    {/* Cup body */}
    <path
      d="M10 6h12v10c0 3.314-2.686 6-6 6s-6-2.686-6-6V6z"
      fill="#FFD700"
      stroke="#E6AC00"
      strokeWidth="1"
    />
    {/* Left handle */}
    <path
      d="M10 8H7c-1.657 0-3 1.343-3 3s1.343 3 3 3h3"
      fill="none"
      stroke="#E6AC00"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    {/* Right handle */}
    <path
      d="M22 8h3c1.657 0 3 1.343 3 3s-1.343 3-3 3h-3"
      fill="none"
      stroke="#E6AC00"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    {/* Base stem */}
    <rect x="14" y="22" width="4" height="3" fill="#E6AC00" rx="1" />
    {/* Base plate */}
    <rect x="10" y="25" width="12" height="2" fill="#E6AC00" rx="1" />
  </svg>
);

/**
 * Displays a star rating based on challenge difficulty.
 * easy → 1 star, medium → 2 stars, hard → 3 stars + trophy.
 */
const StarRating: React.FC<StarRatingProps> = ({ difficulty }) => {
  const starCount = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;

  return (
    <div
      data-testid="star-rating"
      aria-label={`Difficulty: ${difficulty} — ${starCount} star${starCount > 1 ? 's' : ''}${difficulty === 'hard' ? ' and trophy' : ''}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      {Array.from({ length: starCount }, (_, i) => (
        <Star key={i} />
      ))}
      {difficulty === 'hard' && <Trophy />}
    </div>
  );
};

export default StarRating;
