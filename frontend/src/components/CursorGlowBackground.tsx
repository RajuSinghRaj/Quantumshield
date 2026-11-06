import React, { useEffect, useRef } from 'react';

/**
 * Harry Potter Magical Atmosphere Engine 2.0
 * 
 * 1. Wand-Tip Cursor Emitter:
 *    - Real crimson & ruby smoke streaming organically directly from the cursor tip.
 *    - Continuous fluid ribbon interpolation (no disjoint dots or static blobs).
 *    - Wand flick sparks: Golden Lumos and ruby embers dancing in the air.
 *    - Spell Cast: Clicking releases an enchanted burst of spell sparks and vapor.
 * 2. Pensieve Background Mist:
 *    - Silvery-white authentic photographic smoke plumes rolling softly across the screen.
 *    - Distinct depth and clarity without obscuring text.
 * 3. Hogwarts Night Sky & Lumos Dust:
 *    - Deep enchanted midnight sky with floating starlight motes and gentle shimmer.
 * 4. 60+ FPS hardware acceleration, zero React re-renders, 100% accessible.
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

    // ─────────────────────────────────────────────────────────────
    // 1. LOAD GENUINE PHOTOGRAPHIC SMOKE SPRITES + PROCEDURAL FALLBACKS
    // ─────────────────────────────────────────────────────────────
    const redImages: HTMLImageElement[] = [];
    for (let i = 1; i <= 4; i++) {
      const img = new Image();
      img.src = `/assets/sprites/smoke_red_${i}.png`;
      redImages.push(img);
    }

    const whiteImages: HTMLImageElement[] = [];
    for (let i = 1; i <= 4; i++) {
      const img = new Image();
      img.src = `/assets/sprites/smoke_white_${i}.png`;
      whiteImages.push(img);
    }

    // High quality procedural fallbacks if images are loading
    const makeFallbackSprite = (type: 'crimson' | 'ruby' | 'white' | 'spark') => {
      const size = 160;
      const off = document.createElement('canvas');
      off.width = size;
      off.height = size;
      const oCtx = off.getContext('2d');
      if (!oCtx) return off;
      const c = size / 2;

      if (type === 'spark') {
        const g = oCtx.createRadialGradient(c, c, 0, c, c, 24);
        g.addColorStop(0, 'rgba(255, 240, 200, 1.0)');
        g.addColorStop(0.3, 'rgba(255, 120, 80, 0.7)');
        g.addColorStop(0.7, 'rgba(225, 29, 72, 0.2)');
        g.addColorStop(1, 'rgba(225, 29, 72, 0)');
        oCtx.fillStyle = g;
        oCtx.beginPath();
        oCtx.arc(c, c, 24, 0, Math.PI * 2);
        oCtx.fill();
        return off;
      }

      const lobes = [
        { x: 0,   y: 0,   r: 45, a: 0.28 },
        { x: -14, y: -10, r: 35, a: 0.20 },
        { x: 16,  y: 8,   r: 38, a: 0.22 },
        { x: -10, y: 12,  r: 32, a: 0.18 },
        { x: 12,  y: -12, r: 34, a: 0.18 },
      ];

      lobes.forEach(({ x, y, r, a }) => {
        const grad = oCtx.createRadialGradient(c + x, c + y, 0, c + x, c + y, r);
        if (type === 'white') {
          grad.addColorStop(0, `rgba(240, 248, 255, ${a * 1.5})`);
          grad.addColorStop(0.4, `rgba(210, 228, 255, ${a * 0.9})`);
          grad.addColorStop(0.8, `rgba(160, 185, 220, ${a * 0.3})`);
          grad.addColorStop(1, 'rgba(160, 185, 220, 0)');
        } else if (type === 'crimson') {
          grad.addColorStop(0, `rgba(244, 63, 94, ${a * 1.8})`);
          grad.addColorStop(0.4, `rgba(225, 29, 72, ${a * 1.2})`);
          grad.addColorStop(0.8, `rgba(159, 18, 57, ${a * 0.4})`);
          grad.addColorStop(1, 'rgba(159, 18, 57, 0)');
        } else {
          grad.addColorStop(0, `rgba(255, 99, 71, ${a * 1.9})`);
          grad.addColorStop(0.4, `rgba(239, 68, 68, ${a * 1.2})`);
          grad.addColorStop(0.8, `rgba(185, 28, 28, ${a * 0.4})`);
          grad.addColorStop(1, 'rgba(185, 28, 28, 0)');
        }
        oCtx.fillStyle = grad;
        oCtx.beginPath();
        oCtx.arc(c + x, c + y, r, 0, Math.PI * 2);
        oCtx.fill();
      });

      return off;
    };

    const fallbackCrimson = makeFallbackSprite('crimson');
    const fallbackRuby    = makeFallbackSprite('ruby');
    const fallbackWhite   = makeFallbackSprite('white');
    const fallbackSpark   = makeFallbackSprite('spark');

    // ─────────────────────────────────────────────────────────────
    // 2. MOUSE & WAND CURSOR TRACKING
    // ─────────────────────────────────────────────────────────────
    let mouseX = -9999;
    let mouseY = -9999;
    let prevMouseX = -9999;
    let prevMouseY = -9999;
    let hasInteracted = false;
    let isInsideWindow = false;

    // ─────────────────────────────────────────────────────────────
    // 3. WAND-TIP SMOKE STREAM ENGINE
    // ─────────────────────────────────────────────────────────────
    interface WandSmoke {
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
      spriteIdx: number;
      isRuby: boolean;
      turbulence: number;
    }

    const wandSmokeList: WandSmoke[] = [];
    const MAX_WAND_SMOKE = 90;

    const emitSingleSmokePuff = (x: number, y: number, vx: number, vy: number, scaleMultiplier = 1.0) => {
      if (wandSmokeList.length >= MAX_WAND_SMOKE) {
        wandSmokeList.shift();
      }

      const isRuby = Math.random() < 0.45;
      const spriteIdx = Math.floor(Math.random() * 4);
      wandSmokeList.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: vx * 0.14 + (Math.random() - 0.5) * 0.5,
        vy: vy * 0.14 - 0.35 - Math.random() * 0.45, // upward thermal buoyancy
        size: (26 + Math.random() * 18) * scaleMultiplier, // starts compact right at wand tip
        growRate: 1.018 + Math.random() * 0.008, // expands smoothly into silky plume
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.025,
        age: 0,
        maxAge: 75 + Math.random() * 40, // 1.3 - 2 seconds lifetime
        maxAlpha: 0.65 + Math.random() * 0.25,
        spriteIdx,
        isRuby,
        turbulence: Math.random() * 50,
      });
    };

    // ─────────────────────────────────────────────────────────────
    // 4. WAND SPARKS & SPELL CAST PARTICLES
    // ─────────────────────────────────────────────────────────────
    interface MagicSpark {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      decay: number;
      color: string;
      isStar?: boolean;
    }

    const sparkList: MagicSpark[] = [];
    const MAX_SPARKS = 70;

    const emitWandSparks = (x: number, y: number, vx: number, vy: number, count = 2) => {
      for (let i = 0; i < count; i++) {
        if (sparkList.length >= MAX_SPARKS) sparkList.shift();

        const angle = Math.random() * Math.PI * 2;
        const speed = 0.8 + Math.random() * 2.8;
        const isGold = Math.random() < 0.65;
        sparkList.push({
          x: x + (Math.random() - 0.5) * 6,
          y: y + (Math.random() - 0.5) * 6,
          vx: vx * 0.12 + Math.cos(angle) * speed,
          vy: vy * 0.12 + Math.sin(angle) * speed - 0.3,
          size: 1.2 + Math.random() * 2.0,
          alpha: 1.0,
          decay: 0.02 + Math.random() * 0.03,
          color: isGold ? '#fde047' : '#fb7185', // golden Lumos spark or ruby ember
          isStar: Math.random() < 0.35,
        });
      }
    };

    // Spell Cast Explosion on Click
    const castSpellBurst = (x: number, y: number) => {
      // 1. Ring of ruby smoke puffs
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        const spd = 1.8 + Math.random() * 1.5;
        emitSingleSmokePuff(x, y, Math.cos(ang) * spd, Math.sin(ang) * spd, 1.4);
      }
      // 2. Burst of magical golden & crimson starlight sparks
      for (let i = 0; i < 22; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 2.0 + Math.random() * 5.0;
        sparkList.push({
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 0.5,
          size: 1.5 + Math.random() * 2.8,
          alpha: 1.0,
          decay: 0.018 + Math.random() * 0.025,
          color: i % 2 === 0 ? '#fde047' : '#f43f5e',
          isStar: true,
        });
      }
    };

    // ─────────────────────────────────────────────────────────────
    // 5. PENSIEVE BACKGROUND WHITE MIST
    // ─────────────────────────────────────────────────────────────
    interface BackgroundMist {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      rotation: number;
      rotSpeed: number;
      alpha: number;
      maxAlpha: number;
      age: number;
      maxAge: number;
      spriteIdx: number;
    }

    const mistList: BackgroundMist[] = [];
    const MAX_MIST = 18;

    const spawnPensieveMist = (forcedRatio = 0) => {
      const maxAge = 450 + Math.random() * 300;
      mistList.push({
        x: width * (-0.1 + Math.random() * 0.65), // drifting across left and center
        y: height * (0.35 + Math.random() * 0.60), // lower & mid background
        vx: 0.20 + Math.random() * 0.35, // slow horizontal glide
        vy: -0.15 - Math.random() * 0.25, // gentle upward drift
        size: 260 + Math.random() * 180, // large soft volumetric billows
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.003,
        alpha: 0,
        maxAlpha: 0.38 + Math.random() * 0.28, // clearly visible silvery white mist
        age: forcedRatio > 0 ? maxAge * forcedRatio : 0,
        maxAge,
        spriteIdx: Math.floor(Math.random() * 4),
      });
    };

    // Seed initial mist clouds across screen
    for (let i = 0; i < MAX_MIST; i++) {
      spawnPensieveMist(i / MAX_MIST);
    }

    // ─────────────────────────────────────────────────────────────
    // 6. HOGWARTS LUMOS DUST & STARLIGHT MOTES
    // ─────────────────────────────────────────────────────────────
    interface LumosMote {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      phase: number;
      phaseSpeed: number;
      maxAlpha: number;
      color: string;
    }

    const motes: LumosMote[] = [];
    for (let i = 0; i < 40; i++) {
      motes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -0.15 - Math.random() * 0.3, // gently floating upward like embers in Great Hall
        size: 0.8 + Math.random() * 1.6,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: 0.018 + Math.random() * 0.025,
        maxAlpha: 0.30 + Math.random() * 0.45,
        color: Math.random() < 0.3 ? '#fef08a' : '#ffffff', // warm starlight or celestial white
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 7. EVENT LISTENERS
    // ─────────────────────────────────────────────────────────────
    const onPointerMove = (e: PointerEvent) => {
      hasInteracted = true;
      isInsideWindow = true;
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const onPointerDown = (e: PointerEvent) => {
      hasInteracted = true;
      isInsideWindow = true;
      mouseX = e.clientX;
      mouseY = e.clientY;
      castSpellBurst(mouseX, mouseY);
    };

    const onPointerLeave = () => {
      isInsideWindow = false;
    };

    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.addEventListener('mouseleave', onPointerLeave, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    // ─────────────────────────────────────────────────────────────
    // 8. 60+ FPS MAGICAL RENDER LOOP
    // ─────────────────────────────────────────────────────────────
    let animId: number;
    let frame = 0;

    const render = () => {
      frame++;

      // Compute wand cursor velocity & streaming
      if (hasInteracted && isInsideWindow && mouseX > -100 && mouseY > -100) {
        if (prevMouseX === -9999) {
          prevMouseX = mouseX;
          prevMouseY = mouseY;
        }

        const dx = mouseX - prevMouseX;
        const dy = mouseY - prevMouseY;
        const dist = Math.hypot(dx, dy);

        // Stream smoke along the cursor path:
        if (dist > 1.5) {
          // Continuous interpolation so smoke forms a seamless ribbon wisp
          const steps = Math.min(Math.ceil(dist / 14), 4);
          for (let s = 1; s <= steps; s++) {
            const t = s / steps;
            const ix = prevMouseX + dx * t;
            const iy = prevMouseY + dy * t;
            emitSingleSmokePuff(ix, iy, dx, dy);
          }

          if (dist > 7) {
            emitWandSparks(mouseX, mouseY, dx, dy, 1);
          }
        } else if (frame % 4 === 0) {
          // Hovering / idle: subtle curling wisp rises from the wand tip
          emitSingleSmokePuff(mouseX, mouseY, 0, -0.4, 0.85);
        }

        prevMouseX = mouseX;
        prevMouseY = mouseY;
      }

      // Replenish Pensieve background mist
      if (mistList.length < MAX_MIST && frame % 18 === 0) {
        spawnPensieveMist(0);
      }

      // ── Clear & Render Deep Hogwarts Twilight Navy ──
      ctx.clearRect(0, 0, width, height);

      const nightGrad = ctx.createLinearGradient(0, 0, width * 0.4, height);
      nightGrad.addColorStop(0,   '#050814'); // mystical midnight sky
      nightGrad.addColorStop(0.5, '#091124'); // deep sapphire navy
      nightGrad.addColorStop(1,   '#070d1c');
      ctx.fillStyle = nightGrad;
      ctx.fillRect(0, 0, width, height);

      // Deep celestial blue ambient backlight behind right-hand side
      const ambientGrad = ctx.createRadialGradient(width * 0.78, height * 0.45, 0, width * 0.78, height * 0.45, 800);
      ambientGrad.addColorStop(0,   'rgba(29, 78, 216, 0.20)');
      ambientGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.08)');
      ambientGrad.addColorStop(1,   'rgba(0, 0, 0, 0)');
      ctx.fillStyle = ambientGrad;
      ctx.fillRect(0, 0, width, height);

      // ── RENDER WITH LUMINOUS 'SCREEN' BLEND MODE ──
      ctx.globalCompositeOperation = 'screen';

      // 1. PENSIEVE BACKGROUND WHITE MIST
      for (let i = mistList.length - 1; i >= 0; i--) {
        const m = mistList[i];
        m.age++;
        if (m.age >= m.maxAge) {
          mistList.splice(i, 1);
          continue;
        }

        m.x += m.vx;
        m.y += m.vy;
        m.size *= 1.003;
        m.rotation += m.rotSpeed;

        const progress = m.age / m.maxAge;
        let a = m.maxAlpha;
        if (progress < 0.20) {
          a = m.maxAlpha * (progress / 0.20);
        } else if (progress > 0.65) {
          a = m.maxAlpha * (1 - (progress - 0.65) / 0.35);
        }

        const img = whiteImages[m.spriteIdx];
        const isLoaded = img && img.complete && img.naturalWidth > 0;
        const sprite = isLoaded ? img : fallbackWhite;

        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.rotate(m.rotation);
        ctx.globalAlpha = Math.max(0, Math.min(a, 0.65));
        ctx.drawImage(sprite, -m.size / 2, -m.size / 2, m.size, m.size);
        ctx.restore();
      }

      // 2. CURSOR WAND CRIMSON SMOKE (STREAMING ACTIVELY FROM CURSOR)
      for (let i = wandSmokeList.length - 1; i >= 0; i--) {
        const p = wandSmokeList[i];
        p.age++;
        if (p.age >= p.maxAge) {
          wandSmokeList.splice(i, 1);
          continue;
        }

        // Natural swirling fluid turbulence
        const curl = p.age * 0.045 + p.turbulence;
        p.vx += Math.cos(curl) * 0.14;
        p.vy += Math.sin(curl) * 0.08;

        p.x += p.vx;
        p.y += p.vy;
        p.size *= p.growRate;
        p.rotation += p.rotSpeed;

        const progress = p.age / p.maxAge;
        let a = p.maxAlpha;
        if (progress < 0.16) {
          a = p.maxAlpha * (progress / 0.16);
        } else if (progress > 0.45) {
          a = p.maxAlpha * (1 - (progress - 0.45) / 0.55);
        }

        const img = redImages[p.spriteIdx];
        const isLoaded = img && img.complete && img.naturalWidth > 0;
        const sprite = isLoaded ? img : (p.isRuby ? fallbackRuby : fallbackCrimson);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = Math.max(0, Math.min(a, 0.85));
        ctx.drawImage(sprite, -p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }

      // 3. WAND TIP HALO (Gentle Starlight Point at Cursor Tip)
      if (hasInteracted && isInsideWindow && mouseX > -100 && mouseY > -100) {
        ctx.save();
        ctx.translate(mouseX, mouseY);
        ctx.globalAlpha = 0.50;
        ctx.drawImage(fallbackSpark, -36, -36, 72, 72);
        ctx.restore();
      }

      // 4. WAND SPARKS & SPELL EMBERS
      for (let i = sparkList.length - 1; i >= 0; i--) {
        const sp = sparkList[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vx *= 0.94;
        sp.vy *= 0.94;
        sp.vy += 0.04; // subtle gravity
        sp.alpha -= sp.decay;

        if (sp.alpha <= 0) {
          sparkList.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(sp.alpha, 0.95));
        ctx.fillStyle = sp.color;

        if (sp.isStar) {
          // Render miniature magical 4-pointed sparkle
          const s = sp.size;
          ctx.beginPath();
          ctx.moveTo(sp.x, sp.y - s * 1.8);
          ctx.lineTo(sp.x + s * 0.4, sp.y - s * 0.4);
          ctx.lineTo(sp.x + s * 1.8, sp.y);
          ctx.lineTo(sp.x + s * 0.4, sp.y + s * 0.4);
          ctx.lineTo(sp.x, sp.y + s * 1.8);
          ctx.lineTo(sp.x - s * 0.4, sp.y + s * 0.4);
          ctx.lineTo(sp.x - s * 1.8, sp.y);
          ctx.lineTo(sp.x - s * 0.4, sp.y - s * 0.4);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 5. HOGWARTS LUMOS DUST & STARLIGHT MOTES
      motes.forEach((mote) => {
        mote.x += mote.vx;
        mote.y += mote.vy;
        mote.phase += mote.phaseSpeed;

        if (mote.y < 0) {
          mote.y = height + 10;
          mote.x = Math.random() * width;
        }
        if (mote.x < 0) mote.x = width;
        if (mote.x > width) mote.x = 0;

        const a = mote.maxAlpha * (0.35 + 0.65 * Math.sin(mote.phase));
        const sway = Math.sin(mote.phase * 0.8) * 3;

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(a, 0.60));
        ctx.fillStyle = mote.color;
        ctx.beginPath();
        ctx.arc(mote.x + sway, mote.y, mote.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Restore normal blending
      ctx.globalCompositeOperation = 'source-over';

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('mouseleave', onPointerLeave);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* ── High-Performance Hardware Accelerated Magical Canvas ── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* ── Subtle Micro Reeded Fluted Glass Texture ── */}
      <div
        className="absolute inset-0 reeded-glass opacity-25 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.035) 0px, rgba(255, 255, 255, 0.035) 1px, transparent 1px, transparent 6px)',
        }}
      />
    </div>
  );
};
