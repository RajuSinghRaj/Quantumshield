import React, { useEffect, useRef } from 'react';

/**
 * AtmosphericHeroBackground
 * 
 * Cinematic visual effects system featuring:
 * 1. Realistic volumetric crimson/scarlet smoke (organic, curling, expanding, dissolving - NO circular balls/orbs)
 * 2. Subtle atmospheric white & cool-grey fog drifting across background (5–12% opacity)
 * 3. Subtle blue ambient lighting behind right-hand cards
 * 4. Soft red light bleeding from the smoke
 * 5. Floating cinematic dust motes
 * 6. Gentle parallax response with zero React re-renders and full prefers-reduced-motion support
 */
export const CursorGlowBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Check for prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Parallax mouse coordinates (smoothly lerped)
    let mouseX = width * 0.58;
    let mouseY = height * 0.45;
    let targetMouseX = mouseX;
    let targetMouseY = mouseY;
    let parallaxX = 0;
    let parallaxY = 0;

    // ─────────────────────────────────────────────────────────────
    // 1. PRE-RENDER ORGANIC SMOKE PUFF SPRITES (NO HARD CIRCLES)
    // ─────────────────────────────────────────────────────────────
    const createSmokeSprite = (tint: 'crimson' | 'scarlet' | 'warm-red' | 'fog-white') => {
      const size = 320;
      const offscreen = document.createElement('canvas');
      offscreen.width = size;
      offscreen.height = size;
      const oCtx = offscreen.getContext('2d');
      if (!oCtx) return offscreen;

      const center = size / 2;

      // Color palettes for organic smoke
      let r = 180, g = 20, b = 40;
      if (tint === 'scarlet')   { r = 210; g = 35; b = 45; }
      if (tint === 'warm-red')  { r = 230; g = 55; b = 40; }
      if (tint === 'fog-white') { r = 215; g = 225; b = 240; }

      // Build an irregular, volumetric cluster of soft feathered puffs
      const lobes = [
        { ox: 0,   oy: 0,   rad: 100, a: 0.16 },
        { ox: -25, oy: -18, rad: 75,  a: 0.12 },
        { ox: 28,  oy: 15,  rad: 85,  a: 0.13 },
        { ox: -15, oy: 22,  rad: 70,  a: 0.11 },
        { ox: 22,  oy: -20, rad: 78,  a: 0.10 },
        { ox: -35, oy: 5,   rad: 60,  a: 0.08 },
      ];

      lobes.forEach(({ ox, oy, rad, a }) => {
        const grad = oCtx.createRadialGradient(
          center + ox, center + oy, 0,
          center + ox, center + oy, rad
        );
        grad.addColorStop(0,   `rgba(${r}, ${g}, ${b}, ${a})`);
        grad.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${a * 0.6})`);
        grad.addColorStop(0.8, `rgba(${r}, ${g}, ${b}, ${a * 0.15})`);
        grad.addColorStop(1,   `rgba(${r}, ${g}, ${b}, 0)`);

        oCtx.fillStyle = grad;
        oCtx.beginPath();
        oCtx.arc(center + ox, center + oy, rad, 0, Math.PI * 2);
        oCtx.fill();
      });

      return offscreen;
    };

    const spriteCrimson  = createSmokeSprite('crimson');
    const spriteScarlet  = createSmokeSprite('scarlet');
    const spriteWarmRed  = createSmokeSprite('warm-red');
    const spriteWhiteFog = createSmokeSprite('fog-white');

    // ─────────────────────────────────────────────────────────────
    // 2. SMOKE PARTICLE SYSTEM (VOLUMETRIC CRIMSON & SCARLET)
    // ─────────────────────────────────────────────────────────────
    interface SmokeParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      scale: number;
      maxScale: number;
      rotation: number;
      vRot: number;
      life: number;
      maxLife: number;
      sprite: HTMLCanvasElement;
      baseAlpha: number;
      layer: number; // 0 = background, 1 = midground, 2 = foreground
    }

    const maxSmoke = 26;
    const smokeParticles: SmokeParticle[] = [];

    const spawnSmoke = (forcedAgeRatio = 0): SmokeParticle => {
      // Smoke centers around the middle-right focal area with gentle cursor bias
      const spawnX = width * 0.58 + (Math.random() - 0.5) * 220 + (mouseX - width * 0.58) * 0.25;
      const spawnY = height * 0.44 + (Math.random() - 0.5) * 160 + (mouseY - height * 0.44) * 0.25;

      const layer = Math.random() < 0.4 ? 0 : Math.random() < 0.75 ? 1 : 2;
      const sprites = [spriteCrimson, spriteScarlet, spriteWarmRed];
      const sprite = sprites[Math.floor(Math.random() * sprites.length)];

      const maxLife = 480 + Math.random() * 320; // 8-13 seconds at 60fps
      const initialLife = forcedAgeRatio > 0 ? maxLife * forcedAgeRatio : 0;

      return {
        x: spawnX,
        y: spawnY,
        vx: (Math.random() - 0.46) * (0.2 + layer * 0.15),
        vy: -0.15 - Math.random() * 0.25 - layer * 0.1, // gently drifts upward
        scale: 0.8 + Math.random() * 0.4,
        maxScale: 1.8 + Math.random() * 1.0 + layer * 0.4,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.003,
        life: initialLife,
        maxLife,
        sprite,
        baseAlpha: 0.14 + Math.random() * 0.10 + layer * 0.04,
        layer,
      };
    };

    // Pre-seed particles so smoke is active immediately on page load
    for (let i = 0; i < maxSmoke; i++) {
      smokeParticles.push(spawnSmoke(i / maxSmoke));
    }

    // ─────────────────────────────────────────────────────────────
    // 3. FINE FLOATING DUST PARTICLES (CINEMATIC AMBIENCE)
    // ─────────────────────────────────────────────────────────────
    interface DustMote {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      alpha: number;
      maxAlpha: number;
      phase: number;
      phaseSpeed: number;
    }

    const dustCount = 45;
    const dustMotes: DustMote[] = [];

    for (let i = 0; i < dustCount; i++) {
      dustMotes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -0.1 - Math.random() * 0.2,
        radius: 0.7 + Math.random() * 1.3,
        alpha: Math.random() * 0.35,
        maxAlpha: 0.2 + Math.random() * 0.3,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: 0.015 + Math.random() * 0.02,
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 4. HORIZONTAL ATMOSPHERIC WHITE FOG BANDS (5–12% OPACITY)
    // ─────────────────────────────────────────────────────────────
    interface FogLayer {
      x: number;
      yRatio: number;
      speed: number;
      scaleX: number;
      scaleY: number;
      opacity: number;
    }

    const fogLayers: FogLayer[] = [
      { x: 0,             yRatio: 0.48, speed: 0.18, scaleX: 3.2, scaleY: 1.4, opacity: 0.09 },
      { x: -width * 0.4,  yRatio: 0.62, speed: -0.14, scaleX: 3.6, scaleY: 1.6, opacity: 0.11 },
      { x: width * 0.2,   yRatio: 0.35, speed: 0.12, scaleX: 2.8, scaleY: 1.2, opacity: 0.06 },
    ];

    // ─────────────────────────────────────────────────────────────
    // 5. PARALLAX & EVENT LISTENERS
    // ─────────────────────────────────────────────────────────────
    const onPointerMove = (e: PointerEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    // ─────────────────────────────────────────────────────────────
    // 6. MAIN RENDER LOOP (60 FPS HARDWARE ACCELERATED)
    // ─────────────────────────────────────────────────────────────
    let animId: number;

    const render = () => {
      // Smooth lerp mouse coordinates for organic parallax
      const dx = targetMouseX - mouseX;
      const dy = targetMouseY - mouseY;
      mouseX += dx * 0.04;
      mouseY += dy * 0.04;

      // Subtle parallax displacement
      parallaxX = (mouseX / width - 0.5) * 28;
      parallaxY = (mouseY / height - 0.5) * 20;

      ctx.clearRect(0, 0, width, height);

      // ── A. Deep Cold Midnight Navy / Slate Base ──
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0,   '#080e1c');
      bgGrad.addColorStop(0.4, '#0c152a');
      bgGrad.addColorStop(0.8, '#0a1224');
      bgGrad.addColorStop(1,   '#060a14');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // ── B. Subtle Blue Ambient Lighting (Behind Server Cards on Right) ──
      const blueX = width * 0.78 + parallaxX * 0.4;
      const blueY = height * 0.48 + parallaxY * 0.4;
      const blueGrad = ctx.createRadialGradient(blueX, blueY, 0, blueX, blueY, 680);
      blueGrad.addColorStop(0,   'rgba(30, 64, 175, 0.16)');
      blueGrad.addColorStop(0.4, 'rgba(14, 116, 144, 0.08)');
      blueGrad.addColorStop(0.8, 'rgba(15, 23, 42, 0.03)');
      blueGrad.addColorStop(1,   'rgba(0, 0, 0, 0)');
      ctx.fillStyle = blueGrad;
      ctx.fillRect(0, 0, width, height);

      // ── C. Soft Ambient Red Bleed (Warm light bleeding from smoke into background) ──
      const bleedX = width * 0.58 + parallaxX * 0.3;
      const bleedY = height * 0.44 + parallaxY * 0.3;
      const redBleed = ctx.createRadialGradient(bleedX, bleedY, 0, bleedX, bleedY, 520);
      redBleed.addColorStop(0,   'rgba(225, 29, 72, 0.10)');
      redBleed.addColorStop(0.4, 'rgba(180, 20, 50, 0.05)');
      redBleed.addColorStop(0.8, 'rgba(136, 19, 55, 0.015)');
      redBleed.addColorStop(1,   'rgba(0, 0, 0, 0)');
      ctx.fillStyle = redBleed;
      ctx.fillRect(0, 0, width, height);

      // ── D. Atmospheric White & Cool-Grey Mist (5–12% Opacity Drifting Horizontally) ──
      fogLayers.forEach((fog) => {
        fog.x += fog.speed;
        if (fog.speed > 0 && fog.x > width * 0.5) fog.x = -width * 0.5;
        if (fog.speed < 0 && fog.x < -width * 0.5) fog.x = width * 0.5;

        const fogY = height * fog.yRatio + parallaxY * 0.2;
        ctx.save();
        ctx.translate(width * 0.5 + fog.x + parallaxX * 0.2, fogY);
        ctx.scale(fog.scaleX, fog.scaleY);
        ctx.globalAlpha = fog.opacity;
        ctx.drawImage(spriteWhiteFog, -160, -160);
        ctx.restore();
      });

      // ── E. Volumetric Realistic Red Smoke Layers (Curling, Expanding, Dissolving) ──
      smokeParticles.forEach((p, idx) => {
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vRot;

        // Life cycle: smooth fade in, expansion, and soft dissolving
        const progress = p.life / p.maxLife;
        let alpha = p.baseAlpha;
        if (progress < 0.25) {
          alpha = p.baseAlpha * (progress / 0.25); // Fade in
        } else if (progress > 0.65) {
          alpha = p.baseAlpha * (1 - (progress - 0.65) / 0.35); // Dissolve
        }

        // Slow organic volumetric expansion
        const currentScale = p.scale + (p.maxScale - p.scale) * Math.sin(progress * Math.PI * 0.5);

        // Render smoke puff with parallax depth based on layer
        const layerParallax = (p.layer + 1) * 0.25;
        const renderX = p.x + parallaxX * layerParallax;
        const renderY = p.y + parallaxY * layerParallax;

        ctx.save();
        ctx.translate(renderX, renderY);
        ctx.rotate(p.rotation);
        ctx.scale(currentScale, currentScale);
        ctx.globalAlpha = Math.max(0, Math.min(alpha, 0.26));
        ctx.drawImage(p.sprite, -160, -160);
        ctx.restore();

        // Respawn when particle completes its lifecycle
        if (p.life >= p.maxLife) {
          smokeParticles[idx] = spawnSmoke(0);
        }
      });

      // ── F. Fine Floating Cinematic Dust Motes ──
      ctx.fillStyle = '#ffffff';
      dustMotes.forEach((mote) => {
        mote.x += mote.vx;
        mote.y += mote.vy;
        mote.phase += mote.phaseSpeed;

        // Wrap around bounds
        if (mote.y < 0) {
          mote.y = height + 10;
          mote.x = Math.random() * width;
        }
        if (mote.x < 0) mote.x = width;
        if (mote.x > width) mote.x = 0;

        // Gentle sinusoidal shimmer & sway
        const currentAlpha = mote.maxAlpha * (0.5 + 0.5 * Math.sin(mote.phase));
        const swayX = Math.sin(mote.phase * 0.8) * 4;

        ctx.globalAlpha = Math.max(0, Math.min(currentAlpha, 0.45));
        ctx.beginPath();
        ctx.arc(mote.x + swayX + parallaxX * 0.4, mote.y + parallaxY * 0.4, mote.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // If user prefers reduced motion, draw once and stop loop
      if (!prefersReducedMotion) {
        animId = requestAnimationFrame(render);
      }
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
      {/* ── High-Performance 60 FPS Atmospheric Canvas ── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* ── Fluted / Reeded Vertical Glass Texture (Subtle Micro-Grooves) ── */}
      <div
        className="absolute inset-0 reeded-glass opacity-25 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.03) 0px, rgba(255, 255, 255, 0.03) 1px, transparent 1px, transparent 6px)',
        }}
      />
    </div>
  );
};
