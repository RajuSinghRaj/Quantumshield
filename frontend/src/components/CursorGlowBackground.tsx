import React, { useEffect, useRef } from 'react';

export const CursorGlowBackground: React.FC = () => {
  const ballGroupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial position centered on the middle-right matching Tidewell screenshot
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

      // Smooth lerp damping for silky momentum
      currentX += dx * 0.08;
      currentY += dy * 0.08;

      if (ballGroupRef.current) {
        ballGroupRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
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
    if (ballGroupRef.current) {
      ballGroupRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
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
      {/* ── 1. COLD WINTER SLATE / STEEL-NAVY BACKDROP ── */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(145deg, #0a1222 0%, #101c34 35%, #0e1930 70%, #080e1b 100%)',
        }}
      />

      {/* Cold Icy Blue Ambient Winter Highlights */}
      <div className="absolute -top-32 -left-32 w-[750px] h-[750px] rounded-full bg-sky-900/30 blur-[150px]" />
      <div className="absolute top-1/4 right-0 w-[600px] h-[600px] rounded-full bg-indigo-950/35 blur-[140px]" />
      <div className="absolute -bottom-32 left-1/4 w-[700px] h-[600px] rounded-full bg-slate-800/30 blur-[150px]" />

      {/* ── 2. VISIBLE WHITE-GRAYISH DARK SMOKE CLOUDS IN BACKGROUND ── */}
      {/* Main Visible White-Gray Smoke Cloud (Upper Left & Center Behind Headline) */}
      <div
        className="absolute smoke-cloud-1 pointer-events-none"
        style={{
          width: '1050px',
          height: '750px',
          left: '6%',
          top: '4%',
          background: 'radial-gradient(ellipse 520px 380px at 45% 45%, rgba(235, 242, 255, 0.42) 0%, rgba(185, 202, 228, 0.28) 40%, rgba(130, 148, 178, 0.16) 65%, transparent 85%)',
        }}
      />

      {/* Secondary Dark Charcoal / Slate Smoke Swirl (Mid-ground Volume) */}
      <div
        className="absolute smoke-cloud-2 pointer-events-none"
        style={{
          width: '900px',
          height: '620px',
          left: '0%',
          top: '30%',
          background: 'radial-gradient(ellipse 460px 310px at 50% 50%, rgba(160, 178, 208, 0.32) 0%, rgba(110, 128, 158, 0.20) 50%, rgba(60, 78, 108, 0.10) 70%, transparent 85%)',
        }}
      />

      {/* Frosty White Mist Drifting Across Right Side Behind Cards */}
      <div
        className="absolute smoke-cloud-1 pointer-events-none"
        style={{
          width: '850px',
          height: '680px',
          right: '2%',
          top: '15%',
          background: 'radial-gradient(ellipse 420px 340px at 50% 50%, rgba(220, 235, 255, 0.26) 0%, rgba(165, 185, 218, 0.16) 50%, transparent 80%)',
        }}
      />

      {/* Subtle Winter Ground Fog */}
      <div
        className="absolute bottom-0 inset-x-0 h-96 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 1200px 280px at 50% 100%, rgba(180, 200, 230, 0.18) 0%, rgba(120, 140, 175, 0.08) 55%, transparent 80%)',
        }}
      />

      {/* ── 3. GLOWING RED BALL EMITTING SMOKE & VAPOR (FOLLOWS CURSOR) ── */}
      <div
        ref={ballGroupRef}
        className="absolute top-0 left-0 will-change-transform pointer-events-none"
      >
        {/* Layer 3A: Wide Emitted Crimson Smoke Vapor (Outer Dispersion Cloud) */}
        <div
          className="absolute rounded-full red-vapor-cloud -translate-x-1/2 -translate-y-1/2"
          style={{
            width: '820px',
            height: '800px',
            background: 'radial-gradient(circle at 50% 50%, rgba(240, 50, 45, 0.26) 0%, rgba(200, 25, 50, 0.14) 45%, rgba(140, 10, 40, 0.05) 68%, transparent 82%)',
          }}
        />

        {/* Layer 3B: Billowing Red Smoke Puff (Emitted Around the Ball) */}
        <div
          className="absolute rounded-full red-smoke-puff -translate-x-1/2 -translate-y-1/2"
          style={{
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle at 52% 48%, rgba(255, 65, 50, 0.42) 0%, rgba(225, 30, 60, 0.24) 44%, rgba(160, 15, 50, 0.08) 66%, transparent 80%)',
          }}
        />

        {/* Layer 3C: The Hot Glowing Ball Core (Spherical Center) */}
        <div
          className="absolute rounded-full -translate-x-1/2 -translate-y-1/2"
          style={{
            width: '390px',
            height: '390px',
            background: 'radial-gradient(circle at 48% 48%, rgba(255, 80, 65, 0.70) 0%, rgba(240, 50, 40, 0.50) 36%, rgba(215, 20, 50, 0.26) 60%, transparent 78%)',
          }}
        />

        {/* Layer 3D: High-Intensity Specular Ember Center */}
        <div
          className="absolute rounded-full -translate-x-1/2 -translate-y-1/2"
          style={{
            width: '180px',
            height: '180px',
            background: 'radial-gradient(circle at 46% 46%, rgba(255, 130, 115, 0.88) 0%, rgba(255, 75, 60, 0.45) 50%, transparent 75%)',
          }}
        />
      </div>

      {/* ── 4. FLUTED / REEDED VERTICAL GLASS TEXTURE ACROSS VIEWPORT ── */}
      <div
        className="absolute inset-0 reeded-glass opacity-70"
        style={{
          backgroundImage: 'repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.035) 0px, rgba(255, 255, 255, 0.035) 1px, transparent 1px, transparent 6px)',
        }}
      />

      {/* ── 5. Luxury Perimeter Vignette ── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(6,11,20,0.70)_100%)]" />
    </div>
  );
};
