import React, { useEffect, useRef } from 'react';

export const CursorGlowBackground: React.FC = () => {
  const glowRef1 = useRef<HTMLDivElement>(null);
  const glowRef2 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Current interpolated positions
    let currentX = window.innerWidth * 0.58;
    let currentY = window.innerHeight * 0.45;
    let targetX = currentX;
    let targetY = currentY;
    let animFrame: number;
    let isMoving = false;

    // Direct hardware-accelerated position update with zero React re-renders
    const updatePosition = () => {
      const dx = targetX - currentX;
      const dy = targetY - currentY;

      // Smooth lerp damping
      currentX += dx * 0.08;
      currentY += dy * 0.08;

      const transformStr = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;

      if (glowRef1.current) {
        glowRef1.current.style.transform = transformStr;
      }
      if (glowRef2.current) {
        glowRef2.current.style.transform = transformStr;
      }

      // If still moving, keep animating; otherwise sleep to save GPU
      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        animFrame = requestAnimationFrame(updatePosition);
      } else {
        isMoving = false;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (!isMoving) {
        isMoving = true;
        animFrame = requestAnimationFrame(updatePosition);
      }
    };

    // Initial render placement
    if (glowRef1.current) {
      glowRef1.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
    }
    if (glowRef2.current) {
      glowRef2.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      cancelAnimationFrame(animFrame);
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
      <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full bg-blue-900/20 blur-[140px]" />
      <div className="absolute top-1/3 -left-20 w-[500px] h-[500px] rounded-full bg-indigo-950/25 blur-[120px]" />

      {/* ── 3. Interactive Cursor-Tracking Ruby/Crimson Radiant Glow (Zero React Re-renders, Pure GPU) ── */}
      {/* Wide atmospheric crimson bloom - using naturally feathered radial gradient for 0ms rasterization */}
      <div
        ref={glowRef1}
        className="absolute top-0 left-0 rounded-full will-change-transform"
        style={{
          width: '780px',
          height: '780px',
          background: 'radial-gradient(circle, rgba(240, 68, 56, 0.45) 0%, rgba(225, 29, 72, 0.25) 35%, rgba(159, 18, 57, 0.08) 60%, transparent 75%)',
        }}
      />

      {/* Intense inner ruby specular core */}
      <div
        ref={glowRef2}
        className="absolute top-0 left-0 rounded-full will-change-transform"
        style={{
          width: '320px',
          height: '320px',
          background: 'radial-gradient(circle, rgba(255, 99, 88, 0.55) 0%, rgba(240, 68, 56, 0.22) 45%, transparent 75%)',
        }}
      />

      {/* ── 4. Fluted / Reeded Vertical Glass Texture Across Viewport ── */}
      <div
        className="absolute inset-0 reeded-glass opacity-75"
        style={{
          backgroundImage: 'repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.032) 0px, rgba(255, 255, 255, 0.032) 1px, transparent 1px, transparent 6px)',
        }}
      />

      {/* ── 5. Luxury Perimeter Vignette ── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(5,9,18,0.75)_100%)]" />
    </div>
  );
};
