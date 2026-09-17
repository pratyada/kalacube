'use client';

/**
 * HeroCanvas — a lightweight WebGL flowing-gradient backdrop for the homepage
 * hero, in the KalaCUBE brand palette. Pure progressive enhancement:
 *
 *  - Mounts only after hydration (this is a client island); the hero H1/CTAs are
 *    server-rendered and painted instantly by a CSS gradient base behind it, so
 *    there is never a blank hero and LCP is unaffected.
 *  - Respects `prefers-reduced-motion`: draws a single static frame, no rAF loop.
 *  - Guards low-end/mobile: caps devicePixelRatio, renders at a reduced internal
 *    resolution (the gradient is soft, so this is invisible), and throttles to
 *    ~30fps.
 *  - Pauses the animation loop when the hero scrolls offscreen
 *    (IntersectionObserver) and when the tab is hidden (visibilitychange).
 *  - No-ops gracefully if WebGL is unavailable — the CSS base gradient remains.
 */

import { useEffect, useRef } from 'react';

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
precision mediump float;
uniform vec2 u_res;
uniform float u_time;

const vec3 cream  = vec3(0.980, 0.968, 0.949);
const vec3 blue   = vec3(0.906, 0.925, 1.000);
const vec3 indigo = vec3(0.125, 0.184, 0.604);
const vec3 teal   = vec3(0.090, 0.537, 0.498);
const vec3 orange = vec3(0.909, 0.447, 0.169);
const vec3 magenta= vec3(0.753, 0.224, 0.556);

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++){ v += a * noise(p); p *= 2.0; a *= 0.5; }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res.xy;
  vec2 asp = vec2(u_res.x / u_res.y, 1.0);
  vec2 p = uv * asp;
  float t = u_time * 0.025;

  // domain-warped flow field for an organic, drifting gradient
  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, -t)));
  vec2 r = vec2(fbm(p + 2.0 * q + vec2(1.7, t * 0.8)),
                fbm(p + 2.0 * q + vec2(8.3, -t * 0.6)));
  float f = fbm(p + 2.5 * r);

  // light, airy base so navy hero text stays legible
  vec3 col = mix(blue, cream, smoothstep(0.0, 1.0, f));
  col = mix(col, indigo, 0.30 * smoothstep(0.45, 0.95, length(r)));

  // faint drifting dimension-colour glows (Handicraft / Visual / Performing)
  float g1 = smoothstep(0.55, 0.0, length(p - vec2(0.35 + 0.15 * sin(t * 2.0), 0.42)));
  float g2 = smoothstep(0.50, 0.0, length(p - vec2(asp.x - 0.35 + 0.10 * cos(t * 1.6), 0.60)));
  float g3 = smoothstep(0.50, 0.0, length(p - vec2(0.5 * asp.x, 0.18 + 0.15 * sin(t * 1.2))));
  col = mix(col, teal,    0.10 * g1);
  col = mix(col, orange,  0.08 * g2);
  col = mix(col, magenta, 0.07 * g3);

  // keep the whole field bright and understated
  col = mix(col, cream, 0.22);
  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    gl.deleteShader(s);
    return null;
  }
  return s;
}

export default function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let gl: WebGLRenderingContext | null = null;
    try {
      gl =
        (canvas.getContext('webgl', {
          antialias: false,
          alpha: false,
          depth: false,
          powerPreference: 'low-power',
        }) as WebGLRenderingContext | null) ||
        (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
    } catch {
      gl = null;
    }
    if (!gl) return; // no WebGL → CSS base gradient remains

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    // one full-screen triangle
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const posLoc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'u_res');
    const uTime = gl.getUniformLocation(prog, 'u_time');

    // Render at a reduced internal resolution — the gradient is soft, so a low
    // buffer size is imperceptible but dramatically cheaper on mobile GPUs.
    const isSmall = window.innerWidth < 768;
    const dprCap = isSmall ? 1 : 1.5;
    const quality = isSmall ? 0.5 : 0.65;

    function resize() {
      if (!canvas || !gl) return;
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || Math.round(window.innerHeight * 0.92);
      const scale = Math.min(window.devicePixelRatio || 1, dprCap) * quality;
      const bw = Math.max(2, Math.round(w * scale));
      const bh = Math.max(2, Math.round(h * scale));
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      gl.viewport(0, 0, bw, bh);
      gl.uniform2f(uRes, bw, bh);
    }
    resize();

    let raf = 0;
    let running = false;
    let visible = true;
    let onScreen = true;
    let last = 0;
    const start = performance.now();
    const FRAME_MS = 1000 / 30; // throttle to ~30fps

    function draw(now: number) {
      if (!gl) return;
      gl.uniform1f(uTime, (now - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    function loop(now: number) {
      if (!running) return;
      if (now - last >= FRAME_MS) {
        last = now;
        draw(now);
      }
      raf = requestAnimationFrame(loop);
    }

    function play() {
      if (running || reduced || !visible || !onScreen) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(loop);
    }
    function pause() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    // Reveal the canvas over the CSS base once we have a first frame.
    draw(performance.now());
    canvas.style.opacity = '1';

    if (reduced) {
      // static single frame — no loop
    } else {
      play();
    }

    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              onScreen = entries[0]?.isIntersecting ?? true;
              if (onScreen) play();
              else pause();
            },
            { threshold: 0 },
          )
        : null;
    io?.observe(canvas);

    const onVisibility = () => {
      visible = !document.hidden;
      if (visible) play();
      else pause();
    };
    document.addEventListener('visibilitychange', onVisibility);

    let resizeRaf = 0;
    const onResize = () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        resize();
        if (reduced || !running) draw(performance.now());
      });
    };
    window.addEventListener('resize', onResize);

    return () => {
      pause();
      io?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(resizeRaf);
      const ext = gl?.getExtension('WEBGL_lose_context');
      ext?.loseContext();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-700"
    />
  );
}
