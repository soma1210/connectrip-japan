#!/usr/bin/env python3
"""
Builds the Connectrip Select illustrated Osaka map geometry
(src/website-v1/assets/osakaIllustratedMap.ts) from OpenStreetMap data.

Map data © OpenStreetMap contributors, ODbL 1.0. The output is a heavily
simplified "produced work"; the page shows the attribution.

Inputs (JSON files in DATA_DIR, fetched once by hand; see README in the
output header):
  coast.json   Overpass: way[natural=coastline](BBOX); out geom;
  rivers.json  Overpass: way[waterway=river][name~"^(淀川|…)$"](BBOX); out geom;
  parks.json   Overpass: way/relation[leisure=park][name~"^(大阪城公園|…)$"](BBOX); out geom;
  minoh.json   Overpass: way[name~"明治の森箕面"]; out geom(BBOX);
  pref_nom.json Nominatim: 大阪府 with polygon_geojson=1&polygon_threshold=0.0003

Usage: python3 scripts/select/build-osaka-illustration.py DATA_DIR

Projection: Web Mercator normalised to 0..1 (same as SelectMap), stored as
integer units = (normalised - ORIGIN) * SCALE, SCALE = 256 * 2^15
(about 4.8 m per unit in Osaka).
"""
import json
import math
import os
import sys

DATA = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "src", "website-v1", "assets", "osakaIllustratedMap.ts")

# Drawn extent (lat/lng). Wider than the 16 spots so the map never ends at a pin.
S, W, N, E = 34.50, 135.10, 34.98, 135.86
SCALE = 256 * 2**15
TOL = 3.0  # Douglas-Peucker tolerance in units (~14 m)


def proj(lat, lng):
    s = math.sin(math.radians(lat))
    return (lng + 180) / 360, 0.5 - math.log((1 + s) / (1 - s)) / (4 * math.pi)


OX, OY = proj(N, W)
EX, EY = proj(S, E)


def unit(lat, lng):
    x, y = proj(lat, lng)
    return ((x - OX) * SCALE, (y - OY) * SCALE)


WIDTH = (EX - OX) * SCALE
HEIGHT = (EY - OY) * SCALE


def dp(points, tol):
    """Douglas-Peucker on (x, y) lists. Closed rings are split at their farthest point."""
    if len(points) < 3:
        return points
    if points[0] == points[-1]:
        far = max(range(len(points)), key=lambda i: math.dist(points[0], points[i]))
        if far == 0:
            return points
        return dp(points[: far + 1], tol)[:-1] + dp(points[far:], tol)
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        a, b = stack.pop()
        ax, ay = points[a]
        bx, by = points[b]
        dx, dy = bx - ax, by - ay
        norm = math.hypot(dx, dy) or 1e-9
        best, idx = 0.0, -1
        for i in range(a + 1, b):
            px, py = points[i]
            d = abs(dy * px - dx * py + bx * ay - by * ax) / norm
            if d > best:
                best, idx = d, i
        if best > tol and idx > 0:
            keep[idx] = True
            stack += [(a, idx), (idx, b)]
    return [p for p, k in zip(points, keep) if k]


def path(points, close=False):
    if not points:
        return ""
    s = "M" + " L".join(f"{round(x)} {round(y)}" for x, y in points)
    return s + ("Z" if close else "")


def load(name):
    return json.load(open(os.path.join(DATA, name)))["elements"]


# --- Coastline → sea polygons ------------------------------------------------
# OSM coastlines run with land on the left. Stitch ways into chains; closed
# chains are islands (land). Open chains are clipped to the drawn box and the
# sea is closed along the box edge, walking clockwise (water on the right).

def stitch(ways):
    chains = [list(w) for w in ways]
    merged = True
    while merged:
        merged = False
        for i in range(len(chains)):
            for j in range(len(chains)):
                if i != j and chains[i] and chains[j] and chains[i][-1] == chains[j][0]:
                    chains[i] = chains[i] + chains[j][1:]
                    chains[j] = []
                    merged = True
        chains = [c for c in chains if c]
    return chains


coast_ways = [[(round(p["lat"], 7), round(p["lon"], 7)) for p in e["geometry"]] for e in load("coast.json")]
chains = stitch(coast_ways)
islands = [c for c in chains if c[0] == c[-1]]
open_chains = [c for c in chains if c[0] != c[-1]]

BOX = [(0.0, 0.0), (WIDTH, 0.0), (WIDTH, HEIGHT), (0.0, HEIGHT)]  # clockwise on screen (y down)


