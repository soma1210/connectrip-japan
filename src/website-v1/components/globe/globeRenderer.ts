import { approachOf, camDist } from "./globeCamera";

/**
 * Cinematic Globe renderer (V1.4, Human instruction 2026-11-15). Started as a
 * port of the standalone prototype v1.2; V1.3 gave it the site's own
 * direction; V1.4 refines the picture. Loaded lazily by
 * CinematicGlobePhilosophy when the section comes near the viewport.
 *
 * Earth: one full-screen ray-cast shader (day / night / cloud textures).
 * V1.4: terrain relief and cloud shading that follow the real sun direction,
 * cloud shadows cast away from the sun, a two-lobe ocean glint, warm city
 * lights, and an atmosphere with a thin lit rim, a soft outer falloff and a
 * warm tint at the terminator. Seven texture reads per pixel (V1.3: four),
 * no extra passes.
 *
 * Connections: fifteen white great-circle arcs from Osaka, precomputed once
 * in 3D and only rotated / projected per frame on a 2D overlay that follows
 * the same camera. A light travels from Osaka along each line and leaves a
 * fine trail; once a line has arrived, a quiet light keeps travelling along
 * it. Hidden behind the globe, lines never cross the Earth. Strokes are
 * batched by brightness (V1.3 stroked every segment twice).
 *
 * The caller owns the animation loop; this module only draws a frame.
 * Without WebGL (or on any GL / texture error) the caller shows the static
 * image. `destroy()` frees the program, shaders, buffer and textures and
 * releases the context.
 */

export type GlobeTextures = { day: string; night: string; clouds: string };

/**
 * Where the words sit, in arcs-canvas coordinates (0..1), and how visible
 * they are (`k` 0..1). Lines passing behind them are dimmed.
 */
export type QuietZone = { x0: number; y0: number; x1: number; y1: number; k: number };

export type GlobeRenderer = {
  /**
   * Draws one frame. `p` = scroll progress 0..1, `time` = seconds of motion,
   * `still` = no drift. Returns false when nothing was drawn (textures not
   * loaded yet, or failed), so the caller keeps the static image.
   */
  render(p: number, time: number, still: boolean, quiet?: QuietZone): boolean;
  /** Marks the drawing buffer for a resize (called from a ResizeObserver). */
  resize(): void;
  /** Lower the pixel ratio (used when frames are too slow). */
  setLowQuality(): void;
  destroy(): void;
};

type Options = {
  canvas: HTMLCanvasElement;
  arcCanvas: HTMLCanvasElement;
  textures: GlobeTextures;
  mobile: boolean;
  /** All three textures are on the GPU: frames now show the real Earth. */
  onReady: () => void;
  /** WebGL failed (no context, shader error, context lost). The caller shows the static image. */
  onFail: (reason: string) => void;
};

/** Osaka, Japan: every connection starts here. */
const OSAKA = { lat: 34.6937, lon: 135.5023 };

/** Osaka lights up over this scroll range, before the first line leaves. */
const HUB_START = 0.13;
const HUB_END = 0.21;

/**
 * Connections from Osaka. A visual of "from Osaka to the world": not routes,
 * offices or services. Each line grows over its own scroll window
 * `[start, start + span]`, so the network builds up with the scroll and
 * rewinds with it: nearby Asia first (cut 2), then Asia Pacific, then the
 * rest of the world (cut 3); the last line arrives as cut 4 begins.
 * Coordinates: city centres (lat °N, lon °E). `weight`: brightness, lower
 * where two lines share most of their path (London / Paris, Los Angeles /
 * Vancouver), so they do not add up to one thick line.
 */
