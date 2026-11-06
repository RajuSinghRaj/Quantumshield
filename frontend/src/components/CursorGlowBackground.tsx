import React, { useEffect, useRef } from 'react';

export const CursorGlowBackground: React.FC = () => {
  const pillarRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const flareRef = useRef<HTMLDivElement>(null);

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

      // Smooth lerp damping for silky fluid momentum
      currentX += dx * 0.075;
      currentY += dy * 0.075;

      const transformStr = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%) rotate(-3deg)`;

      if (pillarRef.current) {
        pillarRef.current.style.transform = transformStr;
      }
      if (coreRef.current) {
        coreRef.current.style.transform = transformStr;
      }
      if (flareRef.current) {
        flareRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
      }

      // If still moving, keep animating; otherwise sleep to save GPU cycles
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
    const initTransform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%) rotate(-3deg)`;
    if (pillarRef.current) pillarRef.current.style.transform = initTransform;
    if (coreRef.current) coreRef.current.style.transform = initTransform;
    if (flareRef.current) flareRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;

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

      {/* ── 3. WHITE-GRAYISH SMOKE & VAPOR LAYERS (TIDEWELL ATMOSPHERE) ── */}
      {/* Primary White-Gray Smoke Cloud (Upper Left / Center) */}
      <div
        className="absolute smoke-cloud-1 pointer-events-none"
        style={{
          width: '950px',
          height: '650px',
          left: '12%',
          top: '8%',
          background: 'radial-gradient(ellipse 480px 320px at 50% 50%, rgba(225, 232, 245, 0.16) 0%, rgba(185, 198, 220, 0.09) 45%, rgba(140, 155, 185, 0.03) 70%, transparent 85%)',
        }}
      />

      {/* Secondary Drifting Smoke Plume (Lower Left / Under Headline) */}
      <div
        className="absolute smoke-cloud-2 pointer-events-none"
        style={{
          width: '800px',
          height: '520px',
          left: '2%',
          top: '32%',
          background: 'radial-gradient(ellipse 400px 260px at 50% 50%, rgba(240, 244, 255, 0.13) 0%, rgba(195, 205, 225, 0.07) 50%, transparent 80%)',
        }}
      />

      {/* Center Subtle Milky Mist Wash */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: '1100px',
          height: '750px',
          left: '20%',
          top: '20%',
          background: 'radial-gradient(ellipse 550px 380px at 50% 50%, rgba(215, 225, 242, 0.08) 0%, rgba(160, 175, 205, 0.03) 60%, transparent 85%)',
        }}
      />

      {/* ── 4. VERTICAL RADIANT CRIMSON AURORA PILLAR (NO LONGER A ROUND BALL) ── */}
      {/* Wide Vertical Aurora Pillar Curtain (Tall Elliptical Ribbon) */}
      <div
        ref={pillarRef}
        className="absolute top-0 left-0 will-change-transform pointer-events-none"
        style={{
          width: '560px',
          height: '1350px',
          background: 'radial-gradient(ellipse 280px 680px at 50% 50%, rgba(240, 68, 56, 0.46) 0%, rgba(225, 29, 72, 0.25) 38%, rgba(159, 18, 57, 0.08) 65%, transparent 85%)',
        }}
      />

      {/* Focused Inner Scarlet Light Column (Vertical Specular Beam) */}
      <div
        ref={coreRef}
        className="absolute top-0 left-0 will-change-transform pointer-events-none"
        style={{
          width: '240px',
          height: '920px',
          background: 'radial-gradient(ellipse 120px 460px at 50% 50%, rgba(255, 95, 82, 0.58) 0%, rgba(240, 68, 56, 0.24) 48%, transparent 80%)',
        }}
      />

      {/* Anamorphic Horizontal Lens Flare Cross-Dispersion */}
      <div
        ref={flareRef}
        className="absolute top-0 left-0 will-change-transform pointer-events-none"
        style={{
          width: '850px',
          height: '240px',
          background: 'radial-gradient(ellipse 425px 120px at 50% 50%, rgba(240, 68, 56, 0.16) 0%, rgba(225, 29, 72, 0.06) 50%, transparent 75%)',
        }}
      />

      {/* ── 5. Fluted / Reeded Vertical Glass Texture Across Viewport ── */}
      <div
        className="absolute inset-0 reeded-glass opacity-75"
        style={{
          backgroundImage: 'repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.032) 0px, rgba(255, 255, 255, 0.032) 1px, transparent 1px, transparent 6px)',
        }}
      />

      {/* ── 6. Luxury Perimeter Vignette ── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(5,9,18,0.75)_100%)]" />
    </div>
  );
};
