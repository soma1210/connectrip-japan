import type { ConnectripSelectViewModel, GeoSource, ImageAsset, SelectAreaKey, SelectSpot } from "@/contracts";
import { routeHref } from "../../routes";
import { pageSeo, proposed, tbd } from "../shared";

/**
 * Connectrip Select — Osaka, v0.1 prototype dataset (16 well-known spots).
 *
 * Not a fixed list: spots will be added (hidden gems later) or changed.
 * Categories are a simple prototype classification, not a decision.
 *
 * Coordinates: never estimated. Each one comes from OpenStreetMap
 * (Nominatim, the feature named in `ref`) or Wikidata (P625), and was
 * cross-checked against the other source where both exist (2026-10-24).
 */
const CHECKED = "2026-10-24";
const DECISION = "Connectrip Select (W1-D17)";
const PROTOTYPE = "Connectrip Select v0.1 prototype data";

const osm = (ref: string, cross?: GeoSource["crossCheck"], note?: string): GeoSource => ({
  kind: "openstreetmap",
  ref,
  checkedAt: CHECKED,
  ...(cross ? { crossCheck: cross } : {}),
  ...(note ? { note } : {}),
});
const wd = (ref: string, distanceMeters: number) => ({ kind: "wikidata" as const, ref, distanceMeters });

/** Current site photos (rights NOT_VERIFIED): preview only. Others are placeholders until Connectrip's own photos. */
const photo = (src: string, alt: string, width: number, height: number): ImageAsset => ({
  src,
  alt,
  width,
  height,
  rights: "NOT_VERIFIED",
  consent: "NOT_VERIFIED",
});
const placeholder = tbd("Connectrip photo TBD");
const PHOTO_SOURCE = "Current site photo, rights NOT_VERIFIED, preview only";

const SPOTS: SelectSpot[] = [
  // Kita / Umeda
  {
    id: "umeda-sky-building", slug: "umeda-sky-building", name: "Umeda Sky Building", nameJa: "梅田スカイビル",
    area: "kita_umeda", categories: ["culture"],
    latitude: 34.7052927, longitude: 135.4905349,
    geoSource: osm("relation/3389505", wd("Q1151808", 74)), mainImage: placeholder,
  },
  {
    id: "osaka-station", slug: "osaka-station-umeda", name: "Osaka Station / Umeda", nameJa: "大阪駅・梅田",
    area: "kita_umeda", categories: ["shopping", "food"],
    latitude: 34.7025087, longitude: 135.4961773,
    geoSource: osm("relation/17915329", wd("Q801694", 6)), mainImage: placeholder,
  },
  // Central Osaka
  {
    id: "nakanoshima", slug: "nakanoshima", name: "Nakanoshima", nameJa: "中之島",
    area: "central_osaka", categories: ["culture", "nature"],
    latitude: 34.6923995, longitude: 135.5077568,
    geoSource: osm("way/54037338", wd("Q6960289", 141), "Pin on Nakanoshima Park (the island's visitor area), not the island centroid"),
    mainImage: placeholder,
  },
  // Osaka Castle
  {
    id: "osaka-castle", slug: "osaka-castle", name: "Osaka Castle", nameJa: "大阪城",
    area: "osaka_castle", categories: ["culture", "nature", "family"],
    latitude: 34.6873735, longitude: 135.5258555,
    geoSource: osm("way/34619038", wd("Q321242", 17)),
    mainImage: proposed(photo("/images/hero/slides/01-osaka-castle.jpg", "Osaka Castle", 1706, 960), PHOTO_SOURCE),
  },
  // Minami / Namba
  {
    id: "dotonbori", slug: "dotonbori", name: "Dotonbori", nameJa: "道頓堀",
    area: "minami_namba", categories: ["food", "shopping"],
    latitude: 34.6690306, longitude: 135.5015715,
    geoSource: osm("node/4029007869", wd("Q964876", 43)),
    mainImage: proposed(photo("/images/gallery/gallery-dotonbori.jpg", "Dotonbori canal and signs, Osaka", 1307, 1599), PHOTO_SOURCE),
  },
  {
    id: "shinsaibashi", slug: "shinsaibashi", name: "Shinsaibashi", nameJa: "心斎橋",
    area: "minami_namba", categories: ["shopping", "food"],
    latitude: 34.6706744, longitude: 135.5013256,
    geoSource: osm("way/895630634", wd("Q1049109", 236), "Shinsaibashi-suji shopping street (Wikidata point is the wider district)"),
    mainImage: placeholder,
  },
  {
    id: "kuromon-market", slug: "kuromon-market", name: "Kuromon Market", nameJa: "黒門市場",
    area: "minami_namba", categories: ["food"],
    latitude: 34.6653277, longitude: 135.5069795,
    geoSource: osm("node/4161997589", wd("Q10855506", 0)), mainImage: placeholder,
  },
  {
    id: "namba-yasaka-shrine", slug: "namba-yasaka-shrine", name: "Namba Yasaka Shrine", nameJa: "難波八阪神社",
    area: "minami_namba", categories: ["culture"],
    latitude: 34.6614819, longitude: 135.4967325,
    geoSource: osm("way/637023828", wd("Q11659527", 29)), mainImage: placeholder,
  },
  // Tennoji / Shinsekai
  {
    id: "shinsekai", slug: "shinsekai", name: "Shinsekai", nameJa: "新世界",
    area: "tennoji_shinsekai", categories: ["food", "culture"],
    latitude: 34.6520901, longitude: 135.5061908,
    geoSource: osm("node/4190308689", undefined, "Wikipedia reuses the Tsutenkaku coordinate for the district; OSM has a separate Shinsekai point"), mainImage: placeholder,
  },
  {
    id: "tsutenkaku", slug: "tsutenkaku", name: "Tsutenkaku", nameJa: "通天閣",
    area: "tennoji_shinsekai", categories: ["culture", "family"],
    latitude: 34.6525393, longitude: 135.5063098,
    geoSource: osm("way/254319878", wd("Q1148463", 40)), mainImage: placeholder,
  },
  {
    id: "abeno-harukas", slug: "abeno-harukas", name: "Abeno Harukas", nameJa: "あべのハルカス",
    area: "tennoji_shinsekai", categories: ["shopping", "family"],
    latitude: 34.6457685, longitude: 135.5140068,
    geoSource: osm("way/187296989", wd("Q16318627", 31)), mainImage: placeholder,
  },
  // Osaka Bay
  {
    id: "universal-studios-japan", slug: "universal-studios-japan", name: "Universal Studios Japan", nameJa: "ユニバーサル・スタジオ・ジャパン",
    area: "osaka_bay", categories: ["family"],
    latitude: 34.6656393, longitude: 135.4324527,
    geoSource: osm("relation/5695002", wd("Q1375103", 116)), mainImage: placeholder,
  },
  {
    id: "osaka-aquarium-kaiyukan", slug: "osaka-aquarium-kaiyukan", name: "Osaka Aquarium Kaiyukan", nameJa: "海遊館",
    area: "osaka_bay", categories: ["family"],
    latitude: 34.65447222, longitude: 135.42888889,
    geoSource: {
      kind: "wikidata",
      ref: "Q1191885",
      checkedAt: CHECKED,
      crossCheck: { kind: "openstreetmap", ref: "node/4260333992", distanceMeters: 89 },
      note: "OSM has no named aquarium feature; cross-checked with the aquarium ticket office node",
    },
    mainImage: placeholder,
  },
  // Suita / Expo
  {
    id: "expo-70-commemorative-park", slug: "expo-70-commemorative-park", name: "Expo '70 Commemorative Park", nameJa: "万博記念公園",
    area: "suita_expo", categories: ["nature", "family", "culture"],
    latitude: 34.812017, longitude: 135.5301934,
    geoSource: osm("relation/10576976", wd("Q4817249", 317), "Park centroid; both sources fall inside the park"),
    mainImage: placeholder,
  },
  // Minoh
  {
    id: "minoh-falls", slug: "minoh-falls", name: "Minoh Falls", nameJa: "箕面大滝",
    area: "minoh", categories: ["nature"],
    latitude: 34.8538872, longitude: 135.4719727,
    geoSource: osm("node/962963605", wd("Q11603215", 3)), mainImage: placeholder,
  },
  {
    id: "katsuoji", slug: "katsuoji", name: "Katsuo-ji", nameJa: "勝尾寺",
    area: "minoh", categories: ["culture", "nature"],
    latitude: 34.8656228, longitude: 135.4922571,
    geoSource: osm("way/641161666", wd("Q2747522", 107)), mainImage: placeholder,
  },
];