const ROUTES = [
  // Phase 1 — nearby Asia
  { name: "Seoul", lat: 37.5665, lon: 126.978, start: 0.215, span: 0.085, weight: 1 },
  { name: "Shanghai", lat: 31.2304, lon: 121.4737, start: 0.255, span: 0.085, weight: 1 },
  { name: "Taipei", lat: 25.033, lon: 121.5654, start: 0.295, span: 0.085, weight: 0.92 },
  { name: "Hong Kong", lat: 22.3193, lon: 114.1694, start: 0.335, span: 0.09, weight: 1 },
  // Phase 2 — Asia Pacific
  { name: "Manila", lat: 14.5995, lon: 120.9842, start: 0.41, span: 0.1, weight: 0.95 },
  { name: "Bangkok", lat: 13.7563, lon: 100.5018, start: 0.44, span: 0.11, weight: 1 },
  { name: "Singapore", lat: 1.3521, lon: 103.8198, start: 0.47, span: 0.11, weight: 0.95 },
  { name: "Jakarta", lat: -6.2088, lon: 106.8456, start: 0.495, span: 0.115, weight: 0.9 },
  { name: "Sydney", lat: -33.8688, lon: 151.2093, start: 0.52, span: 0.12, weight: 1 },
  // Phase 3 — the world
  { name: "Dubai", lat: 25.2048, lon: 55.2708, start: 0.55, span: 0.13, weight: 1 },
  { name: "London", lat: 51.5074, lon: -0.1278, start: 0.58, span: 0.14, weight: 1 },
  { name: "Paris", lat: 48.8566, lon: 2.3522, start: 0.6, span: 0.14, weight: 0.72 },
  { name: "Vancouver", lat: 49.2827, lon: -123.1207, start: 0.61, span: 0.13, weight: 0.8 },
  { name: "Los Angeles", lat: 34.0522, lon: -118.2437, start: 0.625, span: 0.135, weight: 1 },
  { name: "New York", lat: 40.7128, lon: -74.006, start: 0.64, span: 0.135, weight: 1 },
];
const STEPS = 80;
/** Arcs canvas size relative to the globe canvas (CSS: `.arcs` is inset -10%). */
export const ARC_SCALE = 1.2;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

const toVec = (latD: number, lonD: number): [number, number, number] => {
  const la = (latD * Math.PI) / 180;
  const lo = (lonD * Math.PI) / 180;
  return [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)];
};

type Arc = {
  /** STEPS + 1 points in world space (unit sphere, slightly lifted). */
  pts: Float32Array;
  /** Angle Osaka → city, radians. */
  omega: number;
  start: number;
  end: number;
  weight: number;
  /** Ambient light: cycles per second and phase (deterministic per line). */
  speed: number;
  phase: number;
};

/**
 * Great-circle arcs, computed once. Low arcs: they stay close to the surface
 * and curve with it, like real routes (a high lift reads as wires above the
 * Earth). Each frame only rotates and projects these points.
 */
function buildArcs(): Arc[] {
  const a = toVec(OSAKA.lat, OSAKA.lon);
  return ROUTES.map((r, index) => {
    const b = toVec(r.lat, r.lon);
    const omega = Math.acos(clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1));
    // Near-identical paths get slightly different heights, so they separate a little near the horizon.
    const lift = 0.004 + (0.058 + (index % 2) * 0.012) * Math.pow(omega / Math.PI, 1.2);
    const pts = new Float32Array((STEPS + 1) * 3);
    for (let i = 0; i <= STEPS; i++) {
      const t = i / STEPS;
      const k0 = Math.sin((1 - t) * omega) / Math.sin(omega);
      const k1 = Math.sin(t * omega) / Math.sin(omega);
      const alt = 1.003 + Math.sin(t * Math.PI) * lift;
      pts[i * 3] = (k0 * a[0] + k1 * b[0]) * alt;
      pts[i * 3 + 1] = (k0 * a[1] + k1 * b[1]) * alt;
      pts[i * 3 + 2] = (k0 * a[2] + k1 * b[2]) * alt;
    }
    return {
      pts,
      omega,
      start: r.start,
      end: r.start + r.span,
      weight: r.weight,
      // Longer lines take longer to cross (5.5–9 s); phases spread so lights do not leave together.
      speed: 1 / (5.5 + 3.5 * (omega / Math.PI) + (index % 3) * 0.6),
      phase: (index * 0.381966) % 1,
    };
  });
}

