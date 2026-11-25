import s from "./KansaiMap.module.css";

/**
 * Backdrop of the Home "Your Kansai. Your Way." type window (Human instruction
 * 2026-11-22: a drawing of the Kansai area as the background, after the map of
 * sondaven.com — a dark, line-drawn map with rivers, rail lines, contour lines
 * and small labelled markers with distances).
 *
 * The map is drawn from real positions (equirectangular, lon 134.6–136.6,
 * lat 34.3–35.2 → 1600 × 900; x = (lon − 134.6) × 800, y = (35.2 − lat) × 1000).
 * Coastlines, rivers and rails are simplified by hand. Distances are straight
 * lines from Osaka (Umeda), rounded to the kilometre.
 *
 *   [data-km-leaf]  the warm paper seen through the cut-out letters first
 *                   (plain and light, so the letters read clearly)
 *   [data-km-line]  rivers and rail lines that draw themselves
 *   [data-km-stop]  markers and labels that come in
 */

type Stop = { name: string; km?: number; x: number; y: number; side: "l" | "r" | "t" | "b"; hub?: boolean };

const STOPS: Stop[] = [
  { name: "Osaka", x: 718, y: 497, side: "l", hub: true },
  { name: "Kyoto", km: 39, x: 926, y: 215, side: "r" },
  { name: "Nara", km: 30, x: 984, y: 515, side: "r" },
  { name: "Kobe", km: 28, x: 476, y: 510, side: "b" },
  { name: "Kansai Airport", km: 38, x: 515, y: 766, side: "r" },
];

const COAST =
  "M0 470L90 445L190 470L270 520L312 548L380 540L440 525L476 522L560 505L648 492L676 505L670 545L688 600L680 650L640 700L610 745L560 790L500 830L470 870L440 900";
const AWAJI = "M336 578L360 600L352 660L330 720L300 780L260 840L210 900L150 900L130 830L150 760L200 700L260 640L300 600Z";
const BIWA = "M1010 205L1030 160L1040 100L1070 40L1110 -20L1160 -60L1220 -80L1250 -40L1230 20L1180 60L1120 90L1080 130L1050 180L1025 215Z";

const RIVERS = [
  "M1012 210C1000 255 978 288 960 300C930 330 880 360 840 390S760 450 735 480S690 500 676 505", // Seta / Uji / Yodo
  "M945 92C940 150 932 200 936 262", // Kamo
  "M830 150C850 175 868 200 878 232S900 280 906 296", // Hozu / Katsura
  "M1180 560C1120 545 1060 540 1000 548S880 560 800 548", // Yamato (simplified)
];

const RAILS = [
  "M0 452C120 455 230 470 300 478C380 486 430 500 476 505S640 485 720 480S860 300 926 215S1040 170 1120 140S1300 110 1600 96", // Shinkansen
  "M926 215C950 300 970 400 984 515", // Kyoto – Nara
  "M720 500C800 505 900 520 984 515", // Osaka – Nara
  "M720 500C705 600 640 700 515 766", // Osaka – Kansai Airport
];

const ROADS = [
  "M300 420C380 430 450 440 520 470S640 470 700 470",
  "M520 400C560 450 600 470 640 520",
  "M720 380C760 420 800 450 840 470S920 470 980 480",
  "M780 260C820 280 860 300 900 300S980 290 1040 280",
  "M1040 300C1060 380 1080 450 1100 560",
  "M620 560C700 580 780 600 860 620S960 640 1060 650",
  "M820 640C860 700 900 760 940 860",
  "M560 340C640 330 720 320 800 300",
  "M1100 300C1180 320 1260 340 1340 380S1480 440 1600 460",
  "M1120 640C1200 660 1300 700 1400 760",
];

const CONTOURS: { cx: number; cy: number; rx: number; ry: number; r: number }[] = [
  { cx: 470, cy: 440, rx: 130, ry: 40, r: -8 }, // Rokko
  { cx: 852, cy: 525, rx: 34, ry: 100, r: 6 }, // Ikoma
  { cx: 880, cy: 80, rx: 150, ry: 60, r: 4 }, // Kitayama
  { cx: 1200, cy: 420, rx: 110, ry: 70, r: -12 }, // Iga / Shigaraki hills
  { cx: 860, cy: 820, rx: 120, ry: 50, r: 0 }, // Kongo
];

