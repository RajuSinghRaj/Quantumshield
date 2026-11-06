import React, { useEffect, useRef } from 'react';

/**
 * Cinematic Atmospheric Fog & Smoke Engine
 * 
 * Implemented via hardware-accelerated WebGL shader (fBM fluid noise):
 * 1. Continuous, slow-billowing, organic cloudy white/grey fog across the background.
 * 2. Small, wispy, curling crimson smoke plume that smoothly tracks the cursor.
 * 3. Deep midnight slate-navy base with subtle blue ambient depth.
 * 4. 60+ FPS GPU acceleration, zero React re-renders, zero particle dots/circles.
 */
export const CursorGlowBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check for prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Initialize WebGL context
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false }) as WebGLRenderingContext | null;
    if (!gl) {
      console.warn('WebGL not supported, falling back to static background');
      return;
    }

    // ─────────────────────────────────────────────────────────────
    // 1. VERTEX SHADER (FULL-SCREEN QUAD)
    // ─────────────────────────────────────────────────────────────
    const vsSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // ─────────────────────────────────────────────────────────────
    // 2. FRAGMENT SHADER (fBM CLOUDY FOG & SMALL CURSOR RED SMOKE)
    // ─────────────────────────────────────────────────────────────
    const fsSource = `
      precision mediump float;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      uniform float u_time;

      // Fast, smooth pseudo-random hash
      float hash(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      // 2D Value Noise with Hermite interpolation
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      // Fractional Brownian Motion (4 octaves for rich curling smoke texture)
      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        vec2 shift = vec2(100.0);
        // Rotation matrix to eliminate grid artifacts
        mat2 rot = mat2(0.877, 0.479, -0.479, 0.877);
        for (int i = 0; i < 4; ++i) {
          v += a * noise(p);
          p = rot * p * 2.05 + shift;
          a *= 0.5;
        }
        return v;
      }

      // Second fBM variant for turbulent swirling wisps
      float fbmCurl(vec2 p) {
        float n1 = fbm(p);
        float n2 = fbm(p + vec2(5.2, 1.3));
        return fbm(p + vec2(n1, n2) * 1.4);
      }

      void main() {
        // Invert Y coordinate so shader coordinates match DOM window coordinates
        vec2 fragCoord = vec2(gl_FragCoord.x, u_resolution.y - gl_FragCoord.y);
        vec2 uv = fragCoord / u_resolution;
        float aspect = u_resolution.x / u_resolution.y;

        // ── A. Deep Cold Midnight Slate Base ──
        vec3 color = mix(
          vec3(0.035, 0.065, 0.125), // top cold slate-navy
          vec3(0.025, 0.045, 0.085), // bottom deep midnight
          uv.y
        );

        // Subtle ambient cold blue glow behind right-hand cards
        float rightBlueGlow = length(uv - vec2(0.75, 0.45));
        color += vec3(0.06, 0.12, 0.28) * smoothstep(0.65, 0.0, rightBlueGlow) * 0.45;

        // ── B. CONTINUOUS CLOUDY FOG IN BACKGROUND (WHITE/GREY) ──
        // Scale UV for wide, soft, billowing clouds
        vec2 fogUv = vec2(uv.x * aspect, uv.y) * 1.35;
        
        // Slow organic drift across background
        float t = u_time * 0.035;
        float fog1 = fbmCurl(fogUv * 1.2 + vec2(t * 0.6, t * 0.2));
        float fog2 = fbm(fogUv * 2.1 - vec2(t * 0.4, -t * 0.3));
        
        // Combine octaves into continuous cloudy fog
        float combinedFog = fog1 * 0.65 + fog2 * 0.35;
        float fogDensity = smoothstep(0.32, 0.72, combinedFog);

        // Emphasize cloudy fog across left and center (behind headline)
        float fogSpatialMask = smoothstep(0.95, 0.15, uv.x) * smoothstep(0.0, 0.25, uv.y) * smoothstep(1.0, 0.75, uv.y);
        float whiteFogIntensity = fogDensity * fogSpatialMask * 0.42;

        // Tint white/silver-grey with slight cool blue tone
        vec3 fogColor = mix(vec3(0.72, 0.78, 0.88), vec3(0.92, 0.95, 1.0), fog2);
        color = mix(color, fogColor, whiteFogIntensity);

        // ── C. SMALL ORGANIC RED SMOKE FOLLOWING CURSOR ──
        // Distance and vector from cursor
        vec2 d = fragCoord - u_mouse;
        float dist = length(d);

        // Size: small, compact wisp (radius ~150px)
        float smokeRadius = 155.0;

        // Evaluate curling smoke turbulence relative to cursor
        vec2 smokeCoord = d / 75.0;
        float smokeTime = u_time * 0.25;
        float smokePattern = fbmCurl(smokeCoord * 1.5 - vec2(smokeTime * 0.5, smokeTime * 0.7));

        // Soft, organic, non-circular boundary that curls in the wind
        float displacedDist = dist + (smokePattern - 0.5) * 65.0;
        float smokeFalloff = smoothstep(smokeRadius, 0.0, displacedDist);

        // Wispy internal smoke texture
        float smokeTexture = smoothstep(0.25, 0.70, smokePattern);
        float redSmokeAlpha = smokeFalloff * smokeTexture * 0.75;

        // Rich cinematic crimson/scarlet with subtle coral highlight
        vec3 redColor = mix(
          vec3(0.85, 0.12, 0.22), // deep crimson
          vec3(1.0, 0.32, 0.25),  // warm scarlet highlight
          smoothstep(0.4, 0.8, smokePattern)
        );

        // Soft ambient warm glow immediately around the red smoke
        float softGlow = smoothstep(220.0, 0.0, dist) * 0.18;
        color += vec3(0.9, 0.15, 0.2) * softGlow;

        // Blend the small red smoke wisp over the cloudy background
        color = mix(color, redColor, redSmokeAlpha);

        // Final output
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    // ─────────────────────────────────────────────────────────────
    // 3. COMPILE & LINK SHADERS
    // ─────────────────────────────────────────────────────────────
    const createShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = createShader(gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Fullscreen quad buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
         1.0,  1.0,
      ]),
      gl.STATIC_DRAW
    );

    const aPosition = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const uResolution = gl.getUniformLocation(program, 'u_resolution');
    const uMouse      = gl.getUniformLocation(program, 'u_mouse');
    const uTime       = gl.getUniformLocation(program, 'u_time');

    // ─────────────────────────────────────────────────────────────
    // 4. MOUSE TRACKING & PARALLAX LERP
    // ─────────────────────────────────────────────────────────────
    let targetMouseX = window.innerWidth * 0.60;
    let targetMouseY = window.innerHeight * 0.45;
    let curMouseX = targetMouseX;
    let curMouseY = targetMouseY;

    const onPointerMove = (e: PointerEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    handleResize();

    // ─────────────────────────────────────────────────────────────
    // 5. ANIMATION LOOP (60+ FPS HARDWARE-ACCELERATED SHADER)
    // ─────────────────────────────────────────────────────────────
    let animId: number;
    const startTime = performance.now();

    const render = () => {
      // Smooth lerp mouse coordinates for fluid smoke momentum
      curMouseX += (targetMouseX - curMouseX) * 0.085;
      curMouseY += (targetMouseY - curMouseY) * 0.085;

      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const elapsedSeconds = (performance.now() - startTime) * 0.001;

      gl.useProgram(program);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform2f(uMouse, curMouseX * dpr, curMouseY * dpr);
      gl.uniform1f(uTime, elapsedSeconds);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      if (!prefersReducedMotion) {
        animId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* ── WebGL High-Performance Fluid Shader Canvas ── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ width: '100%', height: '100%', display: 'block' }}
      />

      {/* ── Subtle Micro Reeded Glass Lines Texture ── */}
      <div
        className="absolute inset-0 reeded-glass opacity-25 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.035) 0px, rgba(255, 255, 255, 0.035) 1px, transparent 1px, transparent 6px)',
        }}
      />
    </div>
  );
};
