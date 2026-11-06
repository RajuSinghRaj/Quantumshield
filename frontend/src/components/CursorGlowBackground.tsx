import React, { useEffect, useRef } from 'react';

/**
 * Live Volumetric Smoke Simulation Engine
 * 
 * 1. Live Red Smoke actively emitting from cursor position, curling, swirling, and dissolving.
 * 2. Live White/Grey Smoke continuously billowing from the background and drifting across the screen.
 * 3. 60 FPS hardware-accelerated canvas with particle pooling (zero GC lag, zero React re-renders).
 */
export const CursorGlowBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse tracking with momentum
    let mouseX = width * 0.6;
    let mouseY = height * 0.45;
    let prevMouseX = mouseX;
    let prevMouseY = mouseY;
    let mouseVx = 0;
    let mouseVy = 0;

    // ─────────────────────────────────────────────────────────────
    // 1. PRE-RENDER ORGANIC FRACTAL SMOKE SPRITES (TEXTURED PUFFS)
    // ─────────────────────────────────────────────────────────────
    const makePuffSprite = (colorType: 'white' | 'crimson' | 'scarlet') => {
      const size = 256;
      const off = document.createElement('canvas');
      off.width = size;
      off.height = size;
      const oCtx = off.getContext('2d');
      if (!oCtx) return off;

      const c = size / 2;

      // Organic cluster of overlapping soft clouds
      const lobes = [
        { x: 0,   y: 0,   r: 70,  a: 0.22 },
        { x: -22, y: -16, r: 55,  a: 0.16 },
        { x: 24,  y: 14,  r: 60,  a: 0.17 },
        { x: -16, y: 20,  r: 52,  a: 0.15 },
        { x: 20,  y: -18, r: 58,  a: 0.14 },
        { x: -30, y: 2,   r: 45,  a: 0.12 },
        { x: 10,  y: 26,  r: 48,  a: 0.13 },
      ];

      lobes.forEach(({ x, y, r, a }) => {
        const grad = oCtx.createRadialGradient(c + x, c + y, 0, c + x, c + y, r);
        if (colorType === 'white') {
          grad.addColorStop(0,   `rgba(240, 246, 255, ${a * 1.4})`);
          grad.addColorStop(0.4, `rgba(205, 220, 245, ${a * 0.9})`);
          grad.addColorStop(0.8, `rgba(150, 175, 210, ${a * 0.3})`);
          grad.addColorStop(1,   'rgba(150, 175, 210, 0)');
        } else if (colorType === 'crimson') {
          grad.addColorStop(0,   `rgba(240, 50, 45, ${a * 1.5})`);
          grad.addColorStop(0.4, `rgba(220, 20, 55, ${a * 1.0})`);
          grad.addColorStop(0.8, `rgba(140, 10, 40, ${a * 0.35})`);
          grad.addColorStop(1,   'rgba(140, 10, 40, 0)');
        } else {
          // scarlet / warm highlights
          grad.addColorStop(0,   `rgba(255, 75, 60, ${a * 1.6})`);
          grad.addColorStop(0.4, `rgba(235, 35, 45, ${a * 1.0})`);
          grad.addColorStop(0.8, `rgba(160, 15, 35, ${a * 0.35})`);
          grad.addColorStop(1,   'rgba(160, 15, 35, 0)');
        }

        oCtx.fillStyle = grad;
        oCtx.beginPath();
        oCtx.arc(c + x, c + y, r, 0, Math.PI * 2);
        oCtx.fill();
      });

      return off;
    };

    const spriteWhite   = makePuffSprite('white');
    const spriteCrimson = makePuffSprite('crimson');
    const spriteScarlet = makePuffSprite('scarlet');

    // ─────────────────────────────────────────────────────────────
    // 2. LIVE PARTICLE STRUCTURES
    // ─────────────────────────────────────────────────────────────
    interface SmokePuff {
      active: boolean;
      type: 'white' | 'red';
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      growRate: number;
      rotation: number;
      rotSpeed: number;
      age: number;
      maxAge: number;
      maxAlpha: number;
      sprite: HTMLCanvasElement;
      turbulenceSeed: number;
    }

    // Pool of 90 live smoke particles (zero garbage collection)
    const MAX_PARTICLES = 90;
    const pool: SmokePuff[] = [];

    for (let i = 0; i < MAX_PARTICLES; i++) {
      pool.push({
        active: false,
        type: 'red',
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 0,
        growRate: 1,
        rotation: 0,
        rotSpeed: 0,
        age: 0,
        maxAge: 100,
        maxAlpha: 0.5,
        sprite: spriteCrimson,
        turbulenceSeed: 0,
      });
    }

    // Spawn a live Red Smoke puff at cursor
    const spawnRedSmoke = (x: number, y: number, mvx: number, mvy: number) => {
      const p = pool.find((item) => !item.active);
      if (!p) return;

      p.active = true;
      p.type = 'red';
      // Emit with slight spread around cursor
      p.x = x + (Math.random() - 0.5) * 16;
      p.y = y + (Math.random() - 0.5) * 16;
      // Inherit mouse momentum + natural upward smoke buoyancy
      p.vx = mvx * 0.12 + (Math.random() - 0.5) * 0.7;
      p.vy = mvy * 0.12 - 0.45 - Math.random() * 0.65;
      p.size = 35 + Math.random() * 25; // starts small at cursor
      p.growRate = 1.012 + Math.random() * 0.006; // expands as it floats away
      p.rotation = Math.random() * Math.PI * 2;
      p.rotSpeed = (Math.random() - 0.5) * 0.015;
      p.age = 0;
      p.maxAge = 140 + Math.random() * 80; // 2.5 - 3.5 seconds
      p.maxAlpha = 0.55 + Math.random() * 0.25;
      p.sprite = Math.random() < 0.6 ? spriteCrimson : spriteScarlet;
      p.turbulenceSeed = Math.random() * 100;
    };

    // Spawn a live White Smoke puff in background
    const spawnWhiteSmoke = (forcedProgress = 0) => {
      const p = pool.find((item) => !item.active);
      if (!p) return;

      p.active = true;
      p.type = 'white';
      // Background smoke anchors along bottom-left and mid-left
      const anchor = Math.random();
      if (anchor < 0.45) {
        p.x = width * (0.05 + Math.random() * 0.25);
        p.y = height * (0.75 + Math.random() * 0.22);
      } else if (anchor < 0.8) {
        p.x = width * (0.20 + Math.random() * 0.25);
        p.y = height * (0.55 + Math.random() * 0.25);
      } else {
        p.x = width * (0.02 + Math.random() * 0.15);
        p.y = height * (0.40 + Math.random() * 0.30);
      }

      // Gentle drift upward and slightly rightward
      p.vx = 0.15 + Math.random() * 0.35;
      p.vy = -0.30 - Math.random() * 0.45;
      p.size = 110 + Math.random() * 60; // large billowing cloud
      p.growRate = 1.006 + Math.random() * 0.004;
      p.rotation = Math.random() * Math.PI * 2;
      p.rotSpeed = (Math.random() - 0.5) * 0.006;
      p.maxAge = 320 + Math.random() * 180; // 5 - 8 seconds
      p.age = forcedProgress > 0 ? p.maxAge * forcedProgress : 0;
      p.maxAlpha = 0.48 + Math.random() * 0.22;
      p.sprite = spriteWhite;
      p.turbulenceSeed = Math.random() * 100;
    };

    // Pre-seed background white smoke so page starts with smoke already billowing
    for (let i = 0; i < 28; i++) {
      spawnWhiteSmoke(i / 28);
    }

    // ─────────────────────────────────────────────────────────────
    // 3. EVENT LISTENERS
    // ─────────────────────────────────────────────────────────────
    const onPointerMove = (e: PointerEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    // ─────────────────────────────────────────────────────────────
    // 4. ANIMATION LOOP (LIVE SMOKE EMITTING & CURLING)
    // ─────────────────────────────────────────────────────────────
    let animId: number;
    let frame = 0;

    const render = () => {
      frame++;

      // Compute cursor velocity
      mouseVx = mouseX - prevMouseX;
      mouseVy = mouseY - prevMouseY;
      prevMouseX = mouseX;
      prevMouseY = mouseY;
      const speed = Math.hypot(mouseVx, mouseVy);

      // LIVE EMISSION: Red Smoke actively coming out of cursor
      // Emits more puffs when cursor moves, emits gentle puffs when cursor rests
      if (speed > 1.5) {
        spawnRedSmoke(mouseX, mouseY, mouseVx, mouseVy);
        if (speed > 8) {
          spawnRedSmoke(mouseX - mouseVx * 0.5, mouseY - mouseVy * 0.5, mouseVx, mouseVy);
        }
      } else if (frame % 3 === 0) {
        // Continuous gentle emission when hovering or still
        spawnRedSmoke(mouseX, mouseY, 0, 0);
      }

      // LIVE EMISSION: Background White Smoke continuously billowing
      if (frame % 10 === 0) {
        spawnWhiteSmoke(0);
      }

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Deep Midnight Slate Base
      ctx.fillStyle = '#070c18';
      ctx.fillRect(0, 0, width, height);

      // Update & Render all active smoke puffs
      // Using 'screen' blend mode so overlapping smoke wisps blend with luminous volume
      ctx.globalCompositeOperation = 'screen';

      pool.forEach((p) => {
        if (!p.active) return;

        p.age++;
        if (p.age >= p.maxAge) {
          p.active = false;
          return;
        }

        // Swirling curl turbulence
        const curlTime = p.age * 0.03 + p.turbulenceSeed;
        p.vx += Math.cos(curlTime) * 0.08;
        p.vy += Math.sin(curlTime) * 0.05;

        // Position & size update (billowing & expanding)
        p.x += p.vx;
        p.y += p.vy;
        p.size *= p.growRate;
        p.rotation += p.rotSpeed;

        // Smooth volumetric alpha envelope (fast fade in -> rolling smoke -> dissolve)
        const progress = p.age / p.maxAge;
        let alpha = p.maxAlpha;
        if (progress < 0.20) {
          alpha = p.maxAlpha * (progress / 0.20); // billowing in
        } else if (progress > 0.55) {
          alpha = p.maxAlpha * (1 - (progress - 0.55) / 0.45); // dissolving away
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = Math.max(0, Math.min(alpha, 0.75));
        ctx.drawImage(p.sprite, -p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      // Restore blend mode
      ctx.globalCompositeOperation = 'source-over';

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* ── 1. Live Interactive Smoke Simulation Canvas ── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* ── 2. Subtle Micro Reeded Glass Lines Texture ── */}
      <div
        className="absolute inset-0 reeded-glass opacity-25 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.035) 0px, rgba(255, 255, 255, 0.035) 1px, transparent 1px, transparent 6px)',
        }}
      />
    </div>
  );
};
