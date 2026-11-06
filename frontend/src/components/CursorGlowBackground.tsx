import React, { useEffect, useRef, useState } from 'react';

export const CursorGlowBackground: React.FC = () => {
  // Initial position centered on the middle-right just like the Tidewell reference screenshot
  const [pos, setPos] = useState({
    x: typeof window !== 'undefined' ? window.innerWidth * 0.58 : 800,
    y: typeof window !== 'undefined' ? window.innerHeight * 0.45 : 400,
  });

  const targetRef = useRef({
    x: typeof window !== 'undefined' ? window.innerWidth * 0.58 : 800,
    y: typeof window !== 'undefined' ? window.innerHeight * 0.45 : 400,
  });

  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
    };

    const animate = () => {
      setPos((prev) => {
        const dx = targetRef.current.x - prev.x;
        const dy = targetRef.current.y - prev.y;
        // Smooth lerp damping for silky momentum
        if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) {
          animFrameRef.current = requestAnimationFrame(animate);
          return prev;
        }
        return {
          x: prev.x + dx * 0.075,
          y: prev.y + dy * 0.075,
        };
      });
      animFrameRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* ── 1. Deep Midnight Slate/Navy Base ── */}
      <div className="absolute inset-0 bg-[#080d19]" />

      {/* ── 2. Top-Left Sapphire Aurora for Dual-Tone Ambient Depth ── */}
      <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full bg-blue-900/20 blur-[160px]" />
      <div className="absolute top-1/3 -left-20 w-[500px] h-[500px] rounded-full bg-indigo-950/30 blur-[140px]" />

      {/* ── 3. Interactive Cursor-Tracking Ruby/Crimson Radiant Glow ── */}
      {/* Wide atmospheric crimson bloom */}
      <div
        className="absolute rounded-full will-change-transform"
        style={{
          width: '850px',
          height: '850px',
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(240, 68, 56, 0.48) 0%, rgba(225, 29, 72, 0.28) 32%, rgba(159, 18, 57, 0.10) 60%, transparent 75%)',
          filter: 'blur(35px)',
        }}
      />

      {/* Intense inner ruby specular core */}
      <div
        className="absolute rounded-full will-change-transform"
        style={{
          width: '380px',
          height: '380px',
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(255, 99, 88, 0.55) 0%, rgba(240, 68, 56, 0.25) 45%, transparent 75%)',
          filter: 'blur(18px)',
        }}
      />

      {/* ── 4. Fluted / Reeded Vertical Glass Texture Across Viewport ── */}
      <div
        className="absolute inset-0 reeded-glass opacity-75"
        style={{
          backgroundImage: 'repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.035) 0px, rgba(255, 255, 255, 0.035) 1px, transparent 1px, transparent 6px)',
        }}
      />

      {/* ── 5. Luxury Perimeter Vignette ── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(5,9,18,0.75)_100%)]" />
    </div>
  );
};