const VERTEX = `attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const FRAGMENT = `precision highp float;
varying vec2 v_uv;
uniform sampler2D u_dayTex;
uniform sampler2D u_nightTex;
uniform sampler2D u_cloudTex;
uniform vec2 u_camLonLat;
uniform vec3 u_sunDir;
uniform vec3 u_sunWorld;
uniform vec2 u_texel;
uniform float u_cloudShift;
uniform float u_camDist;
const float PI = 3.14159265359;
const float RADIUS = 0.925;
const float ATMO = 0.074;
float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
// Atmosphere past the limb at height h (0 = the Earth's edge, 1 = its outer end): colour and opacity.
vec4 halo(vec2 dir, float h, vec3 sun, float sinH, float cosH) {
  float sunL = dot(vec3(dir * cosH, sinH), sun);
  float lit = smoothstep(-0.22, 0.55, sunL);
  float glow = (0.95 * exp(-h * h * 22.0) + 0.52 * exp(-h * 3.6)) * (0.035 + 0.965 * lit) * (1.0 - smoothstep(0.7, 1.0, h));
  // Sunlight grazing the air near the terminator turns warm.
  vec3 tint = mix(vec3(0.93, 0.56, 0.36), vec3(0.33, 0.62, 0.98), smoothstep(-0.02, 0.34, sunL));
  return vec4(tint, glow);
}
void main() {
  vec2 s = v_uv / RADIUS;
  float r2 = dot(s, s);
  float rMax = 1.0 + ATMO;
  if (r2 > rMax * rMax) { gl_FragColor = vec4(0.0); return; }
  vec3 sun = normalize(u_sunDir);
  float CAM_DIST = u_camDist;
  float sinH = 1.0 / CAM_DIST;
  float cosH = sqrt(1.0 - sinH * sinH);
  if (r2 > 1.0) {
    // Atmosphere seen past the limb: a thin lit line on the Earth's edge and a soft falloff into space.
    float r = sqrt(r2);
    gl_FragColor = halo(s / r, (r - 1.0) / ATMO, sun, sinH, cosH);
    return;
  }
  float tanFov = sinH / cosH;
  vec3 rd = normalize(vec3(s * tanFov, -1.0));
  float b = 2.0 * CAM_DIST * rd.z;
  float c = CAM_DIST * CAM_DIST - 1.0;
  float disc = max(0.0, b * b - 4.0 * c);
  float tHit = (-b - sqrt(disc)) * 0.5;
  vec3 vNorm = normalize(vec3(0.0, 0.0, CAM_DIST) + tHit * rd);
  float cLon = u_camLonLat.x;
  float cLat = u_camLonLat.y;
  vec3 p1 = vec3(vNorm.x, vNorm.y * cos(cLat) + vNorm.z * sin(cLat), -vNorm.y * sin(cLat) + vNorm.z * cos(cLat));
  vec3 wNorm = vec3(p1.x * cos(cLon) + p1.z * sin(cLon), p1.y, -p1.x * sin(cLon) + p1.z * cos(cLon));
  float lat = asin(clamp(wNorm.y, -1.0, 1.0));
  float lon = atan(wNorm.x, wNorm.z);
  vec2 uv = vec2((lon + PI) / (2.0 * PI), (0.5 * PI - lat) / PI);

  // The sun in the local east / north frame: drives relief, cloud shading and cloud shadows.
  float cosLat = max(0.18, sqrt(1.0 - wNorm.y * wNorm.y));
  vec3 east = vec3(wNorm.z, 0.0, -wNorm.x) / cosLat;
  vec3 north = cross(wNorm, east);
  float sunE = dot(u_sunWorld, east);
  float sunN = dot(u_sunWorld, north);
  vec2 toSun = vec2(sunE / cosLat / (2.0 * PI), -sunN / PI);

  vec3 dayCol = texture2D(u_dayTex, uv).rgb;
  float h0 = luma(dayCol);
  float hE = luma(texture2D(u_dayTex, uv + vec2(u_texel.x, 0.0)).rgb);
  float hN = luma(texture2D(u_dayTex, uv - vec2(0.0, u_texel.y)).rgb);
  float isOcean = step(dayCol.r * 1.25, dayCol.b) * step(dayCol.g * 1.08, dayCol.b);
  // Natural colour: a little less saturated than the source, deeper open sea.
  dayCol = mix(vec3(h0), dayCol, 0.88);
  dayCol *= mix(vec3(1.0, 0.985, 0.955), vec3(0.80, 0.90, 1.04), isOcean);
  // Terrain relief on land: slopes turned to the sun are a touch lighter, the others darker.
  float slope = (hE - h0) * sunE + (hN - h0) * sunN;
  dayCol *= 1.0 + clamp(-slope * 5.5, -0.22, 0.26) * (1.0 - isOcean);

  vec3 nightCol = texture2D(u_nightTex, uv).rgb;
  // Clouds float above the surface (view parallax). One extra read toward the sun gives both the shadow on the ground and the shading of the cloud tops.
  vec2 cuv = vec2(uv.x + 0.0016 * (1.0 - vNorm.z) + u_cloudShift, uv.y);
  float cAlpha = texture2D(u_cloudTex, vec2(fract(cuv.x), cuv.y)).a;
  vec2 suv = cuv + toSun * 0.0105;
  float cSun = texture2D(u_cloudTex, vec2(fract(suv.x), clamp(suv.y, 0.0, 1.0))).a;

  float sunDot = dot(vNorm, sun);
  float dayFactor = 1.0 / (1.0 + exp(-sunDot * 8.8));
  float diffuse = clamp((sunDot + 0.12) / 1.12, 0.03, 1.0);
  float viewCos = max(0.0, (vNorm.z - sinH) / (1.0 - sinH));
  dayCol *= (1.0 - cSun * 0.40) * (0.86 + 0.14 * viewCos);

  // Sun glint on the sea: a tight highlight inside a wide soft sheen.
  vec3 halfVec = normalize(sun - rd);
  float nh = max(0.0, dot(vNorm, halfVec));
  float spec = (pow(nh, 170.0) * 0.20 + pow(nh, 26.0) * 0.045) * isOcean * dayFactor * (1.0 - cAlpha);
  spec += pow(nh, 46.0) * 0.02 * (1.0 - isOcean) * dayFactor;

  float cityMask = pow(max(0.0, 1.0 - dayFactor * 0.80), 1.12) * (1.0 - cAlpha * 0.6);
  vec3 col = dayCol * diffuse * dayFactor + nightCol * vec3(1.45, 1.08, 0.66) * cityMask + vec3(0.90, 0.94, 0.99) * spec;
  // A thin blue veil of air over the day side.
  col = mix(col, vec3(0.32, 0.55, 0.90), 0.045 * dayFactor);
  float twilight = exp(-pow((sunDot - 0.01) / 0.16, 2.0));
  col += vec3(0.047, 0.024, 0.063) * twilight * (0.4 + 0.6 * cAlpha);

  // Clouds: lit tops, shaded sides away from the sun, warm where the sun is low.
  float cloudShade = clamp(0.80 + (cAlpha - cSun) * 1.25, 0.52, 1.06);
  float cloudLight = max(0.04, diffuse * 0.96 + 0.04) * cloudShade;
  vec3 cloudDay = mix(vec3(0.95, 0.97, 0.996), vec3(1.0, 0.80, 0.62), twilight * 0.55) * cloudLight;
  vec3 cloudCol = mix(vec3(0.039, 0.063, 0.110), cloudDay, dayFactor);
  col = mix(col, cloudCol, smoothstep(0.02, 0.92, cAlpha) * 0.84);

  // Air seen edge-on: blue toward the limb, a fine bright rim on the sunlit edge.
  float fresnel = pow(1.0 - viewCos, 3.4);
  float sunAtmo = clamp((sunDot + 0.28) / 1.15, 0.04, 1.0);
  col += vec3(0.267, 0.588, 0.941) * (fresnel * sunAtmo * 0.95);
  col += vec3(0.70, 0.86, 1.0) * (pow(1.0 - viewCos, 10.0) * sunAtmo * 0.55);

  // Gentle film contrast.
  col = clamp(col, 0.0, 1.0);
  col = mix(col, col * col * (3.0 - 2.0 * col), 0.24);
  // The last pixels of the disc blend into the air just outside it (no dark seam between Earth and atmosphere).
  float rr = sqrt(r2);
  float edgeAA = clamp((1.0 - rr) / 0.006, 0.0, 1.0);
  if (edgeAA < 1.0) {
    vec4 air = halo(s / max(rr, 0.0001), 0.0, sun, sinH, cosH);
    gl_FragColor = vec4(mix(air.rgb, col, edgeAA), mix(air.a, 1.0, edgeAA));
    return;
  }
  gl_FragColor = vec4(col, 1.0);
}`;

/** Radius of the Earth's disc as a share of the globe canvas half-size (shader RADIUS). */
const DISC = 0.925;

/**
 * Camera and sun for a scroll progress. The distance comes from the shared
 * camera path (globeCamera.ts): the same lens the section uses to size the
 * globe. On the way in the camera moves from over the East China Sea toward
 * the western Pacific, slowly climbing north, so the view turns around Japan.
 */
function camera(p: number, time: number, still: boolean, mobile: boolean) {
  const approach = approachOf(p);
  // The light reaches East Asia by the time Osaka lights up, then keeps turning slowly.
  const sunTurn = Math.min(1, 0.25 + approach * 0.9);
  const driftLon = still ? 0 : Math.sin(time * 0.11) * 1.6;
  const driftLat = still ? 0 : Math.cos(time * 0.11) * 0.25;
  return {
    // Ends with Japan left of centre (seen off-centre, great circles read as arcs, not spokes). Phones crop the sides, so Japan ends nearer the middle.
    lon: lerp(118, mobile ? 144 : 150, approach) + driftLon,
    lat: lerp(15, 35, approach) + driftLat,
    dist: camDist(p),
    // Arrival: a thin sunlit crescent on the west limb. The sun swings toward the camera from the front-left, so Japan and East Asia end in daylight and the terminator runs down the eastern edge (a lit, rounded Earth).
    sun: [lerp(-0.92, -0.42, sunTurn), lerp(0.36, 0.38, sunTurn), lerp(-0.2, 0.82, sunTurn)] as const,
    cloudShift: still ? 0 : time * 0.00045 + p * 0.008,
  };
}

// Scratch buffers for one arc: screen position, visibility and brightness per point.
const PX = new Float32Array(STEPS + 2);
const PY = new Float32Array(STEPS + 2);
const PA = new Float32Array(STEPS + 2);
const PB = new Float32Array(STEPS + 2);

/** Strokes one arc as a few polylines, one per brightness level (1/40 steps). */
function strokeArc(ctx: CanvasRenderingContext2D, last: number, scale: number) {
  let current = 0;
  let open = false;
  for (let i = 1; i <= last; i++) {
    const visible = PA[i - 1] > 0 && PA[i] > 0;
    const alpha = visible ? Math.min(1, Math.round(0.5 * (PB[i - 1] + PB[i]) * scale * 40) / 40) : 0;
    if (alpha !== current) {
      if (open) ctx.stroke();
      open = alpha > 0;
      if (open) {
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.moveTo(PX[i - 1], PY[i - 1]);
      }
      current = alpha;
    }
    if (open) ctx.lineTo(PX[i], PY[i]);
  }
  if (open) ctx.stroke();
}

function dot(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, alpha: number, style: string) {
  if (alpha <= 0.004) return;
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.fillStyle = style;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

const WHITE = "rgb(255, 247, 230)";
const HALO = "rgb(232, 190, 116)";

/**
 * White connections from Osaka. `size` = arcs canvas size in px, `radius` =
 * globe radius in px on that canvas. Points behind the globe are skipped (ray
 * / sphere test from the camera), so lines pass over the horizon, never
 * through the Earth. Growth follows the scroll only; the travelling lights
 * follow `time` and rest when `still`.
 */
function drawArcs(
  ctx: CanvasRenderingContext2D,
  arcs: Arc[],
  size: number,
  radius: number,
  cam: { lon: number; lat: number; dist: number },
  p: number,
  time: number,
  still: boolean,
  finished: boolean,
  quiet: QuietZone | undefined,
) {
  ctx.clearRect(0, 0, size, size);
  // Lines add up like light where they cross.
  ctx.globalCompositeOperation = "lighter";
  if (!finished && p < HUB_START) return;
  const cx = size * 0.5;
  const cy = size * 0.5;
  const d = cam.dist;
  const cosL = Math.cos((cam.lon * Math.PI) / 180);
  const sinL = Math.sin((cam.lon * Math.PI) / 180);
  const cosB = Math.cos((cam.lat * Math.PI) / 180);
  const sinB = Math.sin((cam.lat * Math.PI) / 180);
  const sinH = 1 / d;
  const focal = Math.sqrt(d * d - 1);
  const unit = radius / 470;
  // Cut 4: the words take over. The network settles to a quieter glow and its lights slow to a murmur.
  const settle = finished ? 1 : smoothstep(0.74, 0.9, p);
  const gain = 1 - 0.22 * settle;
  const ambient = still ? 0 : 1 - 0.6 * settle;
  const c = d * d - 1;

  // The words' box on this canvas, with a soft margin.
  const qk = quiet ? quiet.k * 0.5 : 0;
  const qx0 = quiet ? quiet.x0 * size : 0;
  const qx1 = quiet ? quiet.x1 * size : 0;
  const qy0 = quiet ? quiet.y0 * size : 0;
  const qy1 = quiet ? quiet.y1 * size : 0;
  const qm = size * 0.045;
  const quietAt = (x: number, y: number) =>
    qk <= 0 ? 1 : 1 - qk * smoothstep(qx0 - qm, qx0, x) * (1 - smoothstep(qx1, qx1 + qm, x)) * smoothstep(qy0 - qm, qy0, y) * (1 - smoothstep(qy1, qy1 + qm, y));

  // Projects point i of an arc. Returns its visibility (0 = hidden) and writes the screen position.
  const out = { x: 0, y: 0 };
  const project = (pts: Float32Array, i: number) => {
    const wx = pts[i * 3];
    const wy = pts[i * 3 + 1];
    const wz = pts[i * 3 + 2];
    const x1 = wx * cosL - wz * sinL;
    const z1 = wx * sinL + wz * cosL;
    const vy = wy * cosB - z1 * sinB;
    const vz = wy * sinB + z1 * cosB;
    const k = (focal / (d - vz)) * radius;
    out.x = cx + x1 * k;
    out.y = cy - vy * k;
    // Occlusion: does the segment camera → point hit the unit sphere first?
    const dz = vz - d;
    const a = x1 * x1 + vy * vy + dz * dz;
    const b = 2 * d * dz;
    const disc = b * b - 4 * a * c;
    if (disc > 0 && (-b - Math.sqrt(disc)) / (2 * a) < 0.992) return 0;
    // Fades out as the ground under it nears the horizon (measured on the surface, not on the lifted line):
    // a line slips over the edge of the Earth, it never sticks out into space or hooks back around.
    // It is gone just before the limb, where a great circle seen edge-on would bunch up into a bright tick.
    const limb = smoothstep(sinH + 0.07, sinH + 0.3, vz / Math.sqrt(wx * wx + wy * wy + wz * wz));
    const r = Math.hypot(out.x - cx, out.y - cy) / radius;
    return limb * (1 - smoothstep(0.972, 0.998, r));
  };

  ctx.lineJoin = "round";
  ctx.lineCap = "butt";
  let hubX = cx;
  let hubY = cy;
  let hubVisible = 0;

  for (let r = 0; r < arcs.length; r++) {
    const arc = arcs[r];
    const pts = arc.pts;
    if (r === 0) {
      hubVisible = project(pts, 0);
      hubX = out.x;
      hubY = out.y;
    }
    const grow = finished ? 1 : smoothstep(arc.start, arc.end, p);
    if (grow <= 0.002) continue;
    const head = grow * STEPS;
    const last = Math.min(STEPS, Math.ceil(head));
    const growing = grow < 1;
    // Ambient light: enters before Osaka's end of the line and leaves past the far end, so it never pops.
    const pulseAt = !growing && ambient > 0 ? (((time * arc.speed + arc.phase) % 1) * 1.3 - 0.15) : -9;

    for (let i = 0; i <= last; i++) {
      PA[i] = project(pts, i);
      PX[i] = out.x;
      PY[i] = out.y;
    }
    if (last > head) {
      // The travelling tip sits between two precomputed points.
      const f = head - (last - 1);
      PX[last] = PX[last - 1] + (PX[last] - PX[last - 1]) * f;
      PY[last] = PY[last - 1] + (PY[last] - PY[last - 1]) * f;
      PA[last] = PA[last - 1] > 0 && PA[last] > 0 ? PA[last] : 0;
    }
    for (let i = 0; i <= last; i++) {
      const t = Math.min(i, head) / STEPS;
      // Quieter where the fifteen lines meet at Osaka (no white knot), and toward the far end.
      const rest = (0.42 + 0.58 * smoothstep(0, 0.085, t * arc.omega)) * (1 - 0.3 * Math.pow(t, 1.4)) * arc.weight * gain;
      // The trail: brightest right behind the travelling light, easing down to the resting line.
      const trail = growing ? 0.9 * Math.exp(-(grow - t) / 0.085) : 0;
      let light = 0;
      if (pulseAt > -1) {
        const dt = t - pulseAt;
        light = (dt > 0 ? Math.exp(-(dt * dt) / 0.00016) : Math.exp(dt / 0.075)) * 0.55 * ambient;
      }
      PB[i] = PA[i] * quietAt(PX[i], PY[i]) * (rest * (1 + trail) + light);
    }

    // Soft blue-white glow under, fine white core over.
    ctx.strokeStyle = HALO;
    ctx.lineWidth = 6 * unit;
    strokeArc(ctx, last, 0.12);
    ctx.lineWidth = 2.6 * unit;
    strokeArc(ctx, last, 0.22);
    ctx.strokeStyle = r % 3 === 1 ? "rgb(250, 232, 196)" : WHITE;
    ctx.lineWidth = Math.max(0.8, 1.05 * unit);
    strokeArc(ctx, last, 0.92);

    const tipVisible = PA[last] * quietAt(PX[last], PY[last]);
    if (growing) {
      // The light on its way out from Osaka.
      dot(ctx, PX[last], PY[last], 5.4 * unit, 0.2 * tipVisible * gain, HALO);
      dot(ctx, PX[last], PY[last], Math.max(1.1, 1.7 * unit), 0.95 * tipVisible * gain, WHITE);
    } else {
      // Arrived: a small point of light, a little brighter just as the line lands.
      const landing = finished ? 0 : 1 - smoothstep(arc.end, arc.end + 0.05, p);
      dot(ctx, PX[last], PY[last], (3.6 + 3.2 * landing) * unit, (0.13 + 0.12 * landing) * tipVisible * gain, HALO);
      dot(ctx, PX[last], PY[last], Math.max(1, 1.3 * unit), (0.72 + 0.2 * landing) * tipVisible * gain, WHITE);
      if (pulseAt > 0 && pulseAt < 1) {
        const at = pulseAt * STEPS;
        const i0 = Math.min(STEPS - 1, Math.floor(at));
        const f = at - i0;
        if (PA[i0] > 0 && PA[i0 + 1] > 0) {
          const x = PX[i0] + (PX[i0 + 1] - PX[i0]) * f;
          const y = PY[i0] + (PY[i0 + 1] - PY[i0]) * f;
          // Fades in after leaving Osaka and out before the far end.
          const v = Math.min(PA[i0], PA[i0 + 1]) * quietAt(x, y) * ambient * smoothstep(0, 0.1, pulseAt) * (1 - smoothstep(0.86, 1, pulseAt));
          dot(ctx, x, y, 3.2 * unit, 0.16 * v, HALO);
          dot(ctx, x, y, Math.max(0.9, 1.15 * unit), 0.8 * v, WHITE);
        }
      }
    }
  }

  // Osaka: lights up quietly before the first line leaves; one ring spreads from it as it does.
  const hub = (finished ? 1 : smoothstep(HUB_START, HUB_END, p)) * hubVisible;
  if (hub > 0.01) {
    const breathe = still ? 1 : 1 + 0.1 * Math.sin(time * 1.3);
    const ring = finished ? 0 : smoothstep(HUB_START + 0.02, HUB_END + 0.07, p);
    if (ring > 0 && ring < 1) {
      ctx.globalAlpha = 0.34 * Math.sin(Math.PI * ring) * hubVisible;
      ctx.strokeStyle = HALO;
      ctx.lineWidth = Math.max(0.75, unit);
      ctx.beginPath();
      ctx.arc(hubX, hubY, (5 + 26 * ring) * unit, 0, Math.PI * 2);
      ctx.stroke();
    }
    dot(ctx, hubX, hubY, 15 * unit * breathe, 0.07 * hub, HALO);
    dot(ctx, hubX, hubY, 7.5 * unit * breathe, 0.2 * hub, HALO);
    dot(ctx, hubX, hubY, Math.max(1.6, 2.4 * unit), 0.96 * hub, "rgb(255, 255, 255)");
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

export function createGlobeRenderer({ canvas, arcCanvas, textures, mobile, onReady, onFail }: Options): GlobeRenderer | null {
  const attrs: WebGLContextAttributes = { alpha: true, antialias: true, premultipliedAlpha: false };
  let gl: WebGLRenderingContext | null = null;
  try {
    gl = canvas.getContext("webgl", attrs) ?? (canvas.getContext("experimental-webgl", attrs) as WebGLRenderingContext | null);
  } catch {
    gl = null;
  }
  const arcCtx = arcCanvas.getContext("2d");
  if (!gl || !arcCtx) {
    onFail(gl ? "no-2d-context" : "no-webgl");
    return null;
  }
  const g = gl;

  const shaders: WebGLShader[] = [];
  const compile = (type: number, src: string) => {
    const sh = g.createShader(type);
    if (!sh) return null;
    g.shaderSource(sh, src);
    g.compileShader(sh);
    if (!g.getShaderParameter(sh, g.COMPILE_STATUS)) {
      g.deleteShader(sh);
      return null;
    }
    shaders.push(sh);
    return sh;
  };
  const vs = compile(g.VERTEX_SHADER, VERTEX);
  const fs = compile(g.FRAGMENT_SHADER, FRAGMENT);
  const program = vs && fs ? g.createProgram() : null;
  if (program && vs && fs) {
    g.attachShader(program, vs);
    g.attachShader(program, fs);
    g.linkProgram(program);
  }
  if (!program || !g.getProgramParameter(program, g.LINK_STATUS)) {
    shaders.forEach((s) => g.deleteShader(s));
    if (program) g.deleteProgram(program);
    onFail("shader-error");
    return null;
  }

  g.useProgram(program);
  const buffer = g.createBuffer();
  g.bindBuffer(g.ARRAY_BUFFER, buffer);
  g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), g.STATIC_DRAW);
  const aPos = g.getAttribLocation(program, "a_pos");
  g.enableVertexAttribArray(aPos);
  g.vertexAttribPointer(aPos, 2, g.FLOAT, false, 0, 0);

  const uniforms = {
    camLonLat: g.getUniformLocation(program, "u_camLonLat"),
    sunDir: g.getUniformLocation(program, "u_sunDir"),
    sunWorld: g.getUniformLocation(program, "u_sunWorld"),
    texel: g.getUniformLocation(program, "u_texel"),
    cloudShift: g.getUniformLocation(program, "u_cloudShift"),
    camDist: g.getUniformLocation(program, "u_camDist"),
  };
  // Until the day texture arrives: the texel of a 2048 × 1024 map.
  g.uniform2f(uniforms.texel, 1 / 2048, 1 / 1024);
  // Blend state never changes: set once, not every frame.
  g.enable(g.BLEND);
  g.blendFunc(g.SRC_ALPHA, g.ONE_MINUS_SRC_ALPHA);
  g.clearColor(0, 0, 0, 0);
  const arcs = buildArcs();

  let destroyed = false;
  let failed = false;
  let ready = 0;
  const glTextures: WebGLTexture[] = [];
  const images: HTMLImageElement[] = [];

  const loadTexture = (unit: number, src: string, uniform: string) => {
    const tex = g.createTexture();
    if (!tex) return;
    glTextures.push(tex);
    g.activeTexture(g.TEXTURE0 + unit);
    g.bindTexture(g.TEXTURE_2D, tex);
    // Deep-navy placeholder pixel until the image arrives (v1.2).
    g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, 1, 1, 0, g.RGBA, g.UNSIGNED_BYTE, new Uint8Array([8, 18, 36, 255]));
    g.uniform1i(g.getUniformLocation(program, uniform), unit);
    const img = new Image();
    images.push(img);
    img.decoding = "async";
    img.onload = () => {
      if (destroyed || failed) return;
      g.activeTexture(g.TEXTURE0 + unit);
      g.bindTexture(g.TEXTURE_2D, tex);
      g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, img);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.REPEAT);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
      if (unit === 0) {
        // Relief is read one texel east / north of each point.
        g.useProgram(program);
        g.uniform2f(uniforms.texel, 1 / img.naturalWidth, 1 / img.naturalHeight);
      }
      ready += 1;
      if (ready === 3) onReady();
    };
    img.onerror = () => {
      if (destroyed || failed) return;
      failed = true;
      onFail("texture-error");
    };
    img.src = src;
  };
  loadTexture(0, textures.day, "u_dayTex");
  loadTexture(1, textures.night, "u_nightTex");
  loadTexture(2, textures.clouds, "u_cloudTex");

  const onLost = (e: Event) => {
    e.preventDefault();
    if (destroyed || failed) return;
    failed = true;
    onFail("context-lost");
  };
  canvas.addEventListener("webglcontextlost", onLost, false);

  let maxDpr = mobile ? 1.25 : 1.5;
  let needsResize = true;
  const resizeBuffers = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    const css = canvas.clientWidth || (mobile ? 540 : 1000);
    // Cap the drawing buffer: the globe box can be larger than the screen.
    const w = Math.max(1, Math.min(mobile ? 900 : 1800, Math.round(css * dpr)));
    if (canvas.width !== w || canvas.height !== w) {
      canvas.width = w;
      canvas.height = w;
    }
    // The arcs canvas is ARC_SCALE times the globe box, so lifted arcs can pass outside the disc.
    const aw = Math.round(w * ARC_SCALE);
    if (arcCanvas.width !== aw || arcCanvas.height !== aw) {
      arcCanvas.width = aw;
      arcCanvas.height = aw;
    }
    g.viewport(0, 0, w, w);
    needsResize = false;
  };

  return {
    render(p, time, still, quiet) {
      if (destroyed || failed || ready < 3) return false;
      if (needsResize) resizeBuffers();
      const cam = camera(p, time, still, mobile);
      const lon = (cam.lon * Math.PI) / 180;
      const lat = (cam.lat * Math.PI) / 180;
      // The sun in world space (same rotation the shader applies to the surface normal).
      const n = Math.hypot(cam.sun[0], cam.sun[1], cam.sun[2]);
      const sx = cam.sun[0] / n;
      const sy = cam.sun[1] / n;
      const sz = cam.sun[2] / n;
      const y1 = sy * Math.cos(lat) + sz * Math.sin(lat);
      const z1 = -sy * Math.sin(lat) + sz * Math.cos(lat);
      g.useProgram(program);
      g.uniform2f(uniforms.camLonLat, lon, lat);
      g.uniform3f(uniforms.sunDir, cam.sun[0], cam.sun[1], cam.sun[2]);
      g.uniform3f(uniforms.sunWorld, sx * Math.cos(lon) + z1 * Math.sin(lon), y1, -sx * Math.sin(lon) + z1 * Math.cos(lon));
      g.uniform1f(uniforms.cloudShift, cam.cloudShift);
      g.uniform1f(uniforms.camDist, cam.dist);
      g.clear(g.COLOR_BUFFER_BIT);
      g.drawArrays(g.TRIANGLES, 0, 6);
      drawArcs(arcCtx, arcs, arcCanvas.width, canvas.width * 0.5 * DISC, cam, p, time, still, still && p >= 1, quiet);
      return true;
    },
    resize() {
      needsResize = true;
    },
    setLowQuality() {
      maxDpr = 1;
      needsResize = true;
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      canvas.removeEventListener("webglcontextlost", onLost, false);
      images.forEach((img) => {
        img.onload = null;
        img.onerror = null;
        img.src = "";
      });
      if (!g.isContextLost()) {
        glTextures.forEach((t) => g.deleteTexture(t));
        if (buffer) g.deleteBuffer(buffer);
        shaders.forEach((s) => g.deleteShader(s));
        g.deleteProgram(program);
        g.getExtension("WEBGL_lose_context")?.loseContext();
      }
      arcCtx.clearRect(0, 0, arcCanvas.width, arcCanvas.height);
    },
  };
}
