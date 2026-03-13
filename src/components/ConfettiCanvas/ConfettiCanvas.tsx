import React, { useRef, useEffect, useCallback } from 'react';

export interface ConfettiCanvasProps {
  active: boolean;
  duration?: number;      // default 3000ms
  particleCount?: number; // default 80
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
}

const CONFETTI_COLORS = [
  '#e53935', // red
  '#1e88e5', // blue
  '#43a047', // green
  '#fdd835', // yellow
  '#fb8c00', // orange
  '#e91e63', // pink
  '#8e24aa', // purple
];

/**
 * Lightweight canvas-based confetti particle burst.
 * Renders colored rectangles with gravity and random velocity for 2–4 seconds.
 */
const ConfettiCanvas: React.FC<ConfettiCanvasProps> = ({
  active,
  duration = 3000,
  particleCount = 80,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const startTimeRef = useRef<number>(0);

  const createParticles = useCallback(
    (canvasWidth: number, canvasHeight: number): Particle[] => {
      const particles: Particle[] = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: canvasWidth * (0.2 + Math.random() * 0.6),
          y: canvasHeight * (0.1 + Math.random() * 0.3),
          vx: (Math.random() - 0.5) * 8,
          vy: -(Math.random() * 6 + 2),
          width: 4 + Math.random() * 4,   // 4–8px
          height: 4 + Math.random() * 4,  // 4–8px
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.2,
        });
      }
      return particles;
    },
    [particleCount],
  );

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Size canvas to its container
    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    resize();

    particlesRef.current = createParticles(canvas.width, canvas.height);
    startTimeRef.current = performance.now();

    const gravity = 0.15;

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      if (elapsed > duration) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particlesRef.current) {
        p.vy += gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        // Fade out in the last 30% of duration
        const fadeStart = duration * 0.7;
        const alpha = elapsed > fadeStart
          ? 1 - (elapsed - fadeStart) / (duration - fadeStart)
          : 1;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [active, duration, createParticles]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      data-testid="confetti-canvas"
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  );
};

export default ConfettiCanvas;
