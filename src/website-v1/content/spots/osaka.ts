import type { GeoSource, ImageAsset, SelectSpot } from "@/contracts";
import { proposed, tbd } from "../shared";

/**
 * Osaka spot master (2026-11-14): the one record per place shared by the
 * Connectrip Japan Select map (`/explore/map/osaka`) and the Select articles.
 * Id, slug, English / Japanese name, area, coordinates and photo live here
 * only; articles add their own text by spot id (content/explore/select.ts).
 *
 * Coordinates: never estimated. Each one comes from OpenStreetMap
 * (Nominatim, the feature named in `ref`) or Wikidata (P625), and was
 * cross-checked against the other source where both exist (16 spots on
 * 2026-10-24, the 4 Select additions on 2026-11-14).
 * Names: "Kuromon Ichiba Market" and "Katsuoji Temple" unified with the
 * articles on 2026-11-14 (ids and slugs unchanged, so `?spot=` links keep working).
 */
const CHECKED = "2026-10-24";

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
/**
 * Six photos supplied for the Osaka 10 article on 2026-11-15 (WebP, metadata
 * stripped, public/images/v1/spots/osaka/). Photographer, source and licence
 * are not recorded: rights and consent stay NOT_VERIFIED until a person confirms them.
 */
const SUPPLIED_SOURCE = "Photo supplied 2026-11-15; photographer, source and licence not confirmed. Rights NOT_VERIFIED, preview only";
const supplied = (file: string, alt: string, width: number, height: number, view?: Pick<ImageAsset, "position" | "frame">) =>
  proposed({ ...photo(`/images/v1/spots/osaka/${file}`, alt, width, height), ...view }, SUPPLIED_SOURCE);

const CHECKED_SELECT = "2026-11-14";
const osm2 = (ref: string, cross?: GeoSource["crossCheck"], note?: string): GeoSource => ({
  kind: "openstreetmap",
  ref,
  checkedAt: CHECKED_SELECT,
  ...(cross ? { crossCheck: cross } : {}),
  ...(note ? { note } : {}),
});