def inside(p):
    return 0 <= p[0] <= WIDTH and 0 <= p[1] <= HEIGHT


def edge_hit(p, q):
    """Point where segment p→q crosses the box boundary (p inside, q outside or vice versa)."""
    best = None
    for t_edge in range(4):
        (x1, y1), (x2, y2) = BOX[t_edge], BOX[(t_edge + 1) % 4]
        # Solve p + t(q-p) = e1 + u(e2-e1)
        rx, ry = q[0] - p[0], q[1] - p[1]
        sx, sy = x2 - x1, y2 - y1
        den = rx * sy - ry * sx
        if abs(den) < 1e-12:
            continue
        t = ((x1 - p[0]) * sy - (y1 - p[1]) * sx) / den
        u = ((x1 - p[0]) * ry - (y1 - p[1]) * rx) / den
        if 0 <= t <= 1 and 0 <= u <= 1 and (best is None or t < best[0]):
            best = (t, (p[0] + t * rx, p[1] + t * ry))
    return best[1] if best else None


def perimeter_pos(p):
    """Clockwise position along the box perimeter (screen coords, y down)."""
    x, y = p
    eps = 1e-6
    if abs(y) < eps:
        return x
    if abs(x - WIDTH) < eps:
        return WIDTH + y
    if abs(y - HEIGHT) < eps:
        return WIDTH + HEIGHT + (WIDTH - x)
    return 2 * WIDTH + HEIGHT + (HEIGHT - y)


def clip_chain(chain):
    pts = [unit(*p) for p in chain]
    pieces, cur = [], []
    for i, p in enumerate(pts):
        if inside(p):
            if not cur and i > 0:
                cur.append(edge_hit(p, pts[i - 1]))
            cur.append(p)
        elif cur:
            cur.append(edge_hit(cur[-1], p))
            pieces.append(cur)
            cur = []
    if cur:
        pieces.append(cur)
    return [pc for pc in pieces if len(pc) >= 2 and None not in pc]


pieces = [pc for c in open_chains for pc in clip_chain(c)]
# Screen y is down, so "clockwise on screen" keeps the OSM rule (land left, water right).
corners = [(0, (0.0, 0.0)), (WIDTH, (WIDTH, 0.0)), (WIDTH + HEIGHT, (WIDTH, HEIGHT)), (2 * WIDTH + HEIGHT, (0.0, HEIGHT))]
PER = 2 * (WIDTH + HEIGHT)
starts = sorted(((perimeter_pos(pc[0]), i) for i, pc in enumerate(pieces)))
used, seas = set(), []
for _, first in starts:
    if first in used:
        continue
    poly, i = [], first
    while i not in used:
        used.add(i)
        pc = pieces[i]
        poly += pc
        pos = perimeter_pos(pc[-1])
        # Next piece start clockwise from here.
        cand = sorted(((s - pos) % PER, j) for s, j in starts)
        nxt = cand[0][1]
        dist = cand[0][0]
        # add box corners between pos and next start
        walk = []
        for c_pos, c_pt in corners:
            d = (c_pos - pos) % PER
            if 0 < d < dist:
                walk.append((d, c_pt))
        poly += [p for _, p in sorted(walk)]
        i = nxt
    seas.append(poly)

sea_paths = [path(dp(p, TOL), close=True) for p in seas]
island_polys = [dp([unit(*p) for p in c], TOL) for c in islands]
island_polys = [p for p in island_polys if len(p) >= 4 and any(inside(q) for q in p)]

# --- Osaka Prefecture --------------------------------------------------------
pref = json.load(open(os.path.join(DATA, "pref_nom.json")))[0]["geojson"]
rings = pref["coordinates"] if pref["type"] == "Polygon" else [r for poly in pref["coordinates"] for r in poly]
pref_paths = [path(dp([unit(lat, lng) for lng, lat in ring], TOL), close=True) for ring in rings]

# --- Parks -------------------------------------------------------------------

def element_rings(e):
    if e["type"] == "way":
        return [[(p["lat"], p["lon"]) for p in e["geometry"]]]
    outers = [[(p["lat"], p["lon"]) for p in m["geometry"]] for m in e["members"] if m.get("role") == "outer" and m.get("geometry")]
    return stitch(outers)


parks = []
for e in load("parks.json") + load("minoh.json"):
    for ring in element_rings(e):
        pts = dp([unit(*p) for p in ring if p], TOL)
        if len(pts) >= 4:
            parks.append({"name": e["tags"].get("name:en") or e["tags"].get("name"), "d": path(pts, close=True), "kind": "forest" if "箕面" in e["tags"].get("name", "") else "park"})

