import React, { useEffect, useRef } from 'react';

export const CursorGlowBackground: React.FC = () => {
  const cursorSmokeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Current interpolated positions
    let currentX = window.innerWidth * 0.5;
    let currentY = window.innerHeight * 0.45;
    let targetX = currentX;
    let targetY = currentY;
    let animFrame: number;
    let isMoving = false;

    // Direct hardware-accelerated position update with zero React re-renders
    const updatePosition = () => {
      const dx = targetX - currentX;
      const dy = targetY - currentY;

      // Smooth lerp damping for organic smoke momentum
      currentX += dx * 0.085;
      currentY += dy * 0.085;

      if (cursorSmokeRef.current) {
        cursorSmokeRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
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
    if (cursorSmokeRef.current) {
      cursorSmokeRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
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
      {/* ── 1. COLD WINTER SLATE / STEEL-NAVY DEEP BACKDROP ── */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(140deg, #091120 0%, #0d1830 35%, #0b152b 70%, #060c18 100%)',
        }}
      />

      {/* ── 2. HIGH-CLARITY WHITE-GRAY FOG CLOUDS (CLEARLY VISIBLE, DISTINCT BANKS) ── */}
      {/* Fog Bank 1: Prominent Luminous White-Silver Mist (Upper Left Behind Headline) */}
      <div
        className="absolute smoke-cloud-1 pointer-events-none"
        style={{
          width: '950px',
          height: '620px',
          left: '4%',
          top: '6%',
          background: 'radial-gradient(ellipse 480px 310px at 45% 45%, rgba(255, 255, 255, 0.65) 0%, rgba(230, 240, 255, 0.45) 28%, rgba(185, 205, 235, 0.25) 55%, transparent 80%)',
        }}
      />

      {/* Fog Bank 1 Core Highlight for Maximum Crisp Clarity */}
      <div
        className="absolute smoke-cloud-1 pointer-events-none"
        style={{
          width: '520px',
          height: '340px',
          left: '12%',
          top: '12%',
          background: 'radial-gradient(ellipse 260px 170px at 45% 45%, rgba(255, 255, 255, 0.55) 0%, rgba(220, 235, 255, 0.28) 45%, transparent 75%)',
        }}
      />

      {/* Fog Bank 2: Mid-ground Billowing Silver Fog Plume (Center-Top drifting) */}
      <div
        className="absolute smoke-cloud-2 pointer-events-none"
        style={{
          width: '820px',
          height: '520px',
          left: '32%',
          top: '10%',
          background: 'radial-gradient(ellipse 410px 260px at 50% 50%, rgba(240, 248, 255, 0.45) 0%, rgba(195, 215, 245, 0.28) 38%, rgba(140, 165, 205, 0.12) 65%, transparent 82%)',
        }}
      />

      {/* Fog Bank 3: Swirling Cold Mist Band (Lower Left Under Subtext) */}
      <div
        className="absolute smoke-cloud-2 pointer-events-none"
        style={{
          width: '880px',
          height: '480px',
          left: '2%',
          top: '42%',
          background: 'radial-gradient(ellipse 440px 240px at 40% 50%, rgba(215, 232, 255, 0.38) 0%, rgba(165, 190, 225, 0.20) 45%, transparent 75%)',
        }}
      />

      {/* ── 3. SMALL DELICATE RED SMOKE FOLLOWING CURSOR (NO GIANT BALL) ── */}
      <div
        ref={cursorSmokeRef}
        className="absolute top-0 left-0 will-change-transform pointer-events-none"
      >
        {/* Soft Organic Outer Red Smoke Wisp (Small ~200px) */}
        <div
          className="absolute rounded-full red-vapor-cloud -translate-x-1/2 -translate-y-1/2"
          style={{
            width: '210px',
            height: '190px',
            background: 'radial-gradient(ellipse 105px 95px at 50% 50%, rgba(240, 68, 56, 0.40) 0%, rgba(225, 29, 72, 0.20) 45%, rgba(160, 15, 45, 0.05) 75%, transparent 100%)',
          }}
        />

        {/* Small Inner Wispy Smoke Curl (Delicate ~120px) */}
        <div
          className="absolute rounded-full red-smoke-puff -translate-x-1/2 -translate-y-1/2"
          style={{
            width: '130px',
            height: '120px',
            background: 'radial-gradient(ellipse 65px 60px at 48% 52%, rgba(255, 90, 80, 0.58) 0%, rgba(240, 68, 56, 0.25) 50%, transparent 85%)',
          }}
        />

        {/* Gentle Trailing Smoke Tendril */}
        <div
          className="absolute rounded-full -translate-x-1/2 -translate-y-1/2"
          style={{
            width: '70px',
            height: '70px',
            background: 'radial-gradient(circle at 45% 45%, rgba(255, 120, 110, 0.70) 0%, rgba(255, 75, 65, 0.30) 50%, transparent 80%)',
          }}
        />
      </div>

      {/* ── 4. FLUTED / REEDED VERTICAL GLASS TEXTURE (SUBTLE, HIGH CLARITY FOR FOG) ── */}
      <div
        className="absolute inset-0 reeded-glass opacity-35"
        style={{
          backgroundImage: 'repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.035) 0px, rgba(255, 255, 255, 0.035) 1px, transparent 1px, transparent 6px)',
        }}
      />
    </div>
  );
};
