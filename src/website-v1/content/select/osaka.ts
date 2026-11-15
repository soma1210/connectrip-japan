import type { ConnectripSelectViewModel, SelectAreaKey } from "@/contracts";
import { routeHref } from "../../routes";
import { selectSpotSectionHref } from "../explore/links";
import { pageSeo, proposed } from "../shared";
import { OSAKA_SPOTS } from "../spots/osaka";

/**
 * Connectrip Japan Select — Osaka map (Explore Kansai, `/explore/map/osaka`).
 * Was "Connectrip Select" at `/connectrip-select/osaka` (v0.1 prototype).
 *
 * Spots come from the shared spot master (content/spots/osaka.ts): 16 map
 * spots plus the 4 added for the Osaka 10 article. Spots featured in a Select
 * article carry a link to their section there (`guide`, shown in the popup).
 * Categories are a simple prototype classification, not a decision.
 */
const DECISION = "Connectrip Select (W1-D17)";
const PROTOTYPE = "Connectrip Select v0.1 prototype data";
const MAP_COPY = "Explore Kansai map (2026-11-14). Copy PROPOSED";

const AREA_LABELS: Record<SelectAreaKey, string> = {
  kita_umeda: "Kita / Umeda",
  central_osaka: "Central Osaka",
  osaka_castle: "Osaka Castle",
  minami_namba: "Minami / Namba",
  tennoji_shinsekai: "Tennoji / Shinsekai",
  osaka_bay: "Osaka Bay",
  suita_expo: "Suita / Expo",
  minoh: "Minoh",
  sumiyoshi: "Sumiyoshi",
};

export function getConnectripSelectOsakaViewModel(): ConnectripSelectViewModel {
  return {
    route: "connectripSelect",
    seo: pageSeo("Osaka Map", routeHref("connectripSelect")),
    content: {
      eyebrow: proposed("CONNECTRIP JAPAN SELECT", DECISION),
      heading: proposed("Osaka Map", MAP_COPY),
      areaName: proposed("Osaka", DECISION),
      description: proposed("Places in Osaka picked by Connectrip Japan. Tap a pin to see the place, then read more in our Osaka guide.", MAP_COPY),
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
      spots: OSAKA_SPOTS.map(({ details, ...spot }) => {
        void details;
        const href = selectSpotSectionHref(spot.id);
        return href ? { ...spot, guide: { href: href.href, label: href.label } } : spot;
      }),
      // Illustrated map geometry is simplified from OpenStreetMap data (ODbL).
      attribution: { text: "Map data © OpenStreetMap contributors", url: "https://www.openstreetmap.org/copyright" },
    },
  };
}

/** In-article map: the same map data, limited to the article's places (in page order). */
export function getArticleMapContent(spotIds: string[]): ConnectripSelectViewModel["content"] {
  const content = getConnectripSelectOsakaViewModel().content;
  const spots = spotIds.map((id) => content.spots.find((s) => s.id === id)).filter((s): s is (typeof content.spots)[number] => Boolean(s));
  return { ...content, spots };
}
