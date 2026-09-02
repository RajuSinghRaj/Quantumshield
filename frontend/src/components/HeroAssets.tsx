import React from 'react';

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