const BASE_SPOTS: SelectSpot[] = [
  // Kita / Umeda
  {
    id: "umeda-sky-building", slug: "umeda-sky-building", name: "Umeda Sky Building", nameJa: "梅田スカイビル",
    area: "kita_umeda", categories: ["culture"],
    latitude: 34.7052927, longitude: 135.4905349,
    geoSource: osm("relation/3389505", wd("Q1151808", 74)),
    mainImage: supplied("umeda-sky-building.webp", "The long escalator rising through the glass-and-steel arched tube of the Umeda Sky Building", 2000, 1125),
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
    mainImage: proposed(photo("/images/v1/hero/osaka/osaka-castle.jpg", "Osaka Castle main tower above its stone walls", 1706, 960), PHOTO_SOURCE),
  },
  // Minami / Namba
  {
    id: "dotonbori", slug: "dotonbori", name: "Dotonbori", nameJa: "道頓堀",
    area: "minami_namba", categories: ["food", "shopping"],
    latitude: 34.6690306, longitude: 135.5015715,
    geoSource: osm("node/4029007869", wd("Q964876", 43)),
    mainImage: proposed(photo("/images/v1/hero/osaka/osaka-dotonbori.jpg", "Dotonbori canal at night with illuminated signs", 1307, 1599), PHOTO_SOURCE),
  },
  {
    id: "shinsaibashi", slug: "shinsaibashi", name: "Shinsaibashi", nameJa: "心斎橋",
    area: "minami_namba", categories: ["shopping", "food"],
    latitude: 34.6706744, longitude: 135.5013256,
    geoSource: osm("way/895630634", wd("Q1049109", 236), "Shinsaibashi-suji shopping street (Wikidata point is the wider district)"),
    mainImage: placeholder,
  },
  {
    id: "kuromon-market", slug: "kuromon-market", name: "Kuromon Ichiba Market", nameJa: "黒門市場",
    area: "minami_namba", categories: ["food"],
    latitude: 34.6653277, longitude: 135.5069795,
    geoSource: osm("node/4161997589", wd("Q10855506", 0)),
    mainImage: supplied("kuromon-market.webp", "A giant red Kuromon lantern hanging over the busy covered arcade of Kuromon Ichiba Market", 2000, 1333),
  },
  {
    id: "namba-yasaka-shrine", slug: "namba-yasaka-shrine", name: "Namba Yasaka Shrine", nameJa: "難波八阪神社",
    area: "minami_namba", categories: ["culture"],
    latitude: 34.6614819, longitude: 135.4967325,
    geoSource: osm("way/637023828", wd("Q11659527", 29)),
    mainImage: supplied("namba-yasaka-shrine.webp", "The giant lion-head stage (Shishiden) of Namba Yasaka Shrine with its open mouth", 1200, 1600, { frame: "natural" }),
  },
  // Tennoji / Shinsekai
  {
    id: "shinsekai", slug: "shinsekai", name: "Shinsekai", nameJa: "新世界",
    area: "tennoji_shinsekai", categories: ["food", "culture"],
    latitude: 34.6520901, longitude: 135.5061908,
    geoSource: osm("node/4190308689", undefined, "Wikipedia reuses the Tsutenkaku coordinate for the district; OSM has a separate Shinsekai point"), mainImage: proposed(photo("/images/v1/hero/osaka/osaka-shinsekai-day.jpg", "Shinsekai street with Tsutenkaku Tower and shop signs", 2400, 1595), PHOTO_SOURCE),
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
    id: "katsuoji", slug: "katsuoji", name: "Katsuoji Temple", nameJa: "勝尾寺",
    area: "minoh", categories: ["culture", "nature"],
    latitude: 34.8656228, longitude: 135.4922571,
    geoSource: osm("way/641161666", wd("Q2747522", 107)),
    mainImage: supplied("katsuoji.webp", "Rows of red victory daruma dolls marked with the character for winning at Katsuoji Temple", 2000, 1333),
  },

  // Added 2026-11-14 for Connectrip Japan Select (Osaka 10). Same rule: never estimated.
  {
    id: "sumiyoshi-taisha", slug: "sumiyoshi-taisha", name: "Sumiyoshi Taisha Shrine", nameJa: "住吉大社",
    area: "sumiyoshi", categories: ["culture"],
    latitude: 34.6130027, longitude: 135.4931012,
    geoSource: osm2("way/186423245", wd("Q705949", 56)),
    mainImage: supplied("sumiyoshi-taisha.webp", "The red arched Sorihashi bridge of Sumiyoshi Taisha reflected in the pond among green trees", 1080, 1350, { position: "50% 67%" }),
  },
  {
    id: "osaka-tenmangu", slug: "osaka-tenmangu", name: "Osaka Tenmangu Shrine", nameJa: "大阪天満宮",
    area: "kita_umeda", categories: ["culture"],
    latitude: 34.6960904, longitude: 135.5127654,
    geoSource: osm2("way/363304259", wd("Q385793", 15)),
    mainImage: proposed(photo("/images/v1/experiences/osaka-tenmangu-gate.webp", "The main gate of Osaka Tenmangu Shrine under a blue sky", 1536, 1024), PHOTO_SOURCE),
  },
  {
    id: "tenjinbashisuji", slug: "tenjinbashisuji", name: "Tenjinbashisuji Shopping Street", nameJa: "天神橋筋商店街",
    area: "kita_umeda", categories: ["shopping", "food"],
    latitude: 34.6981211, longitude: 135.5116901,
    geoSource: osm2("way/1560586483", undefined, "The street is about 2.6 km long: pin on its Tenjinbashi 2-chome section next to Osaka Tenmangu. Wikidata (Q11234561) has no coordinate"),
    mainImage: placeholder,
  },
  {
    id: "shitennoji", slug: "shitennoji", name: "Shitennoji Temple", nameJa: "四天王寺",
    area: "tennoji_shinsekai", categories: ["culture"],
    latitude: 34.6547194, longitude: 135.5167979,
    geoSource: osm2("way/579077537", wd("Q339859", 96)),
    mainImage: supplied("shitennoji.webp", "The five-storey pagoda of Shitennoji Temple under a blue sky", 1080, 1350, { frame: "natural" }),
  },
];

export type Source = { name: string; url: string };

/** Article-level facts about a place, shared wherever the place is described. */
export type SpotDetails = {
  /** Ward / city, from OpenStreetMap address data (2026-11-14). */
  locality: string;
  official: Source;
  /** Nearest stations as given on the place's official access page. */
  access?: { text: string; source: Source; checkedAt: string };
};

