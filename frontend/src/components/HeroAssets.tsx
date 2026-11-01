import React from 'react';

// ==============================================================================
// 3D GEOMETRIC WIREFRAME SPHERE WITH SMOOTH ORBITING PARTICLES (IMAGE #4)
// TRUE VOLUMETRIC 3D SPHERICAL CAGE (NEVER FLATTENS OR COLLAPSES)
// ==============================================================================
export const GeometricSphere3D: React.FC = () => {
  return (
    <div className="relative w-80 h-80 sm:w-96 sm:h-96 xl:w-[440px] xl:h-[440px] flex items-center justify-center select-none animate-float-smooth perspective-1000">
      
      {/* ── AMBIENT WARM ORANGE/AMBER GLOW ── */}
      <div className="absolute w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-gradient-to-tr from-orange-600/30 via-amber-500/25 to-orange-400/20 blur-3xl pointer-events-none" />

      {/* ── VOLUMETRIC 3D ROTATING WIREFRAME SPHERE CAGE ── */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 xl:w-80 xl:h-80 flex items-center justify-center preserve-3d animate-full-sphere-3d">
        
        {/* Central Luminous Energy Core */}
        <div className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-orange-600 via-amber-500 to-orange-300 blur-md opacity-75 animate-pulse-core pointer-events-none" />
        <div className="absolute w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/90 shadow-[0_0_30px_#ea580c] pointer-events-none" />

        {/* ── LATITUDE RINGS (Parallel 3D Planes) ── */}
        {/* Equator (0°) */}
        <div
          className="absolute w-60 h-60 sm:w-68 sm:h-68 rounded-full border-[1.5px] border-orange-500/70 shadow-[0_0_12px_rgba(249,115,22,0.35)]"
          style={{ transform: 'rotateX(90deg)' }}
        />
        {/* +30° North Parallel */}
        <div
          className="absolute w-52 h-52 sm:w-60 sm:h-60 rounded-full border-[1.2px] border-orange-400/60"
          style={{ transform: 'rotateX(90deg) translateZ(42px)' }}
        />
        {/* -30° South Parallel */}
        <div
          className="absolute w-52 h-52 sm:w-60 sm:h-60 rounded-full border-[1.2px] border-orange-400/60"
          style={{ transform: 'rotateX(90deg) translateZ(-42px)' }}
        />
        {/* +60° Polar Parallel */}
        <div
          className="absolute w-36 h-36 sm:w-42 sm:h-42 rounded-full border border-amber-400/50"
          style={{ transform: 'rotateX(90deg) translateZ(76px)' }}
        />
        {/* -60° Polar Parallel */}
        <div
          className="absolute w-36 h-36 sm:w-42 sm:h-42 rounded-full border border-amber-400/50"
          style={{ transform: 'rotateX(90deg) translateZ(-76px)' }}
        />

        {/* ── LONGITUDE MERIDIAN RINGS (Vertical 3D Planes) ── */}
        {/* Prime Meridian (0°) */}
        <div
          className="absolute w-60 h-60 sm:w-68 sm:h-68 rounded-full border-[1.5px] border-orange-500/70 shadow-[0_0_12px_rgba(249,115,22,0.35)]"
          style={{ transform: 'rotateY(0deg)' }}
        />
        {/* 45° Meridian */}
        <div
          className="absolute w-60 h-60 sm:w-68 sm:h-68 rounded-full border-[1.3px] border-orange-400/60"
          style={{ transform: 'rotateY(45deg)' }}
        />
        {/* 90° Meridian */}
        <div
          className="absolute w-60 h-60 sm:w-68 sm:h-68 rounded-full border-[1.5px] border-orange-500/70"
          style={{ transform: 'rotateY(90deg)' }}
        />
        {/* 135° Meridian */}
        <div
          className="absolute w-60 h-60 sm:w-68 sm:h-68 rounded-full border-[1.3px] border-orange-400/60"
          style={{ transform: 'rotateY(135deg)' }}
        />

        {/* ── 3D SURFACE VERTEX NODES (Intersections with Glowing Beads) ── */}
        <div className="absolute w-3 h-3 rounded-full bg-white shadow-[0_0_10px_#ea580c] border border-orange-500" style={{ transform: 'translate3d(0, -120px, 0)' }} />
        <div className="absolute w-3 h-3 rounded-full bg-white shadow-[0_0_10px_#ea580c] border border-orange-500" style={{ transform: 'translate3d(0, 120px, 0)' }} />
        <div className="absolute w-3 h-3 rounded-full bg-white shadow-[0_0_10px_#ea580c] border border-orange-500" style={{ transform: 'translate3d(120px, 0, 0)' }} />
        <div className="absolute w-3 h-3 rounded-full bg-white shadow-[0_0_10px_#ea580c] border border-orange-500" style={{ transform: 'translate3d(-120px, 0, 0)' }} />
        <div className="absolute w-3 h-3 rounded-full bg-white shadow-[0_0_10px_#ea580c] border border-orange-500" style={{ transform: 'translate3d(0, 0, 120px)' }} />
        <div className="absolute w-3 h-3 rounded-full bg-white shadow-[0_0_10px_#ea580c] border border-orange-500" style={{ transform: 'translate3d(0, 0, -120px)' }} />

        {/* Diagonal Geodesic Accents */}
        <div className="absolute w-2.5 h-2.5 rounded-full bg-amber-300 shadow-[0_0_8px_#f59e0b]" style={{ transform: 'translate3d(85px, 85px, 0)' }} />
        <div className="absolute w-2.5 h-2.5 rounded-full bg-amber-300 shadow-[0_0_8px_#f59e0b]" style={{ transform: 'translate3d(-85px, -85px, 0)' }} />
        <div className="absolute w-2.5 h-2.5 rounded-full bg-amber-300 shadow-[0_0_8px_#f59e0b]" style={{ transform: 'translate3d(85px, -85px, 0)' }} />
        <div className="absolute w-2.5 h-2.5 rounded-full bg-amber-300 shadow-[0_0_8px_#f59e0b]" style={{ transform: 'translate3d(-85px, 85px, 0)' }} />
      </div>

      {/* ── SMOOTH 3D TILTED ORBITAL RINGS & REVOLVING PARTICLES ── */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 preserve-3d">
        
        {/* Main Saturn-Style Tilted Orbital Ring */}
        <div className="absolute w-[340px] h-[340px] sm:w-[390px] sm:h-[390px] xl:w-[430px] xl:h-[430px] rounded-full border-[1.5px] border-orange-400/80 shadow-[0_0_24px_rgba(249,115,22,0.4)] animate-orbit-ring-3d preserve-3d">
          {/* Main Revolving Orange Bead */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4.5 h-4.5 rounded-full bg-gradient-to-br from-white via-orange-400 to-amber-500 shadow-[0_0_18px_#ea580c] border-2 border-white ring-2 ring-orange-500/50" />
          {/* Trailing Particle 1 */}
          <div className="absolute top-10 right-14 w-3 h-3 rounded-full bg-orange-400 shadow-[0_0_12px_#f97316] border border-white" />
          {/* Opposite Particle 2 */}
          <div className="absolute bottom-6 left-16 w-3.5 h-3.5 rounded-full bg-amber-400 shadow-[0_0_14px_#f59e0b] border-2 border-white" />
          {/* Micro Particle 3 */}
          <div className="absolute bottom-16 right-10 w-2 h-2 rounded-full bg-orange-300 shadow-[0_0_8px_#fb923c]" />
        </div>

        {/* Counter Secondary Orbital Ring */}
        <div className="absolute w-[290px] h-[290px] sm:w-[330px] sm:h-[330px] xl:w-[360px] xl:h-[360px] rounded-full border border-amber-400/50 border-dashed animate-orbit-counter-3d preserve-3d">
          {/* Counter Revolving Amber Bead */}
          <div className="absolute bottom-2 right-12 w-4 h-4 rounded-full bg-amber-400 shadow-[0_0_16px_#f59e0b] border-2 border-white" />
          {/* Counter Particle 2 */}
          <div className="absolute top-8 left-12 w-2.5 h-2.5 rounded-full bg-orange-400 shadow-[0_0_10px_#ea580c] border border-white" />
        </div>

      </div>

    </div>
  );
};

// ==============================================================================
// 3D TRANSLUCENT GLASS CUBE WITH SPINNING SECURITY SHIELD & PADLOCK
// ==============================================================================
export const SpinningCubeAndLock3D: React.FC = () => {
  return (
    <div className="relative w-80 h-96 sm:w-96 sm:h-[420px] flex items-center justify-center select-none">
      
      {/* ── AMBIENT GLOW BACKDROP ── */}
      <div className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-purple-500/20 via-violet-400/25 to-indigo-500/15 blur-3xl pointer-events-none" />

      {/* ── DUAL ORBITAL RINGS WITH ROTATING PARTICLES ── */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0">
        {/* Outer Tilted Orbit */}
        <div className="absolute w-[340px] h-[340px] rounded-full border border-purple-400/40 border-dashed animate-orbit-tilt">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-purple-500 shadow-[0_0_12px_#a855f7] border-2 border-white" />
        </div>
        {/* Inner Counter Orbit */}
        <div className="absolute w-[300px] h-[300px] rounded-full border border-cyan-400/35 animate-orbit-counter">
          <div className="absolute bottom-4 right-10 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] border border-white" />
        </div>
      </div>

      {/* ── LAYERED PEDESTAL PLATFORM ── */}
      <div className="absolute bottom-2 sm:bottom-4 w-72 sm:w-80 h-28 flex flex-col items-center justify-end pointer-events-none z-10">
        {/* Ground shadow */}
        <div className="w-64 h-8 rounded-full bg-purple-500/15 blur-lg" />
        {/* Pedestal lower cylinder tier */}
        <div className="w-72 h-10 rounded-[50%] bg-gradient-to-b from-purple-100 to-purple-200/90 dark:from-purple-950/70 dark:to-slate-900 border border-purple-300/50 shadow-md -mb-4" />
        {/* Pedestal upper platform */}
        <div className="w-60 h-8 rounded-[50%] bg-gradient-to-b from-white via-purple-50 to-purple-100/80 dark:from-purple-800/50 dark:to-slate-800 border border-white/80 dark:border-purple-400/40 shadow-inner flex items-center justify-center">
          <div className="w-44 h-4 rounded-[50%] bg-purple-300/30 blur-xs" />
        </div>
      </div>

      {/* ── 3D FLOATING CUBE & SPINNING LOCK CONTAINER ── */}
      <div className="relative w-56 h-56 sm:w-64 sm:h-64 perspective-1000 z-20 -mt-6">
        
        {/* Continuous 3D Rotating Cube Wrapper */}
        <div className="w-full h-full preserve-3d animate-spin-cube-3d">
          
          {/* ── CENTRAL GLOWING CORE LIGHT ── */}
          <div
            className="absolute inset-0 m-auto w-24 h-24 rounded-full bg-purple-500/35 blur-xl pointer-events-none"
            style={{ transform: 'translateZ(0px)' }}
          />

          {/* ── 3D SPINNING SECURITY SHIELD & PADLOCK (IN CENTER OF CUBE) ── */}
          <div
            className="absolute inset-0 flex items-center justify-center preserve-3d animate-spin-lock pointer-events-none"
            style={{ transform: 'translateZ(0px)', transformStyle: 'preserve-3d' }}
          >
            <svg
              viewBox="0 0 160 200"
              className="w-32 h-40 sm:w-36 sm:h-44 drop-shadow-[0_0_35px_rgba(147,51,234,0.9)] filter"
            >
              <defs>
                <linearGradient id="shieldVibrantGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#c084fc" />
                  <stop offset="35%" stopColor="#9333ea" />
                  <stop offset="70%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#4f46e5" />
                </linearGradient>
                <linearGradient id="lockChromeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="60%" stopColor="#f1f5f9" />
                  <stop offset="100%" stopColor="#cbd5e1" />
                </linearGradient>
                <filter id="shieldNeon">
                  <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#a855f7" floodOpacity="0.8" />
                </filter>
              </defs>

              {/* Glowing Shield Shell */}
              <path
                d="M 80 14 L 148 42 C 148 118 107 168 80 188 C 53 168 12 118 12 42 Z"
                fill="url(#shieldVibrantGrad)"
                stroke="#ffffff"
                strokeWidth="4"
                filter="url(#shieldNeon)"
              />

              {/* Inner Shield Accent */}
              <path
                d="M 80 28 L 134 51 C 134 110 100 152 80 170 C 60 152 26 110 26 51 Z"
                fill="none"
                stroke="rgba(255, 255, 255, 0.6)"
                strokeWidth="2"
                strokeDasharray="6 3"
              />

              {/* Padlock Shackle */}
              <path
                d="M 61 88 L 61 66 C 61 53 69.5 44 80 44 C 90.5 44 99 53 99 66 L 99 88"
                fill="none"
                stroke="url(#lockChromeGrad)"
                strokeWidth="9"
                strokeLinecap="round"
              />

              {/* Padlock Body */}
              <rect
                x="48"
                y="84"
                width="64"
                height="50"
                rx="12"
                fill="url(#lockChromeGrad)"
                stroke="rgba(255,255,255,0.9)"
                strokeWidth="2"
                filter="drop-shadow(0 6px 14px rgba(0,0,0,0.35))"
              />

              {/* Padlock Keyhole */}
              <circle cx="80" cy="104" r="5.5" fill="#3b0764" />
              <path d="M 76.5 104 L 83.5 104 L 85.5 120 L 74.5 120 Z" fill="#3b0764" />
            </svg>
          </div>

          {/* ── 6 CRYSTAL CLEAR GLASS CUBE FACES ── */}
          {/* FACE 1: Front */}
          <div
            className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 via-purple-300/10 to-indigo-500/15 border-2 border-purple-400/70 shadow-[inset_0_0_24px_rgba(168,85,247,0.2),0_0_15px_rgba(168,85,247,0.25)] pointer-events-none"
            style={{ transform: 'translateZ(112px)' }}
          >
            <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-white/90 shadow-[0_0_8px_#ffffff]" />
            <div className="absolute bottom-2.5 left-2.5 w-2 h-2 rounded-full bg-purple-300/80" />
          </div>

          {/* FACE 2: Back */}
          <div
            className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/15 via-purple-300/10 to-indigo-500/15 border-2 border-purple-400/60 shadow-[inset_0_0_24px_rgba(168,85,247,0.18)] pointer-events-none"
            style={{ transform: 'rotateY(180deg) translateZ(112px)' }}
          />

          {/* FACE 3: Right */}
          <div
            className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/18 via-purple-300/10 to-indigo-500/15 border-2 border-purple-400/65 shadow-[inset_0_0_24px_rgba(168,85,247,0.2)] pointer-events-none"
            style={{ transform: 'rotateY(90deg) translateZ(112px)' }}
          />

          {/* FACE 4: Left */}
          <div
            className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/18 via-purple-300/10 to-indigo-500/15 border-2 border-purple-400/65 shadow-[inset_0_0_24px_rgba(168,85,247,0.2)] pointer-events-none"
            style={{ transform: 'rotateY(-90deg) translateZ(112px)' }}
          />

          {/* FACE 5: Top */}
          <div
            className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/30 via-purple-200/15 to-indigo-400/15 border-2 border-purple-300/75 shadow-[inset_0_0_24px_rgba(255,255,255,0.25)] pointer-events-none"
            style={{ transform: 'rotateX(90deg) translateZ(112px)' }}
          />

          {/* FACE 6: Bottom */}
          <div
            className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-400/15 via-indigo-600/15 to-purple-900/20 border-2 border-purple-400/50 shadow-[inset_0_0_24px_rgba(168,85,247,0.25)] pointer-events-none"
            style={{ transform: 'rotateX(-90deg) translateZ(112px)' }}
          />

        </div>

      </div>

    </div>
  );
};

// 3D Holographic Quantum Shield with Continuous Spinning Rings & Pedestal Base
export const QuantumShield3D: React.FC = () => (
  <div className="relative w-72 h-72 flex items-center justify-center">
    
    {/* Outer Spinning Hologram Cyan Dashed Ring */}
    <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400/50 animate-spin-slow shadow-[0_0_20px_rgba(56,189,248,0.3)]" />
    
    {/* Inner Reverse Spinning Purple Ring */}
    <div className="absolute inset-4 rounded-full border border-purple-500/40 border-t-purple-400 animate-spin-reverse" />
    
    {/* Concentric Glow Backdrop */}
    <div className="absolute inset-10 rounded-full bg-gradient-to-tr from-purple-600/20 via-cyan-500/20 to-indigo-600/20 blur-xl animate-pulse" />

    <svg viewBox="0 0 200 200" className="w-full h-full relative z-10 animate-shield-glow">
      <defs>
        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
        <linearGradient id="shieldBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(168, 85, 247, 0.45)" />
          <stop offset="100%" stopColor="rgba(56, 189, 248, 0.15)" />
        </linearGradient>
        <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Hologram Pedestal Base Rings */}
      <g className="animate-spin-slow" style={{ transformOrigin: '100px 175px' }}>
        <ellipse cx="100" cy="175" rx="75" ry="16" fill="rgba(168, 85, 247, 0.2)" stroke="#a855f7" strokeWidth="2" strokeDasharray="8 4" />
        <ellipse cx="100" cy="175" rx="55" ry="11" fill="rgba(56, 189, 248, 0.25)" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="6 3" />
      </g>
      <ellipse cx="100" cy="175" rx="35" ry="7" fill="#38bdf8" opacity="0.8" className="animate-pulse" />

      {/* Vertical Hologram Light Beams */}
      <line x1="40" y1="175" x2="60" y2="40" stroke="rgba(56, 189, 248, 0.3)" strokeDasharray="3 3" />
      <line x1="160" y1="175" x2="140" y2="40" stroke="rgba(168, 85, 247, 0.3)" strokeDasharray="3 3" />

      {/* Outer Shield Shell */}
      <path
        d="M 100 25 L 155 50 C 155 120 120 155 100 168 C 80 155 45 120 45 50 Z"
        fill="url(#shieldBg)"
        stroke="url(#shieldGrad)"
        strokeWidth="4"
        filter="url(#neonGlow)"
      />

      {/* Inner Shield Accent Dash */}
      <path
        d="M 100 38 L 142 58 C 142 110 114 140 100 150 C 86 140 58 110 58 58 Z"
        fill="none"
        stroke="rgba(255, 255, 255, 0.6)"
        strokeWidth="1.5"
        strokeDasharray="5 3"
      />

      {/* Quantum Emblem 'Q' */}
      <text
        x="100"
        y="112"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="48"
        fontWeight="900"
        fontFamily="Inter, sans-serif"
        filter="url(#neonGlow)"
      >
        Q
      </text>

      {/* Orbiting Tilted Ring (Spinning Continuously) */}
      <g className="animate-spin-slow" style={{ transformOrigin: '100px 95px' }}>
        <ellipse
          cx="100"
          cy="95"
          rx="74"
          ry="24"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2"
          strokeDasharray="8 4"
          transform="rotate(-15 100 95)"
          filter="url(#neonGlow)"
        />
      </g>
    </svg>
  </div>
);

// 3D Bitcoin (BTC) Coin with Continuous Spin
export const BtcCoin3D: React.FC = () => (
  <svg viewBox="0 0 100 100" className="w-14 h-14 drop-shadow-[0_0_20px_rgba(245,158,11,0.8)] animate-spin-slow">
    <defs>
      <linearGradient id="btcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
      <linearGradient id="btcBrim" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fef3c7" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
    </defs>

    <circle cx="50" cy="50" r="44" fill="url(#btcBrim)" />
    <circle cx="50" cy="50" r="38" fill="url(#btcGrad)" stroke="#fef3c7" strokeWidth="2" />
    <circle cx="50" cy="50" r="34" fill="none" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="1.5" strokeDasharray="4 2" />

    <text
      x="50"
      y="64"
      textAnchor="middle"
      fill="#ffffff"
      fontSize="38"
      fontWeight="900"
      fontFamily="sans-serif"
    >
      ₿
    </text>
  </svg>
);

// 3D Ethereum (ETH) Crystal with Reverse Spin
export const EthCrystal3D: React.FC = () => (
  <svg viewBox="0 0 100 100" className="w-14 h-14 drop-shadow-[0_0_20px_rgba(168,85,247,0.8)] animate-spin-reverse">
    <defs>
      <linearGradient id="ethLeft" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#c084fc" />
        <stop offset="100%" stopColor="#7e22ce" />
      </linearGradient>
      <linearGradient id="ethRight" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e9d5ff" />
        <stop offset="100%" stopColor="#a855f7" />
      </linearGradient>
      <linearGradient id="ethBottom" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#581c87" />
      </linearGradient>
    </defs>

    <polygon points="50,10 20,52 50,42" fill="url(#ethLeft)" />
    <polygon points="50,10 80,52 50,42" fill="url(#ethRight)" />
    <polygon points="50,45 20,54 50,90" fill="url(#ethBottom)" opacity="0.9" />
    <polygon points="50,45 80,54 50,90" fill="url(#ethLeft)" opacity="0.8" />
  </svg>
);

// 3D Solana (SOL) Badge with Continuous Spin
export const SolBadge3D: React.FC = () => (
  <svg viewBox="0 0 100 100" className="w-13 h-13 drop-shadow-[0_0_20px_rgba(20,184,166,0.8)] animate-spin-slow">
    <defs>
      <linearGradient id="solBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#14b8a6" />
        <stop offset="50%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#a855f7" />
      </linearGradient>
      <linearGradient id="solBar" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#00ffa3" />
        <stop offset="100%" stopColor="#dc1fff" />
      </linearGradient>
    </defs>

    <circle cx="50" cy="50" r="44" fill="url(#solBg)" stroke="#ffffff" strokeWidth="2" />
    <g transform="translate(25, 30) scale(0.5)">
      <polygon points="10,15 80,15 90,28 20,28" fill="url(#solBar)" />
      <polygon points="20,40 90,40 80,53 10,53" fill="url(#solBar)" />
      <polygon points="10,65 80,65 90,78 20,78" fill="url(#solBar)" />
    </g>
  </svg>
);
