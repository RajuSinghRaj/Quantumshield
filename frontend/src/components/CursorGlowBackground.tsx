import React, { useEffect, useRef } from 'react';

/**
 * Atmospheric Smoke Background
 * Directly derived from user reference image (Image 2):
 * - Authentic curling white-gray volumetric smoke plumes billowing in the background
 * - Organic curling crimson/scarlet smoke plume smoothly tracking the cursor
 * - Zero React re-renders, 60+ FPS hardware accelerated GPU translation
 */
export const CursorGlowBackground: React.FC = () => {
  const redSmokeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial position centered on the middle-right matching hero layout
    let currentX = window.innerWidth * 0.62;
    let currentY = window.innerHeight * 0.45;
    let targetX = currentX;
    let targetY = currentY;
    let animFrame: number;
    let isMoving = false;

    // Direct hardware-accelerated position update with zero React re-renders
    const updatePosition = () => {
      const dx = targetX - currentX;
      const dy = targetY - currentY;

      // Smooth lerp damping for fluid smoke momentum
      currentX += dx * 0.08;
      currentY += dy * 0.08;

      if (redSmokeRef.current) {
        redSmokeRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
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
    if (redSmokeRef.current) {
      redSmokeRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
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
      {/* ── 1. DEEP MIDNIGHT SLATE-NAVY BACKDROP ── */}
      <div className="absolute inset-0 bg-[#070c18]" />

      {/* Cold Icy Blue Ambient Highlights */}
      <div className="absolute -top-32 -left-32 w-[750px] h-[750px] rounded-full bg-blue-950/25 blur-[150px] pointer-events-none" />
      <div className="absolute top-1/4 right-0 w-[600px] h-[600px] rounded-full bg-indigo-950/30 blur-[140px] pointer-events-none" />

      {/* ── 2. VISIBLE WHITE SMOKE IN BACKGROUND (FROM REFERENCE PIC) ── */}
      {/* Primary White Smoke Cloud (Billowing on Left & Center behind Headline) */}
      <div
        className="absolute smoke-cloud-1 pointer-events-none select-none opacity-90"
        style={{
          width: '1250px',
          height: '780px',
          left: '-8%',
          top: '2%',
          backgroundImage: 'url(/assets/white_smoke.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'left center',
          backgroundRepeat: 'no-repeat',
          mixBlendMode: 'screen',
        }}
      />

      {/* Secondary Soft Drifting White Mist Depth Layer */}
      <div
        className="absolute smoke-cloud-2 pointer-events-none select-none opacity-60"
        style={{
          width: '1400px',
          height: '880px',
          left: '-4%',
          top: '12%',
          backgroundImage: 'url(/assets/white_smoke.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'left center',
          backgroundRepeat: 'no-repeat',
          mixBlendMode: 'screen',
          filter: 'blur(6px)',
        }}
      />

      {/* ── 3. REALISTIC RED SMOKE FOLLOWING CURSOR (FROM REFERENCE PIC) ── */}
      <div
        ref={redSmokeRef}
        className="absolute top-0 left-0 will-change-transform pointer-events-none select-none"
      >
        {/* Organic Curling Red Smoke Plume from Reference Pic */}
        <div
          className="pointer-events-none select-none"
          style={{
            width: '880px',
            height: '580px',
            backgroundImage: 'url(/assets/red_smoke.png)',
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            mixBlendMode: 'screen',
            opacity: 0.95,
          }}
        />

        {/* Soft Ambient Warm Red Light Bleed */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: '650px',
            height: '440px',
            background: 'radial-gradient(ellipse 320px 220px at 50% 50%, rgba(225, 29, 72, 0.22) 0%, rgba(180, 15, 45, 0.08) 50%, transparent 75%)',
          }}
        />
      </div>

      {/* ── 4. SUBTLE FLUTED / REEDED VERTICAL GLASS TEXTURE ── */}
      <div
        className="absolute inset-0 reeded-glass opacity-30 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.035) 0px, rgba(255, 255, 255, 0.035) 1px, transparent 1px, transparent 6px)',
        }}
      />
    </div>
  );
};