const AREA_LABELS: Record<SelectAreaKey, string> = {
  kita_umeda: "Kita / Umeda",
  central_osaka: "Central Osaka",
  osaka_castle: "Osaka Castle",
  minami_namba: "Minami / Namba",
  tennoji_shinsekai: "Tennoji / Shinsekai",
  osaka_bay: "Osaka Bay",
  suita_expo: "Suita / Expo",
  minoh: "Minoh",
};

export function getConnectripSelectOsakaViewModel(): ConnectripSelectViewModel {
  return {
    route: "connectripSelect",
    seo: pageSeo("Connectrip Select Osaka", routeHref("connectripSelect")),
    content: {
      eyebrow: proposed("CONNECTRIP SELECT", DECISION),
      heading: proposed("Explore Osaka", PROTOTYPE),
      areaName: proposed("Osaka", DECISION),
      description: proposed("Osaka's must-see places, picked by locals. Tap a pin to take a look.", PROTOTYPE),
      note: proposed("Every pin sits on the real location. More places are on the way.", PROTOTYPE),
      areas: Object.fromEntries(
        Object.entries(AREA_LABELS).map(([k, v]) => [k, proposed(v, PROTOTYPE)]),
      ) as ConnectripSelectViewModel["content"]["areas"],
      categories: [
        { key: "food", label: proposed("Food", PROTOTYPE) },
        { key: "culture", label: proposed("Culture", PROTOTYPE) },
        { key: "nature", label: proposed("Nature", PROTOTYPE) },
        { key: "shopping", label: proposed("Shopping", PROTOTYPE) },
        { key: "family", label: proposed("Family", PROTOTYPE) },
      ],
      spots: SPOTS,
      // Illustrated map geometry is simplified from OpenStreetMap data (ODbL).
      attribution: { text: "Map data © OpenStreetMap contributors", url: "https://www.openstreetmap.org/copyright" },
    },
  };
}