# --- Rivers (centre lines with a drawn width in metres) ----------------------
RIVER_WIDTH_M = {
    "淀川": 600, "神崎川": 220, "大和川": 260, "大川": 140, "安治川": 160, "木津川": 140, "尻無川": 120,
    "堂島川": 90, "土佐堀川": 80, "寝屋川": 70, "第二寝屋川": 50, "平野川": 40, "安威川": 90, "猪名川": 110,
    "左門殿川": 120, "六軒家川": 80, "正蓮寺川": 70, "西除川": 40, "東横堀川": 35, "道頓堀川": 35, "箕面川": 25,
}
M_PER_UNIT = 40075016.686 * math.cos(math.radians(34.7)) / SCALE
rivers = []
for e in load("rivers.json"):
    name = e["tags"]["name"]
    pts = [unit(p["lat"], p["lon"]) for p in e["geometry"]]
    if not any(inside(p) for p in pts):
        continue
    rivers.append({"name": name, "d": path(dp(pts, TOL)), "w": round(RIVER_WIDTH_M.get(name, 40) / M_PER_UNIT, 1)})

# Label anchors taken from the data (not placed by eye).
def yodo_label():
    best = None
    for e in load("rivers.json"):
        if e["tags"]["name"] != "淀川":
            continue
        g = e["geometry"]
        for i in range(len(g) - 1):
            a, b = g[i], g[i + 1]
            mid_lng = (a["lon"] + b["lon"]) / 2
            score = abs(mid_lng - 135.47)
            if 34.69 < a["lat"] < 34.74 and (best is None or score < best[0]):
                ax, ay = unit(a["lat"], a["lon"])
                bx, by = unit(b["lat"], b["lon"])
                ang = math.degrees(math.atan2(by - ay, bx - ax))
                if ang > 90: ang -= 180
                if ang < -90: ang += 180
                best = (score, (a["lat"] + b["lat"]) / 2, mid_lng, round(ang, 1))
    return {"text": "Yodo River", "lat": round(best[1], 6), "lng": round(best[2], 6), "rotate": best[3], "kind": "water"}


def in_poly(pt, poly):
    x, y = pt
    inside_ = False
    for i in range(len(poly)):
        (x1, y1), (x2, y2) = poly[i], poly[i - 1]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            inside_ = not inside_
    return inside_


def bay_label():
    # Centre of the largest open-water area in the south-west of the drawn box, checked to be sea.
    for lat, lng in [(34.655, 135.385), (34.645, 135.375), (34.62, 135.36)]:
        pt = unit(lat, lng)
        if any(in_poly(pt, poly) for poly in seas) and not any(in_poly(pt, isl) for isl in island_polys):
            return {"text": "Osaka Bay", "lat": lat, "lng": lng, "rotate": 0, "kind": "sea"}
    raise SystemExit("no sea point for the Osaka Bay label")


labels = [yodo_label(), bay_label()]
ORIGIN = (OX, OY)
out = f"""/**
 * Connectrip Select — illustrated Osaka map geometry (generated).
 *
 * Map data © OpenStreetMap contributors (ODbL 1.0), heavily simplified into
 * an original illustration: coastline → sea, Osaka Prefecture outline, major
 * rivers, a few parks. Do not edit by hand; regenerate with
 * `python3 scripts/select/build-osaka-illustration.py DATA_DIR`.
 *
 * Units: Web Mercator normalised (0..1), minus ORIGIN, times SCALE
 * (about {M_PER_UNIT:.1f} m per unit at Osaka). Same projection as the spot pins.
 */
export const ILLUSTRATION = {{
  origin: {{ x: {ORIGIN[0]!r}, y: {ORIGIN[1]!r} }},
  scale: {SCALE},
  width: {round(WIDTH)},
  height: {round(HEIGHT)},
  sea: {json.dumps(sea_paths)},
  islands: {json.dumps([path(p, close=True) for p in island_polys])},
  prefecture: {json.dumps(pref_paths)},
  parks: {json.dumps(parks, ensure_ascii=False)},
  rivers: {json.dumps(rivers, ensure_ascii=False)},
  /** Label anchors derived from the data (e.g. a point on the Yodo River centre line). */
  labels: {json.dumps(labels, ensure_ascii=False)},
}} as const;
"""
open(OUT, "w").write(out)
print(f"wrote {OUT}: {len(out)//1024} KB · sea {len(sea_paths)} · islands {len(island_polys)} · parks {len(parks)} · rivers {len(rivers)}")