const DETAILS: Record<string, SpotDetails> = {
  katsuoji: { locality: "Minoh City, Osaka Prefecture", official: { name: "Katsuoji Temple (official website)", url: "https://katsuo-ji-temple.or.jp/" } },
  "namba-yasaka-shrine": { locality: "Naniwa Ward, Osaka City", official: { name: "Namba Yasaka Shrine (official website)", url: "https://nambayasaka.jp/" } },
  "sumiyoshi-taisha": { locality: "Sumiyoshi Ward, Osaka City", official: { name: "Sumiyoshi Taisha (official website)", url: "https://sumiyoshitaisha.net/" } },
  "osaka-tenmangu": { locality: "Kita Ward, Osaka City", official: { name: "Osaka Tenmangu (official website)", url: "https://osakatemmangu.or.jp/" } },
  dotonbori: {
    locality: "Chuo Ward, Osaka City",
    official: { name: "Dotonbori Shopping Association (official website)", url: "https://www.dotonbori.or.jp/" },
    access: {
      text: "Nippombashi Station (Osaka Metro Sakaisuji and Sennichimae lines), Exit 2, right outside; or Namba Station (Osaka Metro Midosuji, Yotsubashi and Sennichimae lines), Exit 14.",
      source: { name: "Dotonbori Shopping Association: Access", url: "https://www.dotonbori.or.jp/ja/access/index.html" },
      checkedAt: CHECKED_SELECT,
    },
  },
  "kuromon-market": {
    locality: "Chuo Ward, Osaka City",
    official: { name: "Kuromon Ichiba Market (official website)", url: "https://kuromon.com/jp/" },
    access: {
      text: "Nippombashi Station (Osaka Metro Sennichimae Line), Exit 10, about 5 minutes on foot.",
      source: { name: "Kuromon Ichiba Market: Access", url: "https://kuromon.com/jp/access/" },
      checkedAt: CHECKED_SELECT,
    },
  },
  shinsekai: {
    locality: "Naniwa Ward, Osaka City",
    official: { name: "Tsutenkaku Tower (official website)", url: "https://www.tsutenkaku.co.jp/" },
    access: {
      text: "For Tsutenkaku Tower: Ebisucho Station (Osaka Metro Sakaisuji Line), Exit 3, 3 minutes on foot; or Dobutsuen-mae Station (Osaka Metro Midosuji Line), Exit 1, 6 minutes.",
      source: { name: "Tsutenkaku Tower: Access", url: "https://www.tsutenkaku.co.jp/access/index.html" },
      checkedAt: CHECKED_SELECT,
    },
  },
  tenjinbashisuji: { locality: "Kita Ward, Osaka City", official: { name: "Tenjinbashisuji Shopping Street, 1–3 chome (official website)", url: "https://www.tenjin123.com/" } },
  "osaka-castle": {
    locality: "Chuo Ward, Osaka City",
    official: { name: "Osaka Castle Main Tower (official website)", url: "https://www.osakacastle.net/" },
    access: {
      text: "Tanimachi 4-chome Station (Osaka Metro Tanimachi Line Exit 1-B, Chuo Line Exit 9), Tenmabashi Station (Tanimachi Line, Exit 3) or Morinomiya Station (Chuo and Nagahori Tsurumi-ryokuchi lines).",
      source: { name: "Osaka Castle Main Tower: Access", url: "https://www.osakacastle.net/access/" },
      checkedAt: CHECKED_SELECT,
    },
  },
  "umeda-sky-building": {
    locality: "Kita Ward, Osaka City",
    official: { name: "Umeda Sky Building / Kuchu Teien Observatory (official website)", url: "https://www.skybldg.co.jp/en/" },
    access: {
      text: "JR Osaka Station (Central North Exit), Osaka Metro Midosuji Line Umeda Station (North Ticket Gate), or Hankyu Osaka Umeda Station (Chaya-machi Exit), connected via Grand Front Osaka and the underground walkway.",
      source: { name: "Umeda Sky Building: Access", url: "https://www.skybldg.co.jp/en/access/" },
      checkedAt: CHECKED_SELECT,
    },
  },
  shitennoji: { locality: "Tennoji Ward, Osaka City", official: { name: "Shitennoji Temple (official website)", url: "https://www.shitennoji.or.jp/" } },
};

export type OsakaSpot = SelectSpot & { details?: SpotDetails };

/** Every Osaka spot (map pins). */
export const OSAKA_SPOTS: OsakaSpot[] = BASE_SPOTS.map((s) => ({ ...s, ...(DETAILS[s.id] ? { details: DETAILS[s.id] } : {}) }));

export function osakaSpot(id: string): OsakaSpot {
  const spot = OSAKA_SPOTS.find((s) => s.id === id);
  if (!spot) throw new Error(`Unknown Osaka spot "${id}"`);
  return spot;
}

/** The spot's photo when one is set (rights still to be checked on the asset). */
export function spotPhoto(spot: SelectSpot): ImageAsset | null {
  return spot.mainImage.status === "TBD" ? null : spot.mainImage.value;
}