function Contour({ cx, cy, rx, ry, r }: (typeof CONTOURS)[number]) {
  return (
    <g transform={`rotate(${r} ${cx} ${cy})`}>
      {[1, 0.74, 0.5, 0.28].map((k) => (
        <ellipse key={k} cx={cx} cy={cy} rx={rx * k} ry={ry * k} />
      ))}
    </g>
  );
}

function Grid({ x, y, w, h, step }: { x: number; y: number; w: number; h: number; step: number }) {
  const v = Array.from({ length: Math.floor(w / step) + 1 }, (_, i) => x + i * step);
  const hz = Array.from({ length: Math.floor(h / step) + 1 }, (_, i) => y + i * step);
  return (
    <g className={s.grid}>
      {v.map((vx) => (
        <line key={`v${vx}`} x1={vx} y1={y} x2={vx} y2={y + h} />
      ))}
      {hz.map((hy) => (
        <line key={`h${hy}`} x1={x} y1={hy} x2={x + w} y2={hy} />
      ))}
    </g>
  );
}

function Label({ stop }: { stop: Stop }) {
  const dx = stop.side === "r" ? 22 : stop.side === "l" ? -22 : 0;
  const dy = stop.side === "t" ? -34 : stop.side === "b" ? 40 : -2;
  const anchor = stop.side === "r" ? "start" : stop.side === "l" ? "end" : "middle";
  return (
    <g data-km-stop="" className={stop.hub ? s.hub : s.stop}>
      {stop.hub ? <circle cx={stop.x} cy={stop.y} r="22" className={s.ping} /> : null}
      <circle cx={stop.x} cy={stop.y} r={stop.hub ? 13 : 9} className={s.ring} />
      <circle cx={stop.x} cy={stop.y} r={stop.hub ? 4.5 : 3.2} className={s.dot} />
      <text x={stop.x + dx} y={stop.y + dy} textAnchor={anchor} className={s.name}>
        {stop.name.toUpperCase()}
      </text>
      <text x={stop.x + dx} y={stop.y + dy + 19} textAnchor={anchor} className={s.km}>
        {stop.hub ? "DISTANCES FROM HERE" : `${stop.km} KM`}
      </text>
    </g>
  );
}

export function KansaiMap() {
  return (
    <div className={s.root} aria-hidden>
      <div className={s.mapWrap}>
        <svg className={s.map} viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
          <path className={s.sea} d={`${COAST}L0 900Z`} />
          <path className={s.sea} d={BIWA} />
          <path className={s.land} d={AWAJI} />
          <rect className={s.land} x="496" y="752" width="36" height="18" transform="rotate(-24 514 761)" />

          <g className={s.contours}>
            {CONTOURS.map((c, i) => (
              <Contour key={i} {...c} />
            ))}
          </g>

          <Grid x={882} y={150} w={84} h={120} step={12} />
          <Grid x={688} y={462} w={72} h={96} step={12} />
          <Grid x={950} y={496} w={48} h={36} step={12} />

          <g className={s.roads}>
            {ROADS.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>

          <path className={s.coast} d={COAST} />
          <path className={s.coast} d={AWAJI} />
          <path className={s.coast} d={BIWA} />

          <g className={s.rivers}>
            {RIVERS.map((d) => (
              <path key={d} data-km-line="" pathLength={1} d={d} />
            ))}
          </g>

          {RAILS.map((d) => (
            <g key={d} className={s.rail}>
              <path data-km-line="" pathLength={1} className={s.railOuter} d={d} />
              <path className={s.railInner} d={d} />
            </g>
          ))}

          <text x="560" y="650" className={s.water}>OSAKA BAY</text>
          <text x="214" y="770" className={s.water}>AWAJI</text>

          {STOPS.map((stop) => (
            <Label key={stop.name} stop={stop} />
          ))}
        </svg>
      </div>

      <div data-km-leaf="" className={s.leaf} />
      <div className={s.grain} />
    </div>
  );
}
